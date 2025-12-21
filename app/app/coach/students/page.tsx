"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getBookings, getStudentData, getCoachNotes, createCoachNote } from "@/lib/firebase/firestore";
import { where } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import Link from "next/link";

export default function CoachStudentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (!user) {
        router.push("/auth?role=coach");
        return;
      }
      setUser(user);
      await loadStudents(user.uid);
    });

    return () => unsubscribe();
  }, [router]);

  const loadStudents = async (coachId: string) => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">My Students</h1>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading students...</div>
        ) : students.length === 0 ? (
          <GradientCard>
            <p className="text-center text-gray-400 py-8">No students yet.</p>
          </GradientCard>
        ) : (
          <div className="space-y-4">
            {students.map((studentData) => (
              <Link key={studentData.id} href={`/app/coach/student/${studentData.id}`}>
                <GradientCard className="cursor-pointer hover:scale-105 transition-transform">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-1">Student</h3>
                      <div className="flex gap-4 text-sm text-gray-400">
                        <span>Primary Sport: {studentData.student?.primarySport || "N/A"}</span>
                        <span>Level: {studentData.student?.level || "N/A"}</span>
                      </div>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-gray-400">
                          {studentData.bookingsCount} sessions
                        </span>
                        <span className="text-gray-400">
                          {studentData.notesCount} notes
                        </span>
                        {studentData.lastSession && (
                          <span className="text-gray-400">
                            Last: {new Date(studentData.lastSession.scheduledStart.toMillis()).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <GlowButton variant="outline" size="sm">
                      View Details
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
}
