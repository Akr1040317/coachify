# Stripe Test & Live Mode Setup Guide

This guide explains how to configure both test and live Stripe API keys, and how to switch between them in your Vercel deployment.

## Overview

The application supports both **test mode** and **live mode** for Stripe. You can:
- Test locally and in Vercel preview deployments using test keys
- Switch the entire production site to live mode when ready
- Use different keys for different environments

## How It Works

The application uses a `STRIPE_MODE` environment variable to determine which set of keys to use:
- `STRIPE_MODE=test` → Uses test keys (default, safe for testing)
- `STRIPE_MODE=live` → Uses live keys (for production payments)

## Environment Variables

### Required Variables

You need to set up **both** test and live keys in Vercel:

#### Test Mode Keys (for testing)
```
STRIPE_SECRET_KEY_TEST=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_...
STRIPE_WEBHOOK_SECRET_TEST=whsec_...
```

#### Live Mode Keys (for production)
```
STRIPE_SECRET_KEY_LIVE=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_...
STRIPE_WEBHOOK_SECRET_LIVE=whsec_...
```

#### Mode Control
```
STRIPE_MODE=test  # or "live"
```

### Fallback Variables (Optional)

For backward compatibility, you can also use the old variable names. They will be used if the mode-specific keys are not found:

```
STRIPE_SECRET_KEY=sk_test_...  # Fallback if STRIPE_SECRET_KEY_TEST/LIVE not set
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Fallback
STRIPE_WEBHOOK_SECRET=whsec_...  # Fallback
```

## Step-by-Step Setup

### 1. Get Your Stripe Keys

#### Test Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test Mode** (toggle in top right)
3. Go to **Developers** → **API keys**
4. Copy:
   - **Secret key** (starts with `sk_test_`)
   - **Publishable key** (starts with `pk_test_`)

#### Live Keys
1. In Stripe Dashboard, switch to **Live Mode** (toggle in top right)
2. Go to **Developers** → **API keys**
3. Copy:
   - **Secret key** (starts with `sk_live_`)
   - **Publishable key** (starts with `pk_live_`)

### 2. Set Up Webhooks

#### Test Webhook
1. In Stripe Dashboard (Test Mode)
2. Go to **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Enter: `https://your-domain.vercel.app/api/webhooks/stripe`
5. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `transfer.updated`
   - `account.updated`
6. Copy the **Signing secret** (starts with `whsec_`)

#### Live Webhook
1. Switch to **Live Mode** in Stripe Dashboard
2. Repeat the same steps as above
3. Copy the **Signing secret** for live mode

### 3. Configure Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add all the following variables:

#### For All Environments (Production, Preview, Development)

**Test Keys:**
- **Key**: `STRIPE_SECRET_KEY_TEST`
  - **Value**: `sk_test_...` (your test secret key)
  - **Environment**: ☑ Production ☑ Preview ☑ Development

- **Key**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST`
  - **Value**: `pk_test_...` (your test publishable key)
  - **Environment**: ☑ Production ☑ Preview ☑ Development

- **Key**: `STRIPE_WEBHOOK_SECRET_TEST`
  - **Value**: `whsec_...` (your test webhook secret)
  - **Environment**: ☑ Production ☑ Preview ☑ Development

**Live Keys:**
- **Key**: `STRIPE_SECRET_KEY_LIVE`
  - **Value**: `sk_live_...` (your live secret key)
  - **Environment**: ☑ Production ☑ Preview ☑ Development

- **Key**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE`
  - **Value**: `pk_live_...` (your live publishable key)
  - **Environment**: ☑ Production ☑ Preview ☑ Development

- **Key**: `STRIPE_WEBHOOK_SECRET_LIVE`
  - **Value**: `whsec_...` (your live webhook secret)
  - **Environment**: ☑ Production ☑ Preview ☑ Development

**Mode Control:**
- **Key**: `STRIPE_MODE`
  - **Value**: `test` (for testing) or `live` (for production)
  - **Environment**: 
    - ☑ Production → Set to `live` when ready
    - ☑ Preview → Set to `test` (for testing preview deployments)
    - ☑ Development → Set to `test` (for local development)

