"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getCoachRevenue, getPayouts, where } from "@/lib/firebase/revenue";
import { getPayouts as getPayoutsFromFirestore } from "@/lib/firebase/firestore";
import { getPendingPayoutAmount } from "@/lib/firebase/payouts";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";

export default function CoachRevenuePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [pendingEarnings, setPendingEarnings] = useState<number>(0);
  const [period, setPeriod] = useState<"all" | "month" | "week">("month");

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (user) {
        setUser(user);
        await loadRevenueData(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadRevenueData(user.uid);
    }
  }, [period, user]);

  const loadRevenueData = async (coachId: string) => {
    try {
      setLoading(true);
      
      const now = new Date();
      let startDate: Date;
      
      if (period === "week") {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (period === "month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        startDate = new Date(0); // All time
      }

      const [revenue, payoutsData, pending] = await Promise.all([
        getCoachRevenue(coachId, startDate, now),
        getPayoutsFromFirestore([where("coachId", "==", coachId)]),
        getPendingPayoutAmount(coachId),
      ]);

      setRevenueData(revenue);
      setPayouts(payoutsData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      }));
      setPendingEarnings(pending);
    } catch (error) {
      console.error("Error loading revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <DashboardLayout role="coach" activeTab="revenue">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-400">Loading revenue data...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="coach" activeTab="revenue">
      <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 lg:mb-0 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
              Revenue Dashboard
            </h1>
            
            <div className="flex gap-2">
              <GlowButton
                variant={period === "week" ? "primary" : "outline"}
                size="sm"
                onClick={() => setPeriod("week")}
              >
                Week
              </GlowButton>
              <GlowButton
                variant={period === "month" ? "primary" : "outline"}
                size="sm"
                onClick={() => setPeriod("month")}
              >
                Month
              </GlowButton>
              <GlowButton
                variant={period === "all" ? "primary" : "outline"}
                size="sm"
                onClick={() => setPeriod("all")}
              >
                All Time
              </GlowButton>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <GradientCard className="p-6">
              <div className="text-gray-400 text-sm mb-2">Total Earnings</div>
              <div className="text-3xl font-bold text-green-400">
                {revenueData ? formatCurrency(revenueData.totalEarnings) : "$0.00"}
              </div>
              <div className="text-gray-500 text-xs mt-2">
                {period === "week" ? "Last 7 days" : period === "month" ? "This month" : "All time"}
              </div>
            </GradientCard>

            <GradientCard className="p-6">
              <div className="text-gray-400 text-sm mb-2">Pending Payout</div>
              <div className="text-3xl font-bold text-orange-400">
                {formatCurrency(pendingEarnings)}
              </div>
              <div className="text-gray-500 text-xs mt-2">Next payout: Monday</div>
            </GradientCard>

            <GradientCard className="p-6">
              <div className="text-gray-400 text-sm mb-2">Total Payouts</div>
              <div className="text-3xl font-bold text-blue-400">
                {revenueData ? formatCurrency(revenueData.totalPayouts) : "$0.00"}
              </div>
              <div className="text-gray-500 text-xs mt-2">
                {payouts.filter(p => p.status === "paid").length} completed payouts
              </div>
            </GradientCard>

            <GradientCard className="p-6">
              <div className="text-gray-400 text-sm mb-2">Transactions</div>
              <div className="text-3xl font-bold text-purple-400">
                {revenueData?.transactionCount || 0}
              </div>
              <div className="text-gray-500 text-xs mt-2">
                {period === "week" ? "Last 7 days" : period === "month" ? "This month" : "All time"}
              </div>
            </GradientCard>
          </div>

          {/* Payout History */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Payout History</h2>
            <GradientCard className="p-6">
              {payouts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No payouts yet. Your earnings will be paid out weekly on Mondays.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Date</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Amount</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Period</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((payout) => (
                        <tr key={payout.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="py-3 px-4">{formatDate(payout.createdAt)}</td>
                          <td className="py-3 px-4 font-semibold">{formatCurrency(payout.amountCents)}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              payout.status === "paid" 
                                ? "bg-green-500/20 text-green-400" 
                                : payout.status === "failed"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}>
                              {payout.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-400 text-sm">
                            {formatDate(payout.payoutPeriodStart)} - {formatDate(payout.payoutPeriodEnd)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GradientCard>
          </div>

          {/* Platform Fee Info */}
          <GradientCard className="p-6 bg-blue-500/5 border-blue-500/30">
            <h3 className="text-lg font-semibold mb-2">Platform Fee</h3>
            <p className="text-gray-400 text-sm">
              We charge a 20% platform fee on all transactions. This covers payment processing, 
              platform maintenance, and customer support. Your earnings (80%) are automatically 
              added to your pending payout balance and paid out weekly every Monday.
            </p>
            {revenueData && revenueData.platformFees > 0 && (
              <div className="mt-4 text-sm">
                <span className="text-gray-400">Platform fees this period: </span>
                <span className="font-semibold text-blue-400">
                  {formatCurrency(revenueData.platformFees)}
                </span>
              </div>
            )}
          </GradientCard>
        </div>
      </div>
    </DashboardLayout>
  );
}

