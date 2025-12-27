import { NextRequest, NextResponse } from "next/server";
import { getBooking, updateBooking } from "@/lib/firebase/firestore";
import { processBookingRefund } from "@/lib/firebase/refunds";
import { Timestamp } from "firebase/firestore";

/**
 * Cancel a booking and process refund if applicable
 * POST /api/bookings/cancel
 */
export async function POST(request: NextRequest) {
  try {
    const { bookingId, reason, cancelledBy } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing bookingId" },
        { status: 400 }
      );
    }

    // Get booking
    const booking = await getBooking(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check if already cancelled
    if (booking.status === "cancelled") {
      return NextResponse.json({ error: "Booking already cancelled" }, { status: 400 });
    }

    // Check if booking is in the past
    const bookingStart = booking.scheduledStart.toDate();
    if (bookingStart < new Date()) {
      return NextResponse.json(
        { error: "Cannot cancel past bookings" },
        { status: 400 }
      );
    }

    // Process refund
    let refundResult = null;
    try {
      refundResult = await processBookingRefund(bookingId, new Date());
    } catch (error: any) {
      console.error("Error processing refund:", error);
      // Continue with cancellation even if refund fails
    }

    // Update booking status
    await updateBooking(bookingId, {
      status: "cancelled",
      cancelledAt: Timestamp.now(),
      cancellationReason: reason,
      cancelledBy: cancelledBy || "student",
      refundId: refundResult?.id,
      refundAmountCents: refundResult?.amount,
    });

    return NextResponse.json({
      success: true,
      refund: refundResult,
      message: refundResult
        ? `Booking cancelled. Refund of $${((refundResult.amount || 0) / 100).toFixed(2)} processed.`
        : "Booking cancelled. No refund applicable based on cancellation policy.",
    });
  } catch (error: any) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel booking" },
      { status: 500 }
    );
  }
}

