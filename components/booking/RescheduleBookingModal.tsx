"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { format } from "date-fns";
import { getEffectiveAvailability, calculateAvailableSlotsWithBuffers, isSlotAvailable } from "@/lib/utils/booking";
import { convertTimeSlotToStudentTimezone, getUserTimezone } from "@/lib/utils/timezone";

interface RescheduleBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    coachId: string;
    sessionMinutes: number;
    priceCents: number;
    customOfferingId?: string;
    bufferMinutes?: number;
  };
  coach: {
    availabilitySlots?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isAvailable: boolean;
    }>;
    availabilityOverrides?: Array<{
      date: string;
      isAvailable: boolean;
      startTime?: string;
      endTime?: string;
    }>;
    timezone?: string;
    timeZone?: string;
    customOfferings?: Array<{
      id: string;
      name: string;
      durationMinutes: number;
      priceCents: number;
      isActive: boolean;
      bufferMinutes?: number;
    }>;
  };
  existingBookings: Array<{
    id: string;
    scheduledStart: any;
    scheduledEnd: any;
    status: string;
    bufferMinutes?: number;
  }>;
  onConfirm: (newStartTime: string, newEndTime: string, reason: string, newOfferingId?: string) => Promise<void>;
}

export function RescheduleBookingModal({
  isOpen,
  onClose,
  booking,
  coach,
  existingBookings,
  onConfirm,
}: RescheduleBookingModalProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedOffering, setSelectedOffering] = useState<string | null>(
    booking.customOfferingId || null
  );
  const [priceDifference, setPriceDifference] = useState(0);

  const studentTimezone = getUserTimezone();
  const coachTimezone = coach.timezone || "America/New_York";

  useEffect(() => {
    if (isOpen) {
      // Set initial date to current booking date
      const currentDate = format(booking.scheduledStart, "yyyy-MM-dd");
      setSelectedDate(currentDate);
      setSelectedOffering(booking.customOfferingId || null);
    }
  }, [isOpen, booking]);

  useEffect(() => {
    if (selectedDate && coach) {
      const dateObj = new Date(selectedDate);
      const effectiveAvailability = getEffectiveAvailability(
        dateObj,
        coach.availabilitySlots || [],
        coach.availabilityOverrides
      );

      if (!effectiveAvailability || !effectiveAvailability.isAvailable) {
        setAvailableSlots([]);
        return;
      }

      // Get buffer minutes
      let bufferMinutes = booking.bufferMinutes || 0;
      if (selectedOffering && coach.customOfferings) {
        const offering = coach.customOfferings.find((o) => o.id === selectedOffering);
        bufferMinutes = offering?.bufferMinutes || 0;
      }

      // Filter out current booking
      const otherBookings = existingBookings.filter((b) => b.id !== booking.id);

      const slots = calculateAvailableSlotsWithBuffers(
        dateObj,
        {
          dayOfWeek: dateObj.getDay(),
          startTime: effectiveAvailability.startTime,
          endTime: effectiveAvailability.endTime,
          isAvailable: true,
        },
        otherBookings.map((b) => ({
          scheduledStart: b.scheduledStart,
          scheduledEnd: b.scheduledEnd,
          status: b.status,
          bufferMinutes: b.bufferMinutes,
        })),
        booking.sessionMinutes,
        bufferMinutes
      );

      // Convert to student timezone
      const slotsInStudentTz = slots.map((slot) =>
        convertTimeSlotToStudentTimezone(dateObj, slot, coachTimezone, studentTimezone)
      );

      setAvailableSlots(slotsInStudentTz);
    }
  }, [selectedDate, coach, existingBookings, selectedOffering, booking, coachTimezone, studentTimezone]);

  useEffect(() => {
    // Calculate price difference if offering changed
    if (selectedOffering && selectedOffering !== booking.customOfferingId && coach.customOfferings) {
      const newOffering = coach.customOfferings.find((o) => o.id === selectedOffering);
      if (newOffering) {
        setPriceDifference(newOffering.priceCents - booking.priceCents);
      }
    } else {
      setPriceDifference(0);
    }
  }, [selectedOffering, booking, coach]);

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) {
      alert("Please select a date and time");
      return;
    }

    setLoading(true);
    try {
      // Convert selected time back to UTC
      const dateObj = new Date(selectedDate);
      const [hour, minute] = selectedTime.split(":").map(Number);
      const dateInStudentTz = new Date(dateObj);
      dateInStudentTz.setHours(hour, minute, 0, 0);

      // Get duration from offering or booking
      let durationMinutes = booking.sessionMinutes;
      if (selectedOffering && coach.customOfferings) {
        const offering = coach.customOfferings.find((o) => o.id === selectedOffering);
        durationMinutes = offering?.durationMinutes || booking.sessionMinutes;
      }

      // Create dates in UTC
      const newStart = new Date(dateInStudentTz);
      const newEnd = new Date(newStart.getTime() + durationMinutes * 60 * 1000);

      await onConfirm(
        newStart.toISOString(),
        newEnd.toISOString(),
        reason,
        selectedOffering || undefined
      );
      setReason("");
      setSelectedDate("");
      setSelectedTime("");
      onClose();
    } catch (error) {
      console.error("Error rescheduling booking:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <GradientCard className="p-6 bg-[var(--card)] border-2 border-gray-700 shadow-2xl">
                <h2 className="text-2xl font-bold mb-4">Reschedule Booking</h2>

                <div className="space-y-4 mb-6">
                  <div className="bg-[var(--background)] p-3 rounded-lg">
                    <p className="text-sm text-gray-400 mb-1">Current Booking</p>
                    <p className="font-semibold">
                      {format(booking.scheduledStart, "EEEE, MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>

                  {/* Offering Selection */}
                  {coach.customOfferings && coach.customOfferings.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Session Type (optional - change to reschedule to different offering)
                      </label>
                      <select
                        value={selectedOffering || ""}
                        onChange={(e) => setSelectedOffering(e.target.value || null)}
                        className="w-full px-4 py-2 bg-[var(--background)] border border-gray-600 rounded-lg text-white"
                      >
                        <option value="">Keep current ({booking.sessionMinutes} min)</option>
                        {coach.customOfferings
                          .filter((o) => o.isActive)
                          .map((offering) => (
                            <option key={offering.id} value={offering.id}>
                              {offering.name} ({offering.durationMinutes} min) - $
                              {(offering.priceCents / 100).toFixed(2)}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* Date Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      New Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedTime("");
                      }}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-2 bg-[var(--background)] border border-gray-600 rounded-lg text-white"
                    />
                  </div>

                  {/* Time Selection */}
                  {selectedDate && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">
                        Available Times
                      </label>
                      {availableSlots.length === 0 ? (
                        <p className="text-sm text-gray-400 py-2">
                          No available slots for this date. Please select another date.
                        </p>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot}
                              onClick={() => setSelectedTime(slot)}
                              className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                                selectedTime === slot
                                  ? "border-blue-500 bg-blue-500/10 text-blue-400"
                                  : "border-gray-600 hover:border-gray-500 text-gray-300"
                              }`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Price Difference */}
                  {priceDifference !== 0 && (
                    <div
                      className={`p-3 rounded-lg ${
                        priceDifference < 0
                          ? "bg-green-500/10 border border-green-500/30"
                          : "bg-yellow-500/10 border border-yellow-500/30"
                      }`}
                    >
                      <p className="text-sm text-gray-400 mb-1">Price Change</p>
                      {priceDifference < 0 ? (
                        <p className="text-green-400 font-bold">
                          Refund: ${(Math.abs(priceDifference) / 100).toFixed(2)}
                        </p>
                      ) : (
                        <p className="text-yellow-400 font-bold">
                          Additional Payment Required: ${(priceDifference / 100).toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Reason for rescheduling (optional)
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Let us know why you're rescheduling..."
                      rows={2}
                      className="w-full px-4 py-2 bg-[var(--background)] border border-gray-600 rounded-lg text-white placeholder-gray-500 resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 px-4 py-2 border-2 border-gray-600 rounded-xl text-gray-300 hover:border-gray-500 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <GlowButton
                    variant="primary"
                    onClick={handleConfirm}
                    disabled={loading || !selectedDate || !selectedTime}
                    className="flex-1"
                  >
                    {loading ? "Rescheduling..." : "Reschedule Booking"}
                  </GlowButton>
                </div>
              </GradientCard>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}




