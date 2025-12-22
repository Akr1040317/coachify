import { NextRequest, NextResponse } from "next/server";
import { getUserData } from "@/lib/firebase/firestore";

// This endpoint reuses the cron job logic
// Import the payout processing function
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from token (you'll need to implement proper auth)
    // For now, we'll check if user is admin via query param or header
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const userData = await getUserData(userId);
    if (!userData || userData.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Call the cron job logic
    const cronResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/cron/payouts`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${process.env.CRON_SECRET || ""}`,
      },
    });

    const result = await cronResponse.json();
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Error manually processing payouts:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

