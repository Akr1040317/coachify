import { Timestamp } from "firebase/firestore";
import { BookingData } from "@/lib/firebase/firestore";

/**
 * Booking utilities for validation and slot calculation
 */

/**
 * Check if a time slot is available considering buffer times
 */
export function isSlotAvailable(
  slotStart: Date,
  slotEnd: Date,
  existingBookings: Array<{
    scheduledStart: Timestamp;
    scheduledEnd: Timestamp;
    status: string;
    bufferMinutes?: number;
  }>,
  bufferMinutes: number = 0
): boolean {
  const now = new Date();

  // Can't book in the past
  if (slotStart < now) {
    return false;
  }

  // Check against existing bookings
  for (const booking of existingBookings) {
    // Skip cancelled bookings
    if (booking.status === "cancelled") {
      continue;
    }

    const bookingStart = booking.scheduledStart.toDate();
    const bookingEnd = booking.scheduledEnd.toDate();
    const bookingBuffer = booking.bufferMinutes || 0;

    // Calculate effective start and end times with buffers
    const effectiveBookingStart = new Date(bookingStart.getTime() - bookingBuffer * 60 * 1000);
    const effectiveBookingEnd = new Date(bookingEnd.getTime() + bookingBuffer * 60 * 1000);
    const effectiveSlotStart = new Date(slotStart.getTime() - bufferMinutes * 60 * 1000);
    const effectiveSlotEnd = new Date(slotEnd.getTime() + bufferMinutes * 60 * 1000);

    // Check for overlap
    if (
      (effectiveSlotStart >= effectiveBookingStart && effectiveSlotStart < effectiveBookingEnd) ||
      (effectiveSlotEnd > effectiveBookingStart && effectiveSlotEnd <= effectiveBookingEnd) ||
      (effectiveSlotStart <= effectiveBookingStart && effectiveSlotEnd >= effectiveBookingEnd)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate available time slots for a date considering buffer times
 */
export function calculateAvailableSlotsWithBuffers(
  date: Date,
  availabilitySlot: {
    dayOfWeek: number;
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    isAvailable: boolean;
  },
  existingBookings: Array<{
    scheduledStart: Timestamp;
    scheduledEnd: Timestamp;
    status: string;
    bufferMinutes?: number;
  }>,
  slotDurationMinutes: number = 30,
  bufferMinutes: number = 0
): string[] {
  if (!availabilitySlot.isAvailable) {
    return [];
  }

  const slots: string[] = [];
  const [startHour, startMin] = availabilitySlot.startTime.split(":").map(Number);
  const [endHour, endMin] = availabilitySlot.endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Generate slots
  for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDurationMinutes) {
    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;
    const timeString = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;

    // Create date objects for this slot
    const slotStart = new Date(date);
    slotStart.setHours(hour, min, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + slotDurationMinutes * 60 * 1000);

    // Check if slot is available considering buffers
    if (isSlotAvailable(slotStart, slotEnd, existingBookings, bufferMinutes)) {
      slots.push(timeString);
    }
  }

  return slots;
}

/**
 * Validate booking time slot
 */
export function validateBookingSlot(
  slotStart: Date,
  slotEnd: Date,
  existingBookings: Array<{
    scheduledStart: Timestamp;
    scheduledEnd: Timestamp;
    status: string;
    bufferMinutes?: number;
  }>,
  bufferMinutes: number = 0
): { valid: boolean; reason?: string } {
  const now = new Date();

  // Check if in the past
  if (slotStart < now) {
    return { valid: false, reason: "Cannot book in the past" };
  }

  // Check availability
  if (!isSlotAvailable(slotStart, slotEnd, existingBookings, bufferMinutes)) {
    return { valid: false, reason: "Time slot is not available" };
  }

  return { valid: true };
}

/**
 * Check if a date has availability overrides
 */
export function getDateAvailabilityOverride(
  date: Date,
  overrides?: Array<{
    date: string; // ISO date string
    isAvailable: boolean;
    startTime?: string;
    endTime?: string;
  }>
): {
  isAvailable: boolean;
  startTime?: string;
  endTime?: string;
} | null {
  if (!overrides || overrides.length === 0) {
    return null;
  }

  const dateString = date.toISOString().split("T")[0];
  const override = overrides.find((o) => o.date === dateString);

  if (!override) {
    return null;
  }

  return {
    isAvailable: override.isAvailable,
    startTime: override.startTime,
    endTime: override.endTime,
  };
}

/**
 * Merge weekly availability with date-specific overrides
 */
export function getEffectiveAvailability(
  date: Date,
  weeklyAvailability: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }>,
  overrides?: Array<{
    date: string;
    isAvailable: boolean;
    startTime?: string;
    endTime?: string;
  }>
): {
  isAvailable: boolean;
  startTime: string;
  endTime: string;
} | null {
  // Check for date-specific override first
  const override = getDateAvailabilityOverride(date, overrides);
  if (override) {
    if (!override.isAvailable) {
      return null;
    }
    // Use override times if provided, otherwise use weekly availability
    const dayOfWeek = date.getDay();
    const weeklySlot = weeklyAvailability.find((a) => a.dayOfWeek === dayOfWeek);
    
    return {
      isAvailable: true,
      startTime: override.startTime || weeklySlot?.startTime || "09:00",
      endTime: override.endTime || weeklySlot?.endTime || "17:00",
    };
  }

  // Use weekly availability
  const dayOfWeek = date.getDay();
  const weeklySlot = weeklyAvailability.find((a) => a.dayOfWeek === dayOfWeek);

  if (!weeklySlot || !weeklySlot.isAvailable) {
    return null;
  }

  return {
    isAvailable: true,
    startTime: weeklySlot.startTime,
    endTime: weeklySlot.endTime,
  };
}




