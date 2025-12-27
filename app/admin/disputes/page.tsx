"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getUserData, getDisputes, getPurchase, getCoachData, updateDispute } from "@/lib/firebase/firestore";
import { where, orderBy } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { format } from "date-fns";
import Link from "next/link";

export default function AdminDisputesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "needs_response" | "under_review" | "won" | "lost">("all");
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (!user) {
        router.push("/auth");
        return;
      }

      const userData = await getUserData(user.uid);
      if (!userData || userData.role !== "admin") {
        router.push("/");
        return;
      }

      setUser(user);
      await loadDisputes();
    });

    return () => unsubscribe();
  }, [router, filter]);

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const constraints: any[] = [orderBy("createdAt", "desc")];
      
      if (filter !== "all") {
        if (filter === "needs_response") {
          constraints.push(where("status", "in", ["needs_response", "warning_needs_response"]));
        } else {
          constraints.push(where("status", "==", filter));
        }
      }
      
      const disputesData = await getDisputes(constraints);
      
      // Enrich with purchase and coach data
      const enriched = await Promise.all(
        disputesData.map(async (dispute) => {
          const purchase = await getPurchase(dispute.purchaseId);
          const coach = purchase ? await getCoachData(purchase.coachId) : null;
          return {
            ...dispute,
            purchase,
            coach,
          };
        })
      );
      
      setDisputes(enriched);
    } catch (error) {
      console.error("Error loading disputes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (disputeId: string, note: string) => {
    try {
      const dispute = disputes.find(d => d.id === disputeId);
      const currentNotes = dispute?.adminNotes || "";
      await updateDispute(disputeId, {
        adminNotes: currentNotes ? `${currentNotes}\n\n${new Date().toISOString()}: ${note}` : `${new Date().toISOString()}: ${note}`,
      });
      await loadDisputes();
      if (selectedDispute?.id === disputeId) {
        setSelectedDispute({ ...selectedDispute, adminNotes: currentNotes ? `${currentNotes}\n\n${new Date().toISOString()}: ${note}` : `${new Date().toISOString()}: ${note}` });
      }
    } catch (error) {
      console.error("Error adding note:", error);
      alert("Failed to add note");
    }
  };

  const getStatusColor = (status: string) => {
    if (status.includes("needs_response")) return "bg-red-500/20 text-red-400";
    if (status.includes("under_review") || status.includes("warning")) return "bg-yellow-500/20 text-yellow-400";
    if (status === "won") return "bg-green-500/20 text-green-400";
    if (status === "lost" || status === "charge_refunded") return "bg-red-500/20 text-red-400";
    return "bg-gray-500/20 text-gray-400";
  };

  const filteredDisputes = disputes.filter(dispute => {
    if (filter === "all") return true;
    if (filter === "needs_response") {
      return dispute.status === "needs_response" || dispute.status === "warning_needs_response";
    }
    return dispute.status === filter;
  });

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Disputes & Chargebacks</h1>
            <p className="text-gray-400">
              Manage refunds, chargebacks, and disputes. You are responsible for handling these.
            </p>
          </div>
          <Link href="/admin">
            <GlowButton variant="outline">Back to Admin</GlowButton>
          </Link>
        </div>

        <div className="mb-6 flex gap-4 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === "all" ? "bg-blue-500 text-white" : "bg-[var(--card)] text-gray-300"
            }`}
          >
            All ({disputes.length})
          </button>
          <button
            onClick={() => setFilter("needs_response")}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === "needs_response" ? "bg-red-500 text-white" : "bg-[var(--card)] text-gray-300"
            }`}
          >
            Needs Response ({disputes.filter(d => d.status === "needs_response" || d.status === "warning_needs_response").length})
          </button>
          <button
            onClick={() => setFilter("under_review")}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === "under_review" ? "bg-yellow-500 text-white" : "bg-[var(--card)] text-gray-300"
            }`}
          >
            Under Review ({disputes.filter(d => d.status === "under_review" || d.status === "warning_under_review").length})
          </button>
          <button
            onClick={() => setFilter("won")}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === "won" ? "bg-green-500 text-white" : "bg-[var(--card)] text-gray-300"
            }`}
          >
            Won ({disputes.filter(d => d.status === "won").length})
          </button>
          <button
            onClick={() => setFilter("lost")}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === "lost" ? "bg-red-500 text-white" : "bg-[var(--card)] text-gray-300"
            }`}
          >
            Lost ({disputes.filter(d => d.status === "lost" || d.status === "charge_refunded").length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading disputes...</div>
        ) : filteredDisputes.length === 0 ? (
          <GradientCard>
            <p className="text-center text-gray-400 py-8">No disputes found.</p>
          </GradientCard>
        ) : (
          <div className="space-y-4">
            {filteredDisputes.map((dispute) => (
              <GradientCard key={dispute.id} className="cursor-pointer hover:scale-[1.01] transition-transform" onClick={() => setSelectedDispute(dispute)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">Dispute #{dispute.stripeDisputeId.slice(-8)}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(dispute.status)}`}>
                        {dispute.status.replace(/_/g, " ").toUpperCase()}
                      </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Amount</p>
                        <p className="font-bold">${(dispute.amountCents / 100).toFixed(2)} {dispute.currency.toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Reason</p>
                        <p className="font-bold">{dispute.reason.replace(/_/g, " ").toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Coach</p>
                        <p className="font-bold">{dispute.coach?.displayName || "Unknown"}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Created</p>
                        <p className="font-bold">{dispute.createdAt ? format(dispute.createdAt.toDate(), "MMM d, yyyy") : "N/A"}</p>
                      </div>
                    </div>
                    {dispute.evidenceDueBy && (
                      <div className="mt-2">
                        <p className="text-sm text-red-400">
                          ⚠️ Evidence due by: {format(dispute.evidenceDueBy.toDate(), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </GradientCard>
            ))}
          </div>
        )}

        {/* Modal for dispute details */}
        {selectedDispute && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedDispute(null)}>
            <div className="bg-[var(--card)] rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Dispute Details</h2>
                <button onClick={() => setSelectedDispute(null)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm">Stripe Dispute ID</p>
                  <p className="font-mono">{selectedDispute.stripeDisputeId}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Amount</p>
                    <p className="font-bold text-lg">${(selectedDispute.amountCents / 100).toFixed(2)} {selectedDispute.currency.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Status</p>
                    <span className={`px-3 py-1 rounded-full text-sm inline-block ${getStatusColor(selectedDispute.status)}`}>
                      {selectedDispute.status.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">Reason</p>
                  <p className="font-bold">{selectedDispute.reason.replace(/_/g, " ").toUpperCase()}</p>
                </div>
                
                {selectedDispute.evidenceDueBy && (
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-yellow-400 font-bold">⚠️ Evidence Due By</p>
                    <p className="text-yellow-300">{format(selectedDispute.evidenceDueBy.toDate(), "MMMM d, yyyy 'at' h:mm a")}</p>
                    <p className="text-yellow-400 text-sm mt-2">
                      You must submit evidence to Stripe before this date to contest the chargeback.
                    </p>
                  </div>
                )}
                
                {selectedDispute.purchase && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Purchase Details</p>
                    <div className="bg-[var(--background)] rounded-lg p-4">
                      <p>Type: {selectedDispute.purchase.type}</p>
                      <p>Purchase ID: {selectedDispute.purchase.id}</p>
                      <p>Amount: ${(selectedDispute.purchase.amountCents / 100).toFixed(2)}</p>
                    </div>
                  </div>
                )}
                
                {selectedDispute.coach && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Coach</p>
                    <div className="bg-[var(--background)] rounded-lg p-4">
                      <p className="font-bold">{selectedDispute.coach.displayName}</p>
                      <p className="text-sm text-gray-400">{selectedDispute.coach.headline}</p>
                    </div>
                  </div>
                )}
                
                <div>
                  <p className="text-gray-400 text-sm mb-2">Admin Notes</p>
                  <textarea
                    className="w-full bg-[var(--background)] rounded-lg p-4 text-sm"
                    rows={4}
                    value={selectedDispute.adminNotes || ""}
                    readOnly
                    placeholder="No notes yet"
                  />
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-[var(--background)] rounded-lg p-2 text-sm"
                      placeholder="Add a note..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          handleAddNote(selectedDispute.id, e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <GlowButton
                      size="sm"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input.value.trim()) {
                          handleAddNote(selectedDispute.id, input.value);
                          input.value = "";
                        }
                      }}
                    >
                      Add Note
                    </GlowButton>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-700">
                  <a
                    href={`https://dashboard.stripe.com/disputes/${selectedDispute.stripeDisputeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    View in Stripe Dashboard →
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



