import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getCoachData, updateCoachData } from "@/lib/firebase/firestore";
import { onAuthChange } from "@/lib/firebase/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

export async function POST(request: NextRequest) {
  try {
    const { coachId } = await request.json();

    if (!coachId) {
      return NextResponse.json({ error: "Coach ID is required" }, { status: 400 });
    }

    // Get coach data
    const coach = await getCoachData(coachId);
    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    // Check if coach already has a Stripe Connect account
    if (coach.stripeConnectAccountId) {
      return NextResponse.json({ 
        error: "Stripe Connect account already exists",
        accountId: coach.stripeConnectAccountId 
      }, { status: 400 });
    }

    // Get user email from auth (you may need to pass this or fetch it)
    // For now, we'll use the coach's display name and create account
    const account = await stripe.accounts.create({
      type: "express",
      country: "US", // Default to US, can be made dynamic
      email: coach.userId, // You may want to get actual email from user document
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        coachId: coachId,
      },
    });

    // Store Stripe Connect account ID in coach document
    await updateCoachData(coachId, {
      stripeConnectAccountId: account.id,
      stripeConnectStatus: "pending",
    });

    // Create onboarding link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${baseUrl}/app/coach/onboarding/stripe?refresh=true`,
      return_url: `${baseUrl}/app/coach/onboarding/stripe?stripe=success`,
      type: "account_onboarding",
    });

    return NextResponse.json({ 
      onboardingUrl: accountLink.url,
      accountId: account.id,
      success: true
    });
  } catch (error: any) {
    console.error("Error creating Stripe Connect account:", error);
    
    // Provide more specific error messages
    let errorMessage = "Failed to create Stripe Connect account";
    let errorCode = "STRIPE_ERROR";
    
    if (error.type === "StripeInvalidRequestError") {
      errorMessage = error.message || "Invalid request to Stripe";
      errorCode = "INVALID_REQUEST";
    } else if (error.type === "StripeAPIError") {
      errorMessage = "Stripe API error. Please try again later.";
      errorCode = "API_ERROR";
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      code: errorCode,
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    }, { status: 500 });
  }
}

