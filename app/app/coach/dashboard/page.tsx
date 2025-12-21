"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getUserData, getCoachData } from "@/lib/firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { BadgeVerified } from "@/components/ui/BadgeVerified";
import Link from "next/link";

export default function CoachDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [coachData, setCoachData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (!user) {
        router.push("/auth?role=coach");
        return;
      }

      const userData = await getUserData(user.uid);
      if (!userData || userData.role !== "coach" || !userData.onboardingCompleted) {
        router.push("/onboarding/coach/1");
        return;
      }

      setUser(user);
      const coach = await getCoachData(user.uid);
      setCoachData(coach);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Coach Dashboard</h1>
            {coachData?.isVerified && <BadgeVerified />}
            {coachData?.status === "pending_verification" && (
              <p className="text-orange-400 text-sm mt-2">Profile pending verification</p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <GradientCard>
            <h3 className="text-xl font-bold mb-2">Upcoming Bookings</h3>
            <p className="text-gray-400 mb-4">0 upcoming sessions</p>
            <Link href="/app/coach/bookings">
              <GlowButton variant="outline" size="sm">View Bookings</GlowButton>
            </Link>
          </GradientCard>

          <GradientCard>
            <h3 className="text-xl font-bold mb-2">My Students</h3>
            <p className="text-gray-400 mb-4">0 students</p>
            <Link href="/app/coach/students">
              <GlowButton variant="outline" size="sm">View Students</GlowButton>
            </Link>
          </GradientCard>

          <GradientCard>
            <h3 className="text-xl font-bold mb-2">Content</h3>
            <p className="text-gray-400 mb-4">Manage videos, courses, articles</p>
            <Link href="/app/coach/content/videos">
              <GlowButton variant="outline" size="sm">Manage Content</GlowButton>
            </Link>
          </GradientCard>
        </div>

        {coachData && (
          <GradientCard>
            <h2 className="text-2xl font-bold mb-4">Profile Overview</h2>
            <div className="space-y-2">
              <p><span className="font-semibold">Headline:</span> {coachData.headline}</p>
              <p><span className="font-semibold">Sports:</span> {coachData.sports.join(", ")}</p>
              <p><span className="font-semibold">Rating:</span> {coachData.ratingAvg?.toFixed(1) || "N/A"} ({coachData.ratingCount || 0} reviews)</p>
            </div>
            <div className="mt-4">
              <Link href="/app/coach/profile/edit">
                <GlowButton variant="outline" size="sm">Edit Profile</GlowButton>
              </Link>
            </div>
          </GradientCard>
        )}
      </div>
    </div>
  );
}
