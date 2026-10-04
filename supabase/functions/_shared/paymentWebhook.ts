import { createServiceClient } from './entitlements.ts';
import { paymentJson,verifyPaystack,verifyPaystackSignature } from './payments.ts';
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
      } else if(event.event==='refund.processed') {
        const reference=event.data?.transaction?.reference;
        if(!reference) throw new Error('Paystack reversal is missing the original payment reference');
        const {data:reversal,error:reversalError}=await db.rpc('reverse_affiliate_commission',{p_provider:'paystack',p_payment_reference:String(reference),p_reason:event.event});
        if(reversalError) throw reversalError;
        if(reversal?.reason==='payout_reserved') throw new Error(`Affiliate commission requires retry after payout settlement: ${reversal.reason}`);
      }
      return paymentJson({received:true});
    }
    return paymentJson({error:'Unsupported payment provider'},400);
  } catch(error) {
    console.error('[payment-webhook]',error);
    return paymentJson({error:'Webhook processing failed; delivery can be retried'},verified?500:400);
  }
}
