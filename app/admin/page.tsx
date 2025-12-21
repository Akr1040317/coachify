"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getUserData } from "@/lib/firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

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
        </div>
      </div>
    </div>
  );
}
