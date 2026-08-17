CREATE TYPE seo_project_status AS ENUM ('Active', 'Archived');
CREATE TYPE seo_report_type AS ENUM ('Domain Overview', 'Site Audit', 'Keyword Research', 'Backlink Analysis', 'AI Visibility', 'AEO Analysis');
CREATE TYPE seo_report_status AS ENUM ('Completed', 'In Progress', 'Failed');

CREATE TABLE IF NOT EXISTS seo_projects (
    project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_name TEXT NOT NULL,
    domain TEXT NOT NULL,
    country TEXT,
    industry TEXT,
    competitors JSONB DEFAULT '[]'::jsonb,
    status seo_project_status DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS domain_overview_reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES seo_projects(project_id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    report_type seo_report_type DEFAULT 'Domain Overview',
    status seo_report_status DEFAULT 'In Progress',
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    processing_time INTEGER,
    report_data JSONB
);

CREATE TABLE IF NOT EXISTS domain_authority_data (
    authority_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES domain_overview_reports(report_id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    domain_authority INTEGER DEFAULT 0,
    domain_rating INTEGER DEFAULT 0,
    trust_score INTEGER DEFAULT 0,
    authority_trend JSONB DEFAULT '[]'::jsonb,
    measured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS domain_traffic_data (
    traffic_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES domain_overview_reports(report_id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    organic_traffic INTEGER DEFAULT 0,
    traffic_trend JSONB DEFAULT '[]'::jsonb,
    geographic_distribution JSONB DEFAULT '[]'::jsonb,
    device_distribution JSONB DEFAULT '{}'::jsonb,
    measured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS domain_keyword_rankings (
    ranking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES domain_overview_reports(report_id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    total_ranking_keywords INTEGER DEFAULT 0,
    top_10_keywords INTEGER DEFAULT 0,
    top_50_keywords INTEGER DEFAULT 0,
    keyword_opportunities INTEGER DEFAULT 0,
    keyword_trend JSONB DEFAULT '[]'::jsonb,
    top_keywords JSONB DEFAULT '[]'::jsonb,
    measured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS domain_backlinks (
    backlink_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES domain_overview_reports(report_id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    total_backlinks INTEGER DEFAULT 0,
    referring_domains INTEGER DEFAULT 0,
    dofollow_backlinks INTEGER DEFAULT 0,
    nofollow_backlinks INTEGER DEFAULT 0,
    toxic_backlinks INTEGER DEFAULT 0,
    backlink_trend JSONB DEFAULT '[]'::jsonb,
    top_referring_domains JSONB DEFAULT '[]'::jsonb,
    measured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS domain_competitors (
    competitor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES domain_overview_reports(report_id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    organic_competitors JSONB DEFAULT '[]'::jsonb,
    keyword_competitors JSONB DEFAULT '[]'::jsonb,
    content_competitors JSONB DEFAULT '[]'::jsonb,
    measured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS domain_ai_visibility (
    visibility_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES domain_overview_reports(report_id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    overall_ai_visibility_score INTEGER DEFAULT 0,
    chatgpt_visibility_score INTEGER DEFAULT 0,
    chatgpt_mention_count INTEGER DEFAULT 0,
    chatgpt_trend JSONB DEFAULT '[]'::jsonb,
    google_ai_overviews_visibility_score INTEGER DEFAULT 0,
    google_ai_overviews_featured_count INTEGER DEFAULT 0,
    google_ai_overviews_trend JSONB DEFAULT '[]'::jsonb,
    gemini_visibility_score INTEGER DEFAULT 0,
    gemini_mention_count INTEGER DEFAULT 0,
    gemini_trend JSONB DEFAULT '[]'::jsonb,
    claude_visibility_score INTEGER DEFAULT 0,
    claude_mention_count INTEGER DEFAULT 0,
    claude_trend JSONB DEFAULT '[]'::jsonb,
    perplexity_visibility_score INTEGER DEFAULT 0,
    perplexity_citation_count INTEGER DEFAULT 0,
    perplexity_trend JSONB DEFAULT '[]'::jsonb,
    ai_visibility_trend JSONB DEFAULT '[]'::jsonb,
    top_ai_visible_content JSONB DEFAULT '[]'::jsonb,
    measured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS domain_aeo_scores (
    aeo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES domain_overview_reports(report_id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    overall_aeo_score INTEGER DEFAULT 0,
    faq_coverage_score INTEGER DEFAULT 0,
    faq_pages_count INTEGER DEFAULT 0,
    questions_answered_count INTEGER DEFAULT 0,
    entity_recognition_score INTEGER DEFAULT 0,
    recognized_entities_count INTEGER DEFAULT 0,
    entity_density FLOAT DEFAULT 0.0,
    eeat_score INTEGER DEFAULT 0,
    expertise_signals INTEGER DEFAULT 0,
    authoritativeness_signals INTEGER DEFAULT 0,
    trustworthiness_signals INTEGER DEFAULT 0,
    structured_data_score INTEGER DEFAULT 0,
    schema_types_implemented JSONB DEFAULT '[]'::jsonb,
    coverage_percentage FLOAT DEFAULT 0.0,
    question_optimization_score INTEGER DEFAULT 0,
    question_format_content_count INTEGER DEFAULT 0,
    answer_quality_score INTEGER DEFAULT 0,
    aeo_opportunities JSONB DEFAULT '[]'::jsonb,
    measured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS domain_site_audit (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES domain_overview_reports(report_id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    critical_issues_count INTEGER DEFAULT 0,
    warnings_count INTEGER DEFAULT 0,
    opportunities_count INTEGER DEFAULT 0,
    quick_wins_count INTEGER DEFAULT 0,
    issues_breakdown JSONB DEFAULT '[]'::jsonb,
    measured_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE seo_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own seo_projects"
    ON seo_projects FOR ALL
    USING (auth.uid() = user_id);

ALTER TABLE domain_overview_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own domain_overview_reports"
    ON domain_overview_reports FOR ALL
    USING (auth.uid() = user_id);

ALTER TABLE domain_authority_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own domain_authority_data"
    ON domain_authority_data FOR SELECT
    USING (EXISTS (SELECT 1 FROM domain_overview_reports WHERE report_id = domain_authority_data.report_id AND user_id = auth.uid()));

ALTER TABLE domain_traffic_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own domain_traffic_data"
    ON domain_traffic_data FOR SELECT
    USING (EXISTS (SELECT 1 FROM domain_overview_reports WHERE report_id = domain_traffic_data.report_id AND user_id = auth.uid()));

ALTER TABLE domain_keyword_rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own domain_keyword_rankings"
    ON domain_keyword_rankings FOR SELECT
    USING (EXISTS (SELECT 1 FROM domain_overview_reports WHERE report_id = domain_keyword_rankings.report_id AND user_id = auth.uid()));

ALTER TABLE domain_backlinks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own domain_backlinks"
    ON domain_backlinks FOR SELECT
    USING (EXISTS (SELECT 1 FROM domain_overview_reports WHERE report_id = domain_backlinks.report_id AND user_id = auth.uid()));

ALTER TABLE domain_competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own domain_competitors"
    ON domain_competitors FOR SELECT
    USING (EXISTS (SELECT 1 FROM domain_overview_reports WHERE report_id = domain_competitors.report_id AND user_id = auth.uid()));

ALTER TABLE domain_ai_visibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own domain_ai_visibility"
    ON domain_ai_visibility FOR SELECT
    USING (EXISTS (SELECT 1 FROM domain_overview_reports WHERE report_id = domain_ai_visibility.report_id AND user_id = auth.uid()));

ALTER TABLE domain_aeo_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own domain_aeo_scores"
    ON domain_aeo_scores FOR SELECT
    USING (EXISTS (SELECT 1 FROM domain_overview_reports WHERE report_id = domain_aeo_scores.report_id AND user_id = auth.uid()));

ALTER TABLE domain_site_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own domain_site_audit"
    ON domain_site_audit FOR SELECT
    USING (EXISTS (SELECT 1 FROM domain_overview_reports WHERE report_id = domain_site_audit.report_id AND user_id = auth.uid()));