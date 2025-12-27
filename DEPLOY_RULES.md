# Deploy Firestore Rules - Quick Guide

## Option 1: Firebase Console (Easiest - Recommended)

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/
   - Select your project: **coachify-21435**

2. **Navigate to Firestore Rules:**
   - Click on **Firestore Database** in the left sidebar
   - Click on the **Rules** tab

3. **Copy and Paste Rules:**
   - Open the `firestore.rules` file in this project
   - Copy ALL the contents
   - Paste into the Firebase Console Rules editor

4. **Publish:**
   - Click the **Publish** button
   - Wait for confirmation that rules are deployed

## Option 2: Firebase CLI

1. **Login to Firebase:**
   ```bash
   firebase login
   ```

2. **Set the project:**
   ```bash
   firebase use coachify-21435
   ```

3. **Deploy the rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

## Verify Deployment

After deploying, you should see:
- ✅ No more "Missing or insufficient permissions" errors
- ✅ Users can sign up and create accounts
- ✅ Navbar shows Dashboard button for authenticated users

## Troubleshooting

If you still see permission errors:
1. Wait 1-2 minutes for rules to propagate
2. Refresh your browser
3. Check Firebase Console > Firestore > Rules to confirm they're published
4. Verify the rules match the `firestore.rules` file exactly

