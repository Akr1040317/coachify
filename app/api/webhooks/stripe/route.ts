import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createBooking, createEnrollment, createPurchase, updateBooking, getBooking } from "@/lib/firebase/firestore";
import { Timestamp } from "firebase/firestore";

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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    try {
      // Create purchase record
      await createPurchase({
        userId: session.customer as string, // In production, store userId in metadata
        type: metadata?.type === "course" ? "course" : "session",
        courseId: metadata?.courseId,
        bookingId: metadata?.bookingId,
        amountCents: session.amount_total || 0,
        currency: session.currency || "usd",
        stripeCheckoutSessionId: session.id,
        status: "paid",
      });

      if (metadata?.type === "course" && metadata?.courseId) {
        // Create enrollment
        await createEnrollment({
          userId: session.customer as string,
          courseId: metadata.courseId,
          progress: {},
        });
      } else if (metadata?.bookingId) {
        // Update booking status
        await updateBooking(metadata.bookingId, {
          status: "confirmed",
        });
      } else if (metadata?.coachId && metadata?.scheduledStart) {
        // Create booking for session
        const scheduledStart = Timestamp.fromDate(new Date(metadata.scheduledStart));
        const sessionMinutes = parseInt(metadata.sessionMinutes || "60");
        const scheduledEnd = Timestamp.fromDate(new Date(scheduledStart.toDate().getTime() + sessionMinutes * 60 * 1000));

        await createBooking({
          studentId: session.customer as string,
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
    } catch (error) {
      console.error("Error processing webhook:", error);
      return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
