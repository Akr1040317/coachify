import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getCoachDataAdmin } from "@/lib/firebase/firestore-admin";

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
    const coach = await getCoachDataAdmin(coachId);
    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    if (!coach.stripeConnectAccountId) {
      return NextResponse.json({ 
        error: "Stripe Connect account not found. Please create an account first.",
        code: "ACCOUNT_NOT_FOUND"
      }, { status: 404 });
    }

    // Create onboarding link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const accountLink = await stripe.accountLinks.create({
      account: coach.stripeConnectAccountId,
      refresh_url: `${baseUrl}/app/coach/onboarding/stripe?refresh=true`,
      return_url: `${baseUrl}/app/coach/onboarding/stripe?stripe=success`,
      type: "account_onboarding",
    });

    return NextResponse.json({ 
      onboardingUrl: accountLink.url,
      success: true
    });
  } catch (error: any) {
    console.error("Error creating onboarding link:", error);
    
    let errorMessage = "Failed to generate onboarding link";
    let errorCode = "STRIPE_ERROR";
    
    if (error.type === "StripeInvalidRequestError") {
      errorMessage = error.message || "Invalid request to Stripe";
      errorCode = "INVALID_REQUEST";
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      code: errorCode,
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    }, { status: 500 });
  }
}

// GET endpoint to check account status
export async function GET(request: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ 
        hasAccount: false,
        status: "not_setup",
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        error: "Stripe is not configured",
        code: "STRIPE_NOT_CONFIGURED"
      });
    }

    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get("coachId");

    if (!coachId) {
      return NextResponse.json({ error: "Coach ID is required" }, { status: 400 });
    }

    const coach = await getCoachData(coachId);
    if (!coach) {
      return NextResponse.json({ 
        hasAccount: false,
        status: "not_setup",
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      });
    }
    
    if (!coach.stripeConnectAccountId) {
      return NextResponse.json({ 
        hasAccount: false,
        status: "not_setup",
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      });
    }

    // Retrieve account details from Stripe
    let account;
    try {
      account = await stripe.accounts.retrieve(coach.stripeConnectAccountId);
    } catch (stripeError: any) {
      // If account doesn't exist in Stripe, return not_setup
      if (stripeError.type === "StripeInvalidRequestError" && stripeError.code === "resource_missing") {
        return NextResponse.json({ 
          hasAccount: false,
          status: "not_setup",
          chargesEnabled: false,
          payoutsEnabled: false,
          detailsSubmitted: false,
        });
      }
      // Re-throw other Stripe errors
      throw stripeError;
    }

    // Determine status
    let status: string;
    if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
      status = "active";
    } else if (account.charges_enabled === false || account.payouts_enabled === false) {
      status = "restricted";
    } else if (account.details_submitted) {
      status = "pending";
    } else {
      status = "pending";
    }

    // Get requirements if available
    let missingRequirements: string[] = [];
    try {
      const requirements = await stripe.accounts.retrieve(coach.stripeConnectAccountId, {
        expand: ["requirements"],
      });
      
      if (requirements.requirements) {
        const req = requirements.requirements;
        if (req.currently_due && req.currently_due.length > 0) {
          missingRequirements = req.currently_due;
        }
      }
    } catch (reqError) {
      // Requirements might not be available, that's okay
      console.warn("Could not fetch requirements:", reqError);
    }

    return NextResponse.json({
      hasAccount: true,
      status,
      chargesEnabled: account.charges_enabled || false,
      payoutsEnabled: account.payouts_enabled || false,
      detailsSubmitted: account.details_submitted || false,
      missingRequirements: missingRequirements.length > 0 ? missingRequirements : undefined,
    });
  } catch (error: any) {
    console.error("Error checking account status:", error);
    
    let errorMessage = "Failed to check account status";
    let errorCode = "STRIPE_ERROR";
    
    if (error.type === "StripeInvalidRequestError") {
      errorMessage = error.message || "Invalid request to Stripe";
      errorCode = "INVALID_REQUEST";
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      code: errorCode,
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    }, { status: 500 });
  }
}

