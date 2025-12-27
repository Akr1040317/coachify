"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getUserData, getBookings } from "@/lib/firebase/firestore";
import { orderBy } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import Link from "next/link";
import { format } from "date-fns";

export default function AdminBookingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
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
      await loadBookings();
    });

    return () => unsubscribe();
  }, [router]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const bookingsData = await getBookings([orderBy("createdAt", "desc")]);
      setBookings(bookingsData);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Booking Management</h1>
          <Link href="/admin">
            <GlowButton variant="outline">Back to Admin</GlowButton>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading bookings...</div>
        ) : bookings.length === 0 ? (
          <GradientCard>
            <p className="text-center text-gray-400 py-8">No bookings found.</p>
          </GradientCard>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <GradientCard key={booking.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        booking.status === "completed" ? "bg-green-500/20 text-green-400" :
                        booking.status === "confirmed" ? "bg-blue-500/20 text-blue-400" :
                        "bg-gray-500/20 text-gray-400"
                      }`}>
                        {booking.status}
                      </span>
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                        {booking.type}
                      </span>
                    </div>
                    <p className="text-gray-300 mb-1">
                      {format(booking.scheduledStart.toDate(), "PPP 'at' p")}
                    </p>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>Coach ID: {booking.coachId}</p>
                      <p>Student ID: {booking.studentId}</p>
                      <p>Duration: {booking.sessionMinutes} minutes</p>
                      {booking.priceCents > 0 && (
                        <p>Price: ${booking.priceCents / 100}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <GlowButton variant="outline" size="sm">
                      View Details
                    </GlowButton>
                    {booking.status === "confirmed" && (
                      <GlowButton variant="outline" size="sm">
                        Process Refund
                      </GlowButton>
                    )}
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



