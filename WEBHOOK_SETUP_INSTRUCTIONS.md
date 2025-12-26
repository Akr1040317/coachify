# Quick Webhook Setup Instructions

## Step 1: Update .env.local with Your Stripe Keys

Open your `.env.local` file and add/update these values:

```env
# Stripe Test Mode Keys
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE

# Webhook Secret (you'll get this in Step 2)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# App Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Step 2: Set Up Webhook Listener

You have Stripe CLI installed! Here's how to set it up:

### Option A: Use the Setup Script (Easiest)

1. **Make sure your Next.js server is running:**
   ```bash
   npm run dev
   ```

2. **In a NEW terminal window, run:**
   ```bash
   ./setup-webhook.sh
   ```

3. **You'll see output like this:**
   ```
   > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
   ```

4. **Copy the webhook secret** (starts with `whsec_`)

5. **Add it to your `.env.local` file:**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

6. **Restart your Next.js server** so it picks up the new webhook secret

### Option B: Manual Setup

1. **Make sure your Next.js server is running:**
   ```bash
   npm run dev
   ```

2. **In a NEW terminal window, run:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Copy the webhook secret** from the output (starts with `whsec_`)

4. **Add it to `.env.local`** and restart your server

## Step 3: Test the Webhook

1. Make a test purchase (use test card: `4242 4242 4242 4242`)
2. Watch the terminal where `stripe listen` is running
3. You should see webhook events being received

## Troubleshooting

- **"Command not found"**: Install Stripe CLI: https://stripe.com/docs/stripe-cli
- **"Port already in use"**: Make sure port 3000 is free, or change the port in the command
- **Webhook not receiving events**: Make sure both servers are running (Next.js + Stripe CLI)

## Keep Webhook Running

**Important**: Keep the `stripe listen` command running while testing. It needs to stay active to forward webhooks to your local server.

You can stop it anytime with `Ctrl+C` and restart it when needed.

