import { useState, useRef, useMemo, useEffect } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { PageLeadCapture } from '@/components/lead-capture/PageLeadCapture';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  TextSearch, AlertTriangle, CheckCircle2, RefreshCw, Download,
  Link2, ExternalLink, X, ClipboardPaste, FileText, Shield,
  GraduationCap, Briefcase, Newspaper, PenTool, Users, Bot,
  Info, BookOpen, WifiOff, Globe, Sparkles, Layers, History,
  Network, Eye, ShieldAlert, SplitSquareVertical, Table, Image,
  Terminal, FolderLock, ShieldCheck, FileSpreadsheet, FileCode,
  Zap, Compass, Upload, FileJson, ArrowRight, Quote, Check
} from 'lucide-react';
import { analyzePlagiarism, type PlagiarismAnalysisResult } from './detector/detectionEngine';
import HighlightedText, { HighlightLegend } from '@/components/plagiarism/HighlightedText';
import { executePlagiarismForensicsPipeline } from '@/lib/plagiarism/plagiarismIntelligencePipeline';
import { downloadForensicAuditPackage } from '@/lib/plagiarism/forensicReportGenerator';
import {
  getStoredPrivateCorpus,
  savePrivateCorpus,
  type PrivateCorpusDocument
} from '@/lib/plagiarism/privateCorpusEngine';
import { ForensicSummaryHeader } from '@/components/plagiarism/ForensicSummaryHeader';
import { PlagiarismHeatmap } from '@/components/plagiarism/PlagiarismHeatmap';
import { SideBySideEvidenceMap } from '@/components/plagiarism/SideBySideEvidenceMap';
import { AiRewriteTraceCard } from '@/components/plagiarism/AiRewriteTraceCard';
import { SourceClusteringView } from '@/components/plagiarism/SourceClusteringView';
import { ChronologicalTimeline } from '@/components/plagiarism/ChronologicalTimeline';
import { CitationIntelligenceView } from '@/components/plagiarism/CitationIntelligenceView';
import { FalsePositiveInspector } from '@/components/plagiarism/FalsePositiveInspector';
import { ConceptualStructuralView } from '@/components/plagiarism/ConceptualStructuralView';
import { TableDataSimilarityView } from '@/components/plagiarism/TableDataSimilarityView';
import { VisualPlagiarismView } from '@/components/plagiarism/VisualPlagiarismView';
import { CodePlagiarismView } from '@/components/plagiarism/CodePlagiarismView';
import { PrivateCorpusView } from '@/components/plagiarism/PrivateCorpusView';
import { CoverageTransparencyCard } from '@/components/plagiarism/CoverageTransparencyCard';
import { SourceBreakdownView } from '@/components/plagiarism/SourceBreakdownView';
import { DiagnosticTelemetryInspector } from '@/components/plagiarism/DiagnosticTelemetryInspector';
import { PlagiarismBenchmarkSuite } from '@/components/plagiarism/PlagiarismBenchmarkSuite';
import { PlagiarismScreenshotStories } from '@/components/plagiarism/PlagiarismScreenshotStories';
import { PlagiarismForensicCapabilities } from '@/components/plagiarism/PlagiarismForensicCapabilities';
import { PlagiarismMethodologyTrust } from '@/components/plagiarism/PlagiarismMethodologyTrust';
import { PlagiarismFaqAndCta, PLAGIARISM_FAQS } from '@/components/plagiarism/PlagiarismFaqAndCta';
import { useCustomerDataPlatform } from '@/contexts/CustomerDataPlatformContext';
import { trackLifecycleEvent } from '@/lib/trackLifecycleEvent';
import { trackBehaviorEvent } from '@/lib/personalizationApi';
import { toast } from 'sonner';

// ── SEO Schemas ───────────────────────────────────────────────────────────────
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: PLAGIARISM_FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aidetector.cx' },
    { '@type': 'ListItem', position: 2, name: 'Plagiarism Checker', item: 'https://aidetector.cx/plagiarism-checker' },
  ],
};

const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'AIDetector.cx Plagiarism Intelligence Platform',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  description: 'Advanced Plagiarism Intelligence & Evidence Platform with deep paraphrase analysis, Crossref & OpenAlex academic registries, citation verification, and private corpus evaluation.',
};

const SAMPLE_ACADEMIC = `According to recent empirical investigations in artificial intelligence (Vaswani et al., 2017; Devlin et al., 2019), transformer architectures rely heavily on multi-head self-attention mechanisms to compute contextual representations across sequence dimensions. As demonstrated by Brown et al. (2020), scaling language models substantially improves few-shot performance on downstream natural language processing tasks. However, academic integrity policies require clear attribution when reproducing published methodologies or dataset formulations.`;

const SAMPLE_CODE_TABLE = `### Algorithmic Evaluation & Structured Dataset

\`\`\`python
def compute_jaccard_similarity(set_a: set, set_b: set) -> float:
    intersection_cardinality = len(set_a.intersection(set_b))
    union_cardinality = len(set_a.union(set_b))
    return intersection_cardinality / float(union_cardinality) if union_cardinality != 0 else 1.0
\`\`\`

| Model Name | Accuracy (%) | Precision | Recall | F1-Score |
|------------|--------------|-----------|--------|----------|
| BERT-Base  | 91.4%        | 0.892     | 0.905  | 0.898    |
| RoBERTa    | 93.8%        | 0.921     | 0.928  | 0.924    |
| DeBERTa-v3 | 94.6%        | 0.935     | 0.941  | 0.938    |

The empirical findings corroborate that multi-stage architectural representations retain invariant lexical properties under token permutations.`;

const SAMPLE_PARAPHRASE = `Artificial neural networks have swiftly altered organizational workflows throughout multiple commercial domains, providing unprecedented automation capabilities. As machine intelligence becomes increasingly intricate, institutional debates regarding intellectual provenance and ethical responsibility have gained significant prominence among scholarly and corporate institutions.`;

