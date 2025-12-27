"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { onAuthChange } from "@/lib/firebase/auth";
import { getCoachData, createCourse } from "@/lib/firebase/firestore";
import { uploadCourseThumbnail } from "@/lib/firebase/storage";
import { User } from "firebase/auth";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { SKILL_LEVELS } from "@/lib/constants/sports";
import { PaymentSetupBlock } from "@/components/coach/PaymentSetupBlock";
import { checkStripeConnectStatus } from "@/lib/firebase/stripe-helpers";

export default function NewCoursePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [coachData, setCoachData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<any>(null);
  const [checkingStripe, setCheckingStripe] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    sport: "",
    skillLevel: "beginner" as "beginner" | "intermediate" | "advanced" | "competitive",
    priceCents: 0,
    thumbnailFile: null as File | null,
    previewVideoFile: null as File | null,
    outcomes: [""],
  });

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (!user) {
        router.push("/auth?role=coach");
        return;
      }
      setUser(user);
      // Load coach data to get their sports
      try {
        const coach = await getCoachData(user.uid);
        setCoachData(coach);
        if (coach?.sports && coach.sports.length > 0) {
          // Set first sport as default
          setFormData((prev) => ({ ...prev, sport: coach.sports[0] }));
        }
        
        // Check Stripe Connect status
        const status = await checkStripeConnectStatus(user.uid);
        setStripeStatus(status);
      } catch (error) {
        console.error("Error loading coach data:", error);
      } finally {
        setLoading(false);
        setCheckingStripe(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      let thumbnailUrl: string | undefined;

      if (formData.thumbnailFile) {
        thumbnailUrl = await uploadCourseThumbnail(formData.thumbnailFile, user.uid, `course-${Date.now()}`);
      }

      const courseData: any = {
        coachId: user.uid,
        title: formData.title,
        description: formData.description,
        outcomes: formData.outcomes.filter(Boolean),
        sport: formData.sport,
        skillLevel: formData.skillLevel,
        priceCents: Math.round(formData.priceCents * 100),
        currency: "USD",
        videoIds: [], // Start with empty arrays - videos/articles added in edit page
        articleIds: [],
        isPublished: false,
      };
      
      // Only include thumbnailUrl if it exists
      if (thumbnailUrl) {
        courseData.thumbnailUrl = thumbnailUrl;
      }
      // Preview video can be added later - don't include undefined
      
      const courseId = await createCourse(courseData);

      router.push(`/app/coach/courses/${courseId}/edit`);
    } catch (error) {
      console.error("Error creating course:", error);
      alert("Failed to create course. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const availableSports = coachData?.sports || [];

  if (loading) {
    return (
      <DashboardLayout role="coach">
        <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12 text-gray-400">Loading...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (availableSports.length === 0) {
    return (
      <DashboardLayout role="coach">
        <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <GradientCard className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">No Sports Configured</h3>
              <p className="text-gray-400 mb-6">
                You need to complete your coach profile and select the sports you coach before creating a course.
              </p>
              <GlowButton variant="primary" onClick={() => router.push("/app/coach/dashboard")}>
                Go to Dashboard
              </GlowButton>
            </GradientCard>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="coach">
      <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                Create New Course
              </h1>
              <p className="text-gray-400">Fill in the course details. You&apos;ll add videos and articles after creation.</p>
            </div>
            <GlowButton variant="outline" onClick={() => router.push("/app/coach/courses")}>
              Cancel
            </GlowButton>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <GradientCard className="p-8">
              <h2 className="text-2xl font-bold mb-6">Course Details</h2>
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Course Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Advanced Basketball Shooting Techniques"
                    className="w-full px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what students will learn in this course..."
                    className="w-full px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] resize-none"
                    required
                  />
                </div>

                {/* Sport and Skill Level */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Sport *</label>
                    <select
                      value={formData.sport}
                      onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                      className="w-full px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a sport...</option>
                      {availableSports.map((sport: string) => (
                        <option key={sport} value={sport}>
                          {sport}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Only sports from your profile are available
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Skill Level *</label>
                    <select
                      value={formData.skillLevel}
                      onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value as any })}
                      className="w-full px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      {SKILL_LEVELS.map((level) => (
                        <option key={level.toLowerCase()} value={level.toLowerCase()}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Price (USD) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.priceCents / 100}
                      onChange={(e) => setFormData({ ...formData, priceCents: parseFloat(e.target.value) * 100 || 0 })}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Learning Outcomes */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Learning Outcomes (one per line)
                  </label>
                  <textarea
                    value={formData.outcomes.join("\n")}
                    onChange={(e) => setFormData({ ...formData, outcomes: e.target.value.split("\n") })}
                    placeholder="Students will learn to...&#10;Students will master...&#10;Students will understand..."
                    className="w-full px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter each outcome on a new line</p>
                </div>

                {/* Thumbnail */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Course Thumbnail</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, thumbnailFile: e.target.files?.[0] || null })}
                    className="w-full px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Recommended: 1200x675px</p>
                </div>

                {/* Preview */}
                {formData.thumbnailFile && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Preview:</p>
                    <div className="w-full max-w-md aspect-video bg-gray-800 rounded-lg overflow-hidden">
                      <img
                        src={URL.createObjectURL(formData.thumbnailFile)}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </GradientCard>

            {/* Submit Button */}
            <div className="flex gap-4">
              <GlowButton
                type="button"
                variant="outline"
                onClick={() => router.push("/app/coach/courses")}
                className="flex-1"
              >
                Cancel
              </GlowButton>
              <GlowButton
                type="submit"
                variant="primary"
                size="lg"
                disabled={saving || !formData.title || !formData.description || !formData.sport}
                className="flex-1"
              >
                {saving ? "Creating..." : "Create Course"}
              </GlowButton>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}



