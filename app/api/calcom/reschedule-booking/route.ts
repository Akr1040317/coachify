import { NextRequest, NextResponse } from "next/server";
import { getBooking, updateBooking } from "@/lib/firebase/firestore";
import { calcomClient } from "@/lib/calcom/client";
import { Timestamp } from "firebase/firestore";

/**
 * Reschedule a booking
 * POST /api/calcom/reschedule-booking
 */
export async function POST(request: NextRequest) {
  try {
    const { bookingId, newStartTime, newEndTime, refundDifference, reason } = await request.json();

    if (!bookingId || !newStartTime || !newEndTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get booking from Firestore
    const booking = await getBooking(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Reschedule booking in Cal.com
    let rescheduledBooking;
    if (booking.calcomBookingId) {
      try {
        const calcomBookingIdNum = typeof booking.calcomBookingId === 'string' 
          ? parseInt(booking.calcomBookingId, 10) 
          : booking.calcomBookingId;
        if (!isNaN(calcomBookingIdNum)) {
          rescheduledBooking = await calcomClient.rescheduleBooking(
            calcomBookingIdNum,
            newStartTime,
            newEndTime
          );
        }
      } catch (error) {
        console.error("Error rescheduling Cal.com booking:", error);
        // Continue with local reschedule even if Cal.com fails
      }
    }

    // Handle price difference refund if needed
    let refundResult = null;
    if (
      refundDifference &&
      refundDifference > 0 &&
      booking.paymentStatus === "paid" &&
      booking.stripePaymentIntentId
    ) {
      try {
        const { createRefund } = await import("@/lib/firebase/refunds");
        refundResult = await createRefund({
          paymentIntentId: booking.stripePaymentIntentId,
          amountCents: refundDifference,
          reason: reason || "reschedule_price_difference",
          metadata: {
            bookingId,
            originalStartTime: booking.scheduledStart.toISOString(),
            newStartTime,
          },
        });
      } catch (error) {
        console.error("Error processing refund for reschedule:", error);
      }
    }

    // Update booking in Firestore
    await updateBooking(bookingId, {
      scheduledStart: Timestamp.fromDate(new Date(newStartTime)),
      scheduledEnd: Timestamp.fromDate(new Date(newEndTime)),
      rescheduledAt: Timestamp.now(),
      rescheduleReason: reason,
      refundId: refundResult?.id,
      refundAmountCents: refundResult?.amount,
      calcomBookingId: rescheduledBooking?.id?.toString() || booking.calcomBookingId,
    });

    return NextResponse.json({
      success: true,
      booking: rescheduledBooking,
      refund: refundResult,
    });
  } catch (error: any) {
    console.error("Error rescheduling booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reschedule booking" },
      { status: 500 }
    );
  }
}


