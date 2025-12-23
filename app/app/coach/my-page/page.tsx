"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { onAuthChange } from "@/lib/firebase/auth";
import { getCoachData, getVideos, getCourses, getArticles, type CoachData } from "@/lib/firebase/firestore";
import { where } from "firebase/firestore";
import { User } from "firebase/auth";
import { GradientCard } from "@/components/ui/GradientCard";
import { BadgeVerified } from "@/components/ui/BadgeVerified";
import Link from "next/link";

export default function CoachMyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [coachData, setCoachData] = useState<CoachData | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLearnMoreModal, setShowLearnMoreModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (user) {
        setUser(user);
        await loadCoachData(user.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadCoachData = async (coachId: string) => {
    setLoading(true);
    try {
      const coach = await getCoachData(coachId);
      if (coach) {
        setCoachData(coach);

        // Load courses
        const coachCourses = await getCourses([
          where("coachId", "==", coachId),
          where("isPublished", "==", true),
        ]);
        setCourses(coachCourses);

        // Load articles
        const coachArticles = await getArticles([
          where("authorCoachId", "==", coachId),
          where("status", "==", "published"),
        ]);
        setArticles(coachArticles);
      }
    } catch (error) {
      console.error("Error loading coach data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="coach" activeTab="my-page">
        <div className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-gray-400">Loading profile...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!coachData) {
    return (
      <DashboardLayout role="coach" activeTab="my-page">
        <div className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-gray-400">Coach profile not found</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const price30 = coachData.sessionOffers?.paid?.find((p: any) => p.minutes === 30)?.priceCents 
    ? coachData.sessionOffers.paid.find((p: any) => p.minutes === 30)!.priceCents / 100 
    : 0;
  const price60 = coachData.sessionOffers?.paid?.find((p: any) => p.minutes === 60)?.priceCents 
    ? coachData.sessionOffers.paid.find((p: any) => p.minutes === 60)!.priceCents / 100 
    : 0;

  const profileImageUrl = (coachData?.avatarUrl && coachData.avatarUrl.trim() !== "") 
    ? coachData.avatarUrl 
    : (user?.photoURL || null);

  return (
    <DashboardLayout role="coach" activeTab="my-page">
      <div className="min-h-[calc(100vh-64px)] bg-[var(--background)] p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Top Profile Card */}
          <GradientCard className="p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left: Profile Image and Basic Info */}
              <div className="flex-shrink-0">
                {profileImageUrl ? (
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500/30">
                    <img
                      src={profileImageUrl}
                      alt={coachData.displayName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-blue-500/30">
                    {(coachData.displayName || "C")[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Center: Name, Title, Description */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold">{coachData.displayName}</h1>
                  {coachData.isVerified && <BadgeVerified />}
                </div>
                <p className="text-xl text-gray-300 mb-4">{coachData.headline}</p>
                <p className="text-gray-400 leading-relaxed">{coachData.bio || "No description available."}</p>
              </div>

              {/* Right: About & Coaching Philosophy */}
              <div className="lg:w-80 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-300 mb-2">About</h3>
                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-4">
                    {coachData.bio || "No bio available."}
                  </p>
                </div>
                {coachData.coachingPhilosophy && (
                  <div>
                    <h3 className="font-semibold text-gray-300 mb-2">Coaching Philosophy</h3>
                    <p className="text-gray-400 text-sm leading-relaxed line-clamp-4">
                      {coachData.coachingPhilosophy}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => setShowLearnMoreModal(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                >
                  Learn More →
                </button>
              </div>
            </div>
          </GradientCard>

          {/* Session Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Free Consultation */}
            {coachData.sessionOffers?.freeIntroEnabled && (
              <GradientCard className="p-6 border-green-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-green-400">Free Intro Consultation</h3>
                  <span className="text-2xl font-bold text-green-400">FREE</span>
                </div>
                <p className="text-gray-400 mb-2">
                  {coachData.sessionOffers.freeIntroMinutes} minutes
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  Get to know the coach and discuss your goals. Perfect for first-time students.
                </p>
                <button className="w-full px-4 py-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 hover:bg-green-500/30 transition-colors font-semibold">
                  Book Free Intro
                </button>
              </GradientCard>
            )}

            {/* 30 Minute Session */}
            {price30 > 0 && (
              <GradientCard className="p-6 border-blue-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">30 Minute Session</h3>
                  <span className="text-2xl font-bold text-blue-400">${price30}</span>
                </div>
                <p className="text-gray-400 mb-2">30 minutes</p>
                <p className="text-gray-500 text-sm mb-4">
                  Quick check-ins, technique reviews, or focused skill development sessions.
                </p>
                <button className="w-full px-4 py-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/30 transition-colors font-semibold">
                  Book Session
                </button>
              </GradientCard>
            )}

            {/* 60 Minute Session */}
            {price60 > 0 && (
              <GradientCard className="p-6 border-purple-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">60 Minute Session</h3>
                  <span className="text-2xl font-bold text-purple-400">${price60}</span>
                </div>
                <p className="text-gray-400 mb-2">60 minutes</p>
                <p className="text-gray-500 text-sm mb-4">
                  Comprehensive training sessions with detailed feedback and personalized coaching.
                </p>
                <button className="w-full px-4 py-3 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/30 transition-colors font-semibold">
                  Book Session
                </button>
              </GradientCard>
            )}
          </div>

          {/* Courses Carousel */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Courses</h2>
            <div className="relative">
              <div className="overflow-x-auto scrollbar-hide scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex gap-6 pb-4" style={{ width: 'max-content' }}>
                  {courses.length > 0 ? (
                    courses.map((course) => (
                      <Link key={course.id} href={`/course/${course.id}`} className="flex-shrink-0 w-80">
                        <GradientCard className="p-6 h-full hover:scale-105 transition-transform cursor-pointer">
                          <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                          <p className="text-gray-400 text-sm mb-4 line-clamp-3">{course.description}</p>
                          {course.priceCents > 0 ? (
                            <p className="text-blue-400 font-bold text-lg">${course.priceCents / 100}</p>
                          ) : (
                            <p className="text-green-400 font-bold text-lg">FREE</p>
                          )}
                        </GradientCard>
                      </Link>
                    ))
                  ) : (
                    // Placeholder card matching the course card style
                    <div className="flex-shrink-0 w-80">
                      <GradientCard className="p-6 h-full opacity-60">
                        <div className="flex items-center justify-center mb-2">
                          <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-gray-500">No courses yet</h3>
                        <p className="text-gray-500 text-sm mb-4 line-clamp-3">Create your first course to share your expertise with students</p>
                        <p className="text-gray-600 text-sm">Coming soon</p>
                      </GradientCard>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Articles Carousel */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Articles</h2>
            <div className="relative">
              <div className="overflow-x-auto scrollbar-hide scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex gap-6 pb-4" style={{ width: 'max-content' }}>
                  {articles.length > 0 ? (
                    articles.map((article) => (
                      <Link key={article.id} href={`/article/${article.slug}`} className="flex-shrink-0 w-80">
                        <GradientCard className="p-6 h-full hover:scale-105 transition-transform cursor-pointer">
                          <h3 className="text-xl font-bold mb-2">{article.title}</h3>
                          <p className="text-gray-400 text-sm line-clamp-3">{article.excerpt || "Read more..."}</p>
                        </GradientCard>
                      </Link>
                    ))
                  ) : (
                    // Placeholder card matching the article card style
                    <div className="flex-shrink-0 w-80">
                      <GradientCard className="p-6 h-full opacity-60">
                        <div className="flex items-center justify-center mb-2">
                          <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-gray-500">No articles yet</h3>
                        <p className="text-gray-500 text-sm line-clamp-3">Write articles to share your knowledge and attract more students</p>
                      </GradientCard>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Learn More Modal */}
          {showLearnMoreModal && (
            <>
              <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                onClick={() => setShowLearnMoreModal(false)}
              />
              <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
                <div className="pointer-events-auto max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                  <GradientCard className="p-8 bg-[var(--card)] border-2 border-gray-700 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-3xl font-bold text-white">Experience & Credentials</h2>
                      <button
                        onClick={() => setShowLearnMoreModal(false)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    {coachData.experienceType && (
                      <div className="mb-6">
                        <h3 className="text-xl font-semibold mb-3 text-white">Experience Type</h3>
                        <p className="text-gray-300">{coachData.experienceType}</p>
                      </div>
                    )}
                    
                    {coachData.credentials && coachData.credentials.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold mb-3 text-white">Credentials</h3>
                        <ul className="space-y-2">
                          {coachData.credentials.map((cred: string, idx: number) => (
                            <li key={idx} className="text-gray-300 flex items-start gap-2">
                              <span className="text-blue-400 mt-1">•</span>
                              <span>{cred}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </GradientCard>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
