# AIEVERYDAY partner API and affiliate dashboard implementation

Status: SPECIFICATION ONLY — DO NOT DISPLAY "ACTIVE" OR ISSUE KEYS UNTIL END-TO-END TESTS PASS.

## Account
Affiliate user ID: 28703673-8b82-4d93-aa3f-ff82d5fe99b5
Registered email: weili@aieveryday.net
Affiliate application: Approved
Website testing credits: 300 (observed 2026-10-24)
Referral link: exists
No partner API key issued.

## Affiliate dashboard (owner-scoped)
Add an 'API Integration' section visible only to approved partners explicitly granted API access.
Display endpoint, sample request, summary response, remaining pilot quota, usage logs, allowed domains, key created/last used/revoked, and a "Generate API key" action requiring recent sign-in. Reveal each secret ONCE, display only prefix/suffix afterwards. Offer key rotation and revocation. No service-role keys or detector internals exposed. Distinguish API calls from website credits.

## Endpoint
POST /functions/v1/partner-detector
Authorization: Bearer <partner-specific-secret>
Body: {"text":"...","idempotency_key":"uuid"}
Return: request_id, summary (balanced_ai_percent, strict_ai_percent, language, provisional verdict), result_url, remaining_requests, expires_at.
No sentence highlights, passages, supplied raw text, hidden heuristics, or detailed analysis in API response. Require minimum text and <=5,000 words. Show score uncertainty and avoid asserting AI authorship as fact.

## Security and atomic accounting
Do NOT expose existing detector or run-detector functions directly.
Create scoped partner credentials stored as hashes, not plaintext. Enforce active/revoked status and exact owner/partner feature scopes.
Database-side atomic quota reservation and idempotency, 100-request pilot cap, conservative burst/rate limits, size cap, fail-closed behavior, and usage audit without storing submitted text in usage logs.
Never bill existing website testing credits for partner API calls without explicit policy agreement.
Use production engine adapters without changing detector scoring.

## Full analysis
Create a server-side saved result with random unguessable ID, access token stored hashed, bounded expiration, and explicit retention/deletion policy. Store raw text and detailed results only as needed with private RLS controls, never in query parameters. Public link shows safe limited preview; authenticate users and verify entitlements before detailed access. Carry affiliate code through signup and purchases with existing attribution policy. Do not pretend /detector is a saved-result page.

## Verification gates
1. Unauthenticated, invalid, revoked and wrong-account key calls -> rejected.
2. 100 unique allowed calls consume <=100 quotas; duplicate idempotency reuses prior response.
3. Concurrent requests cannot exceed quota.
4. Response contains summary only, no detailed evidence.
5. Result URL exists, links to the *correct* scan, and respects access rules and expiry.
6. No credits deducted from existing 300 affiliate website credits.
7. Old detector frontend/Balanced/Aggressive behavior unchanged.
8. Only after all tests pass, expose key issuance and setup instructions on Wei Li's affiliate dashboard.

## Partner-specific initial rollout
Limit to AIEVERYDAY; require manual admin enablement for other partners.
The partner's GPT Action may use an authenticated server-side secret only if its secret storage is protected; never embed it in public GPT instructions or client-side JavaScript.
