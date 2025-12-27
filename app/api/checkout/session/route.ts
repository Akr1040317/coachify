import { NextRequest, NextResponse } from "next/server";
import { getCoachData } from "@/lib/firebase/firestore";
import { createConnectCheckoutSession } from "@/lib/firebase/payments";

export async function POST(request: NextRequest) {
  try {
    const { coachId, sessionMinutes, scheduledStart, bookingType, userId, customOfferingId, priceCents } = await request.json();

    if (!coachId || !scheduledStart || !userId) {
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

    // Handle custom offering
    let finalPriceCents: number;
    let finalMinutes: number;
    let productName: string;
    let productDescription: string;

    if (customOfferingId && priceCents) {
      const offering = coach.customOfferings?.find((o: any) => o.id === customOfferingId);
      if (!offering || !offering.isActive) {
        return NextResponse.json({ error: "Custom offering not available" }, { status: 400 });
      }
      finalPriceCents = priceCents;
      finalMinutes = offering.durationMinutes;
      productName = `${offering.name} with ${coach.displayName}`;
      productDescription = offering.description || `${offering.durationMinutes}-minute custom session`;
    } else {
      // Standard session
      if (!sessionMinutes) {
        return NextResponse.json({ error: "Missing session minutes" }, { status: 400 });
      }
      const sessionOffer = coach.sessionOffers?.paid?.find(p => p.minutes === sessionMinutes);
      if (!sessionOffer) {
        return NextResponse.json({ error: "Session type not available" }, { status: 400 });
      }
      finalPriceCents = sessionOffer.priceCents;
      finalMinutes = sessionMinutes;
      productName = `Coaching Session with ${coach.displayName}`;
      productDescription = `${sessionMinutes}-minute ${bookingType} session`;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    // Create Stripe Connect checkout session with platform fee
    const checkoutSession = await createConnectCheckoutSession({
      amountCents: finalPriceCents,
      currency: "usd",
      coachId,
      productName,
      productDescription,
      successUrl: `${baseUrl}/app/student/bookings?success=true`,
      cancelUrl: `${baseUrl}/coach/${coachId}?canceled=true`,
      metadata: {
        userId,
        coachId,
        sessionMinutes: finalMinutes.toString(),
        scheduledStart,
        bookingType,
        type: "session",
        ...(customOfferingId && { customOfferingId }),
      },
    });

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


