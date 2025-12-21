"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getArticles, createArticle, updateArticle } from "@/lib/firebase/firestore";
import { where, orderBy } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { SPORTS } from "@/lib/constants/sports";
import Link from "next/link";

export default function CoachArticlesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    sport: "",
    tags: "",
    excerpt: "",
    contentHtml: "",
    status: "draft" as "draft" | "published",
  });

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (!user) {
        router.push("/auth?role=coach");
        return;
      }
      setUser(user);
      await loadArticles(user.uid);
    });

    return () => unsubscribe();
  }, [router]);

  const loadArticles = async (coachId: string) => {
    setLoading(true);
    try {
      const articlesData = await getArticles([
        where("authorCoachId", "==", coachId),
        orderBy("createdAt", "desc"),
      ]);
      setArticles(articlesData);
    } catch (error) {
      console.error("Error loading articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const slug = formData.slug || formData.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      await createArticle({
        authorCoachId: user.uid,
        title: formData.title,
        slug,
        sport: formData.sport,
        tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
        excerpt: formData.excerpt,
        contentHtml: formData.contentHtml,
        status: formData.status,
        publishedAt: formData.status === "published" ? new Date() as any : undefined,
      });

      setShowForm(false);
      setFormData({
        title: "",
        slug: "",
        sport: "",
        tags: "",
        excerpt: "",
        contentHtml: "",
        status: "draft",
      });
      await loadArticles(user.uid);
    } catch (error) {
      console.error("Error creating article:", error);
      alert("Failed to create article");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">My Articles</h1>
          <GlowButton variant="primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Write Article"}
          </GlowButton>
        </div>

        {showForm && (
          <GradientCard className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Write New Article</h2>
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
                <label className="block text-sm font-medium mb-2">Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white min-h-[80px]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Content (HTML)</label>
                <textarea
                  value={formData.contentHtml}
                  onChange={(e) => setFormData({ ...formData, contentHtml: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white min-h-[300px] font-mono text-sm"
                  required
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.status === "published"}
                    onChange={(e) => setFormData({ ...formData, status: e.target.checked ? "published" : "draft" })}
                  />
                  <span>Publish immediately</span>
                </label>
              </div>
              <GlowButton type="submit" variant="primary" glowColor="orange">
                Create Article
              </GlowButton>
            </form>
          </GradientCard>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading articles...</div>
        ) : articles.length === 0 ? (
          <GradientCard>
            <p className="text-center text-gray-400 py-8">No articles yet. Write your first article!</p>
          </GradientCard>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <Link key={article.id} href={`/app/coach/article/${article.id}/edit`}>
                <GradientCard className="cursor-pointer hover:scale-105 transition-transform">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{article.title}</h3>
                      <p className="text-gray-400 line-clamp-2">{article.excerpt}</p>
                      <div className="flex gap-2 mt-3">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                          {article.sport}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          article.status === "published"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}>
                          {article.status}
                        </span>
                      </div>
                    </div>
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
