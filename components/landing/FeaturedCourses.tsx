"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { getCourses, getCoachData } from "@/lib/firebase/firestore";
import { where, orderBy } from "firebase/firestore";
import { SPORTS, SKILL_LEVELS } from "@/lib/constants/sports";
import Image from "next/image";

export function FeaturedCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSport, setFilterSport] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "title" | "price-low" | "price-high">("recent");

  useEffect(() => {
    loadCourses();
  }, [filterSport, filterLevel]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const constraints: any[] = [where("isPublished", "==", true)];
      
      if (filterSport) {
        constraints.push(where("sport", "==", filterSport));
      }
      
      if (filterLevel) {
        constraints.push(where("skillLevel", "==", filterLevel));
      }

      constraints.push(orderBy("createdAt", "desc"));

      const coursesData = await getCourses(constraints);
      
      // Load coach names
      const coursesWithCoaches = await Promise.all(
        coursesData.map(async (course) => {
          const coach = await getCoachData(course.coachId);
          return { 
            ...course, 
            coachName: coach?.displayName || "Unknown Coach",
            coachAvatar: coach?.avatarUrl || coach?.photoURL
          };
        })
      );

      // Apply sorting
      let sorted = [...coursesWithCoaches];
      switch (sortBy) {
        case "title":
          sorted.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case "price-low":
          sorted.sort((a, b) => (a.priceCents || 0) - (b.priceCents || 0));
          break;
        case "price-high":
          sorted.sort((a, b) => (b.priceCents || 0) - (a.priceCents || 0));
          break;
        case "recent":
        default:
          sorted.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      }

      setCourses(sorted.slice(0, 12)); // Limit to 12 courses
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Re-sort when sortBy changes
    if (courses.length > 0) {
      const sorted = [...courses];
      switch (sortBy) {
        case "title":
          sorted.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case "price-low":
          sorted.sort((a, b) => (a.priceCents || 0) - (b.priceCents || 0));
          break;
        case "price-high":
          sorted.sort((a, b) => (b.priceCents || 0) - (a.priceCents || 0));
          break;
        case "recent":
        default:
          sorted.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      }
      setCourses(sorted);
    }
  }, [sortBy]);

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-[var(--card)] to-[var(--background)]">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-center mb-4"
        >
          Featured Courses
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-center text-gray-300 mb-8 text-lg"
        >
          Structured learning paths from expert coaches
        </motion.p>

        {/* Filters and Sort */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Sport:</label>
            <select
              value={filterSport}
              onChange={(e) => setFilterSport(e.target.value)}
              className="px-4 py-2 bg-[var(--card)] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">All Sports</option>
              {SPORTS.map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Level:</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-4 py-2 bg-[var(--card)] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">All Levels</option>
              {SKILL_LEVELS.map((level) => (
                <option key={level} value={level.toLowerCase()}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 bg-[var(--card)] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="title">Title A-Z</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No courses found. Try adjusting your filters.
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {courses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <Link href={`/course/${course.id}`}>
                    <GradientCard className="h-full hover:scale-105 transition-transform cursor-pointer overflow-hidden flex flex-col">
                      {course.thumbnailUrl && (
                        <div className="w-full h-48 relative flex-shrink-0">
                          <Image
                            src={course.thumbnailUrl}
                            alt={course.title}
                            width={400}
                            height={225}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 left-3 flex items-center gap-2">
                            {course.coachAvatar && (
                              <img
                                src={course.coachAvatar}
                                alt={course.coachName}
                                className="w-8 h-8 rounded-full border-2 border-white"
                              />
                            )}
                            <span className="px-2 py-1 bg-blue-500/30 text-blue-200 rounded-full text-xs font-medium backdrop-blur-sm">
                              {course.sport}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs capitalize">
                            {course.skillLevel}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold mb-2 line-clamp-2 flex-shrink-0">{course.title}</h3>
                        <p className="text-gray-300 text-sm mb-2 flex-shrink-0">by {course.coachName}</p>
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-1">{course.description}</p>
                        <div className="flex items-center justify-between mt-auto flex-shrink-0 pt-4 border-t border-gray-700">
                          <div>
                            <span className="text-xl font-bold">${(course.priceCents / 100).toFixed(2)}</span>
                            {course.estimatedMinutes && (
                              <span className="text-gray-500 text-sm ml-2">
                                {Math.floor(course.estimatedMinutes / 60)}h {course.estimatedMinutes % 60}m
                              </span>
                            )}
                          </div>
                          <GlowButton variant="outline" size="sm">
                            View
                          </GlowButton>
                        </div>
                      </div>
                    </GradientCard>
                  </Link>
                </motion.div>
              ))}
            </div>
            <div className="text-center">
              <Link href="/courses">
                <GlowButton variant="primary" size="lg">
                  Browse All Courses
                </GlowButton>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

