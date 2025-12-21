"use client";

import { ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlowButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  glowColor?: "orange" | "blue" | "purple";
}

export function GlowButton({
  children,
  variant = "primary",
  size = "md",
  glowColor = "orange",
  className = "",
  ...props
}: GlowButtonProps) {
  const baseClasses = "font-semibold rounded-lg transition-all duration-300 relative overflow-hidden";
  
  const variantClasses = {
    primary: glowColor === "orange" 
      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-glow-orange hover:shadow-glow-orange hover:shadow-xl"
      : glowColor === "blue"
      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-glow-blue hover:shadow-glow-blue hover:shadow-xl"
      : "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-glow-purple hover:shadow-glow-purple hover:shadow-xl",
    secondary: "bg-transparent border-2 border-blue-500 text-blue-400 hover:bg-blue-500/10",
    outline: "bg-transparent border-2 border-gray-600 text-gray-300 hover:border-gray-500",
  };

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}
