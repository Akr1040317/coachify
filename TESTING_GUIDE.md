# Coachify Testing Guide

Complete guide for testing the payment flow, Stripe Connect setup, and platform fee collection.

## 🚀 Quick Start: Testing on Vercel

**For Vercel testing, see [QUICK_VERCEL_SETUP.md](./QUICK_VERCEL_SETUP.md) for the fastest setup!**

Your Stripe test keys are already documented there. Just copy-paste into Vercel environment variables.

---

## Part 1: Setting Up Stripe Test Mode

### Step 1: Get Stripe Test API Keys

1. **Go to Stripe Dashboard**
   - Visit https://dashboard.stripe.com
   - Make sure you're logged in

2. **Switch to Test Mode**
   - Look for the toggle in the top right that says "Test mode" or "Live mode"
   - Click it to switch to **Test mode** (should show "Test mode" in gray/orange)
   - You'll see test data instead of live data

3. **Get Your Test API Keys**
   - Go to **Developers** → **API keys** (in the left sidebar)
   - You'll see two keys:
     - **Publishable key** (starts with `pk_test_...`)
     - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key" to see it

4. **Set Up Environment Variables**

   **For Local Development:**
   - Create/update `.env.local` file in the project root:
   ```env
   # Stripe Test Mode Keys
   STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
   
   # App Configuration
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   
   # Firebase (already configured)
   FIREBASE_SERVICE_ACCOUNT_KEY=your_service_account_json_here
   ```

   **For Vercel (Production Testing):**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add the same variables with your test keys
   - Make sure to set them for the correct environment (Development/Preview/Production)

5. **Set Up Test Webhook (for local testing)**

   **Option A: Use Stripe CLI (Recommended for local testing)**
   ```bash
   # Install Stripe CLI: https://stripe.com/docs/stripe-cli
   # Then run:
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   - This will give you a webhook secret (starts with `whsec_...`)
   - Use this in your `.env.local` as `STRIPE_WEBHOOK_SECRET`

   **Option B: Use ngrok (Alternative)**
   ```bash
   # Install ngrok: https://ngrok.com
   # Run your Next.js app: npm run dev
   # In another terminal:
   ngrok http 3000
   # Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
   # In Stripe Dashboard → Developers → Webhooks → Add endpoint
   # URL: https://abc123.ngrok.io/api/webhooks/stripe
   # Events: checkout.session.completed, payment_intent.succeeded, etc.
   # Copy the webhook signing secret to your .env.local
   ```

6. **Restart Your Development Server**
   ```bash
   npm run dev
   ```
   - Make sure the server picks up the new environment variables

### Step 2: Verify Test Mode is Active

- Check your Stripe Dashboard - it should say "Test mode" in the top right
- All API keys should start with `pk_test_` or `sk_test_`
- You can use test cards without real charges

---

## Part 2: Complete Testing Flow

### Prerequisites Checklist

- [ ] Stripe Dashboard in Test Mode
- [ ] Test API keys configured in `.env.local`
- [ ] Webhook configured (Stripe CLI or ngrok)
- [ ] Development server running (`npm run dev`)
- [ ] Two browser windows/tabs ready:
  - One for coach account
  - One for student account

---

### Phase 1: Coach Setup & Payment Configuration

#### Test 1: Coach Onboarding

1. **Create Coach Account**
   - Go to `http://localhost:3000/get-started/signup/coach`
   - Sign up with test email (e.g., `coach-test@example.com`)
   - Complete onboarding steps 1-6:
     - Step 1: Welcome
     - Step 2: Name and headline
     - Step 3: Sports selection
     - Step 4: Experience and credentials
     - Step 5: Bio and intro video (optional)
     - Step 6: Pricing (set test prices):
       - 30-minute session: **$50** (5000 cents)
       - 60-minute session: **$100** (10000 cents)
       - Free intro: Yes, 15 minutes

2. **Verify Coach Profile Created**
   - Check Firestore → `coaches` collection
   - Should see document with your user ID
   - Verify `sessionOffers` contains your pricing

#### Test 2: Stripe Connect Setup

1. **Navigate to Payment Setup**
   - After onboarding, you should be redirected to `/app/coach/onboarding/stripe`
   - Or manually go to: `http://localhost:3000/app/coach/onboarding/stripe`

2. **Start Stripe Connect Onboarding**
   - Click "Set Up Payments" or "Complete Setup"
   - You'll be redirected to Stripe's onboarding form

