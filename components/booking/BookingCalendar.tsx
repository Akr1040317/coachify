"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, isToday, isPast, addDays } from "date-fns";
import { getUserTimezone, formatInTimezone } from "@/lib/utils/timezone";
import { motion } from "framer-motion";

interface BookingCalendarProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  availableDates?: string[]; // Array of available date strings in YYYY-MM-DD format
  coachTimezone?: string;
  minDate?: Date;
  maxDate?: Date;
}

export function BookingCalendar({
  selectedDate,
  onDateSelect,
  availableDates = [],
  coachTimezone,
  minDate,
  maxDate,
}: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate ? new Date(selectedDate) : new Date()
  );

  const studentTimezone = getUserTimezone();
  const displayTimezone = coachTimezone || studentTimezone;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const isDateAvailable = (date: Date): boolean => {
    const dateStr = format(date, "yyyy-MM-dd");
    
    // If availableDates is provided, check against it
    if (availableDates.length > 0) {
      return availableDates.includes(dateStr);
    }
    
    // Otherwise check if date is in the future and within range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    if (checkDate < today) return false;
    if (minDate && checkDate < minDate) return false;
    if (maxDate && checkDate > maxDate) return false;
    
    return true;
  };

  const handleDateClick = (date: Date) => {
    if (!isDateAvailable(date)) return;
    const dateStr = format(date, "yyyy-MM-dd");
    onDateSelect(dateStr);
  };

  const selectedDateObj = selectedDate ? new Date(selectedDate) : null;

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-lg border-2 border-gray-600 hover:border-gray-500 transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <h3 className="text-xl font-bold">{format(currentMonth, "MMMM yyyy")}</h3>
          {coachTimezone && (
            <p className="text-xs text-gray-400 mt-1">
              Times shown in {Intl.DateTimeFormat(undefined, { timeZone: displayTimezone, timeZoneName: "short" }).formatToParts(new Date()).find(part => part.type === "timeZoneName")?.value || displayTimezone}
            </p>
          )}
        </div>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-lg border-2 border-gray-600 hover:border-gray-500 transition-colors"
          aria-label="Next month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Week day headers */}
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-gray-400 py-2"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, idx) => {
          const isCurrentMonthDay = isSameMonth(day, currentMonth);
          const isTodayDay = isToday(day);
          const isSelected = selectedDateObj && isSameDay(day, selectedDateObj);
          const isAvailable = isDateAvailable(day);
          const isPastDay = isPast(addDays(day, 1)); // Add 1 day to exclude today

          return (
            <motion.button
              key={idx}
              onClick={() => handleDateClick(day)}
              disabled={!isAvailable}
              whileHover={isAvailable ? { scale: 1.05 } : {}}
              whileTap={isAvailable ? { scale: 0.95 } : {}}
              className={`
                aspect-square p-2 rounded-lg border-2 transition-all text-sm font-medium
                ${!isCurrentMonthDay
                  ? "text-gray-600 border-gray-800 bg-gray-900/20 opacity-50 cursor-not-allowed"
                  : isSelected
                  ? "border-blue-500 bg-blue-500/20 text-blue-400 font-bold"
                  : isTodayDay
                  ? "border-blue-400/50 bg-blue-500/10 text-blue-300"
                  : isPastDay
                  ? "border-gray-800 bg-gray-900/30 text-gray-600 cursor-not-allowed"
                  : isAvailable
                  ? "border-gray-700 bg-gray-800/30 text-white hover:border-gray-600 hover:bg-gray-800/50 cursor-pointer"
                  : "border-gray-800 bg-gray-900/30 text-gray-600 cursor-not-allowed"
                }
              `}
            >
              {format(day, "d")}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-400 pt-4 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-500/20"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-blue-400/50 bg-blue-500/10"></div>
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-gray-700 bg-gray-800/30"></div>
          <span>Available</span>
        </div>
      </div>
    </div>
  );
}

