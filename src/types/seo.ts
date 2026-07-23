export type SEOProjectStatus = 'Active' | 'Archived';
export type SEOReportType = 'Domain Overview' | 'Site Audit' | 'Keyword Research' | 'Backlink Analysis' | 'AI Visibility' | 'AEO Analysis';
export type SEOReportStatus = 'Completed' | 'In Progress' | 'Failed';

export interface SEOProject {
  project_id: string;
  user_id: string;
  project_name: string;
  domain: string;
  country?: string;
  industry?: string;
  competitors: string[];
  status: SEOProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface DomainOverviewReport {
  report_id: string;
  project_id?: string;
  user_id: string;
  domain: string;
  report_type: SEOReportType;
  status: SEOReportStatus;
  generated_at: string;
  processing_time?: number;
  report_data?: any; // A nested structure containing summary metrics
}

export interface DomainAuthorityData {
  authority_id: string;
  report_id: string;
  domain: string;
  domain_authority: number;
  domain_rating: number;
  trust_score: number;
  authority_trend: any[];
  measured_at: string;
}

export interface DomainTrafficData {
  traffic_id: string;
  report_id: string;
  domain: string;
  organic_traffic: number;
  traffic_trend: any[];
  geographic_distribution: any[];
  device_distribution: Record<string, number>;
  measured_at: string;
}

export interface DomainKeywordRankings {
  ranking_id: string;
  report_id: string;
  domain: string;
  total_ranking_keywords: number;
  top_10_keywords: number;
  top_50_keywords: number;
  keyword_opportunities: number;
  keyword_trend: any[];
  top_keywords: any[];
  measured_at: string;
}

export interface DomainBacklinks {
  backlink_id: string;
  report_id: string;
  domain: string;
  total_backlinks: number;
  referring_domains: number;
  dofollow_backlinks: number;
  nofollow_backlinks: number;
  toxic_backlinks: number;
  backlink_trend: any[];
  top_referring_domains: any[];
  measured_at: string;
}

export interface DomainCompetitors {
  competitor_id: string;
  report_id: string;
  domain: string;
  organic_competitors: any[];
  keyword_competitors: any[];
  content_competitors: any[];
  measured_at: string;
}

export interface DomainAIVisibility {
  visibility_id: string;
  report_id: string;
  domain: string;
  overall_ai_visibility_score: number;
  chatgpt_visibility_score: number;
  chatgpt_mention_count: number;
  chatgpt_trend: any[];
  google_ai_overviews_visibility_score: number;
  google_ai_overviews_featured_count: number;
  google_ai_overviews_trend: any[];
  gemini_visibility_score: number;
  gemini_mention_count: number;
  gemini_trend: any[];
  claude_visibility_score: number;
  claude_mention_count: number;
  claude_trend: any[];
  perplexity_visibility_score: number;
  perplexity_citation_count: number;
  perplexity_trend: any[];
  ai_visibility_trend: any[];
  top_ai_visible_content: any[];
  measured_at: string;
}

export interface SEOAudit {
  audit_id: string;
  project_id?: string;
  user_id: string;
  domain_url: string;
  status: SEOReportStatus;
  generated_at: string;
  processing_time?: number;
  overall_seo_score: number;
  on_page_seo_score: number;
  content_seo_score: number;
  critical_issues_count: number;
  warnings_count: number;
  opportunities_count: number;
  audit_data?: any;
}

export interface TechnicalAudit {
  technical_audit_id: string;
  project_id?: string;
  user_id: string;
  domain_url: string;
  status: SEOReportStatus;
  generated_at: string;
  processing_time?: number;
  overall_technical_score: number;
  crawlability_score: number;
  performance_score: number;
  mobile_score: number;
  security_score: number;
  critical_issues_count: number;
  warnings_count: number;
  fixes_count: number;
  technical_audit_data?: any;
}

export interface AEOReport {
  aeo_report_id: string;
  project_id?: string;
  user_id: string;
  domain_url: string;
  status: SEOReportStatus;
  generated_at: string;
  processing_time?: number;
  overall_aeo_score: number;
  question_coverage_score: number;
  entity_coverage_score: number;
  faq_quality_score: number;
  eeat_score: number;
  structured_data_score: number;
  trust_signals_score: number;
  missing_questions_count: number;
  missing_entities_count: number;
  aeo_data?: any;
}

export interface SEORecommendation {
  recommendation_id: string;
  audit_id?: string;
  technical_audit_id?: string;
  aeo_report_id?: string;
  recommendation_type: 'SEO Audit' | 'Technical Audit' | 'AEO Analysis';
  issue_description: string;
  affected_pages_count: number;
  impact_level: 'High' | 'Medium' | 'Low';
  effort_level: 'High' | 'Medium' | 'Low';
  severity_level: 'Critical' | 'High' | 'Medium' | 'Low';
  recommendation_text: string;
  created_at: string;
}

export interface DomainAEOScores {
  aeo_id: string;
  report_id: string;
  domain: string;
  overall_aeo_score: number;
  faq_coverage_score: number;
  faq_pages_count: number;
  questions_answered_count: number;
  entity_recognition_score: number;
  recognized_entities_count: number;
  entity_density: number;
  eeat_score: number;
  expertise_signals: number;
  authoritativeness_signals: number;
  trustworthiness_signals: number;
  structured_data_score: number;
  schema_types_implemented: string[];
  coverage_percentage: number;
  question_optimization_score: number;
  question_format_content_count: number;
  answer_quality_score: number;
  aeo_opportunities: any[];
  measured_at: string;
}

export interface DomainSiteAudit {
  audit_id: string;
  report_id: string;
  domain: string;
  critical_issues_count: number;
  warnings_count: number;
  opportunities_count: number;
  quick_wins_count: number;
  issues_breakdown: any[];
  measured_at: string;
}

export interface KeywordResearch {
  keyword_research_id: string;
  project_id?: string;
  user_id: string;
  seed_keyword: string;
  country: string;
  language: string;
  status: SEOReportStatus;
  generated_at: string;
  processing_time?: number;
  total_keywords: number;
  keyword_data?: any;
}

export interface ContentStrategy {
  content_strategy_id: string;
  project_id?: string;
  user_id: string;
  domain_url: string;
  target_keywords: string;
  status: SEOReportStatus;
  generated_at: string;
  processing_time?: number;
  content_pillars_count: number;
  topic_clusters_count: number;
  content_pieces_count: number;
  strategy_data?: any;
}

export interface LinkBuildingReport {
  link_building_report_id: string;
  project_id?: string;
  user_id: string;
  domain_url: string;
  status: SEOReportStatus;
  generated_at: string;
  processing_time?: number;
  total_opportunities: number;
  outreach_campaigns_count: number;
  links_acquired_count: number;
  link_building_data?: any;
}

export interface SEOAgentProject {
  seo_agent_project_id: string;
  project_id?: string;
  user_id: string;
  target_keyword: string;
  domain_url?: string;
  status: SEOReportStatus;
  generated_at: string;
  processing_time?: number;
  seo_plan_data?: any;
}

export interface ReportExport {
  export_id: string;
  user_id: string;
  report_type: string;
  report_id: string;
  export_format: 'PDF' | 'CSV' | 'Excel';
  export_date: string;
  file_url?: string;
}
