-- ─── Verified Authorship Database Schema & RLS Policies ──────────────────────────

-- 1. Authorship Platform Settings (Singleton configuration for thresholds)
CREATE TABLE IF NOT EXISTS public.authorship_platform_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    balanced_ai_threshold_max NUMERIC(5,2) NOT NULL DEFAULT 50.00,
    plagiarism_originality_min NUMERIC(5,2) NOT NULL DEFAULT 90.00,
    duplicate_similarity_threshold NUMERIC(5,2) NOT NULL DEFAULT 95.00,
    registration_credit_cost INTEGER NOT NULL DEFAULT 5,
    allow_collaborators BOOLEAN NOT NULL DEFAULT true,
    max_file_size_mb INTEGER NOT NULL DEFAULT 15,
    signing_key_id TEXT NOT NULL DEFAULT 'key_v2026_01',
    signing_key_active BOOLEAN NOT NULL DEFAULT true,
    last_rotated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

INSERT INTO public.authorship_platform_settings (
    id, balanced_ai_threshold_max, plagiarism_originality_min, duplicate_similarity_threshold, registration_credit_cost
) VALUES (
    'default', 50.00, 90.00, 95.00, 5
) ON CONFLICT (id) DO UPDATE SET updated_at = now();

-- 2. Authorship Registrations Table
CREATE TABLE IF NOT EXISTS public.authorship_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    tracking_code TEXT UNIQUE NOT NULL,
    content_hash TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    category TEXT,
    language TEXT NOT NULL DEFAULT 'en',
    word_count INTEGER NOT NULL DEFAULT 0,
    char_count INTEGER NOT NULL DEFAULT 0,
    claimed_creation_date DATE,
    published_url TEXT,
    citations JSONB NOT NULL DEFAULT '[]'::jsonb,
    collaborators JSONB NOT NULL DEFAULT '[]'::jsonb,
    tags TEXT[] NOT NULL DEFAULT '{}'::text[],
    raw_content TEXT NOT NULL,
    document_name TEXT,
    document_mime_type TEXT,
    document_storage_path TEXT,
    private_evidence_notes TEXT,
    private_evidence_files JSONB NOT NULL DEFAULT '[]'::jsonb,
    creation_declaration JSONB NOT NULL,
    declaration_signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    integrity_gate_results JSONB NOT NULL,
    balanced_ai_score NUMERIC(5,2) NOT NULL,
    aggressive_ai_score NUMERIC(5,2) NOT NULL,
    plagiarism_originality_score NUMERIC(5,2) NOT NULL,
    duplicate_check_result TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_conflict_review', 'suspended', 'revoked')),
    revocation_reason TEXT,
    revoked_at TIMESTAMPTZ,
    suspension_reason TEXT,
    suspended_at TIMESTAMPTZ,
    current_version_number INTEGER NOT NULL DEFAULT 1,
    view_count INTEGER NOT NULL DEFAULT 0,
    lookup_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_authorship_registrations_user_id ON public.authorship_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_authorship_registrations_tracking_code ON public.authorship_registrations(tracking_code);
CREATE INDEX IF NOT EXISTS idx_authorship_registrations_content_hash ON public.authorship_registrations(content_hash);
CREATE INDEX IF NOT EXISTS idx_authorship_registrations_status ON public.authorship_registrations(status);

-- 3. Authorship Versions Table
CREATE TABLE IF NOT EXISTS public.authorship_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES public.authorship_registrations(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    version_tracking_code TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    title TEXT NOT NULL,
    raw_content TEXT NOT NULL,
    change_summary TEXT,
    integrity_gate_results JSONB NOT NULL,
    creation_declaration JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (registration_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_authorship_versions_reg_id ON public.authorship_versions(registration_id);
CREATE INDEX IF NOT EXISTS idx_authorship_versions_content_hash ON public.authorship_versions(content_hash);

-- 4. Authorship Disputes Table
CREATE TABLE IF NOT EXISTS public.authorship_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES public.authorship_registrations(id) ON DELETE CASCADE,
    reporter_email TEXT NOT NULL,
    reporter_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    claim_reason TEXT NOT NULL,
    claim_description TEXT NOT NULL,
    evidence_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    evidence_file_path TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'upheld', 'dismissed')),
    owner_response TEXT,
    owner_responded_at TIMESTAMPTZ,
    admin_notes TEXT,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_action TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_authorship_disputes_reg_id ON public.authorship_disputes(registration_id);
CREATE INDEX IF NOT EXISTS idx_authorship_disputes_status ON public.authorship_disputes(status);

-- 5. Authorship Audit Logs Table
CREATE TABLE IF NOT EXISTS public.authorship_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES public.authorship_registrations(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_role TEXT NOT NULL CHECK (actor_role IN ('owner', 'admin', 'system', 'visitor')),
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_fingerprint TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_authorship_audit_reg_id ON public.authorship_audit_logs(registration_id);
CREATE INDEX IF NOT EXISTS idx_authorship_audit_action ON public.authorship_audit_logs(action);

-- Enable RLS across all tables
ALTER TABLE public.authorship_platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorship_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorship_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorship_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorship_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_authorship_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND role = 'admin'
    );
