import { NextRequest, NextResponse } from "next/server";
import { getCoachData, getUserData, createBooking } from "@/lib/firebase/firestore";
import { calcomClient } from "@/lib/calcom/client";

/**
 * Create a booking in Cal.com (pending payment)
 * POST /api/calcom/create-booking
 */
export async function POST(request: NextRequest) {
  try {
    const {
      coachId,
      eventTypeId,
      startTime,
      endTime,
      userId,
      offeringId,
      durationMinutes,
    } = await request.json();

    if (!coachId || !eventTypeId || !startTime || !endTime || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user and coach data
    const [user, coach] = await Promise.all([
      getUserData(userId),
      getCoachData(coachId),
    ]);

    if (!user || !coach) {
      return NextResponse.json(
        { error: "User or coach not found" },
        { status: 404 }
      );
    }

    if (!coach.calcomUserId) {
      return NextResponse.json(
        { error: "Coach not synced with Cal.com" },
        { status: 400 }
      );
    }

    // Create booking in Cal.com (status will be PENDING until payment)
    const calcomBooking = await calcomClient.createBooking(
      parseInt(eventTypeId),
      startTime,
      endTime,
      user.email || `${userId}@coachify.app`,
      user.displayName || "Student",
      (user as any).timeZone || (user as any).timezone || "America/New_York",
      {
        coachId,
        userId,
        offeringId,
        durationMinutes,
        platform: "coachify",
      }
    );

    // Create booking record in Firestore (status: requested, pending payment)
    const bookingData = {
      coachId,
      studentId: userId,
      scheduledStart: new Date(startTime),
      scheduledEnd: new Date(endTime),
      durationMinutes: durationMinutes || 30,
      status: "requested" as const,
      calcomBookingId: calcomBooking.id,
      calcomBookingUid: calcomBooking.uid,
      customOfferingId: offeringId,
      paymentStatus: "pending" as const,
    };

    const bookingId = await createBooking(bookingData);

    return NextResponse.json({
      success: true,
      bookingId,
      calcomBookingId: calcomBooking.id,
      calcomBookingUid: calcomBooking.uid,
      status: "pending_payment",
    });
  } catch (error: any) {
    console.error("Error creating Cal.com booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}

