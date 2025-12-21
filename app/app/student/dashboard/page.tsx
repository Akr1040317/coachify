"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getUserData, getStudentData } from "@/lib/firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import Link from "next/link";

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (!user) {
        router.push("/auth?role=student");
        return;
      }

      const userData = await getUserData(user.uid);
      if (!userData || userData.role !== "student" || !userData.onboardingCompleted) {
        router.push("/onboarding/student/1");
        return;
      }

      setUser(user);
      const student = await getStudentData(user.uid);
      setStudentData(student);
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
        <h1 className="text-4xl font-bold mb-8">Student Dashboard</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <GradientCard>
            <h3 className="text-xl font-bold mb-2">Upcoming Sessions</h3>
            <p className="text-gray-400 mb-4">No upcoming sessions</p>
            <Link href="/app/student/bookings">
              <GlowButton variant="outline" size="sm">View Bookings</GlowButton>
            </Link>
          </GradientCard>

          <GradientCard>
            <h3 className="text-xl font-bold mb-2">My Library</h3>
            <p className="text-gray-400 mb-4">0 courses purchased</p>
            <Link href="/app/student/library">
              <GlowButton variant="outline" size="sm">View Library</GlowButton>
            </Link>
          </GradientCard>

          <GradientCard>
            <h3 className="text-xl font-bold mb-2">My Coaches</h3>
            <p className="text-gray-400 mb-4">0 coaches saved</p>
            <Link href="/app/student/coaches">
              <GlowButton variant="outline" size="sm">Find Coaches</GlowButton>
            </Link>
          </GradientCard>
        </div>

        {studentData && (
          <GradientCard>
            <h2 className="text-2xl font-bold mb-4">Your Profile</h2>
            <div className="space-y-2">
              <p><span className="font-semibold">Primary Sport:</span> {studentData.primarySport}</p>
              <p><span className="font-semibold">Level:</span> {studentData.level}</p>
              <p><span className="font-semibold">Goals:</span> {studentData.goals.join(", ")}</p>
            </div>
          </GradientCard>
        )}
      </div>
    </div>
  );
}
