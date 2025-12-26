import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { 
  getCoachesEligibleForPayout, 
  processCoachPayout,
  getPendingPayoutAmount
} from "@/lib/firebase/payouts";
import { getCoachData, updateCoachData, getPurchases } from "@/lib/firebase/firestore";
import { PAYOUT_MINIMUM_CENTS } from "@/lib/config/payments";
import { Timestamp, where } from "firebase/firestore";
import { getStripeSecretKey } from "@/lib/config/stripe";

const stripe = new Stripe(getStripeSecretKey(), {
  apiVersion: "2023-10-16",
});

// Verify this is a cron request (add your cron secret)
const CRON_SECRET = process.env.CRON_SECRET || "";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret if provided
    const authHeader = request.headers.get("authorization");
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calculate payout period (last Monday to this Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday is day 1
    const lastMonday = new Date(now);
    lastMonday.setDate(now.getDate() - daysToLastMonday);
    lastMonday.setHours(0, 0, 0, 0);
    
    const payoutPeriodStart = new Date(lastMonday);
    payoutPeriodStart.setDate(lastMonday.getDate() - 7); // Previous Monday
    const payoutPeriodEnd = lastMonday;

    // Get all coaches eligible for payout
    const eligibleCoaches = await getCoachesEligibleForPayout(PAYOUT_MINIMUM_CENTS);

    const results = {
      processed: 0,
      failed: 0,
      totalAmount: 0,
      payouts: [] as Array<{ coachId: string; status: string; amount: number; error?: string }>,
    };

    // Process each coach's payout
    for (const coachPayout of eligibleCoaches) {
      try {
        // Get coach data to verify Stripe Connect account
        const coach = await getCoachData(coachPayout.coachId);
        if (!coach || !coach.stripeConnectAccountId) {
          results.failed++;
          results.payouts.push({
            coachId: coachPayout.coachId,
            status: "failed",
            amount: coachPayout.amountCents,
            error: "No Stripe Connect account",
          });
          continue;
        }

        // Verify account is active
        const account = await stripe.accounts.retrieve(coach.stripeConnectAccountId);
        if (!account.charges_enabled || !account.payouts_enabled) {
          results.failed++;
          results.payouts.push({
            coachId: coachPayout.coachId,
            status: "failed",
            amount: coachPayout.amountCents,
            error: "Stripe account not active",
          });
          continue;
        }

        // Calculate total platform fees from transactions in this period
        const purchases = await getPurchases([
          where("coachId", "==", coachPayout.coachId),
          where("status", "==", "paid"),
        ]);

        // Filter purchases in payout period and sum platform fees
        const periodPurchases = purchases.filter(p => {
          const purchaseDate = p.createdAt?.toDate();
          return purchaseDate && 
                 purchaseDate >= payoutPeriodStart && 
                 purchaseDate < payoutPeriodEnd;
        });

        const totalPlatformFees = periodPurchases.reduce((sum, p) => sum + (p.platformFeeCents || 0), 0);

        // Create transfer to coach's Stripe Connect account
        const transfer = await stripe.transfers.create({
          amount: coachPayout.amountCents,
          currency: "usd",
          destination: coach.stripeConnectAccountId,
          metadata: {
            coachId: coachPayout.coachId,
            payoutPeriod: `${payoutPeriodStart.toISOString()}-${payoutPeriodEnd.toISOString()}`,
            transactionCount: coachPayout.transactionIds.length.toString(),
          },
        });

        // Create payout record
        const payoutId = await processCoachPayout(
          coachPayout.coachId,
          transfer.id,
          payoutPeriodStart,
          payoutPeriodEnd,
          coachPayout.transactionIds
        );

        // Update transfer metadata with payoutId for webhook tracking
        await stripe.transfers.update(transfer.id, {
          metadata: {
            ...transfer.metadata,
            payoutId,
          },
        });

        // Update payout record with platform fees
        const { updatePayout } = await import("@/lib/firebase/firestore");
        await updatePayout(payoutId, {
          platformFeeCents: totalPlatformFees,
        });

        // Update coach's last payout date
        const nextPayoutDate = new Date(now);
        nextPayoutDate.setDate(now.getDate() + (7 - dayOfWeek + 1)); // Next Monday
        await updateCoachData(coachPayout.coachId, {
          lastPayoutDate: Timestamp.fromDate(now),
          nextPayoutDate: Timestamp.fromDate(nextPayoutDate),
        });

        results.processed++;
        results.totalAmount += coachPayout.amountCents;
        results.payouts.push({
          coachId: coachPayout.coachId,
          status: "success",
          amount: coachPayout.amountCents,
        });

      } catch (error: any) {
        console.error(`Error processing payout for coach ${coachPayout.coachId}:`, error);
        results.failed++;
        results.payouts.push({
          coachId: coachPayout.coachId,
          status: "failed",
          amount: coachPayout.amountCents,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      period: {
        start: payoutPeriodStart.toISOString(),
        end: payoutPeriodEnd.toISOString(),
      },
      ...results,
    });

  } catch (error: any) {
    console.error("Error processing payouts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


