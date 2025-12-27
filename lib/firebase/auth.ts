import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  NextOrObserver,
  updateProfile
} from "firebase/auth";
import { auth } from "./config";

const googleProvider = new GoogleAuthProvider();

// Set custom parameters to prevent redirect fallback
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogle = async (): Promise<User> => {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized");
  }
  
  try {
    // Try popup first - this will stay on the same page
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    // If popup is blocked, throw a user-friendly error instead of falling back to redirect
    if (
      error.code === 'auth/popup-blocked' || 
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request'
    ) {
      throw new Error('Popup was blocked. Please allow popups for this site and try again.');
    }
    // Re-throw other errors
    throw error;
  }
};

export const signUpWithEmail = async (
  email: string, 
  password: string, 
  displayName?: string
): Promise<User> => {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized");
  }
  const result = await createUserWithEmailAndPassword(auth, email, password);
  
  // Update display name if provided
  if (displayName && result.user) {
    await updateProfile(result.user, { displayName });
  }
  
  return result.user;
};

export const signInWithEmail = async (
  email: string, 
  password: string
): Promise<User> => {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized");
  }
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const signOut = async (): Promise<void> => {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized");
  }
  await firebaseSignOut(auth);
};

export const onAuthChange = (callback: NextOrObserver<User | null>) => {
  if (!auth) {
    // Return a no-op unsubscribe function if auth isn't initialized
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

export { auth };



