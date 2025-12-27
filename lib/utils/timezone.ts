import { parseISO } from "date-fns";
import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";

/**
 * Timezone utilities for handling timezone conversions in the booking system
 */

/**
 * Get user's timezone (browser timezone)
 */
export function getUserTimezone(): string {
  if (typeof window !== "undefined") {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  return "UTC";
}

/**
 * Convert a date from one timezone to another
 */
export function convertTimezone(
  date: Date,
  fromTimezone: string,
  toTimezone: string
): Date {
  // Convert to UTC first, then to target timezone
  const utcDate = fromZonedTime(date, fromTimezone);
  return toZonedTime(utcDate, toTimezone);
}

/**
 * Format a date/time in a specific timezone
 */
export function formatInTimezone(
  date: Date | string,
  timezone: string,
  formatString: string = "PPpp"
): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return formatInTimeZone(dateObj, timezone, formatString);
}

/**
 * Convert coach availability slots to student's timezone
 * Takes coach's availability (in coach's timezone) and converts to student's timezone
 */
export function convertAvailabilityToStudentTimezone(
  availabilitySlots: Array<{
    dayOfWeek: number;
    startTime: string; // HH:mm format in coach's timezone
    endTime: string; // HH:mm format in coach's timezone
    isAvailable: boolean;
  }>,
  coachTimezone: string,
  studentTimezone: string
): Array<{
  dayOfWeek: number;
  startTime: string; // HH:mm format in student's timezone
  endTime: string; // HH:mm format in student's timezone
  isAvailable: boolean;
}> {
  // For weekly availability, we need to convert the time strings
  // This is a simplified conversion - for accurate conversion, we'd need a specific date
  return availabilitySlots.map((slot) => {
    if (!slot.isAvailable) {
      return slot;
    }

    // Create a reference date (today) to convert times
    const today = new Date();
    const referenceDate = new Date(today);
    referenceDate.setHours(0, 0, 0, 0);

    // Parse start and end times
    const [startHour, startMin] = slot.startTime.split(":").map(Number);
    const [endHour, endMin] = slot.endTime.split(":").map(Number);

    // Create date objects in coach's timezone
    const startDate = new Date(referenceDate);
    startDate.setHours(startHour, startMin, 0, 0);
    const endDate = new Date(referenceDate);
    endDate.setHours(endHour, endMin, 0, 0);

    // Convert to student's timezone
    const startInStudentTz = convertTimezone(startDate, coachTimezone, studentTimezone);
    const endInStudentTz = convertTimezone(endDate, coachTimezone, studentTimezone);

    return {
      dayOfWeek: slot.dayOfWeek,
      startTime: `${startInStudentTz.getHours().toString().padStart(2, "0")}:${startInStudentTz.getMinutes().toString().padStart(2, "0")}`,
      endTime: `${endInStudentTz.getHours().toString().padStart(2, "0")}:${endInStudentTz.getMinutes().toString().padStart(2, "0")}`,
      isAvailable: slot.isAvailable,
    };
  });
}

/**
 * Convert a time slot from coach's timezone to student's timezone for a specific date
 */
export function convertTimeSlotToStudentTimezone(
  date: Date,
  timeString: string, // HH:mm format in coach's timezone
  coachTimezone: string,
  studentTimezone: string
): string {
  const [hour, minute] = timeString.split(":").map(Number);
  const dateInCoachTz = new Date(date);
  dateInCoachTz.setHours(hour, minute, 0, 0);

  const dateInStudentTz = convertTimezone(dateInCoachTz, coachTimezone, studentTimezone);
  return `${dateInStudentTz.getHours().toString().padStart(2, "0")}:${dateInStudentTz.getMinutes().toString().padStart(2, "0")}`;
}

/**
 * Store booking time in UTC and return with timezone metadata
 */
export function storeBookingTime(
  date: Date,
  timeString: string, // HH:mm format
  timezone: string
): { utcDate: Date; timezone: string } {
  const [hour, minute] = timeString.split(":").map(Number);
  const localDate = new Date(date);
  localDate.setHours(hour, minute, 0, 0);

  // Convert to UTC
  const utcDate = fromZonedTime(localDate, timezone);

  return {
    utcDate,
    timezone,
  };
}

/**
 * Display booking time in user's local timezone
 */
export function displayBookingTime(
  utcDate: Date,
  userTimezone: string,
  formatString: string = "PPpp"
): string {
  return formatInTimeZone(utcDate, userTimezone, formatString);
}

/**
 * Get available time slots for a date, converting to student's timezone
 */
export function getAvailableSlotsInTimezone(
  date: Date,
  availabilitySlot: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  },
  coachTimezone: string,
  studentTimezone: string,
  slotDurationMinutes: number = 30
): string[] {
  if (!availabilitySlot.isAvailable) {
    return [];
  }

  const slots: string[] = [];
  const [startHour, startMin] = availabilitySlot.startTime.split(":").map(Number);
  const [endHour, endMin] = availabilitySlot.endTime.split(":").map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  // Generate slots in coach's timezone
  for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDurationMinutes) {
    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;
    const timeString = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;

    // Convert to student's timezone
    const convertedTime = convertTimeSlotToStudentTimezone(
      date,
      timeString,
      coachTimezone,
      studentTimezone
    );

    slots.push(convertedTime);
  }

  return slots;
}

