export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
}
export function onboardingMessage(snapshot: Record<string, any>) {
  if (!/^[0-9a-f-]{36}$/i.test(snapshot.link_id)) throw new Error('Invalid tracking link');
  const base = 'https://www.aidetector.cx';
  const product = `${base}/ai-checker-for-bloggers?aff=${snapshot.link_id}`;
  const signup = `${base}/signup?aff=${snapshot.link_id}`;
  const dashboard = `${base}/affiliates/dashboard`;
  const name = String(snapshot.name || 'Partner').trim().split(/\s+/)[0];
  const rate = Number(snapshot.commission_rate);
  const commission = rate <= 1 ? rate * 100 : rate;
  const text = `Hello ${name},\n\nYour AIDetector.cx affiliate account (${snapshot.email}) is approved and active. Your one-time 300 complimentary testing credits are available; any credits already used remain deducted. These replace the five-check introductory limit while you test, and do not refill automatically.\n\n1. Sign in with your registered email. Refresh your dashboard or sign out and back in to load updated access.\n2. Test the product with your own content. AI Checker for Bloggers costs 30 credits per report; other tools use their displayed credit costs.\n3. Open your affiliate dashboard: ${dashboard}\n4. Share the complete personal links below, keeping the ?aff= parameter intact.\n\nAI Checker for Bloggers: ${product}\nGeneral signup: ${signup}\n\nEarn ${commission}% recurring commission on eligible attributed subscription payments while the qualifying subscriptions remain active. Attribution window: ${snapshot.attribution_days} days. Commission holding period: ${snapshot.hold_days} days. Minimum approved payout: ${snapshot.currency} ${snapshot.minimum_payout}. Submit payment details when you reach the payout threshold.\n\nPlease recommend the product based on your independent experience, disclose your affiliate relationship, and avoid unverified accuracy claims. Positive coverage is not required. Reply if you need help.\n\nBest regards,\nAnike Tobechukwu\nFounder, AIDetector.cx`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:auto;color:#334155;line-height:1.65"><div style="border-bottom:1px solid #e5e7eb;padding:16px 0"><img src="${base}/favicon.png" width="40" height="40" alt="AIDetector.cx" style="vertical-align:middle"> <strong>AIDetector.cx</strong></div>${text.split('\n\n').map(p => `<p>${escapeHtml(p).replace(/https:\/\/[^\s<]+/g, url => `<a href="${url}">${url}</a>`).replace(/\n/g,'<br>')}</p>`).join('')}</div>`;
  return {subject:'Your AIDetector.cx affiliate account is approved — testing credits and referral links',html,text};
}
export function retryable(status: number) { return status === 429 || status >= 500; }
