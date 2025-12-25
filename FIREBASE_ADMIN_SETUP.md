# Firebase Admin SDK Setup

## Why This Is Needed

Server-side API routes need to use Firebase Admin SDK instead of the client SDK because:
- Client SDK is subject to Firestore security rules
- Server-side code doesn't have user authentication context
- Admin SDK bypasses security rules (use carefully!)

## Step 1: Install Firebase Admin SDK

Run this command locally:

```bash
npm install firebase-admin
```

## Step 2: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **coachify-21435**
3. Go to **Project Settings** (gear icon)
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the JSON file (keep it secure!)

## Step 3: Add to Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **coachify**
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name**: `FIREBASE_SERVICE_ACCOUNT_KEY`
   - **Value**: Paste the entire contents of the JSON file you downloaded
   - **Environment**: Production (and Preview if needed)
   - Click **Save**

**Important**: The value should be the entire JSON object as a string, like:
```json
{"type":"service_account","project_id":"coachify-21435",...}
```

## Step 4: Redeploy

After adding the environment variable:
1. Go to **Deployments** tab
2. Click **⋯** on latest deployment
3. Click **Redeploy**

## Alternative: Local Development

For local development, you can either:

**Option A**: Set the environment variable in `.env.local`:
```env
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

**Option B**: Use a service account file:
1. Download the service account JSON
2. Save it as `serviceAccountKey.json` in your project root (add to `.gitignore`!)
3. Set environment variable:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="./serviceAccountKey.json"
```

## Security Notes

⚠️ **Important**:
- Never commit the service account key to git
- Add `serviceAccountKey.json` to `.gitignore` if using Option B
- The Admin SDK bypasses all security rules - use only in trusted server-side code
- Only use Admin SDK functions in API routes, never in client components

## Verification

After setup, the API routes (`/api/coaches/stripe-connect/setup` and `/api/coaches/stripe-connect/onboarding`) should work without "Missing or insufficient permissions" errors.
