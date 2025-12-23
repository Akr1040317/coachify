"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GradientCard } from "@/components/ui/GradientCard";

export default function TrustAndSafetyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Trust & Safety</h1>
        
        <div className="space-y-6">
          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">Our Commitment</h2>
            <p className="text-gray-300 mb-4">
              At Coachify, we&apos;re committed to creating a safe, trustworthy platform for students and coaches.
              We take the safety and security of our community seriously.
            </p>
          </GradientCard>

          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">Coach Verification</h2>
            <p className="text-gray-300 mb-4">
              All coaches on our platform go through a verification process to ensure they meet our standards:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Identity verification</li>
              <li>Background checks where applicable</li>
              <li>Credential and experience validation</li>
              <li>Compliance with our code of conduct</li>
            </ul>
          </GradientCard>

          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">Student Protection</h2>
            <p className="text-gray-300 mb-4">
              We protect students through:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Secure payment processing</li>
              <li>Refund policies for unsatisfied students</li>
              <li>Review and rating system</li>
              <li>24/7 support for safety concerns</li>
              <li>Guardian involvement for students under 18</li>
            </ul>
          </GradientCard>

          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">Reporting Issues</h2>
            <p className="text-gray-300 mb-4">
              If you encounter any safety concerns, inappropriate behavior, or violations of our policies,
              please report them immediately:
            </p>
            <p className="text-gray-300">
              <strong>Email:</strong>{" "}
              <a href="mailto:safety@coachify.com" className="text-blue-400 hover:text-blue-300 underline">
                safety@coachify.com
              </a>
            </p>
            <p className="text-gray-300 mt-2">
              We investigate all reports promptly and take appropriate action, including account suspension
              or termination when necessary.
            </p>
          </GradientCard>

          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">Code of Conduct</h2>
            <p className="text-gray-300 mb-4">
              All users must adhere to our code of conduct:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Respectful and professional communication</li>
              <li>No harassment, discrimination, or abusive behavior</li>
              <li>Accurate representation of qualifications and services</li>
              <li>Compliance with all applicable laws and regulations</li>
              <li>Protection of student privacy and data</li>
            </ul>
          </GradientCard>

          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">Payment Security</h2>
            <p className="text-gray-300 mb-4">
              All payments are processed securely through Stripe, a PCI-compliant payment processor.
              We never store your full payment card information on our servers.
            </p>
            <p className="text-gray-300">
              For refund requests or payment disputes, please contact our support team.
            </p>
          </GradientCard>
        </div>
      </div>

      <Footer />
    </div>
  );
}
