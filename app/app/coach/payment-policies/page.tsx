"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getUserData } from "@/lib/firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function PaymentPoliciesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (!user) {
        router.push("/auth");
        return;
      }

      const userData = await getUserData(user.uid);
      if (!userData || userData.role !== "coach") {
        router.push("/");
        return;
      }

      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout role="coach">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Payment Policies & Risk Management</h1>
          <p className="text-gray-400">
            Important information about refunds, chargebacks, and how to minimize risk
          </p>
        </div>

        <GradientCard className="p-6">
          <h2 className="text-2xl font-bold mb-4">Understanding Refunds & Chargebacks</h2>
          
          <div className="space-y-4 text-gray-300">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">Refunds</h3>
              <p>
                Students may request refunds for courses or sessions. Refunds are processed by our platform,
                and the refunded amount will be deducted from your pending earnings. We recommend:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Clearly communicate your cancellation and refund policies</li>
                <li>Provide high-quality coaching services to minimize refund requests</li>
                <li>Respond promptly to student concerns to resolve issues before refunds are requested</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">Chargebacks</h3>
              <p>
                A chargeback occurs when a student disputes a charge with their bank or credit card company.
                Chargebacks can result in:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Immediate reversal of funds from your account</li>
                <li>Additional fees from payment processors</li>
                <li>Potential account restrictions if chargeback rates are too high</li>
              </ul>
              <p className="mt-2">
                <strong className="text-white">Important:</strong> Our platform is responsible for handling chargebacks,
                but high chargeback rates can affect your ability to receive payouts.
              </p>
            </div>
          </div>
        </GradientCard>

        <GradientCard className="p-6">
          <h2 className="text-2xl font-bold mb-4">Best Practices to Minimize Risk</h2>
          
          <div className="space-y-4 text-gray-300">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">1. Clear Communication</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Set clear expectations in your course descriptions and session details</li>
                <li>Communicate your cancellation and refund policies upfront</li>
                <li>Respond to student messages within 24 hours</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">2. Quality Service Delivery</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Show up on time for scheduled sessions</li>
                <li>Deliver the content and value promised in your course descriptions</li>
                <li>Provide personalized feedback and support</li>
                <li>Follow up with students after sessions</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">3. Documentation</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Keep records of session notes and student progress</li>
                <li>Save communication records (messages, emails)</li>
                <li>Document any issues or disputes that arise</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">4. Pricing & Policies</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Set fair and competitive prices</li>
                <li>Offer free intro sessions to build trust</li>
                <li>Consider offering partial refunds for valid concerns</li>
                <li>Be transparent about what students will receive</li>
              </ul>
            </div>
          </div>
        </GradientCard>

        <GradientCard className="p-6 border-yellow-500/30">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">⚠️ Important Compliance Information</h2>
          
          <div className="space-y-3 text-gray-300">
            <p>
              As a coach on our platform, you must ensure that:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>You are providing legitimate sports coaching services</li>
              <li>You are not operating in restricted business categories (financial services, gambling, adult content, etc.)</li>
              <li>Your content and services comply with all applicable laws and regulations</li>
              <li>You have the necessary qualifications and credentials for the services you offer</li>
            </ul>
            <p className="mt-3">
              <strong className="text-white">Note:</strong> Our platform reviews all coaches for compliance before verification.
              Violations may result in account suspension or termination.
            </p>
          </div>
        </GradientCard>

        <GradientCard className="p-6">
          <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
          <p className="text-gray-300 mb-4">
            If you have questions about refunds, chargebacks, or risk management, please contact our support team.
            We&apos;re here to help you succeed on the platform.
          </p>
          <a
            href="mailto:support@coachify.com"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Contact Support →
          </a>
        </GradientCard>
      </div>
    </DashboardLayout>
  );
}



