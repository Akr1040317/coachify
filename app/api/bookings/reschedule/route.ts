import { NextRequest, NextResponse } from "next/server";
import { getBooking, updateBooking, getCoachData, getBookings } from "@/lib/firebase/firestore";
import { processRescheduleRefund, processBookingRefund } from "@/lib/firebase/refunds";
import { Timestamp, where } from "firebase/firestore";
import { isSlotAvailable } from "@/lib/utils/booking";

/**
 * Reschedule a booking
 * POST /api/bookings/reschedule
 */
export async function POST(request: NextRequest) {
  try {
    const { bookingId, newStartTime, newEndTime, reason, newOfferingId } = await request.json();

    if (!bookingId || !newStartTime || !newEndTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get booking
    const booking = await getBooking(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check if booking can be rescheduled
    if (booking.status === "cancelled" || booking.status === "completed") {
      return NextResponse.json(
        { error: "Cannot reschedule cancelled or completed bookings" },
        { status: 400 }
      );
    }

    const newStart = new Date(newStartTime);
    const newEnd = new Date(newEndTime);

    // Validate new times are in the future
    if (newStart < new Date()) {
      return NextResponse.json(
        { error: "New booking time must be in the future" },
        { status: 400 }
      );
    }

    // Get coach data
    const coach = await getCoachData(booking.coachId);
    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    // Get existing bookings to check availability
    const existingBookings = await getBookings([
      where("coachId", "==", booking.coachId),
      where("status", "in", ["requested", "confirmed"]),
    ]);

    // Filter out current booking
    const otherBookings = existingBookings.filter((b) => b.id !== bookingId);

    // Get buffer minutes
    let bufferMinutes = booking.bufferMinutes || 0;
    let newPriceCents = booking.priceCents;
    let newDurationMinutes = booking.sessionMinutes;

    // If offering changed, get new price and buffer
    if (newOfferingId && coach.customOfferings) {
      const newOffering = coach.customOfferings.find((o: any) => o.id === newOfferingId);
      if (newOffering) {
        newPriceCents = newOffering.priceCents;
        newDurationMinutes = newOffering.durationMinutes;
        bufferMinutes = newOffering.bufferMinutes || 0;
      }
    }

    // Validate slot availability with buffer times
    const slotAvailable = isSlotAvailable(
      newStart,
      newEnd,
      otherBookings.map((b) => ({
        scheduledStart: b.scheduledStart,
        scheduledEnd: b.scheduledEnd,
        status: b.status,
        bufferMinutes: b.bufferMinutes,
      })),
      bufferMinutes
    );

    if (!slotAvailable) {
      return NextResponse.json(
        { error: "Selected time slot is not available" },
        { status: 400 }
      );
    }

    // Calculate price difference
    const priceDifference = newPriceCents - booking.priceCents;
    let refundResult = null;

    // If price decreased, process refund
    if (priceDifference < 0) {
      try {
        refundResult = await processRescheduleRefund(bookingId, Math.abs(priceDifference));
      } catch (error: any) {
        console.error("Error processing refund for reschedule:", error);
        // Continue with reschedule even if refund fails
      }
    }

    // Update booking
    await updateBooking(bookingId, {
      scheduledStart: Timestamp.fromDate(newStart),
      scheduledEnd: Timestamp.fromDate(newEnd),
      sessionMinutes: newDurationMinutes,
      priceCents: newPriceCents,
      rescheduledAt: Timestamp.now(),
      rescheduleReason: reason,
      originalScheduledStart: booking.originalScheduledStart || booking.scheduledStart,
      bufferMinutes: bufferMinutes,
      ...(newOfferingId && { customOfferingId: newOfferingId }),
      ...(refundResult && {
        refundId: refundResult.id,
        refundAmountCents: refundResult.amount,
      }),
    });

    // Sync reschedule to Google Calendar if enabled
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/google-calendar/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action: "update" }),
      });
    } catch (error) {
      console.error("Error syncing reschedule to Google Calendar:", error);
      // Don't fail the reschedule if Google Calendar sync fails
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: bookingId,
        scheduledStart: newStart.toISOString(),
        scheduledEnd: newEnd.toISOString(),
        priceCents: newPriceCents,
      },
      refund: refundResult,
      priceDifference,
      message:
        priceDifference < 0 && refundResult
          ? `Booking rescheduled. Refund of $${((refundResult.amount || 0) / 100).toFixed(2)} processed for price difference.`
          : priceDifference > 0
          ? `Booking rescheduled. Additional payment of $${(priceDifference / 100).toFixed(2)} required.`
          : "Booking rescheduled successfully.",
    });
  } catch (error: any) {
    console.error("Error rescheduling booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reschedule booking" },
      { status: 500 }
    );
  }
}

