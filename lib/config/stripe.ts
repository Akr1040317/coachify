/**
 * Stripe Configuration
 * Supports both test and live modes
 * 
 * Set STRIPE_MODE=test or STRIPE_MODE=live to switch modes
 * Defaults to test mode for safety
 */

// Trim whitespace and newlines from environment variables
const STRIPE_MODE = (process.env.STRIPE_MODE || "test").trim().toLowerCase();

// Determine which keys to use based on mode
const isTestMode = STRIPE_MODE === "test";

// Get the appropriate keys based on mode
export const getStripeSecretKey = (): string => {
  if (isTestMode) {
    const key = (process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY || "").trim();
    if (!key) {
      console.error("⚠️ STRIPE_SECRET_KEY_TEST not found. Mode:", STRIPE_MODE, "isTestMode:", isTestMode);
    }
    return key;
  } else {
    const key = (process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY || "").trim();
    if (!key) {
      console.error("⚠️ STRIPE_SECRET_KEY_LIVE not found. Mode:", STRIPE_MODE, "isTestMode:", isTestMode);
    }
    return key;
  }
};

export const getStripePublishableKey = (): string => {
  if (isTestMode) {
    return (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "").trim();
  } else {
    return (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "").trim();
  }
};

export const getStripeWebhookSecret = (): string => {
  if (isTestMode) {
    return (process.env.STRIPE_WEBHOOK_SECRET_TEST || process.env.STRIPE_WEBHOOK_SECRET || "").trim();
  } else {
    return (process.env.STRIPE_WEBHOOK_SECRET_LIVE || process.env.STRIPE_WEBHOOK_SECRET || "").trim();
  }
};

export const isStripeTestMode = (): boolean => isTestMode;

// Client-side publishable key (for use in browser)
// This is safe to expose - it's a public key
export const STRIPE_PUBLISHABLE_KEY = getStripePublishableKey();

// Log mode on server startup (server-side only)
if (typeof window === "undefined") {
  console.log(`🔧 Stripe Mode: ${isTestMode ? "TEST" : "LIVE"}`);
  console.log(`   Using keys: ${isTestMode ? "Test" : "Live"}`);
  
  // Warn if keys are missing
  const secretKey = getStripeSecretKey();
  const publishableKey = getStripePublishableKey();
  const webhookSecret = getStripeWebhookSecret();
  
  if (!secretKey) {
    console.warn("⚠️  WARNING: Stripe secret key is not configured!");
  }
  if (!publishableKey) {
    console.warn("⚠️  WARNING: Stripe publishable key is not configured!");
  }
  if (!webhookSecret) {
    console.warn("⚠️  WARNING: Stripe webhook secret is not configured!");
  }
}

