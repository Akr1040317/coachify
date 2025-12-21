# Coachify

A dark-themed, sports coaching marketplace where students discover verified coaches, learn from free and paid videos and courses, and book 1:1 online coaching sessions.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Payments**: Stripe Checkout + Stripe Connect
- **Animations**: Framer Motion
- **Hosting**: Vercel

## Features Implemented

### Phase 1: Foundation ✅
- [x] Next.js project setup with TypeScript and Tailwind
- [x] Dark theme system with CSS variables (blue/purple/orange)
- [x] Firebase configuration (Auth, Firestore, Storage)
- [x] Reusable UI components (GlowButton, GradientCard, BadgeVerified, SportIconCard, WizardStepShell)
- [x] Basic routing structure

### Phase 2: Landing & Student Onboarding ✅
- [x] Landing page with hero, trust bar, how it works, featured sections
- [x] Student onboarding wizard (8 steps)
  - [x] Welcome
  - [x] Age and guardian flow (for users < 16)
  - [x] Sport selection (12 sports)
  - [x] Skill level
  - [x] Goals and aspirations
  - [x] Sport-specific focus areas (dynamic based on sport)
  - [x] Preferences and constraints
  - [x] Results page

### Phase 3: Coach Onboarding ✅
- [x] Coach onboarding wizard (8 steps)
  - [x] Welcome
  - [x] Identity and credibility
  - [x] Sports coached with specialties
  - [x] Experience and credentials
  - [x] Intro video and bio
  - [x] Pricing and packages
  - [x] Availability (placeholder)
  - [x] Payout setup (placeholder)

### Phase 4: Dashboards ✅
- [x] Student dashboard (basic)
- [x] Coach dashboard (basic)

## Features To Be Implemented

### Phase 4: Marketplace
- [ ] Coach directory with filters
- [ ] Public coach profile pages
- [ ] Courses marketplace
- [ ] Course detail pages
- [ ] Articles feed and article pages

### Phase 5: Bookings
- [ ] Free intro booking flow
- [ ] Paid session checkout with Stripe
- [ ] Booking management pages
- [ ] Stripe webhook handlers

### Phase 6: Content Management
- [ ] Video upload and management
- [ ] Course creation and editing
- [ ] Article creation and editing
- [ ] Student library and course playback

### Phase 7: Tracking
- [ ] Coach notes and skill ratings
- [ ] Student progress view

### Phase 8: Admin
- [ ] Coach verification panel
- [ ] Content moderation tools

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (create `.env.local`):
```bash
cp .env.example .env.local
```

Then fill in your Firebase and Stripe credentials:
- Firebase config is already set in `lib/firebase/config.ts` (you can move to env vars for production)
- Stripe keys are required for payment processing
- Set `NEXT_PUBLIC_BASE_URL` to your production URL for webhooks

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Features Implemented

### ✅ All Phases Complete

**Phase 1: Foundation**
- Next.js 14 with TypeScript and Tailwind CSS
- Dark theme system with CSS variables
- Firebase integration (Auth, Firestore, Storage)
- Reusable UI components

**Phase 2: Landing & Student Onboarding**
- Complete landing page with all sections
- 8-step student onboarding wizard
- Guardian flow for users under 16

**Phase 3: Coach Onboarding**
- 8-step coach onboarding wizard
- Profile creation, pricing, availability setup

**Phase 4: Marketplace**
- Coach directory with filters (sport, verified, price)
- Public coach profile pages
- Courses marketplace with filters
- Course detail pages with enrollment
- Articles feed and article pages

**Phase 5: Bookings**
- Free intro booking flow
- Paid session checkout with Stripe
- Booking management for students and coaches
- Stripe webhook handlers

**Phase 6: Content Management**
- Video upload and management for coaches
- Course creation and editing
- Article creation and editing
- Student library with course playback
- Progress tracking

**Phase 7: Tracking**
- Coach notes and skill ratings
- Student progress view
- Session history

**Phase 8: Admin**
- Coach verification panel
- Review moderation
- Booking management
- Content moderation

## Project Structure

```
coachify/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication
│   ├── onboarding/        # Student and coach onboarding
│   ├── app/               # Protected app routes
│   └── page.tsx           # Landing page
├── components/
│   ├── landing/           # Landing page components
│   ├── onboarding/        # Onboarding wizards
│   └── ui/                # Reusable UI components
├── lib/
│   ├── firebase/          # Firebase configuration and helpers
│   └── constants/         # App constants (sports, etc.)
└── public/                # Static assets
```

## Design System

- **Colors**: Dark theme with electric blue (#3b82f6), purple (#a855f7), and orange (#f97316) accents
- **Components**: Glow effects on buttons, gradient cards, smooth animations
- **Typography**: Modern, clean fonts with proper spacing

## Firebase Collections

See the product spec for detailed Firestore collection schemas. Key collections:
- `users/` - User accounts
- `students/` - Student profiles
- `coaches/` - Coach profiles
- `bookings/` - Session bookings
- `courses/` - Course content
- `videos/` - Video content
- `articles/` - Article content
- `purchases/` - Purchase records
- `enrollments/` - Course enrollments

## Next Steps

1. Implement Stripe integration for payments
2. Build coach directory and filtering
3. Create booking system
4. Add content management features
5. Implement progress tracking
6. Build admin panel
