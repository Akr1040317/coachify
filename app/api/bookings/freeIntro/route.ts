import { NextRequest, NextResponse } from "next/server";
import { createBooking, getBookings } from "@/lib/firebase/firestore";
import { getCoachDataAdmin } from "@/lib/firebase/firestore-admin";
import { where, Timestamp } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const { coachId, scheduledStart, scheduledEnd, studentId, timeZone, bufferMinutes } = await request.json();

    // Check rate limit: one free intro per student per coach every 30 days
    const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const existingBookings = await getBookings([
      where("studentId", "==", studentId),
      where("coachId", "==", coachId),
      where("type", "==", "free_intro"),
      where("createdAt", ">=", thirtyDaysAgo),
    ]);

    if (existingBookings.length > 0) {
      return NextResponse.json(
        { error: "You can only book one free intro per coach every 30 days" },
        { status: 400 }
      );
    }

    // Get coach to get free intro duration (use admin SDK to bypass security rules)
    const coach = await getCoachDataAdmin(coachId);
    
    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }
    
    if (!coach.sessionOffers?.freeIntroEnabled) {
      return NextResponse.json({ error: "Free intro not available for this coach" }, { status: 400 });
    }

    const startTime = Timestamp.fromDate(new Date(scheduledStart));
    const endTime = scheduledEnd 
      ? Timestamp.fromDate(new Date(scheduledEnd))
      : Timestamp.fromDate(
          new Date(startTime.toDate().getTime() + coach.sessionOffers.freeIntroMinutes * 60 * 1000)
        );

    const bookingId = await createBooking({
      studentId,
      coachId,
      type: "free_intro",
      sessionMinutes: coach.sessionOffers.freeIntroMinutes,
      priceCents: 0,
      currency: "USD",
      status: "confirmed",
      scheduledStart: startTime,
      scheduledEnd: endTime,
      timeZone: timeZone || coach.timezone || "America/New_York",
      bufferMinutes: bufferMinutes || 0,
    });

    // Sync booking to Google Calendar if enabled
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      await fetch(`${baseUrl}/api/google-calendar/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action: "create" }),
      });
    } catch (error) {
      console.error("Error syncing booking to Google Calendar:", error);
      // Don't fail the booking if Google Calendar sync fails
    }

    return NextResponse.json({ bookingId });
  } catch (error: any) {
    console.error("Error creating free intro booking:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

