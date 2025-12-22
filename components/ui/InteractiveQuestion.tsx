"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface InteractiveQuestionProps {
  question: string;
  description?: string;
  children: ReactNode;
  onNext: () => void;
  onBack?: () => void;
  canProceed: boolean;
  showBack?: boolean;
}

export function InteractiveQuestion({
  question,
  description,
  children,
  onNext,
  onBack,
  canProceed,
  showBack = true,
}: InteractiveQuestionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-3xl mx-auto"
      >
        <div className="mb-12 text-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
            {question}
          </h2>
          {description && (
            <p className="text-gray-400 text-xl md:text-2xl">{description}</p>
          )}
        </div>

        <div className="mb-12">
          {children}
        </div>

        <div className="flex justify-between items-center mt-12">
          {showBack && onBack ? (
            <button
              onClick={onBack}
              className="px-8 py-4 text-lg rounded-xl border-2 border-gray-600 text-white hover:border-gray-500 hover:bg-gray-800 transition-all"
            >
              Back
            </button>
          ) : (
            <div></div>
          )}

          <button
            onClick={onNext}
            disabled={!canProceed}
            className={`
              px-10 py-4 text-lg rounded-xl font-semibold transition-all duration-200
              ${canProceed
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-xl hover:scale-105"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
              }
            `}
          >
            Continue
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

