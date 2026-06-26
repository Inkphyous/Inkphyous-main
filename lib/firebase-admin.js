import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getAuth } from "firebase-admin/auth";

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Handle newline characters in the private key properly
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://inkphyous-a1027-default-rtdb.firebaseio.com",
    });
  } catch (error) {
    console.error("Firebase admin initialization error", error.stack);
  }
}

export const adminDb = new Proxy({}, {
  get: (target, prop) => {
    const db = getDatabase();
    return typeof db[prop] === 'function' ? db[prop].bind(db) : db[prop];
  }
});
export const adminAuth = new Proxy({}, {
  get: (target, prop) => {
    const auth = getAuth();
    return typeof auth[prop] === 'function' ? auth[prop].bind(auth) : auth[prop];
  }
});
