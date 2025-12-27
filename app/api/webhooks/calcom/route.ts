import { NextRequest, NextResponse } from "next/server";
import { getBooking, updateBooking, getCoachData } from "@/lib/firebase/firestore";
import { calcomClient } from "@/lib/calcom/client";

/**
 * Webhook handler for Cal.com events
 * POST /api/webhooks/calcom
 * 
 * Cal.com will send webhooks for:
 * - BOOKING_CREATED
 * - BOOKING_CONFIRMED
 * - BOOKING_CANCELLED
 * - BOOKING_RESCHEDULED
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (if Cal.com provides it)
    const signature = request.headers.get("calcom-signature");
    // TODO: Implement signature verification
    
    const payload = await request.json();
    const { triggerEvent, payload: eventPayload } = payload;

    console.log("Cal.com webhook received:", triggerEvent, eventPayload);

    switch (triggerEvent) {
      case "BOOKING_CREATED":
        // Booking was created in Cal.com
        // We already handle this in our create-booking endpoint
        break;

      case "BOOKING_CONFIRMED":
        // Booking was confirmed (payment successful)
        if (eventPayload?.booking?.id) {
          // Find booking by Cal.com booking ID
          // Update status to confirmed
          // This is handled by our confirm-booking endpoint after Stripe payment
        }
        break;

      case "BOOKING_CANCELLED":
        // Booking was cancelled in Cal.com
        if (eventPayload?.booking?.id) {
          // Find and update booking
          // Handle refund if needed
        }
        break;

      case "BOOKING_RESCHEDULED":
        // Booking was rescheduled in Cal.com
        if (eventPayload?.booking?.id) {
          // Find and update booking with new times
        }
        break;

      default:
        console.log("Unhandled Cal.com webhook event:", triggerEvent);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing Cal.com webhook:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}


