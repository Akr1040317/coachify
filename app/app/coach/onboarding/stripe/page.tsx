"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { StripeOnboardingSteps } from "@/components/coach/StripeOnboardingSteps";

type ViewState = "education" | "loading" | "success" | "incomplete" | "pending" | "error";

export default function StripeOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingUp, setSettingUp] = useState(false);
  const [viewState, setViewState] = useState<ViewState>("education");
  const [accountStatus, setAccountStatus] = useState<{
    hasAccount: boolean;
    status: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (user) {
        setUser(user);
        await checkAccountStatus(user.uid);
      } else {
        router.push("/auth");
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    // Check if returning from Stripe
    const stripeParam = searchParams.get("stripe");
    const refreshParam = searchParams.get("refresh");

    if (stripeParam === "success" || refreshParam === "true") {
      if (user) {
        checkAccountStatus(user.uid);
      }
    }
  }, [searchParams, user]);

  const checkAccountStatus = async (coachId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/coaches/stripe-connect/onboarding?coachId=${coachId}`);
      const data = await response.json();
      
      setAccountStatus(data);
      
      // Determine view state based on status
      if (data.status === "active" && data.chargesEnabled && data.payoutsEnabled) {
        setViewState("success");
      } else if (data.hasAccount && data.status === "pending") {
        setViewState("pending");
      } else if (data.hasAccount && !data.chargesEnabled && !data.payoutsEnabled) {
        setViewState("incomplete");
      } else if (!data.hasAccount) {
        setViewState("education");
      } else {
        setViewState("incomplete");
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error checking account status:", error);
      setViewState("error");
      setErrorMessage("Failed to check account status. Please try again.");
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    if (!user) return;

    setSettingUp(true);
    setErrorMessage(null);
    
    try {
      // Check if account exists, if not create one
      if (!accountStatus?.hasAccount) {
        const createResponse = await fetch("/api/coaches/stripe-connect/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ coachId: user.uid }),
        });

        if (!createResponse.ok) {
          const error = await createResponse.json();
          throw new Error(error.error || "Failed to create Stripe account");
        }

        const createData = await createResponse.json();
        if (createData.onboardingUrl) {
          window.location.href = createData.onboardingUrl;
          return;
        }
      }

      // Generate onboarding link
      const response = await fetch("/api/coaches/stripe-connect/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coachId: user.uid }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate onboarding link");
      }

      const data = await response.json();
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      }
    } catch (error: any) {
      console.error("Error setting up Stripe:", error);
      setErrorMessage(error.message || "Failed to set up Stripe Connect");
      setSettingUp(false);
      setViewState("error");
    }
  };

  const handleSkip = () => {
    router.push("/app/coach/dashboard");
  };

  if (loading && viewState === "education") {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  // Success State
  if (viewState === "success") {
    return (
      <div className="min-h-screen bg-[var(--background)] p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <GradientCard className="p-8 lg:p-12 border-green-500/30">
            <div className="text-center space-y-6">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Payment Account Connected!</h2>
              <p className="text-gray-400 text-lg mb-8">
                Your Stripe account is set up and ready. You&apos;ll receive weekly payouts every Monday for your earnings.
              </p>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-white mb-2">What&apos;s Next?</h3>
                <ul className="text-left space-y-2 text-gray-300 text-sm">
                  <li>✓ Create courses and offerings to start earning</li>
                  <li>✓ View your revenue dashboard to track earnings</li>
                  <li>✓ Receive weekly payouts every Monday</li>
                </ul>
              </div>
              <GlowButton variant="primary" size="lg" onClick={() => router.push("/app/coach/dashboard")}>
                Go to Dashboard
              </GlowButton>
            </div>
          </GradientCard>
        </div>
      </div>
    );
  }

  // Pending Review State
  if (viewState === "pending") {
    return (
      <div className="min-h-screen bg-[var(--background)] p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <GradientCard className="p-8 lg:p-12 border-yellow-500/30">
            <div className="text-center space-y-6">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Account Under Review</h2>
              <p className="text-gray-400 text-lg mb-8">
                Your payment account setup is being reviewed by Stripe. This typically takes 24-48 hours.
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-white mb-2">What happens next?</h3>
                <ul className="text-left space-y-2 text-gray-300 text-sm">
                  <li>• Stripe will verify your information</li>
                  <li>• You&apos;ll receive an email when verification is complete</li>
                  <li>• You can still use the platform, but won&apos;t receive payouts until verified</li>
                </ul>
              </div>
              <div className="flex gap-3 justify-center">
                <GlowButton variant="outline" size="lg" onClick={() => router.push("/app/coach/dashboard")}>
                  Go to Dashboard
                </GlowButton>
                <GlowButton variant="primary" size="lg" onClick={handleSetup}>
                  Check Status Again
                </GlowButton>
              </div>
            </div>
          </GradientCard>
        </div>
      </div>
    );
  }

  // Incomplete State
  if (viewState === "incomplete") {
    return (
      <div className="min-h-screen bg-[var(--background)] p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <GradientCard className="p-8 lg:p-12 border-orange-500/30">
            <div className="text-center space-y-6">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Setup Incomplete</h2>
              <p className="text-gray-400 text-lg mb-8">
                Your payment account setup is not complete. Please finish the setup to start receiving payouts.
              </p>
              {accountStatus && (
                <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
                  <h3 className="font-semibold text-white mb-4">Current Status</h3>
                  <div className="grid md:grid-cols-3 gap-4 text-left">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Account Status</p>
                      <p className="font-semibold text-white capitalize">{accountStatus.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Charges Enabled</p>
                      <p className={`font-semibold ${accountStatus.chargesEnabled ? "text-green-400" : "text-red-400"}`}>
                        {accountStatus.chargesEnabled ? "Yes" : "No"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Payouts Enabled</p>
                      <p className={`font-semibold ${accountStatus.payoutsEnabled ? "text-green-400" : "text-red-400"}`}>
                        {accountStatus.payoutsEnabled ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-3 justify-center">
                <GlowButton variant="primary" size="lg" onClick={handleSetup} disabled={settingUp}>
                  {settingUp ? "Setting up..." : "Complete Setup →"}
                </GlowButton>
                <GlowButton variant="outline" size="lg" onClick={() => router.push("/app/coach/dashboard")}>
                  Back to Dashboard
                </GlowButton>
              </div>
            </div>
          </GradientCard>
        </div>
      </div>
    );
  }

  // Error State
  if (viewState === "error") {
    return (
      <div className="min-h-screen bg-[var(--background)] p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <GradientCard className="p-8 lg:p-12 border-red-500/30">
            <div className="text-center space-y-6">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Setup Error</h2>
              <p className="text-gray-400 text-lg mb-8">
                {errorMessage || "An error occurred while setting up your payment account. Please try again."}
              </p>
              <div className="flex gap-3 justify-center">
                <GlowButton variant="primary" size="lg" onClick={handleSetup} disabled={settingUp}>
                  {settingUp ? "Retrying..." : "Try Again"}
                </GlowButton>
                <GlowButton variant="outline" size="lg" onClick={() => router.push("/app/coach/dashboard")}>
                  Back to Dashboard
                </GlowButton>
              </div>
            </div>
          </GradientCard>
        </div>
      </div>
    );
  }

  // Education/Onboarding Steps
  return (
    <div className="min-h-screen bg-[var(--background)] p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
            Set Up Payments
          </h1>
          <p className="text-gray-400 text-lg">
            Connect your bank account to receive weekly payouts from your coaching sessions and courses
          </p>
        </div>
        <StripeOnboardingSteps onStartSetup={handleSetup} onSkip={handleSkip} />
      </div>
    </div>
  );
}


