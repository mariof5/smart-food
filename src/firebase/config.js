// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBnlgR7js7e3UbIybEreL2R7huTAR52o64",
  authDomain: "smartfood-app-b25f1.firebaseapp.com",
  projectId: "smartfood-app-b25f1",
  storageBucket: "smartfood-app-b25f1.firebasestorage.app",
  messagingSenderId: "640404258364",
  appId: "1:640404258364:web:fa9e23447fb77bd964cd39",
  measurementId: "G-983G27ZFGR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;