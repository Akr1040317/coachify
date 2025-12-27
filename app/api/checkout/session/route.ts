import { NextRequest, NextResponse } from "next/server";
import { getCoachData } from "@/lib/firebase/firestore";
import { createConnectCheckoutSession } from "@/lib/firebase/payments";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body. Expected JSON." },
        { status: 400 }
      );
    }

    const { coachId, sessionMinutes, scheduledStart, scheduledEnd, bookingType, userId, customOfferingId, priceCents, timeZone, bufferMinutes } = body;

    // Validate required fields
    if (!coachId || !scheduledStart || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: coachId, scheduledStart, and userId are required" },
        { status: 400 }
      );
    }

    // Validate scheduledStart is a valid date
    const startDate = new Date(scheduledStart);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid scheduledStart date format" },
        { status: 400 }
      );
    }

    // Validate scheduledStart is in the future
    if (startDate.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: "Scheduled start time must be in the future" },
        { status: 400 }
      );
    }

    // Get coach data to determine price
    let coach;
    try {
      coach = await getCoachData(coachId);
    } catch (coachError: any) {
      console.error("Error fetching coach data:", coachError);
      return NextResponse.json(
        { error: "Failed to fetch coach information" },
        { status: 500 }
      );
    }
    
    if (!coach) {
      return NextResponse.json(
        { error: "Coach not found" },
        { status: 404 }
      );
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
        return NextResponse.json(
          { error: "Custom offering not available" },
          { status: 400 }
        );
      }
      finalPriceCents = priceCents;
      finalMinutes = offering.durationMinutes;
      productName = `${offering.name} with ${coach.displayName}`;
      productDescription = offering.description || `${offering.durationMinutes}-minute custom session`;
    } else {
      // Standard session
      if (!sessionMinutes) {
        return NextResponse.json(
          { error: "Missing session minutes" },
          { status: 400 }
        );
      }
      const sessionOffer = coach.sessionOffers?.paid?.find(p => p.minutes === sessionMinutes);
      if (!sessionOffer) {
        return NextResponse.json(
          { error: "Session type not available" },
          { status: 400 }
        );
      }
      finalPriceCents = sessionOffer.priceCents;
      finalMinutes = sessionMinutes;
      productName = `Coaching Session with ${coach.displayName}`;
      productDescription = `${sessionMinutes}-minute ${bookingType || 'coaching'} session`;
    }

    // Validate price
    if (!finalPriceCents || finalPriceCents <= 0) {
      return NextResponse.json(
        { error: "Invalid price" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    // Create Stripe Connect checkout session with platform fee
    let checkoutSession;
    try {
      checkoutSession = await createConnectCheckoutSession({
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
          scheduledEnd: scheduledEnd || new Date(new Date(scheduledStart).getTime() + finalMinutes * 60 * 1000).toISOString(),
          bookingType: bookingType || 'session',
          type: "session",
          timeZone: timeZone || coach.timezone || "America/New_York",
          bufferMinutes: (bufferMinutes || 0).toString(),
          ...(customOfferingId && { customOfferingId }),
        },
      });
    } catch (stripeError: any) {
      console.error("Error creating Stripe checkout session:", stripeError);
      
      // Provide specific error messages for common Stripe errors
      if (stripeError.type === 'StripeInvalidRequestError') {
        return NextResponse.json(
          { error: stripeError.message || "Invalid payment request. Please check your information and try again." },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: stripeError.message || "Failed to create checkout session. Please try again." },
        { status: 500 }
      );
    }

    if (!checkoutSession || !checkoutSession.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session. No URL returned." },
        { status: 500 }
      );
    }

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (error: any) {
    console.error("Unexpected error creating checkout session:", error);
    
    // Handle specific error types
    if (error.name === "SyntaxError" || error.message?.includes("JSON")) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}


