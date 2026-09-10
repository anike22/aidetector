import { paymentWebhook } from '../_shared/paymentWebhook.ts';
Deno.serve(req=>paymentWebhook(req,'paystack'));
