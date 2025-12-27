"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithGoogle, signUpWithEmail, onAuthChange } from "@/lib/firebase/auth";
import { createUserData, createStudentData, createCoachData, getUserData } from "@/lib/firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/config";
import { User } from "firebase/auth";
import { GlowButton } from "@/components/ui/GlowButton";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";

// Google Icon SVG Component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

interface OnboardingSignupProps {
  role: "student" | "coach";
}

export function OnboardingSignup({ role }: OnboardingSignupProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (user) {
        try {
          // Get onboarding data from sessionStorage
          const tempUserId = sessionStorage.getItem(`tempUserId_${role}`);
          const onboardingDataKey = `onboardingData_${role}`;
          const onboardingDataStr = sessionStorage.getItem(onboardingDataKey);
          
          if (!onboardingDataStr) {
            setError("Onboarding data not found. Please start over.");
            setLoading(false);
            return;
          }

          const onboardingData = JSON.parse(onboardingDataStr);

          // Get name from onboarding data or form
          let fullName = user.displayName || "";
          if (!fullName && role === "coach" && onboardingData.coachData) {
            // Coach data has displayName (firstName + lastName)
            fullName = onboardingData.coachData.displayName || `${firstName} ${lastName}`.trim();
          } else if (!fullName) {
            fullName = `${firstName} ${lastName}`.trim();
          }

          // Create user document
          await createUserData(user.uid, {
            email: user.email || email,
            displayName: fullName,
            photoURL: user.photoURL || undefined,
            role: role,
            onboardingCompleted: true,
          });

          // Create student or coach data with onboarding information
          if (role === "student" && onboardingData.studentData) {
            await createStudentData(user.uid, onboardingData.studentData);
          } else if (role === "coach" && onboardingData.coachData) {
            const coachData = { ...onboardingData.coachData };
            
            // Handle file uploads if they exist
            if (coachData.profilePhotoFile && storage) {
              try {
                const file = base64ToFile(coachData.profilePhotoFile, "profile.jpg");
                const storageRef = ref(storage, `coaches/${user.uid}/avatar`);
                await uploadBytes(storageRef, file);
                coachData.avatarUrl = await getDownloadURL(storageRef);
              } catch (error) {
                console.error("Error uploading profile photo:", error);
              }
              delete coachData.profilePhotoFile;
            }
            
            if (coachData.introVideoFile && storage) {
              try {
                const file = base64ToFile(coachData.introVideoFile, "intro-video.mp4");
                const storageRef = ref(storage, `coaches/${user.uid}/intro-video`);
                await uploadBytes(storageRef, file);
                coachData.introVideoUrl = await getDownloadURL(storageRef);
              } catch (error) {
                console.error("Error uploading intro video:", error);
              }
              delete coachData.introVideoFile;
            }
            
            await createCoachData(user.uid, coachData);
          }

          // Clean up sessionStorage
          sessionStorage.removeItem(`tempUserId_${role}`);
          sessionStorage.removeItem(onboardingDataKey);
          sessionStorage.removeItem("onboardingRole");

          // Redirect to dashboard
          router.push(`/app/${role}/dashboard`);
        } catch (error: any) {
          console.error("Error saving onboarding data:", error);
          setError("Failed to save your information. Please try again.");
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [role, router, email, firstName, lastName]);

  const handleEmailSignup = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const displayName = `${firstName} ${lastName}`.trim();
      await signUpWithEmail(email, password, displayName);
      // onAuthChange will handle the redirect and data saving
    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = "Failed to create account. Please try again.";
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered. Please sign in instead.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
      // onAuthChange will handle the redirect and data saving
    } catch (error: any) {
      console.error("Google signup error:", error);
      setError(error.message || "Failed to sign up with Google. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      
      {/* Background decorative elements */}
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      <div className="absolute top-40 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-40 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 min-h-[calc(100vh-80px)] flex items-center justify-center py-20 px-4">
        <div className="max-w-2xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-[var(--card)] border border-gray-800 rounded-2xl p-10 shadow-2xl"
          >
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">Create Your Account</h1>
              <p className="text-gray-400 text-lg md:text-xl">
                You&apos;re almost done! Create your account to save your information and get started.
              </p>
            </div>

            <div className="space-y-5 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-medium mb-2 text-gray-300">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full px-5 py-4 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEmailSignup();
                    }}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-base font-medium mb-2 text-gray-300">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-5 py-4 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleEmailSignup();
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-base font-medium mb-2 text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-5 py-4 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEmailSignup();
                  }}
                />
              </div>
              <div>
                <label className="block text-base font-medium mb-2 text-gray-300">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-4 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white text-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEmailSignup();
                  }}
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <GlowButton
              variant="primary"
              size="lg"
              className="w-full mb-6 text-lg py-4"
              onClick={handleEmailSignup}
              disabled={loading || !email || !password || !firstName || !lastName}
            >
              {loading ? "Creating account..." : "Create Account"}
            </GlowButton>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[var(--card)] text-gray-400">Or continue with</span>
              </div>
            </div>

            {/* Google Sign Up Button */}
            <button
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white text-lg hover:bg-gray-700/50 hover:border-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GoogleIcon />
              <span className="font-medium">Sign up with Google</span>
            </button>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

// Helper to convert base64 back to File
function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}


