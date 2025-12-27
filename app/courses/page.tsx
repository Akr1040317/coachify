"use client";

import { useState, useEffect } from "react";
import { getCourses, getCoachData, getCourse, getCourseLessons, getEnrollment, type CourseData } from "@/lib/firebase/firestore";
import { where, orderBy } from "firebase/firestore";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { BadgeVerified } from "@/components/ui/BadgeVerified";
import { SPORTS, SKILL_LEVELS } from "@/lib/constants/sports";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/currency";

export default function CoursesPage() {
  const [courses, setCourses] = useState<(CourseData & { id: string; coachName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sport: "",
    level: "",
  });

  useEffect(() => {
    loadCourses();
  }, [filters]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const constraints: any[] = [where("isPublished", "==", true), orderBy("createdAt", "desc")];
      
      if (filters.sport) {
        constraints.push(where("sport", "==", filters.sport));
      }
      
      if (filters.level) {
        constraints.push(where("skillLevel", "==", filters.level));
      }

      const coursesData = await getCourses(constraints);
      
      // Load coach names
      const coursesWithCoaches = await Promise.all(
        coursesData.map(async (course) => {
          const coach = await getCoachData(course.coachId);
          return { ...course, coachName: coach?.displayName || "Unknown Coach" };
        })
      );

      setCourses(coursesWithCoaches);
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Courses</h1>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="md:col-span-1">
            <GradientCard>
              <h2 className="text-xl font-bold mb-4">Filters</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sport</label>
                  <select
                    value={filters.sport}
                    onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                  >
                    <option value="">All Sports</option>
                    {SPORTS.map(sport => (
                      <option key={sport} value={sport}>{sport}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Skill Level</label>
                  <select
                    value={filters.level}
                    onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                  >
                    <option value="">All Levels</option>
                    {SKILL_LEVELS.map(level => (
                      <option key={level} value={level.toLowerCase()}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
            </GradientCard>
          </div>

          {/* Results */}
          <div className="md:col-span-3">
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading courses...</div>
            ) : courses.length === 0 ? (
              <GradientCard>
                <p className="text-center text-gray-400">No courses found matching your filters.</p>
              </GradientCard>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Course Card Component with Modal
function CourseCard({ course }: { course: CourseData & { id: string; coachName?: string } }) {
  const [showModal, setShowModal] = useState(false);
  const [courseDetails, setCourseDetails] = useState<any>(null);
  const [coach, setCoach] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [enrollment, setEnrollment] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((user: User | null) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleClick = async () => {
    setShowModal(true);
    setLoading(true);
    try {
      const courseData = await getCourse(course.id);
      if (courseData) {
        setCourseDetails(courseData);
        const coachData = await getCoachData(courseData.coachId);
        setCoach(coachData);
        const lessonsData = await getCourseLessons(course.id);
        setLessons(lessonsData);
        
        if (user) {
          try {
            const enrollmentData = await getEnrollment(user.uid, course.id);
            setEnrollment(enrollmentData);
          } catch (error) {
            // Enrollment might not exist, that's okay
            setEnrollment(null);
          }
        }
      }
    } catch (error) {
      console.error("Error loading course:", error);
      alert("Failed to load course details. Please try again.");
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      window.location.href = `/auth?redirect=/courses`;
      return;
    }

    try {
      const response = await fetch("/api/checkout/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: course.id }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create checkout");
      }
      
      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      alert(error.message || "Failed to start checkout. Please try again.");
    }
  };

  return (
    <>
      <div onClick={handleClick} className="cursor-pointer">
        <GradientCard gradient="blue-purple" glow className="hover:scale-105 transition-transform">
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
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-xl font-bold mb-1">{course.title}</h3>
              <p className="text-sm text-gray-400">by {course.coachName}</p>
            </div>
          </div>
          <p className="text-gray-300 mb-4 line-clamp-2">{course.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                {course.sport}
              </span>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                {course.skillLevel}
              </span>
            </div>
            <span className="text-2xl font-bold">{formatCurrency(course.priceCents || 0)}</span>
          </div>
        </GradientCard>
      </div>

      {/* Course Detail Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              onClick={() => setShowModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
            >
              <div
                className="pointer-events-auto max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-[var(--card)] rounded-xl border-2 border-gray-700 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {loading ? (
                  <div className="p-12 text-center text-gray-400">Loading course details...</div>
                ) : courseDetails ? (
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <h2 className="text-4xl font-bold mb-4">{courseDetails.title}</h2>
                        {coach && (
                          <div className="flex items-center gap-3 mb-4">
                            <Link href={`/coach/${coach.userId}`} className="flex items-center gap-2 hover:text-blue-400">
                              <span>by {coach.displayName}</span>
                              {coach.isVerified && <BadgeVerified />}
                            </Link>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                            {courseDetails.sport}
                          </span>
                          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm capitalize">
                            {courseDetails.skillLevel}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowModal(false)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {courseDetails.thumbnailUrl && (
                      <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
                        <Image
                          src={courseDetails.thumbnailUrl}
                          alt={courseDetails.title}
                          width={800}
                          height={450}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="mb-6">
                      <h3 className="text-2xl font-bold mb-3">About This Course</h3>
                      <p className="text-gray-300 text-lg whitespace-pre-line">{courseDetails.description}</p>
                    </div>

                    {courseDetails.outcomes && courseDetails.outcomes.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-xl font-bold mb-3">What you&apos;ll learn</h3>
                        <ul className="space-y-2">
                          {courseDetails.outcomes.map((outcome: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-blue-400 mt-1">✓</span>
                              <span className="text-gray-300">{outcome}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {lessons.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-xl font-bold mb-3">Course Content</h3>
                        <div className="space-y-2">
                          {lessons.map((lesson: any, index: number) => (
                            <div key={lesson.id} className="p-3 bg-[var(--background)] rounded-lg">
                              <span className="text-sm text-gray-400 mr-3">Lesson {index + 1}</span>
                              <span className="font-semibold">{lesson.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-6 border-t border-gray-700">
                      <div>
                        <div className="text-4xl font-bold mb-2">{formatCurrency(courseDetails.priceCents || 0)}</div>
                        <div className="text-gray-400">{lessons.length} lessons</div>
                      </div>
                      {enrollment ? (
                        <Link href={`/app/student/library/course/${course.id}`}>
                          <GlowButton variant="primary" size="lg" glowColor="orange">
                            Continue Learning
                          </GlowButton>
                        </Link>
                      ) : (
                        <GlowButton
                          variant="primary"
                          size="lg"
                          glowColor="orange"
                          onClick={handlePurchase}
                        >
                          Enroll Now
                        </GlowButton>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-gray-400">Course not found</div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
