"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getCourse, getCourseLessons, getEnrollment, updateEnrollment } from "@/lib/firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import Image from "next/image";

export default function CoursePlayerPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (!user) {
        router.push("/auth?role=student");
        return;
      }
      setUser(user);
      await loadCourse();
    });

    return () => unsubscribe();
  }, [router, courseId]);

  const loadCourse = async () => {
    setLoading(true);
    try {
      const courseData = await getCourse(courseId);
      if (courseData) {
        setCourse(courseData);
        
        const lessonsData = await getCourseLessons(courseId);
        setLessons(lessonsData);
        
        if (user) {
          const enrollmentData = await getEnrollment(user.uid, courseId);
          setEnrollment(enrollmentData);
          
          if (lessonsData.length > 0 && !currentLesson) {
            setCurrentLesson(lessonsData[0]);
          }
        }
      }
    } catch (error) {
      console.error("Error loading course:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonComplete = async (lessonId: string) => {
    if (!user || !enrollment) return;

    const newProgress = {
      ...enrollment.progress,
      [lessonId]: true,
    };

    await updateEnrollment(enrollment.id, newProgress);
    await loadCourse();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!course || !enrollment) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Course not found or not enrolled</div>
      </div>
    );
  }

  const progress = Object.values(enrollment.progress || {}).filter(Boolean).length / lessons.length;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Video Player */}
          <div className="md:col-span-3">
            {currentLesson && (
              <GradientCard>
                <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                  <video
                    src={currentLesson.videoUrl}
                    controls
                    className="w-full h-full"
                    onEnded={() => handleLessonComplete(currentLesson.id)}
                  />
                </div>
                <h2 className="text-2xl font-bold mb-2">{currentLesson.title}</h2>
                <p className="text-gray-400">{currentLesson.description}</p>
              </GradientCard>
            )}
          </div>

          {/* Lessons List */}
          <div>
            <GradientCard>
              <h3 className="text-xl font-bold mb-4">{course.title}</h3>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mb-4">
                {Math.round(progress * 100)}% complete
              </p>
              <div className="space-y-2">
                {lessons.map((lesson, index) => (
                  <button
                    key={lesson.id}
                    onClick={() => setCurrentLesson(lesson)}
                    className={`
                      w-full p-3 rounded-lg border-2 text-left transition-all
                      ${currentLesson?.id === lesson.id
                        ? "border-blue-500 bg-blue-500/10"
                        : enrollment.progress?.[lesson.id]
                        ? "border-green-500/50 bg-green-500/10"
                        : "border-gray-600 hover:border-gray-500"
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-400">Lesson {index + 1}</div>
                        <div className="font-semibold">{lesson.title}</div>
                      </div>
                      {enrollment.progress?.[lesson.id] && (
                        <span className="text-green-400">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </GradientCard>
          </div>
        </div>
      </div>
    </div>
  );
}

