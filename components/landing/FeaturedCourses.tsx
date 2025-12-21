"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";

// Placeholder data
const FEATURED_COURSES = [
  {
    id: "1",
    title: "Master Basketball Shooting",
    coach: "Coach John",
    sport: "Basketball",
    level: "Intermediate",
    price: 99,
    lessons: 12,
  },
  {
    id: "2",
    title: "Soccer Fundamentals",
    coach: "Coach Sarah",
    sport: "Soccer",
    level: "Beginner",
    price: 79,
    lessons: 10,
  },
  {
    id: "3",
    title: "Tennis Serve Mastery",
    coach: "Coach Mike",
    sport: "Tennis",
    level: "Advanced",
    price: 129,
    lessons: 15,
  },
];

export function FeaturedCourses() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-[var(--card)] to-[var(--background)]">
      <div className="max-w-6xl mx-auto">
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
          className="text-center text-gray-300 mb-12 text-lg"
        >
          Structured learning paths from expert coaches
        </motion.p>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {FEATURED_COURSES.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <GradientCard gradient="blue-purple" glow>
                <div className="mb-4">
                  <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                    {course.sport}
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full ml-2">
                    {course.level}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-2">{course.title}</h3>
                <p className="text-gray-300 text-sm mb-4">by {course.coach}</p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div>
                    <span className="text-2xl font-bold">${course.price}</span>
                    <span className="text-gray-500 text-sm ml-2">{course.lessons} lessons</span>
                  </div>
                  <Link href={`/course/${course.id}`}>
                    <GlowButton variant="outline" size="sm">
                      View Course
                    </GlowButton>
                  </Link>
                </div>
              </GradientCard>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
