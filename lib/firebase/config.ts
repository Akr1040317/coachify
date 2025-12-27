import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";

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
let analyticsInitialized = false;

// Initialize Firebase for both client and server
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    
    // Analytics initialization is deferred - will be initialized lazily if supported
    // This prevents IndexedDB errors in unsupported environments
  } else {
    app = getApps()[0];
  }
  
  if (app) {
    // Auth only works on client side
    if (typeof window !== "undefined") {
      auth = getAuth(app);
      
      // Initialize analytics lazily on client side, checking support first
      if (!analyticsInitialized) {
        analyticsInitialized = true;
        isSupported().then((supported) => {
          if (supported && app) {
            try {
              analytics = getAnalytics(app);
            } catch (error) {
              // Silently fail - analytics is optional
            }
          }
        }).catch(() => {
          // Silently fail if check fails - analytics is optional
        });
      }
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




