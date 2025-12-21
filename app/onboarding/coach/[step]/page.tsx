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

  useEffect(() => {
    const unsubscribe = onAuthChange((user: User | null) => {
      if (!user) {
        router.push("/auth?role=coach");
      } else {
        setUser(user);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return <CoachOnboarding currentStep={step} userId={user.uid} />;
}
