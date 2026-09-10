import Stripe from 'npm:stripe@14.0.0';
import { createServiceClient } from './entitlements.ts';
import { paymentJson,verifyPaystack,verifyPaystackSignature,verifyStripeSession } from './payments.ts';
export async function paymentWebhook(req: Request, provider?: 'paystack'): Promise<Response> {
  if(req.method==='OPTIONS') return paymentJson({});
  if(req.method!=='POST') return paymentJson({error:'Method not allowed'},405);
  const raw=await req.text();
  const db=createServiceClient();
  let verified=false;
  try {
    const paystackSignature=req.headers.get('x-paystack-signature');
    if(provider==='paystack'||paystackSignature) {
      if(!await verifyPaystackSignature(raw,paystackSignature,Deno.env.get('PAYSTACK_SECRET_KEY'))) return paymentJson({error:'Invalid signature'},400);
      verified=true;
      const event=JSON.parse(raw);
      // Subscription creation and cancellation are not proof of a payment.
      if(event.event==='charge.success') {
        await verifyPaystack(db,event.data?.reference);
      }
      return paymentJson({received:true});
    }
    const secret=Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret=Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const signature=req.headers.get('stripe-signature');
    if(!secret||!webhookSecret||!signature) return paymentJson({error:'Webhook signature or configuration missing'},400);
    const stripe=new Stripe(secret,{apiVersion:'2023-10-16'});
    const event=await stripe.webhooks.constructEventAsync(raw,signature,webhookSecret);
    verified=true;
    if(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded') {
      const session=event.data.object as any;
      if(session.payment_status==='paid') await verifyStripeSession(db,stripe,session.id);
    }
    // Checkout currently sells fixed paid periods (mode=payment). Invoice and
    // subscription-created events must never mint additional plan credits.
    return paymentJson({received:true});
  } catch(error) {
    console.error('[payment-webhook]',error);
    return paymentJson({error:'Webhook processing failed; delivery can be retried'},verified?500:400);
  }
}
