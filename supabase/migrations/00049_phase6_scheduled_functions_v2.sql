-- Phase 6 scheduled jobs and helper functions

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Table for daily analytics snapshots
CREATE TABLE IF NOT EXISTS public.organization_analytics_snapshots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL DEFAULT current_date,
  metrics jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, snapshot_date)
);

ALTER TABLE public.organization_analytics_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS analytics_snapshots_org_admin ON public.organization_analytics_snapshots;
CREATE POLICY analytics_snapshots_org_admin
  ON public.organization_analytics_snapshots
  FOR ALL
  TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

-- Process pending organization invitations by matching email to existing users.
CREATE OR REPLACE FUNCTION public.process_pending_invitations()
RETURNS TABLE(processed_count int, failed_count int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_processed int := 0;
  v_failed int := 0;
  rec record;
  v_user_id uuid;
BEGIN
  FOR rec IN
    SELECT i.id, i.organization_id, i.email, i.role, i.token
    FROM public.organization_invitations i
    WHERE i.accepted_at IS NULL
      AND i.expires_at > now()
  LOOP
    SELECT id INTO v_user_id FROM auth.users WHERE email = rec.email LIMIT 1;
    IF v_user_id IS NULL THEN
      v_failed := v_failed + 1;
      CONTINUE;
    END IF;

    BEGIN
      INSERT INTO public.organization_members (organization_id, user_id, role, status)
      VALUES (rec.organization_id, v_user_id, rec.role, 'active')
      ON CONFLICT (organization_id, user_id) DO NOTHING;

      UPDATE public.organization_invitations
      SET accepted_at = now()
      WHERE id = rec.id;

      v_processed := v_processed + 1;
    EXCEPTION WHEN OTHERS THEN
      v_failed := v_failed + 1;
    END;
  END LOOP;

  RETURN QUERY SELECT v_processed, v_failed;
END;
$$;

-- Aggregate daily analytics for all organizations and store a snapshot.
CREATE OR REPLACE FUNCTION public.aggregate_organization_analytics_daily()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org record;
  metrics jsonb;
BEGIN
  FOR org IN SELECT id FROM public.organizations WHERE status = 'active' LOOP
    SELECT row_to_json(a.*)::jsonb INTO metrics
    FROM public.get_organization_analytics(org.id) a;

    INSERT INTO public.organization_analytics_snapshots (organization_id, snapshot_date, metrics)
    VALUES (org.id, current_date, COALESCE(metrics, '{}'))
    ON CONFLICT (organization_id, snapshot_date)
    DO UPDATE SET metrics = EXCLUDED.metrics, created_at = now();
  END LOOP;
END;
$$;

-- Cron jobs invoking Edge Functions via pg_net.
SELECT cron.schedule(
  'team-invitation-processor',
  '0 * * * *',
  $$
  select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/team-invitation-processor',
      headers := jsonb_build_object(
        'Content-type', 'application/json',
        'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
      ),
      body := concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);

SELECT cron.schedule(
  'team-analytics-aggregator',
  '0 2 * * *',
  $$
  select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/team-analytics-aggregator',
      headers := jsonb_build_object(
        'Content-type', 'application/json',
        'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
      ),
      body := concat('{"date": "', current_date, '"}')::jsonb
  ) as request_id;
  $$
);
