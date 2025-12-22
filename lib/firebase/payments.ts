import Stripe from "stripe";
import { getCoachData } from "./firestore";
import { calculatePlatformFee, calculateCoachEarnings } from "@/lib/config/payments";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

export interface CreatePaymentIntentParams {
  amountCents: number;
  currency: string;
  coachId: string;
  metadata: Record<string, string>;
}

/**
 * Verify that a coach has an active Stripe Connect account
 */
export async function verifyCoachStripeAccount(coachId: string): Promise<boolean> {
  try {
    const coach = await getCoachData(coachId);
    if (!coach || !coach.stripeConnectAccountId) {
      return false;
    }

    const account = await stripe.accounts.retrieve(coach.stripeConnectAccountId);
    return account.charges_enabled === true && account.payouts_enabled === true;
  } catch (error) {
    console.error("Error verifying Stripe account:", error);
    return false;
  }
}

/**
 * Create a Stripe Connect payment intent with platform fee
 */
export async function createConnectPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<Stripe.PaymentIntent> {
  const { amountCents, currency, coachId, metadata } = params;

  // Get coach and verify Stripe Connect account
  const coach = await getCoachData(coachId);
  if (!coach || !coach.stripeConnectAccountId) {
    throw new Error("Coach does not have a Stripe Connect account set up");
  }

  // Verify account is active
  const isActive = await verifyCoachStripeAccount(coachId);
  if (!isActive) {
    throw new Error("Coach Stripe Connect account is not active");
  }

  // Calculate platform fee
  const platformFeeCents = calculatePlatformFee(amountCents);
  const coachEarningsCents = calculateCoachEarnings(amountCents, platformFeeCents);

  // Create payment intent with application fee
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: currency.toLowerCase(),
    application_fee_amount: platformFeeCents,
    transfer_data: {
      destination: coach.stripeConnectAccountId,
    },
    metadata: {
      ...metadata,
      coachId,
      platformFeeCents: platformFeeCents.toString(),
      coachEarningsCents: coachEarningsCents.toString(),
    },
  });

  return paymentIntent;
}

/**
 * Create a Stripe Checkout session with Stripe Connect
 */
export async function createConnectCheckoutSession(params: {
  amountCents: number;
  currency: string;
  coachId: string;
  productName: string;
  productDescription: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
  const { amountCents, currency, coachId, productName, productDescription, successUrl, cancelUrl, metadata } = params;

  // Get coach and verify Stripe Connect account
  const coach = await getCoachData(coachId);
  if (!coach || !coach.stripeConnectAccountId) {
    throw new Error("Coach does not have a Stripe Connect account set up");
  }

  // Verify account is active
  const isActive = await verifyCoachStripeAccount(coachId);
  if (!isActive) {
    throw new Error("Coach Stripe Connect account is not active");
  }

  // Calculate platform fee
  const platformFeeCents = calculatePlatformFee(amountCents);
  const coachEarningsCents = calculateCoachEarnings(amountCents, platformFeeCents);

  // Create checkout session with payment intent data for Connect
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: productName,
            description: productDescription,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    payment_intent_data: {
      application_fee_amount: platformFeeCents,
      transfer_data: {
        destination: coach.stripeConnectAccountId,
      },
      metadata: {
        ...metadata,
        coachId,
        platformFeeCents: platformFeeCents.toString(),
        coachEarningsCents: coachEarningsCents.toString(),
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      ...metadata,
      coachId,
      platformFeeCents: platformFeeCents.toString(),
      coachEarningsCents: coachEarningsCents.toString(),
    },
  });

  return session;
}

