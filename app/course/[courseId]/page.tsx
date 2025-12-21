"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCourse, getCourseLessons, getCoachData, getEnrollment, createEnrollment, createPurchase } from "@/lib/firebase/firestore";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { BadgeVerified } from "@/components/ui/BadgeVerified";
import Image from "next/image";
import Link from "next/link";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [coach, setCoach] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((user: User | null) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId, user]);

  const loadCourseData = async () => {
    setLoading(true);
    try {
      const courseData = await getCourse(courseId);
      if (courseData) {
        setCourse(courseData);
        
        const coachData = await getCoachData(courseData.coachId);
        setCoach(coachData);

        const lessonsData = await getCourseLessons(courseId);
        setLessons(lessonsData);

        if (user) {
          const enrollmentData = await getEnrollment(user.uid, courseId);
          setEnrollment(enrollmentData);
        }
      }
    } catch (error) {
      console.error("Error loading course:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      router.push(`/auth?redirect=/course/${courseId}`);
      return;
    }

    // Create checkout session (will be handled by API route)
    try {
      const response = await fetch("/api/checkout/course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert("Failed to start checkout. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Course not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {course.thumbnailUrl && (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <Image
                  src={course.thumbnailUrl}
                  alt={course.title}
                  width={800}
                  height={450}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <GradientCard>
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <div className="flex items-center gap-4 mb-4">
                {coach && (
                  <Link href={`/coach/${coach.userId}`} className="flex items-center gap-2 hover:text-blue-400">
                    <span>by {coach.displayName}</span>
                    {coach.isVerified && <BadgeVerified />}
                  </Link>
                )}
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                  {course.sport}
                </span>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                  {course.skillLevel}
                </span>
              </div>
              <p className="text-gray-300 text-lg whitespace-pre-line">{course.description}</p>
            </GradientCard>

            <GradientCard>
              <h2 className="text-2xl font-bold mb-4">What you&apos;ll learn</h2>
              <ul className="space-y-2">
                {course.outcomes.map((outcome: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-400 mt-1">✓</span>
                    <span className="text-gray-300">{outcome}</span>
                  </li>
                ))}
              </ul>
            </GradientCard>

            <GradientCard>
              <h2 className="text-2xl font-bold mb-4">Course Content</h2>
              <div className="space-y-3">
                {lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="p-4 bg-[var(--card)] rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-400 mr-3">Lesson {index + 1}</span>
                        <span className="font-semibold">{lesson.title}</span>
                      </div>
                      {enrollment ? (
                        <Link href={`/app/student/library/course/${courseId}/lesson/${lesson.id}`}>
                          <GlowButton variant="outline" size="sm">Watch</GlowButton>
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-500">Locked</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </GradientCard>
          </div>

          {/* Sidebar */}
          <div>
            <GradientCard gradient="orange" glow>
              <div className="text-center mb-6">
                <div className="text-4xl font-bold mb-2">${course.priceCents / 100}</div>
                <div className="text-gray-400">{lessons.length} lessons</div>
              </div>

              {enrollment ? (
                <Link href={`/app/student/library/course/${courseId}`}>
                  <GlowButton variant="primary" size="lg" className="w-full" glowColor="orange">
                    Continue Learning
                  </GlowButton>
                </Link>
              ) : (
                <GlowButton
                  variant="primary"
                  size="lg"
                  className="w-full"
                  glowColor="orange"
                  onClick={handlePurchase}
                >
                  Enroll Now
                </GlowButton>
              )}

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span className="text-gray-300">Lifetime access</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span className="text-gray-300">Mobile and desktop</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span className="text-gray-300">Certificate of completion</span>
                </div>
              </div>
            </GradientCard>
          </div>
        </div>
      </div>
    </div>
  );
}
