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
    const unsubscribe = onAuthChange((user: User | null) => {
      setCheckingAuth(false);
      if (!user) {
        // If no user, check if we're in pre-signup flow
        const tempUserId = sessionStorage.getItem("tempUserId_coach");
        if (!tempUserId) {
          // Redirect to get-started if no temp user ID
          router.push("/get-started");
        }
      } else {
        setUser(user);
      }
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

  // Use user ID if authenticated, otherwise use temp ID from sessionStorage
  const userId = user?.uid || sessionStorage.getItem("tempUserId_coach") || `temp_${Date.now()}`;
  if (!user && !sessionStorage.getItem("tempUserId_coach")) {
    sessionStorage.setItem("tempUserId_coach", userId);
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      
      {/* Background decorative elements */}
      <div className="fixed inset-0 gradient-mesh opacity-30 pointer-events-none" />
      <div className="fixed top-40 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 pt-20">
        <CoachOnboarding currentStep={step} userId={userId} isPreSignup={!user} />
      </div>
      
      <Footer />
    </div>
  );
}
