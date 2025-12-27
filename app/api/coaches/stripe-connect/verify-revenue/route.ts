import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getPurchases, getCoachData } from "@/lib/firebase/firestore";
import { where } from "firebase/firestore";
import { getUserData } from "@/lib/firebase/firestore";
import { getStripeSecretKey } from "@/lib/config/stripe";

function getStripe() {
  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    throw new Error("Stripe secret key is not configured. Please set STRIPE_SECRET_KEY_TEST/LIVE or STRIPE_SECRET_KEY environment variables.");
  }
  return new Stripe(secretKey, {
    apiVersion: "2023-10-16",
  });
}

export async function POST(request: NextRequest) {
  try {
    const { coachId } = await request.json();

    if (!coachId) {
      return NextResponse.json({ error: "Coach ID required" }, { status: 400 });
    }

    // Get user data to verify (coachId should be the userId)
    const userData = await getUserData(coachId);
    if (!userData || userData.role !== "coach") {
      return NextResponse.json({ error: "Unauthorized - coach not found" }, { status: 403 });
    }

    const coach = await getCoachData(coachId);
    if (!coach?.stripeConnectAccountId) {
      return NextResponse.json({ 
        error: "No Stripe Connect account found",
        hasAccount: false 
      }, { status: 400 });
    }

    const stripe = getStripe();

    // Get all purchases from Firestore for this coach
    const firestorePurchases = await getPurchases([
      where("coachId", "==", coachId),
      where("status", "==", "paid"),
    ]);

    // Get payment intents from Stripe for this coach
    // We'll search through payment intents and filter by metadata.coachId
    // Note: Stripe doesn't support filtering by metadata in list, so we fetch and filter
    const coachPaymentIntents: Stripe.PaymentIntent[] = [];
    let hasMore = true;
    let startingAfter: string | undefined = undefined;

    // Paginate through all payment intents to find ones for this coach
    while (hasMore) {
      const params: Stripe.PaymentIntentListParams = {
        limit: 100,
      };
      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const paymentIntents = await stripe.paymentIntents.list(params);
      
      // Filter for this coach's payment intents
      const coachPIs = paymentIntents.data.filter(
        (pi) => pi.metadata?.coachId === coachId && pi.status === "succeeded"
      );
      coachPaymentIntents.push(...coachPIs);

      hasMore = paymentIntents.has_more;
      if (hasMore && paymentIntents.data.length > 0) {
        startingAfter = paymentIntents.data[paymentIntents.data.length - 1].id;
      } else {
        hasMore = false;
      }

      // Safety limit - don't fetch more than 1000 payment intents
      if (coachPaymentIntents.length >= 1000) {
        break;
      }
    }

    // Compare Firestore purchases with Stripe payment intents
    const verificationResults = {
      totalFirestorePurchases: firestorePurchases.length,
      totalStripePayments: coachPaymentIntents.length,
      matched: [] as any[],
      missingInFirestore: [] as any[],
      missingInStripe: [] as any[],
      discrepancies: [] as any[],
    };

    // Create a map of Stripe payment intent IDs
    const stripePaymentMap = new Map(
      coachPaymentIntents.map((pi) => [pi.id, pi])
    );

    // Create a map of Firestore purchases by Stripe payment intent ID
    const firestorePurchaseMap = new Map(
      firestorePurchases.map((p) => [p.stripePaymentIntentId, p])
    );

    // Check each Firestore purchase against Stripe
    for (const purchase of firestorePurchases) {
      if (!purchase.stripePaymentIntentId) {
        verificationResults.missingInStripe.push({
          purchaseId: purchase.id,
          reason: "No Stripe payment intent ID",
        });
        continue;
      }

      const stripePayment = stripePaymentMap.get(purchase.stripePaymentIntentId);
      if (!stripePayment) {
        verificationResults.missingInStripe.push({
          purchaseId: purchase.id,
          stripePaymentIntentId: purchase.stripePaymentIntentId,
          amountCents: purchase.amountCents,
          reason: "Payment intent not found in Stripe",
        });
        continue;
      }

      // Verify amounts match
      const stripeAmount = stripePayment.amount;
      const firestoreAmount = purchase.amountCents;

      if (stripeAmount !== firestoreAmount) {
        verificationResults.discrepancies.push({
          purchaseId: purchase.id,
          stripePaymentIntentId: purchase.stripePaymentIntentId,
          firestoreAmount,
          stripeAmount,
          difference: firestoreAmount - stripeAmount,
        });
      } else {
        verificationResults.matched.push({
          purchaseId: purchase.id,
          stripePaymentIntentId: purchase.stripePaymentIntentId,
          amountCents: purchase.amountCents,
        });
      }
    }

    // Check for Stripe payments not in Firestore
    for (const paymentIntent of coachPaymentIntents) {
      if (!firestorePurchaseMap.has(paymentIntent.id)) {
        verificationResults.missingInFirestore.push({
          stripePaymentIntentId: paymentIntent.id,
          amountCents: paymentIntent.amount,
          created: new Date(paymentIntent.created * 1000).toISOString(),
          status: paymentIntent.status,
        });
      }
    }

    // Calculate summary
    const summary = {
      isVerified: 
        verificationResults.missingInFirestore.length === 0 &&
        verificationResults.missingInStripe.length === 0 &&
        verificationResults.discrepancies.length === 0,
      totalMatched: verificationResults.matched.length,
      totalDiscrepancies: 
        verificationResults.missingInFirestore.length +
        verificationResults.missingInStripe.length +
        verificationResults.discrepancies.length,
    };

    return NextResponse.json({
      success: true,
      summary,
      details: verificationResults,
      verifiedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("Error verifying revenue with Stripe:", error);
    return NextResponse.json(
      { 
        error: "Failed to verify revenue", 
        details: error.message 
      },
      { status: 500 }
    );
  }
}




