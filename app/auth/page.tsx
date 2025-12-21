"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithGoogle, onAuthChange } from "@/lib/firebase/auth";
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

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (user) {
        try {
          // Check if user data exists
          const userData = await getUserData(user.uid);
          
          if (!userData) {
            // New user - create user data with selected role
            if (!selectedRole) {
              setError("Please select a role");
              setLoading(false);
              return;
            }
            
            try {
              await createUserData(user.uid, {
                email: user.email || "",
                displayName: user.displayName || "",
                photoURL: user.photoURL || undefined,
                role: selectedRole,
                onboardingCompleted: false,
              });
              
              // Redirect to onboarding
              router.push(`/onboarding/${selectedRole}/1`);
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
  }, [router, selectedRole]);

  const handleAuth = async () => {
    // For signup, require role selection
    if (mode === "signup" && !selectedRole) {
      setError("Please select a role first");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await signInWithGoogle();
      // onAuthChange will handle the redirect
    } catch (error: any) {
      console.error("Auth error:", error);
      setError(error.message || "Failed to sign in. Please try again.");
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
            disabled={loading || (mode === "signup" && !selectedRole)}
          >
            {loading 
              ? (mode === "signup" ? "Creating account..." : "Signing in...") 
              : "Continue with Google"}
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
