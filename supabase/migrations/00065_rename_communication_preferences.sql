ALTER TABLE public.user_communication_preferences RENAME TO communication_preferences;

ALTER TABLE public.communication_preferences RENAME COLUMN email TO email_enabled;
ALTER TABLE public.communication_preferences RENAME COLUMN in_app TO in_app_enabled;
ALTER TABLE public.communication_preferences RENAME COLUMN dashboard_announcements TO dashboard_announcements_enabled;

ALTER TABLE public.communication_preferences ADD COLUMN id uuid DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE public.communication_preferences ADD COLUMN created_at timestamp with time zone DEFAULT now() NOT NULL;

ALTER TABLE public.communication_preferences DROP CONSTRAINT user_communication_preferences_pkey;
ALTER TABLE public.communication_preferences ADD PRIMARY KEY (id);
ALTER TABLE public.communication_preferences ADD CONSTRAINT communication_preferences_user_id_key UNIQUE (user_id);

ALTER TABLE public.communication_preferences ALTER COLUMN quiet_hours_start DROP NOT NULL;
ALTER TABLE public.communication_preferences ALTER COLUMN quiet_hours_end DROP NOT NULL;
ALTER TABLE public.communication_preferences ALTER COLUMN timezone DROP NOT NULL;

ALTER TABLE public.communication_preferences ADD CONSTRAINT communication_preferences_max_messages_check CHECK (max_messages_per_day BETWEEN 1 AND 100);

DROP POLICY IF EXISTS user_communication_preferences_own ON public.communication_preferences;
CREATE POLICY communication_preferences_own ON public.communication_preferences
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR is_lifecycle_admin())
  WITH CHECK (user_id = auth.uid() OR is_lifecycle_admin());

CREATE POLICY communication_preferences_anon ON public.communication_preferences
  FOR ALL TO anon
  USING (false)
  WITH CHECK (false);

ALTER TABLE public.communication_preferences ENABLE ROW LEVEL SECURITY;