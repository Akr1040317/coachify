# Stripe Test Mode Testing Guide

This guide will help you test the complete payment flow including custom offerings, platform commission, and coach payouts using Stripe Test Mode.

## Prerequisites

1. **Stripe Account Setup**
   - Create a Stripe account at https://stripe.com
   - Switch to **Test Mode** (toggle in top right of Stripe Dashboard)
   - Get your test API keys from Developers > API keys

2. **Environment Variables**
   Make sure your `.env.local` has:
   ```env
   STRIPE_MODE=test
   STRIPE_SECRET_KEY_TEST=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_...
   STRIPE_WEBHOOK_SECRET_TEST=whsec_...
   ```

3. **Coach Stripe Connect Setup**
   - Coach must complete Stripe Connect onboarding
   - Coach's Stripe Connect account must be active (charges_enabled and payouts_enabled)

## Testing Custom Offering Booking Flow

### Step 1: Set Up Test Coach Account

1. **Sign in as a coach** (or create a coach account)
2. **Complete Stripe Connect onboarding**:
   - Go to `/app/coach/onboarding/stripe` or payment setup page
   - Complete the Stripe Connect Express account setup
   - Use Stripe test mode credentials

3. **Create a Custom Offering**:
   - Go to `/app/coach/offerings`
   - Click "Create Offering"
   - Fill in:
     - Name: "30 min batting session"
     - Description: "Will go through basic drills"
     - Duration: 30 minutes
     - Price: $30.00
     - Make sure it's **Active**
   - Save the offering

### Step 2: Test as Student

1. **Sign in as a student** (different account from coach)

2. **View Coach Profile**:
   - Go to `/coach/[coachId]` (replace with your coach's userId)
   - You should see the custom offering in the sidebar

3. **Click on Custom Offering**:
   - Click on the "30 min batting session" offering
   - You should be redirected to `/app/student/bookings/new?coachId=...&offeringId=...`
   - The offering should be **auto-selected**

4. **Book the Session**:
   - Select a date and time
   - Click "Continue to Payment"
   - You'll be redirected to Stripe Checkout

### Step 3: Complete Test Payment

1. **Use Stripe Test Card**:
   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

2. **Complete Checkout**:
   - Fill in the test card details
   - Click "Pay"
   - You should be redirected back to `/app/student/bookings?success=true`

### Step 4: Verify Payment Flow

1. **Check Stripe Dashboard**:
   - Go to Stripe Dashboard > Payments
   - You should see the payment
   - Check the payment details:
     - **Total Amount**: $30.00 (3000 cents)
     - **Platform Fee**: $6.00 (600 cents) - 20% commission
     - **Coach Earnings**: $24.00 (2400 cents) - 80% to coach

2. **Check Transfer**:
   - Go to Stripe Dashboard > Connect > Accounts
   - Find your coach's Connect account
   - Check the balance - should show $24.00 pending transfer

3. **Verify Booking Created**:
   - As student: Go to `/app/student/bookings`
   - You should see the booking
   - As coach: Go to `/app/coach/bookings`
   - You should see the booking

## Testing Platform Commission

The platform automatically takes **20% commission** on all payments:

- **Platform Fee Calculation**: `max(amount * 20%, $0.50)`
- **Coach Earnings**: `amount - platformFee`

### Example Calculations:

| Student Pays | Platform Fee (20%) | Coach Receives |
|-------------|-------------------|----------------|
| $10.00      | $2.00             | $8.00          |
| $30.00      | $6.00             | $24.00         |
| $50.00      | $10.00            | $40.00         |
| $100.00     | $20.00            | $80.00         |

## Testing Course Purchase Flow

1. **Publish a Course**:
   - As coach: Go to `/app/coach/courses/[courseId]`
   - Click "Publish" button
   - Course should now appear in `/courses`

2. **Purchase Course**:
   - As student: Go to `/courses`
   - Click on the course
   - Click "Enroll Now"
   - Complete Stripe Checkout with test card
   - Course should appear in `/app/student/library`

## Troubleshooting

### Issue: "Coach payment account not set up"
- **Solution**: Coach needs to complete Stripe Connect onboarding
- Go to `/app/coach/onboarding/stripe` or payment setup page

### Issue: "Coach Stripe Connect account is not active"
- **Solution**: Coach's Stripe Connect account needs to be verified
- Check Stripe Dashboard > Connect > Accounts
- Complete any pending verification steps

### Issue: Custom offering not showing
- **Solution**: Make sure the offering is marked as **Active** (`isActive: true`)
- Check in `/app/coach/offerings` page

### Issue: Course not showing in listing
- **Solution**: Course must be **Published** (`isPublished: true`)
- Go to course detail page and click "Publish"

## Stripe Test Mode Resources

- **Test Cards**: https://stripe.com/docs/testing
- **Test Mode Dashboard**: https://dashboard.stripe.com/test
- **Webhook Testing**: Use Stripe CLI for local testing
  ```bash
  stripe listen --forward-to localhost:3000/api/webhooks/stripe
  ```

## Next Steps

Once testing is complete:
1. Switch to **Live Mode** in Stripe Dashboard
2. Update environment variables to use live keys
3. Set `STRIPE_MODE=live` in production
4. Update webhook URL to production domain

