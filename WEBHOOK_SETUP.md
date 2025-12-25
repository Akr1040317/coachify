# Stripe Webhook Setup Guide

## Why Webhooks Are Required

Webhooks are **essential** for your payment system to work correctly. They allow Stripe to notify your application in real-time when:
- Payments are completed
- Refunds are processed
- Chargebacks/disputes occur
- Coach accounts are updated
- Payouts are processed

**Without webhooks configured, payments won't be recorded in your database!**

## Production Webhook Setup (Required)

### Step 1: Create Webhook Endpoint in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Enter your endpoint URL:
   ```
   https://coachify-ed.vercel.app/api/webhooks/stripe
   ```
   (Replace with your actual production domain)

### Step 2: Select Required Events

Select these events (you can select multiple):

**Payment Events:**
- ✅ `checkout.session.completed` - When a payment is completed
- ✅ `payment_intent.succeeded` - When payment succeeds

**Connect Account Events:**
- ✅ `account.updated` - When coach's Stripe account status changes

**Transfer/Payout Events:**
- ✅ `transfer.created` - When payout transfer is created
- ✅ `transfer.paid` - When payout is successfully sent
- ✅ `transfer.failed` - When payout fails

**Refund/Dispute Events:**
- ✅ `charge.refunded` - When a refund is processed
- ✅ `charge.dispute.created` - When a chargeback/dispute is initiated
- ✅ `charge.dispute.updated` - When dispute status changes

### Step 3: Copy Webhook Signing Secret

1. After creating the endpoint, click on it
2. Find the **Signing secret** section
3. Click **Reveal** and copy the secret (starts with `whsec_`)
4. It will look like: `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 4: Add to Vercel Environment Variables

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **coachify**
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (paste the secret you copied)
   - **Environment**: Production (and Preview if you want)
5. Click **Save**

### Step 5: Redeploy

After adding the webhook secret:
1. Go to **Deployments** tab
2. Click **⋯** (three dots) on latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger deployment

## Testing Webhooks

### Test Webhook Delivery

1. In Stripe Dashboard → **Webhooks** → Click your endpoint
2. Click **Send test webhook**
3. Select an event (e.g., `checkout.session.completed`)
4. Click **Send test webhook**
5. Check the **Logs** tab to see if it was delivered successfully

### Verify Webhook is Working

1. Make a test purchase on your site
2. Check Stripe Dashboard → **Webhooks** → Your endpoint → **Logs**
3. You should see successful webhook deliveries
4. Check your Firestore database - a `purchase` record should be created

## Webhook Events Your App Handles

Your webhook handler (`/api/webhooks/stripe/route.ts`) processes:

| Event | What It Does |
|-------|-------------|
| `checkout.session.completed` | Creates purchase record, adds to pending payout, enrolls student in course |
| `payment_intent.succeeded` | Verifies payment status |
| `transfer.created` | Records payout creation |
| `transfer.paid` | Marks payout as paid |
| `transfer.failed` | Marks payout as failed, adds funds back to pending |
| `account.updated` | Updates coach's Stripe Connect status |
| `charge.refunded` | Updates purchase status, reverses coach earnings |
| `charge.dispute.created` | Creates dispute record, alerts admin |
| `charge.dispute.updated` | Updates dispute status, handles resolution |

## Troubleshooting

### Webhook Not Receiving Events

1. **Check endpoint URL**: Must match exactly (including https://)
2. **Check webhook secret**: Must match in Vercel environment variables
3. **Check Stripe Dashboard**: Go to Webhooks → Your endpoint → Logs
4. **Check Vercel logs**: Go to your deployment → Functions → View logs

### "Webhook signature verification failed"

- **Cause**: `STRIPE_WEBHOOK_SECRET` doesn't match Stripe's signing secret
- **Fix**: Copy the correct secret from Stripe Dashboard and update Vercel

### Webhook Returns 500 Error

- Check Vercel function logs for detailed error messages
- Verify all environment variables are set
- Check that Firestore security rules allow webhook operations

### Events Not Being Processed

- Verify events are selected in Stripe Dashboard
- Check webhook logs in Stripe Dashboard for delivery status
- Check your server logs for processing errors

## Security Notes

⚠️ **Important**: 
- Never expose your webhook signing secret
- Always verify webhook signatures (your code does this automatically)
- Use HTTPS for webhook endpoints (Vercel provides this automatically)
- The webhook secret is different for test vs live mode

## Next Steps

After setting up webhooks:
1. ✅ Test with a small purchase
2. ✅ Verify purchase record is created in Firestore
3. ✅ Verify coach's pending payout is updated
4. ✅ Monitor webhook logs for any errors

Your payment system is now fully configured! 🎉
