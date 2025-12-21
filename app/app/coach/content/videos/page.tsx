"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getVideos, createVideo } from "@/lib/firebase/firestore";
import { where, orderBy } from "firebase/firestore";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/config";
import Link from "next/link";
import Image from "next/image";

export default function CoachVideosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    sport: "",
    tags: "",
    isFree: true,
    priceCents: 0,
    videoFile: null as File | null,
    thumbnailFile: null as File | null,
  });

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (!user) {
        router.push("/auth?role=coach");
        return;
      }
      setUser(user);
      await loadVideos(user.uid);
    });

    return () => unsubscribe();
  }, [router]);

  const loadVideos = async (coachId: string) => {
    setLoading(true);
    try {
      const videosData = await getVideos([
        where("coachId", "==", coachId),
        orderBy("createdAt", "desc"),
      ]);
      setVideos(videosData);
    } catch (error) {
      console.error("Error loading videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.videoFile) return;

    try {
      // Upload video
      const videoRef = ref(storage, `videos/${user.uid}/${Date.now()}_${formData.videoFile.name}`);
      await uploadBytes(videoRef, formData.videoFile);
      const videoUrl = await getDownloadURL(videoRef);

      // Upload thumbnail if provided
      let thumbnailUrl = "";
      if (formData.thumbnailFile) {
        const thumbRef = ref(storage, `thumbnails/${user.uid}/${Date.now()}_${formData.thumbnailFile.name}`);
        await uploadBytes(thumbRef, formData.thumbnailFile);
        thumbnailUrl = await getDownloadURL(thumbRef);
      }

      // Create video record
      await createVideo({
        coachId: user.uid,
        title: formData.title,
        description: formData.description,
        sport: formData.sport,
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        isFree: formData.isFree,
        priceCents: formData.isFree ? undefined : formData.priceCents * 100,
        videoUrl,
        thumbnailUrl: thumbnailUrl || undefined,
        visibility: "public",
      });

      setShowForm(false);
      setFormData({
        title: "",
        description: "",
        sport: "",
        tags: "",
        isFree: true,
        priceCents: 0,
        videoFile: null,
        thumbnailFile: null,
      });
      await loadVideos(user.uid);
    } catch (error) {
      console.error("Error creating video:", error);
      alert("Failed to upload video");
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      await deleteDoc(doc(db, "videos", videoId));
      await loadVideos(user!.uid);
    } catch (error) {
      console.error("Error deleting video:", error);
      alert("Failed to delete video");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">My Videos</h1>
          <GlowButton variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Upload Video"}
          </GlowButton>
        </div>

        {showForm && (
          <GradientCard className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Upload New Video</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <input
                    type="text"
                    value={formData.sport}
                    onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                    className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={formData.isFree}
                    onChange={(e) => setFormData({ ...formData, isFree: e.target.checked })}
                  />
                  <span>Free video</span>
                </label>
                {!formData.isFree && (
                  <input
                    type="number"
                    min="0"
                    value={formData.priceCents}
                    onChange={(e) => setFormData({ ...formData, priceCents: parseInt(e.target.value) || 0 })}
                    placeholder="Price in cents"
                    className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white mt-2"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Video File</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFormData({ ...formData, videoFile: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Thumbnail (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, thumbnailFile: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
                />
              </div>
              <GlowButton type="submit" variant="primary" glowColor="orange">
                Upload Video
              </GlowButton>
            </form>
          </GradientCard>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading videos...</div>
        ) : videos.length === 0 ? (
          <GradientCard>
            <p className="text-center text-gray-400 py-8">No videos yet. Upload your first video!</p>
          </GradientCard>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {videos.map((video) => (
              <GradientCard key={video.id}>
                {video.thumbnailUrl && (
                  <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      width={400}
                      height={225}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <h3 className="font-bold mb-2">{video.title}</h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{video.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                    {video.isFree ? "Free" : `$${video.priceCents! / 100}`}
                  </span>
                  <GlowButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(video.id)}
                  >
                    Delete
                  </GlowButton>
                </div>
              </GradientCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
