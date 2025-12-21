"use client";

import { ReactNode } from "react";

interface WizardStepShellProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onNext?: () => void;
  canGoNext?: boolean;
  className?: string;
}

export function WizardStepShell({
  children,
  currentStep,
  totalSteps,
  onBack,
  onNext,
  canGoNext = true,
  className = "",
}: WizardStepShellProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className={`w-full ${className}`}>
      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-800">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Step indicator */}
        <div className="mb-8 text-center">
          <span className="text-sm text-gray-400">
            Step {currentStep} of {totalSteps}
          </span>
        </div>

        {/* Content */}
        <div className="mb-8">{children}</div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={onBack}
            disabled={currentStep === 1}
            className={`
              px-6 py-3 rounded-lg border border-gray-600 text-white
              transition-all duration-200
              ${currentStep === 1
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-gray-500 hover:bg-gray-800"
              }
            `}
          >
            Back
          </button>

          <button
            onClick={onNext}
            disabled={!canGoNext}
            className={`
              px-6 py-3 rounded-lg
              bg-gradient-to-r from-orange-500 to-orange-600
              text-white font-semibold
              transition-all duration-200
              ${!canGoNext
                ? "opacity-50 cursor-not-allowed"
                : "hover:shadow-xl hover:scale-105"
              }
            `}
          >
            {currentStep === totalSteps ? "Complete" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
