"use client";

import { HowItWorks } from "@/components/landing/HowItWorks";
import { AudiencePanels } from "@/components/landing/AudiencePanels";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      
      {/* Background decorative elements */}
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-40 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 pt-24 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
            How Coachify Works
          </h1>
          <p className="text-xl text-gray-400">
            Everything you need to know about finding coaches and improving your game
          </p>
        </div>
      </div>
      <HowItWorks />
      <AudiencePanels />
      
      <Footer />
    </div>
  );
}

