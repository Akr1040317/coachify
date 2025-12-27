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
    // Try popup first (preferred method for desktop)
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    // If popup is blocked, closed, or fails, fall back to redirect
    if (
      error.code === 'auth/popup-blocked' || 
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request' ||
      error.message?.includes('popup')
    ) {
      console.log("Popup blocked or failed, falling back to redirect flow");
      try {
        await signInWithRedirect(auth, googleProvider);
        // The redirect will happen, so we throw a special error to indicate this
        throw new Error('REDIRECT_INITIATED');
      } catch (redirectError: any) {
        // If redirect also fails, throw the original error
        if (redirectError.message === 'REDIRECT_INITIATED') {
          throw redirectError;
        }
        throw new Error(`Sign-in failed: ${error.message || error.code || 'Unknown error'}`);
      }
    }
    // Re-throw other errors with better messages
    if (error.code) {
      const errorMessages: { [key: string]: string } = {
        'auth/network-request-failed': 'Network error. Please check your connection and try again.',
        'auth/too-many-requests': 'Too many sign-in attempts. Please try again later.',
        'auth/invalid-credential': 'Invalid credentials. Please try again.',
      };
      throw new Error(errorMessages[error.code] || error.message || 'Sign-in failed. Please try again.');
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
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return null;
    }
    
    // getRedirectResult should be called immediately on page load
    // It will return null if there's no pending redirect result
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      return result.user;
    }
    return null;
  } catch (error: any) {
    console.error("Error handling redirect result:", error);
    
    // Re-throw auth errors so they can be handled by the caller
    if (error.code && error.code.startsWith('auth/')) {
      // Provide user-friendly error messages
      const errorMessages: { [key: string]: string } = {
        'auth/network-request-failed': 'Network error during sign-in. Please try again.',
        'auth/too-many-requests': 'Too many sign-in attempts. Please try again later.',
        'auth/invalid-credential': 'Invalid credentials. Please try again.',
        'auth/popup-closed-by-user': 'Sign-in was cancelled.',
      };
      
      const friendlyMessage = errorMessages[error.code] || error.message || 'Sign-in failed. Please try again.';
      const enhancedError = new Error(friendlyMessage);
      (enhancedError as any).code = error.code;
      throw enhancedError;
    }
    
    // For non-auth errors, return null (no redirect result)
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



