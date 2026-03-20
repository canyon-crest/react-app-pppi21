const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();
const db = getFirestore();

// ── Keygen Helpers ────────────────────────────────────────────────────────────

const KEYGEN_BASE = 'https://api.keygen.sh/v1/accounts';

/**
 * Makes an authenticated request to the Keygen API.
 * All license operations go through this helper.
 */
async function keygenRequest(path, options = {}) {
  const accountId = process.env.KEYGEN_ACCOUNT_ID;
  const token = process.env.KEYGEN_PRODUCT_TOKEN;
  const url = `${KEYGEN_BASE}/${accountId}${path}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json',
    },
    ...options,
  });

  // DELETE returns 204 No Content
  if (response.status === 204) return null;

  const body = await response.json();

  if (!response.ok) {
    const detail = body.errors?.[0]?.detail || 'Keygen API error';
    const code = body.errors?.[0]?.code || 'UNKNOWN';
    throw new Error(`Keygen [${code}]: ${detail}`);
  }

  return body;
}

/**
 * Finds the Keygen license associated with a Firebase UID.
 * Uses a Firestore mapping doc (licenseMappings/{uid}) to get the Keygen
 * license ID, then fetches the full license from Keygen by ID.
 * Returns the license data object or null if none exists.
 */
async function findLicenseByUid(uid) {
  const mappingDoc = await db.collection('licenseMappings').doc(uid).get();

  if (!mappingDoc.exists) return null;

  const { keygenLicenseId } = mappingDoc.data();
  const body = await keygenRequest(`/licenses/${keygenLicenseId}`);

  return body.data || null;
}

/**
 * Fetches all machines (devices) attached to a license.
 */
async function getMachinesForLicense(licenseId) {
  const body = await keygenRequest(`/licenses/${licenseId}/machines`);
  return body.data || [];
}

// ── setAdminClaim ─────────────────────────────────────────────────────────────

exports.setAdminClaim = onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    throw new HttpsError(
      'permission-denied',
      'Only admins can grant admin privileges.'
    );
  }

  const { uid } = request.data;

  if (!uid || typeof uid !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      'A valid uid string must be provided.'
    );
  }

  await getAuth().setCustomUserClaims(uid, { admin: true });
  return { message: `Admin claim granted to UID: ${uid}` };
});

// ── generateLicenseKey ────────────────────────────────────────────────────────

exports.generateLicenseKey = onCall(
  { secrets: ['KEYGEN_PRODUCT_TOKEN'] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'You must be logged in to generate a license key.'
      );
    }

    const uid = request.auth.uid;
    const email = request.auth.token.email || '';

    // Enforce one license per user via Firestore mapping
    const mappingDoc = await db.collection('licenseMappings').doc(uid).get();
    if (mappingDoc.exists) {
      throw new HttpsError(
        'already-exists',
        'You already have a license key.'
      );
    }

    const policyId = process.env.KEYGEN_POLICY_ID;

    const body = await keygenRequest('/licenses', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          type: 'licenses',
          attributes: {
            name: email || uid,
          },
          relationships: {
            policy: {
              data: { type: 'policies', id: policyId },
            },
          },
        },
      }),
    });

    const keygenLicenseId = body.data.id;

    // Store the mapping in Firestore for future lookups
    await db.collection('licenseMappings').doc(uid).set({
      keygenLicenseId,
      email,
    });

    return { key: body.data.attributes.key };
  }
);

// ── getLicenseInfo ─────────────────────────────────────────────────────────────

exports.getLicenseInfo = onCall(
  { secrets: ['KEYGEN_PRODUCT_TOKEN'] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'You must be logged in to view license info.'
      );
    }

    const uid = request.auth.uid;
    const license = await findLicenseByUid(uid);

    if (!license) {
      return { hasLicense: false };
    }

    const mappingDoc = await db.collection('licenseMappings').doc(uid).get();
    const machines = await getMachinesForLicense(license.id);

    return {
      hasLicense: true,
      email: mappingDoc.data()?.email || null,
      status: license.attributes.status,
      expiry: license.attributes.expiry,
      maxMachines: license.attributes.maxMachines,
      machines: machines.map((m) => ({
        id: m.id,
        name: m.attributes.name || null,
        fingerprint: m.attributes.fingerprint,
        ip: m.attributes.ip || null,
        created: m.attributes.created,
      })),
      createdAt: license.attributes.created,
    };
  }
);

// ── revealLicenseKey ──────────────────────────────────────────────────────────

exports.revealLicenseKey = onCall(
  { secrets: ['KEYGEN_PRODUCT_TOKEN'] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'You must be logged in to reveal your license key.'
      );
    }

    const license = await findLicenseByUid(request.auth.uid);

    if (!license) {
      throw new HttpsError(
        'not-found',
        'No license key found for this account.'
      );
    }

    return { key: license.attributes.key };
  }
);

// ── resetLicenseMachines ──────────────────────────────────────────────────────

exports.resetLicenseMachines = onCall(
  { secrets: ['KEYGEN_PRODUCT_TOKEN'] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'You must be logged in to reset your license.'
      );
    }

    const license = await findLicenseByUid(request.auth.uid);

    if (!license) {
      throw new HttpsError(
        'not-found',
        'No license key found for this account.'
      );
    }

    const machines = await getMachinesForLicense(license.id);

    // Deactivate all machines in parallel
    await Promise.all(
      machines.map((m) =>
        keygenRequest(`/machines/${m.id}`, { method: 'DELETE' })
      )
    );

    return { message: `${machines.length} machine(s) deactivated.` };
  }
);