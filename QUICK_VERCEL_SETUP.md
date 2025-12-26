# ⚡ Quick Vercel Setup - Copy & Paste

## Step 1: Vercel Environment Variables (Copy These)

Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

Add these **4 variables**:

### 1. STRIPE_SECRET_KEY
```
sk_test_YOUR_SECRET_KEY_HERE
```
*(Get from: Stripe Dashboard → Developers → API keys → Reveal test key)*
☑ Production ☑ Preview ☑ Development

### 2. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```
pk_test_YOUR_PUBLISHABLE_KEY_HERE
```
*(Get from: Stripe Dashboard → Developers → API keys → Publishable key)*
☑ Production ☑ Preview ☑ Development

### 3. NEXT_PUBLIC_BASE_URL
```
https://coachify-ed.vercel.app
```
☑ Production ☑ Preview ☑ Development
(Replace with your actual Vercel URL if different)

### 4. STRIPE_WEBHOOK_SECRET
```
whsec_YOUR_SECRET_HERE
```
☑ Production ☑ Preview
(You'll get this in Step 2)

**After adding first 3 → Redeploy**

---

## Step 2: Stripe Webhook Setup

### A. Create Webhook Endpoint

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. **Endpoint URL**: `https://coachify-ed.vercel.app/api/webhooks/stripe`
   - ⚠️ Replace domain if yours is different
4. **Description**: `Coachify Webhook`
5. **Events source**: Select **"Connected and v2 accounts"**
6. **API version**: `2025-12-15.clover` (or latest)

### B. Select These Events

Search and check these events:
- ✅ `checkout.session.completed`
- ✅ `payment_intent.succeeded`
- ✅ `transfer.created`
- ✅ `transfer.updated`
- ✅ `account.updated`
- ✅ `charge.refunded`
- ✅ `charge.dispute.created`
- ✅ `charge.dispute.updated`

Click **"Add endpoint"**

### C. Copy Webhook Secret

1. Click on your new endpoint
2. Find **"Signing secret"**
3. Click **"Reveal"**
4. Copy the secret (starts with `whsec_`)

### D. Add to Vercel

1. Go back to Vercel → Environment Variables
2. Add/Update `STRIPE_WEBHOOK_SECRET` with the secret
3. Click **Save**
4. **Redeploy** again

---

## Step 3: Test It

1. **Test Webhook:**
   - Stripe Dashboard → Webhooks → Your endpoint
   - Click **"Send test webhook"**
   - Select `checkout.session.completed`
   - Click **"Send test webhook"**
   - Check Logs tab → Should show ✅ Success

2. **Make Test Purchase:**
   - Go to your Vercel site
   - Sign up as coach → Complete onboarding → Set up payments
   - Create a course ($29.99)
   - Sign up as student → Purchase course
   - Use test card: `4242 4242 4242 4242`

3. **Verify:**
   - Stripe Dashboard → Payments → Should see payment
   - Check "Application fee" = $6.00 (20% of $29.99)
   - Stripe Dashboard → Webhooks → Logs → Should see deliveries
   - Firestore → `purchases` collection → Should see record

---

## ✅ Done!

Your Vercel deployment is now ready for testing!

**Total time:** ~10 minutes
**Manual steps:** Just copy-paste the values above

