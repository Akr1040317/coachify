"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { createCourse, addCourseLesson } from "@/lib/firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/config";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { SPORTS, SKILL_LEVELS } from "@/lib/constants/sports";

export default function NewCoursePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    sport: "",
    skillLevel: "beginner" as "beginner" | "intermediate" | "advanced" | "competitive",
    priceCents: 0,
    thumbnailFile: null as File | null,
    previewVideoFile: null as File | null,
    outcomes: [""],
    lessons: [{ title: "", description: "", videoFile: null as File | null }],
  });

  useEffect(() => {
    const unsubscribe = onAuthChange((user: User | null) => {
      if (!user) {
        router.push("/auth?role=coach");
        return;
      }
      setUser(user);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      let thumbnailUrl = "";
      let previewVideoUrl = "";

      if (formData.thumbnailFile) {
        const thumbRef = ref(storage, `courses/${user.uid}/${Date.now()}_${formData.thumbnailFile.name}`);
        await uploadBytes(thumbRef, formData.thumbnailFile);
        thumbnailUrl = await getDownloadURL(thumbRef);
      }

      if (formData.previewVideoFile) {
        const previewRef = ref(storage, `courses/${user.uid}/preview_${Date.now()}_${formData.previewVideoFile.name}`);
        await uploadBytes(previewRef, formData.previewVideoFile);
        previewVideoUrl = await getDownloadURL(previewRef);
      }

      const courseId = await createCourse({
        coachId: user.uid,
        title: formData.title,
        description: formData.description,
        outcomes: formData.outcomes.filter(Boolean),
        sport: formData.sport,
        skillLevel: formData.skillLevel,
        priceCents: formData.priceCents * 100,
        currency: "USD",
        thumbnailUrl: thumbnailUrl || undefined,
        previewVideoUrl: previewVideoUrl || undefined,
        isPublished: false,
      });

      // Upload lessons
      for (let i = 0; i < formData.lessons.length; i++) {
        const lesson = formData.lessons[i];
        if (lesson.title && lesson.videoFile) {
          const videoRef = ref(storage, `courses/${courseId}/lessons/${Date.now()}_${lesson.videoFile.name}`);
          await uploadBytes(videoRef, lesson.videoFile);
          const videoUrl = await getDownloadURL(videoRef);

          await addCourseLesson(courseId, {
            title: lesson.title,
            description: lesson.description,
            order: i,
            videoUrl,
            durationSeconds: 0, // Would need to calculate from video
          });
        }
      }

      router.push(`/app/coach/course/${courseId}/edit`);
    } catch (error) {
      console.error("Error creating course:", error);
      alert("Failed to create course");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Create New Course</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <GradientCard>
            <h2 className="text-2xl font-bold mb-4">Course Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white min-h-[100px]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sport</label>
                  <select
                    value={formData.sport}
                    onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                    className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                    required
                  >
                    <option value="">Select...</option>
                    {SPORTS.map(sport => (
                      <option key={sport} value={sport}>{sport}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Skill Level</label>
                  <select
                    value={formData.skillLevel}
                    onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value as any })}
                    className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                    required
                  >
                    {SKILL_LEVELS.map(level => (
                      <option key={level} value={level.toLowerCase()}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Price ($)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.priceCents / 100}
                  onChange={(e) => setFormData({ ...formData, priceCents: parseInt(e.target.value) * 100 || 0 })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Learning Outcomes (one per line)</label>
                <textarea
                  value={formData.outcomes.join("\n")}
                  onChange={(e) => setFormData({ ...formData, outcomes: e.target.value.split("\n") })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white min-h-[100px]"
                  placeholder="Students will learn..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Thumbnail</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, thumbnailFile: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Preview Video (optional)</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFormData({ ...formData, previewVideoFile: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                />
              </div>
            </div>
          </GradientCard>

          <GradientCard>
            <h2 className="text-2xl font-bold mb-4">Lessons</h2>
            <div className="space-y-4">
              {formData.lessons.map((lesson, index) => (
                <div key={index} className="p-4 bg-[var(--card)] rounded-lg border border-gray-700">
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Lesson title"
                      value={lesson.title}
                      onChange={(e) => {
                        const newLessons = [...formData.lessons];
                        newLessons[index].title = e.target.value;
                        setFormData({ ...formData, lessons: newLessons });
                      }}
                      className="w-full px-4 py-2 bg-[var(--background)] border border-gray-600 rounded-lg text-white"
                    />
                    <textarea
                      placeholder="Lesson description"
                      value={lesson.description}
                      onChange={(e) => {
                        const newLessons = [...formData.lessons];
                        newLessons[index].description = e.target.value;
                        setFormData({ ...formData, lessons: newLessons });
                      }}
                      className="w-full px-4 py-2 bg-[var(--background)] border border-gray-600 rounded-lg text-white min-h-[60px]"
                    />
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const newLessons = [...formData.lessons];
                        newLessons[index].videoFile = e.target.files?.[0] || null;
                        setFormData({ ...formData, lessons: newLessons });
                      }}
                      className="w-full px-4 py-2 bg-[var(--background)] border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                </div>
              ))}
              <GlowButton
                type="button"
                variant="outline"
                onClick={() => setFormData({ ...formData, lessons: [...formData.lessons, { title: "", description: "", videoFile: null }] })}
              >
                Add Lesson
              </GlowButton>
            </div>
          </GradientCard>

          <GlowButton type="submit" variant="primary" size="lg" className="w-full" glowColor="orange">
            Create Course
          </GlowButton>
        </form>
      </div>
    </div>
  );
}
