"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { onAuthChange } from "@/lib/firebase/auth";
import { getCoachData, updateCoachData, getBookings, type BookingData } from "@/lib/firebase/firestore";
import { User } from "firebase/auth";
import { where, orderBy } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { format } from "date-fns";

interface AvailabilitySlot {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isAvailable: boolean;
}

interface AvailabilityOverride {
  date: string; // ISO date string
  isAvailable: boolean;
  startTime?: string;
  endTime?: string;
}

// Common timezones
const COMMON_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Phoenix", label: "Arizona Time (MST)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
];

export default function AvailabilityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [coach, setCoach] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [bookings, setBookings] = useState<(BookingData & { id: string })[]>([]);
  const [timezone, setTimezone] = useState<string>("America/New_York");
  const [availabilityOverrides, setAvailabilityOverrides] = useState<AvailabilityOverride[]>([]);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [editingOverride, setEditingOverride] = useState<AvailabilityOverride | null>(null);
  const [overrideDate, setOverrideDate] = useState("");
  const [overrideIsAvailable, setOverrideIsAvailable] = useState(true);
  const [overrideStartTime, setOverrideStartTime] = useState("09:00");
  const [overrideEndTime, setOverrideEndTime] = useState("17:00");
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [connectingGoogleCalendar, setConnectingGoogleCalendar] = useState(false);

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

      // Load timezone
      if (coachData?.timezone) {
        setTimezone(coachData.timezone);
      }

      // Load availability overrides
      if (coachData?.availabilityOverrides) {
        setAvailabilityOverrides(coachData.availabilityOverrides);
      }

      // Check if Google Calendar is connected
      setGoogleCalendarConnected(!!coachData?.googleCalendarSyncEnabled && !!coachData?.googleCalendarAccessToken);

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
        timezone: timezone,
        availabilityOverrides: availabilityOverrides,
      });
      alert("Availability saved successfully!");
    } catch (error) {
      console.error("Error saving availability:", error);
      alert("Failed to save availability. Please try again.");
    }
  };

  const handleAddOverride = () => {
    setEditingOverride(null);
    setOverrideDate("");
    setOverrideIsAvailable(true);
    setOverrideStartTime("09:00");
    setOverrideEndTime("17:00");
    setShowOverrideModal(true);
  };

  const handleEditOverride = (override: AvailabilityOverride) => {
    setEditingOverride(override);
    setOverrideDate(override.date);
    setOverrideIsAvailable(override.isAvailable);
    setOverrideStartTime(override.startTime || "09:00");
    setOverrideEndTime(override.endTime || "17:00");
    setShowOverrideModal(true);
  };

  const handleSaveOverride = () => {
    if (!overrideDate) {
      alert("Please select a date");
      return;
    }

    const newOverride: AvailabilityOverride = {
      date: overrideDate,
      isAvailable: overrideIsAvailable,
      ...(overrideIsAvailable && {
        startTime: overrideStartTime,
        endTime: overrideEndTime,
      }),
    };

    if (editingOverride) {
      // Update existing override
      const updated = availabilityOverrides.map((o) =>
        o.date === editingOverride.date ? newOverride : o
      );
      setAvailabilityOverrides(updated);
    } else {
      // Add new override
      setAvailabilityOverrides([...availabilityOverrides, newOverride]);
    }

    setShowOverrideModal(false);
  };

  const handleDeleteOverride = (date: string) => {
    if (confirm("Are you sure you want to remove this date override?")) {
      setAvailabilityOverrides(availabilityOverrides.filter((o) => o.date !== date));
    }
  };


  const handleConnectGoogleCalendar = async () => {
    if (!user) return;

    setConnectingGoogleCalendar(true);
    try {
      const response = await fetch(
        `/api/google-calendar/auth?coachId=${user.uid}&redirectUri=${encodeURIComponent(window.location.href)}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to initiate Google Calendar connection");
      }

      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error: any) {
      console.error("Error connecting Google Calendar:", error);
      alert(`Failed to connect Google Calendar: ${error.message}`);
      setConnectingGoogleCalendar(false);
    }
  };

  const handleDisconnectGoogleCalendar = async () => {
    if (!user) return;

    if (!confirm("Are you sure you want to disconnect Google Calendar? Future bookings will not be synced automatically.")) {
      return;
    }

    try {
      await updateCoachData(user.uid, {
        googleCalendarSyncEnabled: false,
        googleCalendarAccessToken: null,
        googleCalendarRefreshToken: null,
      });
      setGoogleCalendarConnected(false);
      alert("Google Calendar disconnected successfully.");
      await loadData(user.uid);
    } catch (error) {
      console.error("Error disconnecting Google Calendar:", error);
      alert("Failed to disconnect Google Calendar");
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

          {/* Google Calendar Integration */}
          <GradientCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Google Calendar Sync</h2>
                <p className="text-gray-400 text-sm">
                  Automatically sync your bookings to Google Calendar
                </p>
                {googleCalendarConnected && (
                  <p className="text-green-400 text-sm mt-2">
                    ✓ Connected - Bookings will be synced automatically
                  </p>
                )}
              </div>
              <div>
                {googleCalendarConnected ? (
                  <GlowButton
                    variant="outline"
                    onClick={handleDisconnectGoogleCalendar}
                    glowColor="red"
                  >
                    Disconnect
                  </GlowButton>
                ) : (
                  <GlowButton
                    variant="primary"
                    onClick={handleConnectGoogleCalendar}
                    disabled={connectingGoogleCalendar}
                    glowColor="blue"
                  >
                    {connectingGoogleCalendar ? "Connecting..." : "Connect Google Calendar"}
                  </GlowButton>
                )}
              </div>
            </div>
          </GradientCard>

          <GradientCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Set Your Weekly Availability</h2>
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-400">Timezone:</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="px-3 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Date-Specific Availability</h2>
              <GlowButton variant="outline" size="sm" onClick={handleAddOverride}>
                + Add Date Override
              </GlowButton>
            </div>
            {availabilityOverrides.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                No date overrides. Add specific dates to override your weekly availability.
              </p>
            ) : (
              <div className="space-y-2">
                {availabilityOverrides.map((override) => (
                  <div
                    key={override.date}
                    className="flex items-center justify-between p-3 bg-[var(--background)] rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-medium">
                        {format(new Date(override.date), "EEEE, MMMM d, yyyy")}
                      </span>
                      {override.isAvailable ? (
                        <span className="text-sm text-gray-400">
                          {override.startTime} - {override.endTime}
                        </span>
                      ) : (
                        <span className="text-sm text-red-400">Unavailable</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditOverride(override)}
                        className="px-3 py-1 text-sm border border-gray-600 rounded-lg hover:border-gray-500 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteOverride(override.date)}
                        className="px-3 py-1 text-sm border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GradientCard>

          {/* Override Modal */}
          {showOverrideModal && (
            <>
              <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                onClick={() => setShowOverrideModal(false)}
              />
              <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
                <div
                  className="pointer-events-auto max-w-md w-full bg-[var(--card)] rounded-xl border-2 border-gray-700 shadow-2xl p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-2xl font-bold mb-4">
                    {editingOverride ? "Edit Date Override" : "Add Date Override"}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Date</label>
                      <input
                        type="date"
                        value={overrideDate}
                        onChange={(e) => setOverrideDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full px-4 py-2 bg-[var(--background)] border border-gray-600 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={overrideIsAvailable}
                          onChange={(e) => setOverrideIsAvailable(e.target.checked)}
                          className="w-5 h-5 rounded border-gray-600 bg-[var(--background)] text-blue-500"
                        />
                        <span>Available on this date</span>
                      </label>
                    </div>
                    {overrideIsAvailable && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Start Time</label>
                          <input
                            type="time"
                            value={overrideStartTime}
                            onChange={(e) => setOverrideStartTime(e.target.value)}
                            className="w-full px-4 py-2 bg-[var(--background)] border border-gray-600 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">End Time</label>
                          <input
                            type="time"
                            value={overrideEndTime}
                            onChange={(e) => setOverrideEndTime(e.target.value)}
                            className="w-full px-4 py-2 bg-[var(--background)] border border-gray-600 rounded-lg text-white"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setShowOverrideModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-600 rounded-lg hover:border-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <GlowButton variant="primary" onClick={handleSaveOverride} className="flex-1">
                        Save
                      </GlowButton>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

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

