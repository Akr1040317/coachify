import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  User,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  NextOrObserver
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
