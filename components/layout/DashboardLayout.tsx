"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthChange, signOut } from "@/lib/firebase/auth";
import { getUserData } from "@/lib/firebase/firestore";
import { User } from "firebase/auth";
import { Footer } from "./Footer";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: "coach" | "student";
}

const coachNavItems = [
  { href: "/app/coach/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/app/coach/bookings", label: "Bookings", icon: "📅" },
  { href: "/app/coach/students", label: "Students", icon: "👥" },
  { href: "/app/coach/courses", label: "Courses", icon: "📚" },
  { href: "/app/coach/content/videos", label: "Content", icon: "🎥" },
  { href: "/app/coach/articles", label: "Articles", icon: "✍️" },
];

const studentNavItems = [
  { href: "/app/student/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/app/student/bookings", label: "Bookings", icon: "📅" },
  { href: "/app/student/library", label: "Library", icon: "📚" },
];

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (!user) {
        router.push("/auth");
        return;
      }

      try {
        const data = await getUserData(user.uid);
        if (!data || data.role !== role || !data.onboardingCompleted) {
          router.push(`/onboarding/${role}/1`);
          return;
        }
        setUser(user);
        setUserData(data);
        // Store user ID for child components
        if (typeof window !== "undefined") {
          localStorage.setItem("userId", user.uid);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [role, router]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
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

            {/* Right: User Info with Dropdown */}
            <div className="flex items-center gap-4">
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
                    <div className="hidden sm:block text-sm text-left">
                      <div className="text-white font-medium">{userData.displayName || user.email}</div>
                      <div className="text-gray-400 text-xs capitalize">{role}</div>
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
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                      ${
                        isActive
                          ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                      }
                    `}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
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
        <main className="flex-1 lg:ml-64 min-h-[calc(100vh-64px)] pb-20">
          <div className="h-full">{children}</div>
        </main>
      </div>

      {/* Footer */}
      <div className="lg:ml-64">
        <Footer />
      </div>
    </div>
  );
}
