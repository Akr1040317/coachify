"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GlowButton } from "@/components/ui/GlowButton";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated gradient mesh background - brighter */}
      <div className="absolute inset-0 gradient-mesh opacity-50" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      
      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="inline-block px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-sm font-medium mb-6">
            🏆 Trusted by 10,000+ athletes worldwide
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent leading-tight"
        >
          Real coaches. Real progress. From anywhere.
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          Discover verified coaches, learn from expert videos and courses, and book personalized 1:1 sessions. 
          <span className="text-blue-400"> Trusted by parents and students worldwide.</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link href="/get-started">
            <GlowButton variant="primary" size="lg" glowColor="orange">
              Get Started
            </GlowButton>
          </Link>
          <Link href="/auth?mode=signin">
            <GlowButton variant="secondary" size="lg">
              Sign In
            </GlowButton>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
        >
          <div>
            <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">500+</div>
            <div className="text-sm text-gray-400">Verified Coaches</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">12+</div>
            <div className="text-sm text-gray-400">Sports</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-bold text-orange-400 mb-2">10K+</div>
            <div className="text-sm text-gray-400">Students</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}



