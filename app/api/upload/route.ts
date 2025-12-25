import { NextRequest, NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebase/admin";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";

/**
 * API route for uploading files to Firebase Storage
 * This bypasses CORS issues by handling uploads server-side
 */
export async function POST(request: NextRequest) {
  try {
    // Get the admin app
    const adminApp = getAdminApp();
    if (!adminApp) {
      return NextResponse.json(
        { error: "Firebase Admin not initialized" },
        { status: 500 }
      );
    }

    // Get the authorization token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const idToken = authHeader.replace("Bearer ", "");

    // Verify the token and get user ID
    let userId: string;
    try {
      const decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
      userId = decodedToken.uid;
    } catch (error: any) {
      console.error("Token verification failed:", error);
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const path = formData.get("path") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!path) {
      return NextResponse.json(
        { error: "No path provided" },
        { status: 400 }
      );
    }

    // Validate path - ensure user can only upload to their own directory
    // For coaches, path should start with "coaches/{userId}/"
    // For videos, path should start with "videos/{userId}/"
    // etc.
    const pathParts = path.split("/");
    if (pathParts.length < 2 || pathParts[1] !== userId) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid path" },
        { status: 403 }
      );
    }

    // Get Firebase Storage bucket
    const bucket = getStorage(adminApp).bucket();
    
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload file
    const fileRef = bucket.file(path);
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Determine if file should be public (intro videos, avatars, etc. are public)
    const isPublicFile = path.includes("intro-video") || 
                        path.includes("avatar") || 
                        path.includes("thumbnail") ||
                        path.includes("cover");
    
    if (isPublicFile) {
      // Make file publicly accessible
      await fileRef.makePublic();
      // Get public URL
      const downloadURL = `https://storage.googleapis.com/${bucket.name}/${path}`;
      return NextResponse.json({
        success: true,
        downloadURL,
        path,
      });
    } else {
      // For private files, generate a signed URL (valid for 1 year)
      const [downloadURL] = await fileRef.getSignedUrl({
        action: "read",
        expires: "03-09-2025", // 1 year from now
      });
      return NextResponse.json({
        success: true,
        downloadURL,
        path,
      });
    }
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}

