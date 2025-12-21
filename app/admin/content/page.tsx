"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/firebase/auth";
import { User } from "firebase/auth";
import { getUserData, getArticles, updateArticle } from "@/lib/firebase/firestore";
import { orderBy } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { GlowButton } from "@/components/ui/GlowButton";
import Link from "next/link";

export default function AdminContentPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user: User | null) => {
      if (!user) {
        router.push("/auth");
        return;
      }

      const userData = await getUserData(user.uid);
      if (!userData || userData.role !== "admin") {
        router.push("/");
        return;
      }

      setUser(user);
      await loadArticles();
    });

    return () => unsubscribe();
  }, [router]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const articlesData = await getArticles([orderBy("createdAt", "desc")]);
      setArticles(articlesData);
    } catch (error) {
      console.error("Error loading articles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (articleId: string, status: "published" | "draft") => {
    try {
      await updateArticle(articleId, { status });
      await loadArticles();
    } catch (error) {
      console.error("Error updating article:", error);
      alert("Failed to update article");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Content Moderation</h1>
          <Link href="/admin">
            <GlowButton variant="outline">Back to Admin</GlowButton>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading articles...</div>
        ) : articles.length === 0 ? (
          <GradientCard>
            <p className="text-center text-gray-400 py-8">No articles found.</p>
          </GradientCard>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <GradientCard key={article.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{article.title}</h3>
                    <p className="text-gray-400 mb-2 line-clamp-2">{article.excerpt}</p>
                    <div className="flex items-center gap-3">
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
                      <span className="text-sm text-gray-500">
                        by Coach {article.authorCoachId}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {article.status === "draft" && (
                      <GlowButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateStatus(article.id, "published")}
                      >
                        Approve
                      </GlowButton>
                    )}
                    {article.status === "published" && (
                      <GlowButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(article.id, "draft")}
                      >
                        Unpublish
                      </GlowButton>
                    )}
                    <Link href={`/article/${article.slug}`}>
                      <GlowButton variant="outline" size="sm">
                        View
                      </GlowButton>
                    </Link>
                  </div>
                </div>
              </GradientCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
