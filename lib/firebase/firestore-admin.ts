/**
 * Server-side Firestore operations using Firebase Admin SDK
 * These functions bypass security rules and should only be used in API routes
 */

import { getAdminDb } from "./admin";
import type { CoachData, UserData } from "./firestore";

// Convert Firestore Timestamp to admin Timestamp
import { Timestamp as AdminTimestamp } from "firebase-admin/firestore";

export const getCoachDataAdmin = async (coachId: string): Promise<CoachData | null> => {
  const adminDb = getAdminDb();
  if (!adminDb) {
    const errorMsg = "Firebase Admin is not initialized. Check that FIREBASE_SERVICE_ACCOUNT_KEY is set in environment variables.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const docRef = adminDb.collection("coaches").doc(coachId);
  const docSnap = await docRef.get();
  
  if (docSnap.exists) {
    return docSnap.data() as CoachData;
  }
  return null;
};

export const updateCoachDataAdmin = async (coachId: string, data: Partial<CoachData>): Promise<void> => {
  const adminDb = getAdminDb();
  if (!adminDb) {
    throw new Error("Firebase Admin is not initialized");
  }

  const docRef = adminDb.collection("coaches").doc(coachId);
  await docRef.update({
    ...data,
    updatedAt: AdminTimestamp.now(),
  });
};

export const getUserDataAdmin = async (uid: string): Promise<UserData | null> => {
  const adminDb = getAdminDb();
  if (!adminDb) {
    const errorMsg = "Firebase Admin is not initialized. Check that FIREBASE_SERVICE_ACCOUNT_KEY is set in environment variables.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const docRef = adminDb.collection("users").doc(uid);
  const docSnap = await docRef.get();
  
  if (docSnap.exists) {
    return docSnap.data() as UserData;
  }
  return null;
};



