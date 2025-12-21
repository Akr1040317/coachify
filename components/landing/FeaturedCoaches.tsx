"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GradientCard } from "@/components/ui/GradientCard";
import { BadgeVerified } from "@/components/ui/BadgeVerified";
import { GlowButton } from "@/components/ui/GlowButton";

// Placeholder data - will be replaced with real data from Firestore
const FEATURED_COACHES = [
  {
    id: "1",
    name: "Coach John",
    sport: "Basketball",
    rating: 4.9,
    reviews: 24,
    specialties: ["Shooting form", "Ball handling"],
    price: 50,
    isVerified: true,
  },
  {
    id: "2",
    name: "Coach Sarah",
    sport: "Soccer",
    rating: 4.8,
    reviews: 18,
    specialties: ["First touch", "Finishing"],
    price: 45,
    isVerified: true,
  },
  {
    id: "3",
    name: "Coach Mike",
    sport: "Tennis",
    rating: 5.0,
    reviews: 32,
    specialties: ["Forehand", "Serve"],
    price: 60,
    isVerified: true,
  },
];

export function FeaturedCoaches() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-[var(--background)] to-[var(--card)]">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-center mb-4"
        >
          Featured Coaches
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-center text-gray-300 mb-12 text-lg"
        >
          Top-rated coaches ready to help you improve
        </motion.p>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {FEATURED_COACHES.map((coach, index) => (
            <motion.div
              key={coach.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <GradientCard gradient="blue-purple" glow>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{coach.name}</h3>
                    <p className="text-gray-300 text-sm">{coach.sport}</p>
                  </div>
                  {coach.isVerified && <BadgeVerified />}
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-400">⭐</span>
                    <span className="font-semibold">{coach.rating}</span>
                    <span className="text-gray-500 text-sm">({coach.reviews} reviews)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {coach.specialties.slice(0, 2).map((specialty, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <span className="text-lg font-bold">${coach.price}/hr</span>
                  <Link href={`/coach/${coach.id}`}>
                    <GlowButton variant="outline" size="sm">
                      View Profile
                    </GlowButton>
                  </Link>
                </div>
              </GradientCard>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
