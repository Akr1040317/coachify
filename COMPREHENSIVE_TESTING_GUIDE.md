 # Comprehensive Testing Guide

This guide provides step-by-step instructions for testing the entire payment flow, including student payments, coach payouts, and platform commission tracking.

## Prerequisites

1. **Stripe Test Mode**: Make sure you're using Stripe test keys (`STRIPE_MODE=test`)
2. **Vercel Deployment**: Your app should be deployed and environment variables configured
3. **Stripe Dashboard**: Have Stripe Dashboard open in test mode for monitoring
4. **Firebase Console**: Have Firestore open to verify data

## Test Cards (Stripe Test Mode)

Use these test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`
- **Expiry**: Any future date (e.g., `12/34`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

---

## Part 1: Coach Account Setup & Onboarding

### Step 1: Create Coach Account

1. Go to your deployed website (e.g., `https://your-app.vercel.app`)
2. Click **"Get Started"** or **"Sign Up"**
3. Select **"I'm a Coach"**
4. Sign up with:
   - **Email**: `coach.test@example.com`
   - **Password**: `TestPassword123!`
5. Complete email verification if required

### Step 2: Complete Coach Onboarding

1. **Step 1 - Welcome**: Click through welcome screen
2. **Step 2 - Identity**: 
   - Enter name: `Test Coach`
   - Enter bio: `Experienced coach ready to help students`
3. **Step 3 - Sports**: Select at least one sport (e.g., `Basketball`)
4. **Step 4 - Experience**: 
   - Years of experience: `5`
   - Credentials: `Certified Basketball Coach`
5. **Step 5 - Intro Video**: Skip or upload a test video
6. **Step 6 - Pricing**: 
   - Set hourly rate: `$50` (5000 cents)
   - Set package prices if applicable
7. **Step 7 - Payment Setup**: **IMPORTANT** - Set up Stripe Connect
8. **Step 8 - Complete**: Finish onboarding

### Step 3: Set Up Stripe Connect (Coach Payment Account)

1. In the coach dashboard, navigate to **Payment Setup** or **Stripe Onboarding**
2. Click **"Connect Stripe Account"** or **"Set Up Payments"**
3. You'll be redirected to Stripe Connect onboarding
4. Fill out the Stripe form:
   - **Country**: United States
   - **Business Type**: Individual
   - **Email**: `coach.stripe@example.com`
   - **Phone**: `+1 555-0100`
   - **Date of Birth**: Any date (must be 18+)
   - **SSN**: Use test SSN `000-00-0000` (Stripe test mode)
   - **Address**: Any test address
5. Complete the form and submit
6. You should be redirected back to your app
7. **Verify in Stripe Dashboard**:
   - Go to Stripe Dashboard → **Connect** → **Accounts**
   - You should see a new Express account
   - Note the account ID (starts with `acct_`)

### Step 4: Verify Coach Data in Firestore

1. Go to Firebase Console → Firestore
2. Navigate to `coaches` collection
3. Find the coach document (by email or user ID)
4. Verify:
   - `stripeConnectAccountId` is set (should start with `acct_`)
   - `stripeConnectStatus` is `"active"` or `"pending"`
   - `status` is `"active"`

---

## Part 2: Student Account Setup & Course Purchase

### Step 1: Create Student Account

1. Open a **new incognito/private browser window** (or use a different browser)
2. Go to your deployed website
3. Click **"Get Started"** or **"Sign Up"**
4. Select **"I'm a Student"**
5. Sign up with:
   - **Email**: `student.test@example.com`
   - **Password**: `TestPassword123!`
6. Complete email verification if required

### Step 2: Complete Student Onboarding

