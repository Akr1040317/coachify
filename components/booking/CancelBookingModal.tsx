"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { format } from "date-fns";
import { CANCELLATION_POLICY } from "@/lib/config/payments";

interface CancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    scheduledStart: Date;
    priceCents: number;
    type: "free_intro" | "paid";
    cancellationPolicy?: {
      hoursBeforeFullRefund: number;
      hoursBeforePartialRefund: number;
      partialRefundPercent: number;
    };
  };
  onConfirm: (reason: string) => Promise<void>;
}

export function CancelBookingModal({
  isOpen,
  onClose,
  booking,
  onConfirm,
}: CancelBookingModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [refundInfo, setRefundInfo] = useState<{
    amountCents: number;
    reason: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen && booking) {
      // Calculate refund amount
      const now = new Date();
      const bookingStart = booking.scheduledStart;
      const hoursUntilBooking = (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60);

      const policy = booking.cancellationPolicy || {
        hoursBeforeFullRefund: CANCELLATION_POLICY.FULL_REFUND_HOURS,
        hoursBeforePartialRefund: CANCELLATION_POLICY.PARTIAL_REFUND_HOURS,
        partialRefundPercent: CANCELLATION_POLICY.PARTIAL_REFUND_PERCENT,
      };

      if (booking.type === "free_intro" || booking.priceCents === 0) {
        setRefundInfo(null);
      } else if (hoursUntilBooking >= policy.hoursBeforeFullRefund) {
        setRefundInfo({
          amountCents: booking.priceCents,
          reason: `Full refund - cancelled more than ${policy.hoursBeforeFullRefund} hours before booking`,
        });
      } else if (hoursUntilBooking >= policy.hoursBeforePartialRefund) {
        const refundAmount = Math.round(booking.priceCents * (policy.partialRefundPercent / 100));
        setRefundInfo({
          amountCents: refundAmount,
          reason: `Partial refund (${policy.partialRefundPercent}%) - cancelled ${policy.hoursBeforePartialRefund}-${policy.hoursBeforeFullRefund} hours before booking`,
        });
      } else {
        setRefundInfo({
          amountCents: 0,
          reason: `No refund - cancelled less than ${policy.hoursBeforePartialRefund} hours before booking`,
        });
      }
    }
  }, [isOpen, booking]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(reason);
      setReason("");
      onClose();
    } catch (error) {
      console.error("Error cancelling booking:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <GradientCard className="p-6 bg-[var(--card)] border-2 border-gray-700 shadow-2xl">
                <h2 className="text-2xl font-bold mb-4">Cancel Booking</h2>

                <div className="mb-6">
                  <p className="text-gray-300 mb-2">
                    Are you sure you want to cancel this booking?
                  </p>
                  <div className="bg-[var(--background)] p-3 rounded-lg mb-4">
                    <p className="text-sm text-gray-400 mb-1">Booking Date</p>
                    <p className="font-semibold">
                      {format(booking.scheduledStart, "EEEE, MMMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>

                  {refundInfo && (
                    <div
                      className={`p-3 rounded-lg mb-4 ${
                        refundInfo.amountCents > 0
                          ? "bg-green-500/10 border border-green-500/30"
                          : refundInfo.amountCents === 0
                          ? "bg-yellow-500/10 border border-yellow-500/30"
                          : "bg-gray-500/10 border border-gray-500/30"
                      }`}
                    >
                      <p className="text-sm text-gray-400 mb-1">Refund Amount</p>
                      {refundInfo.amountCents > 0 ? (
                        <p className="text-green-400 font-bold text-lg">
                          ${(refundInfo.amountCents / 100).toFixed(2)}
                        </p>
                      ) : (
                        <p className="text-yellow-400 font-bold">No Refund</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">{refundInfo.reason}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">
                      Reason for cancellation (optional)
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Let us know why you're cancelling..."
                      rows={3}
                      className="w-full px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 px-4 py-2 border-2 border-gray-600 rounded-xl text-gray-300 hover:border-gray-500 transition-colors disabled:opacity-50"
                  >
                    Keep Booking
                  </button>
                  <GlowButton
                    variant="primary"
                    onClick={handleConfirm}
                    disabled={loading}
                    className="flex-1"
                    glowColor="red"
                  >
                    {loading ? "Cancelling..." : "Cancel Booking"}
                  </GlowButton>
                </div>
              </GradientCard>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


