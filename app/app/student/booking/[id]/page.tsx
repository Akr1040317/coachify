"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getBooking, getCoachData, type BookingData } from "@/lib/firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { CancelBookingModal } from "@/components/booking/CancelBookingModal";
import { RescheduleBookingModal } from "@/components/booking/RescheduleBookingModal";
import { format } from "date-fns";
import { displayBookingTime, getUserTimezone } from "@/lib/utils/timezone";
import Link from "next/link";

export default function StudentBookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [booking, setBooking] = useState<(BookingData & { id: string }) | null>(null);
  const [coach, setCoach] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [studentTimezone, setStudentTimezone] = useState<string>("UTC");

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (!user) {
        router.push("/auth?role=student");
        return;
      }
      setUser(user);
      setStudentTimezone(getUserTimezone());
      if (bookingId) {
        await loadBooking(bookingId, user.uid);
      }
    });

    return () => unsubscribe();
  }, [router, bookingId]);

  const loadBooking = async (id: string, studentId: string) => {
    setLoading(true);
    try {
      const bookingData = await getBooking(id);
      if (!bookingData) {
        alert("Booking not found");
        router.push("/app/student/bookings");
        return;
      }

      // Verify this booking belongs to the student
      if (bookingData.studentId !== studentId) {
        alert("Unauthorized access");
        router.push("/app/student/bookings");
        return;
      }

      setBooking(bookingData);

      // Load coach data
      const coachData = await getCoachData(bookingData.coachId);
      setCoach(coachData);

      // Load existing bookings for reschedule modal
      const { getBookings } = await import("@/lib/firebase/firestore");
      const { where } = await import("firebase/firestore");
      const bookings = await getBookings([
        where("coachId", "==", bookingData.coachId),
        where("status", "in", ["requested", "confirmed"]),
      ]);
      setExistingBookings(bookings);
    } catch (error) {
      console.error("Error loading booking:", error);
      alert("Failed to load booking");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (reason: string) => {
    if (!user || !booking) return;
    try {
      const response = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          reason,
          cancelledBy: "student",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to cancel booking");
      }

      const result = await response.json();
      alert(result.message || "Booking cancelled successfully");
      router.push("/app/student/bookings");
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
      alert(error.message || "Failed to cancel booking");
    }
  };

  const handleRescheduleBooking = async (
    newStartTime: string,
    newEndTime: string,
    reason: string,
    newOfferingId?: string
  ) => {
    if (!user || !booking) return;
    try {
      const response = await fetch("/api/bookings/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          newStartTime,
          newEndTime,
          reason,
          newOfferingId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reschedule booking");
      }

      const result = await response.json();
      alert(result.message || "Booking rescheduled successfully");
      await loadBooking(booking.id, user.uid);
      setShowRescheduleModal(false);
    } catch (error: any) {
      console.error("Error rescheduling booking:", error);
      alert(error.message || "Failed to reschedule booking");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Loading booking...</div>
      </div>
    );
  }

  if (!booking || !coach) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Booking not found</div>
      </div>
    );
  }

  const bookingStart = booking.scheduledStart.toDate();
  const bookingEnd = booking.scheduledEnd.toDate();
  const coachTimezone = coach.timezone || coach.timeZone || "America/New_York";
  const isUpcoming = bookingStart > new Date() && booking.status === "confirmed";
  const isPast = bookingStart < new Date() || booking.status === "completed" || booking.status === "cancelled";

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/app/student/bookings" className="text-blue-400 hover:text-blue-300 transition-colors">
            ← Back to Bookings
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8">Booking Details</h1>

        <div className="space-y-6">
          {/* Coach Info */}
          <GradientCard className="p-6">
            <div className="flex items-center gap-4 mb-4">
              {coach.photoURL ? (
                <img
                  src={coach.photoURL}
                  alt={coach.displayName}
                  className="w-20 h-20 rounded-full border-2 border-blue-500/30"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl border-2 border-blue-500/30">
                  {coach.displayName?.[0]?.toUpperCase() || "C"}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold">{coach.displayName}</h2>
                {coach.headline && <p className="text-gray-400">{coach.headline}</p>}
              </div>
            </div>
          </GradientCard>

          {/* Booking Details */}
          <GradientCard className="p-6">
            <h3 className="text-xl font-bold mb-4">Session Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">Date & Time</p>
                <p className="text-lg font-semibold mb-1">
                  {displayBookingTime(bookingStart, studentTimezone, "EEEE, MMMM d, yyyy 'at' h:mm a")}
                </p>
                <p className="text-sm text-gray-400">
                  {displayBookingTime(bookingEnd, studentTimezone, "h:mm a")} ({studentTimezone})
                </p>
                {coachTimezone !== studentTimezone && (
                  <p className="text-xs text-gray-500 mt-1">
                    Coach's timezone: {displayBookingTime(bookingStart, coachTimezone, "h:mm a")} ({coachTimezone})
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Duration</p>
                <p className="text-lg font-semibold">{booking.sessionMinutes} minutes</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Session Type</p>
                <p className="text-lg font-semibold">
                  {booking.type === "free_intro" ? "Free Intro Consultation" : "Paid Session"}
                </p>
                {booking.customOfferingId && coach.customOfferings && (
                  <p className="text-sm text-gray-400 mt-1">
                    {coach.customOfferings.find((o: any) => o.id === booking.customOfferingId)?.name || "Custom Offering"}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Price</p>
                <p className="text-lg font-semibold">
                  {booking.type === "free_intro" ? (
                    <span className="text-green-400">FREE</span>
                  ) : (
                    `$${(booking.priceCents / 100).toFixed(2)}`
                  )}
                </p>
                {booking.refundAmountCents && booking.refundAmountCents > 0 && (
                  <p className="text-sm text-green-400 mt-1">
                    Refunded: ${(booking.refundAmountCents / 100).toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    booking.status === "confirmed"
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : booking.status === "cancelled"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : booking.status === "completed"
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                  }`}
                >
                  {booking.status === "confirmed"
                    ? "Confirmed"
                    : booking.status === "cancelled"
                    ? "Cancelled"
                    : booking.status === "completed"
                    ? "Completed"
                    : "Pending"}
                </span>
              </div>

              {booking.bufferMinutes && booking.bufferMinutes > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Buffer Time</p>
                  <p className="text-lg font-semibold">{booking.bufferMinutes} minutes</p>
                </div>
              )}
            </div>

            {booking.meetingLink && (
              <div className="mt-6 pt-6 border-t border-gray-800">
                <a
                  href={booking.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Join Meeting</span>
                </a>
              </div>
            )}

            {booking.cancellationReason && (
              <div className="mt-6 pt-6 border-t border-gray-800">
                <p className="text-sm text-gray-400 mb-1">Cancellation Reason</p>
                <p className="text-gray-300">{booking.cancellationReason}</p>
              </div>
            )}

            {booking.rescheduleReason && (
              <div className="mt-6 pt-6 border-t border-gray-800">
                <p className="text-sm text-gray-400 mb-1">Reschedule Reason</p>
                <p className="text-gray-300">{booking.rescheduleReason}</p>
              </div>
            )}
          </GradientCard>

          {/* Actions */}
          {isUpcoming && (
            <div className="flex gap-4">
              <GlowButton
                variant="outline"
                onClick={() => setShowRescheduleModal(true)}
                className="flex-1"
              >
                Reschedule Booking
              </GlowButton>
              <GlowButton
                variant="outline"
                onClick={() => setShowCancelModal(true)}
                className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                Cancel Booking
              </GlowButton>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {booking && (
        <CancelBookingModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          booking={{
            id: booking.id,
            scheduledStart: bookingStart,
            priceCents: booking.priceCents,
            type: booking.type,
            cancellationPolicy: booking.cancellationPolicy,
          }}
          onConfirm={handleCancelBooking}
        />
      )}

      {/* Reschedule Modal */}
      {booking && coach && (
        <RescheduleBookingModal
          isOpen={showRescheduleModal}
          onClose={() => setShowRescheduleModal(false)}
          booking={{
            id: booking.id,
            scheduledStart: bookingStart,
            scheduledEnd: bookingEnd,
            coachId: booking.coachId,
            sessionMinutes: booking.sessionMinutes,
            priceCents: booking.priceCents,
            customOfferingId: booking.customOfferingId,
            bufferMinutes: booking.bufferMinutes,
          }}
          coach={coach}
          existingBookings={existingBookings.map((b) => ({
            id: b.id,
            scheduledStart: b.scheduledStart,
            scheduledEnd: b.scheduledEnd,
            status: b.status,
            bufferMinutes: b.bufferMinutes,
          }))}
          onConfirm={handleRescheduleBooking}
        />
      )}
    </div>
  );
}

