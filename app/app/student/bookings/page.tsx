"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getBookings, getCoachData, type BookingData } from "@/lib/firebase/firestore";
import { where, orderBy } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import Link from "next/link";
import { format } from "date-fns";

function BookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<(BookingData & { id: string; coachName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (!user) {
        router.push("/auth?role=student");
        return;
      }
      setUser(user);
      await loadBookings(user.uid);
      
      // Check for success parameter
      if (searchParams.get("success") === "true") {
        setShowSuccess(true);
        // Remove success parameter from URL
        router.replace("/app/student/bookings");
        // Hide success message after 5 seconds
        setTimeout(() => setShowSuccess(false), 5000);
      }
    });

    return () => unsubscribe();
  }, [router, searchParams]);

  const loadBookings = async (studentId: string) => {
    setLoading(true);
    try {
      const bookingsData = await getBookings([
        where("studentId", "==", studentId),
        orderBy("scheduledStart", "desc"),
      ]);

      const bookingsWithCoaches = await Promise.all(
        bookingsData.map(async (booking) => {
          const coach = await getCoachData(booking.coachId);
          return { ...booking, coachName: coach?.displayName || "Unknown Coach" };
        })
      );

      setBookings(bookingsWithCoaches);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingBookings = bookings.filter(
    (b) => (b.status === "confirmed" || b.status === "requested") && b.scheduledStart.toDate() > new Date()
  );
  const pastBookings = bookings.filter(
    (b) => b.status === "completed" || (b.scheduledStart.toDate() < new Date() && b.status !== "cancelled")
  );

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">My Bookings</h1>
          <Link href="/app/student/bookings/new">
            <GlowButton variant="primary" glowColor="orange">
              Book a Session
            </GlowButton>
          </Link>
        </div>

        {showSuccess && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400">
            ✓ Payment successful! Your booking has been confirmed.
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading bookings...</div>
        ) : (
          <div className="space-y-8">
            {upcomingBookings.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Upcoming Sessions</h2>
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <Link key={booking.id} href={`/app/student/booking/${booking.id}`}>
                      <GradientCard className="cursor-pointer hover:scale-105 transition-transform">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-bold mb-1">{booking.coachName}</h3>
                            <p className="text-gray-400">
                              {format(booking.scheduledStart.toDate(), "PPP 'at' p")}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {booking.sessionMinutes} minutes • {booking.type === "free_intro" ? "Free Intro" : `$${booking.priceCents / 100}`}
                            </p>
                          </div>
                          <div className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-full">
                            {booking.status}
                          </div>
                        </div>
                      </GradientCard>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {pastBookings.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Past Sessions</h2>
                <div className="space-y-4">
                  {pastBookings.map((booking) => (
                    <Link key={booking.id} href={`/app/student/booking/${booking.id}`}>
                      <GradientCard className="cursor-pointer hover:scale-105 transition-transform">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-bold mb-1">{booking.coachName}</h3>
                            <p className="text-gray-400">
                              {format(booking.scheduledStart.toDate(), "PPP 'at' p")}
                            </p>
                          </div>
                          <div className="px-4 py-2 bg-gray-500/20 text-gray-400 rounded-full">
                            {booking.status}
                          </div>
                        </div>
                      </GradientCard>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {bookings.length === 0 && (
              <GradientCard>
                <p className="text-center text-gray-400 py-8">No bookings yet. Book your first session!</p>
              </GradientCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudentBookingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--background)] p-8"><div className="text-center py-12 text-gray-400">Loading...</div></div>}>
      <BookingsContent />
    </Suspense>
  );
}



