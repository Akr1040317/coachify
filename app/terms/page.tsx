"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GradientCard } from "@/components/ui/GradientCard";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="space-y-6">
          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300">
              By accessing and using Coachify, you accept and agree to be bound by the terms and provision
              of this agreement. If you do not agree to these terms, please do not use our service.
            </p>
          </GradientCard>

          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
            <p className="text-gray-300 mb-4">
              Coachify is a platform that connects students with verified sports coaches for online coaching
              sessions, courses, and educational content. We facilitate the connection but are not a party
              to the coaching relationship.
            </p>
          </GradientCard>

          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
            <p className="text-gray-300 mb-4">
              To use certain features of our service, you must register for an account. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Provide accurate and complete information</li>
              <li>Maintain and update your account information</li>
              <li>Keep your account credentials secure</li>
              <li>Be responsible for all activity under your account</li>
            </ul>
          </GradientCard>

          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">4. Coach Responsibilities</h2>
            <p className="text-gray-300 mb-4">
              Coaches are independent service providers and are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Delivering services as described</li>
              <li>Maintaining appropriate qualifications and credentials</li>
              <li>Complying with all applicable laws and regulations</li>
              <li>Providing accurate information about their services</li>
            </ul>
          </GradientCard>

          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">5. Payments and Refunds</h2>
            <p className="text-gray-300 mb-4">
              All payments are processed through Stripe. Our refund policy:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Full refunds available within 7 days of purchase if unsatisfied</li>
              <li>Partial refunds may be available for completed sessions on a case-by-case basis</li>
              <li>Refund requests must be submitted through our support system</li>
              <li>Platform fees are non-refundable</li>
            </ul>
          </GradientCard>

          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">6. Intellectual Property</h2>
            <p className="text-gray-300 mb-4">
              All content on Coachify, including courses, videos, and materials, is protected by copyright
              and other intellectual property laws. Coaches retain ownership of their content but grant
              Coachify a license to display and distribute it on the platform.
            </p>
          </GradientCard>

          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">7. Prohibited Activities</h2>
            <p className="text-gray-300 mb-4">
              You agree not to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Use the service for fraudulent or illegal purposes</li>
              <li>Interfere with the operation of the platform</li>
            </ul>
          </GradientCard>

          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-300">
              Coachify acts as a platform connecting students and coaches. We are not responsible for the
              quality, safety, or legality of coaching services provided. Users participate at their own risk.
            </p>
          </GradientCard>

          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">9. Changes to Terms</h2>
            <p className="text-gray-300">
              We reserve the right to modify these terms at any time. Continued use of the service after
              changes constitutes acceptance of the new terms.
            </p>
          </GradientCard>

          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">10. Contact</h2>
            <p className="text-gray-300">
              For questions about these terms, please contact us at:{" "}
              <a href="mailto:legal@coachify.com" className="text-blue-400 hover:text-blue-300 underline">
                legal@coachify.com
              </a>
            </p>
            <p className="text-gray-300 mt-2 text-sm">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </GradientCard>
        </div>
      </div>

      <Footer />
    </div>
  );
}

