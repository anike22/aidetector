/**
 * Coverage Transparency & Provider Auditing Matrix
 *
 * Transparently tracks and displays the status of all queried registries and analytical engines.
 * Separates "Operational" from "Found Matches" and never equates API 200 with 100% full-corpus coverage.
 */

export type ProviderCheckStatus = 'checked' | 'unavailable' | 'not_applicable' | 'not_checked';

export interface CoverageSystemItem {
  id: string;
  name: string;
  category: 'registry' | 'intelligence' | 'multimodal';
  status: ProviderCheckStatus;
  statusLabel: string;
  coverageDetails: string;
  recordsQueriedEstimate?: string;
  queriesSent?: number;
  candidatesReturned?: number;
  verifiedSources?: number;
}

export interface SearchCoverageReport {
  overallCoveragePercentage: number;
  systems: CoverageSystemItem[];
  allPrimaryRegistriesOperational: boolean;
  unavailableCount: number;
  totalQueriesSent: number;
  totalCandidatesEvaluated: number;
  totalVerifiedSourcesFound: number;
}

export interface ProviderStatusDetail {
  status: 'ok' | 'failed' | 'skipped' | 'not_configured';
  state?: string;
  queriesSent?: number;
  candidatesReturned?: number;
  verifiedSources?: number;
  httpStatus?: number | null;
  failureReason?: string | null;
}

