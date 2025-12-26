# Coachify Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Stripe Configuration (Required for payments)
# These are SECRET keys - never commit these to git!
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Note**: Firebase configuration is hardcoded in `lib/firebase/config.ts`. Firebase client config values (apiKey, projectId, etc.) are safe to expose publicly - security is handled by Firebase Security Rules and domain restrictions in the Firebase Console.

## Stripe Setup

1. Create a Stripe account at https://stripe.com
2. **Switch to Test Mode** (for testing - toggle in top right of Stripe Dashboard)
3. Get your API keys from the Stripe Dashboard:
   - Go to Developers > API keys
   - Copy the **test** keys (start with `pk_test_` and `sk_test_`)
4. Set up webhooks:
   - **For local testing**: Use Stripe CLI (see [TESTING_GUIDE.md](./TESTING_GUIDE.md))
   - **For production**: Go to Stripe Dashboard > Developers > Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`, `transfer.updated`, `account.updated`
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

**📖 For complete testing instructions, see [TESTING_GUIDE.md](./TESTING_GUIDE.md)**

## Firebase Setup

1. The Firebase config is already set up in `lib/firebase/config.ts`
2. Make sure your Firestore security rules allow:
   - Public read access to published coaches, courses, articles
   - User write access to their own data
   - Admin access for admin role

3. Set up Firestore indexes for:
   - `coaches` collection: `status`, `isVerified`, `sports` (array-contains)
   - `courses` collection: `isPublished`, `sport`, `skillLevel`
   - `articles` collection: `status`, `sport`
   - `bookings` collection: `coachId`, `studentId`, `scheduledStart`
   - `videos` collection: `coachId`, `isFree`, `visibility`

## Creating an Admin User

To create an admin user, manually update the user document in Firestore:

1. Go to Firebase Console > Firestore
2. Find the user document in the `users` collection
3. Update the `role` field to `"admin"`

## Running the Application

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open http://localhost:3000

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy to Vercel:
```bash
vercel
```

3. Set environment variables in Vercel dashboard

4. Update `NEXT_PUBLIC_BASE_URL` to your production URL

5. Update Stripe webhook URL to point to your production domain

## Features Checklist

✅ Landing page with hero, trust bar, featured sections
✅ Student onboarding (8 steps with guardian flow)
✅ Coach onboarding (8 steps)
✅ Coach directory with filters
✅ Public coach profiles
✅ Courses marketplace
✅ Course detail and enrollment
✅ Articles feed and pages
✅ Booking system (free intro + paid)
✅ Stripe integration
✅ Video upload and management
✅ Course creation and editing
✅ Article creation and editing
✅ Student library
✅ Course playback
✅ Progress tracking
✅ Coach notes and ratings
✅ Admin panel
✅ Coach verification
✅ Content moderation

## Next Steps for Production

1. Set up proper Firestore security rules
2. Implement rate limiting for API routes
3. Add email notifications
4. Set up Stripe Connect for coach payouts
5. Add video thumbnail generation
6. Implement search functionality
7. Add analytics
8. Set up error monitoring (Sentry, etc.)
9. Add unit and integration tests
10. Implement caching strategies


