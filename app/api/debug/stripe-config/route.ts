import { NextRequest, NextResponse } from "next/server";
import { getStripeSecretKey, getStripePublishableKey, getStripeWebhookSecret, isStripeTestMode } from "@/lib/config/stripe";

/**
 * Diagnostic endpoint to check Stripe configuration
 * Only available in development or with DEBUG=true
 */
export async function GET(request: NextRequest) {
  // Only allow in development or if DEBUG env var is set
  if (process.env.NODE_ENV === "production" && process.env.DEBUG !== "true") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const secretKey = getStripeSecretKey();
  const publishableKey = getStripePublishableKey();
  const webhookSecret = getStripeWebhookSecret();
  const mode = process.env.STRIPE_MODE || "test";
  const isTest = isStripeTestMode();

  return NextResponse.json({
    mode,
    isTestMode: isTest,
    keys: {
      secretKey: {
        exists: !!secretKey,
        length: secretKey?.length || 0,
        preview: secretKey ? `${secretKey.substring(0, 7)}...${secretKey.substring(secretKey.length - 4)}` : null,
      },
      publishableKey: {
        exists: !!publishableKey,
        length: publishableKey?.length || 0,
        preview: publishableKey ? `${publishableKey.substring(0, 7)}...${publishableKey.substring(publishableKey.length - 4)}` : null,
      },
      webhookSecret: {
        exists: !!webhookSecret,
        length: webhookSecret?.length || 0,
        preview: webhookSecret ? `${webhookSecret.substring(0, 7)}...${webhookSecret.substring(webhookSecret.length - 4)}` : null,
      },
    },
    environmentVariables: {
      STRIPE_MODE: process.env.STRIPE_MODE || "not set (defaults to 'test')",
      STRIPE_SECRET_KEY_TEST: process.env.STRIPE_SECRET_KEY_TEST ? "✓ Set" : "✗ Not set",
      STRIPE_SECRET_KEY_LIVE: process.env.STRIPE_SECRET_KEY_LIVE ? "✓ Set" : "✗ Not set",
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? "✓ Set (fallback)" : "✗ Not set",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST ? "✓ Set" : "✗ Not set",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE ? "✓ Set" : "✗ Not set",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? "✓ Set (fallback)" : "✗ Not set",
      STRIPE_WEBHOOK_SECRET_TEST: process.env.STRIPE_WEBHOOK_SECRET_TEST ? "✓ Set" : "✗ Not set",
      STRIPE_WEBHOOK_SECRET_LIVE: process.env.STRIPE_WEBHOOK_SECRET_LIVE ? "✓ Set" : "✗ Not set",
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? "✓ Set (fallback)" : "✗ Not set",
    },
    status: {
      configured: !!(secretKey && publishableKey && webhookSecret),
      message: !!(secretKey && publishableKey && webhookSecret) 
        ? "✓ Stripe is properly configured" 
        : "✗ Stripe is not fully configured - check missing keys above",
    },
  });
}

