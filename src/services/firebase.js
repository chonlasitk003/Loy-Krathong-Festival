import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration from environment or direct fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDYh5HD37mbWORX4IFsBojFBoJup_joezA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "loy-krathong-festival-e9bc7.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "loy-krathong-festival-e9bc7",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "loy-krathong-festival-e9bc7.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "564952077950",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:564952077950:web:d60de41ca47c9f0c536a2f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-T1F24FWLD6"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Cloud Firestore
export const db = getFirestore(app);

export default app;
