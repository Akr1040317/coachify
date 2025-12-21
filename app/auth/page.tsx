"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithGoogle, signUpWithEmail, signInWithEmail, onAuthChange } from "@/lib/firebase/auth";
import { getUserData, createUserData } from "@/lib/firebase/firestore";
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
            // New user signing in - redirect to get-started
            if (mode === "signin") {
              router.push("/get-started");
              setLoading(false);
              return;
            }
            
            // New user signing up directly (shouldn't happen often, but handle it)
            const roleToUse = selectedRole || "student";
            
            try {
              await createUserData(user.uid, {
                email: user.email || "",
                displayName: user.displayName || displayName || "",
                photoURL: user.photoURL || undefined,
                role: roleToUse,
                onboardingCompleted: false,
              });
              
              // Redirect to onboarding
              router.push(`/onboarding/${roleToUse}/1`);
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

  const handleEmailAuth = async () => {
    // For signup, require role selection
    if (mode === "signup" && !selectedRole) {
      setError("Please select a role first");
      return;
    }

    // Validate fields
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    if (mode === "signup" && !displayName.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      if (mode === "signup") {
        await signUpWithEmail(email, password, displayName);
      } else {
        await signInWithEmail(email, password);
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

  const handleGoogleAuth = async () => {
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
      setError(error.message || "Failed to sign in with Google. Please try again.");
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
      
      <div className="relative z-10 min-h-[calc(100vh-80px)] flex items-center py-20 px-4">
        <div className="max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            {/* Left side - Branding/Info */}
            <div className="hidden lg:block">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                  {mode === "signup" 
                    ? "Join Coachify Today" 
                    : "Welcome Back"}
                </h1>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  {mode === "signup"
                    ? "Connect with expert coaches, access premium courses, and take your game to the next level. Join thousands of athletes already improving with Coachify."
                    : "Continue your journey with personalized coaching, expert courses, and 1-on-1 sessions tailored to your goals."}
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-400 text-sm">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-200">Verified Coaches</p>
                      <p className="text-sm text-gray-400">Learn from certified professionals</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-400 text-sm">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-200">Flexible Learning</p>
                      <p className="text-sm text-gray-400">Courses and sessions on your schedule</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-orange-400 text-sm">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-200">Track Progress</p>
                      <p className="text-sm text-gray-400">Monitor your improvement over time</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right side - Auth Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full max-w-lg mx-auto lg:mx-0"
            >
              <div className="bg-[var(--card)] border border-gray-800 rounded-2xl p-8 shadow-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">
                    {mode === "signup" ? "Create an Account" : "Sign In"}
                  </h2>
                  <p className="text-gray-400">
                    {mode === "signup" 
                      ? "Get started with Coachify" 
                      : "Sign in to your account"}
                  </p>
                </div>

                {/* Role Selection - Required for signup */}
                {mode === "signup" && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-3 text-gray-300">
                      I want to:
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setSelectedRole("student");
                          setError(null);
                        }}
                        className={`
                          p-4 rounded-xl border-2 transition-all duration-200
                          ${selectedRole === "student"
                            ? "border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20"
                            : "border-gray-600 hover:border-gray-500 bg-[var(--background)]"
                          }
                        `}
                      >
                        <div className="text-2xl mb-2">👨‍🎓</div>
                        <div className="font-semibold text-sm">Learn</div>
                        <div className="text-xs text-gray-400 mt-1">As a Student</div>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRole("coach");
                          setError(null);
                        }}
                        className={`
                          p-4 rounded-xl border-2 transition-all duration-200
                          ${selectedRole === "coach"
                            ? "border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20"
                            : "border-gray-600 hover:border-gray-500 bg-[var(--background)]"
                          }
                        `}
                      >
                        <div className="text-2xl mb-2">🏋️</div>
                        <div className="font-semibold text-sm">Teach</div>
                        <div className="text-xs text-gray-400 mt-1">As a Coach</div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Email/Password Form */}
                <div className="space-y-4 mb-6">
                  {mode === "signup" && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 bg-[var(--background)] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleEmailAuth();
                        }}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 bg-[var(--background)] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleEmailAuth();
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-[var(--background)] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleEmailAuth();
                      }}
                    />
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Primary Email/Password Button */}
                <GlowButton
                  variant="primary"
                  size="lg"
                  className="w-full mb-4"
                  onClick={handleEmailAuth}
                  disabled={loading || (mode === "signup" && !selectedRole) || !email || !password || (mode === "signup" && !displayName)}
                >
                  {loading 
                    ? (mode === "signup" ? "Creating account..." : "Signing in...") 
                    : mode === "signup"
                      ? "Create Account"
                      : "Sign In"}
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

                {/* Google Sign In Button */}
                <button
                  onClick={handleGoogleAuth}
                  disabled={loading || (mode === "signup" && !selectedRole)}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[var(--background)] border border-gray-600 rounded-lg text-white hover:bg-gray-700/50 hover:border-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <GoogleIcon />
                  <span className="font-medium">
                    {mode === "signup" ? "Sign up with Google" : "Sign in with Google"}
                  </span>
                </button>

                {/* Toggle between signin/signup */}
                <div className="mt-6 text-center">
                  {mode === "signin" ? (
                    <p className="text-sm text-gray-400">
                      Don&apos;t have an account?{" "}
                      <button
                        onClick={() => {
                          router.push("/auth?mode=signup");
                          setError(null);
                        }}
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        Sign up
                      </button>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400">
                      Already have an account?{" "}
                      <button
                        onClick={() => {
                          router.push("/auth?mode=signin");
                          setError(null);
                        }}
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                      >
                        Sign in
                      </button>
                    </p>
                  )}
                </div>

                {/* Terms */}
                <p className="text-xs text-gray-500 text-center mt-6">
                  By continuing, you agree to our{" "}
                  <a href="#" className="text-blue-400 hover:underline">Terms</a> and{" "}
                  <a href="#" className="text-blue-400 hover:underline">Privacy Policy</a>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
      
      <Footer />
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
