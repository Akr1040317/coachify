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
import { getUserTimezone, convertTimeSlotToStudentTimezone, storeBookingTime, displayBookingTime } from "@/lib/utils/timezone";
import { calculateAvailableSlotsWithBuffers, getEffectiveAvailability } from "@/lib/utils/booking";
import { startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, isToday, format as dateFnsFormat } from "date-fns";

// Calendar Component
function CalendarView({
  calendarDate,
  onCalendarDateChange,
  selectedDate,
  onDateSelect,
  coach,
  bookings,
  studentTimezone,
  selectedMinutes,
  selectedCustomOffering,
  coachTimezone,
}: {
  calendarDate: Date;
  onCalendarDateChange: (date: Date) => void;
  selectedDate: string;
  onDateSelect: (date: string) => void;
  coach: any;
  bookings: any[];
  studentTimezone: string;
  selectedMinutes: number;
  selectedCustomOffering: string | null;
  coachTimezone: string;
}) {
  const monthStart = startOfMonth(calendarDate);
  const monthEnd = endOfMonth(calendarDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getAvailableSlotsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    const effectiveAvailability = getEffectiveAvailability(
      date,
      coach.availabilitySlots || [],
      coach.availabilityOverrides
    );

    if (!effectiveAvailability || !effectiveAvailability.isAvailable) {
      return [];
    }

    let bufferMinutes = 0;
    if (selectedCustomOffering && coach.customOfferings) {
      const offering = coach.customOfferings.find((o: any) => o.id === selectedCustomOffering);
      bufferMinutes = offering?.bufferMinutes || 0;
    }

    const slots = calculateAvailableSlotsWithBuffers(
      date,
      {
        dayOfWeek: date.getDay(),
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

    return slots.length;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onCalendarDateChange(subMonths(calendarDate, 1))}
          className="p-2 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
        >
          ←
        </button>
        <h3 className="text-lg font-bold">{dateFnsFormat(calendarDate, "MMMM yyyy")}</h3>
        <button
          onClick={() => onCalendarDateChange(addMonths(calendarDate, 1))}
          className="p-2 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-400 py-1">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, calendarDate);
          const isCurrentDay = isToday(day);
          const dayString = day.toISOString().split("T")[0];
          const isSelected = selectedDate === dayString;
          const isPast = day < new Date() && !isToday(day);
          const availableSlots = getAvailableSlotsForDate(day);
          const hasAvailability = (typeof availableSlots === 'number' ? availableSlots : availableSlots.length) > 0 && !isPast && isCurrentMonth;

          return (
            <button
              key={idx}
              onClick={() => {
                if (!isPast && isCurrentMonth) {
                  onDateSelect(dayString);
                }
              }}
              disabled={isPast || !isCurrentMonth}
              className={`
                aspect-square p-1 rounded-lg border-2 text-sm transition-all
                ${isSelected
                  ? "border-blue-500 bg-blue-500/20 text-blue-400"
                  : isCurrentDay
                  ? "border-blue-500/50 bg-blue-500/10 text-blue-300"
                  : hasAvailability
                  ? "border-gray-600 bg-gray-800/30 text-white hover:border-gray-500 cursor-pointer"
                  : isPast || !isCurrentMonth
                  ? "border-gray-800 bg-gray-900/20 text-gray-600 cursor-not-allowed opacity-50"
                  : "border-gray-700 bg-gray-800/20 text-gray-500 cursor-not-allowed"
                }
              `}
            >
              <div className="text-xs">{dateFnsFormat(day, "d")}</div>
              {hasAvailability && (
                <div className="text-[10px] text-green-400 mt-0.5">{availableSlots} slots</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

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
    const coachTimezone = coach.timezone || coach.timeZone || "America/New_York";
    
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

    const coachTimezone = coach.timezone || coach.timeZone || "America/New_York";
    
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

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTime(""); // Reset time when date changes
                  }}
                  min={new Date().toISOString().split("T")[0]}
                  className="flex-1 px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white hover:border-gray-500 transition-colors"
                >
                  📅
                </button>
              </div>
              {coach && (
                <p className="text-xs text-gray-500 mt-1">
                  Your timezone: {studentTimezone} • Coach timezone: {coach.timezone || coach.timeZone || "America/New_York"}
                </p>
              )}
              
              {/* Visual Calendar */}
              {showCalendar && coach && (
                <div className="mt-4 p-4 bg-[var(--card)] border border-gray-600 rounded-lg">
                  <CalendarView
                    calendarDate={calendarDate}
                    onCalendarDateChange={setCalendarDate}
                    selectedDate={selectedDate}
                    onDateSelect={(date) => {
                      setSelectedDate(date);
                      setSelectedTime("");
                      setShowCalendar(false);
                    }}
                    coach={coach}
                    bookings={bookings}
                    studentTimezone={studentTimezone}
                    selectedMinutes={selectedMinutes}
                    selectedCustomOffering={selectedCustomOffering}
                    coachTimezone={coach.timezone || coach.timeZone || "America/New_York"}
                  />
                </div>
              )}
            </div>

            {selectedDate && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Available Times ({studentTimezone})
                </label>
                {availableSlots.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4">
                    No available slots for this date. Please select another date.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`
                          px-3 py-2 rounded-lg border-2 transition-all text-sm
                          ${selectedTime === slot
                            ? "border-blue-500 bg-blue-500/10 text-blue-400"
                            : "border-gray-600 hover:border-gray-500 text-gray-300"
                          }
                        `}
                      >
                        {slot}
                      </button>
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

