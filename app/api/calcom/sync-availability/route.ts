import { NextRequest, NextResponse } from "next/server";
import { getCoachData, updateCoachData } from "@/lib/firebase/firestore";
import { calcomClient } from "@/lib/calcom/client";
import { onAuthStateChanged } from "@/lib/firebase/auth";

/**
 * Sync coach availability with Cal.com
 * POST /api/calcom/sync-availability
 */
export async function POST(request: NextRequest) {
  try {
    const { coachId, availability } = await request.json();

    if (!coachId || !availability) {
      return NextResponse.json(
        { error: "Missing coachId or availability" },
        { status: 400 }
      );
    }

    // Get coach data
    const coach = await getCoachData(coachId);
    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    // Get or create Cal.com user
    const calcomUserId = await calcomClient.getOrCreateUser(
      coach.email || `${coach.userId}@coachify.app`,
      coach.displayName,
      `coach-${coach.userId.slice(0, 8)}`
    );

    // Convert availability format to Cal.com format
    const calcomAvailability = availability
      .filter((slot: any) => slot.isAvailable)
      .map((slot: any) => ({
        days: [slot.dayOfWeek],
        startTime: slot.startTime,
        endTime: slot.endTime,
      }));

    // Create or update schedule in Cal.com
    const schedule = await calcomClient.createOrUpdateSchedule(
      calcomUserId,
      `${coach.displayName}'s Schedule`,
      coach.timezone || "America/New_York",
      calcomAvailability
    );

    // Update coach data with Cal.com info
    await updateCoachData(coachId, {
      calcomUserId,
      calcomScheduleId: schedule.id,
      availabilitySlots: availability, // Keep local copy
    });

    return NextResponse.json({
      success: true,
      calcomUserId,
      scheduleId: schedule.id,
    });
  } catch (error: any) {
    console.error("Error syncing availability with Cal.com:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync availability" },
      { status: 500 }
    );
  }
}