### 4. Testing in Test Mode

1. Set `STRIPE_MODE=test` in Vercel (for Preview/Development environments)
2. Deploy or redeploy your application
3. Test payments using Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - See [Stripe Test Cards](https://stripe.com/docs/testing#cards)

### 5. Switching to Live Mode

**⚠️ IMPORTANT: Only switch to live mode when you're ready for real payments!**

1. In Vercel Dashboard → **Settings** → **Environment Variables**
2. Find `STRIPE_MODE` for **Production** environment
3. Change value from `test` to `live`
4. Click **Save**
5. **Redeploy** your production deployment:
   - Go to **Deployments** tab
   - Click **⋯** (three dots) on latest deployment
   - Click **Redeploy**

### 6. Verify Mode is Active

After deployment, check your server logs. You should see:
```
🔧 Stripe Mode: TEST
   Using keys: Test
```

or

```
🔧 Stripe Mode: LIVE
   Using keys: Live
```

## Local Development Setup

Create a `.env.local` file in your project root:

```env
# Stripe Mode (test or live)
STRIPE_MODE=test

# Test Keys
STRIPE_SECRET_KEY_TEST=sk_test_YOUR_TEST_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_YOUR_TEST_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET_TEST=whsec_YOUR_TEST_WEBHOOK_SECRET

# Live Keys (optional for local dev)
STRIPE_SECRET_KEY_LIVE=sk_live_YOUR_LIVE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET_LIVE=whsec_YOUR_LIVE_WEBHOOK_SECRET
```

## Environment-Specific Configuration

### Recommended Setup

| Environment | STRIPE_MODE | Use Case |
|------------|-------------|----------|
| **Development** (local) | `test` | Local testing |
| **Preview** (Vercel) | `test` | Testing before production |
| **Production** | `test` → `live` | Start with `test`, switch to `live` when ready |

### Switching Strategy

1. **Start with test mode everywhere** - Safe for development and initial testing
2. **Test thoroughly in preview deployments** - Use test mode to verify everything works
3. **Switch production to live mode** - Only when you're confident and ready for real payments

## Troubleshooting

### Issue: Payments not working

**Check:**
1. Verify `STRIPE_MODE` is set correctly
2. Check that the correct keys are set for the mode you're using
3. Check server logs for mode confirmation
4. Verify webhook secrets match your Stripe webhook configuration

### Issue: "Stripe secret key is not configured" warning

**Solution:**
- Make sure you've set both `STRIPE_SECRET_KEY_TEST` and `STRIPE_SECRET_KEY_LIVE`
- Or set `STRIPE_SECRET_KEY` as a fallback
- Check that environment variables are saved in Vercel

### Issue: Webhook not receiving events

**Solution:**
1. Verify `STRIPE_WEBHOOK_SECRET_TEST` or `STRIPE_WEBHOOK_SECRET_LIVE` matches your Stripe webhook
2. Make sure webhook URL in Stripe matches your Vercel domain
3. Check that webhook is configured for the correct mode (test vs live)

## Security Notes

- ✅ **Never commit** `.env.local` or `.env` files to git
- ✅ **Test keys** are safe to use in test mode (they can't process real payments)
- ✅ **Live keys** can process real payments - keep them secure!
- ✅ Use different webhook secrets for test and live modes
- ✅ Always test in test mode before switching to live mode

## Quick Reference

### Test Mode (Default)
```env
STRIPE_MODE=test
STRIPE_SECRET_KEY_TEST=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST=pk_test_...
STRIPE_WEBHOOK_SECRET_TEST=whsec_...
```

### Live Mode (Production)
```env
STRIPE_MODE=live
STRIPE_SECRET_KEY_LIVE=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_...
STRIPE_WEBHOOK_SECRET_LIVE=whsec_...
```

## Next Steps

1. ✅ Set up all environment variables in Vercel
2. ✅ Test payments in test mode
3. ✅ Verify webhooks are working
4. ✅ When ready, switch production to live mode
5. ✅ Monitor payments in Stripe Dashboard

For more information, see:
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)


