"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { onAuthChange } from "@/lib/firebase/auth";
import { getBookings, getUserData, updateBooking, type BookingData } from "@/lib/firebase/firestore";
import { User } from "firebase/auth";
import { where, orderBy } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, isToday, isPast, isFuture } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface BookingWithStudent extends BookingData {
  id: string;
  studentName: string;
  studentEmail?: string;
  studentPhotoURL?: string;
}

export default function CoachBookingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<BookingWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [filterStatus, setFilterStatus] = useState<"all" | "upcoming" | "past" | "today">("all");
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (user) {
        setUser(user);
        await loadBookings(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadBookings = async (coachId: string) => {
    setLoading(true);
    try {
      const bookingsData = await getBookings([
        where("coachId", "==", coachId),
        orderBy("scheduledStart", "desc"),
      ]);

      // Fetch student information for each booking
      const bookingsWithStudents = await Promise.all(
        bookingsData.map(async (booking) => {
          try {
            const studentUser = await getUserData(booking.studentId);
            return {
              ...booking,
              studentName: studentUser?.displayName || "Student",
              studentEmail: studentUser?.email,
              studentPhotoURL: studentUser?.photoURL,
            };
          } catch (error) {
            console.error(`Error fetching student data for ${booking.studentId}:`, error);
            return {
              ...booking,
              studentName: "Student",
            };
          }
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
    if (!user) return;
    try {
      await updateBooking(bookingId, { meetingLink: link });
      await loadBookings(user.uid);
    } catch (error) {
      console.error("Error updating meeting link:", error);
      alert("Failed to update meeting link");
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    if (!user) return;
    try {
      await updateBooking(bookingId, { status: "completed" });
      await loadBookings(user.uid);
    } catch (error) {
      console.error("Error completing booking:", error);
      alert("Failed to complete booking");
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!user || !confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await updateBooking(bookingId, { status: "cancelled" });
      await loadBookings(user.uid);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Failed to cancel booking");
    }
  };

  const getFilteredBookings = () => {
    const now = new Date();
    switch (filterStatus) {
      case "upcoming":
        return bookings.filter(
          (b) => b.status === "confirmed" && b.scheduledStart.toDate() > now
        );
      case "past":
        return bookings.filter(
          (b) => b.status === "completed" || b.scheduledStart.toDate() < now || b.status === "cancelled"
        );
      case "today":
        return bookings.filter((b) => isSameDay(b.scheduledStart.toDate(), now));
      default:
        return bookings;
    }
  };

  const filteredBookings = getFilteredBookings();

  // Calendar view helpers
  const monthStart = startOfMonth(calendarDate);
  const monthEnd = endOfMonth(calendarDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getBookingsForDate = (date: Date) => {
    return filteredBookings.filter((booking) =>
      isSameDay(booking.scheduledStart.toDate(), date)
    );
  };

  const renderListView = () => {
    if (loading) {
      return (
        <div className="text-center py-12 text-gray-400">Loading bookings...</div>
      );
    }

    if (filteredBookings.length === 0) {
      return (
        <GradientCard className="p-12 text-center">
          <div className="flex justify-center mb-4">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2">No bookings found</h3>
          <p className="text-gray-400">
            {filterStatus === "all"
              ? "You don't have any bookings yet."
              : `No ${filterStatus} bookings found.`}
          </p>
        </GradientCard>
      );
    }

    return (
      <div className="space-y-4">
        {filteredBookings.map((booking) => {
          const bookingDate = booking.scheduledStart.toDate();
          const isUpcoming = bookingDate > new Date() && booking.status === "confirmed";
          const isPast = bookingDate < new Date() || booking.status === "completed" || booking.status === "cancelled";

          return (
            <GradientCard key={booking.id} className="p-6">
              <div className="flex items-start gap-6">
                {/* Student Avatar */}
                <div className="flex-shrink-0">
                  {booking.studentPhotoURL ? (
                    <img
                      src={booking.studentPhotoURL}
                      alt={booking.studentName}
                      className="w-16 h-16 rounded-full border-2 border-blue-500/30"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl border-2 border-blue-500/30">
                      {booking.studentName[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Booking Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-2xl font-bold mb-1">{booking.studentName}</h3>
                      {booking.studentEmail && (
                        <p className="text-gray-400 text-sm">{booking.studentEmail}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isUpcoming && (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                          Upcoming
                        </span>
                      )}
                      {isPast && booking.status === "completed" && (
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full border border-blue-500/30">
                          Completed
                        </span>
                      )}
                      {booking.status === "cancelled" && (
                        <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full border border-red-500/30">
                          Cancelled
                        </span>
                      )}
                      {booking.status === "requested" && (
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full border border-yellow-500/30">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-400">Date & Time</p>
                        <p className="text-white font-medium">
                          {format(bookingDate, "EEEE, MMMM d, yyyy")}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {format(bookingDate, "h:mm a")} - {format(booking.scheduledEnd.toDate(), "h:mm a")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-400">Duration</p>
                        <p className="text-white font-medium">{booking.sessionMinutes} minutes</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-400">Session Type</p>
                        <p className="text-white font-medium">
                          {booking.type === "free_intro" ? "Free Intro Consultation" : "Paid Session"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-gray-400">Price</p>
                        <p className="text-white font-medium">
                          {booking.type === "free_intro" ? (
                            <span className="text-green-400">FREE</span>
                          ) : (
                            `$${(booking.priceCents / 100).toFixed(2)}`
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {booking.meetingLink && (
                    <div className="mb-4">
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

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-800">
                    {isUpcoming && !booking.meetingLink && (
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
                    )}
                    {isUpcoming && (
                      <GlowButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelBooking(booking.id)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        Cancel Booking
                      </GlowButton>
                    )}
                    {isPast && booking.status === "confirmed" && (
                      <GlowButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleCompleteBooking(booking.id)}
                      >
                        Mark as Completed
                      </GlowButton>
                    )}
                  </div>
                </div>
              </div>
            </GradientCard>
          );
        })}
      </div>
    );
  };

  const renderCalendarView = () => {
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
      <div className="space-y-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCalendarDate(subMonths(calendarDate, 1))}
              className="p-2 rounded-lg border-2 border-gray-600 hover:border-gray-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold">{format(calendarDate, "MMMM yyyy")}</h2>
            <button
              onClick={() => setCalendarDate(addMonths(calendarDate, 1))}
              className="p-2 rounded-lg border-2 border-gray-600 hover:border-gray-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setCalendarDate(new Date())}
              className="px-4 py-2 rounded-lg border-2 border-gray-600 hover:border-gray-500 transition-colors text-sm"
            >
              Today
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <GradientCard className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              const dayBookings = getBookingsForDate(day);
              const isCurrentMonth = isSameMonth(day, calendarDate);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={idx}
                  className={`min-h-[100px] p-2 rounded-lg border-2 transition-colors ${
                    isCurrentMonth
                      ? isCurrentDay
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-gray-700 bg-gray-800/30"
                      : "border-gray-800 bg-gray-900/20 opacity-50"
                  }`}
                >
                  <div
                    className={`text-sm font-medium mb-1 ${
                      isCurrentDay ? "text-blue-400" : isCurrentMonth ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayBookings.slice(0, 3).map((booking) => {
                      const isUpcoming = booking.scheduledStart.toDate() > new Date() && booking.status === "confirmed";
                      return (
                        <div
                          key={booking.id}
                          className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity ${
                            isUpcoming
                              ? "bg-blue-500/30 text-blue-300 border border-blue-500/50"
                              : booking.status === "completed"
                              ? "bg-green-500/30 text-green-300 border border-green-500/50"
                              : "bg-gray-700/50 text-gray-400 border border-gray-600/50"
                          }`}
                          title={`${booking.studentName} - ${format(booking.scheduledStart.toDate(), "h:mm a")}`}
                        >
                          {format(booking.scheduledStart.toDate(), "h:mm a")} - {booking.studentName}
                        </div>
                      );
                    })}
                    {dayBookings.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayBookings.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </GradientCard>
      </div>
    );
  };

  return (
    <DashboardLayout role="coach">
      <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                Bookings
              </h1>
              <p className="text-gray-400">
                Manage your session bookings with students
              </p>
            </div>
          </div>

          {/* View Toggle and Filters */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  viewMode === "list"
                    ? "border-blue-500 bg-blue-500/20 text-blue-400"
                    : "border-gray-600 text-gray-400 hover:border-gray-500"
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <span>List View</span>
                </div>
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  viewMode === "calendar"
                    ? "border-blue-500 bg-blue-500/20 text-blue-400"
                    : "border-gray-600 text-gray-400 hover:border-gray-500"
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Calendar View</span>
                </div>
              </button>
            </div>

            {viewMode === "list" && (
              <div className="flex gap-2 flex-wrap">
                {(["all", "upcoming", "past", "today"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors capitalize ${
                      filterStatus === status
                        ? "border-blue-500 bg-blue-500/20 text-blue-400"
                        : "border-gray-600 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {viewMode === "list" ? renderListView() : renderCalendarView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
