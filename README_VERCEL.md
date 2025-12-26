# 🚀 Vercel Testing - Start Here!

**This is the fastest way to get testing set up on Vercel.**

## ⚡ 3-Step Setup (10 minutes)

### Step 1: Add Environment Variables to Vercel

Go to: **https://vercel.com/dashboard** → Your Project → **Settings** → **Environment Variables**

Add these **3 variables** (copy-paste):

1. **STRIPE_SECRET_KEY**
   ```
   sk_test_YOUR_SECRET_KEY_HERE
   ```
   *(Get from: Stripe Dashboard → Developers → API keys → Reveal test key)*
   ☑ Production ☑ Preview ☑ Development

2. **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
   ```
   pk_test_YOUR_PUBLISHABLE_KEY_HERE
   ```
   *(Get from: Stripe Dashboard → Developers → API keys)*
   ☑ Production ☑ Preview ☑ Development

3. **NEXT_PUBLIC_BASE_URL**
   ```
   https://coachify-ed.vercel.app
   ```
   ☑ Production ☑ Preview ☑ Development
   *(Replace with your actual Vercel URL if different)*

**Click "Save" for each, then Redeploy**

---

### Step 2: Create Stripe Webhook

1. Go to: **https://dashboard.stripe.com/test/webhooks**
2. Click **"Add endpoint"**
3. **URL**: `https://coachify-ed.vercel.app/api/webhooks/stripe`
4. **Events source**: "Connected and v2 accounts"
5. **Select events**:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `transfer.created`
   - `transfer.updated`
   - `account.updated`
   - `charge.refunded`
   - `charge.dispute.created`
   - `charge.dispute.updated`
6. Click **"Add endpoint"**
7. **Copy the webhook secret** (starts with `whsec_`)
8. **Add to Vercel** as `STRIPE_WEBHOOK_SECRET`
9. **Redeploy** again

---

### Step 3: Test It!

1. **Test webhook** in Stripe Dashboard → Should show ✅ Success
2. **Make test purchase** on your Vercel site
3. **Verify** in Stripe Dashboard → Should see payment with $6.00 fee (20%)

---

## 📚 More Details

- **Full setup guide**: [VERCEL_TESTING_SETUP.md](./VERCEL_TESTING_SETUP.md)
- **Quick checklist**: [VERCEL_CHECKLIST.md](./VERCEL_CHECKLIST.md)
- **Complete testing flow**: [TESTING_GUIDE.md](./TESTING_GUIDE.md)

---

**That's it! You're ready to test.** 🎉

