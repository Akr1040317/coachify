"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { StudentOnboarding } from "@/components/onboarding/StudentOnboarding";

export default function StudentOnboardingPage() {
  const params = useParams();
  const router = useRouter();
  const step = parseInt(params.step as string) || 1;
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((user: User | null) => {
      if (!user) {
        router.push("/auth?role=student");
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

  return <StudentOnboarding currentStep={step} userId={user.uid} />;
}
