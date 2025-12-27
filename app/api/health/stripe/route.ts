import { NextRequest, NextResponse } from "next/server";
import { getStripeSecretKey, getStripePublishableKey, getStripeWebhookSecret, isStripeTestMode } from "@/lib/config/stripe";
import { getAdminDb } from "@/lib/firebase/admin";
import Stripe from "stripe";

/**
 * Health check endpoint for Stripe and Firebase Admin configuration
 */
export async function GET(request: NextRequest) {
  const checks = {
    stripe: {
      configured: false,
      mode: process.env.STRIPE_MODE || "test",
      isTestMode: isStripeTestMode(),
      secretKey: {
        exists: false,
        length: 0,
        preview: null as string | null,
      },
      publishableKey: {
        exists: false,
        length: 0,
        preview: null as string | null,
      },
      webhookSecret: {
        exists: false,
        length: 0,
        preview: null as string | null,
      },
      canInitialize: false,
      error: null as string | null,
    },
    firebaseAdmin: {
      initialized: false,
      canAccessDb: false,
      error: null as string | null,
    },
  };

  // Check Stripe configuration
  try {
    const secretKey = getStripeSecretKey();
    const publishableKey = getStripePublishableKey();
    const webhookSecret = getStripeWebhookSecret();

    checks.stripe.secretKey.exists = !!secretKey;
    checks.stripe.secretKey.length = secretKey?.length || 0;
    checks.stripe.secretKey.preview = secretKey 
      ? `${secretKey.substring(0, 7)}...${secretKey.substring(secretKey.length - 4)}` 
      : null;

    checks.stripe.publishableKey.exists = !!publishableKey;
    checks.stripe.publishableKey.length = publishableKey?.length || 0;
    checks.stripe.publishableKey.preview = publishableKey 
      ? `${publishableKey.substring(0, 7)}...${publishableKey.substring(publishableKey.length - 4)}` 
      : null;

    checks.stripe.webhookSecret.exists = !!webhookSecret;
    checks.stripe.webhookSecret.length = webhookSecret?.length || 0;
    checks.stripe.webhookSecret.preview = webhookSecret 
      ? `${webhookSecret.substring(0, 7)}...${webhookSecret.substring(webhookSecret.length - 4)}` 
      : null;

    checks.stripe.configured = !!(secretKey && publishableKey && webhookSecret);

    // Try to initialize Stripe
    if (secretKey) {
      try {
        const stripe = new Stripe(secretKey, { apiVersion: "2023-10-16" });
        // Try a simple API call to verify the key works
        await stripe.balance.retrieve();
        checks.stripe.canInitialize = true;
      } catch (stripeError: any) {
        checks.stripe.canInitialize = false;
        checks.stripe.error = stripeError.message || "Failed to initialize Stripe";
      }
    }
  } catch (error: any) {
    checks.stripe.error = error.message || "Unknown error checking Stripe";
  }

  // Check Firebase Admin
  try {
    const adminDb = getAdminDb();
    checks.firebaseAdmin.initialized = !!adminDb;
    
    if (adminDb) {
      // Try a simple read operation
      try {
        const testRef = adminDb.collection("_health").doc("test");
        await testRef.get();
        checks.firebaseAdmin.canAccessDb = true;
      } catch (dbError: any) {
        // Even if the collection doesn't exist, if we got here, the DB is accessible
        checks.firebaseAdmin.canAccessDb = true;
      }
    } else {
      checks.firebaseAdmin.error = "Firebase Admin DB not initialized";
    }
  } catch (error: any) {
    checks.firebaseAdmin.error = error.message || "Unknown error checking Firebase Admin";
  }

  const allHealthy = checks.stripe.configured && checks.stripe.canInitialize && checks.firebaseAdmin.canAccessDb;

  return NextResponse.json({
    status: allHealthy ? "healthy" : "unhealthy",
    checks,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
  }, { 
    status: allHealthy ? 200 : 503 
  });
}


