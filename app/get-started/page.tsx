"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { GlowButton } from "@/components/ui/GlowButton";

export default function GetStartedPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"student" | "coach" | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      router.push(`/get-started/signup/${selectedRole}`);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      
      {/* Background decorative elements */}
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      <div className="absolute top-40 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-40 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 min-h-[calc(100vh-80px)] flex items-center py-20 px-4">
        <div className="max-w-4xl mx-auto w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
              Let&apos;s Get Started
            </h1>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
              First, tell us what you&apos;re looking for on Coachify
            </p>

            <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
              <button
                onClick={() => setSelectedRole("student")}
                className={`
                  p-8 rounded-2xl border-2 transition-all duration-200 text-left
                  ${selectedRole === "student"
                    ? "border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20"
                    : "border-gray-600 hover:border-gray-500 bg-[var(--card)]"
                  }
                `}
              >
                <div className="text-4xl mb-4">👨‍🎓</div>
                <h3 className="text-2xl font-bold mb-2">I&apos;m a Student/Parent</h3>
                <p className="text-gray-400">
                  I want to find a coach, take courses, and improve my skills
                </p>
              </button>
              
              <button
                onClick={() => setSelectedRole("coach")}
                className={`
                  p-8 rounded-2xl border-2 transition-all duration-200 text-left
                  ${selectedRole === "coach"
                    ? "border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20"
                    : "border-gray-600 hover:border-gray-500 bg-[var(--card)]"
                  }
                `}
              >
                <div className="text-4xl mb-4">🏋️</div>
                <h3 className="text-2xl font-bold mb-2">I&apos;m a Coach</h3>
                <p className="text-gray-400">
                  I want to teach, create courses, and help students improve
                </p>
              </button>
            </div>

            <GlowButton
              variant="primary"
              size="lg"
              onClick={handleContinue}
              disabled={!selectedRole}
            >
              Continue
            </GlowButton>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
