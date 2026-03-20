const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const crypto = require('crypto');

initializeApp();
const db = getFirestore();

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Generates a license key in ND4J-XXXX-XXXX-XXXX format.
 * Uses crypto.randomBytes for unpredictable output.
 */
function createLicenseKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/1/O/0 to avoid confusion
  const bytes = crypto.randomBytes(12);
  const segments = [];

  for (let s = 0; s < 3; s++) {
    let segment = '';
    for (let i = 0; i < 4; i++) {
      segment += chars[bytes[s * 4 + i] % chars.length];
    }
    segments.push(segment);
  }

  return `ND4J-${segments.join('-')}`;
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

exports.generateLicenseKey = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'You must be logged in to generate a license key.'
    );
  }

  const uid = request.auth.uid;
  const email = request.auth.token.email || null;

  // Enforce one license per user
  const existing = await db
    .collection('licenses')
    .where('uid', '==', uid)
    .limit(1)
    .get();

  if (!existing.empty) {
    throw new HttpsError(
      'already-exists',
      'You already have a license key.'
    );
  }

  const key = createLicenseKey();

  await db.collection('licenses').doc(key).set({
    key,
    uid,
    email,
    status: 'active',
    boundIps: [],
    createdAt: FieldValue.serverTimestamp(),
  });

  return { key };
});

// ── revealLicenseKey ──────────────────────────────────────────────────────────

exports.revealLicenseKey = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'You must be logged in to reveal your license key.'
    );
  }

  const uid = request.auth.uid;

  const snapshot = await db
    .collection('licenses')
    .where('uid', '==', uid)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new HttpsError(
      'not-found',
      'No license key found for this account.'
    );
  }

  return { key: snapshot.docs[0].data().key };
});

// ── resetLicenseIps ───────────────────────────────────────────────────────────

exports.resetLicenseIps = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'You must be logged in to reset your license.'
    );
  }

  const uid = request.auth.uid;

  const snapshot = await db
    .collection('licenses')
    .where('uid', '==', uid)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new HttpsError(
      'not-found',
      'No license key found for this account.'
    );
  }

  await snapshot.docs[0].ref.update({ boundIps: [] });

  return { message: 'Bound IPs have been cleared.' };
});

// ── getLicenseInfo ─────────────────────────────────────────────────────────────

exports.getLicenseInfo = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'You must be logged in to view license info.'
    );
  }

  const uid = request.auth.uid;

  const snapshot = await db
    .collection('licenses')
    .where('uid', '==', uid)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return { hasLicense: false };
  }

  const data = snapshot.docs[0].data();

  return {
    hasLicense: true,
    email: data.email,
    status: data.status,
    boundIps: data.boundIps,
    createdAt: data.createdAt?.toMillis() || null,
  };
});