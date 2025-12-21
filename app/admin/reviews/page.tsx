"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getUserData, getReviews } from "@/lib/firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import Link from "next/link";

export default function AdminReviewsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
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
      await loadReviews();
    });

    return () => unsubscribe();
  }, [router]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const reviewsData = await getReviews();
      setReviews(reviewsData);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Review Moderation</h1>
          <Link href="/admin">
            <GlowButton variant="outline">Back to Admin</GlowButton>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <GradientCard>
            <p className="text-center text-gray-400 py-8">No reviews found.</p>
          </GradientCard>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <GradientCard key={review.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={i < review.rating ? "text-yellow-400" : "text-gray-600"}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(review.createdAt.toMillis()).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300 mb-2">{review.text}</p>
                    <div className="text-sm text-gray-500">
                      Coach ID: {review.coachId} • Student ID: {review.studentId}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <GlowButton variant="outline" size="sm">
                      Flag
                    </GlowButton>
                    <GlowButton variant="outline" size="sm">
                      Delete
                    </GlowButton>
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
