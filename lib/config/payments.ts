// Platform fee configuration
export const PLATFORM_FEE_PERCENTAGE = 0.20; // 20%
export const MINIMUM_PLATFORM_FEE_CENTS = 50; // $0.50 minimum

// Payout configuration
export const PAYOUT_SCHEDULE = "weekly"; // Monday payouts
export const PAYOUT_MINIMUM_CENTS = 2500; // $25 minimum payout
export const PAYOUT_DAY = 1; // Monday (0 = Sunday, 1 = Monday)

// Stripe Connect settings
export const STRIPE_CONNECT_TYPE = "express"; // Express accounts for coaches

// Helper functions
export function calculatePlatformFee(amountCents: number): number {
  return Math.max(
    Math.round(amountCents * PLATFORM_FEE_PERCENTAGE),
    MINIMUM_PLATFORM_FEE_CENTS
  );
}

export function calculateCoachEarnings(amountCents: number, platformFeeCents: number): number {
  return amountCents - platformFeeCents;
}

// Cancellation policy configuration
export const CANCELLATION_POLICY = {
  FULL_REFUND_HOURS: 24, // Full refund if cancelled >24h before
  PARTIAL_REFUND_HOURS: 2, // Partial refund if cancelled 2-24h before
  PARTIAL_REFUND_PERCENT: 50, // 50% refund
  NO_REFUND_HOURS: 2, // No refund if cancelled <2h before
};



