"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getUserData, getCoaches, getDisputes } from "@/lib/firebase/firestore";
import { where } from "firebase/firestore";
import { getHighRiskCoaches, type RiskScore } from "@/lib/risk/risk-monitoring";
import { type CoachData } from "@/lib/firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [highRiskCoaches, setHighRiskCoaches] = useState<(RiskScore & { coach: CoachData & { id: string } })[]>([]);
  const [activeDisputes, setActiveDisputes] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (!user) {
        router.push("/auth");
        return;
      }

      const userData = await getUserData(user.uid);
      if (!userData || userData.role !== "admin") {
        router.push("/");
        return;
      }

      setUser(user);
      await loadRiskData();
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadRiskData = async () => {
    try {
      // Load high-risk coaches
      const coaches = await getCoaches();
      const highRisk = await getHighRiskCoaches(coaches);
      setHighRiskCoaches(highRisk);
      
      // Load active disputes
      const disputes = await getDisputes([
        where("status", "in", ["needs_response", "warning_needs_response", "under_review", "warning_under_review"])
      ]);
      setActiveDisputes(disputes.length);
    } catch (error) {
      console.error("Error loading risk data:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        {/* Risk Alerts */}
        {(highRiskCoaches.length > 0 || activeDisputes > 0) && (
          <div className="mb-6 space-y-4">
            {highRiskCoaches.length > 0 && (
              <GradientCard gradient="orange" className="border-red-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">⚠️ High-Risk Coaches Detected</h3>
                    <p className="text-gray-400">
                      {highRiskCoaches.length} coach{highRiskCoaches.length !== 1 ? "es" : ""} with risk score above 50.
                      Review and take action to prevent chargebacks and disputes.
                    </p>
                    <div className="mt-2 space-y-1">
                      {highRiskCoaches.slice(0, 3).map((risk) => (
                        <p key={risk.coachId} className="text-sm text-gray-300">
                          • {risk.coach.displayName}: Risk Score {risk.overallScore}/100
                        </p>
                      ))}
                    </div>
                  </div>
                  <Link href="/admin/coaches">
                    <GlowButton variant="outline" glowColor="orange">Review Coaches</GlowButton>
                  </Link>
                </div>
              </GradientCard>
            )}
            
            {activeDisputes > 0 && (
              <GradientCard gradient="orange" className="border-red-500/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">⚠️ Active Disputes Requiring Response</h3>
                    <p className="text-gray-400">
                      {activeDisputes} dispute{activeDisputes !== 1 ? "s" : ""} need{activeDisputes === 1 ? "s" : ""} your attention.
                      You are responsible for handling these chargebacks.
                    </p>
                  </div>
                  <Link href="/admin/disputes">
                    <GlowButton variant="outline" glowColor="orange">Manage Disputes</GlowButton>
                  </Link>
                </div>
              </GradientCard>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/admin/coaches">
            <GradientCard gradient="blue-purple" glow className="cursor-pointer hover:scale-105 transition-transform">
              <h2 className="text-2xl font-bold mb-4">Coach Management</h2>
              <p className="text-gray-400 mb-4">
                Verify coaches, suspend accounts, and manage coach profiles
              </p>
              <GlowButton variant="outline">Manage Coaches</GlowButton>
            </GradientCard>
          </Link>

          <Link href="/admin/reviews">
            <GradientCard gradient="orange" glow className="cursor-pointer hover:scale-105 transition-transform">
              <h2 className="text-2xl font-bold mb-4">Review Moderation</h2>
              <p className="text-gray-400 mb-4">
                Moderate reviews and handle disputes
              </p>
              <GlowButton variant="outline">Moderate Reviews</GlowButton>
            </GradientCard>
          </Link>

          <Link href="/admin/bookings">
            <GradientCard gradient="blue-purple" glow className="cursor-pointer hover:scale-105 transition-transform">
              <h2 className="text-2xl font-bold mb-4">Booking Management</h2>
              <p className="text-gray-400 mb-4">
                View all bookings, handle disputes, and process refunds
              </p>
              <GlowButton variant="outline">Manage Bookings</GlowButton>
            </GradientCard>
          </Link>

          <Link href="/admin/content">
            <GradientCard gradient="orange" glow className="cursor-pointer hover:scale-105 transition-transform">
              <h2 className="text-2xl font-bold mb-4">Content Moderation</h2>
              <p className="text-gray-400 mb-4">
                Moderate articles and content
              </p>
              <GlowButton variant="outline">Moderate Content</GlowButton>
            </GradientCard>
          </Link>

          <Link href="/admin/disputes">
            <GradientCard gradient="orange" glow className="cursor-pointer hover:scale-105 transition-transform">
              <h2 className="text-2xl font-bold mb-4">Disputes & Chargebacks</h2>
              <p className="text-gray-400 mb-4">
                Manage refunds, chargebacks, and disputes. You are responsible for handling these.
              </p>
              <GlowButton variant="outline">Manage Disputes</GlowButton>
            </GradientCard>
          </Link>
        </div>
      </div>
    </div>
  );
}