3. **Fill Out Stripe Form (Use Test Data)**
   
   **Personal Details:**
   - Legal first name: `Test`
   - Legal last name: `Coach`
   - Email: `test-coach@example.com` (can be any email)
   - Date of birth: `01/01/1990` (any date showing 18+ years old)
   
   **Home Address:**
   - Country: `United States`
   - Street address: `123 Test Street`
   - Apartment (optional): Leave blank
   - City: `San Francisco`
   - State: `California` (or any US state)
   - Zip code: `94102` (or any valid US zip)
   
   **Phone Number:**
   - `555-555-5555` (Stripe accepts this in test mode)
   
   **Social Security Number:**
   - Last 4 digits: `0000` (Stripe accepts this in test mode)
   
   **Click "Continue"**

4. **Complete Additional Steps (if prompted)**
   - Stripe may ask for business type, tax ID, etc.
   - In test mode, you can often skip or use placeholder data
   - Follow prompts until you see "Account created" or similar

5. **Verify Account Status**
   - You'll be redirected back to your app
   - Check the status page - it may show "Pending" initially
   - Go to Stripe Dashboard → **Connect** → **Accounts**
   - Find your test account (should show the email you used)
   - Click on it to see details

6. **Manually Activate Test Account (Test Mode Only)**
   
   **In Stripe Dashboard:**
   - Go to the Connect account you just created
   - Scroll to **"Account status"** section
   - Click **"Activate test account"** button (test mode only)
   - Or manually enable:
     - **Charges**: Toggle ON
     - **Payouts**: Toggle ON
   
   **Alternative Method:**
   - In Stripe Dashboard → Connect → Accounts
   - Click on your account
   - Go to **Settings** → **Account status**
   - Use the test mode controls to activate the account
   
   **Verify in Your App:**
   - Refresh `/app/coach/onboarding/stripe`
   - Should now show "Payment Account Connected!" with green checkmark
   - Status should be "active"

---

### Phase 2: Create Coach Offerings

#### Test 3: Create a Course

1. **Navigate to Course Creation**
   - Go to `http://localhost:3000/app/coach/course/new`
   - Or from dashboard: `/app/coach/dashboard` → "Create Course"

2. **Fill Out Course Form**
   - Title: `Test Basketball Fundamentals Course`
   - Description: `Learn the basics of basketball`
   - Sport: `Basketball`
   - Skill level: `Beginner`
   - Price: `$29.99` (2999 cents)
   - Add some outcomes/lessons
   - Click "Publish Course"

3. **Verify Course Created**
   - Check Firestore → `courses` collection
   - Should see your course with `isPublished: true`
   - Note the `courseId` for later testing

#### Test 4: Verify Session Offerings

1. **Check Offerings Page**
   - Go to `http://localhost:3000/app/coach/offerings`
   - Should see your session prices from onboarding:
     - 30-minute: $50
     - 60-minute: $100
     - Free intro: 15 minutes

---

### Phase 3: Student Purchase Flow

#### Test 5: Create Student Account

1. **Sign Up as Student**
   - Open a new browser window/tab (or use incognito)
   - Go to `http://localhost:3000/get-started/signup/student`
   - Sign up with different email (e.g., `student-test@example.com`)
   - Complete student onboarding

2. **Verify Student Account**
   - Check Firestore → `users` collection
   - Should see student document with `role: "student"`

#### Test 6: Purchase a Course

1. **Browse Courses**
   - Go to `http://localhost:3000/courses`
   - Find your test course: "Test Basketball Fundamentals Course"
   - Click on it

2. **Start Purchase**
   - Click "Enroll Now" or "Purchase Course"
   - You'll be redirected to Stripe Checkout

3. **Use Stripe Test Card**
   
   **Success Card:**
   - Card number: `4242 4242 4242 4242`
   - Expiry: `12/25` (any future date)
   - CVC: `123` (any 3 digits)
   - ZIP: `12345` (any 5 digits)
   - Name: `Test Student`
   
   - Click "Pay"

4. **Verify Purchase Success**
   - Should redirect to `/app/student/library?success=true`
   - Course should appear in "My Library"
   - Click on course → should be able to access lessons

