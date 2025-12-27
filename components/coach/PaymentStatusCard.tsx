"use client";

import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { useRouter } from "next/navigation";

interface PaymentStatusCardProps {
  stripeStatus: {
    hasAccount: boolean;
    status: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
  } | null;
  pendingEarnings?: number;
  onSetupClick?: () => void;
}

export function PaymentStatusCard({ stripeStatus, pendingEarnings = 0, onSetupClick }: PaymentStatusCardProps) {
  const router = useRouter();

  const handleSetup = () => {
    if (onSetupClick) {
      onSetupClick();
    } else {
      router.push("/app/coach/onboarding/stripe");
    }
  };

  if (!stripeStatus) {
    return null;
  }

  // Not Started
  if (!stripeStatus.hasAccount || stripeStatus.status === "not_setup") {
    return (
      <GradientCard className="p-6 border-orange-500/30 bg-orange-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-orange-400 mb-1">Set Up Payments</h3>
              <p className="text-gray-400 text-sm">
                Connect your bank account to receive weekly payouts for your earnings
              </p>
            </div>
          </div>
          <GlowButton variant="primary" size="sm" onClick={handleSetup}>
            Set Up Payments →
          </GlowButton>
        </div>
      </GradientCard>
    );
  }

  // In Progress / Pending
  if (stripeStatus.status === "pending" || (!stripeStatus.chargesEnabled || !stripeStatus.payoutsEnabled)) {
    return (
      <GradientCard className="p-6 border-yellow-500/30 bg-yellow-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-400 mb-1">Complete Payment Setup</h3>
              <p className="text-gray-400 text-sm">
                Your account setup is in progress. Complete it to start receiving payouts.
              </p>
            </div>
          </div>
          <GlowButton variant="primary" size="sm" onClick={handleSetup}>
            Complete Setup →
          </GlowButton>
        </div>
      </GradientCard>
    );
  }

  // Active / Complete
  if (stripeStatus.status === "active" && stripeStatus.chargesEnabled && stripeStatus.payoutsEnabled) {
    return (
      <GradientCard className="p-6 border-green-500/30 bg-green-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Payment Account Connected</h3>
              <p className="text-gray-400 text-sm">
                Pending earnings: ${(pendingEarnings / 100).toFixed(2)} • Next payout: Monday
              </p>
            </div>
          </div>
          <GlowButton
            variant="outline"
            size="sm"
            onClick={() => router.push("/app/coach/dashboard/revenue")}
          >
            View Revenue →
          </GlowButton>
        </div>
      </GradientCard>
    );
  }

  // Restricted
  return (
    <GradientCard className="p-6 border-red-500/30 bg-red-500/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-400 mb-1">Payment Account Issue</h3>
            <p className="text-gray-400 text-sm">
              There&apos;s an issue with your payment account. Please complete the setup.
            </p>
          </div>
        </div>
        <GlowButton variant="primary" size="sm" onClick={handleSetup}>
          Fix Account →
        </GlowButton>
      </div>
    </GradientCard>
  );
}



