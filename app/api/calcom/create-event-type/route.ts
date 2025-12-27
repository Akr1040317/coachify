import { NextRequest, NextResponse } from "next/server";
import { getCoachData, updateCoachData } from "@/lib/firebase/firestore";
import { calcomClient } from "@/lib/calcom/client";

/**
 * Create or update event types in Cal.com for coach offerings
 * POST /api/calcom/create-event-type
 */
export async function POST(request: NextRequest) {
  try {
    const { coachId, offering } = await request.json();

    if (!coachId || !offering) {
      return NextResponse.json(
        { error: "Missing coachId or offering" },
        { status: 400 }
      );
    }

    // Get coach data
    const coach = await getCoachData(coachId);
    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    if (!coach.calcomUserId) {
      return NextResponse.json(
        { error: "Coach not synced with Cal.com. Please sync availability first." },
        { status: 400 }
      );
    }

    // Create or update event type
    let eventType;
    if (offering.calcomEventTypeId) {
      // Update existing event type
      eventType = await calcomClient.updateEventType(offering.calcomEventTypeId, {
        title: offering.name,
        length: offering.durationMinutes,
        price: offering.isFree ? undefined : offering.priceCents / 100,
        description: offering.description,
      });
    } else {
      // Create new event type
      eventType = await calcomClient.createEventType(
        coach.calcomUserId,
        offering.name,
        offering.durationMinutes,
        offering.isFree ? undefined : offering.priceCents / 100,
        offering.currency || "USD",
        offering.description
      );
    }

    // Update offering with Cal.com event type ID
    const updatedOfferings = (coach.customOfferings || []).map((o: any) =>
      o.id === offering.id
        ? { ...o, calcomEventTypeId: eventType.id }
        : o
    );

    await updateCoachData(coachId, {
      customOfferings: updatedOfferings,
    });

    return NextResponse.json({
      success: true,
      eventTypeId: eventType.id,
      eventType,
    });
  } catch (error: any) {
    console.error("Error creating Cal.com event type:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create event type" },
      { status: 500 }
    );
  }
}


