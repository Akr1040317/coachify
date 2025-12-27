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
    <div className={`w-full min-h-[calc(100vh-80px)] flex flex-col ${className}`}>
      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-800">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-5xl w-full mx-auto px-4 py-8">
          {/* Step indicator */}
          <div className="mb-8 text-center">
            <span className="text-base text-gray-400">
              Step {currentStep} of {totalSteps}
            </span>
          </div>

          {/* Content */}
          <div className={onBack === undefined && onNext === undefined ? "" : "mb-8"}>{children}</div>

          {/* Navigation - Only show if handlers are provided */}
          {(onBack !== undefined || onNext !== undefined) && (
            <div className="flex justify-between items-center mt-12">
              <button
                onClick={onBack}
                disabled={currentStep === 1 || !onBack}
                className={`
                  px-8 py-4 text-lg rounded-xl border-2 border-gray-600 text-white
                  transition-all duration-200
                  ${currentStep === 1 || !onBack
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:border-gray-500 hover:bg-gray-800"
                  }
                `}
              >
                Back
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  console.log("🖱️ WizardStepShell Next/Complete button clicked!");
                  console.log("Button state:", {
                    currentStep,
                    totalSteps,
                    canGoNext,
                    hasOnNext: !!onNext,
                    buttonText: currentStep === totalSteps ? "Complete" : "Next",
                  });
                  if (onNext && canGoNext) {
                    console.log("Calling onNext handler from WizardStepShell...");
                    onNext();
                  } else {
                    console.warn("⚠️ WizardStepShell button clicked but blocked:", {
                      hasOnNext: !!onNext,
                      canGoNext,
                    });
                  }
                }}
                disabled={!canGoNext || !onNext}
                className={`
                  px-10 py-4 text-lg rounded-xl
                  bg-gradient-to-r from-orange-500 to-orange-600
                  text-white font-semibold
                  transition-all duration-200
                  ${!canGoNext || !onNext
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:shadow-xl hover:scale-105 active:scale-95"
                  }
                `}
              >
                {currentStep === totalSteps ? "Complete" : "Next"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



