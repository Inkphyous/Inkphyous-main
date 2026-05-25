import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "inkphyous-a1027.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: "inkphyous-a1027",
  storageBucket: "inkphyous-a1027.firebasestorage.app",
  messagingSenderId: "344029907498",
  appId: "1:344029907498:web:4b605ef0933aa2922f1153",
  measurementId: "G-LGWWT1C5QG"
};

// Initialize Firebase only if it hasn't been initialized yet (handles Next.js HMR)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getDatabase(app);

export { app, auth, googleProvider, db };
