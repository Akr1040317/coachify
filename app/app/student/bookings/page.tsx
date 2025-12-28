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
import { displayBookingTime, getUserTimezone } from "@/lib/utils/timezone";
import { motion, AnimatePresence } from "framer-motion";

function StudentBookingsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<(BookingData & { id: string; coachName?: string; coachTimezone?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentTimezone, setStudentTimezone] = useState<string>("UTC");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (!user) {
        router.push("/auth?role=student");
        return;
      }
      setUser(user);
      setStudentTimezone(getUserTimezone());
      await loadBookings(user.uid);
    });

    return () => unsubscribe();
  }, [router]);

  // Check for success query parameter or session_id (from Stripe redirect)
  useEffect(() => {
    const successParam = searchParams?.get("success");
    const sessionId = searchParams?.get("session_id");
    
    if (successParam === "true" || sessionId) {
      setShowSuccess(true);
      // Reload bookings to show the new booking
      if (user) {
        loadBookings(user.uid);
      }
      // Remove query parameters from URL
      router.replace("/app/student/bookings");
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams, router, user]);

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
          return { 
            ...booking, 
            coachName: coach?.displayName || "Unknown Coach",
            coachTimezone: coach?.timezone || coach?.timeZone || "America/New_York"
          };
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
    (b) => b.status === "completed" || (b.status === "cancelled") || (b.status === "confirmed" && b.scheduledStart.toDate() < new Date())
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

        {/* Success Message */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-green-400 font-semibold">Booking Confirmed!</p>
                  <p className="text-green-300 text-sm">Your session has been successfully booked and payment processed.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                              {displayBookingTime(booking.scheduledStart.toDate(), studentTimezone, "PPP 'at' p")}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {studentTimezone}
                              {booking.coachTimezone && booking.coachTimezone !== studentTimezone && (
                                <span> • Coach: {booking.coachTimezone}</span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {booking.sessionMinutes} minutes • {booking.type === "free_intro" ? "Free Intro" : `$${booking.priceCents / 100}`}
                            </p>
                          </div>
                          <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                            booking.status === "confirmed"
                              ? "bg-green-500/20 text-green-400"
                              : booking.status === "requested"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}>
                            {booking.status === "confirmed" ? "Confirmed" : booking.status === "requested" ? "Pending" : booking.status}
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
                              {displayBookingTime(booking.scheduledStart.toDate(), studentTimezone, "PPP 'at' p")}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{studentTimezone}</p>
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
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    }>
      <StudentBookingsPageContent />
    </Suspense>
  );
}

