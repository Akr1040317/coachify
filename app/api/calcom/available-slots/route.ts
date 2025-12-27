import { NextRequest, NextResponse } from "next/server";
import { getCoachData } from "@/lib/firebase/firestore";
import { calcomClient } from "@/lib/calcom/client";

/**
 * Get available time slots from Cal.com
 * GET /api/calcom/available-slots?coachId=xxx&eventTypeId=xxx&dateFrom=xxx&dateTo=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const coachId = searchParams.get("coachId");
    const eventTypeId = searchParams.get("eventTypeId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (!coachId || !eventTypeId || !dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get coach data to verify
    const coach = await getCoachData(coachId);
    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    // Get available slots from Cal.com
    const slots = await calcomClient.getAvailableSlots(
      parseInt(eventTypeId),
      dateFrom,
      dateTo,
      coach.timeZone || "America/New_York"
    );

    return NextResponse.json({ slots });
  } catch (error: any) {
    console.error("Error getting available slots:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get available slots" },
      { status: 500 }
    );
  }
}