5. **Verify in Stripe Dashboard**
   - Go to Stripe Dashboard → **Payments**
   - Find the payment (should show $29.99)
   - Click on it
   - Check **"Application fee"** field:
     - Should show **$6.00** (20% of $29.99 = $5.998, rounded to $6.00)
   - Check **"Amount to connected account"**:
     - Should show **$23.99** (80% to coach)

6. **Verify in Firestore**
   - Check `purchases` collection
   - Find purchase with `courseId` matching your course
   - Verify fields:
     ```json
     {
       "amountCents": 2999,        // Total paid: $29.99
       "platformFeeCents": 600,    // Platform fee: $6.00 (20%)
       "coachEarningsCents": 2399, // Coach gets: $23.99 (80%)
       "status": "paid",
       "type": "course"
     }
     ```

7. **Verify Coach Pending Payout**
   - Check Firestore → `coaches/{coachId}/pendingPayout`
   - Should show:
     ```json
     {
       "amountCents": 2399,  // Coach earnings
       "transactionIds": ["purchase-id-here"]
     }
     ```

#### Test 7: Book a Coaching Session

1. **Find Coach Profile**
   - Go to `http://localhost:3000/coaches`
   - Find your coach profile
   - Or go directly to `/coach/{coachId}`

2. **Book Session**
   - Click "Book Session" or "Book 30-minute Session"
   - Select date/time
   - Click "Continue to Payment"

3. **Complete Payment**
   - Use same test card: `4242 4242 4242 4242`
   - Complete checkout

4. **Verify Booking**
   - Should redirect to `/app/student/bookings?success=true`
   - Booking should appear in student's bookings
   - Check Firestore → `bookings` collection
   - Should see booking with `status: "confirmed"`

5. **Verify Platform Fee on Session**
   - Go to Stripe Dashboard → Payments
   - Find the session payment ($50.00)
   - Check application fee: **$10.00** (20% of $50)
   - Amount to coach: **$40.00** (80%)

6. **Verify Purchase Record**
   - Check `purchases` collection
   - Should see new purchase with `type: "session"`
   - Verify fee breakdown:
     ```json
     {
       "amountCents": 5000,        // $50.00
       "platformFeeCents": 1000,   // $10.00 (20%)
       "coachEarningsCents": 4000, // $40.00 (80%)
       "type": "session"
     }
     ```

7. **Verify Updated Pending Payout**
   - Check `coaches/{coachId}/pendingPayout` again
   - Should now show:
     ```json
     {
       "amountCents": 6399,  // $23.99 + $40.00 = $63.99
       "transactionIds": ["purchase-1-id", "purchase-2-id"]
     }
     ```

---

### Phase 4: Verify Platform Fee Collection

#### Test 8: Check Platform Revenue

1. **Calculate Expected Platform Fees**
   - Course purchase: $29.99 × 20% = **$6.00**
   - Session purchase: $50.00 × 20% = **$10.00**
   - **Total platform revenue: $16.00**

2. **Verify in Stripe Dashboard**
   - Go to Stripe Dashboard → **Payments**
   - Filter by date (today)
   - You should see 2 payments:
     - Payment 1: $29.99 (Application fee: $6.00)
     - Payment 2: $50.00 (Application fee: $10.00)
   - **Total application fees: $16.00**

3. **Verify in Firestore**
   - Check `purchases` collection
   - Sum all `platformFeeCents` values
   - Should equal 1600 cents = $16.00

4. **Check Admin Revenue View** (if you have admin panel)
   - Go to `/app/admin/revenue`
   - Should show total platform revenue

---

### Phase 5: Test Edge Cases

#### Test 9: Test Card Declines

1. **Try Declined Card**
   - Go through purchase flow again
   - Use card: `4000 0000 0000 0002`
   - Should show decline message
   - No purchase record should be created

#### Test 10: Test Refunds (Optional)

1. **Create a Refund in Stripe Dashboard**
   - Go to Stripe Dashboard → Payments
   - Find a test payment
   - Click "Refund"
   - Select "Full refund"

2. **Verify Refund Processing**
   - Check webhook logs (if using Stripe CLI)
   - Check Firestore → `purchases` collection
   - Purchase status should update to "refunded"
   - Coach pending payout should decrease

---

## Part 3: Stripe Test Cards Reference

### Success Cards
- **Basic**: `4242 4242 4242 4242`
- **Visa Debit**: `4000 0566 5566 5556`
- **Mastercard**: `5555 5555 5555 4444`