// ── Score color helpers ───────────────────────────────────────────────────────
const scoreColor = (v: number) =>
  v >= 90 ? 'text-emerald-500' : v >= 70 ? 'text-amber-500' : 'text-rose-500';
const scoreBorder = (v: number) =>
  v >= 90 ? 'border-emerald-500/30 bg-emerald-500/5' : v >= 70 ? 'border-amber-500/30 bg-amber-500/5' : 'border-rose-500/30 bg-rose-500/5';

const riskBadgeClass = (risk: string) => {
  if (risk === 'Critical' || risk === 'High') return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
  if (risk === 'Medium') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  if (risk === 'Limited Coverage' || risk.includes('Limited') || risk.includes('Insufficient')) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
  return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
};

/** Map provider status flags into a human-readable coverage line. */
function coverageSummary(result: PlagiarismAnalysisResult): string {
  if (result.status === 'analysis_failed' || result.status === 'provider_unavailable') {
    return 'Providers: Not checked (analysis stopped before database queries were executed)';
  }
  const ps = result.providerStatus;
  const searched: string[] = [];
  const failed: string[] = [];
  const getStat = (val: any) => (typeof val === 'object' && val !== null ? val.status : val);

  if (getStat(ps.crossref) === 'ok') searched.push('Crossref');
  else if (getStat(ps.crossref) === 'failed') failed.push('Crossref');

  if (getStat(ps.openalex) === 'ok') searched.push('OpenAlex');
  else if (getStat(ps.openalex) === 'failed') failed.push('OpenAlex');

  if (getStat(ps.unpaywall) === 'ok') searched.push('Unpaywall');
  else if (getStat(ps.unpaywall) === 'failed') failed.push('Unpaywall');

  if (getStat(ps.webSearch) === 'ok' || getStat(ps.exa) === 'ok') searched.push('Web Search');
  else if (getStat(ps.webSearch) === 'failed' || getStat(ps.exa) === 'failed') failed.push('Web Search');

  const parts: string[] = [];
  if (searched.length) parts.push(`Searched: ${searched.join(', ')}`);
  if (failed.length) parts.push(`Unavailable: ${failed.join(', ')}`);
  return parts.length ? parts.join(' · ') : 'Providers: Not checked';
}

export const DEFAULT_ACADEMIC_RESULT: PlagiarismAnalysisResult = {
  status: 'completed',
  similarityScore: 32,
  originalityScore: 68,
  exactMatchScore: 14,
  nearMatchScore: 12,
  paraphraseMatchScore: 6,
  semanticMatchScore: 8,
  riskLevel: 'Low',
  coverageNote: 'Searched 250M+ scholarly works across Crossref, OpenAlex, Unpaywall, and live academic indexes.',
  providerStatus: {
    crossref: 'ok',
    openalex: 'ok',
    unpaywall: 'ok',
    webSearch: 'ok',
    gemini: 'ok',
  },
  sources: [
    {
      title: 'Attention Is All You Need (Vaswani et al., 2017)',
      url: 'https://arxiv.org/abs/1706.03762',
      publisher: 'Advances in Neural Information Processing Systems (NeurIPS 2017)',
      provider: 'crossref',
      doi: '10.48550/arXiv.1706.03762',
      matchContribution: 16,
      similarity: 94,
      citedMaterial: true,
      verified: true,
      matchType: 'Exact',
      matchedSpans: [
        {
          submittedStart: 138,
          submittedEnd: 286,
          submittedPassage: 'transformer architectures rely heavily on multi-head self-attention mechanisms to compute contextual representations across sequence dimensions.',
          sourcePassage: 'The Transformer is the first transduction model relying entirely on self-attention to compute representations of its input and output without using sequence-aligned RNNs or convolution.',
          matchType: 'exact',
          spanSimilarity: 0.94,
        },
      ],
    },
    {
      title: 'Language Models are Few-Shot Learners (Brown et al., 2020)',
      url: 'https://arxiv.org/abs/2005.14165',
      publisher: 'NeurIPS 2020 Proceedings',
      provider: 'openalex',
      doi: '10.48550/arXiv.2005.14165',
      matchContribution: 11,
      similarity: 91,
      citedMaterial: true,
      verified: true,
      matchType: 'Verified Paraphrase',
      matchedSpans: [
        {
          submittedStart: 308,
          submittedEnd: 432,
          submittedPassage: 'scaling language models substantially improves few-shot performance on downstream natural language processing tasks.',
          sourcePassage: 'We demonstrate that scaling language models greatly enhances task-agnostic, few-shot performance, sometimes reaching competitiveness with prior state-of-the-art fine-tuning approaches.',
          matchType: 'paraphrase',
          spanSimilarity: 0.91,
        },
      ],
    },
    {
      title: 'Guidelines on Academic Integrity and Authorship Ethics',
      url: 'https://publicationethics.org/resources/guidelines',
      publisher: 'Committee on Publication Ethics (COPE)',
      provider: 'unpaywall',
      doi: '10.24318/cope.2019.1.1',
      matchContribution: 5,
      similarity: 86,
      citedMaterial: false,
      verified: true,
      matchType: 'Near Match',
      matchedSpans: [
        {
          submittedStart: 442,
          submittedEnd: 562,
          submittedPassage: 'academic integrity policies require clear attribution when reproducing published methodologies or dataset formulations.',
          sourcePassage: 'Standard institutional academic integrity guidelines mandate explicit attribution whenever published methodologies, empirical formulations, or dataset protocols are reproduced.',
          matchType: 'near',
          spanSimilarity: 0.86,
        },
      ],
    },
  ],
};

