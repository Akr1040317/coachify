"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getUserData, getCoaches, updateCoachData, type CoachData } from "@/lib/firebase/firestore";
import { checkCoachCompliance, getCategoryDescription } from "@/lib/compliance/restricted-categories";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { BadgeVerified } from "@/components/ui/BadgeVerified";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";

export default function AdminCoachesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "active" | "suspended">("all");

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
      await loadCoaches();
    });

    return () => unsubscribe();
  }, [router, filter]);

  const loadCoaches = async () => {
    setLoading(true);
    try {
      const coachesData = await getCoaches();
      setCoaches(coachesData);
    } catch (error) {
      console.error("Error loading coaches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (coachId: string) => {
    try {
      await updateCoachData(coachId, {
        isVerified: true,
        status: "active",
      });
      await loadCoaches();
    } catch (error) {
      console.error("Error verifying coach:", error);
      alert("Failed to verify coach");
    }
  };

  const handleSuspend = async (coachId: string) => {
    if (!confirm("Are you sure you want to suspend this coach?")) return;

    try {
      await updateCoachData(coachId, {
        status: "suspended",
      });
      await loadCoaches();
    } catch (error) {
      console.error("Error suspending coach:", error);
      alert("Failed to suspend coach");
    }
  };

  const handleFeature = async (coachId: string, featured: boolean) => {
    try {
      // In production, add a featured field to coach data
      await updateCoachData(coachId, {
        // featured: featured,
      });
      await loadCoaches();
    } catch (error) {
      console.error("Error updating coach:", error);
      alert("Failed to update coach");
    }
  };

  const filteredCoaches = coaches.filter(coach => {
    if (filter === "all") return true;
    return coach.status === filter;
  });

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Coach Management</h1>
          <Link href="/admin">
            <GlowButton variant="outline">Back to Admin</GlowButton>
          </Link>
        </div>

        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === "all" ? "bg-blue-500 text-white" : "bg-[var(--card)] text-gray-300"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === "pending" ? "bg-blue-500 text-white" : "bg-[var(--card)] text-gray-300"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === "active" ? "bg-blue-500 text-white" : "bg-[var(--card)] text-gray-300"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter("suspended")}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === "suspended" ? "bg-blue-500 text-white" : "bg-[var(--card)] text-gray-300"
            }`}
          >
            Suspended
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading coaches...</div>
        ) : filteredCoaches.length === 0 ? (
          <GradientCard>
            <p className="text-center text-gray-400 py-8">No coaches found.</p>
          </GradientCard>
        ) : (
          <div className="space-y-4">
            {filteredCoaches.map((coach) => (
              <GradientCard key={coach.userId}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{coach.displayName}</h3>
                      {coach.isVerified && <BadgeVerified />}
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        coach.status === "active" ? "bg-green-500/20 text-green-400" :
                        coach.status === "pending_verification" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-red-500/20 text-red-400"
                      }`}>
                        {coach.status}
                      </span>
                    </div>
                    <p className="text-gray-400 mb-2">{coach.headline}</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {coach.sports.slice(0, 3).map((sport: string, i: number) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full"
                        >
                          {sport}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm text-gray-500">
                      Rating: {coach.ratingAvg?.toFixed(1) || "N/A"} ({coach.ratingCount || 0} reviews)
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {coach.status === "pending_verification" && (
                      <GlowButton
                        variant="primary"
                        size="sm"
                        glowColor="orange"
                        onClick={() => handleVerify(coach)}
                      >
                        Verify
                      </GlowButton>
                    )}
                    {coach.complianceStatus === "flagged" && (
                      <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-full">
                        Compliance Flagged
                      </span>
                    )}
                    {coach.status === "active" && (
                      <GlowButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuspend(coach.userId)}
                      >
                        Suspend
                      </GlowButton>
                    )}
                    {coach.status === "suspended" && (
                      <GlowButton
                        variant="primary"
                        size="sm"
                        onClick={() => updateCoachData(coach.userId, { status: "active" })}
                      >
                        Reactivate
                      </GlowButton>
                    )}
                    <Link href={`/coach/${coach.userId}`}>
                      <GlowButton variant="outline" size="sm">
                        View Profile
                      </GlowButton>
                    </Link>
                  </div>
                </div>
              </GradientCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
