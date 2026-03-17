const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

initializeApp();

exports.setAdminClaim = onCall(async (request) => {
  // Only existing admins can grant admin privileges
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