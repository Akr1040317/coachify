import { NextRequest, NextResponse } from "next/server";

/**
 * Initiate Google Calendar OAuth flow
 * GET /api/google-calendar/auth
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const coachId = searchParams.get("coachId");
  const redirectUri = searchParams.get("redirectUri") || `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/app/coach/availability`;

  if (!coachId) {
    return NextResponse.json({ error: "Missing coachId" }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  if (!clientId) {
    return NextResponse.json(
      { error: "Google OAuth not configured. Please set GOOGLE_CLIENT_ID in environment variables." },
      { status: 500 }
    );
  }

  // Google OAuth 2.0 authorization URL
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", `${baseUrl}/api/google-calendar/callback`);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent"); // Force consent to get refresh token
  authUrl.searchParams.set("state", JSON.stringify({ coachId, redirectUri }));

  return NextResponse.json({ authUrl: authUrl.toString() });
}

