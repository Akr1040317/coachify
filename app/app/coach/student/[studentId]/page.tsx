"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getStudentData, getBookings, getCoachNotes, createCoachNote } from "@/lib/firebase/firestore";
import { where, orderBy } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { SPORT_FOCUS_AREAS, type Sport } from "@/lib/constants/sports";
import { format } from "date-fns";

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteForm, setNoteForm] = useState({
    sport: "",
    focusAreas: [] as string[],
    skillRatings: {} as Record<string, number>,
    notes: "",
    drills: [] as string[],
    nextPlan: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (!user) {
        router.push("/auth?role=coach");
        return;
      }
      setUser(user);
      await loadData();
    });

    return () => unsubscribe();
  }, [router, studentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const studentData = await getStudentData(studentId);
      setStudent(studentData);

      const bookingsData = await getBookings([
        where("studentId", "==", studentId),
        where("coachId", "==", user!.uid),
        orderBy("scheduledStart", "desc"),
      ]);
      setBookings(bookingsData);

      const notesData = await getCoachNotes([
        where("coachId", "==", user!.uid),
        where("studentId", "==", studentId),
        orderBy("createdAt", "desc"),
      ]);
      setNotes(notesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await createCoachNote({
        coachId: user.uid,
        studentId,
        sport: noteForm.sport,
        focusAreas: noteForm.focusAreas,
        skillRatings: noteForm.skillRatings,
        notes: noteForm.notes,
        drills: noteForm.drills.filter(Boolean),
        nextPlan: noteForm.nextPlan,
      });

      setShowNoteForm(false);
      setNoteForm({
        sport: "",
        focusAreas: [],
        skillRatings: {},
        notes: "",
        drills: [],
        nextPlan: "",
      });
      await loadData();
    } catch (error) {
      console.error("Error creating note:", error);
      alert("Failed to create note");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const focusAreas = student?.primarySport ? SPORT_FOCUS_AREAS[student.primarySport as Sport] || [] : [];

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Student Details</h1>
          <GlowButton variant="primary" onClick={() => setShowNoteForm(!showNoteForm)}>
            {showNoteForm ? "Cancel" : "Add Progress Note"}
          </GlowButton>
        </div>

        {showNoteForm && (
          <GradientCard className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Add Progress Note</h2>
            <form onSubmit={handleSubmitNote} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Sport</label>
                <input
                  type="text"
                  value={noteForm.sport}
                  onChange={(e) => setNoteForm({ ...noteForm, sport: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Focus Areas</label>
                <div className="flex flex-wrap gap-2">
                  {focusAreas.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        const newAreas = noteForm.focusAreas.includes(area)
                          ? noteForm.focusAreas.filter(a => a !== area)
                          : [...noteForm.focusAreas, area];
                        setNoteForm({ ...noteForm, focusAreas: newAreas });
                      }}
                      className={`
                        px-3 py-1 rounded-full text-sm transition-all
                        ${noteForm.focusAreas.includes(area)
                          ? "bg-blue-500 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }
                      `}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Skill Ratings (1-5)</label>
                <div className="space-y-2">
                  {noteForm.focusAreas.map((area) => (
                    <div key={area} className="flex items-center justify-between">
                      <span className="text-sm">{area}</span>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => {
                              setNoteForm({
                                ...noteForm,
                                skillRatings: { ...noteForm.skillRatings, [area]: rating },
                              });
                            }}
                            className={`
                              w-8 h-8 rounded-full text-sm transition-all
                              ${noteForm.skillRatings[area] === rating
                                ? "bg-blue-500 text-white"
                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                              }
                            `}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={noteForm.notes}
                  onChange={(e) => setNoteForm({ ...noteForm, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white min-h-[100px]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Drills/Homework (one per line)</label>
                <textarea
                  value={noteForm.drills.join("\n")}
                  onChange={(e) => setNoteForm({ ...noteForm, drills: e.target.value.split("\n") })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white min-h-[80px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Next Session Plan</label>
                <textarea
                  value={noteForm.nextPlan}
                  onChange={(e) => setNoteForm({ ...noteForm, nextPlan: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white min-h-[80px]"
                />
              </div>
              <GlowButton type="submit" variant="primary" glowColor="orange">
                Save Note
              </GlowButton>
            </form>
          </GradientCard>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <GradientCard className="mb-6">
              <h2 className="text-2xl font-bold mb-4">Student Info</h2>
              <div className="space-y-2">
                <p><span className="font-semibold">Primary Sport:</span> {student?.primarySport || "N/A"}</p>
                <p><span className="font-semibold">Level:</span> {student?.level || "N/A"}</p>
                <p><span className="font-semibold">Goals:</span> {student?.goals?.join(", ") || "N/A"}</p>
              </div>
            </GradientCard>

            <GradientCard>
              <h2 className="text-2xl font-bold mb-4">Sessions</h2>
              <div className="space-y-3">
                {bookings.map((booking) => (
                  <div key={booking.id} className="p-3 bg-[var(--card)] rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {format(booking.scheduledStart.toDate(), "PPP 'at' p")}
                        </p>
                        <p className="text-sm text-gray-400">{booking.sessionMinutes} minutes</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        booking.status === "completed" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </GradientCard>
          </div>

          <div>
            <GradientCard>
              <h2 className="text-2xl font-bold mb-4">Progress Notes</h2>
              <div className="space-y-4">
                {notes.map((note) => (
                  <div key={note.id} className="p-4 bg-[var(--card)] rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">
                        {format(note.createdAt.toDate(), "PPP")}
                      </span>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                        {note.sport}
                      </span>
                    </div>
                    <p className="text-gray-300 mb-3 whitespace-pre-line">{note.notes}</p>
                    {note.skillRatings && Object.keys(note.skillRatings).length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm font-semibold mb-1">Skill Ratings:</div>
                        <div className="space-y-1">
                          {Object.entries(note.skillRatings).map(([area, rating]) => (
                            <div key={area} className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">{area}</span>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <span key={i} className={i < rating ? "text-yellow-400" : "text-gray-600"}>
                                    ⭐
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {note.drills && note.drills.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm font-semibold mb-1">Drills:</div>
                        <ul className="list-disc list-inside text-sm text-gray-400">
                          {note.drills.map((drill, i) => (
                            <li key={i}>{drill}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {note.nextPlan && (
                      <div>
                        <div className="text-sm font-semibold mb-1">Next Plan:</div>
                        <p className="text-sm text-gray-400">{note.nextPlan}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </GradientCard>
          </div>
        </div>
      </div>
    </div>
  );
}
