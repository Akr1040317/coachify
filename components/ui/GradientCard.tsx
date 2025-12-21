"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface GradientCardProps {
  children: ReactNode;
  className?: string;
  gradient?: "blue-purple" | "orange" | "none";
  glow?: boolean;
}

export function GradientCard({
  children,
  className = "",
  gradient = "blue-purple",
  glow = false,
}: GradientCardProps) {
  const gradientClasses = {
    "blue-purple": "bg-gradient-to-br from-blue-500/10 to-purple-500/10",
    orange: "bg-gradient-to-br from-orange-500/10 to-orange-600/10",
    none: "bg-[var(--card)]",
  };

  const glowClasses = glow
    ? "shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30"
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        rounded-xl border border-[var(--card-border)] p-6
        ${gradientClasses[gradient]}
        ${glowClasses}
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
