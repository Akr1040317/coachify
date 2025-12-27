import { NextRequest, NextResponse } from "next/server";
import { createBooking, getBookings } from "@/lib/firebase/firestore";
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

    // Get coach to get free intro duration
    const { getCoachData } = await import("@/lib/firebase/firestore");
    const coach = await getCoachData(coachId);
    
    if (!coach || !coach.sessionOffers?.freeIntroEnabled) {
      return NextResponse.json({ error: "Free intro not available" }, { status: 400 });
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
      timeZone: timeZone || coach.timezone || coach.timeZone || "America/New_York",
      bufferMinutes: bufferMinutes || 0,
    });

    return NextResponse.json({ bookingId });
  } catch (error: any) {
    console.error("Error creating free intro booking:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

