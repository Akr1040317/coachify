# ✅ Vercel Setup Checklist

Use this checklist to ensure everything is set up correctly.

## Environment Variables in Vercel

- [ ] `STRIPE_SECRET_KEY` = `sk_test_...` *(Get from Stripe Dashboard → Developers → API keys)*
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_test_...` *(Get from Stripe Dashboard → Developers → API keys)*
- [ ] `NEXT_PUBLIC_BASE_URL` = `https://coachify-ed.vercel.app` (or your actual domain)
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_...` (from Stripe Dashboard)
- [ ] All variables set for ☑ Production ☑ Preview (and Development if needed)
- [ ] Redeployed after adding variables

## Stripe Webhook Setup

- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] Endpoint URL: `https://coachify-ed.vercel.app/api/webhooks/stripe` (correct domain?)
- [ ] Events source: "Connected and v2 accounts" selected
- [ ] Events selected:
  - [ ] `checkout.session.completed`
  - [ ] `payment_intent.succeeded`
  - [ ] `transfer.created`
  - [ ] `transfer.updated`
  - [ ] `account.updated`
  - [ ] `charge.refunded`
  - [ ] `charge.dispute.created`
  - [ ] `charge.dispute.updated`
- [ ] Webhook secret copied to Vercel `STRIPE_WEBHOOK_SECRET`
- [ ] Test webhook sent successfully (check Stripe Dashboard → Logs)

## Verification Tests

- [ ] Test webhook delivery shows ✅ Success in Stripe Dashboard
- [ ] Vercel deployment successful (no errors)
- [ ] Can access site at Vercel URL
- [ ] Can sign up as coach
- [ ] Can complete coach onboarding
- [ ] Can set up Stripe Connect (test account)
- [ ] Can create a course
- [ ] Can sign up as student
- [ ] Can purchase course with test card `4242 4242 4242 4242`
- [ ] Purchase appears in Stripe Dashboard
- [ ] Application fee shows correctly (20%)
- [ ] Purchase record created in Firestore `purchases` collection
- [ ] Coach pending payout updated in Firestore

## Quick Test Commands

After setup, verify with these:

1. **Check Vercel Environment Variables:**
   - Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables
   - Verify all 4 variables are present

2. **Check Stripe Webhook:**
   - Go to: https://dashboard.stripe.com/test/webhooks
   - Click your endpoint → Check "Logs" tab
   - Should see test webhook delivery

3. **Test Purchase:**
   - Make a test purchase
   - Check Stripe Dashboard → Payments → Should see payment with application fee
   - Check Stripe Dashboard → Webhooks → Logs → Should see `checkout.session.completed` event

## Common Issues

- **"Webhook signature verification failed"** → Webhook secret doesn't match
- **"Coach payment account not set up"** → Coach needs to complete Stripe Connect onboarding
- **Purchase not appearing in Firestore** → Webhook not receiving events (check Stripe Dashboard logs)
- **Application fee not showing** → Check Stripe Dashboard → Payment → Application fee field

---

**Once all checkboxes are ✅, you're ready to test!**

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for complete testing flow.

