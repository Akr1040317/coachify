# Firestore Security Rules Setup

## Important: Deploy Firestore Rules

The `firestore.rules` file contains the security rules for your Firestore database. **You must deploy these rules to Firebase for the app to work properly.**

## How to Deploy Rules

### Option 1: Using Firebase CLI (Recommended)

1. Install Firebase CLI if you haven't already:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in your project (if not already done):
```bash
firebase init firestore
```

4. Deploy the rules:
```bash
firebase deploy --only firestore:rules
```

### Option 2: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `coachify-21435`
3. Navigate to **Firestore Database** > **Rules** tab
4. Copy the contents of `firestore.rules` file
5. Paste into the rules editor
6. Click **Publish**

## What These Rules Do

- **Users**: Users can read/write their own user data
- **Students**: Students can manage their own data; coaches can read student data
- **Coaches**: Public read access for active coaches; coaches can manage their own data
- **Courses**: Public read access for published courses; coaches can manage their own courses
- **Videos**: Public read access for public videos; coaches can manage their own videos
- **Articles**: Public read access for published articles; coaches can manage their own articles
- **Bookings**: Students and coaches can read/manage their own bookings
- **Purchases**: Users can read their own purchases
- **Enrollments**: Users can read/manage their own enrollments
- **Reviews**: Public read access; students can create reviews

## Testing Rules

After deploying, test your rules using the Firebase Console Rules Playground or by testing the app functionality.

## Troubleshooting

If you see "Missing or insufficient permissions" errors:

1. Verify rules are deployed: Check Firebase Console > Firestore > Rules
2. Check that the user is authenticated
3. Verify the user document exists in the `users` collection
4. Check browser console for specific error details

