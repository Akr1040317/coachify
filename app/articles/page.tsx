"use client";

import { useState, useEffect } from "react";
import { getArticles, getCoachData, type ArticleData } from "@/lib/firebase/firestore";
import { where, orderBy } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SPORTS } from "@/lib/constants/sports";
import Link from "next/link";
import Image from "next/image";

export default function ArticlesPage() {
  const [articles, setArticles] = useState<(ArticleData & { id: string; coachName?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const constraints: any[] = [
        where("status", "==", "published"),
        orderBy("publishedAt", "desc"),
      ];
      
      if (filter) {
        constraints.push(where("sport", "==", filter));
      }

      const articlesData = await getArticles(constraints);
      
      // Load coach names
      const articlesWithCoaches = await Promise.all(
        articlesData.map(async (article) => {
          const coach = await getCoachData(article.authorCoachId);
          return { ...article, coachName: coach?.displayName || "Unknown Coach" };
        })
      );

      setArticles(articlesWithCoaches);
    } catch (error) {
      console.error("Error loading articles:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      
      {/* Background decorative elements */}
      <div className="absolute inset-0 gradient-mesh opacity-30" />
      <div className="absolute top-40 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      
      <div className="relative z-10 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
              Expert Articles & Insights
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Learn from our coaches&apos; expertise and stay updated with the latest tips and strategies
            </p>
          </div>

          <div className="mb-6">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-[var(--card)] border border-gray-600 rounded-lg text-white"
            >
              <option value="">All Sports</option>
              {SPORTS.map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading articles...</div>
          ) : articles.length === 0 ? (
            <GradientCard>
              <p className="text-center text-gray-400">No articles found.</p>
            </GradientCard>
          ) : (
            <div className="space-y-6">
              {articles.map((article) => (
                <Link key={article.id} href={`/article/${article.slug}`}>
                  <GradientCard className="cursor-pointer hover:scale-105 transition-transform">
                    <div className="flex gap-6">
                      {article.coverImageUrl && (
                        <div className="w-48 h-32 bg-black rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={article.coverImageUrl}
                            alt={article.title}
                            width={192}
                            height={128}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-400">{article.coachName}</span>
                          <span className="text-gray-600">•</span>
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                            {article.sport}
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{article.title}</h2>
                        <p className="text-gray-400 line-clamp-2">{article.excerpt}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {article.tags.slice(0, 3).map((tag, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
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
      
      <Footer />
    </div>
  );
}



