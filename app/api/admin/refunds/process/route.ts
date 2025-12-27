import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getUserData, getPurchase, updatePurchase, getPendingPayout, updatePendingPayout } from "@/lib/firebase/firestore";
import { PLATFORM_FEE_PERCENTAGE } from "@/lib/config/payments";
import { getStripeSecretKey } from "@/lib/config/stripe";

const stripe = new Stripe(getStripeSecretKey(), {
  apiVersion: "2023-10-16",
});

export async function POST(request: NextRequest) {
  try {
    const { userId, purchaseId, refundAmountCents, reason } = await request.json();

    // Verify admin access
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const userData = await getUserData(userId);
    if (!userData || userData.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get purchase record
    const purchase = await getPurchase(purchaseId);
    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    // Calculate refund amounts
    const refundAmount = refundAmountCents || purchase.amountCents; // Full refund if not specified
    const refundPercentage = refundAmount / purchase.amountCents;
    const reversedPlatformFee = Math.round(purchase.platformFeeCents * refundPercentage);
    const reversedCoachEarnings = Math.round(purchase.coachEarningsCents * refundPercentage);

    // Process refund through Stripe
    // If using payment intents, we need to refund the charge
    const paymentIntent = await stripe.paymentIntents.retrieve(purchase.stripePaymentIntentId);
    
    if (!paymentIntent.latest_charge) {
      return NextResponse.json({ error: "No charge found for payment intent" }, { status: 400 });
    }

    const chargeId = typeof paymentIntent.latest_charge === "string" 
      ? paymentIntent.latest_charge 
      : paymentIntent.latest_charge.id;

    // Create refund
    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount: refundAmount,
      reason: reason || "requested_by_customer",
      metadata: {
        purchaseId,
        reversedPlatformFee: reversedPlatformFee.toString(),
        reversedCoachEarnings: reversedCoachEarnings.toString(),
      },
    });

    // Deduct from coach's pending payout
    if (purchase.coachId && reversedCoachEarnings > 0) {
      const pending = await getPendingPayout(purchase.coachId);
      
      if (pending) {
        const newAmount = Math.max(0, pending.amountCents - reversedCoachEarnings);
        await updatePendingPayout(purchase.coachId, {
          amountCents: newAmount,
          transactionIds: pending.transactionIds.filter(id => id !== purchaseId),
        });
      }
    }

    // Update purchase status
    await updatePurchase(purchaseId, {
      status: refundAmount === purchase.amountCents ? "refunded" : "paid",
    });

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      refundAmount,
      reversedPlatformFee,
      reversedCoachEarnings,
    });

  } catch (error: any) {
    console.error("Error processing refund:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}





