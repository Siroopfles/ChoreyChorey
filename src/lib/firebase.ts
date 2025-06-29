import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCzZ1xucTPlspcWMlqXsPebyq6AaLmY8_c",
  authDomain: "chorey-15s2w.firebaseapp.com",
  projectId: "chorey-15s2w",
  storageBucket: "chorey-15s2w.appspot.com",
  messagingSenderId: "270880422233",
  appId: "1:270880422233:web:d463ded50065113a477448",
};

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
