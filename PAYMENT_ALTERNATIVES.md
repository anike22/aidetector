# Payment Alternatives for Nigeria

Currently, the platform's built-in 1-click integration skill only supports **Stripe**. However, Stripe is not natively available for businesses registered in Nigeria without using services like Stripe Atlas.

If you need a payment gateway that works in Nigeria, we have three main alternatives we can pursue:

## 1. Manual Paystack Integration (Recommended)
Paystack is one of the most popular and reliable payment gateways in Nigeria and across Africa. 
- **What we'll do**: I can manually write custom Supabase Edge Functions and React frontend code to integrate the Paystack Checkout API.
- **What you need**: A free [Paystack account](https://paystack.com/) and your API Secret and Public keys.

## 2. Manual Flutterwave Integration
Flutterwave is another excellent gateway that supports Nigerian Naira (NGN) and multiple other African currencies.
- **What we'll do**: Similar to Paystack, I can write custom Edge Functions to process payments via Flutterwave.
- **What you need**: A free [Flutterwave account](https://flutterwave.com/) and your API keys.

## 3. Mock Payment Flow (For Testing)
If you are currently just building and testing the UI/UX of your application and don't want to deal with real money or API keys yet.
- **What we'll do**: I can replace the Stripe checkout button with a custom modal that simulates a successful or failed payment, allowing you to test the post-purchase logic (like granting Pro access or downloading marketplace items).

## How to Proceed
Please reply in the chat with which option you would prefer, and I will begin the custom implementation!
