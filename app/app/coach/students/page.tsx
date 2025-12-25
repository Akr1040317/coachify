"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getBookings, getStudentData, getCoachNotes, getCoachData } from "@/lib/firebase/firestore";
import { where } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Link from "next/link";

type SortField = "name" | "sessions" | "lastSession" | "notes";
type SortDirection = "asc" | "desc";

export default function CoachStudentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [coachData, setCoachData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Sorting and filtering state
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterSport, setFilterSport] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (!user) {
        router.push("/auth?role=coach");
        return;
      }
      setUser(user);
      await Promise.all([
        loadCoachData(user.uid),
        loadStudents(user.uid)
      ]);
    });

    return () => unsubscribe();
  }, [router]);

  const loadCoachData = async (coachId: string) => {
    try {
      const coach = await getCoachData(coachId);
      setCoachData(coach);
    } catch (error) {
      console.error("Error loading coach data:", error);
    }
  };

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

  // Get unique sports and levels for filters
  const availableSports = useMemo(() => {
    const sports = new Set<string>();
    students.forEach(s => {
      if (s.student?.primarySport) sports.add(s.student.primarySport);
      if (s.student?.sports) {
        s.student.sports.forEach((sport: string) => sports.add(sport));
      }
    });
    return Array.from(sports).sort();
  }, [students]);

  const availableLevels = useMemo(() => {
    const levels = new Set<string>();
    students.forEach(s => {
      if (s.student?.level) levels.add(s.student.level);
    });
    return Array.from(levels).sort();
  }, [students]);

  // Filtered and sorted students
  const filteredAndSortedStudents = useMemo(() => {
    let filtered = [...students];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.student?.displayName?.toLowerCase().includes(query) ||
        s.student?.primarySport?.toLowerCase().includes(query) ||
        s.student?.level?.toLowerCase().includes(query)
      );
    }

    // Apply sport filter
    if (filterSport !== "all") {
      filtered = filtered.filter(s => 
        s.student?.primarySport === filterSport ||
        s.student?.sports?.includes(filterSport)
      );
    }

    // Apply level filter
    if (filterLevel !== "all") {
      filtered = filtered.filter(s => s.student?.level === filterLevel);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "name":
          aValue = (a.student?.displayName || "").toLowerCase();
          bValue = (b.student?.displayName || "").toLowerCase();
          break;
        case "sessions":
          aValue = a.bookingsCount;
          bValue = b.bookingsCount;
          break;
        case "lastSession":
          aValue = a.lastSession?.scheduledStart?.toMillis?.() || 0;
          bValue = b.lastSession?.scheduledStart?.toMillis?.() || 0;
          break;
        case "notes":
          aValue = a.notesCount;
          bValue = b.notesCount;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [students, searchQuery, filterSport, filterLevel, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getInviteLink = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const coachId = user?.uid || "";
    return `${baseUrl}/get-started/signup/student?ref=${coachId}`;
  };

  const handleCopyInviteLink = async () => {
    const link = getInviteLink();
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSendEmailInvite = () => {
    if (!inviteEmail) return;
    const subject = encodeURIComponent(`${coachData?.displayName || "A coach"} invited you to join Coachify!`);
    const body = encodeURIComponent(
      `Hi there!\n\n${coachData?.displayName || "A coach"} invited you to join Coachify, a platform where you can find verified coaches and improve your skills.\n\nSign up here: ${getInviteLink()}\n\nLooking forward to coaching you!`
    );
    window.location.href = `mailto:${inviteEmail}?subject=${subject}&body=${body}`;
    setShowInviteModal(false);
    setInviteEmail("");
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === "asc" ? (
      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <DashboardLayout role="coach" activeTab="students">
      <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with Invite Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <h1 className="text-4xl font-bold">My Students</h1>
            <GlowButton 
              variant="primary" 
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Invite Student
            </GlowButton>
          </div>

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
          ) : (
            <>
              {/* Filters and Search */}
              <GradientCard className="p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-[var(--card)] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Sport Filter */}
                  {availableSports.length > 0 && (
                    <select
                      value={filterSport}
                      onChange={(e) => setFilterSport(e.target.value)}
                      className="px-4 py-2 bg-[var(--card)] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Sports</option>
                      {availableSports.map(sport => (
                        <option key={sport} value={sport}>{sport}</option>
                      ))}
                    </select>
                  )}

                  {/* Level Filter */}
                  {availableLevels.length > 0 && (
                    <select
                      value={filterLevel}
                      onChange={(e) => setFilterLevel(e.target.value)}
                      className="px-4 py-2 bg-[var(--card)] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Levels</option>
                      {availableLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  )}
                </div>
              </GradientCard>

              {/* Table */}
              {filteredAndSortedStudents.length === 0 ? (
                <GradientCard className="p-12">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-2xl font-bold mb-2 text-gray-300">No students found</h3>
                    <p className="text-gray-400 mb-6">
                      {searchQuery || filterSport !== "all" || filterLevel !== "all"
                        ? "Try adjusting your filters to see more results."
                        : "Start accepting bookings to see your students here, or invite students to join."}
                    </p>
                    {(!searchQuery && filterSport === "all" && filterLevel === "all") && (
                      <GlowButton variant="primary" onClick={() => setShowInviteModal(true)}>
                        Invite Your First Student
                      </GlowButton>
                    )}
                  </div>
                </GradientCard>
              ) : (
                <GradientCard className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800/50 border-b border-gray-700">
                        <tr>
                          <th className="px-6 py-4 text-left">
                            <button
                              onClick={() => handleSort("name")}
                              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors font-semibold"
                            >
                              Student Name
                              <SortIcon field="name" />
                            </button>
                          </th>
                          <th className="px-6 py-4 text-left text-gray-300 font-semibold">Sport</th>
                          <th className="px-6 py-4 text-left text-gray-300 font-semibold">Level</th>
                          <th className="px-6 py-4 text-left">
                            <button
                              onClick={() => handleSort("sessions")}
                              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors font-semibold"
                            >
                              Sessions
                              <SortIcon field="sessions" />
                            </button>
                          </th>
                          <th className="px-6 py-4 text-left">
                            <button
                              onClick={() => handleSort("notes")}
                              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors font-semibold"
                            >
                              Notes
                              <SortIcon field="notes" />
                            </button>
                          </th>
                          <th className="px-6 py-4 text-left">
                            <button
                              onClick={() => handleSort("lastSession")}
                              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors font-semibold"
                            >
                              Last Session
                              <SortIcon field="lastSession" />
                            </button>
                          </th>
                          <th className="px-6 py-4 text-right text-gray-300 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {filteredAndSortedStudents.map((studentData) => (
                          <tr
                            key={studentData.id}
                            className="hover:bg-gray-800/30 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <Link href={`/app/coach/student/${studentData.id}`} className="flex items-center gap-3 hover:text-blue-400 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                  {(studentData.student?.displayName || "S")[0].toUpperCase()}
                                </div>
                                <span className="font-medium">{studentData.student?.displayName || "Student"}</span>
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-gray-300">
                              {studentData.student?.primarySport || "N/A"}
                            </td>
                            <td className="px-6 py-4 text-gray-300">
                              {studentData.student?.level || "N/A"}
                            </td>
                            <td className="px-6 py-4 text-gray-300">
                              {studentData.bookingsCount}
                            </td>
                            <td className="px-6 py-4 text-gray-300">
                              {studentData.notesCount}
                            </td>
                            <td className="px-6 py-4 text-gray-300">
                              {studentData.lastSession && studentData.lastSession.scheduledStart ? (
                                new Date(studentData.lastSession.scheduledStart.toMillis()).toLocaleDateString()
                              ) : (
                                <span className="text-gray-500">Never</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Link href={`/app/coach/student/${studentData.id}`}>
                                <GlowButton variant="outline" size="sm">
                                  View
                                </GlowButton>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GradientCard>
              )}

              {/* Results count */}
              {filteredAndSortedStudents.length > 0 && (
                <div className="mt-4 text-sm text-gray-400">
                  Showing {filteredAndSortedStudents.length} of {students.length} student{students.length !== 1 ? 's' : ''}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={() => setShowInviteModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <div className="pointer-events-auto max-w-lg w-full">
              <GradientCard className="p-8 bg-[var(--card)] border-2 border-gray-700 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-white">Invite a Student</h2>
                  <button
                    onClick={() => setShowInviteModal(false)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Email Invite */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Email Address</label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="student@example.com"
                        className="flex-1 px-4 py-2 bg-[var(--background)] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <GlowButton
                        variant="primary"
                        onClick={handleSendEmailInvite}
                        disabled={!inviteEmail}
                      >
                        Send Email
                      </GlowButton>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-[var(--card)] text-gray-400">OR</span>
                    </div>
                  </div>

                  {/* Copy Link */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Share Link</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={getInviteLink()}
                        readOnly
                        className="flex-1 px-4 py-2 bg-[var(--background)] border border-gray-600 rounded-lg text-gray-300 text-sm focus:outline-none"
                      />
                      <GlowButton
                        variant={copied ? "primary" : "outline"}
                        onClick={handleCopyInviteLink}
                        className="min-w-[100px]"
                      >
                        {copied ? (
                          <>
                            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                          </>
                        )}
                      </GlowButton>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      Share this link on social media, messaging apps, or anywhere else to invite students
                    </p>
                  </div>
                </div>
              </GradientCard>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
