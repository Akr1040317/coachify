"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { onAuthChange } from "@/lib/firebase/auth";
import { getCoachData } from "@/lib/firebase/firestore";
import { User } from "firebase/auth";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { BadgeVerified } from "@/components/ui/BadgeVerified";
import Link from "next/link";

export default function CoachDashboard() {
  const [coachData, setCoachData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (user) {
        try {
          const coach = await getCoachData(user.uid);
          setCoachData(coach);
        } catch (error) {
          console.error("Error loading coach data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <DashboardLayout role="coach">
      <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                  Welcome Back!
                </h1>
                {coachData?.isVerified && (
                  <div className="flex items-center gap-2">
                    <BadgeVerified />
                    <span className="text-sm text-gray-400">Verified Coach</span>
                  </div>
                )}
                {coachData?.status === "pending_verification" && (
                  <p className="text-orange-400 text-sm mt-2">Profile pending verification</p>
                )}
              </div>
            </div>
            {coachData && (
              <p className="text-gray-400 text-lg">
                {coachData.headline || "Manage your coaching business and connect with students"}
              </p>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <GradientCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">📅</div>
                <div className="text-2xl font-bold text-blue-400">0</div>
              </div>
              <h3 className="text-lg font-semibold mb-1">Upcoming Sessions</h3>
              <p className="text-gray-400 text-sm">Bookings this week</p>
            </GradientCard>

            <GradientCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">👥</div>
                <div className="text-2xl font-bold text-purple-400">0</div>
              </div>
              <h3 className="text-lg font-semibold mb-1">Total Students</h3>
              <p className="text-gray-400 text-sm">Active students</p>
            </GradientCard>

            <GradientCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">⭐</div>
                <div className="text-2xl font-bold text-orange-400">
                  {coachData?.ratingAvg?.toFixed(1) || "N/A"}
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-1">Average Rating</h3>
              <p className="text-gray-400 text-sm">{coachData?.ratingCount || 0} reviews</p>
            </GradientCard>

            <GradientCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-3xl">📚</div>
                <div className="text-2xl font-bold text-green-400">0</div>
              </div>
              <h3 className="text-lg font-semibold mb-1">Published Courses</h3>
              <p className="text-gray-400 text-sm">Active courses</p>
            </GradientCard>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <GradientCard className="p-6 hover:scale-105 transition-transform cursor-pointer">
              <Link href="/app/coach/bookings" className="block">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-xl font-bold mb-2">Manage Bookings</h3>
                <p className="text-gray-400 mb-4">View and manage your upcoming sessions</p>
                <GlowButton variant="outline" size="sm">View Bookings →</GlowButton>
              </Link>
            </GradientCard>

            <GradientCard className="p-6 hover:scale-105 transition-transform cursor-pointer">
              <Link href="/app/coach/students" className="block">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-xl font-bold mb-2">My Students</h3>
                <p className="text-gray-400 mb-4">Connect with your students</p>
                <GlowButton variant="outline" size="sm">View Students →</GlowButton>
              </Link>
            </GradientCard>

            <GradientCard className="p-6 hover:scale-105 transition-transform cursor-pointer">
              <Link href="/app/coach/courses" className="block">
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-xl font-bold mb-2">Create Course</h3>
                <p className="text-gray-400 mb-4">Build and publish new courses</p>
                <GlowButton variant="outline" size="sm">Create Course →</GlowButton>
              </Link>
            </GradientCard>

            <GradientCard className="p-6 hover:scale-105 transition-transform cursor-pointer">
              <Link href="/app/coach/content/videos" className="block">
                <div className="text-4xl mb-4">🎥</div>
                <h3 className="text-xl font-bold mb-2">Manage Content</h3>
                <p className="text-gray-400 mb-4">Upload videos and create content</p>
                <GlowButton variant="outline" size="sm">Manage Content →</GlowButton>
              </Link>
            </GradientCard>

            <GradientCard className="p-6 hover:scale-105 transition-transform cursor-pointer">
              <Link href="/app/coach/articles" className="block">
                <div className="text-4xl mb-4">✍️</div>
                <h3 className="text-xl font-bold mb-2">Write Article</h3>
                <p className="text-gray-400 mb-4">Share your expertise</p>
                <GlowButton variant="outline" size="sm">Write Article →</GlowButton>
              </Link>
            </GradientCard>

            <GradientCard className="p-6 hover:scale-105 transition-transform cursor-pointer">
              <Link href={`/coach/${coachData?.userId || ""}`} className="block">
                <div className="text-4xl mb-4">👤</div>
                <h3 className="text-xl font-bold mb-2">View Profile</h3>
                <p className="text-gray-400 mb-4">See how students see you</p>
                <GlowButton variant="outline" size="sm">View Profile →</GlowButton>
              </Link>
            </GradientCard>
          </div>

          {/* Profile Overview */}
          {coachData && (
            <GradientCard className="p-8">
              <h2 className="text-2xl font-bold mb-6">Profile Overview</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Headline</p>
                  <p className="text-white font-medium">{coachData.headline || "Not set"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Sports</p>
                  <p className="text-white font-medium">
                    {coachData.sports?.length > 0 ? coachData.sports.join(", ") : "Not set"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Rating</p>
                  <p className="text-white font-medium">
                    {coachData.ratingAvg?.toFixed(1) || "N/A"} ({coachData.ratingCount || 0} reviews)
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Status</p>
                  <p className="text-white font-medium capitalize">
                    {coachData.status === "pending_verification" ? "Pending Verification" : "Active"}
                  </p>
                </div>
              </div>
            </GradientCard>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
