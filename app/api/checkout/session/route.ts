import { NextRequest, NextResponse } from "next/server";
import { getCoachData } from "@/lib/firebase/firestore";
import { createConnectCheckoutSession } from "@/lib/firebase/payments";

export async function POST(request: NextRequest) {
  try {
    const { coachId, sessionMinutes, scheduledStart, bookingType, userId } = await request.json();

    if (!coachId || !sessionMinutes || !scheduledStart || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get coach data to determine price
    const coach = await getCoachData(coachId);
    
    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    // Check if coach has Stripe Connect account set up
    if (!coach.stripeConnectAccountId) {
      return NextResponse.json({ 
        error: "Coach payment account not set up",
        requiresStripeSetup: true 
      }, { status: 400 });
    }

    const sessionOffer = coach.sessionOffers?.paid?.find(p => p.minutes === sessionMinutes);
    if (!sessionOffer) {
      return NextResponse.json({ error: "Session type not available" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    // Create Stripe Connect checkout session with platform fee
    const checkoutSession = await createConnectCheckoutSession({
      amountCents: sessionOffer.priceCents,
      currency: sessionOffer.currency || "usd",
      coachId,
      productName: `Coaching Session with ${coach.displayName}`,
      productDescription: `${sessionMinutes}-minute ${bookingType} session`,
      successUrl: `${baseUrl}/app/student/bookings?success=true`,
      cancelUrl: `${baseUrl}/coach/${coachId}?canceled=true`,
      metadata: {
        userId,
        coachId,
        sessionMinutes: sessionMinutes.toString(),
        scheduledStart,
        bookingType,
        type: "session",
      },
    });

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

