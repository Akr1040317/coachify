"use client";

import { useState } from "react";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";

interface StripeOnboardingStepsProps {
  onStartSetup: () => void;
  onSkip?: () => void;
}

export function StripeOnboardingSteps({ onStartSetup, onSkip }: StripeOnboardingStepsProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Why Set Up Payments?",
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            To start earning from your coaching sessions and courses, you need to connect a payment account. 
            This allows us to securely transfer your earnings directly to your bank account.
          </p>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-blue-400 mt-1">✓</span>
              <span><strong>Weekly Payouts:</strong> Get paid every Monday for your earnings</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-400 mt-1">✓</span>
              <span><strong>Secure Payments:</strong> All transactions are processed securely through Stripe</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-400 mt-1">✓</span>
              <span><strong>Automatic Transfers:</strong> No manual invoicing needed - we handle everything</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-400 mt-1">✓</span>
              <span><strong>Tax Compliance:</strong> Stripe handles all tax reporting requirements</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "What You'll Need",
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            The setup process takes about 5 minutes. Have these ready:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Business Information</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Business name (or personal name)</li>
                <li>• Business type</li>
                <li>• Business address</li>
              </ul>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Tax Information</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Tax ID (EIN) or SSN</li>
                <li>• Tax classification</li>
              </ul>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Bank Account</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Account number</li>
                <li>• Routing number</li>
                <li>• Account type</li>
              </ul>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Identity Verification</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Government-issued ID</li>
                <li>• Photo verification</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "How It Works",
      content: (
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
            <h4 className="font-semibold text-white mb-3">Payment Flow</h4>
            <ol className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">1</span>
                <span>Students pay for your sessions/courses through our platform</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">2</span>
                <span>We take a 20% platform fee, you receive 80%</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">3</span>
                <span>Your earnings accumulate in your account</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">4</span>
                <span>Every Monday, we transfer your earnings (minimum $25) to your bank</span>
              </li>
            </ol>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Platform Fee</h4>
              <p className="text-2xl font-bold text-blue-400">20%</p>
              <p className="text-sm text-gray-400 mt-1">Covers payment processing, platform maintenance, and support</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Payout Schedule</h4>
              <p className="text-2xl font-bold text-green-400">Weekly</p>
              <p className="text-sm text-gray-400 mt-1">Every Monday, minimum $25 threshold</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Security & Privacy",
      content: (
        <div className="space-y-4">
          <p className="text-gray-300">
            Your payment information is handled securely by Stripe, a trusted payment processor used by millions of businesses worldwide.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-gray-800/50 rounded-lg p-4">
              <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <h4 className="font-semibold text-white mb-1">Bank-Level Security</h4>
                <p className="text-sm text-gray-400">Stripe is PCI-DSS Level 1 certified, the highest level of security certification</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-gray-800/50 rounded-lg p-4">
              <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <h4 className="font-semibold text-white mb-1">Data Protection</h4>
                <p className="text-sm text-gray-400">Your financial information is encrypted and never stored on our servers</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-gray-800/50 rounded-lg p-4">
              <svg className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold text-white mb-1">Trusted Platform</h4>
                <p className="text-sm text-gray-400">Stripe powers payments for companies like Amazon, Google, and Shopify</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const totalSteps = steps.length;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1">
          <div className="flex gap-2 mb-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? "bg-blue-500" : "bg-gray-700"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-400">
            Step {currentStep + 1} of {totalSteps}
          </p>
        </div>
      </div>

      {/* Step Content */}
      <GradientCard className="p-8">
        <h2 className="text-3xl font-bold mb-6">{steps[currentStep].title}</h2>
        <div className="min-h-[300px]">
          {steps[currentStep].content}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800">
          <div>
            {currentStep > 0 && (
              <GlowButton
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                ← Previous
              </GlowButton>
            )}
          </div>
          <div className="flex gap-3">
            {onSkip && currentStep === 0 && (
              <GlowButton
                variant="outline"
                onClick={onSkip}
              >
                Skip for Now
              </GlowButton>
            )}
            {currentStep < totalSteps - 1 ? (
              <GlowButton
                variant="primary"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Next →
              </GlowButton>
            ) : (
              <GlowButton
                variant="primary"
                onClick={onStartSetup}
              >
                Start Setup →
              </GlowButton>
            )}
          </div>
        </div>
      </GradientCard>
    </div>
  );
}
