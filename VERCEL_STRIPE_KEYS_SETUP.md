# Setting Stripe Live Keys in Vercel

## ⚠️ IMPORTANT: Never commit these keys to git!

Your Stripe keys are sensitive credentials. They should **ONLY** be set as environment variables in Vercel, never in your code.

## Step-by-Step: Add Stripe Keys to Vercel

### 1. Go to Vercel Dashboard
- Visit: https://vercel.com/dashboard
- Select your project: **coachify** (or your project name)

### 2. Navigate to Settings
- Click on your project
- Go to **Settings** tab
- Click on **Environment Variables** in the left sidebar

### 3. Add Your Stripe Keys

Add these **two** environment variables:

#### Variable 1: `STRIPE_SECRET_KEY`
- **Name**: `STRIPE_SECRET_KEY`
- **Value**: `sk_live_YOUR_SECRET_KEY_HERE` (use your actual secret key from Stripe Dashboard)
- **Environment**: Select **Production** (and optionally Preview/Development if you want)
- Click **Save**

#### Variable 2: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Name**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Value**: `pk_live_YOUR_PUBLISHABLE_KEY_HERE` (use your actual publishable key from Stripe Dashboard)
- **Environment**: Select **Production** (and optionally Preview/Development if you want)
- Click **Save**

### 4. Add Webhook Secret (if not already set)

If you haven't set up the webhook secret yet:
- **Name**: `STRIPE_WEBHOOK_SECRET`
- **Value**: Your webhook signing secret from Stripe Dashboard (starts with `whsec_`)
- **Environment**: Select **Production**
- Click **Save**

### 5. Redeploy Your Application

After adding the environment variables:
1. Go to the **Deployments** tab
2. Click the **⋯** (three dots) on your latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a new deployment

**Important**: Environment variables are only available to new deployments. You must redeploy after adding them.

## Verify the Setup

After redeploying, verify the keys are working:

1. **Check the build logs** - No errors about missing Stripe keys
2. **Test payment flow** - Try creating a test checkout session
3. **Check Stripe Dashboard** - Verify events are being received

## Security Checklist

✅ Keys are set in Vercel environment variables (not in code)  
✅ Keys are only added to Production environment (or specific environments as needed)  
✅ Keys are NOT committed to git  
✅ `.env.local` is in `.gitignore` (already done)  
✅ Webhook secret is also set as an environment variable  

## Additional Environment Variables You May Need

Make sure these are also set in Vercel:

- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook signing secret
- `NEXT_PUBLIC_BASE_URL` - Your production URL: `https://coachify-ed.vercel.app`

## Testing vs Production Keys

- **Test keys** (starts with `sk_test_` and `pk_test_`): Use for local development
- **Live keys** (starts with `sk_live_` and `pk_live_`): Use for production (Vercel)

You can set different keys for different environments in Vercel:
- **Production**: Use live keys
- **Preview**: Use test keys (optional)
- **Development**: Use test keys (optional)

## Need Help?

If you encounter issues:
1. Check Vercel deployment logs for errors
2. Verify the keys are correctly set in Vercel dashboard
3. Ensure you've redeployed after adding the variables
4. Check Stripe Dashboard for any API errors