export default function PlagiarismCheckerPage() {
  const [content, setContent]       = useState(SAMPLE_ACADEMIC);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult]         = useState<PlagiarismAnalysisResult | null>(DEFAULT_ACADEMIC_RESULT);
  const [error, setError]           = useState<string | null>(null);
  const [scanMode, setScanMode]     = useState<'standard' | 'deep_forensic'>('deep_forensic');
  const [corpusDocs, setCorpusDocs] = useState<PrivateCorpusDocument[]>(() => getStoredPrivateCorpus());
  const [activeTab, setActiveTab]   = useState<
    'heatmap' | 'sources' | 'evidence' | 'ai_rewrite' | 'citations' | 'timeline' | 'clusters' | 'conceptual' | 'tables' | 'visuals' | 'code' | 'private_corpus' | 'false_positives' | 'coverage' | 'diagnostics' | 'benchmark'
  >('evidence');

  const fileRef = useRef<HTMLInputElement>(null);
  const checkerRef = useRef<HTMLDivElement>(null);

  const wordCount = (content.match(/\S+/g) || []).length;
  const charCount = content.length;
  const { trackToolUsage } = useCustomerDataPlatform();

  // Lifecycle analytics on page view
  useEffect(() => {
    trackBehaviorEvent({
      event_type: 'plagiarism_page_view',
      event_category: 'navigation',
      event_data: { page: '/plagiarism-checker' },
    });
  }, []);

  const scrollToChecker = () => {
    checkerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAddCorpusDoc = (doc: PrivateCorpusDocument) => {
    setCorpusDocs((prev) => {
      const updated = [doc, ...prev];
      savePrivateCorpus(updated);
      return updated;
    });
    trackBehaviorEvent({
      event_type: 'plagiarism_corpus_opened',
      event_category: 'tool',
      event_data: { action: 'add_document', title: doc.title },
    });
  };

  const handleRemoveCorpusDoc = (id: string) => {
    setCorpusDocs((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      savePrivateCorpus(updated);
      return updated;
    });
  };

  // Compute Advanced Forensic Intelligence model derived from actual evidence
  const forensicIntelligence = useMemo(() => {
    if (!result || !content) return null;
    if (result.status === 'analysis_failed' || result.status === 'provider_unavailable') return null;
    return executePlagiarismForensicsPipeline(content, result, corpusDocs);
  }, [result, content, corpusDocs]);

  const handleAnalyze = async () => {
    if (!content.trim() || wordCount < 20) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    trackBehaviorEvent({
      event_type: 'plagiarism_scan_started',
      event_category: 'tool',
      event_data: { word_count: wordCount, mode: scanMode },
    });

    try {
      const res = await analyzePlagiarism(content);
      setResult(res);

      if (res.status !== 'analysis_failed' && res.status !== 'provider_unavailable') {
        trackToolUsage('plagiarism', {
          word_count: wordCount,
          similarity_score: res.similarityScore,
          sources_found: res.sources?.length,
          status: res.status,
          mode: scanMode,
        });
        trackLifecycleEvent('first_plagiarism', {
          word_count: wordCount,
          similarity_score: res.similarityScore,
        });
        trackLifecycleEvent('plagiarism_use', { word_count: wordCount });
        trackBehaviorEvent({
          event_type: 'plagiarism_scan_completed',
          event_category: 'tool',
          event_data: {
            word_count: wordCount,
            similarity_score: res.similarityScore,
            status: res.status,
            sources_count: res.sources?.length || 0,
          },
        });

        if (res.status === 'partial') {
          trackBehaviorEvent({
            event_type: 'plagiarism_partial_coverage',
            event_category: 'tool',
            event_data: { coverage: res.coverageNote },
          });
        }
      } else {
        trackBehaviorEvent({
          event_type: 'plagiarism_scan_failed',
          event_category: 'tool',
          event_data: { status: res.status, error: res.errorMessage },
        });
      }
    } catch {
      setError('PLAGIARISM_CHECK_UNAVAILABLE');
      trackBehaviorEvent({
        event_type: 'plagiarism_scan_failed',
        event_category: 'tool',
        event_data: { error: 'PLAGIARISM_CHECK_UNAVAILABLE' },
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setContent(text);
      trackBehaviorEvent({
        event_type: 'plagiarism_text_pasted',
        event_category: 'interaction',
        event_data: { length: text.length },
      });
    } catch {
      // clipboard access denied — ignore
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = (ev.target?.result as string) ?? '';
      setContent(text);
      trackBehaviorEvent({
        event_type: 'plagiarism_file_uploaded',
        event_category: 'interaction',
        event_data: { fileName: file.name, fileSize: file.size, fileType: file.type },
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = () => {
    if (!result) return;
    const text = [
      'Plagiarism Forensic Report — AIDetector.cx',
      `Date: ${new Date().toLocaleString()}`,
      `Status: ${result.status}`,
      '',
      `Similarity Score: ${result.similarityScore}%`,
      `Originality Score: ${result.originalityScore}%`,
      `Risk Level: ${result.riskLevel}`,
      `Exact Match: ${result.exactMatchScore}%`,
      `Near Match: ${result.nearMatchScore}%`,
      `Verified Paraphrase: ${result.paraphraseMatchScore}%`,
      `Candidate Similarity: ${result.semanticMatchScore}%`,
      '',
      `Coverage: ${result.coverageNote}`,
      '',
      `Verified Sources (${result.sources.length}):`,
      ...result.sources.map(s =>
        `  - ${s.title} | ${s.url}${s.doi ? ` | DOI: ${s.doi}` : ''} | ${s.matchContribution}% contribution | ${s.matchType}`
      ),
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'plagiarism-forensic-report.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <PageLeadCapture
        context="plagiarism"
        scrollPercent={70}
        timeSeconds={75}
        showSticky={false}
        stickyLabel="Save Plagiarism Reports"
        stickySubLabel="Free account — no credit card"
      />
      <PageMeta
        title="Plagiarism Checker – Detect Sources & Paraphrasing | AIDetector.cx"
        description="Advanced Plagiarism Intelligence & Evidence Platform. Detect exact matches, deep paraphrases, AI rewrite sources, and duplicate content with multi-source verified evidence."
        canonicalUrl="https://aidetector.cx/plagiarism-checker"
        ogTitle="Plagiarism Checker – Detect Sources & Paraphrasing | AIDetector.cx"
        ogDescription="Multi-stage evidence mapping across 250M+ scholarly works, live web indices, and isolated private archives."
        schemas={[faqSchema, breadcrumbSchema, webAppSchema]}
      />

      {/* ── Above-The-Fold Hero & Live Checker Workspace ─────────────────── */}
      <section ref={checkerRef} className="bg-slate-950 pt-12 pb-12 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6">

          {/* Single H1 & Microcopy */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Plagiarism Intelligence & Evidence Platform</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-3 text-balance">
              Advanced Plagiarism Checker With Source & Paraphrase Detection
            </h1>
            <p className="text-slate-200 max-w-2xl mx-auto text-sm md:text-base leading-relaxed text-pretty mb-4">
              Analyze your content for copied passages, source similarity, paraphrased phrasing, missing citations, and external discovery without unverified accuracy superlatives.
            </p>

            {/* Compact Capability Indicators */}
            <div className="flex flex-col items-center justify-center gap-2 text-xs">
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 bg-[#0d152a] border border-[#1d294d] px-3 py-1.5 rounded-full text-slate-200 text-xs font-normal shadow-sm">
                  <Check className="w-3.5 h-3.5 text-blue-400" /> Exact Match Detection
                </span>
                <span className="flex items-center gap-1.5 bg-[#0d152a] border border-[#1d294d] px-3 py-1.5 rounded-full text-slate-200 text-xs font-normal shadow-sm">
                  <Check className="w-3.5 h-3.5 text-blue-400" /> Deep Paraphrase Analysis
                </span>
                <span className="flex items-center gap-1.5 bg-[#0d152a] border border-[#1d294d] px-3 py-1.5 rounded-full text-slate-200 text-xs font-normal shadow-sm">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Source Verification
                </span>
                <span className="flex items-center gap-1.5 bg-[#0d152a] border border-[#1d294d] px-3 py-1.5 rounded-full text-slate-200 text-xs font-normal shadow-sm">
                  <Check className="w-3.5 h-3.5 text-amber-400" /> Citation Analysis
                </span>
              </div>
              <div className="flex items-center justify-center">
                <span className="flex items-center gap-1.5 bg-[#0d152a] border border-[#1d294d] px-3 py-1.5 rounded-full text-slate-200 text-xs font-normal shadow-sm">
                  <Check className="w-3.5 h-3.5 text-blue-400" /> Cross-Language Analysis
                </span>
              </div>
            </div>
          </div>

          {/* ── Live Checker Workspace ────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* Input column */}
            <div className="lg:col-span-7 flex flex-col gap-4">

              {/* Scan Mode & Engine Settings Bar (Always Visible) */}
              <div className="bg-[#0b1224] border border-[#1b2649] rounded-xl px-4 py-3 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">SCAN MODE:</span>
                  <div className="flex items-center bg-[#070d1d] rounded-lg p-1 border border-[#1b2649]">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={`h-8 text-xs px-3 gap-1.5 font-semibold rounded-md transition-colors ${
                        scanMode === 'standard'
                          ? 'bg-[#4f46e5] text-white shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                      onClick={() => setScanMode('standard')}
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> Standard Scan
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={`h-8 text-xs px-3.5 gap-1.5 font-semibold rounded-md transition-colors ${
                        scanMode === 'deep_forensic'
                          ? 'bg-[#4f46e5] text-white shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                      onClick={() => setScanMode('deep_forensic')}
                    >
                      <Compass className="w-3.5 h-3.5 text-white" /> Deep Forensic Scan (Default)
                    </Button>
                  </div>
                </div>

                <div className="bg-[#152044] text-[#818cf8] border border-[#263566] px-3.5 py-1 rounded-full text-xs font-medium">
                  {scanMode === 'deep_forensic' ? '17 Forensic Engines Active' : 'Standard Text Pipeline'}
                </div>
              </div>

              {/* Active forensic capabilities badges when deep_forensic */}
              {scanMode === 'deep_forensic' && (
                <div className="bg-[#0b1329] border border-[#1b2649] rounded-xl px-4 py-3 flex items-center justify-between gap-2.5 flex-wrap">
                  <div className="flex items-center gap-2 font-semibold text-xs text-indigo-300">
                    <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Deep Forensics Enabled:</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="bg-[#121c3b] px-2.5 py-1 rounded-md border border-[#21315e] text-slate-200 text-xs font-medium">Code AST</span>
                    <span className="bg-[#121c3b] px-2.5 py-1 rounded-md border border-[#21315e] text-slate-200 text-xs font-medium">Table Invariance</span>
                    <span className="bg-[#121c3b] px-2.5 py-1 rounded-md border border-[#21315e] text-slate-200 text-xs font-medium">Figure dHash</span>
                    <span className="bg-[#121c3b] px-2.5 py-1 rounded-md border border-[#21315e] text-slate-200 text-xs font-medium">AI Rewrite Tracing</span>
                    <span className="bg-[#121c3b] px-2.5 py-1 rounded-md border border-[#21315e] text-slate-200 text-xs font-medium">Private Corpus</span>
                    <span className="bg-[#121c3b] px-2.5 py-1 rounded-md border border-[#21315e] text-slate-200 text-xs font-medium">Non-Overlapping Sources</span>
                  </div>
                </div>
              )}

              <Card className="border-[#1b2649] bg-[#0b1224] shadow-2xl rounded-2xl overflow-hidden flex flex-col">
                {/* Toolbar */}
                <div className="bg-[#0c152e] border-b border-[#1b2649] px-5 py-3.5 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white">Paste or type your content</span>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Button
                      type="button"
                      variant="ghost" size="sm"
                      className="h-8 gap-1.5 text-xs text-slate-200 hover:text-white hover:bg-[#162145]"
                      onClick={handlePaste}
                    >
                      <ClipboardPaste className="w-3.5 h-3.5 text-slate-300" /> Paste
                    </Button>
                    <Button
                      type="button"
                      variant="ghost" size="sm"
                      className="h-8 gap-1.5 text-xs text-slate-200 hover:text-white hover:bg-[#162145]"
                      onClick={() => fileRef.current?.click()}
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-300" /> Upload
                    </Button>
                    <input ref={fileRef} type="file" accept=".txt,.doc,.docx,.pdf" className="hidden" onChange={handleFile} />

                    {/* Quick Sample Presets */}
                    <div className="flex items-center gap-1 bg-[#070d1d] p-0.5 rounded-lg border border-[#1b2649]">
                      <Button
                        type="button"
                        variant="ghost" size="sm"
                        className={`h-7 px-2.5 text-xs rounded font-medium transition-colors ${
                          content === SAMPLE_ACADEMIC
                            ? 'bg-[#1e2c56] text-white'
                            : 'text-slate-200 hover:text-white hover:bg-[#162145]'
                        }`}
                        title="Load Academic Essay Sample"
                        onClick={() => {
                          setContent(SAMPLE_ACADEMIC);
                          setResult(DEFAULT_ACADEMIC_RESULT);
                          setActiveTab('evidence');
                          setError(null);
                        }}
                      >
                        Academic
                      </Button>
                      <Button
                        type="button"
                        variant="ghost" size="sm"
                        className={`h-7 px-2.5 text-xs rounded font-medium transition-colors ${
                          content === SAMPLE_CODE_TABLE
                            ? 'bg-[#1e2c56] text-white'
                            : 'text-slate-200 hover:text-white hover:bg-[#162145]'
                        }`}
                        title="Load Code and Tabular Dataset Sample"
                        onClick={() => { setContent(SAMPLE_CODE_TABLE); setResult(null); setError(null); }}
                      >
                        Code & Data
                      </Button>
                      <Button
                        type="button"
                        variant="ghost" size="sm"
                        className={`h-7 px-2.5 text-xs rounded font-medium transition-colors ${
                          content === SAMPLE_PARAPHRASE
                            ? 'bg-[#1e2c56] text-white'
                            : 'text-slate-200 hover:text-white hover:bg-[#162145]'
                        }`}
                        title="Load AI Paraphrased Sample"
                        onClick={() => { setContent(SAMPLE_PARAPHRASE); setResult(null); setError(null); }}
                      >
                        Paraphrase
                      </Button>
                    </div>

                    {content && (
                      <Button
                        type="button"
                        variant="ghost" size="sm"
                        className="h-8 gap-1.5 text-xs text-slate-400 hover:text-white hover:bg-[#162145]"
                        onClick={() => { setContent(''); setResult(null); setError(null); }}
                      >
                        <X className="w-3.5 h-3.5" /> Clear
                      </Button>
                    )}
                  </div>
                </div>

                {/* Textarea */}
                <div className="relative flex-1 bg-[#090f20]">
                  {result && result.sources.length > 0 && !isAnalyzing ? (
                    <div className="p-5 min-h-[300px] overflow-y-auto text-slate-200">
                      <HighlightedText
                        text={content}
                        spans={result.sources.flatMap(s => s.matchedSpans)}
                      />
                      <HighlightLegend />
                    </div>
                  ) : (
                    <Textarea
                      placeholder="Paste your article, essay, research paper or other content here to check for matching sources, paraphrasing, and citation accuracy (minimum 20 words)..."
                      className="w-full min-h-[300px] resize-none border-0 focus-visible:ring-0 rounded-none p-5 text-sm md:text-base leading-relaxed bg-transparent text-slate-100 placeholder:text-slate-400 selection:bg-indigo-900"
                      value={content}
                      onChange={e => { setContent(e.target.value); setError(null); }}
                    />
                  )}
                </div>

                {/* Footer row */}
                <div className="px-4 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className={wordCount > 0 && wordCount < 20 ? 'text-amber-400 font-medium' : ''}>
                      {wordCount.toLocaleString()} words
                    </span>
                    <span>{charCount.toLocaleString()} characters</span>
                    {wordCount > 0 && wordCount < 20 && (
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Min 20 words
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || wordCount < 20}
                    className="h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 shrink-0 shadow-md shadow-primary/20"
                  >
                    {isAnalyzing
                      ? <><RefreshCw className="w-4 h-4 animate-spin" /> Checking…</>
                      : <><TextSearch className="w-4 h-4" /> Check for Plagiarism</>}
                  </Button>
                </div>
              </Card>

              {/* Error panel */}
              {error && (
                <Card className="border-rose-500/30 bg-rose-500/10 shadow-card">
                  <CardContent className="p-4 flex items-start gap-3 text-sm text-rose-400">
                    <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-0.5">Analysis unavailable</p>
                      <p className="text-xs text-slate-400">
                        Could not reach source databases. Please check your connection and try again.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Results column */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Loading state */}
              {isAnalyzing && (
                <Card className="border-slate-800 bg-slate-900 shadow-card flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                  </div>
                  <p className="font-semibold text-white text-sm">Executing 17-Stage Plagiarism Forensics…</p>
                  <p className="text-xs text-slate-400 text-center max-w-[260px] text-pretty">
                    Checking exact matches, deep paraphrases, AI rewrite sources, and Crossref/OpenAlex registries.
                  </p>
                </Card>
              )}

              {/* Empty state */}
              {!isAnalyzing && !result && (
                <Card className="border-slate-800 bg-slate-900/60 shadow-card flex flex-col items-center justify-center py-12 px-6 gap-4">
                  <div className="w-14 h-14 bg-slate-800/80 rounded-2xl flex items-center justify-center">
                    <TextSearch className="w-7 h-7 text-slate-400" />
                  </div>
                  <p className="font-semibold text-white text-sm">Ready for Forensic Analysis</p>
                  <p className="text-xs text-slate-400 text-center max-w-[260px] text-pretty">
                    Paste your content on the left and click Check for Plagiarism to inspect your verified evidence report.
                  </p>
                  <div className="mt-2 space-y-2 text-xs text-slate-300 w-full max-w-[280px]">
                    {[
                      'Exact-match discovery across 250M+ records',
                      'Deep paraphrase & syntactic sentence analysis',
                      'AI Rewrite Source Tracing (fact sequencing)',
                      'Quotation & citation style separation',
                      'Private student corpus comparison sandbox',
                      'Transparent search provider coverage matrix',
                    ].map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{f}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Results */}
              {!isAnalyzing && result && (
                <div className="space-y-4">

                  {/* Error / unavailable states */}
                  {(result.status === 'analysis_failed' || result.status === 'provider_unavailable') && (
                    <Card className="border-rose-500/30 bg-rose-500/10 shadow-card">
                      <CardContent className="p-4 flex items-start gap-3">
                        <WifiOff className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-rose-300 mb-0.5">
                            {result.status === 'provider_unavailable' ? 'Source providers unavailable' : 'Analysis failed'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {result.errorMessage ?? 'Could not reach source databases. Please try again.'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* No matches */}
                  {result.status === 'no_verified_matches' && (
                    <Card className="border-emerald-500/30 bg-emerald-500/10 shadow-card">
                      <CardContent className="p-4 flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-emerald-300 mb-0.5">No verified matches in completed searches</p>
                          <p className="text-xs text-slate-400 text-pretty">
                            No verified matches were discovered in the queried academic registries and web indices.
                            This confirms zero matching evidence in completed searches, rather than an unverified guarantee of 100% originality.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Partial warning */}
                  {result.status === 'partial' && (
                    <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Partial results — one or more providers were unavailable or timed out.
                    </div>
                  )}

                  {/* Scores (when analysis ran) */}
                  {(result.status === 'completed' || result.status === 'partial') && (
                    <Card className={`border shadow-card bg-slate-900 ${scoreBorder(result.similarityScore)}`}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <TextSearch className="w-4 h-4 text-primary" /> Similarity Score
                          </span>
                          <Badge className={riskBadgeClass(result.riskLevel)}>
                            {result.riskLevel} Risk
                          </Badge>
                        </div>
                        <div className="flex items-end gap-3 mb-2">
                          <span className={`text-5xl font-extrabold ${scoreColor(100 - result.similarityScore)}`}>
                            {result.similarityScore}%
                          </span>
                          <span className="text-sm text-slate-400 mb-1.5 font-medium uppercase tracking-wider">Similar</span>
                        </div>
                        <Progress value={result.similarityScore} className="h-2.5 mb-4" />
                        <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-800 pt-4">
                          {[
                            ['Originality', result.status === 'partial' && result.similarityScore === 0 ? 'Unconfirmed (Partial)' : `${result.originalityScore}%`],
                            ['Exact Match', `${result.exactMatchScore}%`],
                            ['Near Match', `${result.nearMatchScore}%`],
                            ['Verified Paraphrase', `${result.paraphraseMatchScore}%`],
                            ['Candidate Similarity', `${result.semanticMatchScore}%`],
                          ].map(([label, val]) => (
                            <div key={label} className="flex justify-between items-center">
                              <span className="text-slate-400">{label}:</span>
                              <span className="font-semibold text-slate-200">{val}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Verified sources */}
                  <Card className="border-slate-800 bg-slate-900 shadow-card">
                    <CardHeader className="pb-2 pt-4 px-5 border-b border-slate-800">
                      <CardTitle className="text-sm font-semibold text-white flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Link2 className="w-4 h-4 text-primary" /> Verified Sources
                        </span>
                        <span className="text-xs text-slate-400 font-normal">
                          {result.status === 'analysis_failed' || result.status === 'provider_unavailable'
                            ? 'Unavailable'
                            : `${result.sources.length} source${result.sources.length !== 1 ? 's' : ''}`}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {result.status === 'analysis_failed' || result.status === 'provider_unavailable' ? (
                        <div className="p-5 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
                          <WifiOff className="w-6 h-6 text-slate-600" />
                          <span>Analysis did not complete. Source results are unavailable.</span>
                        </div>
                      ) : result.sources.length === 0 ? (
                        <div className="p-5 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
                          <BookOpen className="w-6 h-6 text-slate-600" />
                          <span>No verified sources found in checked databases.</span>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-800 max-h-[280px] overflow-y-auto">
                          {result.sources.map((source, i) => (
                            <div key={i} className="p-4 hover:bg-slate-800/40 transition-colors">
                              <div className="flex justify-between items-start gap-2 mb-1.5">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-xs text-slate-200 truncate" title={source.title}>
                                    {source.title}
                                  </p>
                                  <p className="text-[10px] text-slate-400 truncate">{source.publisher}</p>
                                </div>
                                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 shrink-0 text-[10px]">
                                  {source.matchContribution}%
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  {source.provider === 'web'
                                    ? <Globe className="w-3 h-3 text-slate-400" />
                                    : <BookOpen className="w-3 h-3 text-slate-400" />}
                                  {source.matchType}
                                  {source.doi && <span className="ml-1 font-mono text-[10px] bg-slate-800 px-1 rounded text-slate-300">DOI</span>}
                                  {source.provider === 'web' && <span className="ml-1 text-[10px] bg-primary/20 text-primary px-1 rounded">Web</span>}
                                </span>
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 text-primary hover:underline"
                                >
                                  View <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Coverage note */}
                  <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                    <div>
                      <span className="text-pretty">{result.coverageNote}</span>
                      {result.providerStatus && (
                        <p className="mt-1 opacity-75">{coverageSummary(result)}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {result && (
                    <div className="space-y-2">
                      {forensicIntelligence ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Button
                            type="button"
                            className="w-full h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                            onClick={() => {
                              downloadForensicAuditPackage(forensicIntelligence, 'txt');
                              toast.success('Downloaded 8-Section Forensic Audit Package (.TXT)');
                            }}
                          >
                            <Download className="w-4 h-4" /> Audit Package (.TXT)
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-10 gap-2 border-slate-700 text-slate-200 hover:bg-slate-800 font-semibold"
                            onClick={() => {
                              downloadForensicAuditPackage(forensicIntelligence, 'json');
                              toast.success('Downloaded Forensic Audit Package (.JSON)');
                            }}
                          >
                            <FileJson className="w-4 h-4" /> Audit Package (.JSON)
                          </Button>
                        </div>
                      ) : (
                        result.sources.length > 0 && (
                          <Button
                            className="w-full h-10 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                            onClick={handleExport}
                          >
                            <Download className="w-4 h-4" /> Export Report (.TXT)
                          </Button>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── ADVANCED FORENSIC INTELLIGENCE SUITE SECTION (When analysis has run) ── */}
          {forensicIntelligence && !isAnalyzing && (
            <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col gap-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-primary" />
                    Plagiarism Forensic Intelligence Suite
                  </h2>
                  <p className="text-slate-400 text-xs md:text-sm mt-0.5">
                    17-Stage Deep Evidence Mapping, Non-Overlapping Source Accounting & Multi-Modal Audit.
                  </p>
                </div>

                {/* Scan Mode & Export Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-800">
                    <Button
                      variant={scanMode === 'standard' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-7 text-xs px-2.5 gap-1"
                      onClick={() => setScanMode('standard')}
                    >
                      <Zap className="w-3 h-3 text-amber-400" /> Standard Scan
                    </Button>
                    <Button
                      variant={scanMode === 'deep_forensic' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-7 text-xs px-2.5 gap-1 bg-slate-800 text-white"
                      onClick={() => setScanMode('deep_forensic')}
                    >
                      <Compass className="w-3 h-3 text-primary" /> Deep Forensic Scan
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs gap-1.5 border border-slate-700 text-slate-200 hover:bg-slate-800 font-medium"
                    onClick={() => {
                      downloadForensicAuditPackage(forensicIntelligence, 'txt');
                      toast.success('Downloaded 8-Section Forensic Audit Package (.TXT)');
                    }}
                  >
                    <Download className="w-3.5 h-3.5" /> 8-Section Audit (.TXT)
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs gap-1.5 border border-slate-700 text-slate-200 hover:bg-slate-800 font-medium"
                    onClick={() => {
                      downloadForensicAuditPackage(forensicIntelligence, 'json');
                      toast.success('Downloaded Forensic Audit Package (.JSON)');
                    }}
                  >
                    <FileJson className="w-3.5 h-3.5" /> JSON Export
                  </Button>
                </div>
              </div>

              {/* Forensic Summary Metric Cards */}
              <ForensicSummaryHeader intel={forensicIntelligence} />

              {/* Forensic Navigation Tabs */}
              <Card className="border-slate-800 bg-slate-900 shadow-card overflow-hidden">
                <CardHeader className="bg-slate-950 border-b border-slate-800 py-3 px-4">
                  <Tabs
                    value={activeTab}
                    onValueChange={(v: any) => setActiveTab(v)}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-12 h-auto p-1 bg-slate-900 border border-slate-800 gap-1">
                      <TabsTrigger value="heatmap" className="text-xs py-1.5 gap-1">
                        <Eye className="w-3.5 h-3.5" /> Heatmap
                      </TabsTrigger>
                      <TabsTrigger value="sources" className="text-xs py-1.5 gap-1">
                        <Link2 className="w-3.5 h-3.5" /> Sources
                      </TabsTrigger>
                      <TabsTrigger value="evidence" className="text-xs py-1.5 gap-1">
                        <SplitSquareVertical className="w-3.5 h-3.5" /> Evidence
                      </TabsTrigger>
                      <TabsTrigger value="ai_rewrite" className="text-xs py-1.5 gap-1">
                        <Bot className="w-3.5 h-3.5" /> AI Rewrites
                      </TabsTrigger>
                      <TabsTrigger value="citations" className="text-xs py-1.5 gap-1">
                        <BookOpen className="w-3.5 h-3.5" /> Citations
                      </TabsTrigger>
                      <TabsTrigger value="timeline" className="text-xs py-1.5 gap-1">
                        <History className="w-3.5 h-3.5" /> Timeline
                      </TabsTrigger>
                      <TabsTrigger value="clusters" className="text-xs py-1.5 gap-1">
                        <Network className="w-3.5 h-3.5" /> Clusters
                      </TabsTrigger>
                      <TabsTrigger value="conceptual" className="text-xs py-1.5 gap-1">
                        <Layers className="w-3.5 h-3.5" /> Concepts
                      </TabsTrigger>
                      <TabsTrigger value="tables" className="text-xs py-1.5 gap-1">
                        <Table className="w-3.5 h-3.5" /> Tables
                      </TabsTrigger>
                      <TabsTrigger value="code" className="text-xs py-1.5 gap-1">
                        <Terminal className="w-3.5 h-3.5" /> Code
                      </TabsTrigger>
                      <TabsTrigger value="private_corpus" className="text-xs py-1.5 gap-1">
                        <FolderLock className="w-3.5 h-3.5" /> Corpus
                      </TabsTrigger>
                      <TabsTrigger value="coverage" className="text-xs py-1.5 gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Coverage
                      </TabsTrigger>
                      <TabsTrigger value="diagnostics" className="text-xs py-1.5 gap-1">
                        <Terminal className="w-3.5 h-3.5" /> Telemetry
                      </TabsTrigger>
                      <TabsTrigger value="benchmark" className="text-xs py-1.5 gap-1">
                        <Zap className="w-3.5 h-3.5" /> Benchmarks
                      </TabsTrigger>
                    </TabsList>

                    <div className="p-4 bg-slate-900">
                      <TabsContent value="heatmap" className="m-0">
                        <PlagiarismHeatmap text={content} matches={forensicIntelligence.evidenceMatches} />
                      </TabsContent>

                      <TabsContent value="sources" className="m-0">
                        <SourceBreakdownView
                          sources={forensicIntelligence.individualSourceContributions}
                          overallSimilarity={forensicIntelligence.rawSimilarityPercentage}
                        />
                      </TabsContent>

                      <TabsContent value="evidence" className="m-0">
                        <SideBySideEvidenceMap matches={forensicIntelligence.evidenceMatches} />
                      </TabsContent>

                      <TabsContent value="ai_rewrite" className="m-0">
                        <AiRewriteTraceCard traces={forensicIntelligence.aiRewriteTraces} />
                      </TabsContent>

                      <TabsContent value="citations" className="m-0">
                        <CitationIntelligenceView citations={forensicIntelligence.citations} />
                      </TabsContent>

                      <TabsContent value="timeline" className="m-0">
                        <ChronologicalTimeline timeline={forensicIntelligence.chronologicalTimeline} />
                      </TabsContent>

                      <TabsContent value="clusters" className="m-0">
                        <SourceClusteringView
                          clusters={forensicIntelligence.sourceClusters}
                          credibilityMap={forensicIntelligence.sourceCredibilityMap}
                        />
                      </TabsContent>

                      <TabsContent value="conceptual" className="m-0">
                        <ConceptualStructuralView
                          conceptual={forensicIntelligence.conceptualSimilarities}
                          structural={forensicIntelligence.structuralSimilarities}
                          crossLingual={forensicIntelligence.crossLingualMatches}
                        />
                      </TabsContent>

                      <TabsContent value="tables" className="m-0">
                        <TableDataSimilarityView matches={forensicIntelligence.tableSimilarityMatches} />
                      </TabsContent>

                      <TabsContent value="code" className="m-0">
                        <CodePlagiarismView matches={forensicIntelligence.codePlagiarismMatches} />
                      </TabsContent>

                      <TabsContent value="private_corpus" className="m-0">
                        <PrivateCorpusView
                          matches={forensicIntelligence.selfSimilarityMatches}
                          corpusDocuments={corpusDocs}
                          onAddDocument={handleAddCorpusDoc}
                          onRemoveDocument={handleRemoveCorpusDoc}
                        />
                      </TabsContent>

                      <TabsContent value="coverage" className="m-0">
                        <CoverageTransparencyCard report={forensicIntelligence.searchCoverageReport} />
                      </TabsContent>

                      <TabsContent value="diagnostics" className="m-0">
                        {result && <DiagnosticTelemetryInspector result={result} />}
                      </TabsContent>

                      <TabsContent value="benchmark" className="m-0">
                        <PlagiarismBenchmarkSuite />
                      </TabsContent>
                    </div>
                  </Tabs>
                </CardHeader>
              </Card>
            </div>
          )}

        </div>
      </section>

      {/* ── Capability Strip & Positioning Modules ───────────────────────── */}
      <PlagiarismForensicCapabilities onScrollToChecker={scrollToChecker} />

      {/* ── Real Screenshot Stories (4 Stories) ─────────────────────────── */}
      <PlagiarismScreenshotStories onScrollToChecker={scrollToChecker} />

      {/* ── Methodology, Workflow, System Limitations & Privacy ─────────── */}
      <PlagiarismMethodologyTrust onScrollToChecker={scrollToChecker} />

      {/* ── Natural Internal Links Section ──────────────────────────────── */}
      <section className="py-12 border-y border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-6">
            <span className="text-xs uppercase font-mono font-semibold text-muted-foreground tracking-wider">
              Integrated Content Integrity Ecosystem
            </span>
            <h3 className="text-lg md:text-xl font-bold text-foreground mt-1">
              Connect With AIDetector.cx Verification Tools
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/"
              className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1 text-primary font-bold text-sm">
                  <Bot className="w-4 h-4" /> AI Content Detector
                </div>
                <p className="text-xs text-muted-foreground">
                  Dual-engine analysis for ChatGPT, GPT-4o, Claude 3.5, and Gemini with sentence-level perplexity scores.
                </p>
              </div>
              <span className="mt-3 text-xs text-primary font-semibold flex items-center gap-1">
                Open AI Detector <ArrowRight className="w-3 h-3" />
              </span>
            </a>

            <a
              href="/citation-verifier"
              className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1 text-emerald-500 font-bold text-sm">
                  <BookOpen className="w-4 h-4" /> Citation Verifier
                </div>
                <p className="text-xs text-muted-foreground">
                  Verify source citations, Crossref DOIs, and PubMed identifiers to detect hallucinated or broken references.
                </p>
              </div>
              <span className="mt-3 text-xs text-emerald-500 font-semibold flex items-center gap-1">
                Open Citation Verifier <ArrowRight className="w-3 h-3" />
              </span>
            </a>

            <a
              href="/humanizer"
              className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1 text-indigo-500 font-bold text-sm">
                  <Sparkles className="w-4 h-4" /> Text Humanizer
                </div>
                <p className="text-xs text-muted-foreground">
                  Refine automated text rhythm and stylistic variation while preserving scientific facts and terminology.
                </p>
              </div>
              <span className="mt-3 text-xs text-indigo-500 font-semibold flex items-center gap-1">
                Open Humanizer <ArrowRight className="w-3 h-3" />
              </span>
            </a>

            <a
              href="/seo-assistant"
              className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1 text-amber-500 font-bold text-sm">
                  <FileText className="w-4 h-4" /> SEO Assistant
                </div>
                <p className="text-xs text-muted-foreground">
                  Optimize content uniqueness, readability metrics, and topical coverage to protect search engine rankings.
                </p>
              </div>
              <span className="mt-3 text-xs text-amber-500 font-semibold flex items-center gap-1">
                Open SEO Assistant <ArrowRight className="w-3 h-3" />
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ & Bottom Conversion CTA ─────────────────────────────────── */}
      <PlagiarismFaqAndCta onScrollToChecker={scrollToChecker} />

    </MainLayout>
  );
}
