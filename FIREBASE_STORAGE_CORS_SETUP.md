# Firebase Storage CORS Configuration

This document explains how to configure CORS (Cross-Origin Resource Sharing) for Firebase Storage to allow uploads from your Vercel deployment.

## Problem

When uploading files directly from the browser to Firebase Storage, you may encounter CORS errors like:

```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' 
from origin 'https://coachify-ed.vercel.app' has been blocked by CORS policy
```

## Solution

We've implemented two solutions:

### Solution 1: API Route (Recommended - Already Implemented)

The app now uses a server-side API route (`/api/upload`) that handles uploads, bypassing CORS issues entirely. This is already implemented and should work immediately.

### Solution 2: Configure Firebase Storage CORS

If you want to allow direct client-side uploads (for better performance or other reasons), you need to configure CORS on Firebase Storage.

## Steps to Configure CORS

1. **Install Google Cloud SDK (gsutil)**

   ```bash
   # macOS
   brew install google-cloud-sdk

   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate with Google Cloud**

   ```bash
   gcloud auth login
   ```

3. **Set your project**

   ```bash
   gcloud config set project coachify-21435
   ```

4. **Apply CORS configuration**

   ```bash
   gsutil cors set firebase-storage-cors.json gs://coachify-21435.firebasestorage.app
   ```

5. **Verify CORS configuration**

   ```bash
   gsutil cors get gs://coachify-21435.firebasestorage.app
   ```

## CORS Configuration File

The `firebase-storage-cors.json` file includes:
- Vercel domains (`*.vercel.app`)
- Local development (`localhost:3000`)
- Required HTTP methods (GET, HEAD, PUT, POST, DELETE)
- Required headers (Content-Type, Authorization, x-goog-resumable)

## Adding New Domains

If you deploy to a new domain, update `firebase-storage-cors.json` and re-run the `gsutil cors set` command.

## Troubleshooting

- **Permission denied**: Make sure you're authenticated and have Storage Admin permissions
- **Bucket not found**: Verify the bucket name matches your Firebase project
- **CORS still not working**: Clear browser cache and try again
- **Still getting errors**: The API route fallback should handle uploads automatically

## Notes

- The API route solution (Solution 1) is recommended as it provides better security and error handling
- CORS configuration is optional but can improve upload performance for large files
- Both solutions can work together - the app will try the API route first, then fall back to direct uploads


