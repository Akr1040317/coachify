# Quick Guide: Switching Between Test and Live Mode

## Current Status

Your application supports both test and live Stripe keys. The mode is controlled by the `STRIPE_MODE` environment variable.

## Quick Switch in Vercel

### To Test Mode (Default)
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find `STRIPE_MODE`
3. Set value to: `test`
4. Select environments: ☑ Production ☑ Preview ☑ Development
5. Click **Save**
6. Redeploy your application

### To Live Mode (Production)
⚠️ **Only switch when ready for real payments!**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find `STRIPE_MODE`
3. Set value to: `live`
4. Select environment: ☑ Production (only!)
5. Click **Save**
6. Go to Deployments → Click **⋯** → **Redeploy**

## Required Environment Variables

Make sure you have **both** test and live keys set in Vercel:

### Test Keys
- `STRIPE_SECRET_KEY_TEST`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST`
- `STRIPE_WEBHOOK_SECRET_TEST`

### Live Keys
- `STRIPE_SECRET_KEY_LIVE`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE`
- `STRIPE_WEBHOOK_SECRET_LIVE`

### Mode Control
- `STRIPE_MODE` = `test` or `live`

## Verify Mode

After deployment, check your server logs. You should see:
- `🔧 Stripe Mode: TEST` (for test mode)
- `🔧 Stripe Mode: LIVE` (for live mode)

## Full Documentation

See [STRIPE_TEST_LIVE_SETUP.md](./STRIPE_TEST_LIVE_SETUP.md) for complete setup instructions.




