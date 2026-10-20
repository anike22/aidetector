# Agency Unlimited

$2,500 USD paid once through Paystack for 12 months of standard interactive website use. Five named users total, including owner. Client projects are included. No credit quota or monthly top-ups. API, automated bulk processing, resale, and credential sharing are excluded. Normal per-request limits and service availability apply.

## Activation and enforcement

- Server price catalog contains `agency_unlimited/year/usd`, amount 250000 minor units.
- Verified payment grants plan and one-year expiry atomically and idempotently. No monthly credit grant is created.
- Reservation RPC checks owner/member entitlement before trial and credit gating. Agency reservations have zero reserved credits and retain normal settlement and idempotency.
- Team owner can add four members through Dashboard → Team Credits & Seats. Members register with the exact added email. Removed or suspended members lose inherited access immediately.
- Expired or refunded owners lose access along with their members. Cancellation retains access until expiry. Existing paid plans remain metered. Upgrading from Business retains the earliest four active member seats and suspends extra seats so the owner plus members do not exceed five users.
- Available website aliases missing from the legacy rate table are authorized only for an active Agency Unlimited owner/member. Unknown operations fail closed.

## Delivery and refunds

Onboarding and editor training are arranged manually through billing@aidetector.cx. A buyer can request a full refund within 30 days of initial Agency Unlimited payment, providing registered email and payment reference. Staff process the refund through the original Paystack payment. Existing verified refund webhook revokes current-period access after a full processed refund. The general 14-day policy for other subscriptions remains unchanged.

## Verification

Run `node tests/billing/agency.cjs` and `pnpm run test:billing`. Agency tests cover price, currency, annual interval, replay/identity binding, zero-credit operation, website aliases, API/bulk exclusion, team seats, removal, cancellation, expiry, and refund status.
