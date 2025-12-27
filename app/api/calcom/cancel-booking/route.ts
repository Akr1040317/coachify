import { NextRequest, NextResponse } from "next/server";
import { getBooking, updateBooking } from "@/lib/firebase/firestore";
import { calcomClient } from "@/lib/calcom/client";
import { createRefund } from "@/lib/firebase/payments";

/**
 * Cancel a booking and handle refund if needed
 * POST /api/calcom/cancel-booking
 */
export async function POST(request: NextRequest) {
  try {
    const { bookingId, reason, refundAmount, refundReason } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing bookingId" },
        { status: 400 }
      );
    }

    // Get booking from Firestore
    const booking = await getBooking(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Cancel booking in Cal.com
    if (booking.calcomBookingId) {
      try {
        await calcomClient.cancelBooking(booking.calcomBookingId, reason);
      } catch (error) {
        console.error("Error canceling Cal.com booking:", error);
        // Continue with local cancellation even if Cal.com fails
      }
    }

    // Handle refund if payment was made
    let refundResult = null;
    if (
      booking.paymentStatus === "paid" &&
      booking.stripePaymentIntentId &&
      refundAmount
    ) {
      try {
        refundResult = await createRefund({
          paymentIntentId: booking.stripePaymentIntentId,
          amountCents: refundAmount,
          reason: refundReason || "cancellation",
          metadata: {
            bookingId,
            coachId: booking.coachId,
            studentId: booking.studentId,
          },
        });
      } catch (error) {
        console.error("Error processing refund:", error);
        // Continue with cancellation even if refund fails
      }
    }

    // Update booking in Firestore
    await updateBooking(bookingId, {
      status: "cancelled",
      cancelledAt: new Date(),
      cancellationReason: reason,
      refundId: refundResult?.id,
    });

    return NextResponse.json({
      success: true,
      refund: refundResult,
    });
  } catch (error: any) {
    console.error("Error canceling booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel booking" },
      { status: 500 }
    );
  }
}

