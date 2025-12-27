"use client";

import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface PaymentSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  stripeStatus?: {
    hasAccount: boolean;
    status: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
  } | null;
}

export function PaymentSetupModal({ isOpen, onClose, stripeStatus }: PaymentSetupModalProps) {
  const router = useRouter();

  const handleSetup = () => {
    router.push("/app/coach/onboarding/stripe");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <GradientCard className="p-8 border-orange-500/30">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Payment Setup Required</h2>
                  <p className="text-gray-400">
                    You need to connect your payment account before creating courses or offerings.
                  </p>
                </div>

                {stripeStatus && stripeStatus.hasAccount && (
                  <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Account Status:</span>
                      <span className={`font-semibold capitalize ${
                        stripeStatus.status === "active" ? "text-green-400" : 
                        stripeStatus.status === "pending" ? "text-yellow-400" : 
                        "text-red-400"
                      }`}>
                        {stripeStatus.status}
                      </span>
                    </div>
                  </div>
                )}

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-white mb-2 text-sm">Why is this required?</h3>
                  <ul className="space-y-1 text-gray-300 text-sm text-left">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>To receive payments for your coaching sessions and courses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>To enable secure and compliant payment processing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>To receive weekly payouts to your bank account</span>
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <GlowButton
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Cancel
                  </GlowButton>
                  <GlowButton
                    variant="primary"
                    onClick={handleSetup}
                    className="flex-1"
                  >
                    Start Setup →
                  </GlowButton>
                </div>
              </GradientCard>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}



