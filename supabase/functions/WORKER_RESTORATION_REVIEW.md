# Scheduled worker restoration: work in progress

Baseline: anike22/aidetector master 45cf716730b67e5c98fd9cf35e4524fbd7830c8a (2026-10-07 release). Destination: aidetector-repair-test / opivtrfgurwndilnbfmm. Candidates are not deployed or enabled.

Completed preparation:
- Seven worker candidates require a server-only BACKGROUND_WORKER_TOKEN of at least 32 characters via x-background-worker-token before constructing a privileged client. Missing credentials/configuration fail closed. The shared npm Supabase dependency is pinned to 2.103.1, the version already used by current personalization source.
- Event processing checks RPC errors, keeps processed rows as audit history, holds work when no active workflows exist, and requires an explicit AUTOMATION_EVENT_PROCESSING_START_AT cutoff to protect migrated historical events.
- Inactivity candidates use distinct bounded 7–8 day and 30–31 day windows, including signup_at when last_login_at is null. The absent run_sql RPC is no longer needed. Query failures are reported as failed responses.
- The scheduler candidate includes an execution-specific billing idempotency key, skips duplicate-submission responses rather than failing the original execution, and checks successful settlement and resume errors.

13 focused regression cases pass using the actual candidate handlers with injected clients. They cover all seven authorization gates, event retention on failure/success, history cutoff, absent workflows, inactivity windows/signup fallback, and query failure status. They are local handler tests, not live full-stack certification. Run: node supabase/functions/worker_regressions.mjs.

Activation blockers:
1. The event processor still needs atomic database claim/process/acknowledgment. Its current two-call processing/acknowledgment sequence can duplicate execution after a crash, concurrent invocation, or acknowledgement failure. The existing process_automation_event RPC creates a new event rather than operating on a queued event ID.
2. Scheduler progress needs a durable claim/lease and a persisted reservation across delayed resumes. The billing RPC intentionally rejects repeated idempotency keys; merely passing a stable key prevents double reservation but does not recover/resume an existing reservation. Shared executeSingleExecution also returns normally after some failed statuses, and can misreport settlement success. Failure-side settlement/status errors are still suppressed. Do not activate it.
3. Destination credit_rate_table has no automation_run row. Source migration/export specifies Business minimum, one credit per operation, no trial. Restore only this missing row after reviewing against current policy; do not overwrite current billing rates.
4. Background authentication must be provisioned into both server secrets and Vault, and cron headers must be changed. No secret values are included here. Existing cron commands send only a missing publishable key.
5. Personalization also serves action=process and must be checked for authenticated frontend callers. The staged service-only gate is suitable for daily/aggregate jobs but may block valid user processing; separate authenticated-user handling is required before deployment.
6. Team-invitation processing automatically accepts invitations for matching accounts in the current database RPC. Preserve intended consent and onboarding behavior before activation. There are currently zero active pending invitations.
7. Customer refresh and personalization contain additional unchecked database writes/RPC results. Verify partial-failure handling before calling their jobs healthy.

Current destination state: 246 unprocessed events, zero workflow definitions and executions, no Vault entries. Event checksum b650ff817d49ae8c31e1bbd7d0e4e538. All existing cron jobs and deployed functions remain unchanged in this phase. Production cutover and automated message delivery are outside this preparation step.
