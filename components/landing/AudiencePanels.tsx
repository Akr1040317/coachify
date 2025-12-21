"use client";

import { motion } from "framer-motion";
import { GradientCard } from "@/components/ui/GradientCard";

const PANELS = [
  {
    title: "For Students and Parents",
    features: [
      "Find credible coaches by sport, level, and goal",
      "Free content before you buy",
      "Structured courses and 1:1 instruction",
      "Session history and improvement tracking",
    ],
    gradient: "blue-purple",
  },
  {
    title: "For Coaches",
    features: [
      "Earn through sessions and courses",
      "Publish free videos to build trust",
      "Track students, notes, and progress",
      "Simple scheduling and payouts",
    ],
    gradient: "orange",
  },
];

export function AudiencePanels() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-[var(--background)] to-[var(--card)]">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-center mb-12"
        >
          Built for Everyone
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-8">
          {PANELS.map((panel, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <GradientCard gradient={panel.gradient as "blue-purple" | "orange"} glow>
                <h3 className="text-2xl font-bold mb-6">{panel.title}</h3>
                <ul className="space-y-3">
                  {panel.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <span className="text-blue-400 mt-1">✓</span>
                      <span className="text-gray-200">{feature}</span>
                    </li>
                  ))}
                </ul>
              </GradientCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
