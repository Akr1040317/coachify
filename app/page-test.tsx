"use client";

import { Hero } from "@/components/landing/Hero";
import { TrustBar } from "@/components/landing/TrustBar";

export default function HomeTest() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <Hero />
      <TrustBar />
    </main>
  );
}
