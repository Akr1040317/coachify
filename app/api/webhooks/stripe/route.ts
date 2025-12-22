import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { 
  createBooking, 
  createEnrollment, 
  createPurchase, 
  updateBooking, 
  getBooking,
  updateCoachData,
  getPurchases,
  where
} from "@/lib/firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { addToPendingPayout, updatePayoutStatus } from "@/lib/firebase/payouts";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      // Extract fee breakdown from metadata
      const platformFeeCents = parseInt(metadata?.platformFeeCents || "0");
      const coachEarningsCents = parseInt(metadata?.coachEarningsCents || "0");
      const coachId = metadata?.coachId || "";
      const userId = metadata?.userId || (session.customer as string);

      // Get payment intent to get the actual payment intent ID
      let paymentIntentId = "";
      if (session.payment_intent) {
        if (typeof session.payment_intent === "string") {
          paymentIntentId = session.payment_intent;
        } else {
          paymentIntentId = session.payment_intent.id;
        }
      }

      // Create purchase record with fee breakdown
      const purchaseId = await createPurchase({
        userId,
        coachId,
        type: metadata?.type === "course" ? "course" : "session",
        courseId: metadata?.courseId,
        bookingId: metadata?.bookingId,
        amountCents: session.amount_total || 0,
        platformFeeCents,
        coachEarningsCents,
        currency: session.currency || "usd",
        stripePaymentIntentId: paymentIntentId,
        stripeCheckoutSessionId: session.id,
        status: "paid",
        paidAt: Timestamp.now(),
      });

      // Add coach earnings to pending payout
      if (coachId && coachEarningsCents > 0) {
        await addToPendingPayout(coachId, coachEarningsCents, purchaseId);
      }

      // Handle course enrollment
      if (metadata?.type === "course" && metadata?.courseId) {
        await createEnrollment({
          userId,
          courseId: metadata.courseId,
          progress: {},
        });
      } 
      // Handle booking update or creation
      else if (metadata?.bookingId) {
        await updateBooking(metadata.bookingId, {
          status: "confirmed",
        });
      } else if (metadata?.coachId && metadata?.scheduledStart) {
        // Create booking for session
        const scheduledStart = Timestamp.fromDate(new Date(metadata.scheduledStart));
        const sessionMinutes = parseInt(metadata.sessionMinutes || "60");
        const scheduledEnd = Timestamp.fromDate(new Date(scheduledStart.toDate().getTime() + sessionMinutes * 60 * 1000));

        await createBooking({
          studentId: userId,
          coachId: metadata.coachId,
          type: "paid",
          sessionMinutes,
          priceCents: session.amount_total || 0,
          currency: session.currency || "usd",
          status: "confirmed",
          scheduledStart,
          scheduledEnd,
          stripeCheckoutSessionId: session.id,
        });
      }
    }

    // Handle payment_intent.succeeded
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      // Update purchase status if needed
      if (paymentIntent.metadata?.coachId) {
        // Purchase record should already be created, but verify status
        const purchases = await getPurchases([
          where("stripePaymentIntentId", "==", paymentIntent.id)
        ]);
        
        if (purchases.length > 0 && purchases[0].status !== "paid") {
          // This should already be handled by checkout.session.completed
          // But we can verify here
        }
      }
    }

    // Handle transfer.created
    if (event.type === "transfer.created") {
      const transfer = event.data.object as Stripe.Transfer;
      const coachId = transfer.metadata?.coachId;
      
      if (coachId && transfer.metadata?.payoutId) {
        // Payout record should already exist, just verify
        // The transfer ID will be linked when payout is created
      }
    }

    // Handle transfer.paid
    if (event.type === "transfer.paid") {
      const transfer = event.data.object as Stripe.Transfer;
      const payoutId = transfer.metadata?.payoutId;
      
      if (payoutId) {
        await updatePayoutStatus(payoutId, "paid");
      }
    }

    // Handle transfer.failed
    if (event.type === "transfer.failed") {
      const transfer = event.data.object as Stripe.Transfer;
      const payoutId = transfer.metadata?.payoutId;
      const coachId = transfer.metadata?.coachId;
      
      if (payoutId) {
        await updatePayoutStatus(payoutId, "failed", transfer.failure_message || "Transfer failed");
        
        // Add funds back to pending payout
        if (coachId && transfer.amount > 0) {
          await addToPendingPayout(coachId, transfer.amount, `failed-transfer-${transfer.id}`);
        }
      }
    }

    // Handle account.updated (Stripe Connect account status changes)
    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      const coachId = account.metadata?.coachId;
      
      if (coachId) {
        const status = account.charges_enabled && account.payouts_enabled && account.details_submitted
          ? "active"
          : account.charges_enabled === false || account.payouts_enabled === false
          ? "restricted"
          : "pending";
        
        await updateCoachData(coachId, {
          stripeConnectStatus: status,
        });
      }
    }

    // Handle charge.refunded
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;
      
      if (paymentIntentId) {
        // Find purchase record
        const purchases = await getPurchases([
          where("stripePaymentIntentId", "==", paymentIntentId)
        ]);
        
        if (purchases.length > 0) {
          const purchase = purchases[0];
          
          // Calculate refund amount (full or partial)
          const refundAmount = charge.amount_refunded;
          const refundPercentage = refundAmount / purchase.amountCents;
          
          // Reverse platform fee proportionally
          const reversedPlatformFee = Math.round(purchase.platformFeeCents * refundPercentage);
          const reversedCoachEarnings = Math.round(purchase.coachEarningsCents * refundPercentage);
          
          // Deduct from coach's pending payout
          if (purchase.coachId && reversedCoachEarnings > 0) {
            // Get current pending balance
            const { getPendingPayout } = await import("@/lib/firebase/firestore");
            const pending = await getPendingPayout(purchase.coachId);
            
            if (pending && pending.amountCents >= reversedCoachEarnings) {
              const { updatePendingPayout } = await import("@/lib/firebase/firestore");
              await updatePendingPayout(purchase.coachId, {
                amountCents: pending.amountCents - reversedCoachEarnings,
                transactionIds: pending.transactionIds.filter(id => id !== purchase.id),
              });
            }
          }
          
          // Update purchase status
          const { updatePurchase } = await import("@/lib/firebase/firestore");
          await updatePurchase(purchase.id, {
            status: refundAmount === purchase.amountCents ? "refunded" : "paid",
          });
        }
      }
    }

  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

