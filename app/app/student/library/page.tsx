"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getEnrollments, getCourse, getCourseLessons, getVideos } from "@/lib/firebase/firestore";
import { where } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import Link from "next/link";
import Image from "next/image";

export default function StudentLibraryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [freeVideos, setFreeVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (!user) {
        router.push("/auth?role=student");
        return;
      }
      setUser(user);
      await loadLibrary(user.uid);
    });

    return () => unsubscribe();
  }, [router]);

  const loadLibrary = async (userId: string) => {
    setLoading(true);
    try {
      // Load enrolled courses
      const enrollmentsData = await getEnrollments([where("userId", "==", userId)]);
      
      const enrollmentsWithCourses = await Promise.all(
        enrollmentsData.map(async (enrollment) => {
          const course = await getCourse(enrollment.courseId);
          const lessons = await getCourseLessons(enrollment.courseId);
          const completedCount = Object.values(enrollment.progress || {}).filter(Boolean).length;
          return {
            ...enrollment,
            course,
            lessons,
            progress: completedCount / lessons.length,
          };
        })
      );

      setEnrollments(enrollmentsWithCourses);

      // Load free videos
      const videos = await getVideos([
        where("isFree", "==", true),
        where("visibility", "==", "public"),
      ]);
      setFreeVideos(videos.slice(0, 12));
    } catch (error) {
      console.error("Error loading library:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">My Library</h1>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading library...</div>
        ) : (
          <div className="space-y-8">
            {enrollments.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">My Courses</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {enrollments.map((enrollment) => (
                    <Link key={enrollment.id} href={`/app/student/library/course/${enrollment.courseId}`}>
                      <GradientCard gradient="orange" className="cursor-pointer hover:scale-105 transition-transform">
                        {enrollment.course?.thumbnailUrl && (
                          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                            <Image
                              src={enrollment.course.thumbnailUrl}
                              alt={enrollment.course.title}
                              width={400}
                              height={225}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <h3 className="text-xl font-bold mb-2">{enrollment.course?.title}</h3>
                        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${(enrollment.progress || 0) * 100}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-400">
                          {Math.round((enrollment.progress || 0) * 100)}% complete
                        </p>
                      </GradientCard>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {freeVideos.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Free Videos</h2>
                <div className="grid md:grid-cols-4 gap-4">
                  {freeVideos.map((video) => (
                    <Link key={video.id} href={`/video/${video.id}`}>
                      <GradientCard className="cursor-pointer hover:scale-105 transition-transform">
                        {video.thumbnailUrl && (
                          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-3">
                            <Image
                              src={video.thumbnailUrl}
                              alt={video.title}
                              width={300}
                              height={169}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <h3 className="font-bold text-sm mb-1 line-clamp-2">{video.title}</h3>
                        <p className="text-xs text-gray-400 line-clamp-2">{video.description}</p>
                      </GradientCard>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {enrollments.length === 0 && freeVideos.length === 0 && (
              <GradientCard>
                <p className="text-center text-gray-400 py-8">
                  Your library is empty. Browse courses and videos to get started!
                </p>
                <div className="text-center mt-4">
                  <Link href="/courses">
                    <GlowButton variant="primary" glowColor="orange">
                      Browse Courses
                    </GlowButton>
                  </Link>
                </div>
              </GradientCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
