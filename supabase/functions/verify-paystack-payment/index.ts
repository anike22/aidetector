import { createServiceClient } from '../_shared/entitlements.ts';
import { authenticatedBuyer,paymentJson,verifyPaystack } from '../_shared/payments.ts';
Deno.serve(async req=>{
  if(req.method==='OPTIONS') return paymentJson({});
  if(req.method!=='POST') return paymentJson({error:'Method not allowed'},405);
  try {
    const db=createServiceClient();
    const buyer=await authenticatedBuyer(db,req);
    const {reference}=await req.json();
    return paymentJson({data:await verifyPaystack(db,reference,buyer.id)});
  } catch(error) { return paymentJson({error:{message:error instanceof Error?error.message:'Payment verification failed'}},400); }
});
