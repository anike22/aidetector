ALTER POLICY "Users can manage their own domain_overview_reports" ON public.domain_overview_reports USING (true) WITH CHECK (true);
ALTER POLICY "Users can insert their own seo_audits" ON public.seo_audits WITH CHECK (true);
ALTER POLICY "Users can insert their own technical_audits" ON public.technical_audits WITH CHECK (true);
ALTER POLICY "Users can insert their own aeo_reports" ON public.aeo_reports WITH CHECK (true);
ALTER POLICY "Users can insert their own keyword_research" ON public.keyword_research WITH CHECK (true);
ALTER POLICY "Users can insert their own content_strategies" ON public.content_strategies WITH CHECK (true);
ALTER POLICY "Users can insert their own link_building_reports" ON public.link_building_reports WITH CHECK (true);
ALTER POLICY "Users can insert their own seo_agent_projects" ON public.seo_agent_projects WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own seo_audits" ON public.seo_audits;
CREATE POLICY "Users can view their own seo_audits" ON public.seo_audits FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view their own technical_audits" ON public.technical_audits;
CREATE POLICY "Users can view their own technical_audits" ON public.technical_audits FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view their own aeo_reports" ON public.aeo_reports;
CREATE POLICY "Users can view their own aeo_reports" ON public.aeo_reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view their own keyword_research" ON public.keyword_research;
CREATE POLICY "Users can view their own keyword_research" ON public.keyword_research FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view their own content_strategies" ON public.content_strategies;
CREATE POLICY "Users can view their own content_strategies" ON public.content_strategies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view their own link_building_reports" ON public.link_building_reports;
CREATE POLICY "Users can view their own link_building_reports" ON public.link_building_reports FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view their own seo_agent_projects" ON public.seo_agent_projects;
CREATE POLICY "Users can view their own seo_agent_projects" ON public.seo_agent_projects FOR SELECT USING (true);

