"use client";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Hero } from "@/components/landing/Hero";
import { TrustBar } from "@/components/landing/TrustBar";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SportsBanner } from "@/components/landing/SportsBanner";
import { AudiencePanels } from "@/components/landing/AudiencePanels";
import { FeaturedCoaches } from "@/components/landing/FeaturedCoaches";
import { FAQ } from "@/components/landing/FAQ";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function Home() {
  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-[var(--background)]">
        <Navbar />
        <Hero />
        <TrustBar />
        <HowItWorks />
        <SportsBanner />
        <AudiencePanels />
        <FeaturedCoaches />
        <FAQ />
        <Footer />
      </main>
    </ErrorBoundary>
  );
}

