"use client";

import { motion } from "framer-motion";
import { Sport } from "@/lib/constants/sports";

interface SportIconCardProps {
  sport: Sport;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

const SPORT_EMOJIS: Record<Sport, string> = {
  Cricket: "🏏",
  Soccer: "⚽",
  Basketball: "🏀",
  Tennis: "🎾",
  Baseball: "⚾",
  "American Football": "🏈",
  Swimming: "🏊",
  "Track and Field": "🏃",
  Volleyball: "🏐",
  Golf: "⛳",
  "Martial Arts": "🥋",
  Esports: "🎮",
};

export function SportIconCard({
  sport,
  selected = false,
  onClick,
  className = "",
}: SportIconCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center gap-2 p-4 rounded-xl
        border-2 transition-all duration-200
        ${selected
          ? "border-blue-500 bg-blue-500/10 shadow-glow-blue"
          : "border-[var(--card-border)] bg-[var(--card)] hover:border-gray-500"
        }
        ${className}
      `}
    >
      <span className="text-3xl">{SPORT_EMOJIS[sport]}</span>
      <span className="text-sm font-medium text-center">{sport}</span>
    </motion.button>
  );
}



