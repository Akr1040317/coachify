"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { onAuthChange } from "@/lib/firebase/auth";
import { getCoachData, updateCoachData, getBookings, type BookingData } from "@/lib/firebase/firestore";
import { User } from "firebase/auth";
import { where, orderBy } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";

interface AvailabilitySlot {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isAvailable: boolean;
}

export default function AvailabilityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [coach, setCoach] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [bookings, setBookings] = useState<(BookingData & { id: string })[]>([]);

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (user) {
        setUser(user);
        await loadData(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadData = async (coachId: string) => {
    setLoading(true);
    try {
      const coachData = await getCoachData(coachId);
      setCoach(coachData);
      
      // Load availability slots (stored in coach.availabilitySlots)
      if (coachData?.availabilitySlots) {
        setAvailability(coachData.availabilitySlots);
      } else {
        // Initialize with empty slots
        const defaultSlots: AvailabilitySlot[] = [];
        for (let day = 0; day < 7; day++) {
          defaultSlots.push({
            dayOfWeek: day,
            startTime: "09:00",
            endTime: "17:00",
            isAvailable: false,
          });
        }
        setAvailability(defaultSlots);
      }

      // Load bookings
      const bookingsData = await getBookings([
        where("coachId", "==", coachId),
        orderBy("scheduledStart", "asc"),
      ]);
      setBookings(bookingsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = (dayIndex: number) => {
    const newAvailability = [...availability];
    newAvailability[dayIndex].isAvailable = !newAvailability[dayIndex].isAvailable;
    setAvailability(newAvailability);
  };

  const handleTimeChange = (dayIndex: number, field: "startTime" | "endTime", value: string) => {
    const newAvailability = [...availability];
    newAvailability[dayIndex][field] = value;
    setAvailability(newAvailability);
  };

  const handleSaveAvailability = async () => {
    if (!user) return;

    try {
      await updateCoachData(user.uid, {
        availabilitySlots: availability,
      });
      alert("Availability saved successfully!");
    } catch (error) {
      console.error("Error saving availability:", error);
      alert("Failed to save availability. Please try again.");
    }
  };

  const getAvailableSlots = (dayOfWeek: number, date: Date) => {
    const daySlot = availability.find((s) => s.dayOfWeek === dayOfWeek && s.isAvailable);
    if (!daySlot) return [];

    const slots: string[] = [];
    const [startHour, startMin] = daySlot.startTime.split(":").map(Number);
    const [endHour, endMin] = daySlot.endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Generate 30-minute slots
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const min = minutes % 60;
      const timeString = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
      
      // Check if slot is already booked
      const slotDateTime = new Date(date);
      slotDateTime.setHours(hour, min, 0, 0);
      
      const isBooked = bookings.some((booking) => {
        const bookingDate = booking.scheduledStart.toDate();
        return (
          bookingDate.getTime() === slotDateTime.getTime() &&
          booking.status !== "cancelled"
        );
      });

      if (!isBooked) {
        slots.push(timeString);
      }
    }

    return slots;
  };

  if (loading) {
    return (
      <DashboardLayout role="coach">
        <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12 text-gray-400">Loading...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="coach">
      <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
              Availability & Calendar
            </h1>
            <GlowButton variant="primary" onClick={handleSaveAvailability}>
              Save Availability
            </GlowButton>
          </div>

          <GradientCard className="p-6">
            <h2 className="text-2xl font-bold mb-6">Set Your Weekly Availability</h2>
            <div className="space-y-4">
              {daysOfWeek.map((day, index) => {
                const slot = availability[index] || {
                  dayOfWeek: index,
                  startTime: "09:00",
                  endTime: "17:00",
                  isAvailable: false,
                };
                return (
                  <div key={index} className="flex items-center gap-4 p-4 bg-[var(--background)] rounded-lg">
                    <div className="w-32 font-semibold">{day}</div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slot.isAvailable}
                        onChange={() => handleToggleDay(index)}
                        className="w-5 h-5 rounded border-gray-600 bg-[var(--card)] text-blue-500"
                      />
                      <span>Available</span>
                    </label>
                    {slot.isAvailable && (
                      <>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-400">From:</label>
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => handleTimeChange(index, "startTime", e.target.value)}
                            className="px-3 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-400">To:</label>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => handleTimeChange(index, "endTime", e.target.value)}
                            className="px-3 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                          />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </GradientCard>

          <GradientCard className="p-6">
            <h2 className="text-2xl font-bold mb-6">Upcoming Bookings</h2>
            <div className="space-y-3">
              {bookings.filter((b) => {
                const bookingDate = b.scheduledStart.toDate();
                return bookingDate >= new Date() && b.status !== "cancelled";
              }).length === 0 ? (
                <p className="text-gray-400 text-center py-8">No upcoming bookings</p>
              ) : (
                bookings
                  .filter((b) => {
                    const bookingDate = b.scheduledStart.toDate();
                    return bookingDate >= new Date() && b.status !== "cancelled";
                  })
                  .map((booking) => {
                    const bookingDate = booking.scheduledStart.toDate();
                    return (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-4 bg-[var(--background)] rounded-lg"
                      >
                        <div>
                          <div className="font-semibold">
                            {bookingDate.toLocaleDateString()} at {bookingDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <div className="text-sm text-gray-400">
                            Duration: {booking.durationMinutes || 30} minutes
                          </div>
                          {booking.customOfferingId && (
                            <div className="text-sm text-gray-400">
                              Offering: {coach?.customOfferings?.find((o: any) => o.id === booking.customOfferingId)?.name || "Custom"}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              booking.status === "confirmed"
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : booking.status === "requested"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                            }`}
                          >
                            {booking.status === "confirmed"
                              ? "Confirmed"
                              : booking.status === "requested"
                              ? "Pending Confirmation"
                              : booking.status}
                          </span>
                          {booking.status === "requested" && (
                            <button
                              onClick={async () => {
                                try {
                                  const { updateBooking } = await import("@/lib/firebase/firestore");
                                  await updateBooking(booking.id, { status: "confirmed" });
                                  await loadData(user!.uid);
                                  alert("Booking confirmed!");
                                } catch (error) {
                                  console.error("Error confirming booking:", error);
                                  alert("Failed to confirm booking");
                                }
                              }}
                              className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                            >
                              Confirm
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </GradientCard>
        </div>
      </div>
    </DashboardLayout>
  );
}

