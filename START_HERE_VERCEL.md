# 🎯 START HERE - Vercel Testing Setup

**Everything you need to test on Vercel in 3 simple steps.**

## ✅ What I've Done For You

- ✅ Your Stripe test keys are documented below (ready to copy-paste)
- ✅ All setup guides created
- ✅ Webhook configuration documented
- ✅ Testing checklist ready

## 📋 What You Need to Do (3 Steps, ~10 minutes)

### Step 1: Add Environment Variables to Vercel ⏱️ 5 min

**Go to:** https://vercel.com/dashboard → Your Project → **Settings** → **Environment Variables**

**Add these 3 variables** (copy-paste the values):

| Variable Name | Value | Environments |
|--------------|-------|--------------|
| `STRIPE_SECRET_KEY` | `sk_test_YOUR_SECRET_KEY_HERE` *(Get from Stripe Dashboard)* | ☑ Production ☑ Preview ☑ Development |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_YOUR_PUBLISHABLE_KEY_HERE` *(Get from Stripe Dashboard)* | ☑ Production ☑ Preview ☑ Development |
| `NEXT_PUBLIC_BASE_URL` | `https://coachify-ed.vercel.app` | ☑ Production ☑ Preview ☑ Development |

*(Replace `coachify-ed.vercel.app` with your actual Vercel domain if different)*

**After adding → Click "Redeploy" on latest deployment**

---

### Step 2: Create Stripe Webhook ⏱️ 3 min

**Go to:** https://dashboard.stripe.com/test/webhooks

1. Click **"Add endpoint"**
2. **Endpoint URL**: `https://coachify-ed.vercel.app/api/webhooks/stripe`
   - ⚠️ Replace domain if yours is different
3. **Description**: `Coachify Webhook`
4. **Events source**: Select **"Connected and v2 accounts"**
5. **Select these events** (search and check):
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `transfer.created`
   - ✅ `transfer.updated`
   - ✅ `account.updated`
   - ✅ `charge.refunded`
   - ✅ `charge.dispute.created`
   - ✅ `charge.dispute.updated`
6. Click **"Add endpoint"**
7. **Copy the webhook secret** (starts with `whsec_`)
8. **Go back to Vercel** → Add as `STRIPE_WEBHOOK_SECRET`
9. **Redeploy** again

---

### Step 3: Verify Setup ⏱️ 2 min

1. **Test webhook** in Stripe Dashboard:
   - Click your endpoint → "Send test webhook"
   - Select `checkout.session.completed` → Send
   - Check Logs tab → Should show ✅ Success

2. **Done!** You're ready to test.

---

## 🧪 Quick Test

1. Go to your Vercel site: `https://coachify-ed.vercel.app`
2. Sign up as coach → Complete onboarding
3. Set up Stripe Connect (use test data from TESTING_GUIDE.md)
4. Create a course ($29.99)
5. Sign up as student → Purchase course
6. Use test card: `4242 4242 4242 4242`
7. **Verify**: Stripe Dashboard → Payments → Should see $6.00 application fee (20%)

---

## 📚 Need More Help?

- **Quick checklist**: [VERCEL_CHECKLIST.md](./VERCEL_CHECKLIST.md)
- **Detailed guide**: [VERCEL_TESTING_SETUP.md](./VERCEL_TESTING_SETUP.md)
- **Complete testing flow**: [TESTING_GUIDE.md](./TESTING_GUIDE.md)

---

**That's it! Total time: ~10 minutes** ⏱️

