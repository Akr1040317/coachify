"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getArticles, getCoachData, type ArticleData } from "@/lib/firebase/firestore";
import { where } from "firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { BadgeVerified } from "@/components/ui/BadgeVerified";
import Link from "next/link";
import Image from "next/image";

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [article, setArticle] = useState<(ArticleData & { id: string }) | null>(null);
  const [coach, setCoach] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticle();
  }, [slug]);

  const loadArticle = async () => {
    setLoading(true);
    try {
      const articles = await getArticles([where("slug", "==", slug), where("status", "==", "published")]);
      if (articles.length > 0) {
        const articleData = articles[0];
        setArticle(articleData);
        
        const coachData = await getCoachData(articleData.authorCoachId);
        setCoach(coachData);
      }
    } catch (error) {
      console.error("Error loading article:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Article not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {article.coverImageUrl && (
          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-8">
            <Image
              src={article.coverImageUrl}
              alt={article.title}
              width={1200}
              height={675}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <GradientCard>
          <div className="flex items-center gap-3 mb-4">
            {coach && (
              <Link href={`/coach/${coach.userId}`} className="flex items-center gap-2 hover:text-blue-400">
                <span>{coach.displayName}</span>
                {coach.isVerified && <BadgeVerified />}
              </Link>
            )}
            <span className="text-gray-600">•</span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
              {article.sport}
            </span>
          </div>

          <h1 className="text-4xl font-bold mb-6">{article.title}</h1>

          <div className="flex flex-wrap gap-2 mb-6">
            {article.tags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>

          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: article.contentHtml }}
          />
        </GradientCard>
      </div>
    </div>
  );
}



