"use client";

import { motion } from "framer-motion";

const TRUST_ITEMS = [
  { icon: "✓", text: "Verified coaches" },
  { icon: "🔒", text: "Secure payments" },
  { icon: "👨‍👩‍👧", text: "Parent and guardian friendly" },
  { icon: "📊", text: "Session tracking and progress notes" },
];

export function TrustBar() {
  return (
    <section className="py-12 border-y border-gray-700 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-orange-500/5">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {TRUST_ITEMS.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center p-4 rounded-lg hover:bg-blue-500/10 transition-colors"
            >
              <div className="text-4xl mb-3">{item.icon}</div>
              <div className="text-sm font-medium text-gray-200">{item.text}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
