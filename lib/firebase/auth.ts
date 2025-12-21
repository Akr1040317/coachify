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

export const signInWithGoogle = async (): Promise<User> => {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized");
  }
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
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
