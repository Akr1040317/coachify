import { NextRequest, NextResponse } from "next/server";
import { getCourse, getCoachData } from "@/lib/firebase/firestore";
import { createConnectCheckoutSession } from "@/lib/firebase/payments";

export async function POST(request: NextRequest) {
  try {
    const { courseId, userId } = await request.json();

    if (!courseId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get course data
    const course = await getCourse(courseId);
    
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Get coach data to verify Stripe Connect account
    const coach = await getCoachData(course.coachId);
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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    // Create Stripe Connect checkout session with platform fee
    const checkoutSession = await createConnectCheckoutSession({
      amountCents: course.priceCents,
      currency: course.currency,
      coachId: course.coachId,
      productName: course.title,
      productDescription: course.description,
      successUrl: `${baseUrl}/app/student/library?success=true`,
      cancelUrl: `${baseUrl}/course/${courseId}?canceled=true`,
      metadata: {
        userId,
        courseId,
        coachId: course.coachId,
        type: "course",
      },
    });

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

