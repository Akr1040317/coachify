"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getCoachData, getBookings } from "@/lib/firebase/firestore";
import { where } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { BadgeVerified } from "@/components/ui/BadgeVerified";
import { motion } from "framer-motion";
import { getUserTimezone, convertTimeSlotToStudentTimezone, storeBookingTime } from "@/lib/utils/timezone";
import { calculateAvailableSlotsWithBuffers, getEffectiveAvailability } from "@/lib/utils/booking";
import { BookingCalendar } from "@/components/booking/BookingCalendar";
import { eachDayOfInterval, startOfWeek, endOfWeek, addDays, format as dateFnsFormat, startOfMonth, endOfMonth } from "date-fns";

function NewBookingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const coachId = searchParams.get("coachId");
  const offeringId = searchParams.get("offeringId");
  const [user, setUser] = useState<User | null>(null);
  const [coach, setCoach] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<"free_intro" | "paid" | "custom">("free_intro");
  const [selectedMinutes, setSelectedMinutes] = useState(30);
  const [selectedCustomOffering, setSelectedCustomOffering] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [studentTimezone, setStudentTimezone] = useState<string>("UTC");

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (!user) {
        router.push("/auth?role=student");
        return;
      }
      setUser(user);
      // Detect student's timezone
      setStudentTimezone(getUserTimezone());
      if (coachId) {
        await loadCoach(coachId);
      }
    });

    return () => unsubscribe();
  }, [router, coachId, offeringId]);

  const loadCoach = async (id: string) => {
    setLoading(true);
    try {
      const coachData = await getCoachData(id);
      setCoach(coachData);
      
      // Load existing bookings
      const bookingsData = await getBookings([
        where("coachId", "==", id),
        where("status", "in", ["requested", "confirmed"]),
      ]);
      setBookings(bookingsData);
      
      // If offeringId is provided, auto-select that offering
      if (offeringId && coachData?.customOfferings) {
        const offering = coachData.customOfferings.find((o: any) => o.id === offeringId && o.isActive);
        if (offering) {
          if (offering.isFree) {
            setSelectedType("free_intro");
          } else {
            setSelectedType("custom");
            setSelectedCustomOffering(offering.id);
            setSelectedMinutes(offering.durationMinutes);
          }
        }
      }
    } catch (error) {
      console.error("Error loading coach:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAvailableSlots = (date: string) => {
    if (!date || !coach) return [];
    
    const selectedDateObj = new Date(date);
    const coachTimezone = coach.timezone || "America/New_York";
    
    // Get effective availability (weekly + overrides)
    const effectiveAvailability = getEffectiveAvailability(
      selectedDateObj,
      coach.availabilitySlots || [],
      coach.availabilityOverrides
    );
    
    if (!effectiveAvailability || !effectiveAvailability.isAvailable) {
      return [];
    }
    
    // Get buffer minutes from selected offering
    let bufferMinutes = 0;
    if (selectedType === "custom" && selectedCustomOffering) {
      const offering = coach.customOfferings?.find((o: any) => o.id === selectedCustomOffering);
      bufferMinutes = offering?.bufferMinutes || 0;
    }
    
    // Calculate slots with buffer time enforcement
    const slots = calculateAvailableSlotsWithBuffers(
      selectedDateObj,
      {
        dayOfWeek: selectedDateObj.getDay(),
        startTime: effectiveAvailability.startTime,
        endTime: effectiveAvailability.endTime,
        isAvailable: true,
      },
      bookings.map((b) => ({
        scheduledStart: b.scheduledStart,
        scheduledEnd: b.scheduledEnd,
        status: b.status,
        bufferMinutes: b.bufferMinutes,
      })),
      selectedMinutes || 30,
      bufferMinutes
    );
    
    // Convert slots to student's timezone for display
    return slots.map((slot) =>
      convertTimeSlotToStudentTimezone(selectedDateObj, slot, coachTimezone, studentTimezone)
    );
  };

  useEffect(() => {
    if (selectedDate) {
      const slots = calculateAvailableSlots(selectedDate);
      setAvailableSlots(slots);
      // Reset selected time if not available
      if (selectedTime && !slots.includes(selectedTime)) {
        setSelectedTime("");
      }
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDate, coach, bookings]);

  const handleBook = async () => {
    if (!user || !coach || !selectedDate || !selectedTime) {
      alert("Please fill in all fields");
      return;
    }

    const coachTimezone = coach.timezone || "America/New_York";
    
    // Convert selected time back to coach's timezone for storage
    // The selectedTime is in student's timezone, we need to convert it to coach's timezone
    const selectedDateObj = new Date(selectedDate);
    const [hour, minute] = selectedTime.split(":").map(Number);
    
    // Create date in student's timezone
    const dateInStudentTz = new Date(selectedDateObj);
    dateInStudentTz.setHours(hour, minute, 0, 0);
    
    // Convert to coach's timezone, then to UTC for storage
    const { utcDate: scheduledStart } = storeBookingTime(
      dateInStudentTz,
      selectedTime,
      studentTimezone
    );
    
    // Calculate end time
    const scheduledEnd = new Date(scheduledStart.getTime() + (selectedMinutes || 30) * 60 * 1000);
    
    // Get buffer minutes and cancellation policy
    let bufferMinutes = 0;
    if (selectedType === "custom" && selectedCustomOffering) {
      const offering = coach.customOfferings?.find((o: any) => o.id === selectedCustomOffering);
      bufferMinutes = offering?.bufferMinutes || 0;
    }

    if (selectedType === "free_intro") {
      try {
        const response = await fetch("/api/bookings/freeIntro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coachId,
            scheduledStart: scheduledStart.toISOString(),
            scheduledEnd: scheduledEnd.toISOString(),
            studentId: user.uid,
            timeZone: coachTimezone,
            bufferMinutes: bufferMinutes,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          alert(error.error || "Failed to book session");
          return;
        }

        router.push("/app/student/bookings");
      } catch (error) {
        console.error("Error booking:", error);
        alert("Failed to book session");
      }
    } else if (selectedType === "custom" && selectedCustomOffering) {
      // Custom offering - create checkout
      const offering = coach.customOfferings?.find((o: any) => o.id === selectedCustomOffering);
      if (!offering) {
        alert("Selected offering not found");
        return;
      }

      try {
        const response = await fetch("/api/checkout/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coachId,
            sessionMinutes: offering.durationMinutes,
            scheduledStart: scheduledStart.toISOString(),
            scheduledEnd: scheduledEnd.toISOString(),
            bookingType: "paid",
            userId: user.uid,
            customOfferingId: offering.id,
            priceCents: offering.priceCents,
            timeZone: coachTimezone,
            bufferMinutes: offering.bufferMinutes || 0,
          }),
        });

        const { checkoutUrl } = await response.json();
        window.location.href = checkoutUrl;
      } catch (error) {
        console.error("Error creating checkout:", error);
        alert("Failed to start checkout");
      }
    } else {
      // Paid session - create checkout
      try {
        const response = await fetch("/api/checkout/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coachId,
            sessionMinutes: selectedMinutes,
            scheduledStart: scheduledStart.toISOString(),
            scheduledEnd: scheduledEnd.toISOString(),
            bookingType: "paid",
            userId: user.uid,
            timeZone: coachTimezone,
            bufferMinutes: bufferMinutes,
          }),
        });

        const { checkoutUrl } = await response.json();
        window.location.href = checkoutUrl;
      } catch (error) {
        console.error("Error creating checkout:", error);
        alert("Failed to start checkout");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Coach not found</div>
      </div>
    );
  }

  const price30 = coach.sessionOffers?.paid?.find((p: { minutes: number; priceCents: number }) => p.minutes === 30)?.priceCents 
    ? coach.sessionOffers.paid.find((p: { minutes: number; priceCents: number }) => p.minutes === 30)!.priceCents / 100 
    : 0;
  const price60 = coach.sessionOffers?.paid?.find((p: { minutes: number; priceCents: number }) => p.minutes === 60)?.priceCents 
    ? coach.sessionOffers.paid.find((p: { minutes: number; priceCents: number }) => p.minutes === 60)!.priceCents / 100 
    : 0;

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Book a Session</h1>

        <GradientCard className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl font-bold">{coach.displayName}</h2>
            {coach.isVerified && <BadgeVerified />}
          </div>
          <p className="text-gray-400">{coach.headline}</p>
        </GradientCard>

        <GradientCard>
          <h3 className="text-xl font-bold mb-4">Session Type</h3>
          <div className="space-y-3 mb-6">
            {coach.sessionOffers?.freeIntroEnabled && (
              <button
                onClick={() => setSelectedType("free_intro")}
                className={`
                  w-full p-4 rounded-lg border-2 text-left transition-all
                  ${selectedType === "free_intro"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-600 hover:border-gray-500"
                  }
                `}
              >
                <div className="font-semibold">Free Intro Consultation</div>
                <div className="text-sm text-gray-400">{coach.sessionOffers.freeIntroMinutes} minutes</div>
              </button>
            )}
            {price30 > 0 && (
              <button
                onClick={() => {
                  setSelectedType("paid");
                  setSelectedMinutes(30);
                }}
                className={`
                  w-full p-4 rounded-lg border-2 text-left transition-all
                  ${selectedType === "paid" && selectedMinutes === 30
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-600 hover:border-gray-500"
                  }
                `}
              >
                <div className="font-semibold">30-minute Session</div>
                <div className="text-sm text-gray-400">${price30}</div>
              </button>
            )}
            {price60 > 0 && (
              <button
                onClick={() => {
                  setSelectedType("paid");
                  setSelectedMinutes(60);
                  setSelectedCustomOffering(null);
                }}
                className={`
                  w-full p-4 rounded-lg border-2 text-left transition-all
                  ${selectedType === "paid" && selectedMinutes === 60 && !selectedCustomOffering
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-600 hover:border-gray-500"
                  }
                `}
              >
                <div className="font-semibold">60-minute Session</div>
                <div className="text-sm text-gray-400">${price60}</div>
              </button>
            )}
            {/* Custom Offerings */}
            {coach.customOfferings && coach.customOfferings.filter((o: any) => o.isActive && !o.isFree).length > 0 && (
              <>
                <div className="text-sm text-gray-400 mt-4 mb-2">Custom Offerings</div>
                {coach.customOfferings
                  .filter((o: any) => o.isActive && !o.isFree)
                  .map((offering: any) => (
                    <button
                      key={offering.id}
                      onClick={() => {
                        setSelectedType("custom");
                        setSelectedCustomOffering(offering.id);
                        setSelectedMinutes(offering.durationMinutes);
                      }}
                      className={`
                        w-full p-4 rounded-lg border-2 text-left transition-all
                        ${selectedType === "custom" && selectedCustomOffering === offering.id
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-gray-600 hover:border-gray-500"
                        }
                      `}
                    >
                      <div className="font-semibold">{offering.name}</div>
                      <div className="text-sm text-gray-400">
                        {offering.durationMinutes} minutes • ${(offering.priceCents / 100).toFixed(2)}
                      </div>
                      {offering.description && (
                        <div className="text-xs text-gray-500 mt-1">{offering.description}</div>
                      )}
                    </button>
                  ))}
              </>
            )}
          </div>

          <div className="space-y-6">
            {/* Enhanced Calendar UI */}
            <div>
              <label className="block text-sm font-medium mb-4">Select Date</label>
              <BookingCalendar
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedTime(""); // Reset time when date changes
                }}
                coachTimezone={coach?.timezone}
                minDate={new Date()}
                maxDate={addDays(new Date(), 90)} // Allow booking up to 90 days ahead
              />
            </div>

            {/* Fallback date picker (mobile-friendly) */}
            <div className="md:hidden">
              <label className="block text-sm font-medium mb-2">Or pick a date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTime("");
                }}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
              />
            </div>

            {selectedDate && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium">Available Times</label>
                  {coach?.timezone && (
                    <span className="text-xs text-gray-400">
                      Times in {Intl.DateTimeFormat(undefined, { timeZone: coach.timezone || "UTC", timeZoneName: "short" }).formatToParts(new Date()).find(part => part.type === "timeZoneName")?.value || coach.timezone}
                    </span>
                  )}
                </div>
                {availableSlots.length === 0 ? (
                  <div className="bg-gray-800/30 border-2 border-gray-700 rounded-lg p-6 text-center">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-gray-400 mb-1">
                      No available slots for this date
                    </p>
                    <p className="text-xs text-gray-500">
                      Please select another date
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <motion.button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                          px-4 py-3 rounded-lg border-2 transition-all text-sm font-medium
                          ${selectedTime === slot
                            ? "border-blue-500 bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/20"
                            : "border-gray-600 hover:border-gray-500 text-gray-300 hover:bg-gray-800/50"
                          }
                        `}
                      >
                        {slot}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6">
            <GlowButton
              variant="primary"
              size="lg"
              className="w-full"
              glowColor="orange"
              onClick={handleBook}
            >
              {selectedType === "free_intro" 
                ? "Book Free Intro" 
                : selectedType === "custom"
                ? "Continue to Payment"
                : "Continue to Payment"}
            </GlowButton>
          </div>
        </GradientCard>
      </div>
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    }>
      <NewBookingPageContent />
    </Suspense>
  );
}

