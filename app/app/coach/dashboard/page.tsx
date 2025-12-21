"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { onAuthChange } from "@/lib/firebase/auth";
import { getCoachData, getCourses, getArticles, getVideos } from "@/lib/firebase/firestore";
import { where } from "firebase/firestore";
import { User } from "firebase/auth";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { BadgeVerified } from "@/components/ui/BadgeVerified";
import Link from "next/link";
import Image from "next/image";

// For now, we'll create simple placeholder content for each tab
// These can be replaced with actual components later

interface CoachDashboardProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

function CoachDashboard({ activeTab = "dashboard", setActiveTab }: CoachDashboardProps) {
  const [coachData, setCoachData] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [freeVideos, setFreeVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [userId, setUserId] = useState<string | null>(null);
  const [showLearnMoreModal, setShowLearnMoreModal] = useState(false);
  const [courseScroll, setCourseScroll] = useState(0);
  const [articleScroll, setArticleScroll] = useState(0);

  useEffect(() => {
    if (setActiveTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab, setActiveTab]);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (user) {
        setUserId(user.uid);
        try {
          const coach = await getCoachData(user.uid);
          setCoachData(coach);
          
          // Load courses, articles, and videos
          if (coach) {
            const [coursesData, articlesData, videosData] = await Promise.all([
              getCourses([where("coachId", "==", user.uid), where("isPublished", "==", true)]),
              getArticles([where("authorCoachId", "==", user.uid), where("status", "==", "published")]),
              getVideos([where("coachId", "==", user.uid), where("isFree", "==", true), where("visibility", "==", "public")]),
            ]);
            setCourses(coursesData);
            setArticles(articlesData);
            setFreeVideos(videosData.slice(0, 6));
          }
        } catch (error) {
          console.error("Error loading coach data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    if (setActiveTab) {
      setActiveTab(tab);
    } else {
      setCurrentTab(tab);
    }
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (currentTab) {
      case "messages":
        return (
          <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Messages</h2>
              <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                {/* Conversations List */}
                <div className="lg:col-span-1 bg-[var(--card)] border border-gray-800 rounded-xl p-4 overflow-y-auto">
                  <div className="space-y-2">
                    <div className="p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                          S
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-white font-medium truncate">Student Name</p>
                            <span className="text-gray-400 text-xs">2h</span>
                          </div>
                          <p className="text-gray-400 text-sm truncate">Last message preview...</p>
                        </div>
                      </div>
                    </div>
                    {/* Add more conversation items here */}
                  </div>
                  {!coachData && (
                    <div className="text-center text-gray-400 text-sm py-8">
                      No messages yet. Start a conversation with your students!
                    </div>
                  )}
                </div>
                
                {/* Chat Area */}
                <div className="lg:col-span-2 bg-[var(--card)] border border-gray-800 rounded-xl p-6 flex flex-col">
                  <div className="flex-1 overflow-y-auto mb-4">
                    <div className="text-center text-gray-400 py-12">
                      Select a conversation to start messaging
                    </div>
                  </div>
                  {/* Message input area can be added here */}
                </div>
              </div>
            </div>
          </div>
        );
      case "bookings":
        return (
          <div className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Bookings</h2>
              <GradientCard className="p-8">
                <p className="text-gray-400">Your bookings will appear here.</p>
              </GradientCard>
            </div>
          </div>
        );
      case "students":
        return (
          <div className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Students</h2>
              <GradientCard className="p-8">
                <p className="text-gray-400">Your students will appear here.</p>
              </GradientCard>
            </div>
          </div>
        );
      case "courses":
        return (
          <div className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Courses</h2>
              <GradientCard className="p-8">
                <p className="text-gray-400">Your courses will appear here.</p>
              </GradientCard>
            </div>
          </div>
        );
      case "content":
        return (
          <div className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Content</h2>
              <GradientCard className="p-8">
                <p className="text-gray-400">Your content will appear here.</p>
              </GradientCard>
            </div>
          </div>
        );
      case "articles":
        return (
          <div className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Articles</h2>
              <GradientCard className="p-8">
                <p className="text-gray-400">Your articles will appear here.</p>
              </GradientCard>
            </div>
          </div>
        );
      case "my-page":
        if (!coachData) {
          return (
            <div className="p-6 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <div className="text-gray-400">Loading profile...</div>
              </div>
            </div>
          );
        }

        const price30 = coachData.sessionOffers?.paid?.find((p: any) => p.minutes === 30)?.priceCents 
          ? coachData.sessionOffers.paid.find((p: any) => p.minutes === 30)!.priceCents / 100 
          : 0;
        const price60 = coachData.sessionOffers?.paid?.find((p: any) => p.minutes === 60)?.priceCents 
          ? coachData.sessionOffers.paid.find((p: any) => p.minutes === 60)!.priceCents / 100 
          : 0;

        return (
          <div className="min-h-[calc(100vh-64px)] bg-[var(--background)] p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Top Profile Card */}
              <GradientCard className="p-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Left: Profile Image and Basic Info */}
                  <div className="flex-shrink-0">
                    {coachData.avatarUrl ? (
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500/30">
                        <Image
                          src={coachData.avatarUrl}
                          alt={coachData.displayName}
                          width={128}
                          height={128}
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
              {courses.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Courses</h2>
                  <div className="relative">
                    <div className="overflow-x-auto scrollbar-hide scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      <div className="flex gap-6 pb-4" style={{ width: 'max-content' }}>
                        {courses.map((course) => (
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
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Articles Carousel */}
              {articles.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">Articles</h2>
                  <div className="relative">
                    <div className="overflow-x-auto scrollbar-hide scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      <div className="flex gap-6 pb-4" style={{ width: 'max-content' }}>
                        {articles.map((article) => (
                          <Link key={article.id} href={`/article/${article.slug}`} className="flex-shrink-0 w-80">
                            <GradientCard className="p-6 h-full hover:scale-105 transition-transform cursor-pointer">
                              <h3 className="text-xl font-bold mb-2">{article.title}</h3>
                              <p className="text-gray-400 text-sm line-clamp-3">{article.excerpt || "Read more..."}</p>
                            </GradientCard>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Learn More Modal */}
              {showLearnMoreModal && (
                <>
                  <div
                    className="fixed inset-0 bg-black/50 z-50"
                    onClick={() => setShowLearnMoreModal(false)}
                  />
                  <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <GradientCard className="max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-3xl font-bold">Experience & Credentials</h2>
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
                          <h3 className="text-xl font-semibold mb-3">Experience Type</h3>
                          <p className="text-gray-300">{coachData.experienceType}</p>
                        </div>
                      )}
                      
                      {coachData.credentials && coachData.credentials.length > 0 && (
                        <div>
                          <h3 className="text-xl font-semibold mb-3">Credentials</h3>
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
                </>
              )}
            </div>
          </div>
        );
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Verification Status on Left */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                Welcome Back!
              </h1>
              {coachData && (
                <p className="text-gray-400 text-lg">
                  {coachData.headline || "Manage your coaching business and connect with students"}
                </p>
              )}
            </div>
            
            {/* Verification Status - Full Width Rectangle */}
            {coachData && (
              <div className="w-full">
                {coachData.isVerified ? (
                  <GradientCard className="p-4 border-green-500/30 bg-green-500/5">
                    <div className="flex items-center gap-3">
                      <BadgeVerified />
                      <div>
                        <h3 className="text-white font-semibold mb-1">Verified Coach</h3>
                        <p className="text-gray-400 text-sm">Your profile is verified and visible to students</p>
                      </div>
                    </div>
                  </GradientCard>
                ) : coachData.status === "pending_verification" ? (
                  <GradientCard className="p-4 border-orange-500/30 bg-orange-500/5">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl flex-shrink-0">⏳</div>
                      <div className="flex-1">
                        <h3 className="text-orange-400 font-semibold mb-1">Pending Verification</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          Your profile is under review. Once verified, you&apos;ll be visible to students 
                          and can start accepting bookings. We verify all coaches to ensure quality and 
                          security. Review typically takes 24-48 hours.
                        </p>
                      </div>
                    </div>
                  </GradientCard>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <GradientCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">📅</div>
              <div className="text-2xl font-bold text-blue-400">0</div>
            </div>
            <h3 className="text-lg font-semibold mb-1">Upcoming Sessions</h3>
            <p className="text-gray-400 text-sm">Bookings this week</p>
          </GradientCard>

          <GradientCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">👥</div>
              <div className="text-2xl font-bold text-purple-400">0</div>
            </div>
            <h3 className="text-lg font-semibold mb-1">Total Students</h3>
            <p className="text-gray-400 text-sm">Active students</p>
          </GradientCard>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <GradientCard className="p-6 hover:scale-105 transition-transform cursor-pointer">
            <button onClick={() => handleTabChange("bookings")} className="block w-full text-left">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-bold mb-2">Manage Bookings</h3>
              <p className="text-gray-400 mb-4">View and manage your upcoming sessions</p>
              <GlowButton variant="outline" size="sm">View Bookings →</GlowButton>
            </button>
          </GradientCard>

          <GradientCard className="p-6 hover:scale-105 transition-transform cursor-pointer">
            <button onClick={() => handleTabChange("students")} className="block w-full text-left">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-bold mb-2">My Students</h3>
              <p className="text-gray-400 mb-4">Connect with your students</p>
              <GlowButton variant="outline" size="sm">View Students →</GlowButton>
            </button>
          </GradientCard>

          <GradientCard className="p-6 hover:scale-105 transition-transform cursor-pointer">
            <button onClick={() => handleTabChange("courses")} className="block w-full text-left">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-bold mb-2">Create Course</h3>
              <p className="text-gray-400 mb-4">Build and publish new courses</p>
              <GlowButton variant="outline" size="sm">Create Course →</GlowButton>
            </button>
          </GradientCard>

          <GradientCard className="p-6 hover:scale-105 transition-transform cursor-pointer">
            <button onClick={() => handleTabChange("content")} className="block w-full text-left">
              <div className="text-4xl mb-4">🎥</div>
              <h3 className="text-xl font-bold mb-2">Manage Content</h3>
              <p className="text-gray-400 mb-4">Upload videos and create content</p>
              <GlowButton variant="outline" size="sm">Manage Content →</GlowButton>
            </button>
          </GradientCard>

          <GradientCard className="p-6 hover:scale-105 transition-transform cursor-pointer">
            <button onClick={() => handleTabChange("articles")} className="block w-full text-left">
              <div className="text-4xl mb-4">✍️</div>
              <h3 className="text-xl font-bold mb-2">Write Article</h3>
              <p className="text-gray-400 mb-4">Share your expertise</p>
              <GlowButton variant="outline" size="sm">Write Article →</GlowButton>
            </button>
          </GradientCard>

          <GradientCard className="p-6 hover:scale-105 transition-transform cursor-pointer">
            <button onClick={() => handleTabChange("my-page")} className="block w-full text-left">
              <div className="text-4xl mb-4">🌐</div>
              <h3 className="text-xl font-bold mb-2">My Page</h3>
              <p className="text-gray-400 mb-4">View your public profile</p>
              <GlowButton variant="outline" size="sm">View My Page →</GlowButton>
            </button>
          </GradientCard>
        </div>

        {/* Profile Overview */}
        {coachData && (
          <GradientCard className="p-8">
            <h2 className="text-2xl font-bold mb-6">Profile Overview</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Headline</p>
                <p className="text-white font-medium">{coachData.headline || "Not set"}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Sports</p>
                <p className="text-white font-medium">
                  {coachData.sports?.length > 0 ? coachData.sports.join(", ") : "Not set"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Rating</p>
                <p className="text-white font-medium">
                  {coachData.ratingAvg?.toFixed(1) || "N/A"} ({coachData.ratingCount || 0} reviews)
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Status</p>
                <p className="text-white font-medium capitalize">
                  {coachData.status === "pending_verification" ? "Pending Verification" : "Active"}
                </p>
              </div>
            </div>
          </GradientCard>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout role="coach" activeTab={currentTab} setActiveTab={handleTabChange}>
      {renderContent()}
    </DashboardLayout>
  );
}

// Export wrapper that provides tab state
export default function CoachDashboardWrapper() {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  return <CoachDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
}
