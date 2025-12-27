"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getVideo, getCoachData } from "@/lib/firebase/firestore";
import { GradientCard } from "@/components/ui/GradientCard";
import { BadgeVerified } from "@/components/ui/BadgeVerified";
import Link from "next/link";

export default function VideoPage() {
  const params = useParams();
  const videoId = params.videoId as string;
  const [video, setVideo] = useState<any>(null);
  const [coach, setCoach] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideo();
  }, [videoId]);

  const loadVideo = async () => {
    setLoading(true);
    try {
      const videoData = await getVideo(videoId);
      if (videoData) {
        setVideo(videoData);
        const coachData = await getCoachData(videoData.coachId);
        setCoach(coachData);
      }
    } catch (error) {
      console.error("Error loading video:", error);
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

  if (!video) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-gray-400">Video not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-8">
      <div className="max-w-4xl mx-auto">
        <GradientCard>
          <div className="aspect-video bg-black rounded-lg overflow-hidden mb-6">
            <video src={video.videoUrl} controls className="w-full h-full" />
          </div>
          <h1 className="text-3xl font-bold mb-4">{video.title}</h1>
          {coach && (
            <div className="flex items-center gap-3 mb-4">
              <Link href={`/coach/${coach.userId}`} className="flex items-center gap-2 hover:text-blue-400">
                <span>{coach.displayName}</span>
                {coach.isVerified && <BadgeVerified />}
              </Link>
            </div>
          )}
          <p className="text-gray-300 whitespace-pre-line mb-4">{video.description}</p>
          <div className="flex flex-wrap gap-2">
            {video.tags.map((tag: string, i: number) => (
              <span
                key={i}
                className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </GradientCard>
      </div>
    </div>
  );
}