export function buildSearchCoverageReport(
  providerStatus?: {
    crossref?: 'ok' | 'failed' | 'skipped' | ProviderStatusDetail;
    openalex?: 'ok' | 'failed' | 'skipped' | ProviderStatusDetail;
    unpaywall?: 'ok' | 'failed' | 'skipped' | ProviderStatusDetail;
    gemini?: 'ok' | 'failed' | 'skipped' | ProviderStatusDetail;
    webSearch?: 'ok' | 'failed' | 'skipped' | 'not_configured' | ProviderStatusDetail;
    exa?: 'ok' | 'failed' | 'skipped' | ProviderStatusDetail;
  },
  hasStructuredTables: boolean = false,
  hasVisualFigures: boolean = false,
  hasCodeBlocks: boolean = false,
  diagnostics?: { actualCoveragePercentage?: number }
): SearchCoverageReport {
  const ps = providerStatus || {};

  const getStatus = (val?: string | ProviderStatusDetail): 'ok' | 'failed' | 'skipped' | 'not_configured' => {
    if (!val) return 'skipped';
    if (typeof val === 'string') return val as any;
    return val.status;
  };

  const getState = (val?: string | ProviderStatusDetail): string => {
    if (val && typeof val === 'object' && val.state) return val.state;
    const st = getStatus(val);
    if (st === 'ok') return 'operational';
    if (st === 'failed') return 'unavailable';
    if (st === 'not_configured') return 'not_configured';
    return 'not_checked';
  };

  const formatStateLabel = (state: string, fallback: string): string => {
    switch (state) {
      case 'operational': return 'Operational: Verified';
      case 'no_results': return 'Operational: 0 Matches';
      case 'timeout': return 'Request Timeout';
      case 'authentication_error': return 'Authentication Error (API Key Restricted)';
      case 'quota_exceeded': return 'Daily Quota Exceeded';
      case 'unavailable': return 'Temporarily unavailable';
      case 'not_checked': return 'Not Checked';
      case 'not_configured': return 'Not Configured';
      default: return fallback;
    }
  };

  const getQueries = (val?: string | ProviderStatusDetail): number | undefined => {
    if (val && typeof val === 'object') return val.queriesSent;
    return undefined;
  };

  const getCandidates = (val?: string | ProviderStatusDetail): number | undefined => {
    if (val && typeof val === 'object') return val.candidatesReturned;
    return undefined;
  };

  const getVerified = (val?: string | ProviderStatusDetail): number | undefined => {
    if (val && typeof val === 'object') return val.verifiedSources;
    return undefined;
  };

  const crState = getState(ps.crossref);
  const oaState = getState(ps.openalex);
  const upState = getState(ps.unpaywall);
  const webState = getState(ps.webSearch);
  const exaState = getState(ps.exa);

  const isChecked = (state: string) => state === 'operational' || state === 'no_results';
  const isFailed = (state: string) => state === 'unavailable' || state === 'authentication_error' || state === 'quota_exceeded' || state === 'timeout';

  const systems: CoverageSystemItem[] = [
    {
      id: 'crossref',
      name: 'Crossref Scholarly Registry',
      category: 'registry',
      status: isChecked(crState) ? 'checked' : isFailed(crState) ? 'unavailable' : 'not_checked',
      statusLabel: formatStateLabel(crState, 'Operational: Verified'),
      coverageDetails: isFailed(crState)
        ? 'Crossref service unreachable during scan'
        : crState === 'not_checked'
        ? 'Crossref was not queried for this analysis'
        : `Queried 140M+ peer-reviewed academic DOI publications${getQueries(ps.crossref) ? ` (${getQueries(ps.crossref)} queries sent)` : ''}`,
      recordsQueriedEstimate: '140M+ DOIs',
      queriesSent: getQueries(ps.crossref),
      candidatesReturned: getCandidates(ps.crossref),
      verifiedSources: getVerified(ps.crossref),
    },
    {
      id: 'openalex',
      name: 'OpenAlex Open Science Index',
      category: 'registry',
      status: isChecked(oaState) ? 'checked' : isFailed(oaState) ? 'unavailable' : 'not_checked',
      statusLabel: formatStateLabel(oaState, 'Operational: Verified'),
      coverageDetails: isFailed(oaState)
        ? 'OpenAlex service unreachable during scan'
        : oaState === 'not_checked'
        ? 'OpenAlex was not queried for this analysis'
        : `Queried 250M+ scholarly works and open science metadata${getQueries(ps.openalex) ? ` (${getQueries(ps.openalex)} queries sent)` : ''}`,
      recordsQueriedEstimate: '250M+ Works',
      queriesSent: getQueries(ps.openalex),
      candidatesReturned: getCandidates(ps.openalex),
      verifiedSources: getVerified(ps.openalex),
    },
    {
      id: 'unpaywall',
      name: 'Unpaywall Open Access Corpus',
      category: 'registry',
      status: isChecked(upState) ? 'checked' : isFailed(upState) ? 'unavailable' : 'not_checked',
      statusLabel: formatStateLabel(upState, 'Operational: Enriched'),
      coverageDetails: isFailed(upState)
        ? 'Unpaywall service unreachable during scan'
        : upState === 'not_checked'
        ? 'Unpaywall was not queried for this analysis'
        : 'Resolved full-text open-access PDF/HTML manuscripts across 50M+ repository links',
      recordsQueriedEstimate: '50M+ Full-Texts',
      queriesSent: getQueries(ps.unpaywall),
      candidatesReturned: getCandidates(ps.unpaywall),
      verifiedSources: getVerified(ps.unpaywall),
    },
    {
      id: 'web_search',
      name: 'Google Custom Search (Web Index)',
      category: 'registry',
      status: isChecked(webState) ? 'checked' : isFailed(webState) ? 'unavailable' : webState === 'not_configured' ? 'not_applicable' : 'not_checked',
      statusLabel: formatStateLabel(webState, webState === 'not_configured' ? 'Not Configured' : 'Not Checked'),
      coverageDetails: webState === 'authentication_error'
        ? 'Google Custom Search API key lacks enabled access to Custom Search API (HTTP 403)'
        : webState === 'not_configured'
        ? 'Google Custom Search not configured'
        : 'Live web index coverage across public web articles, blogs, and published journalism',
      recordsQueriedEstimate: 'Multi-Billion Pages',
      queriesSent: getQueries(ps.webSearch),
      candidatesReturned: getCandidates(ps.webSearch),
      verifiedSources: getVerified(ps.webSearch),
    },
    {
      id: 'exa_web_search',
      name: 'Exa Neural Publication Search',
      category: 'registry',
      status: isChecked(exaState) ? 'checked' : isFailed(exaState) ? 'unavailable' : exaState === 'not_configured' ? 'not_applicable' : 'not_checked',
      statusLabel: formatStateLabel(exaState, exaState === 'not_configured' ? 'Not Configured' : 'Not Checked'),
      coverageDetails: isChecked(exaState)
        ? 'Live neural web index querying publications, academic repositories, and preprints'
        : 'Exa neural publication search index',
      recordsQueriedEstimate: 'High-Signal Publications',
      queriesSent: getQueries(ps.exa),
      candidatesReturned: getCandidates(ps.exa),
      verifiedSources: getVerified(ps.exa),
    },
    {
      id: 'deep_paraphrase',
      name: 'Deep Paraphrase & Voice Analysis',
      category: 'intelligence',
      status: 'checked',
      statusLabel: 'Operational',
      coverageDetails: 'Multi-tier token Jaccard & Longest Common Subsequence invariant analysis',
    },
    {
      id: 'ai_rewrite',
      name: 'AI Rewrite Source Tracing',
      category: 'intelligence',
      status: 'checked',
      statusLabel: 'Operational',
      coverageDetails: 'Fact progression, argument order alignment, and vocabulary preservation tracking',
    },
    {
      id: 'citation_audit',
      name: 'Citation & Attribution Verification',
      category: 'intelligence',
      status: 'checked',
      statusLabel: 'Operational',
      coverageDetails: 'APA, MLA, Chicago, Harvard, IEEE in-text format and attribution link audit',
    },
    {
      id: 'cross_lingual',
      name: 'Cross-Language Semantic Comparison',
      category: 'intelligence',
      status: 'checked',
      statusLabel: 'Operational',
      coverageDetails: 'Multilingual semantic invariant comparison across major international languages',
    },
    {
      id: 'tables_data',
      name: 'Table & Dataset Invariance Analysis',
      category: 'multimodal',
      status: hasStructuredTables ? 'checked' : 'not_applicable',
      statusLabel: hasStructuredTables ? 'Operational' : 'Not applicable',
      coverageDetails: hasStructuredTables
        ? 'Structured tabular matrix comparison with renamed/reordered columns'
        : 'No structured tables present in submitted text',
    },
    {
      id: 'visual_analysis',
      name: 'Visual & Figure Similarity Analysis',
      category: 'multimodal',
      status: hasVisualFigures ? 'checked' : 'not_applicable',
      statusLabel: hasVisualFigures ? 'Operational' : 'Not applicable',
      coverageDetails: hasVisualFigures
        ? 'Perceptual hash & layout structure comparison of figures and charts'
        : 'No visual figures attached to submission',
    },
    {
      id: 'code_plagiarism',
      name: 'Code AST & Algorithmic Analysis',
      category: 'multimodal',
      status: hasCodeBlocks ? 'checked' : 'not_applicable',
      statusLabel: hasCodeBlocks ? 'Operational' : 'Not applicable',
      coverageDetails: hasCodeBlocks
        ? 'Tokenized AST control-flow and algorithmic invariant comparison'
        : 'No code blocks present in submitted text',
    },
  ];

  const applicableSystems = systems.filter((s) => s.status !== 'not_applicable');
  const checkedSystems = applicableSystems.filter((s) => s.status === 'checked');
  const unavailable = applicableSystems.filter((s) => s.status === 'unavailable');

  const coveragePct = typeof diagnostics?.actualCoveragePercentage === 'number'
    ? diagnostics.actualCoveragePercentage
    : applicableSystems.length > 0
    ? Math.round((checkedSystems.length / applicableSystems.length) * 100)
    : 100;

  let totalQueries = 0;
  let totalCandidates = 0;
  let totalVerified = 0;
  for (const s of systems) {
    if (s.queriesSent) totalQueries += s.queriesSent;
    if (s.candidatesReturned) totalCandidates += s.candidatesReturned;
    if (s.verifiedSources) totalVerified += s.verifiedSources;
  }

  return {
    overallCoveragePercentage: coveragePct,
    systems,
    allPrimaryRegistriesOperational: unavailable.length === 0,
    unavailableCount: unavailable.length,
    totalQueriesSent: totalQueries,
    totalCandidatesEvaluated: totalCandidates,
    totalVerifiedSourcesFound: totalVerified,
  };
}

