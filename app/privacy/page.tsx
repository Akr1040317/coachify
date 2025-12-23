"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GradientCard } from "@/components/ui/GradientCard";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="space-y-6">
          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
            <p className="text-gray-300 mb-4">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Account information (name, email, profile data)</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Coaching preferences and goals</li>
              <li>Communication records</li>
              <li>Usage data and analytics</li>
            </ul>
          </GradientCard>

          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-300 mb-4">
              We use collected information to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Provide and improve our services</li>
              <li>Process payments and transactions</li>
              <li>Match students with appropriate coaches</li>
              <li>Send service-related communications</li>
              <li>Ensure platform safety and security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </GradientCard>

          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">3. Information Sharing</h2>
            <p className="text-gray-300 mb-4">
              We share information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>With coaches when you book sessions or purchase courses</li>
              <li>With payment processors (Stripe) for transaction processing</li>
              <li>When required by law or to protect rights and safety</li>
              <li>With your explicit consent</li>
            </ul>
            <p className="text-gray-300 mt-4">
              We do not sell your personal information to third parties.
            </p>
          </GradientCard>

          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
            <p className="text-gray-300 mb-4">
              We implement industry-standard security measures to protect your information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication and access controls</li>
              <li>Regular security audits and updates</li>
              <li>PCI-compliant payment processing</li>
            </ul>
          </GradientCard>

          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">5. Children's Privacy</h2>
            <p className="text-gray-300 mb-4">
              Our service is designed for users 13 and older. For users under 18:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Guardian consent is required during onboarding</li>
              <li>Guardians receive notifications about account activity</li>
              <li>We comply with COPPA and other applicable regulations</li>
            </ul>
          </GradientCard>

          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">6. Your Rights</h2>
            <p className="text-gray-300 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Opt out of marketing communications</li>
              <li>Export your data</li>
            </ul>
            <p className="text-gray-300 mt-4">
              To exercise these rights, contact us at{" "}
              <a href="mailto:privacy@coachify.com" className="text-blue-400 hover:text-blue-300 underline">
                privacy@coachify.com
              </a>
            </p>
          </GradientCard>

          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">7. Cookies and Tracking</h2>
            <p className="text-gray-300 mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Maintain your session and preferences</li>
              <li>Analyze usage patterns</li>
              <li>Improve our services</li>
            </ul>
            <p className="text-gray-300 mt-4">
              You can control cookies through your browser settings.
            </p>
          </GradientCard>

          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">8. Third-Party Services</h2>
            <p className="text-gray-300 mb-4">
              We use third-party services that may collect information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li><strong>Stripe:</strong> Payment processing (see Stripe's privacy policy)</li>
              <li><strong>Firebase:</strong> Authentication and data storage (see Google's privacy policy)</li>
              <li><strong>Vercel:</strong> Hosting and analytics</li>
            </ul>
          </GradientCard>

          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">9. Changes to Privacy Policy</h2>
            <p className="text-gray-300">
              We may update this privacy policy from time to time. We will notify you of significant
              changes via email or platform notification.
            </p>
          </GradientCard>

          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">10. Contact Us</h2>
            <p className="text-gray-300">
              For privacy-related questions or concerns, contact us at:{" "}
              <a href="mailto:privacy@coachify.com" className="text-blue-400 hover:text-blue-300 underline">
                privacy@coachify.com
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
