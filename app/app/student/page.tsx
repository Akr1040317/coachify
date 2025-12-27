"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function StudentPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard by default
    router.replace("/app/student/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="text-gray-400">Redirecting...</div>
    </div>
  );
}

