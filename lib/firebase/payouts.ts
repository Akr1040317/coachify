import { 
  getPendingPayout, 
  updatePendingPayout, 
  clearPendingPayout,
  createPayout,
  updatePayout,
  getPayouts,
  type PendingPayoutData,
  type PayoutData
} from "./firestore";
import { Timestamp } from "firebase/firestore";
import { PAYOUT_MINIMUM_CENTS } from "@/lib/config/payments";
import { setDoc } from "firebase/firestore";
import { db } from "./config";

/**
 * Add earnings to coach's pending payout balance
 */
export async function addToPendingPayout(
  coachId: string,
  amountCents: number,
  transactionId: string
): Promise<void> {
  const pending = await getPendingPayout(coachId);
  
  if (pending) {
    await updatePendingPayout(coachId, {
      amountCents: pending.amountCents + amountCents,
      transactionIds: [...pending.transactionIds, transactionId],
    });
  } else {
    if (!db) throw new Error("Firestore is not initialized");
    const { doc, collection, serverTimestamp } = await import("firebase/firestore");
    const docRef = doc(collection(db, "coach_pending_payouts"), coachId);
    await setDoc(docRef, {
      coachId,
      amountCents,
      transactionIds: [transactionId],
      lastUpdated: serverTimestamp(),
    });
  }
}

/**
 * Get coach's current pending payout amount
 */
export async function getPendingPayoutAmount(coachId: string): Promise<number> {
  const pending = await getPendingPayout(coachId);
  return pending?.amountCents || 0;
}

/**
 * Get all coaches eligible for payout (pending >= minimum)
 */
export interface CoachPayout {
  coachId: string;
  amountCents: number;
  transactionIds: string[];
}

export async function getCoachesEligibleForPayout(
  minimumCents: number = PAYOUT_MINIMUM_CENTS
): Promise<CoachPayout[]> {
  const { collection, getDocs, query, where } = await import("firebase/firestore");
  const { db } = await import("./config");
  
  if (!db) throw new Error("Firestore is not initialized");

  try {
    const q = query(
      collection(db, "coach_pending_payouts"),
      where("amountCents", ">=", minimumCents)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as PendingPayoutData;
      return {
        coachId: doc.id,
        amountCents: data.amountCents,
        transactionIds: data.transactionIds || [],
      };
    });
  } catch (error) {
    console.error("Error fetching eligible coaches:", error);
    return [];
  }
}

/**
 * Process payout for a single coach
 */
export async function processCoachPayout(
  coachId: string,
  transferId: string,
  payoutPeriodStart: Date,
  payoutPeriodEnd: Date,
  transactionIds: string[]
): Promise<string> {
  const pending = await getPendingPayout(coachId);
  if (!pending || pending.amountCents === 0) {
    throw new Error("No pending payout for coach");
  }

  // Calculate total platform fees from transactions
  // This would ideally be calculated from purchase records
  // For now, we'll store it as 0 and calculate later if needed
  const platformFeeCents = 0; // Will be calculated from purchases

  // Create payout record
  const payoutId = await createPayout({
    coachId,
    amountCents: pending.amountCents,
    platformFeeCents,
    transferId,
    status: "pending",
    payoutPeriodStart: Timestamp.fromDate(payoutPeriodStart),
    payoutPeriodEnd: Timestamp.fromDate(payoutPeriodEnd),
    transactionIds,
  });

  // Clear pending balance
  await clearPendingPayout(coachId);

  return payoutId;
}

/**
 * Update payout status (called from webhook)
 */
export async function updatePayoutStatus(
  payoutId: string,
  status: "paid" | "failed",
  failureReason?: string
): Promise<void> {
  const updateData: Partial<PayoutData> = {
    status,
    ...(status === "paid" && { paidAt: Timestamp.now() }),
    ...(failureReason && { failureReason }),
  };

  await updatePayout(payoutId, updateData);
}


