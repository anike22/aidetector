# Atomic automation restoration — 2026-10-08
Destination: aidetector-repair-test (opivtrfgurwndilnbfmm).

## Restored and active
automation-event-processor and automation-scheduler are deployed at version 1 and connected to their existing one-minute schedules. Requests authenticate with a dedicated random server-only token kept in Vault; only its SHA-256 digest is in source. Invalid credentials return HTTP 401. The endpoints are restricted to this destination project.

The event processor holds all work when no active workflows exist, and filters events using the fixed deployment cutoff 2026-10-08 08:00:49.329441+00. The 246 migrated pending events remain held. No historical replay was enabled.

Two new SECURITY INVOKER RPCs are granted only to service_role: process_queued_automation_event and advance_automation_execution. Each claims its row with FOR UPDATE SKIP LOCKED. Queued-event processing creates executions against the original event ID and acknowledges the event in the same transaction, retaining the audit row. Workflow advancement includes database action writes, logs, billing and durable progress in one transaction; a crash rolls the transaction back. Completed and future-delayed executions are not claimable.

The scheduler saves the billing reservation ID with execution context. It charges at the first successful advancement, including a delayed chunk, as the previous worker did, and reuses that reservation on resume. A failed first chunk rolls back new reservation and balance changes. Prior successful chunks remain committed if a later chunk fails. Delayed resumes recheck active Business entitlement. This is one credit per execution, not one credit per resume.

Only transaction-local database actions are supported. Email sending, webhooks and other external delivery are rejected until a transactional outbox is implemented; there is no external message delivery in this repair.

The missing automation_run rate was restored from current master migration 00142: one credit per operation, Business minimum, no trial. ON CONFLICT DO NOTHING preserves any existing rate. All other rates retain checksum 07b4a06e2b154c55670e8f8062bd4a54.

## Verification
15 live database regression cases passed in a transaction that rolled back all fixture changes. These covered history cutoff, absent workflows, event creation/replay/audit retention, initial charge, delay progress, not-yet-due execution, resume/replay/reservation reuse, malformed workflow rollback, unsupported-action rollback, a real internal-note action, Free-plan rejection and expired-plan rejection. Tests temporarily changed one profile only inside the rollback transaction; no fixture edits were committed.

Four live HTTP checks passed: both authorized endpoint calls returned 200, and both invalid-token calls returned 401. The event response held work for no active workflows; the scheduler reported zero executions.

A two-session MCP concurrency probe did not observe overlapping sessions, so it was not counted as a passing concurrency test. Row-lock behavior follows the PostgreSQL transaction implementation; simultaneous end-to-end load verification remains pending. Earlier local candidate-handler tests do not certify the final standalone deployed handlers.

Final preserved checksums:
- Profiles: 025a901c546bc141382d2b5c2d40f14a
- Events: b650ff817d49ae8c31e1bbd7d0e4e538
- Reservations: e4da6b43da7324d56e336b452ec742fd
- Ledger: 4a096a3204cc5efb59d0953856709576
- Pending events: 246; workflow definitions: 0; executions: 0.

Only the two repaired cron commands changed. They now call the repair project explicitly and read the dedicated token from Vault; their original one-minute frequency is preserved. Existing application Edge Functions, account balances and production connections remain unchanged.

## Remaining
Five missing worker services still require restoration: refresh-customer-insights, automation-time-event-generator, personalization (two schedules), team-invitation-processor and team-analytics-aggregator. Their staged candidates are not deployed; their old cron configuration has not been repaired. Review unchecked customer writes, preserve valid authenticated personalization callers and invitation consent, and finish generator deduplication before activation.

The WordPress download URL fix remains draft PR #13. Full frontend build, sign-in/payment/credit/isolation verification, held history exclusions and separate production cutover approval remain outstanding.

The local workspace runtime disconnected after database tests, before endpoint setup. Work continued through connected Supabase and GitHub services; applied migration history and deployed source are preserved in this branch.
