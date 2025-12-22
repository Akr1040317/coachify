"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { onAuthChange } from "@/lib/firebase/auth";
import { getUserData, getStudentData, getBookings, getEnrollments, getCourses, getCoachData, getCoaches } from "@/lib/firebase/firestore";
import { User } from "firebase/auth";
import { where, orderBy } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths, isToday } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { SPORTS, SPORT_EMOJIS, SKILL_LEVELS } from "@/lib/constants/sports";

interface StudentDashboardProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

function StudentDashboard({ activeTab = "dashboard", setActiveTab }: StudentDashboardProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(activeTab);
  const [selectedSport, setSelectedSport] = useState("All");
  const [bookingsViewMode, setBookingsViewMode] = useState<"list" | "calendar">("list");
  const [bookingsFilterStatus, setBookingsFilterStatus] = useState<"all" | "upcoming" | "past" | "today">("all");
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [bookingsWithCoaches, setBookingsWithCoaches] = useState<any[]>([]);
  const [libraryFilterSport, setLibraryFilterSport] = useState<string>("");
  const [libraryFilterLevel, setLibraryFilterLevel] = useState<string>("");
  const [librarySortBy, setLibrarySortBy] = useState<"recent" | "title" | "price-low" | "price-high" | "duration">("recent");
  const [coachesFilterSport, setCoachesFilterSport] = useState<string>("");
  const [coachesFilterExperience, setCoachesFilterExperience] = useState<string>("");
  const [coachesFilterPriceRange, setCoachesFilterPriceRange] = useState<string>("");
  const coachesScrollRef = useRef<HTMLDivElement>(null);
  const coursesScrollRef = useRef<HTMLDivElement>(null);
  const sportsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab !== undefined) {
      setCurrentTab(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (user) {
        setUser(user);
        try {
          const [userInfo, studentInfo] = await Promise.all([
            getUserData(user.uid),
            getStudentData(user.uid),
          ]);
          setUserData(userInfo);
          setStudentData(studentInfo);

          // Load bookings
          const bookingsData = await getBookings([
            where("studentId", "==", user.uid),
            orderBy("scheduledStart", "desc"),
          ]);
          setBookings(bookingsData);

          // Load enrollments and courses
          const enrollmentsData = await getEnrollments([
            where("userId", "==", user.uid),
          ]);
          setEnrollments(enrollmentsData);

          if (enrollmentsData.length > 0) {
            // Fetch courses by IDs from enrollments
            const enrolledCourseIds = enrollmentsData.map((e) => e.courseId);
            // Fetch courses one by one since Firestore 'in' operator has limitations
            const coursesData = await Promise.all(
              enrolledCourseIds.map(async (courseId) => {
                try {
                  const courseDocs = await getCourses([where("__name__", "==", courseId)]);
                  return courseDocs.length > 0 ? courseDocs[0] : null;
                } catch (error) {
                  console.error(`Error fetching course ${courseId}:`, error);
                  return null;
                }
              })
            );
            // Filter out courses from unverified coaches
            const verifiedCoursesData = await Promise.all(
              coursesData
                .filter((c) => c !== null)
                .map(async (course) => {
                  if (!course || !course.coachId) return null;
                  try {
                    const coach = await getCoachData(course.coachId);
                    // Only include courses from verified coaches
                    if (coach && coach.isVerified) {
                      return course;
                    }
                    return null;
                  } catch (error) {
                    console.error(`Error fetching coach ${course.coachId}:`, error);
                    return null;
                  }
                })
            );
            setCourses(verifiedCoursesData.filter((c) => c !== null));
          }

          // Load coaches from bookings
          const uniqueCoachIds = Array.from(new Set(bookingsData.map((b) => b.coachId)));
          const coachesData = await Promise.all(
            uniqueCoachIds.map(async (coachId) => {
              try {
                const coach = await getCoachData(coachId);
                return coach ? { ...coach, id: coachId } : null;
              } catch {
                return null;
              }
            })
          );
          setCoaches(coachesData.filter((c) => c !== null));
        } catch (error) {
          console.error("Error loading student data:", error);
        } finally {
      setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    if (setActiveTab) {
      setActiveTab(tab);
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case "dashboard":
        return renderDashboard();
      case "bookings":
        return renderBookings();
      case "library":
        return renderLibrary();
      case "coaches":
        return renderCoaches();
      default:
        return renderDashboard();
    }
  };

  const scrollCarousel = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
    if (ref.current) {
      const scrollAmount = 400;
      ref.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Coach Card Component with Modal
  const CoachCardComponent = ({ coach }: { coach: any }) => {
    const [showModal, setShowModal] = useState(false);
    const [coachDetails, setCoachDetails] = useState<any>(null);
    const [coachCourses, setCoachCourses] = useState<any[]>([]);
    const [coachOfferings, setCoachOfferings] = useState<any[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const coursesModalScrollRef = useRef<HTMLDivElement>(null);

    const loadCoachDetails = async () => {
      if (coachDetails) return; // Already loaded
      setLoadingDetails(true);
      try {
        // Load full coach data
        const fullCoachData = await getCoachData(coach.id);
        setCoachDetails(fullCoachData);

        // Load coach's courses
        const coursesData = await getCourses([where("coachId", "==", coach.id), where("isPublished", "==", true)]);
        setCoachCourses(coursesData);

        // Load coach's offerings
        if (fullCoachData?.customOfferings) {
          setCoachOfferings(fullCoachData.customOfferings.filter((o: any) => o.isActive));
        }
      } catch (error) {
        console.error("Error loading coach details:", error);
      } finally {
        setLoadingDetails(false);
      }
    };

    const handleLearnMore = () => {
      setShowModal(true);
      loadCoachDetails();
    };

    return (
      <>
        <GradientCard className="w-64 md:w-72 h-[420px] flex-shrink-0 overflow-hidden relative group flex flex-col">
          {coach.isRecommended && (
            <div className="absolute top-3 left-3 z-20 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full text-xs font-bold text-black">
              Recommended
      </div>
          )}
          
          {/* Image with Dark Overlay */}
          <div className="w-full h-56 relative flex-shrink-0">
            <img
              src={coach.avatarUrl}
              alt={coach.displayName}
              className="w-full h-full object-cover"
            />
            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
            
            {/* Information on Image */}
            <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
              <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{coach.displayName}</h3>
              <p className="text-xs text-gray-200 mb-2 line-clamp-1">{coach.headline}</p>
              {coach.sports && coach.sports.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {coach.sports.slice(0, 2).map((sport: string) => (
                    <span key={sport} className="px-2 py-0.5 bg-blue-500/30 text-blue-200 rounded text-[10px] border border-blue-400/30 whitespace-nowrap">
                      {sport}
                    </span>
                  ))}
                  {coach.sports.length > 2 && (
                    <span className="px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded text-[10px] whitespace-nowrap">
                      +{coach.sports.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="p-4 flex flex-col flex-1 min-h-0">
            <p className="text-xs text-gray-400 mb-3 line-clamp-2 flex-shrink-0">{coach.bio}</p>
            <div className="mt-auto">
              <GlowButton 
                variant="primary" 
                size="sm" 
                className="w-full text-sm py-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLearnMore();
                }}
              >
                Learn More
              </GlowButton>
            </div>
          </div>
        </GradientCard>

        {/* Coach Details Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setShowModal(false)}
            >
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
              
              {/* Modal Content */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative bg-[var(--card)] border border-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col z-10"
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 z-20 p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Modal Content - Scrollable */}
                <div className="overflow-y-auto flex-1">
                  {loadingDetails ? (
                    <div className="p-12 text-center text-gray-400">Loading coach details...</div>
                  ) : (
                    <div className="p-6 md:p-8">
                      {/* Coach Header */}
                      <div className="flex flex-col md:flex-row gap-6 mb-8">
                        <div className="flex-shrink-0">
                          <img
                            src={coach.avatarUrl}
                            alt={coachDetails?.displayName || coach.displayName}
                            className="w-32 h-32 rounded-full border-4 border-blue-500/30 object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-3xl font-bold">{coachDetails?.displayName || coach.displayName}</h2>
                            {coachDetails?.isVerified && (
                              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <p className="text-lg text-gray-400 mb-4">{coachDetails?.headline || coach.headline}</p>
                          <p className="text-gray-300 mb-4">{coachDetails?.bio || coach.bio}</p>
                          
                          {coachDetails?.sports && coachDetails.sports.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {coachDetails.sports.map((sport: string) => (
                                <span key={sport} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                                  {sport}
                                </span>
                              ))}
                            </div>
                          )}

                          {coachDetails?.credentials && coachDetails.credentials.length > 0 && (
                            <div>
                              <p className="text-sm text-gray-500 mb-2">CREDENTIALS</p>
                              <ul className="text-sm text-gray-300 space-y-1">
                                {coachDetails.credentials.map((cred: string, idx: number) => (
                                  <li key={idx}>• {cred}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Courses Carousel */}
                      {coachCourses.length > 0 && (
                        <div className="mb-8">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-bold">Courses</h3>
                            <div className="flex gap-2">
                              <button
                                onClick={() => scrollCarousel(coursesModalScrollRef, "left")}
                                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => scrollCarousel(coursesModalScrollRef, "right")}
                                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div
                            ref={coursesModalScrollRef}
                            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
                            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                            onWheel={(e) => {
                              e.preventDefault();
                              if (coursesModalScrollRef.current) {
                                coursesModalScrollRef.current.scrollLeft += e.deltaY;
                              }
                            }}
                          >
                            {coachCourses.map((course) => (
                              <Link key={course.id} href={`/course/${course.id}`} onClick={() => setShowModal(false)}>
                                <GradientCard className="w-64 flex-shrink-0 hover:scale-105 transition-transform cursor-pointer overflow-hidden">
                                  {course.thumbnailUrl && (
                                    <div className="w-full h-40 relative">
                                      <img
                                        src={course.thumbnailUrl}
                                        alt={course.title}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  )}
                                  <div className="p-4">
                                    <h4 className="text-lg font-bold mb-2 line-clamp-2">{course.title}</h4>
                                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{course.description}</p>
                                    <div className="flex items-center justify-between">
                                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                                        {course.sport}
                                      </span>
                                      <span className="text-lg font-bold text-white">
                                        ${(course.priceCents / 100).toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </GradientCard>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Offerings */}
                      {coachOfferings.length > 0 && (
                        <div>
                          <h3 className="text-2xl font-bold mb-4">Session Offerings</h3>
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {coachOfferings.map((offering: any) => (
                              <GradientCard key={offering.id} className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-bold text-lg">{offering.name}</h4>
                                  {offering.isFree ? (
                                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Free</span>
                                  ) : (
                                    <span className="text-lg font-bold">
                                      ${(offering.priceCents / 100).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-400 mb-2">{offering.description}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>{offering.durationMinutes} minutes</span>
                                </div>
                              </GradientCard>
                            ))}
                          </div>
                        </div>
                      )}

                      {coachCourses.length === 0 && coachOfferings.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <p>No courses or offerings available yet.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  };

  // Recommendation algorithm for coaches and courses
  const calculateCoachRecommendationScore = (coach: any): number => {
    if (!coach.isVerified) return 0; // Only recommend verified coaches
    
    let score = 0;
    const studentSports = studentData?.sports || [];
    const primarySport = studentData?.primarySport;
    const studentLevel = studentData?.level || "";
    const studentGoals = studentData?.goals || [];
    const studentFocusAreas = studentData?.focusAreas || [];
    const studentBudget = studentData?.preferences?.budgetRangeCents;

    // Sport matching (highest weight)
    const coachSports = coach.sports || [];
    const matchingSports = coachSports.filter((sport: string) => studentSports.includes(sport));
    
    if (matchingSports.length > 0) {
      score += 50; // Base score for matching sports
      
      // Bonus for primary sport match
      if (primarySport && coachSports.includes(primarySport)) {
        score += 30;
      }
      
      // Bonus for multiple matching sports
      if (matchingSports.length > 1) {
        score += 10 * (matchingSports.length - 1);
      }
    }

    // Skill level matching
    const levelMapping: { [key: string]: string[] } = {
      "beginner": ["Youth", "High School"],
      "intermediate": ["High School", "College"],
      "advanced": ["College", "Professional"],
      "competitive": ["Professional"]
    };
    
    const appropriateExperienceTypes = levelMapping[studentLevel.toLowerCase()] || [];
    if (coach.experienceType && appropriateExperienceTypes.includes(coach.experienceType)) {
      score += 20;
    }

    // Focus areas and goals matching with specialties
    if (coach.specialtiesBySport) {
      let specialtyMatches = 0;
      Object.keys(coach.specialtiesBySport).forEach((sport) => {
        if (studentSports.includes(sport)) {
          const specialties = coach.specialtiesBySport[sport] || [];
          const matchingSpecialties = specialties.filter((spec: string) => 
            studentFocusAreas.some((area: string) => 
              area.toLowerCase().includes(spec.toLowerCase()) || 
              spec.toLowerCase().includes(area.toLowerCase())
            ) ||
            studentGoals.some((goal: string) => 
              goal.toLowerCase().includes(spec.toLowerCase()) || 
              spec.toLowerCase().includes(goal.toLowerCase())
            )
          );
          specialtyMatches += matchingSpecialties.length;
        }
      });
      score += specialtyMatches * 5;
    }

    // Budget matching (if coach has free intro or affordable sessions)
    if (studentBudget && coach.sessionOffers) {
      const minPrice = coach.sessionOffers.paid?.[0]?.priceCents || Infinity;
      if (coach.sessionOffers.freeIntroEnabled) {
        score += 10; // Bonus for free intro
      }
      if (minPrice <= studentBudget.max && minPrice >= studentBudget.min) {
        score += 15; // Bonus for matching budget
      }
    }

    // Credentials bonus (more credentials = more experienced)
    if (coach.credentials && coach.credentials.length > 0) {
      score += Math.min(coach.credentials.length * 2, 10);
    }

    return score;
  };

  const calculateCourseRecommendationScore = (course: any, verifiedCoachIdsSet: Set<string>): number => {
    if (!verifiedCoachIdsSet.has(course.coachId)) return 0; // Only recommend courses from verified coaches
    
    let score = 0;
    const studentSports = studentData?.sports || [];
    const primarySport = studentData?.primarySport;
    const studentLevel = studentData?.level || "";

    // Sport matching (highest weight)
    if (course.sport && studentSports.includes(course.sport)) {
      score += 50;
      
      // Bonus for primary sport match
      if (primarySport && course.sport === primarySport) {
        score += 30;
      }
    }

    // Skill level matching
    if (course.skillLevel && studentLevel) {
      const levelMatch = course.skillLevel.toLowerCase() === studentLevel.toLowerCase();
      if (levelMatch) {
        score += 30;
      } else {
        // Partial match for adjacent levels
        const levels = ["beginner", "intermediate", "advanced", "competitive"];
        const courseLevelIndex = levels.indexOf(course.skillLevel.toLowerCase());
        const studentLevelIndex = levels.indexOf(studentLevel.toLowerCase());
        if (Math.abs(courseLevelIndex - studentLevelIndex) === 1) {
          score += 15; // Adjacent level bonus
        }
      }
    }

    // Price matching (if within budget)
    const studentBudget = studentData?.preferences?.budgetRangeCents;
    if (studentBudget && course.priceCents) {
      if (course.priceCents <= studentBudget.max && course.priceCents >= studentBudget.min) {
        score += 20;
      } else if (course.priceCents <= studentBudget.max) {
        score += 10; // Below max budget
      }
    }

    return score;
  };

  const renderDashboard = () => {
    // Get student's sports from onboarding data
    const studentSports = studentData?.sports || [];
    
    // Sort sports list: student's sports first, then others
    const sortedSports = [...SPORTS].sort((a, b) => {
      const aInStudent = studentSports.includes(a);
      const bInStudent = studentSports.includes(b);
      if (aInStudent && !bInStudent) return -1;
      if (!aInStudent && bInStudent) return 1;
      return 0;
    });

    // Mock data for demonstration
    const mockCoaches = [
      {
        id: "coach1",
        displayName: "Sarah Johnson",
        headline: "Professional Tennis Coach",
        bio: "Former professional tennis player with 15+ years of coaching experience. Specialized in youth development and competitive training.",
        sports: ["Tennis"],
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
        isRecommended: true,
        isVerified: true,
        specialtiesBySport: { Tennis: ["Serve technique", "Footwork", "Mental game"] },
        experienceType: "Professional",
        credentials: ["USPTA Certified", "Former ATP Player"],
      },
      {
        id: "coach2",
        displayName: "Michael Chen",
        headline: "Elite Basketball Trainer",
        bio: "NBA training camp coach with expertise in shooting mechanics and game strategy. Trained 50+ Division I athletes.",
        sports: ["Basketball"],
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
        isRecommended: true,
        isVerified: true,
        specialtiesBySport: { Basketball: ["Shooting", "Ball handling", "Defense"] },
        experienceType: "Professional",
        credentials: ["NBA Certified Trainer", "NCAA Coach"],
      },
      {
        id: "coach3",
        displayName: "Emma Rodriguez",
        headline: "Soccer Development Specialist",
        bio: "Youth soccer coach with a passion for developing technical skills and tactical awareness in young athletes.",
        sports: ["Soccer"],
        avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
        isRecommended: false,
        isVerified: true,
        specialtiesBySport: { Soccer: ["Dribbling", "Passing", "Positioning"] },
        experienceType: "College",
        credentials: ["USSF Licensed", "Youth Development Certified"],
      },
      {
        id: "coach4",
        displayName: "David Park",
        headline: "Swimming Performance Coach",
        bio: "Olympic-level swimming coach specializing in stroke technique and endurance training for competitive swimmers.",
        sports: ["Swimming"],
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
        isRecommended: true,
        isVerified: true,
        specialtiesBySport: { Swimming: ["Freestyle", "Butterfly", "Endurance"] },
        experienceType: "Professional",
        credentials: ["USA Swimming Certified", "Olympic Coach"],
      },
      {
        id: "coach5",
        displayName: "Lisa Thompson",
        headline: "Track & Field Expert",
        bio: "Former Olympic athlete turned coach, specializing in sprinting and jumping events for high school and college athletes.",
        sports: ["Track and Field"],
        avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
        isRecommended: false,
        isVerified: true,
        specialtiesBySport: { "Track and Field": ["Sprinting", "Long jump", "Training"] },
        experienceType: "Professional",
        credentials: ["USATF Certified", "Olympic Medalist"],
      },
      {
        id: "coach6",
        displayName: "James Wilson",
        headline: "Baseball Pitching Coach",
        bio: "Professional baseball pitching coach with expertise in mechanics, velocity development, and injury prevention.",
        sports: ["Baseball"],
        avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
        isRecommended: true,
        isVerified: true,
        specialtiesBySport: { Baseball: ["Pitching mechanics", "Velocity", "Control"] },
        experienceType: "Professional",
        credentials: ["MLB Scout", "Pitching Specialist"],
      },
    ];

    const mockCourses = [
      {
        id: "course1",
        title: "Master the Tennis Serve",
        description: "Learn professional serving techniques from a former ATP player",
        sport: "Tennis",
        skillLevel: "intermediate",
        priceCents: 9900,
        thumbnailUrl: "https://images.unsplash.com/photo-1622163642998-8ea7fc5f3b72?w=600&h=400&fit=crop",
        estimatedMinutes: 180,
        coachId: "coach1",
        coachName: "Sarah Johnson",
        coachAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      },
      {
        id: "course2",
        title: "Basketball Shooting Mastery",
        description: "Perfect your shooting form and increase your accuracy",
        sport: "Basketball",
        skillLevel: "beginner",
        priceCents: 7900,
        thumbnailUrl: "https://images.unsplash.com/photo-1519869325932-c23c5c14e43e?w=600&h=400&fit=crop",
        estimatedMinutes: 240,
        coachId: "coach2",
        coachName: "Michael Chen",
        coachAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      },
      {
        id: "course3",
        title: "Soccer Fundamentals",
        description: "Master the basics of soccer with professional techniques",
        sport: "Soccer",
        skillLevel: "beginner",
        priceCents: 6900,
        thumbnailUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop",
        estimatedMinutes: 200,
        coachId: "coach3",
        coachName: "Emma Rodriguez",
        coachAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      },
      {
        id: "course4",
        title: "Swimming Technique Perfection",
        description: "Improve your stroke technique and swimming efficiency",
        sport: "Swimming",
        skillLevel: "advanced",
        priceCents: 11900,
        thumbnailUrl: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&h=400&fit=crop",
        estimatedMinutes: 300,
        coachId: "coach4",
        coachName: "David Park",
        coachAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      },
      {
        id: "course5",
        title: "Track Sprint Training",
        description: "Elite sprinting techniques and training methods",
        sport: "Track and Field",
        skillLevel: "competitive",
        priceCents: 12900,
        thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop",
        estimatedMinutes: 360,
        coachId: "coach5",
        coachName: "Lisa Thompson",
        coachAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
      },
    ];

    // Filter out unverified coaches first
    const verifiedCoaches = mockCoaches.filter((coach) => coach.isVerified === true);
    const verifiedCoachIds = new Set(verifiedCoaches.map((c) => c.id));
    
    // Filter coaches and courses by selected sport
    let filteredCoaches = [...verifiedCoaches];
    let filteredCourses = mockCourses.filter((course) => verifiedCoachIds.has(course.coachId));

    if (selectedSport !== "All") {
      filteredCoaches = filteredCoaches.filter((coach) => 
        coach.sports && coach.sports.includes(selectedSport)
      );
      filteredCourses = filteredCourses.filter((course) => 
        course.sport === selectedSport
      );
    } else {
      // When "All" is selected, prioritize student's sports
      filteredCoaches.sort((a, b) => {
        const aHasStudentSport = a.sports?.some((s: string) => studentSports.includes(s));
        const bHasStudentSport = b.sports?.some((s: string) => studentSports.includes(s));
        if (aHasStudentSport && !bHasStudentSport) return -1;
        if (!aHasStudentSport && bHasStudentSport) return 1;
        return 0;
      });
      
      filteredCourses.sort((a, b) => {
        const aInStudent = studentSports.includes(a.sport);
        const bInStudent = studentSports.includes(b.sport);
        if (aInStudent && !bInStudent) return -1;
        if (!aInStudent && bInStudent) return 1;
        return 0;
      });
    }

    // verifiedCoaches and verifiedCoachIds are already defined above - reuse them
    const verifiedCoachIdsSet = verifiedCoachIds;

    // Calculate recommendation scores and mark recommended items
    const coachesWithScores = filteredCoaches.map((coach) => ({
      ...coach,
      recommendationScore: calculateCoachRecommendationScore(coach),
    }));

    const coursesWithScores = filteredCourses.map((course) => ({
      ...course,
      recommendationScore: calculateCourseRecommendationScore(course, verifiedCoachIdsSet),
    }));

    // Mark as recommended if score is above threshold (50+ for coaches, 60+ for courses)
    const recommendedCoachIds = new Set(
      coachesWithScores
        .filter((coach) => coach.recommendationScore >= 50)
        .map((coach) => coach.id)
    );

    const recommendedCourseIds = new Set(
      coursesWithScores
        .filter((course) => course.recommendationScore >= 60)
        .map((course) => course.id)
    );

    // Add isRecommended flag based on algorithm (remove hardcoded values and recommendationScore)
    filteredCoaches = coachesWithScores.map((coach) => {
      const { recommendationScore, ...rest } = coach;
      return {
        ...rest,
        isRecommended: recommendedCoachIds.has(coach.id),
      };
    });

    filteredCourses = coursesWithScores.map((course) => {
      const { recommendationScore, ...rest } = course;
      return {
        ...rest,
        isRecommended: recommendedCourseIds.has(course.id),
      };
    });

  return (
      <div className="min-h-[calc(100vh-64px)] bg-[var(--background)] w-full overflow-x-hidden max-w-full">
        {/* Sports Carousel */}
        <div className="relative bg-[var(--card)] border-b border-gray-800 w-full overflow-hidden">
          <div className="flex items-center justify-between px-3 md:px-4 lg:px-6 py-4 md:py-6 w-full">
            <div 
              ref={sportsScrollRef}
              className="flex items-center gap-3 md:gap-4 lg:gap-6 overflow-x-auto scrollbar-hide flex-1 min-w-0"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              onWheel={(e) => {
                e.preventDefault();
                if (sportsScrollRef.current) {
                  sportsScrollRef.current.scrollLeft += e.deltaY;
                }
              }}
            >
              {["All", ...sortedSports].map((sport) => (
                <button
                  key={sport}
                  onClick={() => setSelectedSport(sport)}
                  className={`flex flex-col items-center gap-1.5 md:gap-2 min-w-[55px] md:min-w-[65px] flex-shrink-0 transition-all ${
                    selectedSport === sport
                      ? "text-white scale-110"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <div className={`text-2xl md:text-3xl ${selectedSport === sport ? "scale-110" : ""}`}>
                    {sport === "All" ? (
                      <span className={selectedSport === sport ? "text-yellow-400" : "text-gray-500"}>⭐</span>
                    ) : (
                      <span className={selectedSport === sport ? "scale-110" : ""}>{SPORT_EMOJIS[sport] || "🏃"}</span>
                    )}
                  </div>
                  <span className={`text-[9px] md:text-[10px] lg:text-xs font-medium whitespace-nowrap text-center leading-tight px-1 ${
                    selectedSport === sport ? "font-bold" : ""
                  }`}>{sport}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-1 ml-2 flex-shrink-0 z-10">
              <button
                onClick={() => scrollCarousel(sportsScrollRef, "left")}
                className="p-1.5 md:p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                aria-label="Scroll left"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => scrollCarousel(sportsScrollRef, "right")}
                className="p-1.5 md:p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
                aria-label="Scroll right"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center py-12 px-4 md:px-6 max-w-6xl mx-auto w-full">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
            EXPLORE THE BEST OF COACHIFY
          </h1>
          <p className="text-base md:text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
            Learn from world-class coaches and take your game to the next level
          </p>
          <GlowButton variant="primary" size="lg" onClick={() => router.push("/coaches")}>
            Find Your Coach
          </GlowButton>
        </div>

        {/* Recommended Coaches Carousel */}
        <div className="px-4 md:px-6 py-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">Recommended Coaches</h2>
            <div className="flex gap-2">
              <button
                onClick={() => scrollCarousel(coachesScrollRef, "left")}
                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => scrollCarousel(coachesScrollRef, "right")}
                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div
            ref={coachesScrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            onWheel={(e) => {
              e.preventDefault();
              if (coachesScrollRef.current) {
                coachesScrollRef.current.scrollLeft += e.deltaY;
              }
            }}
          >
            {filteredCoaches.length > 0 ? (
              filteredCoaches.map((coach) => (
                <CoachCardComponent key={coach.id} coach={coach} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 w-full">
                No coaches found for {selectedSport === "All" ? "your selected sports" : selectedSport}
              </div>
            )}
          </div>
        </div>

        {/* Courses Carousel */}
        <div className="px-4 md:px-6 py-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">Featured Courses</h2>
            <div className="flex gap-2">
              <button
                onClick={() => scrollCarousel(coursesScrollRef, "left")}
                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => scrollCarousel(coursesScrollRef, "right")}
                className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div
            ref={coursesScrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            onWheel={(e) => {
              e.preventDefault();
              if (coursesScrollRef.current) {
                coursesScrollRef.current.scrollLeft += e.deltaY;
              }
            }}
          >
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <CourseCardComponent key={course.id} course={course} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 w-full">
                No courses found for {selectedSport === "All" ? "your selected sports" : selectedSport}
              </div>
            )}
          </div>
        </div>

      </div>
    );
  };

  // Course Card Component
  const CourseCardComponent = ({ course }: { course: any }) => {
    return (
      <Link href={`/course/${course.id}`}>
        <GradientCard className="w-72 md:w-80 h-[420px] flex-shrink-0 hover:scale-105 transition-transform cursor-pointer overflow-hidden flex flex-col">
          <div className="relative flex-shrink-0">
            <div className="w-full h-48 relative">
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <img
                  src={course.coachAvatar}
                  alt={course.coachName}
                  className="w-10 h-10 rounded-full border-2 border-white"
                />
                <span className="text-white text-sm font-medium">{course.coachName}</span>
              </div>
            </div>
          </div>
          <div className="p-4 flex flex-col flex-1">
            <div className="flex items-center gap-2 mb-2 flex-shrink-0">
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                {course.sport}
              </span>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs capitalize">
                {course.skillLevel}
              </span>
            </div>
            <h3 className="text-lg font-bold mb-2 line-clamp-2 flex-shrink-0">{course.title}</h3>
            <p className="text-sm text-gray-400 mb-3 line-clamp-2 flex-1">{course.description}</p>
            <div className="flex items-center justify-between mt-auto flex-shrink-0">
              <div className="text-sm text-gray-400">
                {course.estimatedMinutes ? `${Math.floor(course.estimatedMinutes / 60)}h ${course.estimatedMinutes % 60}m` : "N/A"}
              </div>
              <div className="text-lg font-bold text-white">
                ${(course.priceCents / 100).toFixed(2)}
              </div>
            </div>
          </div>
        </GradientCard>
            </Link>
    );
  };

  const getFilteredBookings = () => {
    const now = new Date();
    switch (bookingsFilterStatus) {
      case "upcoming":
        return bookingsWithCoaches.filter(
          (b) => b.status === "confirmed" && b.scheduledStart.toDate() > now
        );
      case "past":
        return bookingsWithCoaches.filter(
          (b) => b.status === "completed" || b.scheduledStart.toDate() < now || b.status === "cancelled"
        );
      case "today":
        return bookingsWithCoaches.filter((b) => isSameDay(b.scheduledStart.toDate(), now));
      default:
        return bookingsWithCoaches;
    }
  };

  const renderBookings = () => {
    const filteredBookings = getFilteredBookings();

    // Calendar view helpers
    const monthStart = startOfMonth(calendarDate);
    const monthEnd = endOfMonth(calendarDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const getBookingsForDate = (date: Date) => {
      return filteredBookings.filter((booking) =>
        isSameDay(booking.scheduledStart.toDate(), date)
      );
    };

    const renderListView = () => {
      if (loading) {
        return (
          <div className="text-center py-12 text-gray-400">Loading bookings...</div>
        );
      }

      if (filteredBookings.length === 0) {
        return (
          <GradientCard className="p-12 text-center">
            <div className="flex justify-center mb-4">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-2">No bookings found</h3>
            <p className="text-gray-400">
              {bookingsFilterStatus === "all"
                ? "You don't have any bookings yet."
                : `No ${bookingsFilterStatus} bookings found.`}
            </p>
            {bookingsFilterStatus === "all" && (
              <GlowButton variant="primary" onClick={() => handleTabChange("coaches")} className="mt-6">
                Find Coaches
              </GlowButton>
            )}
          </GradientCard>
        );
      }

      return (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const bookingDate = booking.scheduledStart.toDate();
            const isUpcoming = bookingDate > new Date() && booking.status === "confirmed";
            const isPast = bookingDate < new Date() || booking.status === "completed" || booking.status === "cancelled";
            
            const coachName = booking.coachName || "Coach";
            const coachPhotoURL = booking.coachPhotoURL;
            const coachHeadline = booking.coachHeadline;

            return (
              <GradientCard key={booking.id} className="p-6">
                <div className="flex items-start gap-6">
                  {/* Coach Avatar */}
                  <div className="flex-shrink-0">
                    {coachPhotoURL ? (
                      <img
                        src={coachPhotoURL}
                        alt={coachName}
                        className="w-16 h-16 rounded-full border-2 border-blue-500/30 object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl border-2 border-blue-500/30">
                        {coachName[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Booking Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-2xl font-bold mb-1">{coachName}</h3>
                        {coachHeadline && (
                          <p className="text-gray-400 text-sm">{coachHeadline}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isUpcoming && (
                          <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full border border-green-500/30">
                            Upcoming
                          </span>
                        )}
                        {isPast && booking.status === "completed" && (
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full border border-blue-500/30">
                            Completed
                          </span>
                        )}
                        {booking.status === "cancelled" && (
                          <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full border border-red-500/30">
                            Cancelled
                          </span>
                        )}
                        {booking.status === "requested" && (
                          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded-full border border-yellow-500/30">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-400">Date & Time</p>
                          <p className="text-white font-medium">
                            {format(bookingDate, "EEEE, MMMM d, yyyy")}
                          </p>
                          <p className="text-gray-400 text-sm">
                            {format(bookingDate, "h:mm a")} - {format(booking.scheduledEnd.toDate(), "h:mm a")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-400">Duration</p>
                          <p className="text-white font-medium">{booking.sessionMinutes} minutes</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-400">Session Type</p>
                          <p className="text-white font-medium">
                            {booking.type === "free_intro" ? "Free Intro Consultation" : "Paid Session"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-400">Price</p>
                          <p className="text-white font-medium">
                            {booking.type === "free_intro" ? (
                              <span className="text-green-400">FREE</span>
                            ) : (
                              `$${(booking.priceCents / 100).toFixed(2)}`
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {booking.meetingLink && (
                      <div className="mb-4">
                        <a
                          href={booking.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Join Meeting</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
          </GradientCard>
            );
          })}
        </div>
      );
    };

    const renderCalendarView = () => {
      const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      return (
        <div className="space-y-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCalendarDate(subMonths(calendarDate, 1))}
                className="p-2 rounded-lg border-2 border-gray-600 hover:border-gray-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold">{format(calendarDate, "MMMM yyyy")}</h2>
              <button
                onClick={() => setCalendarDate(addMonths(calendarDate, 1))}
                className="p-2 rounded-lg border-2 border-gray-600 hover:border-gray-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => setCalendarDate(new Date())}
                className="px-4 py-2 rounded-lg border-2 border-gray-600 hover:border-gray-500 transition-colors text-sm"
              >
                Today
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <GradientCard className="p-6">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                const dayBookings = getBookingsForDate(day);
                const isCurrentMonth = isSameMonth(day, calendarDate);
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={idx}
                    className={`min-h-[100px] p-2 rounded-lg border-2 transition-colors ${
                      isCurrentMonth
                        ? isCurrentDay
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-gray-700 bg-gray-800/30"
                        : "border-gray-800 bg-gray-900/20 opacity-50"
                    }`}
                  >
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isCurrentDay ? "text-blue-400" : isCurrentMonth ? "text-white" : "text-gray-600"
                      }`}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayBookings.slice(0, 3).map((booking) => {
                        const isUpcoming = booking.scheduledStart.toDate() > new Date() && booking.status === "confirmed";
                        return (
                          <div
                            key={booking.id}
                            className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity ${
                              isUpcoming
                                ? "bg-blue-500/30 text-blue-300 border border-blue-500/50"
                                : booking.status === "completed"
                                ? "bg-green-500/30 text-green-300 border border-green-500/50"
                                : "bg-gray-700/50 text-gray-400 border border-gray-600/50"
                            }`}
                            title={`${format(booking.scheduledStart.toDate(), "h:mm a")}`}
                          >
                            {format(booking.scheduledStart.toDate(), "h:mm a")}
                          </div>
                        );
                      })}
                      {dayBookings.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayBookings.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </GradientCard>
        </div>
      );
    };

    return (
      <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                My Bookings
              </h1>
              <p className="text-gray-400">
                View and manage your session bookings
              </p>
            </div>
          </div>

          {/* View Toggle and Filters */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setBookingsViewMode("list")}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  bookingsViewMode === "list"
                    ? "border-blue-500 bg-blue-500/20 text-blue-400"
                    : "border-gray-600 text-gray-400 hover:border-gray-500"
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <span>List View</span>
                </div>
              </button>
              <button
                onClick={() => setBookingsViewMode("calendar")}
                className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                  bookingsViewMode === "calendar"
                    ? "border-blue-500 bg-blue-500/20 text-blue-400"
                    : "border-gray-600 text-gray-400 hover:border-gray-500"
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Calendar View</span>
                </div>
              </button>
            </div>

            {bookingsViewMode === "list" && (
              <div className="flex gap-2 flex-wrap">
                {(["all", "upcoming", "past", "today"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setBookingsFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors capitalize ${
                      bookingsFilterStatus === status
                        ? "border-blue-500 bg-blue-500/20 text-blue-400"
                        : "border-gray-600 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={bookingsViewMode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {bookingsViewMode === "list" ? renderListView() : renderCalendarView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const renderLibrary = () => {
    // Mock catalog data - full course catalog like MasterClass
    const catalogCourses = [
      {
        id: "course1",
        title: "Master the Tennis Serve",
        description: "Learn professional serving techniques from a former ATP player. Master power, placement, and consistency.",
        sport: "Tennis",
        skillLevel: "intermediate",
        priceCents: 9900,
        thumbnailUrl: "https://images.unsplash.com/photo-1622163642998-8ea7fc5f3b72?w=600&h=400&fit=crop",
        estimatedMinutes: 180,
        coachId: "coach1",
        coachName: "Sarah Johnson",
        coachAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
        createdAt: new Date("2024-01-15"),
      },
      {
        id: "course2",
        title: "Basketball Shooting Mastery",
        description: "Perfect your shooting form and increase your accuracy. Learn from NBA-level trainers.",
        sport: "Basketball",
        skillLevel: "beginner",
        priceCents: 7900,
        thumbnailUrl: "https://images.unsplash.com/photo-1519869325932-c23c5c14e43e?w=600&h=400&fit=crop",
        estimatedMinutes: 240,
        coachId: "coach2",
        coachName: "Michael Chen",
        coachAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        createdAt: new Date("2024-01-20"),
      },
      {
        id: "course3",
        title: "Soccer Fundamentals",
        description: "Master the basics of soccer with professional techniques. Perfect for beginners starting their journey.",
        sport: "Soccer",
        skillLevel: "beginner",
        priceCents: 6900,
        thumbnailUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop",
        estimatedMinutes: 200,
        coachId: "coach3",
        coachName: "Emma Rodriguez",
        coachAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
        createdAt: new Date("2024-01-10"),
      },
      {
        id: "course4",
        title: "Swimming Technique Perfection",
        description: "Improve your stroke technique and swimming efficiency. Advanced training for competitive swimmers.",
        sport: "Swimming",
        skillLevel: "advanced",
        priceCents: 11900,
        thumbnailUrl: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&h=400&fit=crop",
        estimatedMinutes: 300,
        coachId: "coach4",
        coachName: "David Park",
        coachAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
        createdAt: new Date("2024-01-25"),
      },
      {
        id: "course5",
        title: "Track Sprint Training",
        description: "Elite sprinting techniques and training methods. Designed for competitive athletes.",
        sport: "Track and Field",
        skillLevel: "competitive",
        priceCents: 12900,
        thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop",
        estimatedMinutes: 360,
        coachId: "coach5",
        coachName: "Lisa Thompson",
        coachAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
        createdAt: new Date("2024-01-18"),
      },
      {
        id: "course6",
        title: "Baseball Pitching Mechanics",
        description: "Master the art of pitching with professional mechanics. Increase velocity and control.",
        sport: "Baseball",
        skillLevel: "intermediate",
        priceCents: 10900,
        thumbnailUrl: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=600&h=400&fit=crop",
        estimatedMinutes: 220,
        coachId: "coach6",
        coachName: "James Wilson",
        coachAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
        createdAt: new Date("2024-01-22"),
      },
      {
        id: "course7",
        title: "Volleyball Serving Power",
        description: "Develop powerful and accurate serves. Learn jump serve and float serve techniques.",
        sport: "Volleyball",
        skillLevel: "intermediate",
        priceCents: 8900,
        thumbnailUrl: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=600&h=400&fit=crop",
        estimatedMinutes: 150,
        coachId: "coach7",
        coachName: "Alex Martinez",
        coachAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
        createdAt: new Date("2024-01-12"),
      },
      {
        id: "course8",
        title: "Golf Swing Fundamentals",
        description: "Perfect your golf swing from the ground up. Learn proper form and consistency.",
        sport: "Golf",
        skillLevel: "beginner",
        priceCents: 11900,
        thumbnailUrl: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=600&h=400&fit=crop",
        estimatedMinutes: 280,
        coachId: "coach8",
        coachName: "Robert Lee",
        coachAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        createdAt: new Date("2024-01-28"),
      },
      {
        id: "course9",
        title: "Cricket Batting Masterclass",
        description: "Advanced batting techniques for power hitting and timing. Learn from professional players.",
        sport: "Cricket",
        skillLevel: "advanced",
        priceCents: 13900,
        thumbnailUrl: "https://images.unsplash.com/photo-1534158914592-062992392be8?w=600&h=400&fit=crop",
        estimatedMinutes: 320,
        coachId: "coach9",
        coachName: "Priya Sharma",
        coachAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
        createdAt: new Date("2024-01-14"),
      },
      {
        id: "course10",
        title: "American Football Quarterback Training",
        description: "Develop elite quarterback skills. Learn throwing mechanics, footwork, and game reading.",
        sport: "American Football",
        skillLevel: "advanced",
        priceCents: 14900,
        thumbnailUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop",
        estimatedMinutes: 400,
        coachId: "coach10",
        coachName: "Marcus Johnson",
        coachAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        createdAt: new Date("2024-01-16"),
      },
      {
        id: "course11",
        title: "Martial Arts Striking Fundamentals",
        description: "Master the fundamentals of striking. Learn proper form, power, and combinations.",
        sport: "Martial Arts",
        skillLevel: "beginner",
        priceCents: 9900,
        thumbnailUrl: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=600&h=400&fit=crop",
        estimatedMinutes: 180,
        coachId: "coach11",
        coachName: "Kenji Tanaka",
        coachAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
        createdAt: new Date("2024-01-19"),
      },
      {
        id: "course12",
        title: "Esports Aim Training",
        description: "Improve your aim and reaction time. Professional techniques used by competitive players.",
        sport: "Esports",
        skillLevel: "intermediate",
        priceCents: 7900,
        thumbnailUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop",
        estimatedMinutes: 120,
        coachId: "coach12",
        coachName: "Ryan Kim",
        coachAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
        createdAt: new Date("2024-01-21"),
      },
    ];

    // Get verified coach IDs from catalogCoaches (in renderCoaches function)
    // For now, we'll filter based on known verified coaches
    // In production, this would come from actual Firebase data
    const verifiedCoachIds = new Set(["coach1", "coach2", "coach3", "coach4", "coach5", "coach6", "coach8", "coach9", "coach10", "coach11"]);
    
    // Filter out courses from unverified coaches
    const verifiedCourses = catalogCourses.filter((course) => verifiedCoachIds.has(course.coachId));
    
    // Combine enrolled courses with catalog courses (mark enrolled ones)
    const allCourses = verifiedCourses.map((course) => {
      const isEnrolled = courses.some((c) => c.id === course.id);
      return { ...course, isEnrolled };
    });

    // Filter and sort courses
    let filteredCourses = [...allCourses];

    // Apply filters
    if (libraryFilterSport) {
      filteredCourses = filteredCourses.filter((c) => c.sport === libraryFilterSport);
    }
    if (libraryFilterLevel) {
      filteredCourses = filteredCourses.filter((c) => c.skillLevel === libraryFilterLevel);
    }

    // Get verified coach IDs for course filtering
    const verifiedCoachIdsForLibrary = new Set(["coach1", "coach2", "coach3", "coach4", "coach5", "coach6", "coach8", "coach9", "coach10", "coach11"]);
    
    // Calculate recommendation scores
    const coursesWithScores = filteredCourses.map((course) => ({
      ...course,
      recommendationScore: calculateCourseRecommendationScore(course, verifiedCoachIdsForLibrary),
    }));

    // Mark as recommended if score is above threshold (60+)
    const recommendedCourseIds = new Set(
      coursesWithScores
        .filter((course) => course.recommendationScore >= 60)
        .map((course) => course.id)
    );

    // Add isRecommended flag based on algorithm
    filteredCourses = coursesWithScores.map((course) => ({
      ...course,
      isRecommended: recommendedCourseIds.has(course.id),
    }));

    // Apply sorting
    filteredCourses.sort((a, b) => {
      switch (librarySortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "price-low":
          return a.priceCents - b.priceCents;
        case "price-high":
          return b.priceCents - a.priceCents;
        case "duration":
          return a.estimatedMinutes - b.estimatedMinutes;
        case "recent":
        default:
          return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
      }
    });

    return (
      <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
              Course Library
            </h1>
            <p className="text-gray-400 text-lg">Explore our full catalog of expert-led courses</p>
          </div>

          {/* Filters and Sort Bar */}
          <div className="mb-8 flex flex-wrap items-center gap-4 bg-[var(--card)] p-4 rounded-lg border border-gray-800">
            {/* Sport Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-300">Sport:</label>
              <select
                value={libraryFilterSport}
                onChange={(e) => setLibraryFilterSport(e.target.value)}
                className="px-4 py-2 bg-[var(--background)] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">All Sports</option>
                {SPORTS.map((sport) => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </div>

            {/* Skill Level Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-300">Level:</label>
              <select
                value={libraryFilterLevel}
                onChange={(e) => setLibraryFilterLevel(e.target.value)}
                className="px-4 py-2 bg-[var(--background)] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">All Levels</option>
                {SKILL_LEVELS.map((level) => (
                  <option key={level} value={level.toLowerCase()}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm font-medium text-gray-300">Sort by:</label>
              <select
                value={librarySortBy}
                onChange={(e) => setLibrarySortBy(e.target.value as any)}
                className="px-4 py-2 bg-[var(--background)] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="recent">Most Recent</option>
                <option value="title">Title A-Z</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="duration">Duration</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6 text-sm text-gray-400">
            Showing <span className="font-semibold text-white">{filteredCourses.length}</span> of <span className="font-semibold text-white">{allCourses.length}</span> courses
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading catalog...</div>
          ) : filteredCourses.length === 0 ? (
            <GradientCard className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">No courses match your filters</h3>
              <p className="text-gray-400 mb-6">Try adjusting your filters to see more courses</p>
          </GradientCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <Link key={course.id} href={`/course/${course.id}`}>
                  <GradientCard className="h-full hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col group">
                    {course.thumbnailUrl && (
                      <div className="w-full h-64 relative flex-shrink-0 overflow-hidden">
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
                          {course.isEnrolled && (
                            <span className="px-3 py-1.5 bg-green-500/90 text-white rounded-full text-xs font-semibold backdrop-blur-sm shadow-lg">
                              Enrolled
                            </span>
                          )}
                          <span className="px-3 py-1.5 bg-blue-500/90 text-white rounded-full text-xs font-semibold backdrop-blur-sm shadow-lg">
                            {course.sport}
                          </span>
                        </div>
                        {course.coachAvatar && (
                          <div className="absolute bottom-4 left-4 flex items-center gap-3">
                            <img
                              src={course.coachAvatar}
                              alt={course.coachName}
                              className="w-10 h-10 rounded-full border-2 border-white shadow-lg"
                            />
                            <span className="text-white text-sm font-semibold drop-shadow-lg">{course.coachName}</span>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-3 mb-3 flex-shrink-0">
                        <span className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-full text-xs font-semibold capitalize border border-purple-500/30">
                          {course.skillLevel}
                        </span>
                        <span className="text-sm text-gray-400 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {Math.floor(course.estimatedMinutes / 60)}h {course.estimatedMinutes % 60}m
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold mb-3 line-clamp-2 flex-shrink-0 min-h-[4rem] leading-tight">{course.title}</h3>
                      <p className="text-gray-400 text-base mb-5 line-clamp-3 flex-1 leading-relaxed">{course.description}</p>
                      <div className="flex items-center justify-between mt-auto flex-shrink-0 pt-5 border-t border-gray-800">
                        <div className="flex flex-col">
                          <span className="text-3xl font-bold text-white">
                            ${(course.priceCents / 100).toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">One-time payment</span>
                        </div>
                        {course.isEnrolled ? (
                          <GlowButton variant="primary" size="md">
                            Continue Learning →
                          </GlowButton>
                        ) : (
                          <GlowButton variant="outline" size="md">
                            View Course
                          </GlowButton>
                        )}
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
  };

  const renderCoaches = () => {
    // Mock coaches data - full catalog
    const catalogCoaches = [
      {
        id: "coach1",
        displayName: "Sarah Johnson",
        headline: "Professional Tennis Coach",
        bio: "Former professional tennis player with 15+ years of coaching experience. Specialized in youth development and competitive training.",
        sports: ["Tennis"],
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
        isRecommended: true,
        isVerified: true,
        specialtiesBySport: { Tennis: ["Serve technique", "Footwork", "Mental game"] },
        experienceType: "Professional",
        credentials: ["USPTA Certified", "Former ATP Player"],
        sessionOffers: {
          freeIntroEnabled: true,
          freeIntroMinutes: 15,
          paid: [{ minutes: 30, priceCents: 5000 }, { minutes: 60, priceCents: 9000 }],
        },
      },
      {
        id: "coach2",
        displayName: "Michael Chen",
        headline: "Elite Basketball Trainer",
        bio: "NBA training camp coach with expertise in shooting mechanics and game strategy. Trained 50+ Division I athletes.",
        sports: ["Basketball"],
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
        isRecommended: true,
        isVerified: true,
        specialtiesBySport: { Basketball: ["Shooting", "Ball handling", "Defense"] },
        experienceType: "Professional",
        credentials: ["NBA Certified Trainer", "NCAA Coach"],
        sessionOffers: {
          freeIntroEnabled: true,
          freeIntroMinutes: 15,
          paid: [{ minutes: 30, priceCents: 6000 }, { minutes: 60, priceCents: 11000 }],
        },
      },
      {
        id: "coach3",
        displayName: "Emma Rodriguez",
        headline: "Soccer Development Specialist",
        bio: "Youth soccer coach with a passion for developing technical skills and tactical awareness in young athletes.",
        sports: ["Soccer"],
        avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
        isRecommended: false,
        isVerified: true,
        specialtiesBySport: { Soccer: ["Dribbling", "Passing", "Positioning"] },
        experienceType: "College",
        credentials: ["USSF Licensed", "Youth Development Certified"],
        sessionOffers: {
          freeIntroEnabled: true,
          freeIntroMinutes: 15,
          paid: [{ minutes: 30, priceCents: 4000 }, { minutes: 60, priceCents: 7500 }],
        },
      },
      {
        id: "coach4",
        displayName: "David Park",
        headline: "Swimming Performance Coach",
        bio: "Olympic-level swimming coach specializing in stroke technique and endurance training for competitive swimmers.",
        sports: ["Swimming"],
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
        isRecommended: true,
        isVerified: true,
        specialtiesBySport: { Swimming: ["Freestyle", "Butterfly", "Endurance"] },
        experienceType: "Professional",
        credentials: ["USA Swimming Certified", "Olympic Coach"],
        sessionOffers: {
          freeIntroEnabled: false,
          freeIntroMinutes: 0,
          paid: [{ minutes: 30, priceCents: 7000 }, { minutes: 60, priceCents: 13000 }],
        },
      },
      {
        id: "coach5",
        displayName: "Lisa Thompson",
        headline: "Track & Field Expert",
        bio: "Former Olympic athlete turned coach, specializing in sprinting and jumping events for high school and college athletes.",
        sports: ["Track and Field"],
        avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
        isRecommended: false,
        isVerified: true,
        specialtiesBySport: { "Track and Field": ["Sprinting", "Long jump", "Training"] },
        experienceType: "Professional",
        credentials: ["USATF Certified", "Olympic Medalist"],
        sessionOffers: {
          freeIntroEnabled: true,
          freeIntroMinutes: 15,
          paid: [{ minutes: 30, priceCents: 5500 }, { minutes: 60, priceCents: 10000 }],
        },
      },
      {
        id: "coach6",
        displayName: "James Wilson",
        headline: "Baseball Pitching Coach",
        bio: "Professional baseball pitching coach with expertise in mechanics, velocity development, and injury prevention.",
        sports: ["Baseball"],
        avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
        isRecommended: true,
        isVerified: true,
        specialtiesBySport: { Baseball: ["Pitching mechanics", "Velocity", "Control"] },
        experienceType: "Professional",
        credentials: ["MLB Scout", "Pitching Specialist"],
        sessionOffers: {
          freeIntroEnabled: true,
          freeIntroMinutes: 15,
          paid: [{ minutes: 30, priceCents: 6500 }, { minutes: 60, priceCents: 12000 }],
        },
      },
      {
        id: "coach7",
        displayName: "Alex Martinez",
        headline: "Volleyball Strategy Coach",
        bio: "Former professional volleyball player with expertise in serving, blocking, and team strategy. Coached multiple championship teams.",
        sports: ["Volleyball"],
        avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
        isVerified: false,
        specialtiesBySport: { Volleyball: ["Serving", "Blocking", "Strategy"] },
        experienceType: "Professional",
        credentials: ["FIVB Certified", "Championship Coach"],
        sessionOffers: {
          freeIntroEnabled: false,
          freeIntroMinutes: 0,
          paid: [{ minutes: 30, priceCents: 4500 }, { minutes: 60, priceCents: 8000 }],
        },
      },
      {
        id: "coach8",
        displayName: "Robert Lee",
        headline: "Golf Swing Master",
        bio: "PGA certified instructor specializing in swing mechanics, short game, and course management. Helped hundreds of players improve their handicap.",
        sports: ["Golf"],
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
        isVerified: true,
        specialtiesBySport: { Golf: ["Swing mechanics", "Short game", "Course management"] },
        experienceType: "Professional",
        credentials: ["PGA Certified", "Master Instructor"],
        sessionOffers: {
          freeIntroEnabled: true,
          freeIntroMinutes: 15,
          paid: [{ minutes: 30, priceCents: 8000 }, { minutes: 60, priceCents: 15000 }],
        },
      },
      {
        id: "coach9",
        displayName: "Priya Sharma",
        headline: "Cricket Batting Specialist",
        bio: "Former international cricket player with expertise in batting techniques, power hitting, and match strategy.",
        sports: ["Cricket"],
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
        isRecommended: true,
        isVerified: true,
        specialtiesBySport: { Cricket: ["Batting", "Power hitting", "Strategy"] },
        experienceType: "Professional",
        credentials: ["ICC Certified", "Former International Player"],
        sessionOffers: {
          freeIntroEnabled: true,
          freeIntroMinutes: 15,
          paid: [{ minutes: 30, priceCents: 5500 }, { minutes: 60, priceCents: 10000 }],
        },
      },
      {
        id: "coach10",
        displayName: "Marcus Johnson",
        headline: "Quarterback Development Coach",
        bio: "Former NFL quarterback coach specializing in throwing mechanics, footwork, and game reading. Trained multiple college and professional QBs.",
        sports: ["American Football"],
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
        isVerified: true,
        specialtiesBySport: { "American Football": ["QB mechanics", "Footwork", "Game reading"] },
        experienceType: "Professional",
        credentials: ["NFL Coach", "QB Specialist"],
        sessionOffers: {
          freeIntroEnabled: false,
          freeIntroMinutes: 0,
          paid: [{ minutes: 30, priceCents: 9000 }, { minutes: 60, priceCents: 17000 }],
        },
      },
      {
        id: "coach11",
        displayName: "Kenji Tanaka",
        headline: "Martial Arts Master",
        bio: "5th degree black belt with 20+ years of teaching experience. Specializes in striking, grappling, and competition preparation.",
        sports: ["Martial Arts"],
        avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
        isVerified: true,
        specialtiesBySport: { "Martial Arts": ["Striking", "Grappling", "Competition prep"] },
        experienceType: "Professional",
        credentials: ["5th Dan Black Belt", "Master Instructor"],
        sessionOffers: {
          freeIntroEnabled: true,
          freeIntroMinutes: 15,
          paid: [{ minutes: 30, priceCents: 5000 }, { minutes: 60, priceCents: 9000 }],
        },
      },
      {
        id: "coach12",
        displayName: "Ryan Kim",
        headline: "Esports Performance Coach",
        bio: "Professional esports coach with expertise in aim training, game sense, and mental performance. Coached multiple competitive teams.",
        sports: ["Esports"],
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
        isVerified: false,
        specialtiesBySport: { Esports: ["Aim training", "Game sense", "Mental performance"] },
        experienceType: "Professional",
        credentials: ["Pro Team Coach", "Performance Specialist"],
        sessionOffers: {
          freeIntroEnabled: true,
          freeIntroMinutes: 15,
          paid: [{ minutes: 30, priceCents: 3500 }, { minutes: 60, priceCents: 6000 }],
        },
      },
    ];

    // Filter out unverified coaches first
    const verifiedCatalogCoaches = catalogCoaches.filter((coach) => coach.isVerified === true);
    
    // Mark coaches that student has booked with
    const allCoaches = verifiedCatalogCoaches.map((coach) => {
      const coachBookings = bookings.filter((b) => b.coachId === coach.id);
      return { ...coach, hasBooked: coachBookings.length > 0, bookingCount: coachBookings.length };
    });

    // Filter coaches
    let filteredCoaches = [...allCoaches];

    // Apply filters
    if (coachesFilterSport) {
      filteredCoaches = filteredCoaches.filter((c) => 
        c.sports && c.sports.includes(coachesFilterSport)
      );
    }

    if (coachesFilterExperience) {
      filteredCoaches = filteredCoaches.filter((c) => 
        c.experienceType === coachesFilterExperience
      );
    }

    if (coachesFilterPriceRange) {
      filteredCoaches = filteredCoaches.filter((c) => {
        // Get minimum price from session offers
        const minPrice = c.sessionOffers?.paid?.[0]?.priceCents 
          ? c.sessionOffers.paid[0].priceCents / 100 
          : 0;
        
        switch (coachesFilterPriceRange) {
          case "free":
            return c.sessionOffers?.freeIntroEnabled === true || minPrice === 0;
          case "under-50":
            return minPrice > 0 && minPrice < 50;
          case "50-100":
            return minPrice >= 50 && minPrice <= 100;
          case "100-150":
            return minPrice > 100 && minPrice <= 150;
          case "over-150":
            return minPrice > 150;
          default:
            return true;
        }
      });
    }

    // Calculate recommendation scores
    const coachesWithScores = filteredCoaches.map((coach) => ({
      ...coach,
      recommendationScore: calculateCoachRecommendationScore(coach),
    }));

    // Mark as recommended if score is above threshold (50+)
    const recommendedCoachIds = new Set(
      coachesWithScores
        .filter((coach) => coach.recommendationScore >= 50)
        .map((coach) => coach.id)
    );

    // Add isRecommended flag based on algorithm (remove hardcoded values and recommendationScore)
    filteredCoaches = coachesWithScores.map((coach) => {
      const { recommendationScore, ...rest } = coach;
      return {
        ...rest,
        isRecommended: recommendedCoachIds.has(coach.id),
      } as any;
    });

    return (
      <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
              Find Coaches
            </h1>
            <p className="text-gray-400 text-lg">Discover expert coaches ready to help you reach your goals</p>
          </div>

          {/* Filters Bar */}
          <div className="mb-8 flex flex-wrap items-center gap-4 bg-[var(--card)] p-4 rounded-lg border border-gray-800">
            {/* Sport Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-300">Sport:</label>
              <select
                value={coachesFilterSport}
                onChange={(e) => setCoachesFilterSport(e.target.value)}
                className="px-4 py-2 bg-[var(--background)] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">All Sports</option>
                {SPORTS.map((sport) => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience Type Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-300">Experience:</label>
              <select
                value={coachesFilterExperience}
                onChange={(e) => setCoachesFilterExperience(e.target.value)}
                className="px-4 py-2 bg-[var(--background)] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">All Levels</option>
                <option value="Professional">Professional</option>
                <option value="College">College</option>
                <option value="High School">High School</option>
                <option value="Youth">Youth</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-300">Price:</label>
              <select
                value={coachesFilterPriceRange}
                onChange={(e) => setCoachesFilterPriceRange(e.target.value)}
                className="px-4 py-2 bg-[var(--background)] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">All Prices</option>
                <option value="free">Free Intro Available</option>
                <option value="under-50">Under $50</option>
                <option value="50-100">$50 - $100</option>
                <option value="100-150">$100 - $150</option>
                <option value="over-150">Over $150</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6 text-sm text-gray-400">
            Showing <span className="font-semibold text-white">{filteredCoaches.length}</span> of <span className="font-semibold text-white">{allCoaches.length}</span> coaches
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading coaches...</div>
          ) : filteredCoaches.length === 0 ? (
            <GradientCard className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">No coaches match your filters</h3>
              <p className="text-gray-400 mb-6">Try adjusting your filters to see more coaches</p>
            </GradientCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredCoaches.map((coach) => (
                    <CoachCardComponent key={coach.id} coach={coach} />
                  ))}
                </div>
              )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12 text-gray-400">Loading...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleTabChangeFromLayout = (tab: string) => {
    setCurrentTab(tab);
    if (setActiveTab) {
      setActiveTab(tab);
    }
  };

  return (
    <DashboardLayout role="student" activeTab={currentTab} setActiveTab={handleTabChangeFromLayout}>
      {renderContent()}
    </DashboardLayout>
  );
}

// Export wrapper that provides tab state
export default function StudentDashboardWrapper() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return <StudentDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
}

