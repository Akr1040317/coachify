"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthChange, signOut } from "@/lib/firebase/auth";
import { getUserData, getCoachData } from "@/lib/firebase/firestore";
import { User } from "firebase/auth";
import { Footer } from "./Footer";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "coach" | "student";
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

const coachNavItems = [
  { 
    href: "/app/coach/dashboard", 
    label: "Dashboard", 
    icon: "dashboard", 
    key: "dashboard",
    svg: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  { 
    href: "/app/coach/bookings", 
    label: "Bookings", 
    icon: "bookings", 
    key: "bookings",
    svg: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  { 
    href: "/app/coach/students", 
    label: "Students", 
    icon: "students", 
    key: "students",
    svg: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
  { 
    href: "/app/coach/courses", 
    label: "Courses", 
    icon: "courses", 
    key: "courses",
    svg: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  { 
    href: "/app/coach/offerings", 
    label: "Offerings", 
    icon: "offerings", 
    key: "offerings",
    svg: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )
  },
  { 
    href: "/app/coach/dashboard/revenue", 
    label: "Revenue", 
    icon: "revenue", 
    key: "revenue",
    svg: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  { 
    href: "/app/coach/availability", 
    label: "Availability", 
    icon: "availability", 
    key: "availability",
    svg: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  { 
    href: "/app/coach/my-page", 
    label: "My Page", 
    icon: "my-page", 
    key: "my-page",
    svg: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    )
  },
];

const studentNavItems = [
  { 
    href: "/app/student/dashboard", 
    label: "Dashboard", 
    icon: "dashboard",
    key: "dashboard",
    svg: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  { 
    href: "/app/student/bookings", 
    label: "Bookings", 
    icon: "bookings",
    key: "bookings",
    svg: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  },
  { 
    href: "/app/student/library", 
    label: "Library", 
    icon: "library",
    key: "library",
    svg: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  { 
    href: "/app/student/coaches", 
    label: "Coaches", 
    icon: "coaches",
    key: "coaches",
    svg: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  },
];

export function DashboardLayout({ children, role, activeTab: externalActiveTab, setActiveTab: externalSetActiveTab }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [coachData, setCoachData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [internalActiveTab, setInternalActiveTab] = useState<string>("dashboard");
  
  // Use external tab state if provided, otherwise use internal
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  const setActiveTab = externalSetActiveTab || setInternalActiveTab;

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (!user) {
        setLoading(false);
        router.push("/auth");
        return;
      }

      try {
        const data = await getUserData(user.uid);
        if (!data) {
          // User document doesn't exist - redirect to get-started
          setLoading(false);
          router.push("/get-started");
          return;
        }
        
        if (data.role !== role || !data.onboardingCompleted) {
          setLoading(false);
          router.push(`/onboarding/${role}/1`);
          return;
        }
        
        setUser(user);
        setUserData(data);
        // Store user ID for child components
        if (typeof window !== "undefined") {
          localStorage.setItem("userId", user.uid);
        }
        // Load coach data if role is coach (don't block on this)
        if (role === "coach") {
          getCoachData(user.uid)
            .then(coach => setCoachData(coach))
            .catch(error => console.error("Error loading coach data:", error));
        }
        setLoading(false);
      } catch (error: any) {
        console.error("Error fetching user data:", error);
        setLoading(false);
        // Only redirect if it's a permissions error, otherwise let user see the page
        if (error.code === "permission-denied" || error.message?.includes("permission")) {
          router.push("/auth");
        }
      }
    });

    return () => unsubscribe();
  }, [role, router]);

  // Sync external activeTab to internal state
  useEffect(() => {
    if (externalActiveTab !== undefined) {
      setInternalActiveTab(externalActiveTab);
    }
  }, [externalActiveTab]);

  const handleLogout = async () => {
    try {
      setUserMenuOpen(false);
      await signOut();
      // Clear any local storage
      if (typeof window !== "undefined") {
        localStorage.removeItem("userId");
      }
      // Redirect to home page
      router.push("/");
      // Force a hard reload to ensure all state is cleared
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out. Please try again.");
    }
  };

  const navItems = role === "coach" ? coachNavItems : studentNavItems;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--background)]/95 backdrop-blur-md border-b border-gray-800 shadow-lg">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Website Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <div className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                  Coachify
                </div>
              </Link>
            </div>

            {/* Right: Message Center & User Info */}
            <div className="flex items-center gap-4">
              {/* Message Center Icon */}
              {user && userData && role === "coach" && (
                <button
                  onClick={() => {
                    const newTab = activeTab === "messages" ? "dashboard" : "messages";
                    setActiveTab(newTab);
                  }}
                  className={`relative p-2 transition-colors ${
                    activeTab === "messages" 
                      ? "text-blue-400" 
                      : "text-gray-400 hover:text-white"
                  }`}
                  title="Messages"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {/* Notification badge - can be updated with actual unread count */}
                  {activeTab !== "messages" && (
                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
              )}
              
              {user && userData && (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={userData.displayName || "User"}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                        {(userData.displayName || user.email || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="text-sm text-left">
                        <div className="text-white font-medium flex items-center gap-2">
                          {userData.displayName || user.email}
                          {/* Verification Check Bubble */}
                          {role === "coach" && (
                            <div className="relative group">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                coachData?.isVerified 
                                  ? "bg-green-500 border-green-500" 
                                  : "border-gray-500 bg-transparent"
                              }`}>
                                <svg className={`w-3 h-3 ${coachData?.isVerified ? "text-white" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              {/* Tooltip */}
                              <div className="absolute right-0 top-full mt-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                {coachData?.isVerified ? "Verified" : "Not Verified"}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-gray-400 text-xs capitalize">{role}</div>
                      </div>
                    </div>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-[var(--card)] border border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden">
                        <div className="py-2">
                          <Link
                            href={`/coach/${user.uid}`}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800/50 transition-colors"
                          >
                            <span className="text-lg">👤</span>
                            <span>View Profile</span>
                          </Link>
                          <Link
                            href={`/app/${role}/settings`}
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-gray-300 hover:bg-gray-800/50 transition-colors"
                          >
                            <span className="text-lg">⚙️</span>
                            <span>Settings</span>
                          </Link>
                          <div className="border-t border-gray-800 my-2" />
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              handleLogout();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <span className="text-lg">🚪</span>
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 pt-16">
        {/* Left Sidebar */}
        <aside
          className={`
            fixed left-0 top-16 bottom-0 w-64 bg-[var(--card)] border-r border-gray-800 transition-transform duration-300 z-40 flex flex-col
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0
          `}
        >
          <div className="h-full overflow-y-auto px-4 py-6 flex flex-col">
            <nav className="space-y-2">
              {navItems.map((item) => {
                // Determine active state based on role
                let isActive = false;
                if (role === "coach") {
                  isActive = activeTab === item.key || (item.key !== "messages" && item.key !== "my-page" && item.key !== "dashboard" && pathname === item.href);
                } else {
                  // For students, check if it's a tab-based navigation
                  isActive = activeTab === item.key || Boolean(item.key && !["dashboard", "bookings", "library", "coaches"].includes(item.key) && pathname === item.href);
                }
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      // Handle coach-specific tabs
                      if (role === "coach") {
                        if (item.key === "messages" || item.key === "dashboard") {
                          setActiveTab(item.key);
                          if (typeof window !== "undefined") {
                            window.history.pushState({}, "", item.href);
                          }
                        } else if (item.key === "my-page") {
                          router.push("/app/coach/my-page");
                        } else if (item.key === "offerings") {
                          router.push("/app/coach/offerings");
                        } else {
                          router.push(item.href);
                        }
                      } else {
                        // Handle student tabs - all are tab-based navigation
                        if (item.key === "dashboard" || item.key === "bookings" || item.key === "library" || item.key === "coaches") {
                          setActiveTab(item.key);
                          if (typeof window !== "undefined") {
                            window.history.pushState({}, "", item.href);
                          }
                        } else {
                          router.push(item.href);
                        }
                      }
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left
                      ${
                        isActive
                          ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                      }
                    `}
                  >
                    {item.svg || <span className="text-xl">{item.icon}</span>}
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="mt-auto pt-8 border-t border-gray-800 space-y-2">
              <button
                onClick={() => {
                  // Open feedback form or modal
                  window.open("mailto:support@coachify.com?subject=Feedback", "_blank");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200"
              >
                <span className="text-lg">💬</span>
                <span className="font-medium">Give Feedback</span>
              </button>
              <button
                onClick={() => {
                  // Open bug report form or modal
                  window.open("mailto:support@coachify.com?subject=Bug Report", "_blank");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800/50 transition-all duration-200"
              >
                <span className="text-lg">🐛</span>
                <span className="font-medium">Report a Bug</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
              >
                <span className="text-lg">🚪</span>
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed bottom-4 left-4 z-50 p-3 bg-[var(--card)] border border-gray-800 rounded-lg shadow-lg"
        >
          <span className="text-2xl">{sidebarOpen ? "✕" : "☰"}</span>
        </button>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 min-h-[calc(100vh-64px)] pb-20 w-full overflow-x-hidden">
          <div className="h-full w-full max-w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <div className="lg:ml-64">
        <Footer />
      </div>
    </div>
  );
}





