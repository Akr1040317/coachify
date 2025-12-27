# Firebase Authentication Setup Guide

This guide will help you configure Firebase Authentication for Google Sign-In to work properly with your Coachify application.

## Prerequisites

- Firebase project created (project ID: `coachify-21435`)
- Google Cloud Console access
- Your production domain (e.g., Vercel deployment URL)

## Step 1: Configure Authorized Domains in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`coachify-21435`)
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Add the following domains:
   - ✅ `localhost` (for local development)
   - ✅ Your Vercel domain (e.g., `your-app.vercel.app`)
   - ✅ Your custom domain (e.g., `hivespelling.com`, `www.hivespelling.com`)
   - ✅ `coachify-21435.firebaseapp.com` (Firebase default domain)
   - ✅ `coachify-21435.web.app` (Firebase default domain)

**Important**: Without these domains added, Google Sign-In will authenticate but Firebase won't complete the redirect back to your app, causing it to hang on the auth handler page.

## Step 2: Configure Google Cloud Console OAuth Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one linked to Firebase)
3. Navigate to **APIs & Services** → **Credentials**
4. Find your **OAuth 2.0 Client ID** (the one used for web applications)
5. Click **Edit** on the OAuth client

### Authorized JavaScript Origins

Add the following origins (one per line):
```
https://your-app.vercel.app
https://www.your-app.vercel.app
https://hivespelling.com
https://www.hivespelling.com
http://localhost:3000
http://localhost:3001
```

### Authorized Redirect URIs

Add the following redirect URIs (one per line):
```
https://coachify-21435.firebaseapp.com/__/auth/handler
https://coachify-21435.web.app/__/auth/handler
```

**Note**: Firebase uses these handler URLs to complete the OAuth flow. Both `firebaseapp.com` and `web.app` domains should be included.

## Step 3: Verify Firebase Configuration

Your Firebase config is already set in `lib/firebase/config.ts`:

```typescript
authDomain: "coachify-21435.firebaseapp.com"
```

Make sure this matches your Firebase project's auth domain.

## Step 4: Deploy Firestore Security Rules

After updating `firestore.rules`, deploy them to Firebase:

```bash
# Using Firebase CLI
firebase deploy --only firestore:rules
```

Or manually:
1. Go to Firebase Console → Firestore Database → Rules
2. Copy the contents of `firestore.rules`
3. Click **Publish**

## Troubleshooting

### Issue: Google Sign-In hangs on `__/auth/handler` page

**Possible causes:**
1. ❌ Domain not in Authorized domains list
   - **Fix**: Add your domain to Firebase Console → Authentication → Settings → Authorized domains

2. ❌ Missing redirect URI in Google Cloud Console
   - **Fix**: Add both Firebase handler URLs to Authorized redirect URIs

3. ❌ Third-party cookies blocked (Safari, strict privacy settings)
   - **Fix**: Use popup flow (already implemented) or ask users to allow third-party cookies

4. ❌ `getRedirectResult()` not being called
   - **Fix**: Already handled in `app/auth/page.tsx` - ensure it's called on page load

### Issue: "Missing or insufficient permissions" error

**Possible causes:**
1. ❌ Firestore rules not deployed
   - **Fix**: Deploy updated `firestore.rules` to Firebase Console

2. ❌ User not authenticated when accessing protected data
   - **Fix**: Ensure user is signed in before accessing user-specific data

### Issue: Popup blocked warnings

**Solution**: The app automatically falls back to redirect flow when popup is blocked. This is expected behavior.

### Issue: Cross-Origin-Opener-Policy warnings

**Solution**: These are harmless warnings related to popup windows. They're automatically suppressed in production via `ConsoleWarningFilter`.

## Testing Checklist

After setup, test the following:

- [ ] Google Sign-In with popup works on desktop browsers
- [ ] Google Sign-In falls back to redirect when popup is blocked
- [ ] Sign-in completes without hanging on auth handler page
- [ ] User is redirected to correct page after sign-in
- [ ] Coach profile pages load without permission errors
- [ ] Console warnings are suppressed in production

## Additional Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Google OAuth Setup Guide](https://developers.google.com/identity/protocols/oauth2)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

## Quick Reference

### Firebase Project Details
- **Project ID**: `coachify-21435`
- **Auth Domain**: `coachify-21435.firebaseapp.com`
- **Web App Domain**: `coachify-21435.web.app`

### Required Authorized Domains
- `localhost` (development)
- Your Vercel domain
- Your custom domain (if applicable)
- `coachify-21435.firebaseapp.com`
- `coachify-21435.web.app`

### Required Redirect URIs
- `https://coachify-21435.firebaseapp.com/__/auth/handler`
- `https://coachify-21435.web.app/__/auth/handler`