### Decline Cards
- **Generic decline**: `4000 0000 0000 0002`
- **Insufficient funds**: `4000 0000 0000 9995`
- **Lost card**: `4000 0000 0000 9987`
- **Stolen card**: `4000 0000 0000 9979`

### 3D Secure Cards (Requires authentication)
- **Authentication required**: `4000 0025 0000 3155`
- **Always succeeds**: `4000 0027 6000 3184`
- **Always fails**: `4000 0082 6000 3178`

### Special Test Cards
- **Requires ZIP**: `4000 0027 6000 3184`
- **International card**: `4000 0000 0000 3220`

**Full list**: https://stripe.com/docs/testing

---

## Part 4: Quick Testing Checklist

Use this checklist to quickly verify everything works:

```
SETUP:
□ Stripe Dashboard in Test Mode
□ Test API keys in .env.local
□ Webhook configured (Stripe CLI or ngrok)
□ Server restarted with new env vars

COACH SETUP:
□ Coach account created
□ Onboarding completed (pricing set)
□ Stripe Connect account created
□ Test account activated in Stripe Dashboard
□ Payment setup shows "Connected" status

COACH OFFERINGS:
□ Course created and published
□ Session offerings visible

STUDENT PURCHASE:
□ Student account created
□ Course purchase successful
□ Session booking successful
□ Both appear in student's library/bookings

PLATFORM FEE VERIFICATION:
□ Stripe Dashboard shows application fees (20%)
□ Firestore purchases have correct fee breakdown
□ Coach pending payout shows correct earnings (80%)
□ Platform revenue matches expected 20%

EDGE CASES:
□ Declined card handled correctly
□ Refunds processed (optional)
```

---

## Part 5: Troubleshooting

### Issue: "Coach payment account not set up"
- **Solution**: Make sure Stripe Connect account is activated in Stripe Dashboard
- Go to Connect → Accounts → Your account → Activate test account

### Issue: Webhook not receiving events
- **Solution**: 
  - If using Stripe CLI: Make sure `stripe listen` is running
  - If using ngrok: Make sure ngrok is running and URL is correct in Stripe Dashboard
  - Check webhook secret matches in `.env.local`

### Issue: Platform fee not showing correctly
- **Solution**: 
  - Check `lib/config/payments.ts` - `PLATFORM_FEE_PERCENTAGE` should be `0.20`
  - Verify `createConnectCheckoutSession` in `lib/firebase/payments.ts` is calculating fees
  - Check Stripe Dashboard → Payment → Application fee field

### Issue: Purchase not appearing in Firestore
- **Solution**:
  - Check webhook is receiving `checkout.session.completed` event
  - Check webhook handler in `app/api/webhooks/stripe/route.ts`
  - Check browser console and server logs for errors

### Issue: Can't activate test Connect account
- **Solution**:
  - In Stripe Dashboard → Connect → Accounts
  - Click on your test account
  - Look for "Activate test account" button (test mode only)
  - Or manually toggle "Charges enabled" and "Payouts enabled" in Settings

---

## Part 6: Switching to Live Mode

**⚠️ IMPORTANT: Only switch to live mode when ready for production!**

1. **Get Live API Keys**
   - In Stripe Dashboard, toggle to "Live mode"
   - Go to Developers → API keys
   - Copy live keys (start with `pk_live_` and `sk_live_`)

2. **Update Environment Variables**
   - Update `.env.local` (for local) or Vercel (for production)
   - Replace test keys with live keys

3. **Update Webhook**
   - Create production webhook endpoint in Stripe Dashboard
   - Use your production URL: `https://yourdomain.com/api/webhooks/stripe`
   - Copy new webhook secret

4. **Test with Real Card** (small amount first!)
   - Use a real card with small amount ($1-5)
   - Verify everything works before going full production

---

## Additional Resources

- **Stripe Testing Docs**: https://stripe.com/docs/testing
- **Stripe Connect Testing**: https://stripe.com/docs/connect/testing
- **Stripe CLI**: https://stripe.com/docs/stripe-cli
- **Webhook Testing**: https://stripe.com/docs/webhooks/test

---

## Summary

The platform fee (20%) is automatically:
1. Calculated when checkout session is created
2. Deducted from payment via Stripe Connect `application_fee_amount`
3. Recorded in Firestore `purchases` collection
4. Tracked in Stripe Dashboard as "Application fee"
5. Coach receives 80% in their pending payout

All of this happens automatically - you just need to verify it's working correctly using the tests above!

