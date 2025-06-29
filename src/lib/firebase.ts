import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { env } from "@/lib/env";

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Runtime check for Firebase config to provide a better error message.
const missingConfig = Object.entries(firebaseConfig).filter(([, value]) => !value);
if (missingConfig.length > 0) {
    const missingKeys = missingConfig.map(([key]) => key).join(', ');
    throw new Error(`Firebase configuration is missing the following keys: ${missingKeys}. Please check your .env file and ensure it is loaded correctly.`);
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
const microsoftProvider = new OAuthProvider('microsoft.com');


// Enable offline persistence
try {
    enableIndexedDbPersistence(db)
        .catch((err) => {
            if (err.code == 'failed-precondition') {
                console.warn("Firestore offline persistence failed: multiple tabs open.");
            } else if (err.code == 'unimplemented') {
                console.warn("Firestore offline persistence failed: browser not supported.");
            }
        });
} catch (error) {
    console.error("Error enabling Firestore offline persistence", error);
}

export { db, auth, storage, googleProvider, microsoftProvider };