$$;

-- RLS for authorship_platform_settings
DROP POLICY IF EXISTS "Public can view platform settings" ON public.authorship_platform_settings;
CREATE POLICY "Public can view platform settings" ON public.authorship_platform_settings
    FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can update platform settings" ON public.authorship_platform_settings;
CREATE POLICY "Admins can update platform settings" ON public.authorship_platform_settings
    FOR ALL TO authenticated USING (public.is_authorship_admin(auth.uid()))
    WITH CHECK (public.is_authorship_admin(auth.uid()));

-- RLS for authorship_registrations:
DROP POLICY IF EXISTS "Public can view certificate metadata" ON public.authorship_registrations;
CREATE POLICY "Public can view certificate metadata" ON public.authorship_registrations
    FOR SELECT TO public USING (status IN ('active', 'suspended', 'revoked'));

DROP POLICY IF EXISTS "Owners can insert their registrations" ON public.authorship_registrations;
CREATE POLICY "Owners can insert their registrations" ON public.authorship_registrations
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can update their registrations" ON public.authorship_registrations;
CREATE POLICY "Owners can update their registrations" ON public.authorship_registrations
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid() OR public.is_authorship_admin(auth.uid()))
    WITH CHECK (user_id = auth.uid() OR public.is_authorship_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins have full access to registrations" ON public.authorship_registrations;
CREATE POLICY "Admins have full access to registrations" ON public.authorship_registrations
    FOR ALL TO authenticated
    USING (public.is_authorship_admin(auth.uid()))
    WITH CHECK (public.is_authorship_admin(auth.uid()));

-- RLS for authorship_versions
DROP POLICY IF EXISTS "Owners and admins can view versions" ON public.authorship_versions;
CREATE POLICY "Owners and admins can view versions" ON public.authorship_versions
    FOR SELECT TO public
    USING (EXISTS (
        SELECT 1 FROM public.authorship_registrations r
        WHERE r.id = registration_id AND (r.status IN ('active', 'suspended', 'revoked'))
    ));

DROP POLICY IF EXISTS "Owners can insert versions" ON public.authorship_versions;
CREATE POLICY "Owners can insert versions" ON public.authorship_versions
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.authorship_registrations r
        WHERE r.id = registration_id AND r.user_id = auth.uid()
    ));

-- RLS for authorship_disputes
DROP POLICY IF EXISTS "Anyone can submit disputes" ON public.authorship_disputes;
CREATE POLICY "Anyone can submit disputes" ON public.authorship_disputes
    FOR INSERT TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Owners and admins can view disputes" ON public.authorship_disputes;
CREATE POLICY "Owners and admins can view disputes" ON public.authorship_disputes
    FOR SELECT TO authenticated
    USING (
        reporter_user_id = auth.uid()
        OR public.is_authorship_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.authorship_registrations r
            WHERE r.id = registration_id AND r.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Owners can update response to dispute" ON public.authorship_disputes;
CREATE POLICY "Owners can update response to dispute" ON public.authorship_disputes
    FOR UPDATE TO authenticated
    USING (
        public.is_authorship_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.authorship_registrations r
            WHERE r.id = registration_id AND r.user_id = auth.uid()
        )
    )
    WITH CHECK (
        public.is_authorship_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.authorship_registrations r
            WHERE r.id = registration_id AND r.user_id = auth.uid()
        )
    );

-- RLS for authorship_audit_logs
DROP POLICY IF EXISTS "System and authenticated can insert audit logs" ON public.authorship_audit_logs;
CREATE POLICY "System and authenticated can insert audit logs" ON public.authorship_audit_logs
    FOR INSERT TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Owners and admins can view audit logs" ON public.authorship_audit_logs;
CREATE POLICY "Owners and admins can view audit logs" ON public.authorship_audit_logs
    FOR SELECT TO authenticated
    USING (
        public.is_authorship_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.authorship_registrations r
            WHERE r.id = registration_id AND r.user_id = auth.uid()
        )
    );

-- RPC function to verify a content hash
CREATE OR REPLACE FUNCTION public.verify_authorship_content_hash(p_hash TEXT)
RETURNS TABLE (
    id UUID,
    tracking_code TEXT,
    title TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    is_match BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT 
        r.id,
        r.tracking_code,
        r.title,
        r.status,
        r.created_at,
        (r.content_hash = p_hash) AS is_match
    FROM public.authorship_registrations r
    WHERE r.content_hash = p_hash
    UNION
    SELECT 
        r.id,
        v.version_tracking_code AS tracking_code,
        v.title,
        r.status,
        v.created_at,
        (v.content_hash = p_hash) AS is_match
    FROM public.authorship_versions v
    JOIN public.authorship_registrations r ON r.id = v.registration_id
    WHERE v.content_hash = p_hash;
$$;
