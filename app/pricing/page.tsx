"use client";

import { GradientCard } from "@/components/ui/GradientCard";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Pricing</h1>
        <div className="grid md:grid-cols-2 gap-6">
          <GradientCard>
            <h2 className="text-2xl font-bold mb-4">For Students</h2>
            <p className="text-gray-400 mb-4">
              Browse coaches and courses for free. Pay only for sessions and courses you purchase.
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>✓ Free coach profiles and previews</li>
              <li>✓ Free video content</li>
              <li>✓ Pay per session or course</li>
            </ul>
          </GradientCard>
          <GradientCard gradient="orange">
            <h2 className="text-2xl font-bold mb-4">For Coaches</h2>
            <p className="text-gray-400 mb-4">
              Keep 80% of your earnings. We handle payments and platform management.
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>✓ 80% revenue share</li>
              <li>✓ No monthly fees</li>
              <li>✓ Direct payouts via Stripe</li>
            </ul>
          </GradientCard>
        </div>
      </div>
    </div>
  );
}
