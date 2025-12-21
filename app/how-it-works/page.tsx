"use client";

import { HowItWorks } from "@/components/landing/HowItWorks";
import { AudiencePanels } from "@/components/landing/AudiencePanels";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">How Coachify Works</h1>
          <p className="text-xl text-gray-400">
            Everything you need to know about finding coaches and improving your game
          </p>
        </div>
      </div>
      <HowItWorks />
      <AudiencePanels />
    </div>
  );
}
