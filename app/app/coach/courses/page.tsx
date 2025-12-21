"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getCourses, createCourse, updateCourse } from "@/lib/firebase/firestore";
import { where, orderBy } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import Link from "next/link";
import Image from "next/image";

export default function CoachCoursesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (!user) {
        router.push("/auth?role=coach");
        return;
      }
      setUser(user);
      await loadCourses(user.uid);
    });

    return () => unsubscribe();
  }, [router]);

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

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">My Courses</h1>
          <Link href="/app/coach/course/new">
            <GlowButton variant="primary" glowColor="orange">
              Create Course
            </GlowButton>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading courses...</div>
        ) : courses.length === 0 ? (
          <GradientCard>
            <p className="text-center text-gray-400 py-8">No courses yet. Create your first course!</p>
          </GradientCard>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {courses.map((course) => (
              <Link key={course.id} href={`/app/coach/course/${course.id}/edit`}>
                <GradientCard gradient="orange" className="cursor-pointer hover:scale-105 transition-transform">
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
                  <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                  <p className="text-gray-400 mb-4 line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                        {course.sport}
                      </span>
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                        {course.skillLevel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">${course.priceCents / 100}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        course.isPublished 
                          ? "bg-green-500/20 text-green-400" 
                          : "bg-gray-500/20 text-gray-400"
                      }`}>
                        {course.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                  </div>
                </GradientCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
