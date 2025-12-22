"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { onAuthChange } from "@/lib/firebase/auth";
import { getCoachData, updateCoachData } from "@/lib/firebase/firestore";
import { User } from "firebase/auth";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { motion, AnimatePresence } from "framer-motion";
import { PaymentSetupBlock } from "@/components/coach/PaymentSetupBlock";
import { checkStripeConnectStatus } from "@/lib/firebase/stripe-helpers";

interface SessionOffering {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  isFree: boolean;
  isActive: boolean;
  bufferMinutes?: number;
  color?: string;
}

export default function OfferingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [coachData, setCoachData] = useState<any>(null);
  const [offerings, setOfferings] = useState<SessionOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingStripe, setCheckingStripe] = useState(true);
  const [stripeStatus, setStripeStatus] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOffering, setEditingOffering] = useState<SessionOffering | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "free" | "paid">("all");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    durationMinutes: 30,
    priceCents: 0,
    currency: "USD",
    isFree: false,
    isActive: true,
    bufferMinutes: 0,
    color: "#3B82F6", // Default blue
  });

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (user) {
        setUser(user);
        await loadOfferings(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadOfferings = async (coachId: string) => {
    setLoading(true);
    try {
      const coach = await getCoachData(coachId);
      setCoachData(coach);
      
      // Load offerings from coach data
      // For now, we'll store offerings in a subcollection or as part of coachData
      // Let's use a custom offerings array in coachData
      if (coach?.customOfferings) {
        setOfferings(coach.customOfferings);
      } else {
        // Migrate from old sessionOffers format
        const migratedOfferings: SessionOffering[] = [];
        
        if (coach?.sessionOffers?.freeIntroEnabled) {
          migratedOfferings.push({
            id: "free-intro",
            name: "Free Intro Consultation",
            description: "Get to know the coach and discuss your goals",
            durationMinutes: coach.sessionOffers.freeIntroMinutes || 15,
            priceCents: 0,
            currency: "USD",
            isFree: true,
            isActive: true,
            color: "#10B981",
          });
        }
        
        if (coach?.sessionOffers?.paid) {
          coach.sessionOffers.paid.forEach((offer: any) => {
            migratedOfferings.push({
              id: `paid-${offer.minutes}`,
              name: `${offer.minutes} Minute Session`,
              description: `${offer.minutes} minute coaching session`,
              durationMinutes: offer.minutes,
              priceCents: offer.priceCents,
              currency: offer.currency || "USD",
              isFree: false,
              isActive: true,
              color: "#3B82F6",
            });
          });
        }
        
        setOfferings(migratedOfferings);
      }
    } catch (error) {
      console.error("Error loading offerings:", error);
      } finally {
      setLoading(false);
      setCheckingStripe(false);
    }
  };

  const handleCreateOffering = () => {
    setEditingOffering(null);
    setFormData({
      name: "",
      description: "",
      durationMinutes: 30,
      priceCents: 0,
      currency: "USD",
      isFree: false,
      isActive: true,
      bufferMinutes: 0,
      color: "#3B82F6",
    });
    setShowCreateModal(true);
  };

  const handleEditOffering = (offering: SessionOffering) => {
    setEditingOffering(offering);
    setFormData({
      name: offering.name,
      description: offering.description,
      durationMinutes: offering.durationMinutes,
      priceCents: offering.priceCents,
      currency: offering.currency,
      isFree: offering.isFree,
      isActive: offering.isActive,
      bufferMinutes: offering.bufferMinutes || 0,
      color: offering.color || "#3B82F6",
    });
    setShowCreateModal(true);
  };

  const handleSaveOffering = async () => {
    if (!user || !formData.name.trim()) return;

    try {
      const newOffering: SessionOffering = {
        id: editingOffering?.id || `offering-${Date.now()}`,
        name: formData.name.trim(),
        description: formData.description.trim(),
        durationMinutes: formData.durationMinutes,
        priceCents: formData.isFree ? 0 : formData.priceCents,
        currency: formData.currency,
        isFree: formData.isFree,
        isActive: formData.isActive,
        bufferMinutes: formData.bufferMinutes,
        color: formData.color,
      };

      let updatedOfferings: SessionOffering[];
      if (editingOffering) {
        updatedOfferings = offerings.map((o) =>
          o.id === editingOffering.id ? newOffering : o
        );
      } else {
        updatedOfferings = [...offerings, newOffering];
      }

      setOfferings(updatedOfferings);
      
      // Save to Firestore
      await updateCoachData(user.uid, {
        customOfferings: updatedOfferings,
      });

      setShowCreateModal(false);
      setEditingOffering(null);
    } catch (error) {
      console.error("Error saving offering:", error);
      alert("Failed to save offering. Please try again.");
    }
  };

  const handleDeleteOffering = async (offeringId: string) => {
    if (!user || !confirm("Are you sure you want to delete this offering?")) return;

    try {
      const updatedOfferings = offerings.filter((o) => o.id !== offeringId);
      setOfferings(updatedOfferings);
      
      await updateCoachData(user.uid, {
        customOfferings: updatedOfferings,
      });
    } catch (error) {
      console.error("Error deleting offering:", error);
      alert("Failed to delete offering. Please try again.");
    }
  };

  const handleToggleActive = async (offering: SessionOffering) => {
    if (!user) return;

    try {
      const updatedOfferings = offerings.map((o) =>
        o.id === offering.id ? { ...o, isActive: !o.isActive } : o
      );
      setOfferings(updatedOfferings);
      
      await updateCoachData(user.uid, {
        customOfferings: updatedOfferings,
      });
    } catch (error) {
      console.error("Error updating offering:", error);
    }
  };

  const filteredOfferings = offerings.filter((offering) => {
    if (filter === "active") return offering.isActive;
    if (filter === "inactive") return !offering.isActive;
    if (filter === "free") return offering.isFree;
    if (filter === "paid") return !offering.isFree;
    return true;
  });

  // Check if Stripe Connect is set up
  const canCreateOfferings = stripeStatus?.status === "active" && stripeStatus?.chargesEnabled && stripeStatus?.payoutsEnabled;

  return (
    <DashboardLayout role="coach">
      <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                Session Offerings
              </h1>
              <p className="text-gray-400">
                Create and manage your session types. Customize duration, pricing, and availability.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <GlowButton 
                variant="primary" 
                size="lg" 
                onClick={handleCreateOffering}
                disabled={!canCreateOfferings}
              >
                + Create Offering
              </GlowButton>
              {!canCreateOfferings && (
                <p className="text-xs text-orange-400 text-center">
                  Complete payment setup to create offerings
                </p>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-6 flex-wrap">
            {(["all", "active", "inactive", "free", "paid"] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 rounded-lg border-2 transition-colors capitalize ${
                  filter === filterOption
                    ? "border-blue-500 bg-blue-500/20 text-blue-400"
                    : "border-gray-600 text-gray-400 hover:border-gray-500"
                }`}
              >
                {filterOption}
              </button>
            ))}
          </div>

          {/* Offerings Grid */}
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading offerings...</div>
          ) : filteredOfferings.length === 0 ? (
            <GradientCard className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">No offerings yet</h3>
              <p className="text-gray-400 mb-6">
                {filter === "all" 
                  ? "Create your first session offering to get started"
                  : `No ${filter} offerings found`}
              </p>
              {filter === "all" && (
                <GlowButton variant="primary" onClick={handleCreateOffering}>
                  Create Your First Offering
                </GlowButton>
              )}
            </GradientCard>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOfferings.map((offering) => (
                <GradientCard
                  key={offering.id}
                  className={`p-6 border-2 ${
                    offering.isActive ? "border-gray-700" : "border-gray-800 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: offering.color }}
                      >
                        {offering.durationMinutes}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{offering.name}</h3>
                        <p className="text-sm text-gray-400">
                          {offering.durationMinutes} minutes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {offering.isActive ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  {offering.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {offering.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      {offering.isFree ? (
                        <span className="text-2xl font-bold text-green-400">FREE</span>
                      ) : (
                        <span className="text-2xl font-bold text-blue-400">
                          ${(offering.priceCents / 100).toFixed(2)}
                        </span>
                      )}
                    </div>
                    {offering.bufferMinutes && offering.bufferMinutes > 0 && (
                      <span className="text-xs text-gray-500">
                        +{offering.bufferMinutes}min buffer
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(offering)}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors text-sm ${
                        offering.isActive
                          ? "border-gray-600 text-gray-400 hover:border-gray-500"
                          : "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                      }`}
                    >
                      {offering.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleEditOffering(offering)}
                      className="flex-1 px-4 py-2 rounded-lg border-2 border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteOffering(offering.id)}
                      className="px-4 py-2 rounded-lg border-2 border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </GradientCard>
              ))}
            </div>
          )}

          {/* Create/Edit Modal */}
          <AnimatePresence>
            {showCreateModal && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                  onClick={() => setShowCreateModal(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
                >
                  <div
                    className="pointer-events-auto max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GradientCard className="p-8 bg-[var(--card)] border-2 border-gray-700 shadow-2xl">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-bold text-white">
                          {editingOffering ? "Edit Offering" : "Create New Offering"}
                        </h2>
                        <button
                          onClick={() => setShowCreateModal(false)}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <div className="space-y-6">
                        {/* Name */}
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-300">
                            Offering Name *
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., 30-Minute Coaching Session"
                            className="w-full px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                          />
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-300">
                            Description
                          </label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe what students can expect from this session..."
                            rows={3}
                            className="w-full px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          />
                        </div>

                        {/* Duration and Price */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">
                              Duration (minutes) *
                            </label>
                            <input
                              type="number"
                              min="5"
                              max="240"
                              step="5"
                              value={formData.durationMinutes}
                              onChange={(e) =>
                                setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 30 })
                              }
                              className="w-full px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">
                              Buffer Time (minutes)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="60"
                              step="5"
                              value={formData.bufferMinutes}
                              onChange={(e) =>
                                setFormData({ ...formData, bufferMinutes: parseInt(e.target.value) || 0 })
                              }
                              className="w-full px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">Time between sessions</p>
                          </div>
                        </div>

                        {/* Free/Paid Toggle */}
                        <div>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.isFree}
                              onChange={(e) => setFormData({ ...formData, isFree: e.target.checked, priceCents: e.target.checked ? 0 : formData.priceCents })}
                              className="w-5 h-5 rounded border-gray-600 bg-[var(--background)] text-blue-500 focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-gray-300">Free session (no charge)</span>
                          </label>
                        </div>

                        {/* Price */}
                        {!formData.isFree && (
                          <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">
                              Price (USD) *
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={(formData.priceCents / 100).toFixed(2)}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    priceCents: Math.round(parseFloat(e.target.value) * 100) || 0,
                                  })
                                }
                                className="w-full pl-8 pr-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        )}

                        {/* Color */}
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-300">
                            Color
                          </label>
                          <div className="flex gap-3 items-center">
                            <input
                              type="color"
                              value={formData.color}
                              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                              className="w-16 h-12 rounded-lg border-2 border-gray-600 cursor-pointer"
                            />
                            <div className="flex-1">
                              <input
                                type="text"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                className="w-full px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Active Toggle */}
                        <div>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.isActive}
                              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                              className="w-5 h-5 rounded border-gray-600 bg-[var(--background)] text-blue-500 focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-gray-300">Active (visible to students)</span>
                          </label>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 pt-4 border-t border-gray-700">
                          <button
                            onClick={() => setShowCreateModal(false)}
                            className="flex-1 px-6 py-3 border-2 border-gray-600 rounded-xl text-gray-300 hover:border-gray-500 transition-colors"
                          >
                            Cancel
                          </button>
                          <GlowButton
                            variant="primary"
                            size="lg"
                            onClick={handleSaveOffering}
                            disabled={!formData.name.trim() || (!formData.isFree && formData.priceCents <= 0)}
                            className="flex-1"
                          >
                            {editingOffering ? "Save Changes" : "Create Offering"}
                          </GlowButton>
                        </div>
                      </div>
                    </GradientCard>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}

