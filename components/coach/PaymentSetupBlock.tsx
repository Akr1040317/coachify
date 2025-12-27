"use client";

import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { useRouter } from "next/navigation";

interface PaymentSetupBlockProps {
  stripeStatus?: {
    hasAccount: boolean;
    status: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
  } | null;
}

export function PaymentSetupBlock({ stripeStatus }: PaymentSetupBlockProps) {
  const router = useRouter();

  const getStatusMessage = () => {
    if (!stripeStatus || !stripeStatus.hasAccount) {
      return {
        title: "Payment Setup Required",
        description: "You need to connect your payment account before creating courses or offerings.",
        status: "not_setup",
      };
    }

    if (stripeStatus.status === "pending") {
      return {
        title: "Complete Your Payment Setup",
        description: "Your payment account setup is in progress. Complete it to start creating content.",
        status: "pending",
      };
    }

    if (stripeStatus.status === "restricted") {
      return {
        title: "Payment Account Issue",
        description: "There's an issue with your payment account. Please complete the setup to continue.",
        status: "restricted",
      };
    }

    return {
      title: "Payment Setup Required",
      description: "You need to connect your payment account before creating courses or offerings.",
      status: "not_setup",
    };
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <GradientCard className="p-8 lg:p-12 max-w-2xl w-full border-orange-500/30">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4">{statusInfo.title}</h2>
          <p className="text-gray-400 text-lg mb-6">{statusInfo.description}</p>
        </div>

        {stripeStatus && stripeStatus.hasAccount && (
          <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Account Status</p>
                <p className="font-semibold text-white capitalize">{stripeStatus.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Charges Enabled</p>
                <p className={`font-semibold ${stripeStatus.chargesEnabled ? "text-green-400" : "text-red-400"}`}>
                  {stripeStatus.chargesEnabled ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Payouts Enabled</p>
                <p className={`font-semibold ${stripeStatus.payoutsEnabled ? "text-green-400" : "text-red-400"}`}>
                  {stripeStatus.payoutsEnabled ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-white mb-3">Why is this required?</h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>To receive payments for your coaching sessions and courses</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>To ensure secure and compliant payment processing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>To enable weekly payouts to your bank account</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <GlowButton
            variant="primary"
            size="lg"
            onClick={() => router.push("/app/coach/onboarding/stripe")}
          >
            Complete Payment Setup →
          </GlowButton>
          <GlowButton
            variant="outline"
            size="lg"
            onClick={() => router.push("/app/coach/dashboard")}
          >
            Back to Dashboard
          </GlowButton>
        </div>
      </GradientCard>
    </div>
  );
}

