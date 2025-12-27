"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GradientCard } from "@/components/ui/GradientCard";

const faqs = [
  {
    question: "How do I find the right coach for me?",
    answer: "Use our advanced filters to search by sport, skill level, price range, and coaching style. Read coach profiles, watch their intro videos, and check reviews from other students. You can also book a free intro session to see if it's a good fit.",
  },
  {
    question: "Are the coaches verified and safe?",
    answer: "Yes! All coaches go through our verification process. We check credentials, experience, and background. Verified coaches display a badge on their profile. We also have strict safety policies and guardian requirements for students under 16.",
  },
  {
    question: "How do online coaching sessions work?",
    answer: "Sessions are conducted via video call (Zoom, Google Meet, etc.). Your coach will send you a meeting link before the session. You can book 30-minute or 60-minute sessions, and many coaches offer free 15-minute intro consultations.",
  },
  {
    question: "Can I get a refund if I'm not satisfied?",
    answer: "Yes, we offer refunds for courses and sessions within 7 days of purchase if you're not satisfied. Contact our support team, and we'll process your refund. See our Trust & Safety page for full details.",
  },
  {
    question: "How much do coaching sessions cost?",
    answer: "Prices vary by coach and session length. Most coaches offer 30-minute sessions starting around $30-50 and 60-minute sessions from $50-100. Many coaches also offer free intro consultations. Check individual coach profiles for exact pricing.",
  },
  {
    question: "Can I learn from courses instead of live sessions?",
    answer: "Absolutely! Browse our course marketplace to find structured video courses on specific skills and techniques. Courses include multiple lessons, practice drills, and lifetime access. Perfect for learning at your own pace.",
  },
  {
    question: "How do I become a coach on Coachify?",
    answer: "Click 'Become a Coach' and complete our onboarding process. You'll create your profile, set your pricing, upload an intro video, and set your availability. Once verified by our team, you'll be visible to students and can start earning.",
  },
  {
    question: "Is Coachify suitable for all skill levels?",
    answer: "Yes! We have coaches for beginners, intermediate players, advanced athletes, and competitive professionals. Filter by skill level when searching to find coaches who specialize in your level.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-[var(--card)] to-[var(--background)]">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-xl text-gray-400">
            Everything you need to know about Coachify
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <GradientCard
              key={index}
              gradient="blue-purple"
              className="cursor-pointer"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <div className="flex items-start justify-between">
                <h3 className="text-xl font-semibold pr-8 flex-1">{faq.question}</h3>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0 text-2xl text-gray-400"
                >
                  ▼
                </motion.div>
              </div>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="text-gray-300 mt-4 pt-4 border-t border-gray-700">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </GradientCard>
          ))}
        </div>
      </div>
    </section>
  );
}



