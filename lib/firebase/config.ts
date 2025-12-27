import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, Analytics } from "firebase/analytics";

// Firebase client config - these values are safe to expose publicly
// Security is handled by Firebase Security Rules and domain restrictions
const firebaseConfig = {
  apiKey: "AIzaSyCiJaNpyvQGJf2_1F5Qat1-ynoB9ClmU5o",
  authDomain: "coachify-21435.firebaseapp.com",
  projectId: "coachify-21435",
  storageBucket: "coachify-21435.firebasestorage.app",
  messagingSenderId: "274999680644",
  appId: "1:274999680644:web:2d09f4b311573322f4acd1",
  measurementId: "G-8D9MWSN2KH",
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let analytics: Analytics | null = null;

// Initialize Firebase for both client and server
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    
    // Analytics only works on client side
    if (typeof window !== "undefined") {
      try {
        analytics = getAnalytics(app);
      } catch (error) {
        // Analytics might fail in development, that's okay
        console.warn("Analytics initialization failed:", error);
      }
    }
  } else {
    app = getApps()[0];
  }
  
  if (app) {
    // Auth only works on client side
    if (typeof window !== "undefined") {
      auth = getAuth(app);
    }
    // Firestore works on both client and server
    db = getFirestore(app);
    // Storage works on both client and server
    storage = getStorage(app);
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { app, auth, db, storage, analytics };


