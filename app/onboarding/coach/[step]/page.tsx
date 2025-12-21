"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { CoachOnboarding } from "@/components/onboarding/CoachOnboarding";

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

  return <CoachOnboarding currentStep={step} userId={userId} isPreSignup={!user} />;
}
