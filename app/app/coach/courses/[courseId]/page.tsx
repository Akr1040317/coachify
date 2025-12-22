"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { onAuthChange } from "@/lib/firebase/auth";
import { getCourse, getVideos, getArticles, type CourseData, type VideoData, type ArticleData } from "@/lib/firebase/firestore";
import { User } from "firebase/auth";
import { where, in as firestoreIn } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import Image from "next/image";
import Link from "next/link";

export default function CourseViewPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<(CourseData & { id: string }) | null>(null);
  const [videos, setVideos] = useState<(VideoData & { id: string })[]>([]);
  const [articles, setArticles] = useState<(ArticleData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (user) {
        setUser(user);
        await loadCourseData();
      }
    });

    return () => unsubscribe();
  }, [courseId]);

  const loadCourseData = async () => {
    setLoading(true);
    try {
      const courseData = await getCourse(courseId);
      if (!courseData) {
        router.push("/app/coach/courses");
        return;
      }
      setCourse(courseData as CourseData & { id: string });

      // Load videos and articles
      const videoIds = courseData.videoIds || [];
      const articleIds = courseData.articleIds || [];

      // Fetch all videos/articles and filter by IDs (Firestore 'in' operator has limitations)
      const [allVideos, allArticles] = await Promise.all([
        videoIds.length > 0 ? getVideos([where("coachId", "==", courseData.coachId)]) : Promise.resolve([]),
        articleIds.length > 0 ? getArticles([where("authorCoachId", "==", courseData.coachId)]) : Promise.resolve([]),
      ]);

      // Filter to only include videos/articles in the course
      const videosData = allVideos.filter((v) => videoIds.includes(v.id));
      const articlesData = allArticles.filter((a) => articleIds.includes(a.id));

      // Sort by the order in course.videoIds and course.articleIds
      const sortedVideos = videoIds
        .map((id) => videosData.find((v) => v.id === id))
        .filter((v): v is VideoData & { id: string } => v !== undefined);

      const sortedArticles = articleIds
        .map((id) => articlesData.find((a) => a.id === id))
        .filter((a): a is ArticleData & { id: string } => a !== undefined);

      setVideos(sortedVideos);
      setArticles(sortedArticles);
    } catch (error) {
      console.error("Error loading course:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateTotalTime = () => {
    const videoTime = videos.reduce((sum, v) => {
      // Assuming videos have durationSeconds - adjust based on your data structure
      return sum + (v as any).durationSeconds || 0;
    }, 0);
    // Articles typically take 5-10 minutes to read, estimate 7 minutes average
    const articleTime = articles.length * 7 * 60;
    return Math.round((videoTime + articleTime) / 60);
  };

  if (loading) {
    return (
      <DashboardLayout role="coach">
        <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12 text-gray-400">Loading course...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <DashboardLayout role="coach">
      <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 rounded-lg border-2 border-gray-600 hover:border-gray-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                  {course.title}
                </h1>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm border border-blue-500/30">
                  {course.sport}
                </span>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm border border-purple-500/30 capitalize">
                  {course.skillLevel}
                </span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm border border-green-500/30">
                  ${(course.priceCents / 100).toFixed(2)}
                </span>
                {course.estimatedMinutes && (
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm border border-orange-500/30">
                    {course.estimatedMinutes} min
                  </span>
                )}
              </div>
            </div>
            <GlowButton variant="primary" onClick={() => router.push(`/app/coach/courses/${courseId}/edit`)}>
              Edit Course
            </GlowButton>
          </div>

          {/* Course Thumbnail */}
          {course.thumbnailUrl && (
            <div className="aspect-video bg-black rounded-xl overflow-hidden">
              <Image
                src={course.thumbnailUrl}
                alt={course.title}
                width={1200}
                height={675}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Course Details */}
          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-4">About This Course</h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-6">{course.description}</p>

            {course.outcomes && course.outcomes.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-3">What You'll Learn</h3>
                <ul className="space-y-2">
                  {course.outcomes.map((outcome, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-300">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Course Stats */}
            <div className="grid md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-gray-800">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Content</p>
                <p className="text-2xl font-bold text-white">{videos.length + articles.length} items</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Videos</p>
                <p className="text-2xl font-bold text-blue-400">{videos.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Articles</p>
                <p className="text-2xl font-bold text-purple-400">{articles.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Estimated Time</p>
                <p className="text-2xl font-bold text-orange-400">
                  {course.estimatedMinutes || calculateTotalTime()} min
                </p>
              </div>
            </div>
          </GradientCard>

          {/* Videos Carousel */}
          {videos.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold mb-6">Videos</h2>
              <div className="overflow-x-auto scrollbar-hide scroll-smooth pb-4">
                <div className="flex gap-6" style={{ width: "max-content" }}>
                  {videos.map((video) => (
                    <GradientCard key={video.id} className="flex-shrink-0 w-80 p-6">
                      {video.thumbnailUrl ? (
                        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                          <Image
                            src={video.thumbnailUrl}
                            alt={video.title}
                            width={320}
                            height={180}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg mb-4 flex items-center justify-center">
                          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <h3 className="text-xl font-bold mb-2 line-clamp-2">{video.title}</h3>
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{video.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {(video as any).durationSeconds ? formatDuration((video as any).durationSeconds) : "N/A"}
                        </span>
                        {video.isFree ? (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">
                            FREE
                          </span>
                        ) : (
                          <span className="text-blue-400 font-bold">
                            ${((video as any).priceCents || 0) / 100}
                          </span>
                        )}
                      </div>
                    </GradientCard>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Articles Carousel */}
          {articles.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold mb-6">Articles</h2>
              <div className="overflow-x-auto scrollbar-hide scroll-smooth pb-4">
                <div className="flex gap-6" style={{ width: "max-content" }}>
                  {articles.map((article) => (
                    <Link key={article.id} href={`/article/${article.slug}`}>
                      <GradientCard className="flex-shrink-0 w-80 p-6 hover:scale-105 transition-transform cursor-pointer">
                        {article.coverImageUrl ? (
                          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                            <Image
                              src={article.coverImageUrl}
                              alt={article.title}
                              width={320}
                              height={180}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg mb-4 flex items-center justify-center">
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </div>
                        )}
                        <h3 className="text-xl font-bold mb-2 line-clamp-2">{article.title}</h3>
                        <p className="text-gray-400 text-sm mb-4 line-clamp-3">{article.excerpt}</p>
                        <div className="flex items-center gap-2">
                          {article.tags.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </GradientCard>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty States */}
          {videos.length === 0 && articles.length === 0 && (
            <GradientCard className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">No content yet</h3>
              <p className="text-gray-400 mb-6">Add videos and articles to your course</p>
              <GlowButton variant="primary" onClick={() => router.push(`/app/coach/courses/${courseId}/edit`)}>
                Add Content
              </GlowButton>
            </GradientCard>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
