"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { onAuthChange } from "@/lib/firebase/auth";
import { getCoachData, getCourses, getArticles, getVideos, getBookings, getStudentData, getCoachNotes } from "@/lib/firebase/firestore";
import { where } from "firebase/firestore";
import { User } from "firebase/auth";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { BadgeVerified } from "@/components/ui/BadgeVerified";
import { PaymentStatusCard } from "@/components/coach/PaymentStatusCard";
import { CourseModal } from "@/components/ui/CourseModal";
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
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showLearnMoreModal, setShowLearnMoreModal] = useState(false);
  const [courseScroll, setCourseScroll] = useState(0);
  const [articleScroll, setArticleScroll] = useState(0);
  const [stripeStatus, setStripeStatus] = useState<{
    hasAccount: boolean;
    status: string;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
  } | null>(null);
  const [pendingEarnings, setPendingEarnings] = useState<number>(0);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);

  useEffect(() => {
    if (activeTab !== undefined) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  // Load students when students tab is active
  useEffect(() => {
    if (currentTab === "students" && userId && students.length === 0 && !loadingStudents) {
      loadStudents(userId);
    }
  }, [currentTab, userId]);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (user) {
        setUser(user);
        setUserId(user.uid);
        try {
          const coach = await getCoachData(user.uid);
          
          if (!coach) {
            // Coach document doesn't exist - redirect to onboarding
            console.log("No coach data found, redirecting to onboarding");
            setLoading(false);
            window.location.href = "/onboarding/coach/1";
            return;
          }
          
          setCoachData(coach);
          
          // Load courses, articles, and videos
          const [coursesData, articlesData, videosData] = await Promise.all([
            getCourses([where("coachId", "==", user.uid), where("isPublished", "==", true)]).catch(() => []),
            getArticles([where("authorCoachId", "==", user.uid), where("status", "==", "published")]).catch(() => []),
            getVideos([where("coachId", "==", user.uid), where("isFree", "==", true), where("visibility", "==", "public")]).catch(() => []),
          ]);
          setCourses(coursesData);
          setArticles(articlesData);
          setFreeVideos(videosData.slice(0, 6));

          // Load Stripe Connect status and pending earnings (don't block on these)
          loadStripeStatus(user.uid).catch(err => console.error("Error loading Stripe status:", err));
          loadPendingEarnings(user.uid).catch(err => console.error("Error loading pending earnings:", err));
        } catch (error) {
          console.error("Error loading coach data:", error);
          // If there's an error, still set loading to false so user can see something
          setLoading(false);
        } finally {
          setLoading(false);
        }
      } else {
        // No user - redirect to auth
        window.location.href = "/auth";
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
    // Load students when switching to students tab
    if (tab === "students" && userId && students.length === 0) {
      loadStudents(userId);
    }
  };

  const loadStripeStatus = async (coachId: string) => {
    try {
      const response = await fetch(`/api/coaches/stripe-connect/onboarding?coachId=${coachId}`);
      if (response.ok) {
        const data = await response.json();
        setStripeStatus(data);
      } else {
        // If API returns error, set status to indicate no account
        const errorData = await response.json().catch(() => ({}));
        if (errorData.code === "ACCOUNT_NOT_FOUND" || response.status === 404) {
          setStripeStatus({
            hasAccount: false,
            status: "not_setup",
            chargesEnabled: false,
            payoutsEnabled: false,
          });
        }
      }
    } catch (error) {
      console.error("Error loading Stripe status:", error);
      // Set default status on error so banner can still show
      setStripeStatus({
        hasAccount: false,
        status: "not_setup",
        chargesEnabled: false,
        payoutsEnabled: false,
      });
    }
  };

  const loadPendingEarnings = async (coachId: string) => {
    try {
      const { getPendingPayoutAmount } = await import("@/lib/firebase/payouts");
      const amount = await getPendingPayoutAmount(coachId);
      setPendingEarnings(amount);
    } catch (error) {
      console.error("Error loading pending earnings:", error);
    }
  };

  const loadStudents = async (coachId: string) => {
    setLoadingStudents(true);
    try {
      // Get all bookings to find unique students
      const bookings = await getBookings([where("coachId", "==", coachId)]);
      const uniqueStudentIds = [...new Set(bookings.map(b => b.studentId))];

      const studentsData = await Promise.all(
        uniqueStudentIds.map(async (studentId) => {
          const student = await getStudentData(studentId);
          const studentBookings = bookings.filter(b => b.studentId === studentId);
          const notes = await getCoachNotes([
            where("coachId", "==", coachId),
            where("studentId", "==", studentId),
          ]);

          return {
            id: studentId,
            student,
            bookingsCount: studentBookings.length,
            lastSession: studentBookings.sort((a, b) => 
              b.scheduledStart.toMillis() - a.scheduledStart.toMillis()
            )[0],
            notesCount: notes.length,
          };
        })
      );

      setStudents(studentsData);
    } catch (error) {
      console.error("Error loading students:", error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleStripeSetup = async () => {
    if (!userId) return;
    window.location.href = "/app/coach/onboarding/stripe";
  };

  // Render content based on active tab
  const renderContent = () => {
    // Use currentTab for rendering since it updates immediately when tabs change
    switch (currentTab) {
      case "dashboard":
        return renderDashboard();
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
              <h2 className="text-3xl font-bold mb-6">My Students</h2>
              
              {loadingStudents ? (
                <div className="text-center py-12 text-gray-400">Loading students...</div>
              ) : students.length === 0 ? (
                <GradientCard className="p-8">
                  <div className="text-center">
                    <div className="text-6xl mb-4">👥</div>
                    <p className="text-gray-400 text-lg mb-2">No students yet.</p>
                    <p className="text-gray-500 text-sm">Start accepting bookings to see your students here.</p>
                  </div>
                </GradientCard>
              ) : (
                <div className="space-y-4">
                  {students.map((studentData) => (
                    <Link key={studentData.id} href={`/app/coach/student/${studentData.id}`}>
                      <GradientCard className="cursor-pointer hover:scale-[1.02] transition-transform p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                                {(studentData.student?.displayName || "S")[0].toUpperCase()}
                              </div>
                              <div>
                                <h3 className="text-xl font-bold mb-1">
                                  {studentData.student?.displayName || "Student"}
                                </h3>
                                <div className="flex gap-4 text-sm text-gray-400">
                                  {studentData.student?.primarySport && (
                                    <span>Primary Sport: {studentData.student.primarySport}</span>
                                  )}
                                  {studentData.student?.level && (
                                    <span>Level: {studentData.student.level}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-6 mt-4 text-sm">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-gray-400">
                                  {studentData.bookingsCount} {studentData.bookingsCount === 1 ? 'session' : 'sessions'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span className="text-gray-400">
                                  {studentData.notesCount} {studentData.notesCount === 1 ? 'note' : 'notes'}
                                </span>
                              </div>
                              {studentData.lastSession && (
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-gray-400">
                                    Last: {new Date(studentData.lastSession.scheduledStart.toMillis()).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <GlowButton variant="outline" size="sm">
                            View Details →
                          </GlowButton>
                        </div>
                      </GradientCard>
                    </Link>
                  ))}
                </div>
              )}
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
      case "offerings":
        // Redirect to the offerings page
        if (typeof window !== "undefined") {
          window.location.href = "/app/coach/offerings";
        }
        return (
          <div className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="text-gray-400">Redirecting to offerings...</div>
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
      case "revenue":
        return (
          <div className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Revenue Dashboard</h2>
              <div className="text-gray-400">Redirecting to revenue page...</div>
              {typeof window !== "undefined" && (
                <script dangerouslySetInnerHTML={{ __html: `window.location.href = "/app/coach/dashboard/revenue";` }} />
              )}
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
                    {(() => {
                      // Prioritize avatarUrl from Firestore, fallback to Google photoURL
                      const profileImageUrl = (coachData?.avatarUrl && coachData.avatarUrl.trim() !== "") 
                        ? coachData.avatarUrl 
                        : (user?.photoURL || null);
                      
                      console.log("Profile image debug:", { 
                        avatarUrl: coachData?.avatarUrl, 
                        photoURL: user?.photoURL, 
                        finalUrl: profileImageUrl 
                      });
                      
                      return profileImageUrl ? (
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
                      );
                    })()}
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
                          <div
                            key={course.id}
                            onClick={() => {
                              setSelectedCourseId(course.id);
                              setShowCourseModal(true);
                            }}
                            className="flex-shrink-0 w-80 cursor-pointer"
                          >
                            <GradientCard className="p-6 h-full hover:scale-105 transition-transform cursor-pointer">
                              <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                              <p className="text-gray-400 text-sm mb-4 line-clamp-3">{course.description}</p>
                              {course.priceCents > 0 ? (
                                <p className="text-blue-400 font-bold text-lg">${course.priceCents / 100}</p>
                              ) : (
                                <p className="text-green-400 font-bold text-lg">FREE</p>
                              )}
                            </GradientCard>
                          </div>
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
        );
      default:
        // Default to dashboard view
        return renderDashboard();
    }
  };

  const renderDashboard = () => {
    // Check if payment setup is complete
    // Show banner if: no stripeStatus (not checked yet), or status is not active, or charges/payouts not enabled
    const isPaymentSetupComplete = stripeStatus?.status === "active" && stripeStatus?.chargesEnabled && stripeStatus?.payoutsEnabled;
    const shouldShowBanner = !stripeStatus || !isPaymentSetupComplete;

    return (
      <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Persistent Payment Setup Banner */}
          {shouldShowBanner && (
            <div className="mb-6">
              <GradientCard className="p-4 border-orange-500/30 bg-orange-500/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-orange-400 mb-1">Complete Payment Setup</h3>
                      <p className="text-gray-400 text-sm">
                        Connect your bank account to start earning from your courses and sessions. This is required to create content.
                      </p>
                    </div>
                  </div>
                  <GlowButton 
                    variant="primary" 
                    size="sm"
                    onClick={handleStripeSetup}
                  >
                    Set Up Payments →
                  </GlowButton>
                </div>
              </GradientCard>
            </div>
          )}

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

        {/* Stripe Connect Payment Status - Only show if payment is fully set up (active) to avoid duplicate with banner above */}
        {stripeStatus && stripeStatus.hasAccount && stripeStatus.status === "active" && stripeStatus.chargesEnabled && stripeStatus.payoutsEnabled && (
          <div className="mb-8">
            <PaymentStatusCard
              stripeStatus={stripeStatus}
              pendingEarnings={pendingEarnings}
              onSetupClick={handleStripeSetup}
            />
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <GradientCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="text-2xl font-bold text-blue-400">0</div>
            </div>
            <h3 className="text-lg font-semibold mb-1">Upcoming Sessions</h3>
            <p className="text-gray-400 text-sm">Bookings this week</p>
          </GradientCard>

          <GradientCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <div className="text-2xl font-bold text-purple-400">{students.length}</div>
            </div>
            <h3 className="text-lg font-semibold mb-1">Total Students</h3>
            <p className="text-gray-400 text-sm">Active students</p>
          </GradientCard>
        </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <GradientCard 
              className="p-6 hover:scale-105 transition-transform cursor-pointer"
              onClick={() => handleTabChange("bookings")}
            >
              <div className="text-left">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="text-xl font-bold mb-2">Manage Bookings</h3>
                <p className="text-gray-400 mb-4">View and manage your upcoming sessions</p>
                <div onClick={(e) => { e.stopPropagation(); handleTabChange("bookings"); }}>
                  <GlowButton variant="outline" size="sm">View Bookings →</GlowButton>
                </div>
              </div>
            </GradientCard>

            <GradientCard 
              className="p-6 hover:scale-105 transition-transform cursor-pointer"
              onClick={() => handleTabChange("students")}
            >
              <div className="text-left">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-xl font-bold mb-2">My Students</h3>
                <p className="text-gray-400 mb-4">Connect with your students</p>
                <div onClick={(e) => { e.stopPropagation(); handleTabChange("students"); }}>
                  <GlowButton variant="outline" size="sm">View Students →</GlowButton>
                </div>
              </div>
            </GradientCard>

            <GradientCard 
              className="p-6 hover:scale-105 transition-transform cursor-pointer"
              onClick={() => handleTabChange("courses")}
            >
              <div className="text-left">
                <div className="mb-4">
                  <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Create Course</h3>
                <p className="text-gray-400 mb-4">Build and publish new courses</p>
                <div onClick={(e) => { e.stopPropagation(); handleTabChange("courses"); }}>
                  <GlowButton variant="outline" size="sm">Create Course →</GlowButton>
                </div>
              </div>
            </GradientCard>

            <GradientCard 
              className="p-6 hover:scale-105 transition-transform cursor-pointer"
              onClick={() => handleTabChange("offerings")}
            >
              <div className="text-left">
                <div className="mb-4">
                  <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Manage Offerings</h3>
                <p className="text-gray-400 mb-4">Create and customize session types</p>
                <div onClick={(e) => { e.stopPropagation(); handleTabChange("offerings"); }}>
                  <GlowButton variant="outline" size="sm">Manage Offerings →</GlowButton>
                </div>
              </div>
            </GradientCard>

            <GradientCard 
              className="p-6 hover:scale-105 transition-transform cursor-pointer"
              onClick={() => handleTabChange("articles")}
            >
              <div className="text-left">
                <div className="mb-4">
                  <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Write Article</h3>
                <p className="text-gray-400 mb-4">Share your expertise</p>
                <div onClick={(e) => { e.stopPropagation(); handleTabChange("articles"); }}>
                  <GlowButton variant="outline" size="sm">Write Article →</GlowButton>
                </div>
              </div>
            </GradientCard>

            <GradientCard 
              className="p-6 hover:scale-105 transition-transform cursor-pointer"
              onClick={() => handleTabChange("my-page")}
            >
              <div className="text-left">
                <div className="text-4xl mb-4">🌐</div>
                <h3 className="text-xl font-bold mb-2">My Page</h3>
                <p className="text-gray-400 mb-4">View your public profile</p>
                <div onClick={(e) => { e.stopPropagation(); handleTabChange("my-page"); }}>
                  <GlowButton variant="outline" size="sm">View My Page →</GlowButton>
                </div>
              </div>
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
  };

  const handleTabChangeFromLayout = (tab: string) => {
    // Update local state immediately for rendering
    setCurrentTab(tab);
    // Also update parent state if provided
    if (setActiveTab) {
      setActiveTab(tab);
    }
  };

  return (
    <>
      <DashboardLayout role="coach" activeTab={currentTab} setActiveTab={handleTabChangeFromLayout}>
        {renderContent()}
      </DashboardLayout>
      {selectedCourseId && (
        <CourseModal
          courseId={selectedCourseId}
          isOpen={showCourseModal}
          onClose={() => {
            setShowCourseModal(false);
            setSelectedCourseId(null);
          }}
        />
      )}
    </>
  );
}

// Export wrapper that provides tab state
export default function CoachDashboardWrapper() {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  return <CoachDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
}


