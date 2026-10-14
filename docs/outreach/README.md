# Affiliate outreach dashboard

The owner researches and prepares prospect records externally, then imports them into `/admin/outreach`. The sending runtime calls Gmail directly and has no OpenAI dependency.

## Release and connection

1. Apply the two `admin_affiliate_outreach` / `outreach_explicit_private_access_denial` migrations. They are already applied to production `opivtrfgurwndilnbfmm` for this release. The campaign starts paused with no queue entries or active scheduler.
2. Deploy `admin-outreach` with `verify_jwt=false`. This is intentional: the same handler receives Google's OAuth callback and the private scheduler. Every admin action explicitly verifies the Supabase JWT and the database admin role. Scheduled runs require the high-entropy worker token; OAuth callbacks require a one-time, ten-minute state and PKCE verifier.
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Edge Function secrets if they are not already configured. The UI reports whether both are present. Never place the client secret in frontend environment variables.
4. Register `https://opivtrfgurwndilnbfmm.supabase.co/functions/v1/admin-outreach?action=callback` as an authorized redirect URI in that Google OAuth web client. Configure Gmail API access and the send/readonly scopes in the Google Cloud consent configuration as required by Google.
5. Publish the reviewed frontend, sign in as an administrator, and select **Connect partnerships Gmail**. Choose exactly `partnerships@aidetector.cx`. This is independent of ChatGPT's Gmail connector.
6. Finish the initial mailbox scan. A private 15-minute scheduler advances the scan in bounded pages after connection; the scan button can advance it manually. Sending is locked until it finishes. Gmail History is then used to synchronize new messages, with a new full scan if Google's cursor expires.
7. Import verified prospect JSON (see dashboard example), inspect each source and exact email, then approve. Enable the reviewed queue when ready. The scheduler processes up to four approvals per run during 08:00–21:00 Africa/Lagos, with at most 50 initial attempts reserved per Lagos day. Pausing stops sending while mailbox synchronization continues.

## Safety and operational behavior

- The branded template is copied from approved Gmail message `1a12f1ddfc7268d2`. Only its subject, greeting and researched introduction vary. Those fields are header-validated/HTML-escaped. Template/term changes require owner approval.
- Initial imports reject duplicate email addresses and repeated source organizations. Sending checks current Gmail correspondence and drafts immediately before first contact, including Spam and Trash.
- Previous sent messages and local attempts enforce a three-attempt maximum per address. Bounces and explicit opt-outs are permanently suppressed. Delivery delays stop further copies and require review.
- Atomic database claims reserve the daily cap and prevent overlapping workers from sending the same queue item. Interrupted or ambiguous sends are not automatically retried. The campaign pauses; a human reconciles the deterministic RFC Message-ID against Gmail Sent.
- Gmail acceptance is recorded separately from delivery evidence. The dashboard never treats an accepted send as confirmed inbox delivery and does not invent open rates.
- Mailbox credentials live in Supabase Vault, never in a browser. Only checked server calls can read/update them. API data is limited to administrators. Unrelated historical mailbox body text is not retained.
- Inbound bodies render as text. They never become instructions, change commercial terms, modify credentials, grant account credits or cause automatic replies. Human replies become drafts requiring approval.
- No real emails were sent during implementation/testing. The migrations and scheduler transaction tests roll back all synthetic test data.

## Validation

`npx vitest run src/test/adminOutreachSafety.test.ts src/test/adminOutreachDatabase.test.ts src/test/adminOutreachPage.test.tsx`

`npx deno check --no-lock --node-modules-dir=manual supabase/functions/admin-outreach/index.ts`

`npm run build:production`

A Google OAuth connection and an explicitly approved real-message test remain necessary to validate live sending and Gmail receipt end-to-end; unit/database tests are not a delivery test.
