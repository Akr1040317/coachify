"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getCoachRevenue } from "@/lib/firebase/revenue";
import { getPayouts } from "@/lib/firebase/firestore";
import { where } from "firebase/firestore";
import { getPendingPayoutAmount } from "@/lib/firebase/payouts";
import type { PayoutData } from "@/lib/firebase/firestore";
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
        getPayouts([where("coachId", "==", coachId)]),
        getPendingPayoutAmount(coachId),
      ]);

      setRevenueData(revenue);
      setPayouts(payoutsData.sort((a: PayoutData & { id: string }, b: PayoutData & { id: string }) => {
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

  const handleVerifyWithStripe = async () => {
    if (!user) return;

    setVerifying(true);
    try {
      const response = await fetch("/api/coaches/stripe-connect/verify-revenue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ coachId: user.uid }),
      });

      const data = await response.json();

      if (data.success) {
        setVerificationResult(data);
        setShowVerificationModal(true);
      } else {
        alert(`Verification failed: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error verifying with Stripe:", error);
      alert("Failed to verify with Stripe. Please try again.");
    } finally {
      setVerifying(false);
    }
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
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 lg:mb-0 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
              Revenue Dashboard
            </h1>
            
            <div className="flex gap-2 flex-wrap">
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
              <GlowButton
                variant="outline"
                size="sm"
                onClick={handleVerifyWithStripe}
                disabled={verifying}
                glowColor="blue"
              >
                {verifying ? "Verifying..." : "Verify with Stripe"}
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

      {/* Verification Modal */}
      <AnimatePresence>
        {showVerificationModal && verificationResult && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => setShowVerificationModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
            >
              <div
                className="pointer-events-auto max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-[var(--card)] rounded-xl border-2 border-gray-700 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <GradientCard className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-3xl font-bold text-white">Stripe Verification Results</h2>
                    <button
                      onClick={() => setShowVerificationModal(false)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Summary */}
                  <div className={`p-4 rounded-lg mb-6 ${
                    verificationResult.summary.isVerified
                      ? "bg-green-500/10 border border-green-500/30"
                      : "bg-yellow-500/10 border border-yellow-500/30"
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      {verificationResult.summary.isVerified ? (
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      )}
                      <h3 className={`text-xl font-bold ${
                        verificationResult.summary.isVerified ? "text-green-400" : "text-yellow-400"
                      }`}>
                        {verificationResult.summary.isVerified ? "All Data Verified ✓" : "Discrepancies Found ⚠️"}
                      </h3>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 mt-4 text-sm">
                      <div>
                        <span className="text-gray-400">Matched Transactions: </span>
                        <span className="font-semibold text-white">{verificationResult.summary.totalMatched}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Total Discrepancies: </span>
                        <span className="font-semibold text-yellow-400">{verificationResult.summary.totalDiscrepancies}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Verified At: </span>
                        <span className="font-semibold text-white">
                          {new Date(verificationResult.verifiedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Discrepancies */}
                  {verificationResult.summary.totalDiscrepancies > 0 && (
                    <div className="space-y-4">
                      {/* Missing in Firestore */}
                      {verificationResult.details.missingInFirestore.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-red-400 mb-2">
                            Missing in Firestore ({verificationResult.details.missingInFirestore.length})
                          </h3>
                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 max-h-48 overflow-y-auto">
                            <p className="text-gray-300 text-sm mb-2">
                              These Stripe payments exist but are not recorded in Firestore:
                            </p>
                            <div className="space-y-2">
                              {verificationResult.details.missingInFirestore.map((item, idx) => (
                                <div key={idx} className="text-sm text-gray-300">
                                  <span className="font-mono text-xs">PI: {item.stripePaymentIntentId.slice(-12)}</span>
                                  {" - "}
                                  <span className="font-semibold">{formatCurrency(item.amountCents)}</span>
                                  {" - "}
                                  <span className="text-gray-400">{new Date(item.created).toLocaleDateString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Missing in Stripe */}
                      {verificationResult.details.missingInStripe.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-orange-400 mb-2">
                            Missing in Stripe ({verificationResult.details.missingInStripe.length})
                          </h3>
                          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 max-h-48 overflow-y-auto">
                            <p className="text-gray-300 text-sm mb-2">
                              These Firestore purchases don&apos;t have matching Stripe payments:
                            </p>
                            <div className="space-y-2">
                              {verificationResult.details.missingInStripe.map((item, idx) => (
                                <div key={idx} className="text-sm text-gray-300">
                                  <span className="font-mono text-xs">Purchase: {item.purchaseId?.slice(-12) || "N/A"}</span>
                                  {" - "}
                                  <span className="font-semibold">{formatCurrency(item.amountCents || 0)}</span>
                                  {" - "}
                                  <span className="text-gray-400">{item.reason}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Amount Discrepancies */}
                      {verificationResult.details.discrepancies.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                            Amount Mismatches ({verificationResult.details.discrepancies.length})
                          </h3>
                          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 max-h-48 overflow-y-auto">
                            <p className="text-gray-300 text-sm mb-2">
                              These transactions have different amounts in Firestore vs Stripe:
                            </p>
                            <div className="space-y-2">
                              {verificationResult.details.discrepancies.map((item, idx) => (
                                <div key={idx} className="text-sm text-gray-300">
                                  <span className="font-mono text-xs">PI: {item.stripePaymentIntentId.slice(-12)}</span>
                                  {" - "}
                                  <span>Firestore: <span className="font-semibold">{formatCurrency(item.firestoreAmount)}</span></span>
                                  {" vs "}
                                  <span>Stripe: <span className="font-semibold">{formatCurrency(item.stripeAmount)}</span></span>
                                  {" ("}
                                  <span className={item.difference > 0 ? "text-green-400" : "text-red-400"}>
                                    {item.difference > 0 ? "+" : ""}{formatCurrency(item.difference)}
                                  </span>
                                  {")"}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* All Verified */}
                  {verificationResult.summary.isVerified && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center">
                      <p className="text-green-400 font-semibold">
                        ✓ All transactions match between Firestore and Stripe!
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        {verificationResult.summary.totalMatched} transactions verified successfully.
                      </p>
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t border-gray-700">
                    <p className="text-gray-400 text-xs">
                      Note: This verification compares Firestore purchase records with Stripe payment intents.
                      If discrepancies are found, contact support for assistance.
                    </p>
                  </div>
                </GradientCard>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}

