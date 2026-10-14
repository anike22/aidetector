CREATE POLICY no_direct_client_mailbox_access ON outreach_private.mailbox AS RESTRICTIVE FOR ALL TO authenticated USING(false) WITH CHECK(false);
CREATE POLICY no_direct_client_oauth_state_access ON outreach_private.oauth_states AS RESTRICTIVE FOR ALL TO authenticated USING(false) WITH CHECK(false);
ALTER TABLE public.admin_outreach_settings ADD COLUMN gmail_history_id text, ADD COLUMN history_snapshot text, ADD COLUMN delta_cursor text;
