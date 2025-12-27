# Firebase Domain Authorization Setup

## Issue
Your production domain `coachify-ed.vercel.app` is not authorized in Firebase, causing authentication errors.

## Solution: Add Domain to Firebase Authorized Domains

### Step-by-Step Instructions:

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Select your project

2. **Navigate to Authentication Settings**
   - Click on **Authentication** in the left sidebar
   - Click on the **Settings** tab (gear icon)
   - Scroll down to **Authorized domains**

3. **Add Your Production Domain**
   - Click **Add domain**
   - Enter: `coachify-ed.vercel.app`
   - Click **Add**

4. **Verify Domain is Added**
   - You should see `coachify-ed.vercel.app` in the list of authorized domains
   - The list should include:
     - `localhost` (for local development)
     - `coachify-ed.vercel.app` (your production domain)
     - Any other domains you use

5. **Test Authentication**
   - After adding the domain, wait a few minutes for changes to propagate
   - Try signing in again at: https://coachify-ed.vercel.app/auth?mode=signin
   - The error should be resolved

## Important Notes

- **Local Development**: Make sure `localhost` is also in the authorized domains list
- **Custom Domain**: If you have a custom domain (e.g., `coachify.com`), add that as well
- **Propagation Time**: Changes may take 1-5 minutes to take effect
- **No Code Changes Needed**: This is a Firebase Console configuration only

## Additional Domains to Consider

If you have multiple environments, add all of them:
- `localhost` (already included by default)
- `coachify-ed.vercel.app` (your current Vercel deployment)
- Any custom domains you configure
- Preview deployment domains (if you want to test on preview URLs)



