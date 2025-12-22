"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { onAuthChange } from "@/lib/firebase/auth";
import {
  getCourse,
  getVideos,
  getArticles,
  updateCourse,
  createVideo,
  createArticle,
  type CourseData,
  type VideoData,
  type ArticleData,
} from "@/lib/firebase/firestore";
import { uploadVideo, uploadVideoThumbnail, uploadArticleCover } from "@/lib/firebase/storage";
import { User } from "firebase/auth";
import { where } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { motion, Reorder } from "framer-motion";
import Image from "next/image";

interface ContentItem {
  id: string;
  type: "video" | "article";
  title: string;
  thumbnailUrl?: string;
  data: VideoData | ArticleData;
}

export default function CourseEditPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<(CourseData & { id: string }) | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [availableVideos, setAvailableVideos] = useState<(VideoData & { id: string })[]>([]);
  const [availableArticles, setAvailableArticles] = useState<(ArticleData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [showAddArticle, setShowAddArticle] = useState(false);
  const [showAddExisting, setShowAddExisting] = useState(false);

  // New video/article form state
  const [newVideo, setNewVideo] = useState({
    title: "",
    description: "",
    videoFile: null as File | null,
    thumbnailFile: null as File | null,
    isFree: true,
    priceCents: 0,
  });

  const [newArticle, setNewArticle] = useState({
    title: "",
    excerpt: "",
    contentHtml: "",
    coverFile: null as File | null,
  });

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (user) {
        setUser(user);
        await loadCourseData(user.uid);
      }
    });

    return () => unsubscribe();
  }, [courseId]);

  const loadCourseData = async (coachId: string) => {
    setLoading(true);
    try {
      const courseData = await getCourse(courseId);
      if (!courseData) {
        router.push("/app/coach/courses");
        return;
      }
      setCourse(courseData as CourseData & { id: string });

      // Load all coach's videos and articles for selection
      const [allVideos, allArticles] = await Promise.all([
        getVideos([where("coachId", "==", coachId)]),
        getArticles([where("authorCoachId", "==", coachId)]),
      ]);

      setAvailableVideos(allVideos);
      setAvailableArticles(allArticles);

      // Load course content
      const videoIds = courseData.videoIds || [];
      const articleIds = courseData.articleIds || [];

      // Fetch all videos/articles and filter by IDs
      const [allVideosForCourse, allArticlesForCourse] = await Promise.all([
        videoIds.length > 0 ? getVideos([where("coachId", "==", coachId)]) : Promise.resolve([]),
        articleIds.length > 0 ? getArticles([where("authorCoachId", "==", coachId)]) : Promise.resolve([]),
      ]);

      // Filter to only include videos/articles in the course
      const videosData = allVideosForCourse.filter((v) => videoIds.includes(v.id));
      const articlesData = allArticlesForCourse.filter((a) => articleIds.includes(a.id));

      // Create content items array maintaining order
      const items: ContentItem[] = [];
      
      // Add videos in order
      videoIds.forEach((id) => {
        const video = videosData.find((v) => v.id === id);
        if (video) {
          items.push({
            id: video.id,
            type: "video",
            title: video.title,
            thumbnailUrl: video.thumbnailUrl,
            data: video,
          });
        }
      });

      // Add articles in order
      articleIds.forEach((id) => {
        const article = articlesData.find((a) => a.id === id);
        if (article) {
          items.push({
            id: article.id,
            type: "article",
            title: article.title,
            thumbnailUrl: article.coverImageUrl,
            data: article,
          });
        }
      });

      setContentItems(items);
    } catch (error) {
      console.error("Error loading course:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrder = async () => {
    if (!course || !user) return;

    setSaving(true);
    try {
      const videoIds: string[] = [];
      const articleIds: string[] = [];

      contentItems.forEach((item) => {
        if (item.type === "video") {
          videoIds.push(item.id);
        } else {
          articleIds.push(item.id);
        }
      });

      await updateCourse(courseId, {
        videoIds,
        articleIds,
        estimatedMinutes: calculateEstimatedTime(),
      });

      alert("Course updated successfully!");
    } catch (error) {
      console.error("Error saving course:", error);
      alert("Failed to save course. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setContentItems(contentItems.filter((item) => item.id !== itemId));
  };

  const handleAddExistingVideo = (videoId: string) => {
    const video = availableVideos.find((v) => v.id === videoId);
    if (video && !contentItems.find((item) => item.id === videoId)) {
      setContentItems([
        ...contentItems,
        {
          id: video.id,
          type: "video",
          title: video.title,
          thumbnailUrl: video.thumbnailUrl,
          data: video,
        },
      ]);
      setShowAddExisting(false);
    }
  };

  const handleAddExistingArticle = (articleId: string) => {
    const article = availableArticles.find((a) => a.id === articleId);
    if (article && !contentItems.find((item) => item.id === articleId)) {
      setContentItems([
        ...contentItems,
        {
          id: article.id,
          type: "article",
          title: article.title,
          thumbnailUrl: article.coverImageUrl,
          data: article,
        },
      ]);
      setShowAddExisting(false);
    }
  };

  const handleCreateVideo = async () => {
    if (!user || !newVideo.title || !newVideo.videoFile) return;

    try {
      setSaving(true);

      // Upload video
      const videoUrl = await uploadVideo(newVideo.videoFile, user.uid);

      // Upload thumbnail if provided
      let thumbnailUrl: string | undefined;
      if (newVideo.thumbnailFile) {
        thumbnailUrl = await uploadVideoThumbnail(newVideo.thumbnailFile, user.uid, `video-${Date.now()}`);
      }

      // Create video document
      const videoId = await createVideo({
        coachId: user.uid,
        title: newVideo.title,
        description: newVideo.description,
        sport: course?.sport || "",
        tags: [],
        isFree: newVideo.isFree,
        priceCents: newVideo.isFree ? undefined : newVideo.priceCents,
        videoUrl,
        thumbnailUrl,
        visibility: "unlisted",
      });

      // Add to course
      setContentItems([
        ...contentItems,
        {
          id: videoId,
          type: "video",
          title: newVideo.title,
          thumbnailUrl,
          data: {} as VideoData,
        },
      ]);

      // Reset form
      setNewVideo({
        title: "",
        description: "",
        videoFile: null,
        thumbnailFile: null,
        isFree: true,
        priceCents: 0,
      });
      setShowAddVideo(false);
    } catch (error) {
      console.error("Error creating video:", error);
      alert("Failed to create video. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateArticle = async () => {
    if (!user || !newArticle.title || !newArticle.contentHtml) return;

    try {
      setSaving(true);

      // Upload cover if provided
      let coverImageUrl: string | undefined;
      if (newArticle.coverFile) {
        coverImageUrl = await uploadArticleCover(newArticle.coverFile, user.uid, `article-${Date.now()}`);
      }

      // Create slug from title
      const slug = newArticle.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Create article document
      const articleId = await createArticle({
        authorCoachId: user.uid,
        title: newArticle.title,
        slug,
        sport: course?.sport || "",
        tags: [],
        excerpt: newArticle.excerpt,
        contentHtml: newArticle.contentHtml,
        coverImageUrl,
        status: "draft",
      });

      // Add to course
      setContentItems([
        ...contentItems,
        {
          id: articleId,
          type: "article",
          title: newArticle.title,
          thumbnailUrl: coverImageUrl,
          data: {} as ArticleData,
        },
      ]);

      // Reset form
      setNewArticle({
        title: "",
        excerpt: "",
        contentHtml: "",
        coverFile: null,
      });
      setShowAddArticle(false);
    } catch (error) {
      console.error("Error creating article:", error);
      alert("Failed to create article. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const calculateEstimatedTime = () => {
    // Estimate: videos average 10 min, articles average 7 min
    const videoCount = contentItems.filter((item) => item.type === "video").length;
    const articleCount = contentItems.filter((item) => item.type === "article").length;
    return videoCount * 10 + articleCount * 7;
  };

  if (loading) {
    return (
      <DashboardLayout role="coach">
        <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12 text-gray-400">Loading course...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return null;
  }

  const unusedVideos = availableVideos.filter(
    (v) => !contentItems.find((item) => item.id === v.id && item.type === "video")
  );
  const unusedArticles = availableArticles.filter(
    (a) => !contentItems.find((item) => item.id === a.id && item.type === "article")
  );

  return (
    <DashboardLayout role="coach">
      <div className="min-h-[calc(100vh-64px)] p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg border-2 border-gray-600 hover:border-gray-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
                  Edit Course: {course.title}
                </h1>
                <p className="text-gray-400 mt-1">Drag and drop to reorder content</p>
              </div>
            </div>
            <div className="flex gap-3">
              <GlowButton variant="outline" onClick={() => router.push(`/app/coach/courses/${courseId}`)}>
                Cancel
              </GlowButton>
              <GlowButton variant="primary" onClick={handleSaveOrder} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </GlowButton>
            </div>
          </div>

          {/* Add Content Buttons */}
          <div className="flex gap-3 flex-wrap">
            <GlowButton variant="outline" onClick={() => setShowAddVideo(true)}>
              + Add New Video
            </GlowButton>
            <GlowButton variant="outline" onClick={() => setShowAddArticle(true)}>
              + Add New Article
            </GlowButton>
            {(unusedVideos.length > 0 || unusedArticles.length > 0) && (
              <GlowButton variant="outline" onClick={() => setShowAddExisting(true)}>
                + Add Existing Content
              </GlowButton>
            )}
          </div>

          {/* Content List with Drag and Drop */}
          {contentItems.length === 0 ? (
            <GradientCard className="p-12 text-center">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2">No content yet</h3>
              <p className="text-gray-400">Add videos and articles to your course</p>
            </GradientCard>
          ) : (
            <Reorder.Group axis="y" values={contentItems} onReorder={setContentItems} className="space-y-4">
              {contentItems.map((item) => (
                <Reorder.Item key={item.id} value={item}>
                  <GradientCard className="p-6 cursor-move">
                    <div className="flex items-center gap-4">
                      {/* Drag Handle */}
                      <div className="flex-shrink-0 cursor-grab active:cursor-grabbing">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                      </div>

                      {/* Thumbnail */}
                      <div className="flex-shrink-0 w-32 h-20 bg-gray-800 rounded-lg overflow-hidden">
                        {item.thumbnailUrl ? (
                          <Image
                            src={item.thumbnailUrl}
                            alt={item.title}
                            width={128}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {item.type === "video" ? (
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            ) : (
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Content Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.type === "video"
                                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            }`}
                          >
                            {item.type === "video" ? "Video" : "Article"}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold line-clamp-1">{item.title}</h3>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="flex-shrink-0 p-2 rounded-lg border-2 border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </GradientCard>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}

          {/* Add New Video Modal */}
          {showAddVideo && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <GradientCard className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
                <h2 className="text-2xl font-bold mb-6">Add New Video</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Title *</label>
                    <input
                      type="text"
                      value={newVideo.title}
                      onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                      className="w-full px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={newVideo.description}
                      onChange={(e) => setNewVideo({ ...newVideo, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Video File *</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setNewVideo({ ...newVideo, videoFile: e.target.files?.[0] || null })}
                      className="w-full px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Thumbnail (optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewVideo({ ...newVideo, thumbnailFile: e.target.files?.[0] || null })}
                      className="w-full px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={newVideo.isFree}
                      onChange={(e) => setNewVideo({ ...newVideo, isFree: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <label>Free video</label>
                  </div>
                  {!newVideo.isFree && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Price (cents)</label>
                      <input
                        type="number"
                        value={newVideo.priceCents}
                        onChange={(e) => setNewVideo({ ...newVideo, priceCents: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white"
                      />
                    </div>
                  )}
                  <div className="flex gap-3 pt-4">
                    <GlowButton variant="outline" onClick={() => setShowAddVideo(false)} className="flex-1">
                      Cancel
                    </GlowButton>
                    <GlowButton
                      variant="primary"
                      onClick={handleCreateVideo}
                      disabled={!newVideo.title || !newVideo.videoFile || saving}
                      className="flex-1"
                    >
                      {saving ? "Uploading..." : "Add Video"}
                    </GlowButton>
                  </div>
                </div>
              </GradientCard>
            </div>
          )}

          {/* Add New Article Modal */}
          {showAddArticle && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <GradientCard className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
                <h2 className="text-2xl font-bold mb-6">Add New Article</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Title *</label>
                    <input
                      type="text"
                      value={newArticle.title}
                      onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                      className="w-full px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Excerpt</label>
                    <textarea
                      value={newArticle.excerpt}
                      onChange={(e) => setNewArticle({ ...newArticle, excerpt: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Content (HTML) *</label>
                    <textarea
                      value={newArticle.contentHtml}
                      onChange={(e) => setNewArticle({ ...newArticle, contentHtml: e.target.value })}
                      rows={10}
                      className="w-full px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Cover Image (optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewArticle({ ...newArticle, coverFile: e.target.files?.[0] || null })}
                      className="w-full px-4 py-3 bg-[var(--background)] border-2 border-gray-600 rounded-xl text-white"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <GlowButton variant="outline" onClick={() => setShowAddArticle(false)} className="flex-1">
                      Cancel
                    </GlowButton>
                    <GlowButton
                      variant="primary"
                      onClick={handleCreateArticle}
                      disabled={!newArticle.title || !newArticle.contentHtml || saving}
                      className="flex-1"
                    >
                      {saving ? "Creating..." : "Add Article"}
                    </GlowButton>
                  </div>
                </div>
              </GradientCard>
            </div>
          )}

          {/* Add Existing Content Modal */}
          {showAddExisting && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <GradientCard className="max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
                <h2 className="text-2xl font-bold mb-6">Add Existing Content</h2>
                <div className="space-y-6">
                  {unusedVideos.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-3">Videos</h3>
                      <div className="space-y-2">
                        {unusedVideos.map((video) => (
                          <button
                            key={video.id}
                            onClick={() => handleAddExistingVideo(video.id)}
                            className="w-full p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-left transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {video.thumbnailUrl && (
                                <Image
                                  src={video.thumbnailUrl}
                                  alt={video.title}
                                  width={80}
                                  height={45}
                                  className="w-20 h-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium">{video.title}</p>
                                <p className="text-sm text-gray-400 line-clamp-1">{video.description}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {unusedArticles.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-3">Articles</h3>
                      <div className="space-y-2">
                        {unusedArticles.map((article) => (
                          <button
                            key={article.id}
                            onClick={() => handleAddExistingArticle(article.id)}
                            className="w-full p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-left transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {article.coverImageUrl && (
                                <Image
                                  src={article.coverImageUrl}
                                  alt={article.title}
                                  width={80}
                                  height={45}
                                  className="w-20 h-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium">{article.title}</p>
                                <p className="text-sm text-gray-400 line-clamp-1">{article.excerpt}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {unusedVideos.length === 0 && unusedArticles.length === 0 && (
                    <p className="text-gray-400 text-center py-8">No available content to add</p>
                  )}
                  <div className="pt-4">
                    <GlowButton variant="outline" onClick={() => setShowAddExisting(false)} className="w-full">
                      Close
                    </GlowButton>
                  </div>
                </div>
              </GradientCard>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
