"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { GlowButton } from "@/components/ui/GlowButton";
import { signInWithGoogle, signUpWithEmail, onAuthChange } from "@/lib/firebase/auth";
import { createUserData, getUserData } from "@/lib/firebase/firestore";
import { User } from "firebase/auth";

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

const CoachContent = () => (
  <div className="space-y-8">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
        Start Your Coaching Journey
      </h1>
      <p className="text-xl text-gray-300 mb-8 leading-relaxed">
        Join thousands of coaches who are transforming athletes&apos; lives through personalized online coaching.
      </p>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-6"
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl">💰</div>
        <div>
          <h3 className="text-xl font-semibold mb-2 text-white">Earn on Your Terms</h3>
          <p className="text-gray-400">
            Set your own rates and schedule. Get paid directly for your expertise and time.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="text-3xl">🌍</div>
        <div>
          <h3 className="text-xl font-semibold mb-2 text-white">Reach Athletes Worldwide</h3>
          <p className="text-gray-400">
            Connect with students globally through our online platform. No geographical limits.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="text-3xl">📚</div>
        <div>
          <h3 className="text-xl font-semibold mb-2 text-white">Create & Sell Courses</h3>
          <p className="text-gray-400">
            Build comprehensive courses, share your knowledge, and generate passive income.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="text-3xl">⭐</div>
        <div>
          <h3 className="text-xl font-semibold mb-2 text-white">Build Your Reputation</h3>
          <p className="text-gray-400">
            Get verified, collect reviews, and establish yourself as a trusted coaching professional.
          </p>
        </div>
      </div>
    </motion.div>

    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="pt-8 border-t border-gray-700"
    >
      <p className="text-gray-400 italic">
        &quot;Coachify has transformed how I coach. I&apos;ve doubled my income while helping more athletes than ever before.&quot;
      </p>
      <p className="text-gray-500 text-sm mt-2">— Professional Coach</p>
    </motion.div>
  </div>
);

const StudentContent = () => (
  <div className="space-y-8">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
        Unlock Your Potential
      </h1>
      <p className="text-xl text-gray-300 mb-8 leading-relaxed">
        Connect with world-class coaches, access personalized training, and take your skills to the next level.
      </p>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-6"
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl">🎯</div>
        <div>
          <h3 className="text-xl font-semibold mb-2 text-white">Personalized Coaching</h3>
          <p className="text-gray-400">
            Get one-on-one sessions tailored to your goals, skill level, and learning style.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="text-3xl">📖</div>
        <div>
          <h3 className="text-xl font-semibold mb-2 text-white">Access Expert Courses</h3>
          <p className="text-gray-400">
            Learn from verified coaches through comprehensive courses designed for your sport.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="text-3xl">🔄</div>
        <div>
          <h3 className="text-xl font-semibold mb-2 text-white">Flexible Scheduling</h3>
          <p className="text-gray-400">
            Book sessions that fit your schedule. Online coaching means training from anywhere.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="text-3xl">🏆</div>
        <div>
          <h3 className="text-xl font-semibold mb-2 text-white">Track Your Progress</h3>
          <p className="text-gray-400">
            Monitor your improvement, set goals, and celebrate milestones with your coach.
          </p>
        </div>
      </div>
    </motion.div>

    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="pt-8 border-t border-gray-700"
    >
      <p className="text-gray-400 italic">
        &quot;I found the perfect coach on Coachify. My game has improved dramatically in just a few months!&quot;
      </p>
      <p className="text-gray-500 text-sm mt-2">— Student Athlete</p>
    </motion.div>
  </div>
);

export default function SignupPage() {
  const params = useParams();
  const router = useRouter();
  const role = params.role as "student" | "coach";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Validate role
  useEffect(() => {
    if (role !== "student" && role !== "coach") {
      router.push("/get-started");
    }
  }, [role, router]);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (user) {
        try {
          // Check if user document exists
          let userData = await getUserData(user.uid);
          
          if (!userData) {
            // Create user document with role
            // Name will be collected during onboarding
            const displayName = user.displayName || user.email?.split("@")[0] || "User";
            await createUserData(user.uid, {
              email: user.email || email,
              displayName: displayName,
              photoURL: user.photoURL || undefined,
              role: role,
              onboardingCompleted: false,
            });
          } else {
            // User document exists - check if they've completed onboarding
            if (userData.onboardingCompleted) {
              // Already completed onboarding - go to dashboard
              router.push(`/app/${userData.role}/dashboard`);
              return;
            }
            
            // Update role if it's different (shouldn't happen, but handle it)
            if (userData.role !== role) {
              setError("This account is already registered as a " + userData.role + ". Please sign in instead.");
              setLoading(false);
              return;
            }
          }
          
          // Redirect to onboarding
          router.push(`/onboarding/${role}/1`);
        } catch (error: any) {
          console.error("Error setting up user:", error);
          setError("Failed to set up your account. Please try again.");
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [role, router, email]);

  const handleEmailSignup = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use email username as display name temporarily - will be updated during onboarding
      const displayName = email.split("@")[0];
      await signUpWithEmail(email, password, displayName);
      // onAuthChange will handle the redirect
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
      // onAuthChange will handle the redirect
    } catch (error: any) {
      console.error("Google signup error:", error);
      setError(error.message || "Failed to sign up with Google. Please try again.");
      setLoading(false);
    }
  };

  if (role !== "student" && role !== "coach") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      
      {/* Background decorative elements */}
      <div className="fixed inset-0 gradient-mesh opacity-30 pointer-events-none" />
      <div className="fixed top-40 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-40 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 min-h-[calc(100vh-80px)] flex items-center py-20 px-4">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Marketing Content */}
            <div className="hidden lg:block">
              {role === "coach" ? <CoachContent /> : <StudentContent />}
            </div>

            {/* Right Side - Signup Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md mx-auto lg:mx-0"
            >
              <div className="bg-[var(--card)] border border-gray-800 rounded-2xl p-8 shadow-2xl">
                {/* Mobile: Show condensed content */}
                <div className="lg:hidden mb-6 text-center">
                  <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                    {role === "coach" ? "Start Your Coaching Journey" : "Unlock Your Potential"}
                  </h2>
                  <p className="text-gray-400">
                    {role === "coach" 
                      ? "Join thousands of coaches transforming athletes' lives"
                      : "Connect with world-class coaches and take your skills to the next level"}
                  </p>
                </div>

                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2 text-white">Create Your Account</h2>
                  <p className="text-gray-400">
                    Sign up to continue as a {role === "coach" ? "coach" : "student"}
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      autoFocus
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
                      className="w-full px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                  className="w-full mb-4"
                  onClick={handleEmailSignup}
                  disabled={loading || !email || !password}
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
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white hover:bg-gray-700/50 hover:border-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <GoogleIcon />
                  <span className="font-medium">Sign up with Google</span>
                </button>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-400">
                    Already have an account?{" "}
                    <button
                      onClick={() => router.push("/auth")}
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