1. **Step 1 - Welcome**: Click through
2. **Step 2 - Age**: Enter age (e.g., `20`)
3. **Step 3 - Sport**: Select a sport (match the coach's sport, e.g., `Basketball`)
4. **Step 4 - Skill Level**: Select level (e.g., `Intermediate`)
5. **Step 5 - Goals**: Enter goals
6. **Step 6 - Focus Areas**: Select focus areas
7. **Step 7 - Preferences**: Set preferences
8. **Step 8 - Complete**: Finish onboarding

### Step 3: Browse and Find a Course

1. Navigate to **"Courses"** or **"Browse Coaches"**
2. Find the coach you created (`Test Coach`)
3. Click on the coach's profile
4. View their courses or create a test course (if needed)

### Step 4: Create a Test Course (as Coach)

1. Switch back to coach account (or log in as coach)
2. Go to **Coach Dashboard** → **Courses** → **Create Course**
3. Fill out course details:
   - **Title**: `Test Basketball Course`
   - **Description**: `Learn basketball fundamentals`
   - **Price**: `$100` (10000 cents)
   - **Sport**: `Basketball`
   - **Skill Level**: `Beginner`
   - Add at least one lesson
4. **Publish** the course

### Step 5: Purchase Course (as Student)

1. Switch back to student account
2. Navigate to the course page
3. Click **"Enroll"** or **"Purchase Course"**
4. You'll be redirected to Stripe Checkout
5. **Fill out payment form**:
   - **Card Number**: `4242 4242 4242 4242`
   - **Expiry**: `12/34`
   - **CVC**: `123`
   - **ZIP**: `12345`
   - **Name**: `Test Student`
   - **Email**: `student.test@example.com`
6. Click **"Pay"** or **"Complete Payment"**
7. You should be redirected back to your app
8. You should see a success message and access to the course

---

## Part 3: Verifying Payments & Payouts

### How to Verify Student Paid Successfully

#### Method 1: Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/payments)
2. Make sure you're in **Test Mode** (toggle in top right)
3. Go to **Payments** → **All payments**
4. You should see a payment with:
   - **Amount**: `$100.00` (or your course price)
   - **Status**: `Succeeded` (green checkmark)
   - **Customer**: `student.test@example.com`
   - **Description**: Should mention the course or checkout session
5. Click on the payment to see details:
   - **Payment Intent ID**: Note this (starts with `pi_`)
   - **Checkout Session ID**: Note this (starts with `cs_`)
   - **Metadata**: Should contain `coachId`, `courseId`, `platformFeeCents`, `coachEarningsCents`

#### Method 2: Firestore Database

1. Go to Firebase Console → Firestore
2. Navigate to `purchases` collection
3. Find the purchase document (filter by `userId` or `courseId`)
4. Verify the purchase has:
   ```json
   {
     "userId": "student-user-id",
     "coachId": "coach-user-id",
     "courseId": "course-id",
     "type": "course",
     "amountCents": 10000,
     "platformFeeCents": 2000,  // 20% of $100 = $20
     "coachEarningsCents": 8000,  // $100 - $20 = $80
     "status": "paid",
     "stripePaymentIntentId": "pi_...",
     "stripeCheckoutSessionId": "cs_...",
     "paidAt": Timestamp
   }
   ```

#### Method 3: Student Dashboard

1. Log in as the student
2. Go to **Student Dashboard** → **Library** or **My Courses**
3. You should see the purchased course listed
4. Click on the course to verify access

#### Method 4: Enrollment Record

1. Go to Firestore → `enrollments` collection
2. Find enrollment with matching `userId` and `courseId`
3. Verify enrollment exists and has `progress: {}`

---

### How to Verify Coach Received Money

#### Method 1: Pending Payout in Firestore

1. Go to Firestore → `pendingPayouts` collection
2. Find document with `coachId` matching your coach
3. Verify:
   ```json
   {
     "coachId": "coach-user-id",
     "amountCents": 8000,  // $80 (coach earnings)
     "transactionIds": ["purchase-id"],
     "lastUpdated": Timestamp
   }
   ```
4. **Note**: Money is added to pending payout, not transferred immediately

#### Method 2: Coach Dashboard

1. Log in as the coach
2. Go to **Coach Dashboard** → **Revenue** or **Earnings**
3. You should see:
   - **Pending Earnings**: `$80.00` (or coach earnings amount)
   - **Total Earnings**: Should reflect the purchase
   - **Recent Transactions**: Should show the course purchase

#### Method 3: Stripe Connect Account

1. Go to Stripe Dashboard → **Connect** → **Accounts**
2. Click on the coach's Express account
3. Go to **Transfers** tab
4. **Note**: Transfers happen on a schedule (weekly by default, minimum $25)
5. If coach has earned $25+ and it's payout day, you'll see a transfer
6. Check **Balance** tab to see pending balance

#### Method 4: Purchase Record Breakdown

1. Go to Firestore → `purchases` collection
2. Find the purchase
3. Verify `coachEarningsCents` matches expected amount:
   - **Course Price**: $100 (10000 cents)
   - **Platform Fee (20%)**: $20 (2000 cents)
   - **Coach Earnings**: $80 (8000 cents)

---

### How to Verify Platform Commission

#### Method 1: Purchase Record

1. Go to Firestore → `purchases` collection
2. Find the purchase document
3. Verify `platformFeeCents`:
   ```json
   {
     "amountCents": 10000,        // $100 total
     "platformFeeCents": 2000,    // $20 (20% commission)
     "coachEarningsCents": 8000    // $80 (coach gets 80%)
   }
   ```

#### Method 2: Calculate from Stripe Payment

1. Go to Stripe Dashboard → **Payments**
2. Click on the payment
3. Check **Application fee** or **Platform fee** section
4. **Note**: With Stripe Connect, the platform fee is calculated in your app, not automatically by Stripe
5. The full payment goes to your platform account
6. You transfer `coachEarningsCents` to the coach
7. You keep `platformFeeCents` as commission

#### Method 3: Admin Dashboard (if available)

1. Log in as admin user
2. Go to **Admin Dashboard** → **Revenue**
3. You should see:
   - **Total Revenue**: $100
   - **Platform Fees**: $20
   - **Coach Payouts**: $80
   - **Net Profit**: $20

#### Method 4: Stripe Dashboard - Your Account Balance

1. Go to Stripe Dashboard → **Balance**
2. You should see the full payment amount ($100) in your account
3. When you transfer to coach, the balance decreases by coach earnings
4. Your commission stays in your account

---

## Part 4: Testing Payout Flow

### Understanding Payout Schedule

- **Minimum Payout**: $25 (2500 cents)
- **Payout Schedule**: Weekly (Mondays)
- **Payout Day**: Monday (configurable)

### Triggering a Manual Payout (for Testing)

If you need to test payouts before the scheduled day:

1. **Option 1: Use Stripe Dashboard**
   - Go to Stripe Dashboard → **Connect** → **Accounts**
   - Click on coach's account
   - Go to **Transfers** tab
   - Click **"Create transfer"**
   - Enter amount (must be ≤ pending balance)
   - Submit

2. **Option 2: Use API Endpoint** (if available)
   - Call `/api/admin/payouts/process` (admin only)
   - Or use the cron endpoint `/api/cron/payouts`

### Verifying Payout Completion

1. **Stripe Dashboard**:
   - Go to **Connect** → **Accounts** → Coach's account
   - Check **Transfers** tab
   - You should see a transfer with status `paid` or `pending`

2. **Firestore**:
   - Go to `payouts` collection
   - Find payout with matching `coachId`
   - Verify:
     ```json
     {
       "coachId": "coach-user-id",
       "transferId": "tr_...",
       "amountCents": 8000,
       "status": "paid",
       "paidAt": Timestamp,
       "transactionIds": ["purchase-id"]
     }
     ```

3. **Pending Payout Update**:
   - Go to `pendingPayouts` collection
   - The `amountCents` should be reduced by the payout amount
   - Or the document should be removed if balance is zero

---

## Part 5: Testing Booking Flow (Optional)

### Step 1: Student Books a Session

1. Log in as student
2. Go to coach's profile
3. Click **"Book Session"** or **"Schedule"**
4. Select date/time
5. Choose session type (e.g., `1-hour session - $50`)
6. Complete payment with test card `4242 4242 4242 4242`
7. Confirm booking

### Step 2: Verify Booking

1. **Firestore** → `bookings` collection:
   - Find booking with `studentId` and `coachId`
   - Verify `status` is `"confirmed"`
   - Verify `stripeCheckoutSessionId` is set

2. **Purchase Record**:
   - Check `purchases` collection
   - Should have `type: "session"` and `bookingId` set

---

## Troubleshooting

### Payment Not Showing in Firestore

1. **Check Webhook**: Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Check if webhook was received and processed
3. Look for errors in webhook logs
4. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe webhook secret

### Coach Not Receiving Money

1. **Check Stripe Connect Status**: 
   - Firestore → `coaches` → `stripeConnectStatus` should be `"active"`
2. **Check Pending Payout**:
   - Firestore → `pendingPayouts` → Verify `amountCents` is correct
3. **Check Minimum Payout**:
   - Coach needs $25+ to trigger automatic payout
   - Or manually create transfer in Stripe Dashboard

### Platform Fee Not Calculated

1. **Check Purchase Record**:
   - Verify `platformFeeCents` is set (should be 20% of amount)
2. **Check Checkout Session Metadata**:
   - Stripe Dashboard → Checkout Session → Metadata
   - Should contain `platformFeeCents` and `coachEarningsCents`

### Webhook Not Working

1. **Verify Webhook URL**: Must match your Vercel domain
2. **Check Webhook Secret**: Must match `STRIPE_WEBHOOK_SECRET_TEST` or `STRIPE_WEBHOOK_SECRET_LIVE`
3. **Check Stripe Dashboard**: Look for webhook delivery failures
4. **Check Vercel Logs**: Look for webhook processing errors

---

## Quick Reference: Where to Check

| What to Verify | Where to Check |
|---------------|----------------|
| **Student Payment** | Stripe Dashboard → Payments |
| **Purchase Record** | Firestore → `purchases` collection |
| **Enrollment** | Firestore → `enrollments` collection |
| **Coach Earnings** | Firestore → `pendingPayouts` collection |
| **Platform Fee** | Firestore → `purchases` → `platformFeeCents` |
| **Stripe Connect** | Stripe Dashboard → Connect → Accounts |
| **Payout** | Firestore → `payouts` collection |
| **Transfer** | Stripe Dashboard → Connect → Accounts → Transfers |

---

## Test Checklist

- [ ] Coach account created and onboarded
- [ ] Stripe Connect account linked to coach
- [ ] Student account created and onboarded
- [ ] Course created and published by coach
- [ ] Student purchased course successfully
- [ ] Payment visible in Stripe Dashboard
- [ ] Purchase record created in Firestore
- [ ] Enrollment record created
- [ ] Platform fee calculated correctly (20%)
- [ ] Coach earnings added to pending payout
- [ ] Student can access course in library
- [ ] Coach can see earnings in dashboard
- [ ] Payout processed (if $25+ and payout day)

---

## Next Steps After Testing

1. **Switch to Live Mode**: When ready, change `STRIPE_MODE=live` in Vercel
2. **Update Webhooks**: Create live mode webhooks in Stripe Dashboard
3. **Test with Real Cards**: Use real cards in live mode (small amounts)
4. **Monitor**: Set up alerts in Stripe Dashboard for payments and payouts

---

## Support

If you encounter issues:
1. Check Stripe Dashboard webhook logs
2. Check Vercel deployment logs
3. Check Firestore for missing records
4. Verify all environment variables are set correctly


