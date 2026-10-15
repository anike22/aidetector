import {describe,it,expect} from 'vitest';
import {onboardingMessage,retryable} from '../../supabase/functions/affiliate-onboarding/core';
const snapshot={name:'<script>alert(1)</script>',email:'partner@example.com',link_id:'89e17d58-3b22-4b8f-8e89-bfd8c1175ade',commission_rate:0.30,attribution_days:30,hold_days:30,minimum_payout:50,currency:'USD'};
describe('affiliate activation email',()=>{
 it('escapes personal data and includes the exact personal links and usable credit instructions',()=>{
 const message=onboardingMessage(snapshot);
 expect(message.html).not.toContain('<script>');
 expect(message.html).toContain('&lt;script&gt;');
 expect(message.text).toContain('300 complimentary testing credits');
 expect(message.text).toContain('https://www.aidetector.cx/affiliates/dashboard');
 expect(message.text).toContain('/ai-checker-for-bloggers?aff='+snapshot.link_id);
 expect(message.text).toContain('/signup?aff='+snapshot.link_id);
 expect(message.text).toContain('30% recurring');
 expect(message.text).toContain('do not refill automatically');
 });
 it('rejects tracking-link injection',()=>expect(()=>onboardingMessage({...snapshot,link_id:'" onclick="evil'})).toThrow());
 it('retries only rate limits and server failures',()=>{expect(retryable(429)).toBe(true);expect(retryable(503)).toBe(true);expect(retryable(400)).toBe(false);expect(retryable(403)).toBe(false);});
});
