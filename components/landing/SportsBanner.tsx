"use client";

import { SPORTS, SPORT_EMOJIS } from "@/lib/constants/sports";
import { motion } from "framer-motion";

export function SportsBanner() {
  // Duplicate sports for seamless loop
  const sportsList = [...SPORTS, ...SPORTS, ...SPORTS];

  return (
    <section className="py-16 bg-gradient-to-b from-[var(--background)] to-[var(--card)] overflow-hidden">
      <div className="mb-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Coaches for Every Sport
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Find expert coaches across 12+ sports, from traditional athletics to esports
        </p>
      </div>

      <div className="relative">
        {/* Gradient overlays for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[var(--card)] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[var(--card)] to-transparent z-10" />

        <div className="flex gap-8 scroll-animation">
          {sportsList.map((sport, index) => (
            <motion.div
              key={`${sport}-${index}`}
              className="flex-shrink-0 flex flex-col items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:scale-105 min-w-[140px]"
              whileHover={{ scale: 1.1 }}
            >
              <div className="text-5xl">{SPORT_EMOJIS[sport] || "🏃"}</div>
              <div className="text-sm font-semibold text-center text-gray-200">{sport}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
