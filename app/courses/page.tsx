"use client";

import { useState, useEffect } from "react";
import { getCourses, getCoachData, type CourseData } from "@/lib/firebase/firestore";
import { where, orderBy } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { SPORTS, SKILL_LEVELS } from "@/lib/constants/sports";
import Link from "next/link";
import Image from "next/image";

export default function CoursesPage() {
  const [courses, setCourses] = useState<(CourseData & { id: string; coachName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sport: "",
    level: "",
  });

  useEffect(() => {
    loadCourses();
  }, [filters]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const constraints: any[] = [where("isPublished", "==", true), orderBy("createdAt", "desc")];
      
      if (filters.sport) {
        constraints.push(where("sport", "==", filters.sport));
      }
      
      if (filters.level) {
        constraints.push(where("skillLevel", "==", filters.level));
      }

      const coursesData = await getCourses(constraints);
      
      // Load coach names
      const coursesWithCoaches = await Promise.all(
        coursesData.map(async (course) => {
          const coach = await getCoachData(course.coachId);
          return { ...course, coachName: coach?.displayName || "Unknown Coach" };
        })
      );

      setCourses(coursesWithCoaches);
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Courses</h1>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="md:col-span-1">
            <GradientCard>
              <h2 className="text-xl font-bold mb-4">Filters</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sport</label>
                  <select
                    value={filters.sport}
                    onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                  >
                    <option value="">All Sports</option>
                    {SPORTS.map(sport => (
                      <option key={sport} value={sport}>{sport}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Skill Level</label>
                  <select
                    value={filters.level}
                    onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                  >
                    <option value="">All Levels</option>
                    {SKILL_LEVELS.map(level => (
                      <option key={level} value={level.toLowerCase()}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
            </GradientCard>
          </div>

          {/* Results */}
          <div className="md:col-span-3">
            {loading ? (
              <div className="text-center py-12 text-gray-400">Loading courses...</div>
            ) : courses.length === 0 ? (
              <GradientCard>
                <p className="text-center text-gray-400">No courses found matching your filters.</p>
              </GradientCard>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {courses.map((course) => (
                  <Link key={course.id} href={`/course/${course.id}`}>
                    <GradientCard gradient="blue-purple" glow className="cursor-pointer hover:scale-105 transition-transform">
                      {course.thumbnailUrl && (
                        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                          <Image
                            src={course.thumbnailUrl}
                            alt={course.title}
                            width={400}
                            height={225}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold mb-1">{course.title}</h3>
                          <p className="text-sm text-gray-400">by {course.coachName}</p>
                        </div>
                      </div>
                      <p className="text-gray-300 mb-4 line-clamp-2">{course.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                            {course.sport}
                          </span>
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                            {course.skillLevel}
                          </span>
                        </div>
                        <span className="text-2xl font-bold">${course.priceCents / 100}</span>
                      </div>
                    </GradientCard>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
