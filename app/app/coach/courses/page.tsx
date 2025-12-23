"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { onAuthChange } from "@/lib/firebase/auth";
import { getCourses, deleteCourse, type CourseData } from "@/lib/firebase/firestore";
import { User } from "firebase/auth";
import { where, orderBy } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { PaymentSetupModal } from "@/components/coach/PaymentSetupModal";
import { checkStripeConnectStatus } from "@/lib/firebase/stripe-helpers";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function CoachCoursesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<(CourseData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingStripe, setCheckingStripe] = useState(true);
  const [stripeStatus, setStripeStatus] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (user) {
        setUser(user);
        await Promise.all([
          loadCourses(user.uid),
          loadStripeStatus(user.uid)
        ]);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadStripeStatus = async (coachId: string) => {
    try {
      const status = await checkStripeConnectStatus(coachId);
      setStripeStatus(status);
    } catch (error) {
      console.error("Error loading Stripe status:", error);
      // Set default status on error so page can still render
      setStripeStatus({
        hasAccount: false,
        status: "not_setup",
        chargesEnabled: false,
        payoutsEnabled: false,
      });
    } finally {
      setCheckingStripe(false);
    }
  };

  const loadCourses = async (coachId: string) => {
    setLoading(true);
    try {
      const coursesData = await getCourses([
        where("coachId", "==", coachId),
        orderBy("createdAt", "desc"),
      ]);
      setCourses(coursesData);
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return;
    }

    setDeletingId(courseId);
    try {
      await deleteCourse(courseId);
      setCourses(courses.filter((c) => c.id !== courseId));
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Failed to delete course. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = (courseId: string) => {
    router.push(`/app/coach/courses/${courseId}`);
  };

  const handleEdit = (courseId: string) => {
    router.push(`/app/coach/courses/${courseId}/edit`);
  };

  const handleCreateCourse = () => {
    const canCreate = stripeStatus?.status === "active" && stripeStatus?.chargesEnabled && stripeStatus?.payoutsEnabled;
    
    if (!canCreate) {
      setShowPaymentModal(true);
      return;
    }
    
    router.push("/app/coach/course/new");
  };

  const calculateTotalTime = (course: CourseData & { id: string }) => {
    // This will be calculated from videos when we load them
    return course.estimatedMinutes || 0;
  };

  if (loading || checkingStripe) {
    return (
      <DashboardLayout role="coach">
        <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12 text-gray-400">Loading...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const canCreateCourse = stripeStatus?.status === "active" && stripeStatus?.chargesEnabled && stripeStatus?.payoutsEnabled;

  return (
    <DashboardLayout role="coach">
      <PaymentSetupModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        stripeStatus={stripeStatus}
      />
      <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                My Courses
              </h1>
              <p className="text-gray-400">
                Create and manage your courses with videos and lessons
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <GlowButton 
                variant="primary" 
                onClick={handleCreateCourse}
                disabled={!canCreateCourse}
              >
                + Create Course
              </GlowButton>
              {!canCreateCourse && (
                <p className="text-xs text-orange-400 text-center">
                  Complete payment setup to create courses
                </p>
              )}
            </div>
          </div>

          {/* Courses Grid */}
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading courses...</div>
          ) : courses.length === 0 ? (
            <GradientCard className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">No courses yet</h3>
              <p className="text-gray-400 mb-6">Create your first course to start teaching students</p>
              <GlowButton 
                variant="primary" 
                onClick={handleCreateCourse}
                disabled={!canCreateCourse}
              >
                Create Your First Course
              </GlowButton>
              {!canCreateCourse && (
                <p className="text-xs text-orange-400 mt-2">
                  Complete payment setup to create courses
                </p>
              )}
            </GradientCard>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {courses.map((course) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <GradientCard className="p-6 h-full flex flex-col">
                      {/* Thumbnail */}
                      {course.thumbnailUrl && (
                        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                          <Image
                            src={course.thumbnailUrl}
                            alt={course.title}
                            width={400}
                            height={225}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {!course.thumbnailUrl && (
                        <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg mb-4 flex items-center justify-center">
                          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      )}

                      {/* Course Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-bold line-clamp-2">{course.title}</h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                              course.isPublished
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                            }`}
                          >
                            {course.isPublished ? "Published" : "Draft"}
                          </span>
                        </div>

                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{course.description}</p>

                        {/* Stats */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                            {course.sport}
                          </span>
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                            {course.skillLevel}
                          </span>
                          {calculateTotalTime(course) > 0 && (
                            <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">
                              {calculateTotalTime(course)} min
                            </span>
                          )}
                        </div>

                        {/* Content Count */}
                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>{course.videoIds?.length || 0} videos</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>{course.articleIds?.length || 0} articles</span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="mb-4">
                          <span className="text-2xl font-bold text-blue-400">
                            ${(course.priceCents / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t border-gray-800">
                        <GlowButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(course.id)}
                          className="flex-1"
                        >
                          View
                        </GlowButton>
                        <GlowButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(course.id)}
                          className="flex-1"
                        >
                          Edit
                        </GlowButton>
                        <button
                          onClick={() => handleDelete(course.id)}
                          disabled={deletingId === course.id}
                          className="px-4 py-2 rounded-lg border-2 border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === course.id ? (
                            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </GradientCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

