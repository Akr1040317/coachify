import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminApp: App | undefined;
let adminDb: Firestore | undefined;

// Initialize Firebase Admin SDK for server-side operations
function getAdminApp(): App | undefined {
  if (adminApp) {
    return adminApp;
  }

  // Check if already initialized
  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  // Initialize with service account or application default credentials
  try {
    // Try to use service account from environment variable (for production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        // Parse JSON - handle whitespace/newlines
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
        const serviceAccount = JSON.parse(serviceAccountKey);
        
        // Validate required fields
        if (!serviceAccount.private_key || !serviceAccount.client_email) {
          throw new Error("Service account JSON is missing required fields (private_key or client_email)");
        }
        
        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: "coachify-21435",
        });
        
        console.log("Firebase Admin initialized with service account");
        return adminApp;
      } catch (parseError: any) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", parseError.message);
        console.error("Key length:", process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.length);
        throw parseError;
      }
    } else {
      // Use application default credentials
      // In Vercel, this will work if Firebase is configured
      // For local development, set GOOGLE_APPLICATION_CREDENTIALS or use service account
      console.log("Initializing Firebase Admin without service account (using default credentials)");
      adminApp = initializeApp({
        projectId: "coachify-21435",
      });
      return adminApp;
    }
  } catch (error: any) {
    console.error("Failed to initialize Firebase Admin:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    return undefined;
  }
}

function getAdminDb(): Firestore | undefined {
  if (adminDb) {
    return adminDb;
  }

  const app = getAdminApp();
  if (!app) {
    return undefined;
  }

  adminDb = getFirestore(app);
  return adminDb;
}

export { getAdminApp, getAdminDb };
