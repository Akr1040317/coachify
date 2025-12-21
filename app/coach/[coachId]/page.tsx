"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getCoachData, getVideos, getCourses, getArticles, getReviews, type CoachData } from "@/lib/firebase/firestore";
import { where } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { BadgeVerified } from "@/components/ui/BadgeVerified";
import { GlowButton } from "@/components/ui/GlowButton";
import Link from "next/link";
import Image from "next/image";

export default function CoachProfilePage() {
  const params = useParams();
  const coachId = params.coachId as string;
  const [coach, setCoach] = useState<CoachData | null>(null);
  const [freeVideos, setFreeVideos] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCoachData();
  }, [coachId]);

  const loadCoachData = async () => {
    setLoading(true);
    try {
      const coachData = await getCoachData(coachId);
      if (coachData) {
        setCoach(coachData);
        
        // Load free videos
        const videos = await getVideos([
          where("coachId", "==", coachId),
          where("isFree", "==", true),
          where("visibility", "==", "public"),
        ]);
        setFreeVideos(videos.slice(0, 6));

        // Load courses
        const coachCourses = await getCourses([
          where("coachId", "==", coachId),
          where("isPublished", "==", true),
        ]);
        setCourses(coachCourses.slice(0, 6));

        // Load articles
        const coachArticles = await getArticles([
          where("authorCoachId", "==", coachId),
          where("status", "==", "published"),
        ]);
        setArticles(coachArticles.slice(0, 6));

        // Load reviews
        const coachReviews = await getReviews([
          where("coachId", "==", coachId),
        ]);
        setReviews(coachReviews);
      }
    } catch (error) {
      console.error("Error loading coach:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Coach not found</div>
      </div>
    );
  }

  const price30 = coach.sessionOffers?.paid?.find(p => p.minutes === 30)?.priceCents 
    ? coach.sessionOffers.paid.find(p => p.minutes === 30)!.priceCents / 100 
    : 0;
  const price60 = coach.sessionOffers?.paid?.find(p => p.minutes === 60)?.priceCents 
    ? coach.sessionOffers.paid.find(p => p.minutes === 60)!.priceCents / 100 
    : 0;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8">
            {coach.avatarUrl && (
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500/30">
                <Image
                  src={coach.avatarUrl}
                  alt={coach.displayName}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{coach.displayName}</h1>
                {coach.isVerified && <BadgeVerified />}
              </div>
              <p className="text-xl text-gray-300 mb-4">{coach.headline}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {coach.sports.map((sport, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"
                  >
                    {sport}
                  </span>
                ))}
              </div>
              {coach.ratingAvg && (
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 text-2xl">⭐</span>
                  <span className="text-2xl font-bold">{coach.ratingAvg.toFixed(1)}</span>
                  <span className="text-gray-400">({coach.ratingCount || 0} reviews)</span>
                </div>
              )}
            </div>
            <div>
              <Link href={`/app/student/bookings/new?coachId=${coachId}`}>
                <GlowButton variant="primary" size="lg" glowColor="orange">
                  Book Session
                </GlowButton>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* About */}
            <GradientCard>
              <h2 className="text-2xl font-bold mb-4">About</h2>
              <p className="text-gray-300 whitespace-pre-line">{coach.bio}</p>
              {coach.coachingPhilosophy && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Coaching Philosophy</h3>
                  <p className="text-gray-300 whitespace-pre-line">{coach.coachingPhilosophy}</p>
                </div>
              )}
            </GradientCard>

            {/* Intro Video */}
            {coach.introVideoUrl && (
              <GradientCard>
                <h2 className="text-2xl font-bold mb-4">Intro Video</h2>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    src={coach.introVideoUrl}
                    controls
                    className="w-full h-full"
                  />
                </div>
              </GradientCard>
            )}

            {/* Free Videos */}
            {freeVideos.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Free Videos</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {freeVideos.map((video) => (
                    <Link key={video.id} href={`/video/${video.id}`}>
                      <GradientCard className="cursor-pointer hover:scale-105 transition-transform">
                        {video.thumbnailUrl && (
                          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-3">
                            <Image
                              src={video.thumbnailUrl}
                              alt={video.title}
                              width={400}
                              height={225}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <h3 className="font-bold mb-1">{video.title}</h3>
                        <p className="text-sm text-gray-400 line-clamp-2">{video.description}</p>
                      </GradientCard>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Courses */}
            {courses.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Courses</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {courses.map((course) => (
                    <Link key={course.id} href={`/course/${course.id}`}>
                      <GradientCard gradient="orange" className="cursor-pointer hover:scale-105 transition-transform">
                        {course.thumbnailUrl && (
                          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-3">
                            <Image
                              src={course.thumbnailUrl}
                              alt={course.title}
                              width={400}
                              height={225}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <h3 className="font-bold mb-1">{course.title}</h3>
                        <p className="text-sm text-gray-400 mb-2 line-clamp-2">{course.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold">${course.priceCents / 100}</span>
                          <span className="text-sm text-gray-400">{course.skillLevel}</span>
                        </div>
                      </GradientCard>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Articles */}
            {articles.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Articles</h2>
                <div className="space-y-4">
                  {articles.map((article) => (
                    <Link key={article.id} href={`/article/${article.slug}`}>
                      <GradientCard className="cursor-pointer hover:scale-105 transition-transform">
                        <h3 className="text-xl font-bold mb-2">{article.title}</h3>
                        <p className="text-gray-400 line-clamp-2">{article.excerpt}</p>
                      </GradientCard>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Reviews</h2>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <GradientCard key={review.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={i < review.rating ? "text-yellow-400" : "text-gray-600"}
                            >
                              ⭐
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-300">{review.text}</p>
                    </GradientCard>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <GradientCard>
              <h3 className="text-xl font-bold mb-4">Pricing</h3>
              <div className="space-y-3">
                {coach.sessionOffers?.freeIntroEnabled && (
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <div className="font-semibold">Free Intro</div>
                    <div className="text-sm text-gray-400">{coach.sessionOffers.freeIntroMinutes} minutes</div>
                  </div>
                )}
                {price30 > 0 && (
                  <div className="p-3 bg-[var(--card)] rounded-lg">
                    <div className="font-semibold">30 minutes</div>
                    <div className="text-2xl font-bold">${price30}</div>
                  </div>
                )}
                {price60 > 0 && (
                  <div className="p-3 bg-[var(--card)] rounded-lg">
                    <div className="font-semibold">60 minutes</div>
                    <div className="text-2xl font-bold">${price60}</div>
                  </div>
                )}
              </div>
            </GradientCard>

            <GradientCard>
              <h3 className="text-xl font-bold mb-4">Specialties</h3>
              <div className="space-y-2">
                {Object.entries(coach.specialtiesBySport || {}).map(([sport, specialties]) => (
                  <div key={sport}>
                    <div className="font-semibold text-sm mb-1">{sport}</div>
                    <div className="flex flex-wrap gap-1">
                      {specialties.slice(0, 3).map((specialty, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </GradientCard>
          </div>
        </div>
      </div>
    </div>
  );
}
