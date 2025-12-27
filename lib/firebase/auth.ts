import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
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

// Set custom parameters for Google OAuth
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogle = async (): Promise<User> => {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized");
  }
  
  try {
    // Try popup first
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    // If popup is blocked or fails, fall back to redirect
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
      await signInWithRedirect(auth, googleProvider);
      // The redirect will happen, so we throw a special error to indicate this
      throw new Error('REDIRECT_INITIATED');
    }
    throw error;
  }
};

// Handle redirect result when user returns from OAuth redirect
export const handleGoogleRedirect = async (): Promise<User | null> => {
  if (!auth) {
    return null;
  }
  
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      return result.user;
    }
    return null;
  } catch (error) {
    console.error("Error handling redirect result:", error);
    return null;
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



