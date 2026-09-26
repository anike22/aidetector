import Stripe from 'npm:stripe@14.0.0';
import { createServiceClient } from '../_shared/entitlements.ts';
import { authenticatedBuyer,paymentJson,verifyStripeSession } from '../_shared/payments.ts';
Deno.serve(async req=>{
  if(req.method==='OPTIONS') return paymentJson({});
  if(req.method!=='POST') return paymentJson({error:'Method not allowed'},405);
  try {
    const db=createServiceClient();
    const buyer=await authenticatedBuyer(db,req);
    const secret=Deno.env.get('STRIPE_SECRET_KEY');
    if(!secret) throw new Error('Stripe is not configured');
    const stripe=new Stripe(secret,{apiVersion:'2023-10-16'});
    const {sessionId}=await req.json();
    return paymentJson({data:await verifyStripeSession(db,stripe,sessionId,buyer.id)});
  } catch(error) { return paymentJson({error:{message:error instanceof Error?error.message:'Payment verification failed'}},400); }
});
