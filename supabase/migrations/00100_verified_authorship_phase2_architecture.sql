-- Verified Authorship Phase 2 Complete Database Schema & RLS

-- 1. Authorship Profiles
CREATE TABLE IF NOT EXISTS public.authorship_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  public_author_name TEXT NOT NULL,
  legal_name_private TEXT,
  profile_photo_url TEXT,
  country TEXT,
  biography TEXT,
  verified_email TEXT,
  visual_signature_data TEXT,
  visual_signature_type TEXT DEFAULT 'typed' CHECK (visual_signature_type IN ('typed', 'drawn', 'uploaded')),
  professional_title TEXT,
  organization TEXT,
  portfolio_url TEXT,
  personal_website TEXT,
  public_contact_email TEXT,
  orcid TEXT,
  social_links JSONB DEFAULT '[]'::jsonb,
  copyright_statement TEXT,
  field_privacy JSONB DEFAULT '{"legal_name_private":"private","verified_email":"private","public_contact_email":"public","country":"public","biography":"public","portfolio_url":"public","social_links":"public"}'::jsonb,
  attestation_accepted BOOLEAN DEFAULT false,
  attestation_version TEXT DEFAULT 'v1.0-2026',
  attestation_consent_at TIMESTAMPTZ,
  ip_address_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Authorship Records
CREATE TABLE IF NOT EXISTS public.authorship_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tracking_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  content_type TEXT NOT NULL DEFAULT 'article',
  language TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'current' CHECK (status IN ('current', 'previous', 'superseded', 'revoked', 'disputed', 'suspended')),
  current_version_id UUID,
  public_indexing_enabled BOOLEAN DEFAULT true,
  registered_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  suspended_at TIMESTAMPTZ,
  disputed_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_authorship_records_tracking_code ON public.authorship_records(tracking_code);
CREATE INDEX IF NOT EXISTS idx_authorship_records_owner ON public.authorship_records(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_authorship_records_status ON public.authorship_records(status);

-- 3. Authorship Private Content
CREATE TABLE IF NOT EXISTS public.authorship_content_private (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES public.authorship_records(id) ON DELETE CASCADE,
  version_id UUID,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_content TEXT,
  raw_content_backup TEXT,
  original_content_hash TEXT NOT NULL,
  canonical_content_hash TEXT NOT NULL,
  canonicalization_version TEXT NOT NULL DEFAULT 'v1.0',
  storage_object_path TEXT,
  encryption_key_version TEXT DEFAULT 'enc_v1',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_content_private_record ON public.authorship_content_private(record_id);
CREATE INDEX IF NOT EXISTS idx_content_private_hash ON public.authorship_content_private(canonical_content_hash);

-- 4. Authorship Manifests
CREATE TABLE IF NOT EXISTS public.authorship_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES public.authorship_records(id) ON DELETE CASCADE,
  version_id UUID,
  manifest_json JSONB NOT NULL,
  manifest_hash TEXT NOT NULL,
  platform_signature TEXT NOT NULL,
  signature_algorithm TEXT DEFAULT 'SHA256withECDSA-P256',
  signing_key_version TEXT DEFAULT 'key_2026_v1',
  signed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  timestamp_token TEXT,
  rfc3161_token JSONB,
  web3_attestation JSONB,
  validation_status TEXT DEFAULT 'valid' CHECK (validation_status IN ('valid', 'superseded', 'revoked', 'disputed'))
);

CREATE INDEX IF NOT EXISTS idx_authorship_manifests_record ON public.authorship_manifests(record_id);

-- 5. Authorship Verification Events (Public rate-limited telemetry without PII)
CREATE TABLE IF NOT EXISTS public.authorship_verification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code TEXT,
  verification_type TEXT NOT NULL DEFAULT 'public_lookup',
  match_result TEXT,
  matched_version TEXT,
  client_hash_received TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Authorship Audit Events
CREATE TABLE IF NOT EXISTS public.authorship_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID,
  version_id UUID,
  actor_user_id UUID,
  actor_role TEXT NOT NULL DEFAULT 'owner',
  event_type TEXT NOT NULL,
  event_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.authorship_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorship_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorship_content_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorship_manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorship_verification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorship_audit_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Authorship Profiles
DROP POLICY IF EXISTS "Public can view active author profiles" ON public.authorship_profiles;
CREATE POLICY "Public can view active author profiles"
  ON public.authorship_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Owners can manage their author profile" ON public.authorship_profiles;
CREATE POLICY "Owners can manage their author profile"
  ON public.authorship_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Authorship Records
DROP POLICY IF EXISTS "Public can view active authorship records" ON public.authorship_records;
CREATE POLICY "Public can view active authorship records"
  ON public.authorship_records FOR SELECT
  USING (status IN ('current', 'previous', 'superseded', 'revoked', 'disputed'));

DROP POLICY IF EXISTS "Owners can manage their authorship records" ON public.authorship_records;
CREATE POLICY "Owners can manage their authorship records"
  ON public.authorship_records FOR ALL
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- Authorship Content Private (CRITICAL: Never exposed to public)
DROP POLICY IF EXISTS "Only authenticated owners and admins view private content" ON public.authorship_content_private;
CREATE POLICY "Only authenticated owners and admins view private content"
  ON public.authorship_content_private FOR ALL
  USING (auth.uid() = owner_user_id OR public.is_authorship_admin())
  WITH CHECK (auth.uid() = owner_user_id OR public.is_authorship_admin());

-- Authorship Manifests
DROP POLICY IF EXISTS "Public can view verified manifests" ON public.authorship_manifests;
CREATE POLICY "Public can view verified manifests"
  ON public.authorship_manifests FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Owners can insert manifests" ON public.authorship_manifests;
CREATE POLICY "Owners can insert manifests"
  ON public.authorship_manifests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.authorship_records r
      WHERE r.id = authorship_manifests.record_id AND (r.owner_user_id = auth.uid() OR public.is_authorship_admin())
    )
  );

