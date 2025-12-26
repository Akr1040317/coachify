# Vercel Testing Setup - Quick Start

This guide will help you set up testing on Vercel with minimal manual steps.

## ✅ What's Already Done

- Your Stripe test keys are documented below
- Webhook endpoint URL is ready
- All code is ready for deployment

## 📋 Quick Setup Checklist

Follow these steps in order:

### Step 1: Add Environment Variables to Vercel (5 minutes)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project: **coachify** (or whatever your project is named)

2. **Navigate to Environment Variables**
   - Click **Settings** → **Environment Variables**

3. **Add These Variables** (copy-paste exactly):

   **Variable 1:**
   - **Name**: `STRIPE_SECRET_KEY`
   - **Value**: `sk_test_YOUR_SECRET_KEY_HERE` *(Get from Stripe Dashboard → Developers → API keys → Reveal test key)*
   - **Environment**: ☑ Production ☑ Preview ☑ Development
   - Click **Save**

   **Variable 2:**
   - **Name**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Value**: `pk_test_YOUR_PUBLISHABLE_KEY_HERE` *(Get from Stripe Dashboard → Developers → API keys)*
   - **Environment**: ☑ Production ☑ Preview ☑ Development
   - Click **Save**

   **Variable 3:**
   - **Name**: `NEXT_PUBLIC_BASE_URL`
   - **Value**: `https://coachify-ed.vercel.app` (or your actual Vercel URL)
   - **Environment**: ☑ Production ☑ Preview ☑ Development
   - Click **Save**

   **Variable 4:** (You'll get this in Step 2)
   - **Name**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: `whsec_...` (will be filled in Step 2)
   - **Environment**: ☑ Production ☑ Preview
   - Click **Save** (after you get the secret)

4. **Redeploy**
   - Go to **Deployments** tab
   - Click **⋯** (three dots) on latest deployment
   - Click **Redeploy**
   - Wait for deployment to complete

### Step 2: Set Up Stripe Webhook (5 minutes)

1. **Go to Stripe Dashboard**
   - Visit: https://dashboard.stripe.com/test/webhooks
   - Make sure you're in **Test Mode** (toggle in top right)

2. **Create Webhook Endpoint**
   - Click **Add endpoint** button
   - **Endpoint URL**: `https://coachify-ed.vercel.app/api/webhooks/stripe`
     - ⚠️ Replace `coachify-ed.vercel.app` with your actual Vercel domain if different
   - **Description**: `Coachify Production Webhook`

3. **Select Events Source**
   - Choose: **"Connected and v2 accounts"** (required for Connect account updates)

4. **Select Events** (search and select these):
   ```
   checkout.session.completed
   payment_intent.succeeded
   transfer.created
   transfer.updated
   account.updated
   charge.refunded
   charge.dispute.created
   charge.dispute.updated
   ```

5. **Copy Webhook Secret**
   - After creating, click on the endpoint
   - Find **"Signing secret"** section
   - Click **Reveal** button
   - Copy the secret (starts with `whsec_`)

6. **Add to Vercel**
   - Go back to Vercel → Settings → Environment Variables
   - Add/Update `STRIPE_WEBHOOK_SECRET` with the secret you copied
   - Click **Save**

7. **Redeploy Again**
   - Go to Deployments → Redeploy latest
   - This ensures webhook secret is active

### Step 3: Verify Setup (2 minutes)

1. **Test Webhook Delivery**
   - In Stripe Dashboard → Webhooks → Click your endpoint
   - Click **"Send test webhook"** button
   - Select event: `checkout.session.completed`
   - Click **"Send test webhook"**
   - Check **Logs** tab - should show ✅ Success

2. **Check Vercel Logs**
   - Go to Vercel → Your deployment → **Functions** tab
   - Click on `/api/webhooks/stripe`
   - Should see function logs (may be empty until first real webhook)

## 🧪 Testing the Full Flow

Now you're ready to test! Follow the [TESTING_GUIDE.md](./TESTING_GUIDE.md) but use your Vercel URL instead of localhost.

### Quick Test:

1. **Coach Setup:**
   - Go to `https://coachify-ed.vercel.app/get-started/signup/coach`
   - Complete onboarding
   - Set up Stripe Connect (use test data from TESTING_GUIDE.md)

2. **Create Course:**
   - Go to `/app/coach/course/new`
   - Create a test course ($29.99)

3. **Student Purchase:**
   - Sign up as student
   - Purchase course with test card: `4242 4242 4242 4242`

4. **Verify:**
   - Check Stripe Dashboard → Payments → Should see payment with $6.00 application fee (20%)
   - Check Stripe Dashboard → Webhooks → Logs → Should see successful webhook deliveries
   - Check Firestore → `purchases` collection → Should see purchase record

## 🔍 Troubleshooting

### Webhook Not Working?

1. **Check Webhook Secret:**
   - Verify `STRIPE_WEBHOOK_SECRET` in Vercel matches Stripe Dashboard
   - Make sure you copied the entire secret (starts with `whsec_`)

2. **Check Webhook URL:**
   - Must be exactly: `https://coachify-ed.vercel.app/api/webhooks/stripe`
   - Must use `https://` (not `http://`)
   - No trailing slash

3. **Check Stripe Dashboard:**
   - Go to Webhooks → Your endpoint → Logs
   - Look for failed deliveries
   - Check error messages

4. **Check Vercel Logs:**
   - Go to Deployment → Functions → `/api/webhooks/stripe`
   - Look for error messages

### Payment Not Creating Purchase Record?

- Webhook might not be receiving events
- Check Stripe Dashboard → Webhooks → Logs
- Verify webhook secret is correct
- Make sure events are selected in Stripe Dashboard

### "Coach payment account not set up"?

- Coach needs to complete Stripe Connect onboarding
- In Stripe Dashboard → Connect → Accounts → Find coach's account
- Manually activate test account (test mode only)

## 📝 Summary

**What You Need to Do:**
1. ✅ Add 4 environment variables to Vercel (3 now, 1 after webhook setup)
2. ✅ Create webhook endpoint in Stripe Dashboard
3. ✅ Copy webhook secret to Vercel
4. ✅ Redeploy

**What's Automated:**
- ✅ All code is ready
- ✅ Webhook handler is ready
- ✅ Payment flow is ready
- ✅ Platform fee calculation (20%) is automatic

**Time Required:** ~10-15 minutes total

---

## 🚀 After Setup

Once everything is configured:
- Test purchases will work automatically
- Platform fees (20%) are calculated automatically
- Coach earnings (80%) are tracked automatically
- Webhooks update your database automatically

You're ready to test! 🎉

