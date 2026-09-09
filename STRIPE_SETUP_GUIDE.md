# Stripe Setup Guide

## Error: "Invalid API Key provided: sk_test_mock"

This error occurs because the Stripe secret key hasn't been configured yet. Follow these steps to fix it:

## Step 1: Get Your Stripe Secret Key

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Sign in or create a free Stripe account
3. Copy your **Secret key** (starts with `sk_test_...` for test mode)

## Step 2: Add the Secret Key to Supabase

### Option A: Via Supabase Dashboard (Recommended)
1. Open your Supabase project dashboard
2. Navigate to **Edge Functions** → **Secrets**
3. Click **Add Secret**
4. Enter:
   - Name: `STRIPE_SECRET_KEY`
   - Value: Your Stripe secret key (paste the key from Step 1)
5. Click **Save**

### Option B: Via Supabase CLI (if you have it installed)
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_your_actual_key_here
```

## Step 3: Verify the Integration

1. Return to your app
2. Try upgrading to Pro or purchasing a product again
3. You should now be redirected to Stripe Checkout successfully

## Important Notes

- **Test Mode**: Use `sk_test_...` keys for testing (no real charges)
- **Production Mode**: Switch to `sk_live_...` keys when going live
- **Link.com**: Already enabled in the checkout configuration (payment_method_types: ['link', 'card'])
- **Security**: Never commit secret keys to your code repository

## Troubleshooting

If you still see errors after adding the key:
1. Verify the key starts with `sk_test_` or `sk_live_`
2. Check there are no extra spaces in the secret value
3. Redeploy the edge functions if needed
4. Clear your browser cache and try again

## Need Help?

- [Stripe Documentation](https://stripe.com/docs)
- [Supabase Edge Functions Secrets](https://supabase.com/docs/guides/functions/secrets)
