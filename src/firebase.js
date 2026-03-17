import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyASiAv6riKcR8gFPt3SLET8As-l86GfQA0',
  authDomain: 'nodriver4j.firebaseapp.com',
  projectId: 'nodriver4j',
  storageBucket: 'nodriver4j.firebasestorage.app',
  messagingSenderId: '1014885074223',
  appId: '1:1014885074223:web:1f835b464e3a87827f4dda',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();