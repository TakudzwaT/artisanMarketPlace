import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBDHqeHNqMos7aNX7w-f6DnSkh8arcojQc",
  authDomain: "ecommerce-48526.firebaseapp.com",
  projectId: "ecommerce-48526",
  storageBucket: "ecommerce-48526.firebasestorage.app",
  messagingSenderId: "454692976914",
  appId: "1:454692976914:web:14bcfe973e74b79ecc1bcb"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();