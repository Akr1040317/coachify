"use client";

import { motion } from "framer-motion";
import { GradientCard } from "@/components/ui/GradientCard";

const STEPS = [
  {
    title: "Discover",
    description: "Browse verified coaches by sport, level, and specialty. Watch free preview videos and read coach profiles.",
    icon: "🔍",
  },
  {
    title: "Learn",
    description: "Access free videos and purchase structured courses. Learn at your own pace with expert instruction.",
    icon: "📚",
  },
  {
    title: "Book 1:1 Sessions",
    description: "Schedule personalized coaching sessions. Track your progress with detailed notes and skill ratings.",
    icon: "📅",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-[var(--background)] to-[var(--card)]">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-center mb-4"
        >
          How it works
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-center text-gray-300 mb-12 text-lg"
        >
          Get started in three simple steps
        </motion.p>

        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <GradientCard gradient="blue-purple" glow>
                <div className="text-5xl mb-4 text-center">{step.icon}</div>
                <h3 className="text-2xl font-bold mb-3 text-center">{step.title}</h3>
                <p className="text-gray-300 text-center">{step.description}</p>
              </GradientCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}



