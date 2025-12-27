"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { StudentOnboarding } from "@/components/onboarding/StudentOnboarding";
import { CoachOnboarding } from "@/components/onboarding/CoachOnboarding";
import { OnboardingSignup } from "@/components/onboarding/OnboardingSignup";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

function OnboardingPageContent() {
  const params = useParams();
  const router = useRouter();
  const role = params.role as "student" | "coach";
  const step = parseInt(params.step as string) || 1;
  
  // Check if we have onboarding data in sessionStorage
  const [onboardingData, setOnboardingData] = useState<any>(null);

  useEffect(() => {
    // Get role from sessionStorage if available
    const storedRole = sessionStorage.getItem("onboardingRole");
    if (storedRole && storedRole !== role) {
      router.push(`/onboarding/${storedRole}/1`);
      return;
    }
    
    // Load onboarding data from sessionStorage
    const data = sessionStorage.getItem(`onboardingData_${role}`);
    if (data) {
      setOnboardingData(JSON.parse(data));
    }
  }, [role, router]);

  // If it's the last step (step 9 for student, step 9 for coach), show signup
  const totalSteps = role === "student" ? 8 : 8;
  const isSignupStep = step > totalSteps;

  if (isSignupStep) {
    return <OnboardingSignup role={role} />;
  }

  // For onboarding steps, use a temporary userId stored in sessionStorage
  const tempUserId = sessionStorage.getItem(`tempUserId_${role}`) || `temp_${Date.now()}`;
  if (!sessionStorage.getItem(`tempUserId_${role}`)) {
    sessionStorage.setItem(`tempUserId_${role}`, tempUserId);
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      
      {/* Background decorative elements */}
      <div className="fixed inset-0 gradient-mesh opacity-30 pointer-events-none" />
      <div className="fixed top-40 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 pt-20">
        {role === "student" ? (
          <StudentOnboarding currentStep={step} userId={tempUserId} isPreSignup={true} />
        ) : (
          <CoachOnboarding currentStep={step} userId={tempUserId} isPreSignup={true} />
        )}
      </div>
      
      <Footer />
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    }>
      <OnboardingPageContent />
    </Suspense>
  );
}

