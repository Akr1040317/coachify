# Vercel Environment Variables Setup

## Required Environment Variables

Add these environment variables in your Vercel project settings:

### Firebase Configuration

1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Add the following variables (use `NEXT_PUBLIC_` prefix for client-side variables):

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCiJaNpyvQGJf2_1F5Qat1-ynoB9ClmU5o
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=coachify-21435.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=coachify-21435
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=coachify-21435.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=274999680644
NEXT_PUBLIC_FIREBASE_APP_ID=1:274999680644:web:2d09f4b311573322f4acd1
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-8D9MWSN2KH
```

### Stripe Configuration

```
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_... for production)
```

### App Configuration

```
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
```

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
- ✅ Firebase config is safe to expose (it's public client config)
- ✅ Keep `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` secret

## After Adding Variables

After adding environment variables, trigger a new deployment:
- Go to **Deployments** tab
- Click **Redeploy** on the latest deployment
- Or push a new commit to trigger automatic deployment
