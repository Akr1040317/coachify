"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getBookings, getStudentData, getCoachNotes } from "@/lib/firebase/firestore";
import { where } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Link from "next/link";

export default function CoachStudentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    try {
      // Get all bookings to find unique students
      const bookings = await getBookings([where("coachId", "==", coachId)]);
      console.log("Bookings loaded:", bookings.length);
      
      if (!bookings || bookings.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const uniqueStudentIds = [...new Set(bookings.map(b => b.studentId).filter(Boolean))];
      console.log("Unique student IDs:", uniqueStudentIds.length);

      if (uniqueStudentIds.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const studentsData = await Promise.all(
        uniqueStudentIds.map(async (studentId) => {
          try {
            const student = await getStudentData(studentId);
            const studentBookings = bookings.filter(b => b.studentId === studentId);
            const notes = await getCoachNotes([
              where("coachId", "==", coachId),
              where("studentId", "==", studentId),
            ]).catch(() => []);

            let lastSession = null;
            if (studentBookings.length > 0) {
              try {
                const sortedBookings = studentBookings.sort((a, b) => {
                  const aTime = a.scheduledStart?.toMillis?.() || 0;
                  const bTime = b.scheduledStart?.toMillis?.() || 0;
                  return bTime - aTime;
                });
                lastSession = sortedBookings[0];
              } catch (e) {
                console.error("Error sorting bookings:", e);
              }
            }

            return {
              id: studentId,
              student,
              bookingsCount: studentBookings.length,
              lastSession,
              notesCount: notes?.length || 0,
            };
          } catch (err) {
            console.error(`Error loading student ${studentId}:`, err);
            return null;
          }
        })
      );

      // Filter out null results
      const validStudents = studentsData.filter(s => s !== null);
      console.log("Valid students loaded:", validStudents.length);
      setStudents(validStudents);
    } catch (error: any) {
      console.error("Error loading students:", error);
      setError(error?.message || "Failed to load students. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="coach" activeTab="students">
      <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">My Students</h1>

          {error && (
            <GradientCard className="p-6 mb-6 border-red-500/30 bg-red-500/5">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-red-400 mb-1">Error Loading Students</h3>
                  <p className="text-gray-400 text-sm">{error}</p>
                </div>
              </div>
            </GradientCard>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mb-4"></div>
              <p>Loading students...</p>
            </div>
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
                          {studentData.lastSession && studentData.lastSession.scheduledStart && (
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
    </DashboardLayout>
  );
}

