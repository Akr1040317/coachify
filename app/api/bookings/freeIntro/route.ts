import { NextRequest, NextResponse } from "next/server";
import { createBooking, getBookings } from "@/lib/firebase/firestore";
import { getCoachDataAdmin } from "@/lib/firebase/firestore-admin";
import { where, Timestamp } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body. Expected JSON." },
        { status: 400 }
      );
    }

    const { coachId, scheduledStart, scheduledEnd, studentId, timeZone, bufferMinutes } = body;

    // Validate required fields
    if (!coachId || !scheduledStart || !studentId) {
      return NextResponse.json(
        { error: "Missing required fields: coachId, scheduledStart, and studentId are required" },
        { status: 400 }
      );
    }

    // Validate scheduledStart is a valid date
    const startDate = new Date(scheduledStart);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid scheduledStart date format" },
        { status: 400 }
      );
    }

    // Validate scheduledStart is in the future
    if (startDate.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: "Scheduled start time must be in the future" },
        { status: 400 }
      );
    }

    // Validate scheduledEnd if provided
    if (scheduledEnd) {
      const endDate = new Date(scheduledEnd);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid scheduledEnd date format" },
          { status: 400 }
        );
      }
      if (endDate.getTime() <= startDate.getTime()) {
        return NextResponse.json(
          { error: "Scheduled end time must be after start time" },
          { status: 400 }
        );
      }
    }

    // Check rate limit: one free intro per student per coach every 30 days
    try {
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
    } catch (rateLimitError: any) {
      console.error("Error checking rate limit:", rateLimitError);
      // Continue if rate limit check fails (don't block booking)
    }

    // Get coach to get free intro duration (use admin SDK to bypass security rules)
    let coach;
    try {
      coach = await getCoachDataAdmin(coachId);
    } catch (coachError: any) {
      console.error("Error fetching coach data:", coachError);
      return NextResponse.json(
        { error: "Failed to fetch coach information" },
        { status: 500 }
      );
    }
    
    if (!coach) {
      return NextResponse.json(
        { error: "Coach not found" },
        { status: 404 }
      );
    }
    
    if (!coach.sessionOffers?.freeIntroEnabled) {
      return NextResponse.json(
        { error: "Free intro not available for this coach" },
        { status: 400 }
      );
    }

    // Validate freeIntroMinutes exists
    if (!coach.sessionOffers.freeIntroMinutes || coach.sessionOffers.freeIntroMinutes <= 0) {
      return NextResponse.json(
        { error: "Invalid free intro duration configuration" },
        { status: 500 }
      );
    }

    // Create timestamps
    let startTime: Timestamp;
    let endTime: Timestamp;
    
    try {
      startTime = Timestamp.fromDate(startDate);
      endTime = scheduledEnd 
        ? Timestamp.fromDate(new Date(scheduledEnd))
        : Timestamp.fromDate(
            new Date(startTime.toDate().getTime() + coach.sessionOffers.freeIntroMinutes * 60 * 1000)
          );
    } catch (timestampError: any) {
      console.error("Error creating timestamps:", timestampError);
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    // Create booking
    let bookingId: string;
    try {
      bookingId = await createBooking({
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
    } catch (bookingError: any) {
      console.error("Error creating booking:", bookingError);
      
      // Provide specific error messages for common issues
      if (bookingError.code === "permission-denied" || bookingError.code === "permissions-denied") {
        return NextResponse.json(
          { error: "Permission denied. Please ensure you are signed in." },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: bookingError.message || "Failed to create booking" },
        { status: 500 }
      );
    }

    // Sync booking to Google Calendar if enabled (non-blocking)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      await fetch(`${baseUrl}/api/google-calendar/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action: "create" }),
      });
    } catch (calendarError) {
      console.error("Error syncing booking to Google Calendar:", calendarError);
      // Don't fail the booking if Google Calendar sync fails
    }

    return NextResponse.json({ bookingId });
  } catch (error: any) {
    console.error("Unexpected error creating free intro booking:", error);
    
    // Handle specific error types
    if (error.name === "SyntaxError" || error.message?.includes("JSON")) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

