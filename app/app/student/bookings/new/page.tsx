"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getCoachData } from "@/lib/firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { BadgeVerified } from "@/components/ui/BadgeVerified";

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const coachId = searchParams.get("coachId");
  const [user, setUser] = useState<User | null>(null);
  const [coach, setCoach] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<"free_intro" | "paid">("free_intro");
  const [selectedMinutes, setSelectedMinutes] = useState(30);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (!user) {
        router.push("/auth?role=student");
        return;
      }
      setUser(user);
      if (coachId) {
        await loadCoach(coachId);
      }
    });

    return () => unsubscribe();
  }, [router, coachId]);

  const loadCoach = async (id: string) => {
    setLoading(true);
    try {
      const coachData = await getCoachData(id);
      setCoach(coachData);
    } catch (error) {
      console.error("Error loading coach:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!user || !coach || !selectedDate || !selectedTime) {
      alert("Please fill in all fields");
      return;
    }

    const scheduledStart = new Date(`${selectedDate}T${selectedTime}`);

    if (selectedType === "free_intro") {
      try {
        const response = await fetch("/api/bookings/freeIntro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coachId,
            scheduledStart: scheduledStart.toISOString(),
            studentId: user.uid,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          alert(error.error || "Failed to book session");
          return;
        }

        router.push("/app/student/bookings");
      } catch (error) {
        console.error("Error booking:", error);
        alert("Failed to book session");
      }
    } else {
      // Paid session - create checkout
      try {
        const response = await fetch("/api/checkout/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coachId,
            sessionMinutes: selectedMinutes,
            scheduledStart: scheduledStart.toISOString(),
            bookingType: "paid",
          }),
        });

        const { checkoutUrl } = await response.json();
        window.location.href = checkoutUrl;
      } catch (error) {
        console.error("Error creating checkout:", error);
        alert("Failed to start checkout");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Coach not found</div>
      </div>
    );
  }

  const price30 = coach.sessionOffers?.paid?.find((p: { minutes: number; priceCents: number }) => p.minutes === 30)?.priceCents 
    ? coach.sessionOffers.paid.find((p: { minutes: number; priceCents: number }) => p.minutes === 30)!.priceCents / 100 
    : 0;
  const price60 = coach.sessionOffers?.paid?.find((p: { minutes: number; priceCents: number }) => p.minutes === 60)?.priceCents 
    ? coach.sessionOffers.paid.find((p: { minutes: number; priceCents: number }) => p.minutes === 60)!.priceCents / 100 
    : 0;

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Book a Session</h1>

        <GradientCard className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl font-bold">{coach.displayName}</h2>
            {coach.isVerified && <BadgeVerified />}
          </div>
          <p className="text-gray-400">{coach.headline}</p>
        </GradientCard>

        <GradientCard>
          <h3 className="text-xl font-bold mb-4">Session Type</h3>
          <div className="space-y-3 mb-6">
            {coach.sessionOffers?.freeIntroEnabled && (
              <button
                onClick={() => setSelectedType("free_intro")}
                className={`
                  w-full p-4 rounded-lg border-2 text-left transition-all
                  ${selectedType === "free_intro"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-600 hover:border-gray-500"
                  }
                `}
              >
                <div className="font-semibold">Free Intro Consultation</div>
                <div className="text-sm text-gray-400">{coach.sessionOffers.freeIntroMinutes} minutes</div>
              </button>
            )}
            {price30 > 0 && (
              <button
                onClick={() => {
                  setSelectedType("paid");
                  setSelectedMinutes(30);
                }}
                className={`
                  w-full p-4 rounded-lg border-2 text-left transition-all
                  ${selectedType === "paid" && selectedMinutes === 30
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-600 hover:border-gray-500"
                  }
                `}
              >
                <div className="font-semibold">30-minute Session</div>
                <div className="text-sm text-gray-400">${price30}</div>
              </button>
            )}
            {price60 > 0 && (
              <button
                onClick={() => {
                  setSelectedType("paid");
                  setSelectedMinutes(60);
                }}
                className={`
                  w-full p-4 rounded-lg border-2 text-left transition-all
                  ${selectedType === "paid" && selectedMinutes === 60
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-600 hover:border-gray-500"
                  }
                `}
              >
                <div className="font-semibold">60-minute Session</div>
                <div className="text-sm text-gray-400">${price60}</div>
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Time</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="mt-6">
            <GlowButton
              variant="primary"
              size="lg"
              className="w-full"
              glowColor="orange"
              onClick={handleBook}
            >
              {selectedType === "free_intro" ? "Book Free Intro" : "Continue to Payment"}
            </GlowButton>
          </div>
        </GradientCard>
      </div>
    </div>
  );
}
