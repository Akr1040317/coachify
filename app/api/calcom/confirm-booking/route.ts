import { NextRequest, NextResponse } from "next/server";
import { getBooking, updateBooking } from "@/lib/firebase/firestore";
import { calcomClient } from "@/lib/calcom/client";

/**
 * Confirm a booking in Cal.com after payment is successful
 * POST /api/calcom/confirm-booking
 */
export async function POST(request: NextRequest) {
  try {
    const { bookingId, calcomBookingId } = await request.json();

    if (!bookingId || !calcomBookingId) {
      return NextResponse.json(
        { error: "Missing bookingId or calcomBookingId" },
        { status: 400 }
      );
    }

    // Get booking from Firestore
    const booking = await getBooking(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Confirm booking in Cal.com
    const confirmedBooking = await calcomClient.confirmBooking(calcomBookingId);

    // Update booking in Firestore
    await updateBooking(bookingId, {
      status: "confirmed",
      paymentStatus: "paid",
      calcomBookingId: confirmedBooking.id,
    });

    return NextResponse.json({
      success: true,
      booking: confirmedBooking,
    });
  } catch (error: any) {
    console.error("Error confirming Cal.com booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to confirm booking" },
      { status: 500 }
    );
  }
}

