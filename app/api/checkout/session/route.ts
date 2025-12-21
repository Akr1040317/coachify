import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

export async function POST(request: NextRequest) {
  try {
    const { coachId, sessionMinutes, scheduledStart, bookingType } = await request.json();

    // Get coach data to determine price
    const { getCoachData } = await import("@/lib/firebase/firestore");
    const coach = await getCoachData(coachId);
    
    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    const sessionOffer = coach.sessionOffers?.paid?.find(p => p.minutes === sessionMinutes);
    if (!sessionOffer) {
      return NextResponse.json({ error: "Session type not available" }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Coaching Session with ${coach.displayName}`,
              description: `${sessionMinutes}-minute ${bookingType} session`,
            },
            unit_amount: sessionOffer.priceCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/app/student/bookings?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/coach/${coachId}?canceled=true`,
      metadata: {
        coachId,
        sessionMinutes: sessionMinutes.toString(),
        scheduledStart,
        bookingType,
      },
    });

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
