import Stripe from "stripe";
import { getStripeSecretKey } from "@/lib/config/stripe";
import { CANCELLATION_POLICY } from "@/lib/config/payments";
import { getBooking, updateBooking, getPurchases } from "@/lib/firebase/firestore";
import { where } from "firebase/firestore";

const stripe = new Stripe(getStripeSecretKey(), {
  apiVersion: "2023-10-16",
});

export interface RefundParams {
  paymentIntentId: string;
  amountCents: number;
  reason: string;
  metadata?: Record<string, string>;
}

export interface RefundResult {
  id: string;
  amount: number;
  status: string;
  reason?: string;
}

/**
 * Calculate refund amount based on cancellation policy
 */
export function calculateRefundAmount(
  bookingStartTime: Date,
  cancellationTime: Date,
  originalAmountCents: number,
  policy?: {
    hoursBeforeFullRefund: number;
    hoursBeforePartialRefund: number;
    partialRefundPercent: number;
  }
): { amountCents: number; reason: string } {
  const policyToUse = policy || {
    hoursBeforeFullRefund: CANCELLATION_POLICY.FULL_REFUND_HOURS,
    hoursBeforePartialRefund: CANCELLATION_POLICY.PARTIAL_REFUND_HOURS,
    partialRefundPercent: CANCELLATION_POLICY.PARTIAL_REFUND_PERCENT,
  };

  const hoursUntilBooking = (bookingStartTime.getTime() - cancellationTime.getTime()) / (1000 * 60 * 60);

  if (hoursUntilBooking >= policyToUse.hoursBeforeFullRefund) {
    // Full refund
    return {
      amountCents: originalAmountCents,
      reason: `Full refund - cancelled more than ${policyToUse.hoursBeforeFullRefund} hours before booking`,
    };
  } else if (hoursUntilBooking >= policyToUse.hoursBeforePartialRefund) {
    // Partial refund
    const refundAmount = Math.round(originalAmountCents * (policyToUse.partialRefundPercent / 100));
    return {
      amountCents: refundAmount,
      reason: `Partial refund (${policyToUse.partialRefundPercent}%) - cancelled ${policyToUse.hoursBeforePartialRefund}-${policyToUse.hoursBeforeFullRefund} hours before booking`,
    };
  } else {
    // No refund
    return {
      amountCents: 0,
      reason: `No refund - cancelled less than ${policyToUse.hoursBeforePartialRefund} hours before booking`,
    };
  }
}

/**
 * Create a refund via Stripe
 */
export async function createRefund(params: RefundParams): Promise<RefundResult> {
  const { paymentIntentId, amountCents, reason, metadata } = params;

  try {
    // Retrieve the payment intent to verify it exists
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      throw new Error(`Payment intent status is ${paymentIntent.status}, cannot refund`);
    }

    // Get the charge ID from the payment intent
    const charges = await stripe.charges.list({
      payment_intent: paymentIntentId,
      limit: 1,
    });

    if (charges.data.length === 0) {
      throw new Error("No charge found for payment intent");
    }

    const charge = charges.data[0];

    // Create the refund
    const refundParams: Stripe.RefundCreateParams = {
      charge: charge.id,
      amount: amountCents,
    };
    if (reason === "cancellation") {
      refundParams.reason = "requested_by_customer";
    }
    if (metadata) {
      refundParams.metadata = metadata;
    }
    const refund = await stripe.refunds.create(refundParams);

    return {
      id: refund.id,
      amount: refund.amount,
      status: refund.status || "pending",
      reason: refund.reason ?? undefined,
    };
  } catch (error: any) {
    console.error("Error creating refund:", error);
    throw new Error(`Failed to create refund: ${error.message}`);
  }
}

/**
 * Process refund for a booking cancellation
 */
export async function processBookingRefund(
  bookingId: string,
  cancellationTime: Date = new Date()
): Promise<RefundResult | null> {
  try {
    // Get booking
    const booking = await getBooking(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    // Check if booking was paid
    if (booking.type === "free_intro" || booking.priceCents === 0) {
      return null; // No refund needed for free bookings
    }

    // Get payment intent ID
    let paymentIntentId = booking.stripePaymentIntentId;
    
    // If not in booking, try to find in purchase record
    if (!paymentIntentId) {
      const purchases = await getPurchases([
        where("bookingId", "==", bookingId),
        where("status", "==", "paid"),
      ]);
      
      if (purchases.length > 0) {
        paymentIntentId = purchases[0].stripePaymentIntentId;
      }
    }

    if (!paymentIntentId) {
      console.warn("No payment intent found for booking, cannot process refund");
      return null;
    }

    // Calculate refund amount
    const bookingStartTime = booking.scheduledStart.toDate();
    const { amountCents, reason } = calculateRefundAmount(
      bookingStartTime,
      cancellationTime,
      booking.priceCents,
      booking.cancellationPolicy
    );

    if (amountCents === 0) {
      // No refund due to policy
      return null;
    }

    // Create refund
    const refund = await createRefund({
      paymentIntentId,
      amountCents,
      reason,
      metadata: {
        bookingId,
        coachId: booking.coachId,
        studentId: booking.studentId,
        cancellationReason: reason,
      },
    });

    // Update booking with refund info
    await updateBooking(bookingId, {
      refundId: refund.id,
      refundAmountCents: refund.amount,
    });

    return refund;
  } catch (error: any) {
    console.error("Error processing booking refund:", error);
    throw error;
  }
}

/**
 * Process partial refund for rescheduling (price difference)
 */
export async function processRescheduleRefund(
  bookingId: string,
  priceDifferenceCents: number
): Promise<RefundResult | null> {
  if (priceDifferenceCents <= 0) {
    return null; // No refund needed if price increased or stayed same
  }

  try {
    const booking = await getBooking(bookingId);
    if (!booking) {
      throw new Error("Booking not found");
    }

    let paymentIntentId = booking.stripePaymentIntentId;
    
    if (!paymentIntentId) {
      const purchases = await getPurchases([
        where("bookingId", "==", bookingId),
        where("status", "==", "paid"),
      ]);
      
      if (purchases.length > 0) {
        paymentIntentId = purchases[0].stripePaymentIntentId;
      }
    }

    if (!paymentIntentId) {
      throw new Error("No payment intent found for booking");
    }

    const refund = await createRefund({
      paymentIntentId,
      amountCents: priceDifferenceCents,
      reason: "reschedule_price_difference",
      metadata: {
        bookingId,
        reason: "Reschedule price difference refund",
      },
    });

    await updateBooking(bookingId, {
      refundId: refund.id,
      refundAmountCents: refund.amount,
    });

    return refund;
  } catch (error: any) {
    console.error("Error processing reschedule refund:", error);
    throw error;
  }
}

