create table user_intelligence_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  customer_profile_id uuid references customer_profiles(id) on delete set null,
  subscription_plan text,
  lifecycle_stage text,
  country text,
  language text,
  device text,
  browser text,
  referral_source text,
  utm_source text,
  organization_type text,
  ai_confidence_score integer not null default 0 check (ai_confidence_score between 0 and 100),
  static_attributes jsonb not null default '{}',
  behavioral_signals jsonb not null default '{}',
  predictions jsonb not null default '{}',
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table behavior_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  event_category text not null,
  event_data jsonb not null default '{}',
  session_id text,
  device_info jsonb not null default '{}',
  processed boolean not null default false,
  created_at timestamptz not null default now()
);

create table personalized_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  subtype text not null,
  title text not null,
  description text,
  reason text,
  context_path text,
  score integer not null default 0 check (score between 0 and 100),
  dismissed boolean not null default false,
  accepted boolean not null default false,
  shown boolean not null default false,
  shown_at timestamptz,
  clicked_at timestamptz,
  accepted_at timestamptz,
  dismissed_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table recommendation_events (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references personalized_recommendations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('impression','click','accept','dismiss')),
  context text,
  created_at timestamptz not null default now()
);

create table user_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prediction_type text not null,
  score integer not null default 0 check (score between 0 and 100),
  value numeric,
  confidence integer not null default 0 check (confidence between 0 and 100),
  features jsonb not null default '{}',
  triggered boolean not null default false,
  triggered_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, prediction_type)
);

