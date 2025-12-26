# Vercel Environment Variables Setup

## Required Environment Variables

Add these environment variables in your Vercel project settings:

### Stripe Configuration (Test Mode)

```
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_... (get from Stripe Dashboard after creating webhook)
```

**Get your keys from:** Stripe Dashboard → Developers → API keys (make sure you're in Test Mode)

### App Configuration

```
NEXT_PUBLIC_BASE_URL=https://coachify-ed.vercel.app
```
(Replace with your actual Vercel domain if different)

## How to Add in Vercel

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** > **Environment Variables**
4. Add each variable:
   - **Key**: Variable name (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`)
   - **Value**: Variable value
   - **Environment**: Select which environments (Production, Preview, Development)
5. Click **Save**
6. Redeploy your application

## Security Notes

- ✅ Never commit `.env.local` or `.env` files to git
- ✅ Use different Stripe keys for production vs development
- ✅ Keep `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` secret
- ✅ Firebase config is hardcoded in the codebase (safe to expose - protected by Security Rules)

## After Adding Variables

After adding environment variables, trigger a new deployment:
- Go to **Deployments** tab
- Click **Redeploy** on the latest deployment
- Or push a new commit to trigger automatic deployment


