# Stripe Connect Setup Guide

This guide will walk you through setting up Stripe Connect for Coachify, enabling coaches to receive payments through the platform.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Access to your Stripe Dashboard
3. Your application deployed or running locally

## Step 1: Get Your Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers** → **API keys**
3. You'll see two keys:
   - **Publishable key** (starts with `pk_test_` for test mode, `pk_live_` for live mode)
   - **Secret key** (starts with `sk_test_` for test mode, `sk_live_` for live mode)

## Step 2: Set Up Environment Variables

Create a `.env.local` file in your project root (if it doesn't exist) and add:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE

# Webhook Secret (you'll get this in Step 4)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Your application URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Important**: 
- Never commit `.env.local` to git (it's already in `.gitignore`)
- Use test keys (`sk_test_` and `pk_test_`) during development
- Switch to live keys (`sk_live_` and `pk_live_`) only in production

## Step 3: Enable Stripe Connect

1. In your Stripe Dashboard, go to **Settings** → **Connect**
2. Click **Get started** or **Activate Connect**
3. Choose **Express accounts** (this is what Coachify uses)
4. Complete the onboarding form for your platform account

## Step 4: Set Up Webhooks

Webhooks allow Stripe to notify your application about payment events.

### For Local Development (using Stripe CLI):

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli):
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows (using Scoop)
   scoop install stripe
   
   # Linux
   # Download from https://github.com/stripe/stripe-cli/releases
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. Copy the webhook signing secret (starts with `whsec_`) and add it to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_FROM_CLI
   ```

### For Production:

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select these events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `transfer.created`
   - `transfer.paid`
   - `transfer.failed`
   - `account.updated`
   - `charge.refunded`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`) and add it to your production environment variables

## Step 5: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Log in as a coach and navigate to the dashboard
3. You should see a banner prompting you to set up payments
4. Click **Set Up Payments** → **Start Setup**
5. You'll be redirected to Stripe's onboarding flow
6. Complete the onboarding (use test data):
   - Business type: Individual or Company
   - Country: United States (or your country)
   - Email: Use a test email
   - Phone: Use a test phone number
   - Business details: Fill in test information
   - Bank account: Use Stripe's test account numbers (see below)

### Stripe Test Bank Account Numbers

For testing, use these test account numbers:
- **Account number**: `000123456789`
- **Routing number**: `110000000` (for US accounts)

## Step 6: Verify Everything Works

After completing onboarding:

1. Check your dashboard - the payment setup banner should disappear
2. Try creating a course - you should be able to create it now
3. Check Stripe Dashboard → **Connect** → **Accounts** - you should see your test account

## Step 7: Deploy to Production

1. **Set environment variables in your hosting platform** (Vercel, etc.):
   - `STRIPE_SECRET_KEY` (use `sk_live_` key)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (use `pk_live_` key)
   - `STRIPE_WEBHOOK_SECRET` (from production webhook endpoint)
   - `NEXT_PUBLIC_BASE_URL` (your production URL)

2. **Update webhook endpoint** in Stripe Dashboard to point to your production URL

3. **Test with real accounts** (but start with small amounts!)

## Troubleshooting

### "Stripe is not configured" Error

- Check that `STRIPE_SECRET_KEY` is set in your `.env.local` file
- Restart your development server after adding environment variables
- Verify the key starts with `sk_test_` (test) or `sk_live_` (production)

### "Missing or insufficient permissions" Error

- Make sure your Firestore security rules are deployed
- Check that the rules allow coaches to read their own pending payout data
- Deploy rules: `firebase deploy --only firestore:rules`

### Webhook Not Receiving Events

- Verify webhook endpoint URL is correct
- Check that `STRIPE_WEBHOOK_SECRET` matches your webhook's signing secret
- For local development, make sure Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Check your server logs for webhook errors

### Coach Can't Create Courses

- Verify the coach completed Stripe onboarding
- Check that `chargesEnabled` and `payoutsEnabled` are both `true`
- Check Stripe Dashboard → Connect → Accounts for account status

## Additional Resources

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe Connect Express Accounts](https://stripe.com/docs/connect/express-accounts)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check your server logs
3. Check Stripe Dashboard → **Developers** → **Logs** for API errors
4. Verify all environment variables are set correctly