create table personalization_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  dashboard_layout jsonb not null default '{}',
  hidden_widgets text[] not null default '{}',
  homepage_variant text,
  opt_out boolean not null default false,
  reduced_motion boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table personalization_config (
  id integer primary key default 1 check (id = 1),
  model_settings jsonb not null default '{}',
  thresholds jsonb not null default '{}',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table recommendation_analytics_daily (
  date date primary key,
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  accepts bigint not null default 0,
  dismissals bigint not null default 0,
  conversions bigint not null default 0,
  revenue_influenced numeric not null default 0,
  feature_adoptions bigint not null default 0,
  retention_improvements bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table prediction_accuracy_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prediction_type text not null,
  predicted_score integer not null,
  outcome boolean,
  outcome_at timestamptz,
  created_at timestamptz not null default now()
);

CREATE INDEX idx_user_intelligence_profiles_user_id ON user_intelligence_profiles(user_id);
CREATE INDEX idx_user_intelligence_profiles_customer_profile_id ON user_intelligence_profiles(customer_profile_id);
CREATE INDEX idx_user_intelligence_profiles_ai_confidence ON user_intelligence_profiles(ai_confidence_score);
CREATE INDEX idx_behavior_events_user_id ON behavior_events(user_id);
CREATE INDEX idx_behavior_events_event_type ON behavior_events(event_type);
CREATE INDEX idx_behavior_events_created_at ON behavior_events(created_at);
CREATE INDEX idx_behavior_events_processed ON behavior_events(processed, created_at);
CREATE INDEX idx_personalized_recommendations_user_id ON personalized_recommendations(user_id);
CREATE INDEX idx_personalized_recommendations_active ON personalized_recommendations(user_id, dismissed, accepted, expires_at);
CREATE INDEX idx_recommendation_events_rec_id ON recommendation_events(recommendation_id);
CREATE INDEX idx_recommendation_events_user_id ON recommendation_events(user_id);
CREATE INDEX idx_user_predictions_user_id ON user_predictions(user_id);
CREATE INDEX idx_user_predictions_type ON user_predictions(user_id, prediction_type);
CREATE INDEX idx_prediction_accuracy_user_id ON prediction_accuracy_logs(user_id);
CREATE INDEX idx_prediction_accuracy_type ON prediction_accuracy_logs(user_id, prediction_type);

alter table user_intelligence_profiles enable row level security;
alter table behavior_events enable row level security;
alter table personalized_recommendations enable row level security;
alter table recommendation_events enable row level security;
alter table user_predictions enable row level security;
alter table personalization_settings enable row level security;
alter table personalization_config enable row level security;
alter table recommendation_analytics_daily enable row level security;
alter table prediction_accuracy_logs enable row level security;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE POLICY "Users can view own intelligence profile"
  ON user_intelligence_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can insert own intelligence profile"
  ON user_intelligence_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own intelligence profile"
  ON user_intelligence_profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own behavior events"
  ON behavior_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can insert own behavior events"
  ON behavior_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own recommendations"
  ON personalized_recommendations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can view own recommendation events"
  ON recommendation_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can insert own recommendation events"
  ON recommendation_events FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own predictions"
  ON user_predictions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can manage own personalization settings"
  ON personalization_settings FOR ALL
  TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "Only admins can manage personalization config"
  ON personalization_config FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Only admins can view analytics"
  ON recommendation_analytics_daily FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Only admins can view prediction accuracy logs"
  ON prediction_accuracy_logs FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert prediction accuracy logs"
  ON prediction_accuracy_logs FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

insert into personalization_config (id, model_settings, thresholds)
values (1, '{"recommendation_models":{"product":true,"upgrade":true,"content":true,"action":true},"prediction_models":{"upgrade":true,"churn":true,"renewal":true,"clv":true,"feature_adoption":true,"support_risk":true,"api_growth":true,"high_value":true},"learning_enabled":true}'::jsonb, '{"high_churn_risk":70,"high_upgrade_probability":60,"low_renewal_probability":40,"high_support_risk":50,"api_quota_threshold":0.8,"detector_quota_threshold":0.8,"recommendation_ttl_hours":168,"max_recommendations_per_user":8}'::jsonb)
on conflict (id) do nothing;

CREATE OR REPLACE FUNCTION public.record_behavior_event(
  p_user_id uuid,
  p_event_type text,
  p_event_category text,
  p_event_data jsonb default '{}',
  p_session_id text default null,
  p_device_info jsonb default '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_event_id uuid;
begin
  insert into behavior_events (user_id, event_type, event_category, event_data, session_id, device_info)
  values (p_user_id, p_event_type, p_event_category, p_event_data, p_session_id, p_device_info)
  returning id into v_event_id;
  return v_event_id;
end;
$$;

CREATE OR REPLACE FUNCTION public.refresh_intelligence_profile(
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_customer_profile_id uuid;
  v_cp record;
begin
  select * into v_cp from customer_profiles where user_id = p_user_id;
  if found then
    insert into user_intelligence_profiles (
      user_id, customer_profile_id, subscription_plan, lifecycle_stage, country, language,
      referral_source, utm_source, static_attributes
    )
    values (
      p_user_id, v_cp.id, v_cp.subscription_plan, v_cp.lifecycle_stage, v_cp.country, v_cp.language,
      v_cp.first_referrer, v_cp.first_utm_source,
      jsonb_build_object(
        'email_verified', v_cp.email_verified,
        'signup_at', v_cp.signup_at,
        'last_login_at', v_cp.last_login_at,
        'engagement_score', v_cp.engagement_score,
        'lifetime_value', v_cp.lifetime_value,
        'total_spend', v_cp.total_spend
      )
    )
    on conflict (user_id) do update set
      customer_profile_id = EXCLUDED.customer_profile_id,
      subscription_plan = EXCLUDED.subscription_plan,
      lifecycle_stage = EXCLUDED.lifecycle_stage,
      country = EXCLUDED.country,
      language = EXCLUDED.language,
      referral_source = EXCLUDED.referral_source,
      utm_source = EXCLUDED.utm_source,
      static_attributes = EXCLUDED.static_attributes,
      last_updated = now();
  end if;
end;
$$;

CREATE OR REPLACE FUNCTION public.sync_customer_profile_to_intelligence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  perform public.refresh_intelligence_profile(NEW.user_id);
  return NEW;
end;
$$;

CREATE OR REPLACE TRIGGER customer_profiles_intelligence_sync
AFTER INSERT OR UPDATE ON customer_profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_customer_profile_to_intelligence();

CREATE OR REPLACE FUNCTION public.update_behavioral_signals(
  p_user_id uuid,
  p_signals jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_existing jsonb;
  v_confidence int;
begin
  select behavioral_signals into v_existing from user_intelligence_profiles where user_id = p_user_id;
  if found then
    update user_intelligence_profiles
    set behavioral_signals = behavioral_signals || p_signals,
        last_updated = now()
    where user_id = p_user_id;
  else
    insert into user_intelligence_profiles (user_id, behavioral_signals)
    values (p_user_id, p_signals);
  end if;

  select behavioral_signals into v_existing from user_intelligence_profiles where user_id = p_user_id;
  v_confidence := least(100, greatest(0, (select count(*) from jsonb_object_keys(coalesce(v_existing,'{}')))) * 5);
  update user_intelligence_profiles set ai_confidence_score = v_confidence where user_id = p_user_id;
end;
$$;

CREATE OR REPLACE FUNCTION public.record_recommendation_event(
  p_recommendation_id uuid,
  p_user_id uuid,
  p_action text,
  p_context text default null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  insert into recommendation_events (recommendation_id, user_id, action, context)
  values (p_recommendation_id, p_user_id, p_action, p_context);

  if p_action = 'impression' then
    update personalized_recommendations set shown = true, shown_at = now() where id = p_recommendation_id and user_id = p_user_id;
  elsif p_action = 'click' then
    update personalized_recommendations set clicked_at = now() where id = p_recommendation_id and user_id = p_user_id;
  elsif p_action = 'accept' then
    update personalized_recommendations set accepted = true, accepted_at = now() where id = p_recommendation_id and user_id = p_user_id;
  elsif p_action = 'dismiss' then
    update personalized_recommendations set dismissed = true, dismissed_at = now() where id = p_recommendation_id and user_id = p_user_id;
  end if;
end;
$$;

CREATE OR REPLACE FUNCTION public.upsert_prediction(
  p_user_id uuid,
  p_prediction_type text,
  p_score int,
  p_value numeric default null,
  p_confidence int default 50,
  p_features jsonb default '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_threshold int;
  v_existing_score int;
  v_already_triggered boolean;
  v_config jsonb;
begin
  select thresholds, model_settings into v_config from personalization_config where id = 1;
  if not coalesce((v_config->'prediction_models'->p_prediction_type)::boolean, true) then
    return;
  end if;

  v_threshold := case p_prediction_type
    when 'churn' then (v_config->>'high_churn_risk')::int
    when 'upgrade' then (v_config->>'high_upgrade_probability')::int
    when 'renewal' then (v_config->>'low_renewal_probability')::int
    when 'support_risk' then (v_config->>'high_support_risk')::int
    else null
  end;

  select score, triggered into v_existing_score, v_already_triggered
  from user_predictions where user_id = p_user_id and prediction_type = p_prediction_type;

  insert into user_predictions (user_id, prediction_type, score, value, confidence, features, expires_at)
  values (p_user_id, p_prediction_type, p_score, p_value, p_confidence, p_features, now() + interval '7 days')
  on conflict (user_id, prediction_type) do update set
    score = EXCLUDED.score,
    value = EXCLUDED.value,
    confidence = EXCLUDED.confidence,
    features = EXCLUDED.features,
    updated_at = now(),
    expires_at = EXCLUDED.expires_at;

  if v_threshold is not null then
    if (p_prediction_type in ('churn','support_risk') and p_score >= v_threshold and not v_already_triggered)
       or (p_prediction_type = 'upgrade' and p_score >= v_threshold and not v_already_triggered)
       or (p_prediction_type = 'renewal' and p_score <= v_threshold and not v_already_triggered) then
      update user_predictions set triggered = true, triggered_at = now()
      where user_id = p_user_id and prediction_type = p_prediction_type;
      insert into automation_events (event_type, user_id, event_data, processed)
      values ('prediction_'||p_prediction_type, p_user_id, jsonb_build_object('score', p_score), false);
    end if;
  end if;
end;
$$;

CREATE OR REPLACE FUNCTION public.aggregate_personalization_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_date date := current_date - interval '1 day';
  v_impressions bigint;
  v_clicks bigint;
  v_accepts bigint;
  v_dismissals bigint;
begin
  select
    count(*) filter (where action='impression'),
    count(*) filter (where action='click'),
    count(*) filter (where action='accept'),
    count(*) filter (where action='dismiss')
  into v_impressions, v_clicks, v_accepts, v_dismissals
  from recommendation_events
  where date_trunc('day', created_at) = v_date;

  insert into recommendation_analytics_daily (
    date, impressions, clicks, accepts, dismissals
  ) values (v_date, v_impressions, v_clicks, v_accepts, v_dismissals)
  on conflict (date) do update set
    impressions = EXCLUDED.impressions,
    clicks = EXCLUDED.clicks,
    accepts = EXCLUDED.accepts,
    dismissals = EXCLUDED.dismissals,
    updated_at = now();
end;
$$;