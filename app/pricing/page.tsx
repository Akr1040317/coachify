"use client";

import { GradientCard } from "@/components/ui/GradientCard";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      
      {/* Background decorative elements */}
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      <div className="absolute top-40 left-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-40 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Choose the plan that works best for you. No hidden fees, no surprises.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <GradientCard className="h-full p-8">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold mb-2">For Students</h2>
                  <div className="text-4xl font-bold text-blue-400 mb-2">Free</div>
                  <p className="text-gray-400 text-sm">to get started</p>
                </div>
                <p className="text-gray-300 mb-6 text-center">
                  Browse coaches and courses for free. Pay only for sessions and courses you purchase.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-gray-300">Free coach profiles and previews</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-gray-300">Free video content</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-gray-300">Pay per session or course</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-gray-300">No subscription required</span>
                  </li>
                </ul>
              </GradientCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <GradientCard gradient="orange" className="h-full p-8">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold mb-2">For Coaches</h2>
                  <div className="text-4xl font-bold text-orange-400 mb-2">80%</div>
                  <p className="text-gray-400 text-sm">revenue share</p>
                </div>
                <p className="text-gray-300 mb-6 text-center">
                  Keep 80% of your earnings. We handle payments and platform management.
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-gray-300">80% revenue share</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-gray-300">No monthly fees</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-gray-300">Direct payouts via Stripe</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 mt-1">✓</span>
                    <span className="text-gray-300">Full platform access</span>
                  </li>
                </ul>
              </GradientCard>
            </motion.div>
          </div>
          
          <div className="mt-16 text-center">
            <p className="text-gray-400 mb-4">Have questions about pricing?</p>
            <a href="/how-it-works" className="text-blue-400 hover:text-blue-300 underline">
              Learn more about how Coachify works
            </a>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
