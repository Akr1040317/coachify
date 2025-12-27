"use client";

import { useState, useEffect } from "react";
import { onAuthChange } from "@/lib/firebase/auth";
import { getUserData } from "@/lib/firebase/firestore";
import { getPlatformRevenue, getTopCoachesByRevenue, getRevenueByPeriod } from "@/lib/firebase/revenue";
import { User } from "firebase/auth";
import { GradientCard } from "@/components/ui/GradientCard";
import { useRouter } from "next/navigation";

export default function AdminRevenuePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [topCoaches, setTopCoaches] = useState<any[]>([]);
  const [periodRevenue, setPeriodRevenue] = useState<any[]>([]);
  const [period, setPeriod] = useState<"month" | "week" | "all">("month");
  const [chartPeriod, setChartPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (user) {
        const userData = await getUserData(user.uid);
        if (!userData || userData.role !== "admin") {
          router.push("/app/coach/dashboard");
          return;
        }
        setUser(user);
        await loadRevenueData();
      } else {
        router.push("/auth");
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user) {
      loadRevenueData();
    }
  }, [period, chartPeriod, user]);

  const loadRevenueData = async () => {
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

      const [revenue, topCoachesData, periodData] = await Promise.all([
        getPlatformRevenue(startDate, now),
        getTopCoachesByRevenue(10, startDate, now),
        getRevenueByPeriod(chartPeriod, startDate, now),
      ]);

      setRevenueData(revenue);
      setTopCoaches(topCoachesData);
      setPeriodRevenue(periodData);
    } catch (error) {
      console.error("Error loading revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Loading revenue data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 lg:mb-0 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
            Platform Revenue Dashboard
          </h1>
          
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod("week")}
              className={`px-4 py-2 rounded-lg ${
                period === "week" 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`px-4 py-2 rounded-lg ${
                period === "month" 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setPeriod("all")}
              className={`px-4 py-2 rounded-lg ${
                period === "all" 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <GradientCard className="p-6">
            <div className="text-gray-400 text-sm mb-2">Total Revenue</div>
            <div className="text-3xl font-bold text-green-400">
              {revenueData ? formatCurrency(revenueData.totalRevenue) : "$0.00"}
            </div>
            <div className="text-gray-500 text-xs mt-2">
              {period === "week" ? "Last 7 days" : period === "month" ? "This month" : "All time"}
            </div>
          </GradientCard>

          <GradientCard className="p-6">
            <div className="text-gray-400 text-sm mb-2">Platform Fees</div>
            <div className="text-3xl font-bold text-blue-400">
              {revenueData ? formatCurrency(revenueData.platformFees) : "$0.00"}
            </div>
            <div className="text-gray-500 text-xs mt-2">20% of all transactions</div>
          </GradientCard>

          <GradientCard className="p-6">
            <div className="text-gray-400 text-sm mb-2">Total Payouts</div>
            <div className="text-3xl font-bold text-purple-400">
              {revenueData ? formatCurrency(revenueData.totalPayouts) : "$0.00"}
            </div>
            <div className="text-gray-500 text-xs mt-2">Paid to coaches</div>
          </GradientCard>

          <GradientCard className="p-6">
            <div className="text-gray-400 text-sm mb-2">Pending Payouts</div>
            <div className="text-3xl font-bold text-orange-400">
              {revenueData ? formatCurrency(revenueData.pendingPayouts) : "$0.00"}
            </div>
            <div className="text-gray-500 text-xs mt-2">Not yet paid out</div>
          </GradientCard>
        </div>

        {/* Top Coaches */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Top Coaches by Revenue</h2>
          <GradientCard className="p-6">
            {topCoaches.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No revenue data yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Rank</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Coach</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Revenue</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Platform Fees</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-semibold">Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCoaches.map((coach, index) => (
                      <tr key={coach.coachId} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-3 px-4 font-semibold">#{index + 1}</td>
                        <td className="py-3 px-4">{coach.coachName}</td>
                        <td className="py-3 px-4 font-semibold">{formatCurrency(coach.totalRevenue)}</td>
                        <td className="py-3 px-4 text-blue-400">{formatCurrency(coach.platformFees)}</td>
                        <td className="py-3 px-4 text-gray-400">{coach.transactionCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GradientCard>
        </div>

        {/* Revenue Chart Data */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Revenue Over Time</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setChartPeriod("daily")}
                className={`px-3 py-1 rounded text-sm ${
                  chartPeriod === "daily" 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-800 text-gray-400"
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setChartPeriod("weekly")}
                className={`px-3 py-1 rounded text-sm ${
                  chartPeriod === "weekly" 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-800 text-gray-400"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setChartPeriod("monthly")}
                className={`px-3 py-1 rounded text-sm ${
                  chartPeriod === "monthly" 
                    ? "bg-blue-500 text-white" 
                    : "bg-gray-800 text-gray-400"
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
          <GradientCard className="p-6">
            {periodRevenue.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No revenue data for this period</div>
            ) : (
              <div className="space-y-2">
                {periodRevenue.map((item) => (
                  <div key={item.date} className="flex items-center justify-between py-2 border-b border-gray-800/50">
                    <div className="text-gray-400">{item.date}</div>
                    <div className="flex gap-6">
                      <div>
                        <span className="text-gray-500 text-sm">Revenue: </span>
                        <span className="font-semibold text-green-400">{formatCurrency(item.revenue)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-sm">Fees: </span>
                        <span className="font-semibold text-blue-400">{formatCurrency(item.platformFees)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-sm">Transactions: </span>
                        <span className="font-semibold">{item.transactionCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GradientCard>
        </div>
      </div>
    </div>
  );
}


