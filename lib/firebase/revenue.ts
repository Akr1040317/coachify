import { 
  getPurchases, 
  getPayouts,
} from "./firestore";
import { where, Timestamp } from "firebase/firestore";

export interface RevenueSummary {
  totalRevenue: number;
  platformFees: number;
  totalPayouts: number;
  pendingPayouts: number;
  transactionCount: number;
}

export interface CoachRevenueSummary {
  totalEarnings: number;
  platformFees: number;
  totalPayouts: number;
  pendingPayout: number;
  transactionCount: number;
}

export interface CoachRevenue {
  coachId: string;
  coachName: string;
  totalRevenue: number;
  platformFees: number;
  transactionCount: number;
}

export interface PeriodRevenue {
  date: string;
  revenue: number;
  platformFees: number;
  transactionCount: number;
}

/**
 * Get platform revenue summary for a date range
 */
export async function getPlatformRevenue(
  startDate: Date,
  endDate: Date
): Promise<RevenueSummary> {
  const purchases = await getPurchases([
    where("status", "==", "paid"),
    where("createdAt", ">=", Timestamp.fromDate(startDate)),
    where("createdAt", "<=", Timestamp.fromDate(endDate)),
  ]);

  const totalRevenue = purchases.reduce((sum, p) => sum + p.amountCents, 0);
  const platformFees = purchases.reduce((sum, p) => sum + (p.platformFeeCents || 0), 0);

  // Get payouts in period
  const payouts = await getPayouts([
    where("createdAt", ">=", Timestamp.fromDate(startDate)),
    where("createdAt", "<=", Timestamp.fromDate(endDate)),
    where("status", "==", "paid"),
  ]);

  const totalPayouts = payouts.reduce((sum, p) => sum + p.amountCents, 0);

  // Get pending payouts (from pending_payouts collection)
  const { collection, getDocs, query } = await import("firebase/firestore");
  const { db } = await import("./config");
  
  let pendingPayouts = 0;
  if (db) {
    try {
      const pendingQuery = query(collection(db, "coach_pending_payouts"));
      const pendingSnapshot = await getDocs(pendingQuery);
      pendingPayouts = pendingSnapshot.docs.reduce((sum, doc) => {
        const data = doc.data();
        return sum + (data.amountCents || 0);
      }, 0);
    } catch (error) {
      console.error("Error fetching pending payouts:", error);
    }
  }

  return {
    totalRevenue,
    platformFees,
    totalPayouts,
    pendingPayouts,
    transactionCount: purchases.length,
  };
}

/**
 * Get coach revenue summary
 */
export async function getCoachRevenue(
  coachId: string,
  startDate: Date,
  endDate: Date
): Promise<CoachRevenueSummary> {
  const purchases = await getPurchases([
    where("coachId", "==", coachId),
    where("status", "==", "paid"),
    where("createdAt", ">=", Timestamp.fromDate(startDate)),
    where("createdAt", "<=", Timestamp.fromDate(endDate)),
  ]);

  const totalEarnings = purchases.reduce((sum, p) => sum + (p.coachEarningsCents || 0), 0);
  const platformFees = purchases.reduce((sum, p) => sum + (p.platformFeeCents || 0), 0);

  const payouts = await getPayouts([
    where("coachId", "==", coachId),
    where("status", "==", "paid"),
    where("createdAt", ">=", Timestamp.fromDate(startDate)),
    where("createdAt", "<=", Timestamp.fromDate(endDate)),
  ]);

  const totalPayouts = payouts.reduce((sum, p) => sum + p.amountCents, 0);

  // Get pending payout
  const { getPendingPayout } = await import("./firestore");
  const pending = await getPendingPayout(coachId);
  const pendingPayout = pending?.amountCents || 0;

  return {
    totalEarnings,
    platformFees,
    totalPayouts,
    pendingPayout,
    transactionCount: purchases.length,
  };
}

/**
 * Get top coaches by revenue
 */
export async function getTopCoachesByRevenue(
  limit: number = 10,
  startDate?: Date,
  endDate?: Date
): Promise<CoachRevenue[]> {
  const constraints: any[] = [
    where("status", "==", "paid"),
  ];

  if (startDate && endDate) {
    constraints.push(
      where("createdAt", ">=", Timestamp.fromDate(startDate)),
      where("createdAt", "<=", Timestamp.fromDate(endDate))
    );
  }

  const purchases = await getPurchases(constraints);

  // Group by coach and calculate totals
  const coachMap = new Map<string, { revenue: number; fees: number; count: number; coachId: string }>();
  
  for (const purchase of purchases) {
    const existing = coachMap.get(purchase.coachId) || { revenue: 0, fees: 0, count: 0, coachId: purchase.coachId };
    coachMap.set(purchase.coachId, {
      revenue: existing.revenue + purchase.amountCents,
      fees: existing.fees + (purchase.platformFeeCents || 0),
      count: existing.count + 1,
      coachId: purchase.coachId,
    });
  }

  // Get coach names
  const { getCoachData } = await import("./firestore");
  const coachRevenues: CoachRevenue[] = await Promise.all(
    Array.from(coachMap.entries())
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, limit)
      .map(async ([coachId, data]) => {
        const coach = await getCoachData(coachId);
        return {
          coachId,
          coachName: coach?.displayName || "Unknown",
          totalRevenue: data.revenue,
          platformFees: data.fees,
          transactionCount: data.count,
        };
      })
  );

  return coachRevenues;
}

/**
 * Get revenue by period (daily/weekly/monthly)
 */
export async function getRevenueByPeriod(
  period: "daily" | "weekly" | "monthly",
  startDate: Date,
  endDate: Date
): Promise<PeriodRevenue[]> {
  const purchases = await getPurchases([
    where("status", "==", "paid"),
    where("createdAt", ">=", Timestamp.fromDate(startDate)),
    where("createdAt", "<=", Timestamp.fromDate(endDate)),
  ]);

  // Group by period
  const periodMap = new Map<string, { revenue: number; fees: number; count: number }>();

  for (const purchase of purchases) {
    const purchaseDate = purchase.createdAt?.toDate() || new Date();
    let periodKey: string;

    if (period === "daily") {
      periodKey = purchaseDate.toISOString().split("T")[0];
    } else if (period === "weekly") {
      const weekStart = new Date(purchaseDate);
      weekStart.setDate(purchaseDate.getDate() - purchaseDate.getDay() + 1); // Monday
      periodKey = weekStart.toISOString().split("T")[0];
    } else {
      periodKey = `${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, "0")}`;
    }

    const existing = periodMap.get(periodKey) || { revenue: 0, fees: 0, count: 0 };
    periodMap.set(periodKey, {
      revenue: existing.revenue + purchase.amountCents,
      fees: existing.fees + (purchase.platformFeeCents || 0),
      count: existing.count + 1,
    });
  }

  return Array.from(periodMap.entries())
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
      platformFees: data.fees,
      transactionCount: data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}




