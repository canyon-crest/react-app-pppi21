const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Download this from Firebase Console → Project Settings → Service Accounts
// NEVER commit this file to git
const serviceAccount = require('./service-account-key.json');

const uid = process.argv[2];

if (!uid) {
  console.error('Usage: node scripts/setAdmin.js <uid>');
  console.error('Find your UID in Firebase Console → Authentication → Users');
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount),
});

async function main() {
  await getAuth().setCustomUserClaims(uid, { admin: true });
  console.log(`✅ Admin claim set for UID: ${uid}`);
  console.log('The user must log out and back in for the claim to take effect.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error setting admin claim:', err);
  process.exit(1);
});