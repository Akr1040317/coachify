"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getBookings, getStudentData, updateBooking, type BookingData } from "@/lib/firebase/firestore";
import { where, orderBy } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import Link from "next/link";
import { format } from "date-fns";

export default function CoachBookingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<(BookingData & { id: string; studentName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (!user) {
        router.push("/auth?role=coach");
        return;
      }
      setUser(user);
      await loadBookings(user.uid);
    });

    return () => unsubscribe();
  }, [router]);

  const loadBookings = async (coachId: string) => {
    setLoading(true);
    try {
      const bookingsData = await getBookings([
        where("coachId", "==", coachId),
        orderBy("scheduledStart", "desc"),
      ]);

      const bookingsWithStudents = await Promise.all(
        bookingsData.map(async (booking) => {
          const student = await getStudentData(booking.studentId);
          return { ...booking, studentName: "Student" }; // In production, get from user data
        })
      );

      setBookings(bookingsWithStudents);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMeetingLink = async (bookingId: string, link: string) => {
    try {
      await updateBooking(bookingId, { meetingLink: link });
      await loadBookings(user!.uid);
    } catch (error) {
      console.error("Error updating meeting link:", error);
      alert("Failed to update meeting link");
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      await updateBooking(bookingId, { status: "completed" });
      await loadBookings(user!.uid);
    } catch (error) {
      console.error("Error completing booking:", error);
      alert("Failed to complete booking");
    }
  };

  const upcomingBookings = bookings.filter(
    (b) => b.status === "confirmed" && b.scheduledStart.toDate() > new Date()
  );
  const pastBookings = bookings.filter(
    (b) => b.status === "completed" || b.scheduledStart.toDate() < new Date()
  );

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">My Bookings</h1>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading bookings...</div>
        ) : (
          <div className="space-y-8">
            {upcomingBookings.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Upcoming Sessions</h2>
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <GradientCard key={booking.id}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-1">{booking.studentName}</h3>
                          <p className="text-gray-400">
                            {format(booking.scheduledStart.toDate(), "PPP 'at' p")}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {booking.sessionMinutes} minutes • {booking.type === "free_intro" ? "Free Intro" : `$${booking.priceCents / 100}`}
                          </p>
                          {booking.meetingLink && (
                            <a
                              href={booking.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline mt-2 inline-block"
                            >
                              Join Meeting →
                            </a>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Link href={`/app/coach/booking/${booking.id}`}>
                            <GlowButton variant="outline" size="sm">View Details</GlowButton>
                          </Link>
                          <GlowButton
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const link = prompt("Enter meeting link (Zoom/Google Meet):");
                              if (link) {
                                handleUpdateMeetingLink(booking.id, link);
                              }
                            }}
                          >
                            Add Meeting Link
                          </GlowButton>
                          {booking.scheduledStart.toDate() < new Date() && (
                            <GlowButton
                              variant="primary"
                              size="sm"
                              glowColor="orange"
                              onClick={() => handleCompleteBooking(booking.id)}
                            >
                              Mark Complete
                            </GlowButton>
                          )}
                        </div>
                      </div>
                    </GradientCard>
                  ))}
                </div>
              </div>
            )}

            {pastBookings.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Past Sessions</h2>
                <div className="space-y-4">
                  {pastBookings.map((booking) => (
                    <Link key={booking.id} href={`/app/coach/booking/${booking.id}`}>
                      <GradientCard className="cursor-pointer hover:scale-105 transition-transform">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xl font-bold mb-1">{booking.studentName}</h3>
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
                <p className="text-center text-gray-400 py-8">No bookings yet.</p>
              </GradientCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
