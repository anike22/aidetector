import { supabase } from '@/db/supabase';
import { 
  SEOProject, 
  DomainOverviewReport,
  DomainAuthorityData,
  DomainTrafficData,
  DomainKeywordRankings,
  DomainBacklinks,
  DomainCompetitors,
  DomainAIVisibility,
  DomainAEOScores,
  DomainSiteAudit
} from '@/types/seo';

export const seoApi = {
  // Projects
  async getProjects() {
    const { data, error } = await supabase
      .from('seo_projects')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (error) throw error;
    return data as SEOProject[];
  },

  async getProject(id: string) {
    const { data, error } = await supabase
      .from('seo_projects')
      .select('*')
      .eq('project_id', id)
      .single();
      
    if (error) throw error;
    return data as SEOProject;
  },

  async createProject(project: Omit<SEOProject, 'project_id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('seo_projects')
      .insert(project)
      .select()
      .single();
      
    if (error) throw error;
    return data as SEOProject;
  },

  async deleteProject(id: string) {
    const { error } = await supabase
      .from('seo_projects')
      .delete()
      .eq('project_id', id);
      
    if (error) throw error;
    return true;
  },

  // Reports
  async getRecentReports(limit = 10) {
    const { data, error } = await supabase
      .from('seo_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    return data;
  },

  async getReport(id: string) {
    const { data, error } = await supabase
      .from('domain_overview_reports')
      .select('*')
      .eq('report_id', id)
      .single();
      
    if (error) throw error;
    return data as DomainOverviewReport;
  },
  
  // Get all data for a specific report
  async getFullReportData(reportId: string) {
    const [
      authority, traffic, keywords, backlinks, competitors, ai_visibility, aeo, audit
    ] = await Promise.all([
      supabase.from('domain_authority_data').select('*').eq('report_id', reportId).maybeSingle(),
      supabase.from('domain_traffic_data').select('*').eq('report_id', reportId).maybeSingle(),
      supabase.from('domain_keyword_rankings').select('*').eq('report_id', reportId).maybeSingle(),
      supabase.from('domain_backlinks').select('*').eq('report_id', reportId).maybeSingle(),
      supabase.from('domain_competitors').select('*').eq('report_id', reportId).maybeSingle(),
      supabase.from('domain_ai_visibility').select('*').eq('report_id', reportId).maybeSingle(),
      supabase.from('domain_aeo_scores').select('*').eq('report_id', reportId).maybeSingle(),
      supabase.from('domain_site_audit').select('*').eq('report_id', reportId).maybeSingle()
    ]);
    
    return {
      authority: authority.data as DomainAuthorityData,
      traffic: traffic.data as DomainTrafficData,
      keywords: keywords.data as DomainKeywordRankings,
      backlinks: backlinks.data as DomainBacklinks,
      competitors: competitors.data as DomainCompetitors,
      ai_visibility: ai_visibility.data as DomainAIVisibility,
      aeo: aeo.data as DomainAEOScores,
      audit: audit.data as DomainSiteAudit
    };
  },

  // Analysis Trigger
  async analyzeDomain(domain: string, country: string = 'US', device: string = 'desktop') {
    const { data, error } = await supabase.functions.invoke('run-semrush-report', {
      body: { domain, country, device }
    });
    
    if (error) throw error;
    if (data && !data.success) throw new Error(data.errors?.[0] || 'Unknown error occurred during analysis');
    return data;
  },

  async getSemrushReport(domain: string) {
    const { data, error } = await supabase
      .from('seo_reports')
      .select('*')
      .eq('domain', domain)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (error) throw error;
    if (!data) return null;

    // Fetch related data
    const [keywords, competitors, backlinks, ai_visibility] = await Promise.all([
      supabase.from('seo_keywords').select('*').eq('report_id', data.id),
      supabase.from('seo_competitors').select('*').eq('report_id', data.id),
      supabase.from('seo_backlinks').select('*').eq('report_id', data.id),
      supabase.from('seo_ai_visibility').select('*').eq('report_id', data.id)
    ]);

    return {
      success: true,
      domain: data.domain,
      report_type: data.report_type,
      generated_at: data.created_at,
      data: data.data,
      data_source: data.data_source,
      keywords: keywords.data || [],
      competitors: competitors.data || [],
      backlinks: backlinks.data || [],
      ai_visibility: ai_visibility.data || [],
      errors: []
    };
  },

  async runSEOAudit(domain_url: string, projectId?: string) {
    const { data, error } = await supabase.functions.invoke('run-seo-audit', {
      body: { domain_url, project_id: projectId }
    });
    if (error) throw error;
    return data;
  },

  async runTechnicalAudit(domain_url: string, projectId?: string) {
    const { data, error } = await supabase.functions.invoke('run-technical-audit', {
      body: { domain_url, project_id: projectId }
    });
    if (error) throw error;
    return data;
  },

  async runAEOOptimizer(domain_url: string, projectId?: string) {
    const { data, error } = await supabase.functions.invoke('run-aeo-optimizer', {
      body: { domain_url, project_id: projectId }
    });
    if (error) throw error;
    return data;
  },

  async runLinkIntelligence(domain: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${supabaseUrl}/functions/v1/run-link-intelligence`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ domain })
    });
    
    if (!res.ok) throw new Error('Failed to run link intelligence');
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Unknown error');
    
    return data.data;
  },

  async getLinkIntelligenceReport(domain: string) {
    const { data, error } = await supabase
      .from('link_building_reports')
      .select('*')
      .eq('domain', domain)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (error) throw error;
    return data;
  },

  async runAdvancedSeoAgent(params: any) {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${supabaseUrl}/functions/v1/run-advanced-seo-agent`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params)
    });
    
    if (!res.ok) throw new Error('Failed to run advanced SEO agent');
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Unknown error');
    
    return data.data;
  },

  async getAdvancedSeoPlan(keyword: string) {
    const { data, error } = await supabase
      .from('advanced_seo_plans')
      .select('*')
      .eq('keyword', keyword)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (error) throw error;
    return data;
  },

  async runKeywordIntelligence(keyword: string, country: string = 'US', language: string = 'en') {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${supabaseUrl}/functions/v1/run-keyword-intelligence`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ keyword, country, language })
    });
    
    if (!res.ok) {
      throw new Error(`Failed to run keyword intelligence: ${res.statusText}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.errors?.[0] || 'Unknown error occurred during analysis');
    }

    return data;
  },

  async generatePdf(title: string, content: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${supabaseUrl}/functions/v1/generate-pdf`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ title, content })
    });
    
    if (!res.ok) throw new Error('Failed to generate PDF');
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    
    // Trigger download
    const byteCharacters = atob(data.pdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  async getKeywordIntelligenceReport(keyword: string) {
    const { data, error } = await supabase
      .from('keyword_intelligence_reports')
      .select('*')
      .eq('seed_keyword', keyword)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (error) throw error;
    return data;
  },

  async runContentStrategy(domain_url: string, target_keywords: string, projectId?: string) {
    const { data, error } = await supabase.functions.invoke('run-content-strategy', {
      body: { domain_url, target_keywords, project_id: projectId }
    });
    if (error) throw error;
    return data;
  },

  async runLinkBuilding(domain_url: string, projectId?: string) {
    const { data, error } = await supabase.functions.invoke('run-link-building', {
      body: { domain_url, project_id: projectId }
    });
    if (error) throw error;
    return data;
  },

  async runSEOAgent(target_keyword: string, domain_url?: string, projectId?: string) {
    const { data, error } = await supabase.functions.invoke('run-seo-agent', {
      body: { target_keyword, domain_url, project_id: projectId }
    });
    if (error) throw error;
    return data;
  },

  async getCrmContacts(target_domain: string) {
    const { data, error } = await supabase
      .from('link_building_crm')
      .select('*')
      .eq('target_domain', target_domain)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async addCrmContact(contact: any) {
    const { data, error } = await supabase
      .from('link_building_crm')
      .insert(contact)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateCrmContact(id: string, updates: any) {
    const { data, error } = await supabase
      .from('link_building_crm')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteCrmContact(id: string) {
    const { error } = await supabase
      .from('link_building_crm')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async dispatchAiPitch(payload: { target_domain: string, contact_email: string, publication: string, link_type: string, subject: string, message: string }) {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${supabaseUrl}/functions/v1/dispatch-ai-pitch`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      throw new Error(`Failed to dispatch pitch: ${res.statusText}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Unknown error occurred');
    }

    return data;
  }
};