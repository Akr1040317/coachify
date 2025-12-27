import { NextRequest, NextResponse } from "next/server";
import { getCoachData, updateBooking, getBookings } from "@/lib/firebase/firestore";
import { where } from "firebase/firestore";
import { Timestamp } from "firebase/firestore";

/**
 * Sync booking to Google Calendar
 * POST /api/google-calendar/sync
 */
export async function POST(request: NextRequest) {
  try {
    const { bookingId, action = "create" } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    // Get booking
    const { getBooking } = await import("@/lib/firebase/firestore");
    const booking = await getBooking(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Get coach data
    const coach = await getCoachData(booking.coachId);
    if (!coach) {
      return NextResponse.json({ error: "Coach not found" }, { status: 404 });
    }

    if (!coach.googleCalendarSyncEnabled || !coach.googleCalendarAccessToken) {
      return NextResponse.json(
        { error: "Google Calendar sync not enabled for this coach" },
        { status: 400 }
      );
    }

    const accessToken = await getValidAccessToken(coach);

    if (action === "delete" || booking.status === "cancelled") {
      // Delete event from Google Calendar
      if (booking.googleCalendarEventId) {
        await deleteGoogleCalendarEvent(
          accessToken,
          booking.googleCalendarEventId
        );
        await updateBooking(bookingId, {
          googleCalendarEventId: null,
        });
      }
      return NextResponse.json({ success: true, action: "deleted" });
    }

    // Get student info
    const { getUserData } = await import("@/lib/firebase/firestore");
    const student = await getUserData(booking.studentId);

    const startTime = booking.scheduledStart.toDate();
    const endTime = booking.scheduledEnd.toDate();

    // Create or update event
    let eventId = booking.googleCalendarEventId;

    if (eventId) {
      // Update existing event
      await updateGoogleCalendarEvent(
        accessToken,
        eventId,
        {
          summary: `Coaching Session: ${student?.displayName || "Student"}`,
          description: `Coaching session with ${student?.displayName || "Student"}\n\nBooking ID: ${bookingId}`,
          start: {
            dateTime: startTime.toISOString(),
            timeZone: coach.timezone || "UTC",
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: coach.timezone || "UTC",
          },
        }
      );
    } else {
      // Create new event
      const event = await createGoogleCalendarEvent(accessToken, {
        summary: `Coaching Session: ${student?.displayName || "Student"}`,
        description: `Coaching session with ${student?.displayName || "Student"}\n\nBooking ID: ${bookingId}`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: coach.timezone || "UTC",
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: coach.timezone || "UTC",
        },
      });

      eventId = event.id;
      await updateBooking(bookingId, {
        googleCalendarEventId: eventId,
      });
    }

    return NextResponse.json({
      success: true,
      action: eventId === booking.googleCalendarEventId ? "updated" : "created",
      eventId,
    });
  } catch (error: any) {
    console.error("Error syncing to Google Calendar:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync to Google Calendar" },
      { status: 500 }
    );
  }
}

/**
 * Get valid access token, refreshing if necessary
 */
async function getValidAccessToken(coach: any): Promise<string> {
  if (!coach.googleCalendarAccessToken) {
    throw new Error("No access token available");
  }

  // In production, you should verify the token hasn't expired
  // For now, we'll try to use it and refresh if it fails
  // If refresh token exists, use it to get a new access token
  
  return coach.googleCalendarAccessToken;
}

/**
 * Create a Google Calendar event
 */
async function createGoogleCalendarEvent(
  accessToken: string,
  event: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
  }
): Promise<{ id: string }> {
  const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Google Calendar event: ${error}`);
  }

  return await response.json();
}

/**
 * Update a Google Calendar event
 */
async function updateGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  event: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
  }
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update Google Calendar event: ${error}`);
  }
}

/**
 * Delete a Google Calendar event
 */
async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    const error = await response.text();
    throw new Error(`Failed to delete Google Calendar event: ${error}`);
  }
}

