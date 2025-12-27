# How to Delete Google Cloud Project

If you created a Google Cloud project and want to delete it, follow these steps:

## Option 1: Delete via Google Cloud Console (Recommended)

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Make sure you're logged in with the correct account

2. **Select the Project**
   - Click the project dropdown at the top of the page
   - Select your project (likely named "coachify" or similar)

3. **Open Project Settings**
   - Click the hamburger menu (☰) in the top left
   - Go to **IAM & Admin** > **Settings** (or just search for "Settings")

4. **Delete the Project**
   - Scroll down to find the **Delete Project** section
   - Click **Delete Project**
   - Type the project ID to confirm (e.g., `coachify-21435`)
   - Click **Shut down**

**Note**: Project deletion can take up to 30 days. During this time, you can restore it if needed.

## Option 2: Delete via gcloud CLI

If you have gcloud CLI installed:

```bash
# Set the project
gcloud config set project YOUR_PROJECT_ID

# Delete the project
gcloud projects delete YOUR_PROJECT_ID
```

## Important Notes

⚠️ **Warning**: 
- Deleting the Google Cloud project will **NOT** delete your Firebase project
- Firebase projects are separate from Google Cloud projects
- Your Firebase data (Firestore, Storage, Auth) will remain intact
- You can continue using Firebase Auth without a Google Cloud project

## What Happens After Deletion?

- ✅ Your Firebase project continues to work normally
- ✅ Firebase Auth (Google sign-in) continues to work
- ✅ All your Firebase data remains intact
- ❌ You won't be able to use Google Cloud services (if you were using any)
- ❌ Any Google Cloud APIs you enabled will be disabled

## Current Setup

Your codebase uses **Firebase Auth** for Google sign-in, which does NOT require a separate Google Cloud project. Firebase Auth handles Google OAuth internally, so you don't need to configure Google Cloud OAuth credentials.

The only Google Cloud references in your code are:
- Firebase Admin SDK packages (needed for server-side Firebase operations)
- These are standard Firebase dependencies and don't require a Google Cloud project

