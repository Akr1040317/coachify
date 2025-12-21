"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getUserData } from "@/lib/firebase/firestore";
import { GlowButton } from "@/components/ui/GlowButton";

export function Navbar() {
  const pathname = usePathname() || "";
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    if (typeof window === "undefined") return;
    
    try {
      unsubscribe = onAuthChange(async (user: User | null) => {
        setUser(user);
        if (user) {
          setLoading(true);
          try {
            const userData = await getUserData(user.uid);
            setUserRole(userData?.role || null);
          } catch (error: any) {
            console.error("Error fetching user data:", error);
            // If it's a permission error, the user might not have a document yet
            // Don't set userRole, which will keep showing sign in/up buttons
            if (error.code === "permission-denied" || error.message?.includes("permission")) {
              console.warn("Permission denied - user document may not exist yet");
              setUserRole(null);
            } else {
              setUserRole(null);
            }
          } finally {
            setLoading(false);
          }
        } else {
          setUserRole(null);
          setLoading(false);
        }
      });
    } catch (error) {
      console.error("Error setting up auth listener:", error);
      setLoading(false);
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[var(--background)]/95 backdrop-blur-md border-b border-gray-800 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
              Coachify
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href={user ? "/coaches" : "/auth?mode=signup&role=student"}
              className={`text-sm font-medium transition-colors hover:text-blue-400 ${
                pathname === "/coaches" ? "text-blue-400" : "text-gray-300"
              }`}
            >
              Find Coaches
            </Link>
            <Link
              href="/articles"
              className={`text-sm font-medium transition-colors hover:text-blue-400 ${
                pathname === "/articles" ? "text-blue-400" : "text-gray-300"
              }`}
            >
              Articles
            </Link>
            <Link
              href="/how-it-works"
              className={`text-sm font-medium transition-colors hover:text-blue-400 ${
                pathname === "/how-it-works" ? "text-blue-400" : "text-gray-300"
              }`}
            >
              How It Works
            </Link>
            <Link
              href="/pricing"
              className={`text-sm font-medium transition-colors hover:text-blue-400 ${
                pathname === "/pricing" ? "text-blue-400" : "text-gray-300"
              }`}
            >
              Pricing
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            {loading ? (
              // Show nothing while loading to prevent flash
              <div className="w-20 h-8" />
            ) : user && userRole ? (
              // Only show Dashboard if we successfully got userRole
              <Link href={`/app/${userRole}/dashboard`}>
                <GlowButton variant="outline" size="sm">
                  Dashboard
                </GlowButton>
              </Link>
            ) : (
              // Show sign in/up if no user, or if user exists but no role (permission error or new user)
              <>
                <Link href="/auth?mode=signin">
                  <GlowButton variant="secondary" size="sm">
                    Sign In
                  </GlowButton>
                </Link>
                <Link href="/auth?mode=signup">
                  <GlowButton variant="primary" size="sm">
                    Sign Up
                  </GlowButton>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
