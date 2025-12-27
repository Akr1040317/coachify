import { NextRequest, NextResponse } from "next/server";
import { getCoachData, updateCoachData } from "@/lib/firebase/firestore";

/**
 * Handle Google OAuth callback and store tokens
 * GET /api/google-calendar/callback
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(new URL("/app/coach/availability?error=no_code", request.url));
  }

  let stateData;
  try {
    stateData = state ? JSON.parse(state) : {};
  } catch {
    return NextResponse.redirect(new URL("/app/coach/availability?error=invalid_state", request.url));
  }

  const { coachId, redirectUri } = stateData;
  
  if (!coachId) {
    return NextResponse.redirect(new URL("/app/coach/availability?error=no_coach_id", request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/app/coach/availability?error=not_configured", request.url));
  }

  try {
    // Exchange authorization code for access token and refresh token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${baseUrl}/api/google-calendar/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Google OAuth token error:", error);
      return NextResponse.redirect(new URL("/app/coach/availability?error=token_failed", request.url));
    }

    const tokens = await tokenResponse.json();

    // Store tokens in coach document (in production, encrypt these)
    await updateCoachData(coachId, {
      googleCalendarAccessToken: tokens.access_token,
      googleCalendarRefreshToken: tokens.refresh_token,
      googleCalendarSyncEnabled: true,
    });

    const redirect = redirectUri || "/app/coach/availability";
    return NextResponse.redirect(new URL(`${redirect}?success=google_calendar_connected`, request.url));
  } catch (error: any) {
    console.error("Error handling Google OAuth callback:", error);
    return NextResponse.redirect(new URL("/app/coach/availability?error=oauth_failed", request.url));
  }
}

