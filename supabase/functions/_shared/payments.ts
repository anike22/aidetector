import { createServiceClient } from './entitlements.ts';

export const paymentCors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature, x-paystack-signature',
};
export function paymentJson(data: unknown, status=200) {
  return new Response(JSON.stringify(data), {status,headers:{...paymentCors,'Content-Type':'application/json'}});
}
export function billingInterval(metadata: Record<string, any> = {}): 'month'|'year' {
  const value = String(metadata.interval ?? metadata.billing ?? 'month').toLowerCase();
  if (value === 'year' || value === 'annual') return 'year';
  if (value === 'month' || value === 'monthly') return 'month';
  throw new Error('Invalid billing interval');
}
export async function authenticatedBuyer(db: ReturnType<typeof createServiceClient>, req: Request) {
  const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
  const {data,error}=await db.auth.getUser(token);
  if (error || !data.user) throw new Error('Please sign in to verify this payment');
  return data.user;
}
export async function verifyPaystack(db: ReturnType<typeof createServiceClient>, reference: string, buyerId?: string) {
  if (!reference || reference.length>200) throw new Error('Invalid payment reference');
  const secret=Deno.env.get('PAYSTACK_SECRET_KEY');
  if (!secret) throw new Error('Paystack is not configured');
  const response=await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,{headers:{Authorization:`Bearer ${secret}`}});
  const payload=await response.json();
  if (!response.ok || !payload.status || payload.data?.status!=='success') throw new Error('Payment has not been confirmed by Paystack');
  const payment=payload.data;
  const metadata=typeof payment.metadata==='string' ? JSON.parse(payment.metadata) : payment.metadata||{};
  if (!metadata.user_id || !['upgrade','subscription'].includes(metadata.type)) throw new Error('Payment is not a subscription order');
  if (buyerId && metadata.user_id!==buyerId) throw new Error('Payment belongs to a different account');
  if (String(payment.reference)!==reference) throw new Error('Payment reference mismatch');
  const {data,error}=await db.rpc('apply_verified_subscription_payment',{
    p_provider:'paystack',p_payment_reference:reference,p_user_id:metadata.user_id,
    p_plan:String(metadata.plan||'').toLowerCase(),p_interval:billingInterval(metadata),
    p_amount_minor:Number(payment.amount),p_currency:String(payment.currency||'').toLowerCase(),
    p_paid_at:payment.paid_at,p_order_id:null,
  });
  if (error || data?.granted!==true) throw new Error(error?.message||'Payment confirmed but credit allocation is pending. Please retry.');
  return {verified:true,granted:true,plan_granted:true,metadata,amount:Number(payment.amount)/100,currency:payment.currency,...data};
}
export async function verifyStripeSession(db: ReturnType<typeof createServiceClient>, stripe: any, sessionId: string, buyerId?: string) {
  const session=await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status!=='paid') throw new Error('Payment has not been confirmed by Stripe');
  const {data:order,error:orderError}=await db.from('orders').select('id,user_id,metadata,items,status').eq('stripe_session_id',session.id).single();
  if (orderError || !order || buyerId && order.user_id!==buyerId) throw new Error('Payment order not found for this account');
  const metadata=order.metadata||{};
  if (!metadata.plan) {
    // Preserve one-off marketplace purchases; they do not grant a subscription.
    const {error}=await db.from('orders').update({status:'completed',completed_at:new Date().toISOString()}).eq('id',order.id);
    if (error) throw error;
    return {verified:true,granted:false,metadata,amount:session.amount_total/100,currency:session.currency};
  }
  const paymentId=typeof session.payment_intent==='string' ? session.payment_intent : session.payment_intent?.id;
  if (!paymentId) throw new Error('Stripe payment intent missing');
  const intent=await stripe.paymentIntents.retrieve(paymentId);
  if (intent.status!=='succeeded') throw new Error('Stripe payment is not settled');
  const {data,error}=await db.rpc('apply_verified_subscription_payment',{
    p_provider:'stripe',p_payment_reference:paymentId,p_user_id:order.user_id,
    p_plan:String(metadata.plan).toLowerCase(),p_interval:billingInterval(metadata),
    p_amount_minor:Number(intent.amount_received),p_currency:String(intent.currency).toLowerCase(),
    p_paid_at:new Date(intent.created*1000).toISOString(),p_order_id:order.id,
  });
  if (error || data?.granted!==true) throw new Error(error?.message||'Credit allocation pending; please retry');
  return {verified:true,granted:true,metadata,amount:intent.amount_received/100,currency:intent.currency,...data};
}

// Require a complete signature even when a provider secret was not configured.
export async function verifyPaystackSignature(body: string,signature: string|null,secret: string|undefined) {
  if (!secret || !signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-512'},false,['verify']);
  const bytes=Uint8Array.from(signature.match(/../g)!,v=>parseInt(v,16));
  return crypto.subtle.verify('HMAC',key,bytes,new TextEncoder().encode(body));
}
