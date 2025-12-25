import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getCoachData, updateCoachData, getUserData } from "@/lib/firebase/firestore";

// Initialize Stripe with error handling
function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error("STRIPE_SECRET_KEY is not set in environment variables");
    return null;
  }
  try {
    return new Stripe(secretKey, {
      apiVersion: "2023-10-16",
    });
  } catch (error) {
    console.error("Failed to initialize Stripe:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ 
        error: "Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.",
        code: "STRIPE_NOT_CONFIGURED"
      }, { status: 500 });
    }

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

    // Get user email from user document
    const userData = await getUserData(coachId);
    if (!userData || !userData.email) {
      return NextResponse.json({ 
        error: "User email not found. Please complete your profile.",
        code: "EMAIL_NOT_FOUND"
      }, { status: 400 });
    }

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: "express",
      country: "US", // Default to US, can be made dynamic based on coach location
      email: userData.email,
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
    console.error("Error stack:", error.stack);
    console.error("Error details:", JSON.stringify(error, null, 2));
    
    // Provide more specific error messages
    let errorMessage = "Failed to create Stripe Connect account";
    let errorCode = "STRIPE_ERROR";
    
    if (error.type === "StripeInvalidRequestError") {
      errorMessage = error.message || "Invalid request to Stripe";
      errorCode = "INVALID_REQUEST";
    } else if (error.type === "StripeAPIError") {
      errorMessage = "Stripe API error. Please try again later.";
      errorCode = "API_ERROR";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      code: errorCode,
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
      stripeError: process.env.NODE_ENV === "development" ? {
        type: error.type,
        code: error.code,
        declineCode: error.decline_code,
        param: error.param,
      } : undefined
    }, { status: 500 });
  }
}