-- Authorship Verification Events
DROP POLICY IF EXISTS "Public can insert verification telemetry" ON public.authorship_verification_events;
CREATE POLICY "Public can insert verification telemetry"
  ON public.authorship_verification_events FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view verification telemetry" ON public.authorship_verification_events;
CREATE POLICY "Admins can view verification telemetry"
  ON public.authorship_verification_events FOR SELECT
  USING (public.is_authorship_admin() OR auth.uid() IS NOT NULL);

-- Authorship Audit Events
DROP POLICY IF EXISTS "Owners and admins can view audit events" ON public.authorship_audit_events;
CREATE POLICY "Owners and admins can view audit events"
  ON public.authorship_audit_events FOR SELECT
  USING (auth.uid() = actor_user_id OR public.is_authorship_admin());

DROP POLICY IF EXISTS "Users can insert audit events" ON public.authorship_audit_events;
CREATE POLICY "Users can insert audit events"
  ON public.authorship_audit_events FOR INSERT
  WITH CHECK (true);

-- RPC helper to compare content against record versions safely without exposing content
CREATE OR REPLACE FUNCTION public.compare_authorship_content(
  p_tracking_code TEXT,
  p_content_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rec RECORD;
  v_match RECORD;
BEGIN
  -- Lookup record
  SELECT id, tracking_code, status, current_version_id
  INTO v_rec
  FROM public.authorship_records
  WHERE tracking_code = p_tracking_code;

  IF NOT FOUND THEN
    -- Fallback to authorship_registrations if legacy tracking code
    SELECT id, tracking_code, status
    INTO v_rec
    FROM public.authorship_registrations
    WHERE tracking_code = p_tracking_code;

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'match_status', 'no_match',
        'details', 'Tracking code not found in registry.'
      );
    END IF;
  END IF;

  -- Check exact hash match in private content
  SELECT cp.version_id, cp.canonicalization_version, v.version_number
  INTO v_match
  FROM public.authorship_content_private cp
  LEFT JOIN public.authorship_versions v ON v.id = cp.version_id
  WHERE cp.record_id = v_rec.id AND (cp.canonical_content_hash = p_content_hash OR cp.original_content_hash = p_content_hash)
  LIMIT 1;

  IF FOUND THEN
    IF v_match.version_id = v_rec.current_version_id OR v_match.version_id IS NULL THEN
      RETURN jsonb_build_object(
        'match_status', 'exact_match_current',
        'version_number', COALESCE(v_match.version_number, 1),
        'canonicalization_version', v_match.canonicalization_version,
        'details', 'Exact cryptographic match confirmed with the current registered version.'
      );
    ELSE
      RETURN jsonb_build_object(
        'match_status', 'exact_match_earlier',
        'version_number', v_match.version_number,
        'canonicalization_version', v_match.canonicalization_version,
        'details', 'Exact cryptographic match confirmed with earlier registered version ' || v_match.version_number || '.'
      );
    END IF;
  END IF;

  -- Check legacy registrations
  IF EXISTS (
    SELECT 1 FROM public.authorship_registrations
    WHERE tracking_code = p_tracking_code AND content_hash = p_content_hash
  ) THEN
    RETURN jsonb_build_object(
      'match_status', 'exact_match_current',
      'version_number', 1,
      'canonicalization_version', 'v1.0',
      'details', 'Exact cryptographic match confirmed with registered version.'
    );
  END IF;

  RETURN jsonb_build_object(
    'match_status', 'no_match',
    'details', 'Submitted text hash does not match any registered version of this work.'
  );
END;
$$;
