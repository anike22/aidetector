Growth implementation

Backend deployed: isolated mailbox credentials/history/queue, shared suppressions, cross-mailbox duplicate guard, GROWTH10 checkout and verified payment grants.

Offer: 10% off first three monthly payments for first-time paying customers. Annual plans excluded. Redemption closes 14 November 2026 at 16:48 UTC. Standard plan credits remain unchanged. Open discounted checkouts are reused for 24 hours.

Growth is paused pending owner review and Google authorization. Initial cap: 10/day, four per batch, 08:00–21:00 Africa/Lagos. Affiliate campaign remains enabled.

Validation: 8 UI/safety tests passed; Vite build and three Deno function checks passed. Rollback-only database tests passed for discounted amount, open checkout reuse, amount tamper rejection, replay idempotency, three discounts then full price, and cross-mailbox duplicate block. No test payments, offers or quotes persisted. Live unauthenticated calls returned 401. Whole-repository TypeScript reports existing errors in imageAltSeo, SignupPage and analysisEngine; no errors in changed files.

Frontend changes are committed locally on feat/growth-outreach. Push blocked by automatic approval review requiring explicit authorization to export source to GitHub.
