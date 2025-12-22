"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { CoachOnboarding } from "@/components/onboarding/CoachOnboarding";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function CoachOnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const step = parseInt(params.step as string) || 1;
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Require authentication for all onboarding steps
    const unsubscribe = onAuthChange((user: User | null) => {
      setCheckingAuth(false);
      if (!user) {
        // No user - redirect to get-started to sign up first
        router.push("/get-started");
        return;
      }
      
      setUser(user);
      // User is authenticated - they can proceed with onboarding
    });

    return () => unsubscribe();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  // Validate step is within range (1-6)
  const totalSteps = 6;
  if (step < 1 || step > totalSteps) {
    // Invalid step, redirect to step 1
    router.push("/onboarding/coach/1");
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Redirecting...</div>
      </div>
    );
  }

  // Require user to be authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Redirecting to signup...</div>
      </div>
    );
  }

  const userId = user.uid;

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Navbar />
      
      {/* Background decorative elements */}
      <div className="fixed inset-0 gradient-mesh opacity-30 pointer-events-none" />
      <div className="fixed top-40 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex-1 flex items-center justify-center pt-20">
        <CoachOnboarding currentStep={step} userId={userId} isPreSignup={false} />
      </div>
      
      <Footer />
    </div>
  );
}

