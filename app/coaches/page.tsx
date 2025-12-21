"use client";

import { useState, useEffect } from "react";
import { getCoaches, getReviews, type CoachData } from "@/lib/firebase/firestore";
import { where, orderBy } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { BadgeVerified } from "@/components/ui/BadgeVerified";
import { GlowButton } from "@/components/ui/GlowButton";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SPORTS } from "@/lib/constants/sports";
import Link from "next/link";

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<(CoachData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sport: "",
    verified: false,
    minPrice: 0,
    maxPrice: 200,
  });

  useEffect(() => {
    loadCoaches();
  }, [filters]);

  const loadCoaches = async () => {
    setLoading(true);
    try {
      const constraints: any[] = [where("status", "==", "active")];
      
      if (filters.sport) {
        constraints.push(where("sports", "array-contains", filters.sport));
      }
      
      if (filters.verified) {
        constraints.push(where("isVerified", "==", true));
      }

      const coachesData = await getCoaches(constraints);
      
      // Filter by price client-side
      const filtered = coachesData.filter(coach => {
        const minPrice = coach.sessionOffers?.paid?.[0]?.priceCents ? coach.sessionOffers.paid[0].priceCents / 100 : 0;
        return minPrice >= filters.minPrice && minPrice <= filters.maxPrice;
      });

      setCoaches(filtered as (CoachData & { id: string })[]);
    } catch (error) {
      console.error("Error loading coaches:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      
      {/* Background decorative elements */}
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
              Find Your Perfect Coach
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Connect with verified coaches who can help you reach your goals
            </p>
          </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="md:col-span-1">
            <GradientCard>
              <h2 className="text-xl font-bold mb-4">Filters</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sport</label>
                  <select
                    value={filters.sport}
                    onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                  >
                    <option value="">All Sports</option>
                    {SPORTS.map(sport => (
                      <option key={sport} value={sport}>{sport}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.verified}
                      onChange={(e) => setFilters({ ...filters, verified: e.target.checked })}
                    />
                    <span className="text-sm">Verified only</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Price: ${filters.minPrice} - ${filters.maxPrice}
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </GradientCard>
          </div>

          {/* Results */}
          <div className="md:col-span-3">
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading coaches...</div>
            ) : coaches.length === 0 ? (
              <GradientCard>
                <p className="text-center text-gray-400">No coaches found matching your filters.</p>
              </GradientCard>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {coaches.map((coach) => {
                  const price30 = coach.sessionOffers?.paid?.find(p => p.minutes === 30)?.priceCents 
                    ? coach.sessionOffers.paid.find(p => p.minutes === 30)!.priceCents / 100 
                    : 0;
                  
                  return (
                    <Link key={coach.userId} href={`/coach/${coach.userId}`}>
                      <GradientCard gradient="blue-purple" glow className="cursor-pointer hover:scale-105 transition-transform">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold mb-1">{coach.displayName}</h3>
                            <p className="text-gray-400 text-sm">{coach.headline}</p>
                          </div>
                          {coach.isVerified && <BadgeVerified />}
                        </div>

                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2 mb-2">
                            {coach.sports.slice(0, 3).map((sport, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full"
                              >
                                {sport}
                              </span>
                            ))}
                          </div>
                          {coach.ratingAvg && (
                            <div className="flex items-center gap-2">
                              <span className="text-yellow-400">⭐</span>
                              <span className="font-semibold">{coach.ratingAvg.toFixed(1)}</span>
                              <span className="text-gray-500 text-sm">({coach.ratingCount || 0} reviews)</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                          <span className="text-lg font-bold">From ${price30}/hr</span>
                          <GlowButton variant="outline" size="sm">View Profile</GlowButton>
                        </div>
                      </GradientCard>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
