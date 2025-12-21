"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithGoogle, signUpWithEmail, signInWithEmail, onAuthChange } from "@/lib/firebase/auth";
import { getUserData, createUserData } from "@/lib/firebase/firestore";
import { User } from "firebase/auth";
import { GlowButton } from "@/components/ui/GlowButton";
import { GradientCard } from "@/components/ui/GradientCard";
import { motion } from "framer-motion";

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "signup"; // signup or signin
  const roleParam = searchParams.get("role");
  const [selectedRole, setSelectedRole] = useState<"student" | "coach" | null>(
    roleParam === "coach" ? "coach" : roleParam === "student" ? "student" : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<"google" | "email">("google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (user) {
        try {
          // Check if user data exists
          const userData = await getUserData(user.uid);
          
          if (!userData) {
            // New user (signin without account OR new signup) - create user data with selected role
            // For signin mode, default to student if no role selected
            const roleToUse = selectedRole || (mode === "signin" ? "student" : null);
            
            if (!roleToUse && mode === "signup") {
              setError("Please select a role");
              setLoading(false);
              return;
            }
            
            try {
              await createUserData(user.uid, {
                email: user.email || "",
                displayName: user.displayName || displayName || "",
                photoURL: user.photoURL || undefined,
                role: roleToUse || "student",
                onboardingCompleted: false,
              });
              
              // Redirect to onboarding
              router.push(`/onboarding/${roleToUse || "student"}/1`);
            } catch (createError: any) {
              console.error("Error creating user data:", createError);
              if (createError.code === "permission-denied" || createError.message?.includes("permission")) {
                setError(
                  "Firestore security rules not deployed. Please deploy firestore.rules using: firebase deploy --only firestore:rules"
                );
              } else {
                setError("Failed to create account. Please try again.");
              }
              setLoading(false);
            }
          } else {
            // Existing user - route based on onboarding status
            if (userData.onboardingCompleted) {
              router.push(`/app/${userData.role}/dashboard`);
            } else {
              router.push(`/onboarding/${userData.role}/1`);
            }
          }
        } catch (fetchError: any) {
          console.error("Error fetching user data:", fetchError);
          // If it's a permissions error, show helpful message
          if (fetchError.code === "permission-denied" || fetchError.message?.includes("permission")) {
            setError(
              "Firestore security rules not deployed. Please deploy firestore.rules using: firebase deploy --only firestore:rules"
            );
          } else {
            setError("Failed to load user data. Please try again.");
          }
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [router, selectedRole, mode, displayName]);

  const handleAuth = async () => {
    // For signup, require role selection
    if (mode === "signup" && !selectedRole) {
      setError("Please select a role first");
      return;
    }

    // For email auth, validate fields
    if (authMethod === "email") {
      if (!email || !password) {
        setError("Please enter email and password");
        return;
      }
      if (mode === "signup" && !displayName.trim()) {
        setError("Please enter your name");
        return;
      }
    }

    setLoading(true);
    setError(null);
    
    try {
      if (authMethod === "google") {
        await signInWithGoogle();
      } else {
        if (mode === "signup") {
          await signUpWithEmail(email, password, displayName);
        } else {
          await signInWithEmail(email, password);
        }
      }
      // onAuthChange will handle the redirect
    } catch (error: any) {
      console.error("Auth error:", error);
      let errorMessage = "Failed to authenticate. Please try again.";
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered. Please sign in instead.";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email. Please sign up first.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again.";
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

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <GradientCard gradient="blue-purple" glow>
          <h1 className="text-3xl font-bold text-center mb-2">
            {mode === "signup" ? "Create an Account" : "Sign In"}
          </h1>
          <p className="text-gray-400 text-center mb-8">
            {mode === "signup" 
              ? "Choose your role and get started" 
              : "Welcome back to Coachify"}
          </p>

          {/* Role Selection - Required for signup, optional for signin */}
          {mode === "signup" && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">
                I want to:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setSelectedRole("student");
                    setError(null);
                  }}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${selectedRole === "student"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-600 hover:border-gray-500"
                    }
                  `}
                >
                  <div className="text-2xl mb-2">👨‍🎓</div>
                  <div className="font-semibold">Learn</div>
                  <div className="text-xs text-gray-400">As a Student</div>
                </button>
                <button
                  onClick={() => {
                    setSelectedRole("coach");
                    setError(null);
                  }}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${selectedRole === "coach"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-600 hover:border-gray-500"
                    }
                  `}
                >
                  <div className="text-2xl mb-2">🏋️</div>
                  <div className="font-semibold">Teach</div>
                  <div className="text-xs text-gray-400">As a Coach</div>
                </button>
              </div>
            </div>
          )}

          {/* Role Selection for signin (optional) */}
          {mode === "signin" && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3 text-gray-400">
                Sign in as (optional):
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedRole("student")}
                  className={`
                    p-3 rounded-lg border-2 transition-all text-sm
                    ${selectedRole === "student"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-600 hover:border-gray-500"
                    }
                  `}
                >
                  <div className="text-xl mb-1">👨‍🎓</div>
                  <div className="font-semibold">Student</div>
                </button>
                <button
                  onClick={() => setSelectedRole("coach")}
                  className={`
                    p-3 rounded-lg border-2 transition-all text-sm
                    ${selectedRole === "coach"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-600 hover:border-gray-500"
                    }
                  `}
                >
                  <div className="text-xl mb-1">🏋️</div>
                  <div className="font-semibold">Coach</div>
                </button>
              </div>
            </div>
          )}

          {/* Auth Method Toggle */}
          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => {
                  setAuthMethod("google");
                  setError(null);
                }}
                className={`
                  flex-1 px-4 py-2 rounded-lg border-2 transition-all text-sm
                  ${authMethod === "google"
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-gray-600 text-gray-400 hover:border-gray-500"
                  }
                `}
              >
                Google
              </button>
              <button
                onClick={() => {
                  setAuthMethod("email");
                  setError(null);
                }}
                className={`
                  flex-1 px-4 py-2 rounded-lg border-2 transition-all text-sm
                  ${authMethod === "email"
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-gray-600 text-gray-400 hover:border-gray-500"
                  }
                `}
              >
                Email
              </button>
            </div>

            {/* Email/Password Form */}
            {authMethod === "email" && (
              <div className="space-y-4">
                {mode === "signup" && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <GlowButton
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleAuth}
            disabled={loading || (mode === "signup" && !selectedRole) || (authMethod === "email" && (!email || !password || (mode === "signup" && !displayName)))}
          >
            {loading 
              ? (mode === "signup" ? "Creating account..." : "Signing in...") 
              : authMethod === "google" 
                ? "Continue with Google"
                : mode === "signup"
                  ? "Create Account"
                  : "Sign In"}
          </GlowButton>

          {mode === "signin" && (
            <p className="text-center mt-4 text-sm">
              Don&apos;t have an account?{" "}
              <button
                onClick={() => router.push("/auth?mode=signup")}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Sign up
              </button>
            </p>
          )}

          {mode === "signup" && (
            <p className="text-center mt-4 text-sm">
              Already have an account?{" "}
              <button
                onClick={() => router.push("/auth?mode=signin")}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Sign in
              </button>
            </p>
          )}

          <p className="text-xs text-gray-500 text-center mt-4">
            By continuing, you agree to our Terms and Privacy Policy
          </p>
        </GradientCard>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}
