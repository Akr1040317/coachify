import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getCoachDataAdmin } from "@/lib/firebase/firestore-admin";
import { getStripeSecretKey } from "@/lib/config/stripe";

// Initialize Stripe with error handling
function getStripe(): Stripe | null {
  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    console.error("Stripe secret key is not set in environment variables");
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
      const secretKey = getStripeSecretKey();
      const mode = process.env.STRIPE_MODE || "test";
      return NextResponse.json({ 
        error: "Stripe is not configured. Please set Stripe secret key environment variables.",
        code: "STRIPE_NOT_CONFIGURED",
        details: {
          mode,
          hasSecretKey: !!secretKey,
          secretKeyLength: secretKey?.length || 0,
          envVars: {
            STRIPE_MODE: process.env.STRIPE_MODE,
            hasSTRIPE_SECRET_KEY_TEST: !!process.env.STRIPE_SECRET_KEY_TEST,
            hasSTRIPE_SECRET_KEY_LIVE: !!process.env.STRIPE_SECRET_KEY_LIVE,
            hasSTRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
          }
        }
      }, { status: 500 });
    }

    const { coachId } = await request.json();

    if (!coachId) {
      return NextResponse.json({ error: "Coach ID is required" }, { status: 400 });
    }

    // Get coach data with error handling
    let coach;
    try {
      coach = await getCoachDataAdmin(coachId);
    } catch (dbError: any) {
      console.error("Error fetching coach data:", dbError);
      return NextResponse.json({ 
        error: "Failed to fetch coach data",
        code: "DATABASE_ERROR",
        details: process.env.NODE_ENV === "development" ? {
          message: dbError.message,
          stack: dbError.stack
        } : undefined
      }, { status: 500 });
    }
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
    // Ensure HTTPS for production (Stripe requires HTTPS for live mode)
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    if (process.env.NODE_ENV === "production" && !baseUrl.startsWith("https://")) {
      // Default to production URL if not set
      baseUrl = "https://coachify-ed.vercel.app";
    }
    // Ensure HTTPS in production
    if (process.env.NODE_ENV === "production") {
      baseUrl = baseUrl.replace(/^http:/, "https:");
    }
    
    let accountLink;
    try {
      accountLink = await stripe.accountLinks.create({
        account: coach.stripeConnectAccountId,
        refresh_url: `${baseUrl}/app/coach/onboarding/stripe?refresh=true`,
        return_url: `${baseUrl}/app/coach/onboarding/stripe?stripe=success`,
        type: "account_onboarding",
      });
    } catch (stripeError: any) {
      console.error("Stripe accountLinks.create error:", stripeError);
      console.error("Error type:", stripeError.type);
      console.error("Error code:", stripeError.code);
      console.error("Error message:", stripeError.message);
      console.error("Account ID:", coach.stripeConnectAccountId);
      
      return NextResponse.json({ 
        error: "Failed to generate onboarding link",
        code: "STRIPE_ACCOUNT_LINK_ERROR",
        details: {
          stripeError: stripeError.message,
          stripeErrorType: stripeError.type,
          stripeErrorCode: stripeError.code,
          accountId: coach.stripeConnectAccountId,
          baseUrl,
          ...(process.env.NODE_ENV === "development" ? {
            fullError: stripeError.toString(),
            stack: stripeError.stack
          } : {})
        }
      }, { status: 500 });
    }

    return NextResponse.json({ 
      onboardingUrl: accountLink.url,
      success: true
    });
  } catch (error: any) {
    console.error("Error creating onboarding link:", error);
    console.error("Error stack:", error.stack);
    console.error("Error type:", error.type);
    console.error("Error code:", error.code);
    
    let errorMessage = "Failed to generate onboarding link";
    let errorCode = "STRIPE_ERROR";
    
    if (error.type === "StripeInvalidRequestError") {
      errorMessage = error.message || "Invalid request to Stripe";
      errorCode = "INVALID_REQUEST";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      code: errorCode,
      details: {
        message: error.message,
        type: error.type,
        code: error.code,
        ...(process.env.NODE_ENV === "development" ? {
          stack: error.stack,
          fullError: error.toString()
        } : {})
      }
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

    let coach;
    try {
      coach = await getCoachDataAdmin(coachId);
    } catch (dbError: any) {
      console.error("Error fetching coach data:", dbError);
      return NextResponse.json({ 
        hasAccount: false,
        status: "not_setup",
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        error: "Failed to fetch coach data",
        code: "DATABASE_ERROR",
        details: process.env.NODE_ENV === "development" ? dbError.message : undefined
      }, { status: 500 });
    }
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
    console.error("Error stack:", error.stack);
    console.error("Error type:", error.type);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    let errorMessage = "Failed to check account status";
    let errorCode = "STRIPE_ERROR";
    let statusCode = 500;
    
    if (error.type === "StripeInvalidRequestError") {
      errorMessage = error.message || "Invalid request to Stripe";
      errorCode = "INVALID_REQUEST";
      // If it's a resource_missing error, return not_setup instead of 500
      if (error.code === "resource_missing") {
        return NextResponse.json({ 
          hasAccount: false,
          status: "not_setup",
          chargesEnabled: false,
          payoutsEnabled: false,
          detailsSubmitted: false,
        });
      }
    } else if (error.code === "STRIPE_NOT_CONFIGURED") {
      errorCode = "STRIPE_NOT_CONFIGURED";
      statusCode = 503; // Service Unavailable
    }
    
    // Always return error details in production for debugging
    return NextResponse.json({ 
      hasAccount: false,
      status: "error",
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      error: errorMessage,
      code: errorCode,
      details: {
        message: error.message,
        type: error.type,
        code: error.code,
        ...(process.env.NODE_ENV === "development" ? {
          stack: error.stack,
          fullError: error.toString()
        } : {})
      }
    }, { status: statusCode });
  }
}


