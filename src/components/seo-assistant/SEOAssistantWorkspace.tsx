import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Wand2, Sparkles, RefreshCw, ChevronRight, Loader2, X, FileEdit, ShieldCheck, Lock, ArrowRight, UserPlus, LogIn, Sparkle, Save, Trash2, Check, History, Globe, BookmarkCheck, AlertCircle
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger
} from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { streamLLM } from '@/lib/sse';
import { toast } from 'sonner';
import { RichTextEditor, type RichTextEditorRef } from '@/pages/seo-assistant/RichTextEditor';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useUpgradeModal } from '@/hooks/useUpgradeModal';
import UpgradeModal from '@/components/common/UpgradeModal';
import UsageBadge from '@/components/common/UsageBadge';
import { calculateBloggerAnalysisCost } from '@/lib/entitlements';
import { reserveEntitlement, finalizeReservation } from '@/lib/entitlementsApi';
import {
  getSEOAssistantHistory,
  saveSEOAssistantHistoryItem,
  saveSyncedSEOAssistantHistoryItem,
  generateContentHash,
  extractArticleTitle,
  type SEOAnalysisHistoryItem
} from '@/lib/seoAssistantHistory';
import { SEOAssistantHistoryDialog } from './SEOAssistantHistoryDialog';
import {
  resolveSavedSEOProjectDomain,
  getStoredSEOProjectDomain,
  persistSEOProjectDomain,
  saveDomainToActiveSEOProject,
  getActiveSEOProjectSummary,
} from '@/lib/seo/domainPrefill';

// Analysis engine
import {
  analyzeKeywordUsage, analyzeSemanticKeywords, analyzeSearchIntent,
  analyzeReadability, analyzeSentences, analyzeParagraphs,
  analyzeTransitionWords, analyzeGrammar, analyzeHeadingStructure,
  analyzeEEAT, analyzeEngagement, analyzeSnippetPotential,
  analyzeAIRisk, analyzeUniqueness, generateMeta, computeOverallScores,
  computeCompetitorKeywordCoverage,
  type KeywordUsageResult, type SemanticKeywordsResult, type SearchIntentResult,
  type ReadabilityResult, type SentenceAnalysisResult, type ParagraphAnalysisResult,
  type TransitionWordsResult, type GrammarResult, type HeadingStructureResult,
  type EEATResult, type EngagementResult, type SnippetResult,
  type AIRiskResult, type UniquenessResult, type MetaResult, type OverallScores,
  type CompetitorResult, type ContentGapResult
} from '@/pages/seo-assistant/analysisEngine';
import { BloggerWorkflowSteps } from './BloggerWorkflowSteps';
import { evaluateBloggerKeywords, type BloggerKeywordEvaluationResult } from '@/lib/seo/bloggerKeywordMetrics';
import {
  type DiscoveredInternalLink,
  normalizeAndValidateDomain,
  extractLinksFromJsonResponse,
  matchInternalLinksToArticle,
} from '@/lib/seo/internalLinkDiscovery';

// Modules 1–10
import {
  OverallScorePanel, KeywordUsagePanel, SemanticKeywordsPanel,
  SearchIntentPanel, ReadabilityPanel, SentenceAnalysisPanel,
  ParagraphAnalysisPanel, TransitionWordsPanel, GrammarPanel,
} from '@/pages/seo-assistant/AnalysisModules1to10';

// Modules 11–20
import {
  HeadingStructurePanel, EEATPanel, EngagementPanel, InternalLinkingPanel,
  SnippetPanel, MetaOptimizationPanel, UniquenessPanel, AIRiskPanel,
  FAQPanel, ExportPanel, CompetitorIntelligencePanel
} from '@/pages/seo-assistant/AnalysisModules11to20';

// Extended SEO Modules
import { BalancedDetectionModule } from '@/components/seo-assistant/BalancedDetectionModule';
import { MultilingualPlagiarismModule } from '@/components/seo-assistant/MultilingualPlagiarismModule';
import { AuthorshipSignatureModule } from '@/components/seo-assistant/AuthorshipSignatureModule';
import { SEOAssistantHighlights } from '@/components/seo-assistant/SEOAssistantHighlights';
import type { BalancedDetectorResult } from '@/lib/detection/balancedDetectorService';
import type { PlagiarismAnalysisResult } from '@/pages/detector/detectionEngine';
import type { RegisterResult } from '@/lib/verifiedAuthorship/authorshipService';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const DEFAULT_PLACEHOLDER = `# Your Blog Post Title Here

Start writing or paste your blog post to begin real-time SEO and AI analysis.

## Introduction
Begin your blog article here. The assistant will check keyword placement, readability, sentence length, AI writing patterns, and publishing readiness as you write.

## Main Key Insights
Add your main analysis, actionable examples, and personal perspectives here...`;

const DEFAULT_KW_RESULT: KeywordUsageResult = { density: 0, count: 0, inH1: false, inIntro: false, inHeadings: false, inConclusion: false, recommendations: ['Enter a target keyword above to analyze placement.'] };
const DEFAULT_SCORES: OverallScores = { seo: 0, readability: 0, grammar: 0, eeat: 0, structure: 0, engagement: 0, overall: 0, publishingScore: 0, readyToPublish: false };

const FEATURE_SLUG = 'seo_assistant';

export interface SEOAssistantWorkspaceProps {
  isBloggerLanding?: boolean;
  enableBloggerOptimization?: boolean;
  initialContent?: string;
  initialKeyword?: string;
  className?: string;
  placeholder?: string;
  showHeaderControls?: boolean;
}

export function SEOAssistantWorkspace({
  isBloggerLanding = false,
  enableBloggerOptimization = false,
  initialContent = '',
  initialKeyword = '',
  className = '',
  placeholder = DEFAULT_PLACEHOLDER,
  showHeaderControls = true,
}: SEOAssistantWorkspaceProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isBloggerMode = isBloggerLanding || enableBloggerOptimization;
  const featureSlugForBilling = isBloggerLanding ? 'ai_checker_for_bloggers' : FEATURE_SLUG;
  const { entitlement, summary, loading: entitlementLoading, refresh } = useEntitlement(featureSlugForBilling);
  const { open, featureName, trigger, remaining, limit, openUpgradeModal, closeUpgradeModal } = useUpgradeModal();

  const isGuest = !user || summary?.isAuthenticated === false;
  const isSubscriber = summary?.isPaidActive === true && ['pro', 'pro_plus', 'pro+', 'business', 'enterprise'].includes((summary?.plan || '').toLowerCase());
  const isRegisteredNonSubscriber = !isGuest && !isSubscriber;

  // Editor state
  const [content, setContent] = useState(initialContent);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [wordCount, setWordCount] = useState(() => {
    return initialContent ? initialContent.split(/\s+/).filter(Boolean).length : 0;
  });

  // Analysis lifecycle state
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzedHash, setLastAnalyzedHash] = useState<string | null>(null);

  // History state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyCount, setHistoryCount] = useState(() => getSEOAssistantHistory().length);

  // Analysis results
  const [kwResult, setKwResult] = useState<KeywordUsageResult>(DEFAULT_KW_RESULT);
  const [semanticResult, setSemanticResult] = useState<SemanticKeywordsResult>({ recommended: [], found: [], missing: [], coveragePercent: 0 });
  const [intentResult, setIntentResult] = useState<SearchIntentResult>({ informational: 25, commercial: 25, transactional: 25, navigational: 25, dominant: 'informational', matchPercent: 25, recommendation: 'Analyze content to see intent match.' });
  const [readabilityResult, setReadabilityResult] = useState<ReadabilityResult>({ score: 0, label: 'Difficult', avgWordsPerSentence: 0, avgSyllablesPerWord: 0 });
  const [sentenceResult, setSentenceResult] = useState<SentenceAnalysisResult>({ longSentenceCount: 0, passiveVoiceCount: 0, totalSentences: 0, longSentences: [], veryLongSentences: [], recommendations: ['Start writing to analyze sentence structure.'] });
  const [paraResult, setParaResult] = useState<ParagraphAnalysisResult>({ longParagraphCount: 0, veryLongParagraphCount: 0, totalParagraphs: 0, recommendations: ['Start writing to analyze paragraphs.'] });
  const [transitionResult, setTransitionResult] = useState<TransitionWordsResult>({ count: 0, totalSentences: 0, percentage: 0, found: [], missing: [], recommendations: ['Start writing to analyze transition words.'] });
  const [grammarResult, setGrammarResult] = useState<GrammarResult>({ score: 100, issues: [] });
  const [headingResult, setHeadingResult] = useState<HeadingStructureResult>({ h1Count: 0, h2Count: 0, h3Count: 0, headings: [], issues: [], score: 0 });
  const [eeatResult, setEeatResult] = useState<EEATResult>({ score: 0, hasPersonalExamples: false, hasStats: false, hasCitations: false, hasAuthor: false, recommendations: ['Start writing to analyze EEAT signals.'] });
  const [engagementResult, setEngagementResult] = useState<EngagementResult>({ score: 0, questionCount: 0, exampleCount: 0, dataCount: 0, recommendations: ['Start writing to analyze engagement.'] });
  const [snippetResult, setSnippetResult] = useState<SnippetResult>({ score: 0, hasDefinition: false, hasList: false, hasTable: false, hasFAQ: false, recommendations: [] });
  const [aiRiskResult, setAiRiskResult] = useState<AIRiskResult>({ humanScore: 50, aiScore: 50, riskLevel: 'Medium', recommendations: [] });
  const [uniquenessResult, setUniquenessResult] = useState<UniquenessResult>({ score: 100, duplicatePhrases: [], overusedWords: [], recommendations: [] });
  const [metaResult, setMetaResult] = useState<MetaResult>({ suggestedTitle: '', suggestedDescription: '', suggestedSlug: '', titleLength: 0, descLength: 0, titleOk: false, descOk: false });
  const [internalLinks, setInternalLinks] = useState<DiscoveredInternalLink[]>([]);
  const [internalLinkDomain, setInternalLinkDomain] = useState<string>(() => getStoredSEOProjectDomain());
  const [activeProjectName, setActiveProjectName] = useState<string>('');
  const [savingProjectDomain, setSavingProjectDomain] = useState<boolean>(false);
  const [internalLinkStatus, setInternalLinkStatus] = useState<'not_fetched' | 'loading' | 'success' | 'no_opportunities' | 'site_blocked' | 'invalid_domain' | 'error'>('not_fetched');
  const [internalLinkStatusMessage, setInternalLinkStatusMessage] = useState<string>('');
  const [competitors, setCompetitors] = useState<CompetitorResult[]>([]);
  const [contentGap, setContentGap] = useState<ContentGapResult | null>(null);

  const [aiLinksActive, setAiLinksActive] = useState(false);
  const [aiGrammarActive, setAiGrammarActive] = useState(false);
  const [scores, setScores] = useState<OverallScores>(DEFAULT_SCORES);
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [generatingFaq, setGeneratingFaq] = useState(false);
  const [generatingLinks, setGeneratingLinks] = useState(false);
  const [fixingGrammar, setFixingGrammar] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // AI Generation & Rewrite Modals
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiKeyword, setAiKeyword] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiRewriting, setAiRewriting] = useState(false);
  const [aiRec, setAiRec] = useState('');
  const [aiRecLoading, setAiRecLoading] = useState(false);
  const [loadingCompetitors, setLoadingCompetitors] = useState(false);

  // Extended Modules State
  const [balancedResult, setBalancedResult] = useState<BalancedDetectorResult | null>(null);
  const [balancedLoading, setBalancedLoading] = useState(false);
  const [plagiarismResult, setPlagiarismResult] = useState<PlagiarismAnalysisResult | null>(null);
  const [plagiarismLoading, setPlagiarismLoading] = useState(false);
  const [authorshipResult, setAuthorshipResult] = useState<RegisterResult | null>(null);
  const [plagiarismHighlightActive, setPlagiarismHighlightActive] = useState(false);
  const [balancedHighlightActive, setBalancedHighlightActive] = useState(false);

  const autoSaveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const analysisDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const documentVersionRef = useRef<number>(1);
  const isAnalyzedRef = useRef<boolean>(false);
  isAnalyzedRef.current = isAnalyzed;
  const editorRef = useRef<RichTextEditorRef>(null);

  const DRAFT_STORAGE_KEY = 'aidetector_blogger_draft';
  const BLOGGER_SESSION_KEY = 'aidetector_blogger_session';
  const [draftSavedTime, setDraftSavedTime] = useState<number | null>(null);

  // Blogger 3-step workflow state
  const [bloggerStep, setBloggerStep] = useState<1 | 2 | 3>(() => {
    if (!isBloggerMode) return 3;
    try {
      const saved = localStorage.getItem(BLOGGER_SESSION_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (p.step) return p.step;
      }
    } catch {}
    return 1;
  });

  const [bloggerRelatedKeywords, setBloggerRelatedKeywords] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(BLOGGER_SESSION_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (Array.isArray(p.relatedKeywords)) return p.relatedKeywords;
      }
    } catch {}
    return ['', '', ''];
  });

  const [bloggerTargetCountry, setBloggerTargetCountry] = useState<string>(() => {
    try { const saved = localStorage.getItem(BLOGGER_SESSION_KEY); if (saved) return JSON.parse(saved).targetCountry || 'United States'; } catch {}
    return 'United States';
  });
  const [bloggerTargetLanguage, setBloggerTargetLanguage] = useState<string>(() => {
    try { const saved = localStorage.getItem(BLOGGER_SESSION_KEY); if (saved) return JSON.parse(saved).targetLanguage || 'en'; } catch {}
    return 'en';
  });
  const [bloggerAutoGenerateRelated, setBloggerAutoGenerateRelated] = useState<boolean>(() => {
    try { const saved = localStorage.getItem(BLOGGER_SESSION_KEY); if (saved) return Boolean(JSON.parse(saved).autoGenerateRelated); } catch {}
    return false;
  });

  const [bloggerTitle, setBloggerTitle] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(BLOGGER_SESSION_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (p.title) return p.title;
      }
    } catch {}
    return '';
  });

  const [isKeywordsLocked, setIsKeywordsLocked] = useState<boolean>(() => {
    if (!isBloggerMode) return false;
    try {
      const saved = localStorage.getItem(BLOGGER_SESSION_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        return Boolean(p.isKeywordsLocked);
      }
    } catch {}
    return false;
  });

  const [isTitleLocked, setIsTitleLocked] = useState<boolean>(() => {
    if (!isBloggerMode) return false;
    try {
      const saved = localStorage.getItem(BLOGGER_SESSION_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        return Boolean(p.isTitleLocked);
      }
    } catch {}
    return false;
  });

  const [isBloggerCreditsCharged, setIsBloggerCreditsCharged] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(BLOGGER_SESSION_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        return Boolean(p.isCreditsCharged);
      }
    } catch {}
    return false;
  });

  const [bloggerMetrics, setBloggerMetrics] = useState<BloggerKeywordEvaluationResult | null>(null);
  const [bloggerAnalysisSignature, setBloggerAnalysisSignature] = useState<string | null>(null);
  const [isLockingTitle, setIsLockingTitle] = useState(false);
  const bloggerLockAttemptKeyRef = useRef<string | null>(null);

  const currentBloggerAnalysisSignature = `${keyword.trim().toLowerCase()}|${bloggerTargetCountry}|${bloggerTargetLanguage}|${bloggerAutoGenerateRelated ? 'auto' : 'manual'}|${bloggerAutoGenerateRelated ? '' : bloggerRelatedKeywords.map(k => k.trim().toLowerCase()).filter(Boolean).join(',')}`;
  const hasCurrentBloggerAnalysis = Boolean(bloggerMetrics && bloggerAnalysisSignature === currentBloggerAnalysisSignature);

  // Never show estimated/fabricated Blogger metrics. Editing the research target invalidates prior live evidence.
  useEffect(() => {
    if (isBloggerMode && !isKeywordsLocked && bloggerAnalysisSignature && bloggerAnalysisSignature !== currentBloggerAnalysisSignature) {
      setBloggerMetrics(null);
      setBloggerAnalysisSignature(null);
    }
  }, [currentBloggerAnalysisSignature, bloggerAnalysisSignature, isBloggerMode, isKeywordsLocked]);

  const saveBloggerSession = useCallback((updates: Partial<{
    step: 1 | 2 | 3;
    primaryKeyword: string;
    relatedKeywords: string[];
    targetCountry: string;
    targetLanguage: string;
    autoGenerateRelated: boolean;
    title: string;
    isKeywordsLocked: boolean;
    isTitleLocked: boolean;
    isCreditsCharged: boolean;
    metrics: BloggerKeywordEvaluationResult | null;
  }>) => {
    if (!isBloggerMode) return;
    try {
      const current = {
        step: bloggerStep,
        primaryKeyword: keyword,
        relatedKeywords: bloggerRelatedKeywords,
        targetCountry: bloggerTargetCountry,
        targetLanguage: bloggerTargetLanguage,
        autoGenerateRelated: bloggerAutoGenerateRelated,
        title: bloggerTitle,
        isKeywordsLocked,
        isTitleLocked,
        isCreditsCharged: isBloggerCreditsCharged,
        metrics: bloggerMetrics,
        ...updates
      };
      localStorage.setItem(BLOGGER_SESSION_KEY, JSON.stringify(current));
    } catch {}
  }, [bloggerStep, keyword, bloggerRelatedKeywords, bloggerTargetCountry, bloggerTargetLanguage, bloggerAutoGenerateRelated, bloggerTitle, isKeywordsLocked, isTitleLocked, isBloggerCreditsCharged, bloggerMetrics, isBloggerMode]);

  // Step 1A: analyze the keyword with live provider data. This does not charge credits.
  const handleAnalyzeKeyword = async () => {
    const cleanKw = keyword.trim();
    if (!cleanKw) { toast.error('Please enter a primary target keyword.'); return; }
    if (isLockingTitle) return;
    setIsLockingTitle(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Please sign in to analyze this keyword.');
        handleAuthRedirect('/signup');
        return;
      }
      const response = await fetch(`${SUPABASE_URL}/functions/v1/run-keyword-research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${session.access_token}`,
          'x-timezone': Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        },
        body: JSON.stringify({
          seed_keyword: cleanKw,
          country: bloggerTargetCountry,
          language: bloggerTargetLanguage,
          billing_feature: 'ai_checker_for_bloggers',
          analyze_only: true,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) throw new Error(payload?.error || 'Live keyword analysis failed.');

      const kd = payload?.keyword_data || {};
      const groups = [kd.primary, kd.secondary, kd.long_tail, kd.questions, kd.commercial, kd.transactional, kd.informational];
      const rows = groups.flatMap((group: any) => Array.isArray(group) ? group : []);
      const seen = new Set<string>();
      const liveKeywords = rows.filter((row: any) => {
        const key = String(row?.keyword || '').trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key); return true;
      }).map((row: any) => ({
        keyword: String(row.keyword).trim(),
        searchVolume: typeof row.search_volume === 'number' ? row.search_volume : null,
        difficulty: typeof row.difficulty === 'number' ? row.difficulty : null,
        cpc: typeof row.cpc === 'number' ? row.cpc : null,
        intent: row.intent || null,
        source: 'Live keyword data',
        country: bloggerTargetCountry,
      }));
      const competitors = (payload?.competitors || kd?.competitors || [])
        .map((item: any) => ({ url: String(item.url || ''), wordCount: Number(item.wordCount) }))
        .filter((item: any) => item.url && Number.isFinite(item.wordCount));
      const serpFeatures = payload?.serp_features || kd?.serp_features || [];
      const providerRelated = liveKeywords
        .filter((item: any) => item.keyword.toLowerCase() !== cleanKw.toLowerCase())
        .slice(0, 3).map((item: any) => item.keyword);
      const manualRelated = bloggerRelatedKeywords.filter(Boolean);
      const related = bloggerAutoGenerateRelated ? providerRelated : manualRelated;
      const liveMetrics = evaluateBloggerKeywords(cleanKw, related, { keywords: liveKeywords, competitors, serpFeatures });
      setBloggerRelatedKeywords(related);
      setBloggerMetrics(liveMetrics);
      setBloggerAnalysisSignature(currentBloggerAnalysisSignature);
      toast.success('Keyword analysis complete. Review the available keyword data, then lock and continue.');
    } catch (err) {
      // External keyword intelligence is enrichment, never a workflow gate.
      setBloggerMetrics(null);
      setBloggerAnalysisSignature(null);
      toast.info('Limited keyword data available. You can add related keywords manually or continue with your primary keyword.');
    } finally {
      setIsLockingTitle(false);
    }
  };

  // Step 1B: explicit paid checkpoint. No provider call is repeated here.
  const handleLockKeywords = async () => {
    const cleanKw = keyword.trim();
    if (!cleanKw) { toast.error('Please enter a primary target keyword.'); return; }
    // Live keyword analysis is optional enrichment. A valid primary keyword can always be locked.
    if (isLockingTitle) return;
    setIsLockingTitle(true);
    const cost = 30;
    try {
      if (isBloggerLanding && isSubscriber) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) { toast.error('Please sign in to lock this keyword.'); handleAuthRedirect('/signup'); return; }
        // Keep one stable idempotency key for this lock attempt. A network retry/double-submit
        // must not become a second 30-credit purchase. Start New clears this key.
        if (!bloggerLockAttemptKeyRef.current) {
          bloggerLockAttemptKeyRef.current = `blogger-lock:${session.user.id}:${crypto.randomUUID()}`;
        }
        const idempotencyKey = bloggerLockAttemptKeyRef.current;
        const response = await fetch(`${SUPABASE_URL}/functions/v1/run-keyword-research`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session.access_token}`,
            'x-idempotency-key': idempotencyKey,
            'x-timezone': Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          },
          body: JSON.stringify({
            seed_keyword: cleanKw, country: bloggerTargetCountry, language: bloggerTargetLanguage,
            billing_feature: 'ai_checker_for_bloggers', commit_only: true,
          }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          const code = String(payload?.errorCode || payload?.error_code || payload?.code || '').toUpperCase();
          const message = String(payload?.error || payload?.message || '').toLowerCase();
          const availableBalance = summary?.creditsBalance ?? entitlement?.remainingCredits ?? 0;
          if (code === 'OPERATION_ALREADY_SUBMITTED') {
            await refresh();
            // Continue below and restore the paid/locked client state. The stable
            // idempotency key prevents a second reservation for this lock attempt.
          } else {
          const insufficientCredits =
            code === 'INSUFFICIENT_CREDITS' ||
            code === 'CREDITS_EXHAUSTED' ||
            message.includes('insufficient credit') ||
            message.includes('credits exhausted') ||
            (response.status === 402 && availableBalance < cost);
          if (insufficientCredits) {
            toast.error(`Insufficient credits. AI Checker for Bloggers requires ${cost} credits. You currently have ${availableBalance}.`);
            openUpgradeModal({ featureName: 'AI Checker for Bloggers', trigger: 'limit_reached', remaining: availableBalance, limit: cost });
            return;
          }
          if (code === 'UPGRADE_REQUIRED' || response.status === 402) {
            toast.error('Upgrade or top up your credits to continue.');
            openUpgradeModal({ featureName: 'AI Checker for Bloggers', trigger: 'pro_feature', remaining: availableBalance, limit: cost });
            return;
          }
          throw new Error(payload?.error || payload?.message || `Keyword lock failed (HTTP ${response.status}).`);
          }
        }
        await refresh();
      }

      const related = bloggerRelatedKeywords.filter(Boolean);
      setIsKeywordsLocked(true);
      setIsBloggerCreditsCharged(isBloggerLanding && isSubscriber ? true : isBloggerCreditsCharged);
      setBloggerStep(2);
      saveBloggerSession({
        step: 2, primaryKeyword: cleanKw, relatedKeywords: related,
        targetCountry: bloggerTargetCountry, targetLanguage: bloggerTargetLanguage,
        autoGenerateRelated: bloggerAutoGenerateRelated,
        isKeywordsLocked: true, isCreditsCharged: isBloggerLanding && isSubscriber ? true : isBloggerCreditsCharged,
        metrics: bloggerMetrics,
      });

      const historyItem: SEOAnalysisHistoryItem = {
        id: `keyword_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: `Keyword Research: ${cleanKw}`, keyword: cleanKw, wordCount: 0,
        creditCost: isBloggerLanding && isSubscriber ? cost : 0, content: '', scores: DEFAULT_SCORES,
        snapshot: { kwResult: DEFAULT_KW_RESULT, semanticResult, intentResult, readabilityResult, sentenceResult, paraResult, transitionResult, grammarResult, headingResult, eeatResult, engagementResult, snippetResult, aiRiskResult, uniquenessResult, metaResult, balancedResult, plagiarismResult, authorshipResult },
        createdAt: Date.now(), contentHash: generateContentHash('', cleanKw),
        bloggerSession: { primaryKeyword: cleanKw, relatedKeywords: [...related], title: '', step: 2, isKeywordsLocked: true, isTitleLocked: false, isCreditsCharged: isBloggerLanding && isSubscriber ? true : isBloggerCreditsCharged, metrics: bloggerMetrics, targetCountry: bloggerTargetCountry, targetLanguage: bloggerTargetLanguage, autoGenerateRelated: bloggerAutoGenerateRelated },
      };
      await saveSyncedSEOAssistantHistoryItem(historyItem);
      setHistoryCount(getSEOAssistantHistory().length);
      toast.success(isBloggerLanding && !isSubscriber ? 'Keyword locked. Continue with your title and content preview.' : 'Keyword locked and saved. 30 credits charged. You can enter a title or start new.');
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (/failed to fetch|networkerror|network request failed/i.test(message)) {
        toast.error('Connection was interrupted while confirming the keyword lock. Retry the lock; the same request key will prevent a duplicate charge.');
      } else {
        toast.error(message || 'Keyword lock failed.');
      }
    } finally {
      setIsLockingTitle(false);
    }
  };

  // Handle Step 2: lock title without a second Blogger charge
  const handleLockTitleAndPay = async () => {
    const cleanTitle = bloggerTitle.trim();
    if (!cleanTitle) {
      toast.error('Please enter your blog article title.');
      return;
    }
    if (!cleanTitle.toLowerCase().includes(keyword.toLowerCase().trim())) {
      toast.error(`Content title must contain the primary keyword "${keyword}".`);
      return;
    }

    if (isBloggerLanding && (!isKeywordsLocked || (isSubscriber && !isBloggerCreditsCharged))) {
      toast.error('Lock your primary keyword before continuing to the title step.');
      return;
    }

    setIsLockingTitle(true);
    const cost = 30;
    const featureSlug = featureSlugForBilling;
    let paidMetrics = bloggerMetrics;
    let chargedCredits = cost;
    let wasTrialCheck = false;

    try {
      if (isBloggerLanding) {
        chargedCredits = 0;
        wasTrialCheck = false;
      } else {
        const res = await reserveEntitlement(featureSlug, cost, { words: wordCount || 1 });
        if (!res.allowed) {
          if (!user && (res.errorCode === 'REGISTER_REQUIRED' || res.errorCode === 'TRIAL_EXHAUSTED')) {
            toast.error('Free trial limit reached. Please sign up to start blogger optimization.');
            handleAuthRedirect('/signup');
            return;
          }
          const availableBalance = summary?.creditsBalance ?? entitlement?.remainingCredits ?? 0;
          openUpgradeModal({ featureName: 'SEO Assistant', trigger: res.errorCode === 'CREDITS_EXHAUSTED' ? 'limit_reached' : 'pro_feature', remaining: availableBalance, limit: cost });
          return;
        }
        await finalizeReservation(res.reservationId, 'success', { words: wordCount || 1, feature: featureSlug, creditsDeducted: res.isTrialCheck ? 0 : cost });
        wasTrialCheck = Boolean(res.isTrialCheck);
        chargedCredits = wasTrialCheck ? 0 : cost;
      }

      await refresh();
      setIsTitleLocked(true);
      setIsBloggerCreditsCharged(isBloggerLanding && !isSubscriber ? false : true);
      setBloggerStep(3);

      let effectiveContent = content;
      if (!content.trim() || content === DEFAULT_PLACEHOLDER) {
        effectiveContent = `# ${cleanTitle}\n\nStart writing or paste your blog post here. Optimize your article for "${keyword}" and your related keywords to rank in top search results.`;
        setContent(effectiveContent);
        editorRef.current?.setContent(effectiveContent);
        setWordCount(effectiveContent.split(/\\s+/).filter(Boolean).length);
      }

      setIsAnalyzed(true);
      setIsStale(false);
      const analysisData = executeAnalysisComputation(effectiveContent, keyword, aiLinksActive, false, cleanTitle);
      if (analysisData) {
        const historyItem: SEOAnalysisHistoryItem = {
          id: `seo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, title: cleanTitle, keyword: keyword.trim(),
          wordCount: effectiveContent.split(/\\s+/).filter(Boolean).length, creditCost: chargedCredits, content: effectiveContent,
          scores: analysisData.computed,
          snapshot: { kwResult: analysisData.kwr, semanticResult: analysisData.sem, intentResult: analysisData.intent, readabilityResult: analysisData.read, sentenceResult: analysisData.sent, paraResult: analysisData.para, transitionResult: analysisData.trans, grammarResult: analysisData.gram, headingResult: analysisData.head, eeatResult: analysisData.eeat, engagementResult: analysisData.eng, snippetResult: analysisData.snip, aiRiskResult: analysisData.risk, uniquenessResult: analysisData.uniq, metaResult: analysisData.meta, balancedResult, plagiarismResult, authorshipResult },
          createdAt: Date.now(), contentHash: generateContentHash(effectiveContent, keyword),
          bloggerSession: { primaryKeyword: keyword, relatedKeywords: [...bloggerRelatedKeywords], title: cleanTitle, step: 3, isKeywordsLocked: true, isTitleLocked: true, isCreditsCharged: isBloggerLanding && !isSubscriber ? false : true, metrics: paidMetrics || undefined, targetCountry: bloggerTargetCountry, targetLanguage: bloggerTargetLanguage, autoGenerateRelated: bloggerAutoGenerateRelated },
        };
        void saveSyncedSEOAssistantHistoryItem(historyItem);
        setHistoryCount(getSEOAssistantHistory().length);
      }

      saveBloggerSession({ step: 3, title: cleanTitle, relatedKeywords: paidMetrics?.related.map(item => item.keyword) || bloggerRelatedKeywords, isTitleLocked: true, isCreditsCharged: isBloggerLanding && !isSubscriber ? false : true, metrics: paidMetrics });
      toast.success(isBloggerLanding ? 'Title locked. Optimization workspace unlocked — no additional credits charged.' : (wasTrialCheck ? 'Title locked! Free trial check used. Optimization workspace unlocked.' : 'Title locked! Optimization workspace unlocked.'));
    } catch (err) {
      console.error('Failed to lock Blogger title:', err);
      toast.error(err instanceof Error ? err.message : 'Blogger optimization failed. Please try again.');
    } finally {
      setIsLockingTitle(false);
    }
  };

  // Handle Step 4: Start New session reset
  const handleStartNewBloggerSession = () => {
    // 1. Requirement 2: Start new should save the current session first
    if ((content.trim() && content !== DEFAULT_PLACEHOLDER) || bloggerTitle.trim() || keyword.trim()) {
      try {
        const itemTitle = bloggerTitle.trim() || extractArticleTitle(content, keyword) || 'Untitled Post';
        const historyItem: SEOAnalysisHistoryItem = {
          id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: itemTitle,
          keyword: keyword.trim() || 'General SEO',
          wordCount,
          creditCost: 0, // Snapshot only; the paid Keyword Lock history item owns the 30-credit event.
          content,
          scores,
          snapshot: {
            kwResult,
            semanticResult,
            intentResult,
            readabilityResult,
            sentenceResult,
            paraResult,
            transitionResult,
            grammarResult,
            headingResult,
            eeatResult,
            engagementResult,
            snippetResult,
            aiRiskResult,
            uniquenessResult,
            metaResult,
            balancedResult,
            plagiarismResult,
            authorshipResult,
          },
          createdAt: Date.now(),
          contentHash: generateContentHash(content, keyword),
          bloggerSession: {
            primaryKeyword: keyword,
            relatedKeywords: [...bloggerRelatedKeywords],
            title: bloggerTitle,
            step: bloggerStep,
            isKeywordsLocked,
            isTitleLocked,
            isCreditsCharged: isBloggerCreditsCharged,
            metrics: bloggerMetrics || undefined,
            targetCountry: bloggerTargetCountry,
            targetLanguage: bloggerTargetLanguage,
            autoGenerateRelated: bloggerAutoGenerateRelated,
          },
        };
        void saveSyncedSEOAssistantHistoryItem(historyItem);
        setHistoryCount(getSEOAssistantHistory().length);
      } catch (err) {
        console.error('Failed to auto-save session to history before Start New:', err);
      }
    }

    // 2. Open a completely new session for new work
    try {
      localStorage.removeItem(BLOGGER_SESSION_KEY);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
    setBloggerStep(1);
    setIsKeywordsLocked(false);
    setIsTitleLocked(false);
    setIsBloggerCreditsCharged(false);
    bloggerLockAttemptKeyRef.current = null;
    setBloggerRelatedKeywords(['', '', '']);
    setBloggerTargetCountry('United States');
    setBloggerTargetLanguage('en');
    setBloggerAutoGenerateRelated(false);
    setBloggerTitle('');
    setKeyword('');
    setBloggerMetrics(null);
    setContent('');
    editorRef.current?.setContent('');
    setWordCount(0);
    setIsAnalyzed(false);
    setIsStale(false);
    setScores(DEFAULT_SCORES);
    setKwResult(DEFAULT_KW_RESULT);
    toast.success('Current session saved to History! New blank workspace ready for keyword setup.');
  };

  // Cost calculation: SEO Assistant costs 30 credits per check as shown
  const currentCost = useMemo(() => {
    return 30;
  }, []);

  // Click-to-locate issue handler with location metadata & text support
  const handleNavigateIssue = useCallback((target: any) => {
    if (!target) return;
    if (typeof target === 'string') {
      if (!target.trim()) return;
      editorRef.current?.locateIssue(target);
    } else {
      editorRef.current?.locateIssue(target);
    }
  }, []);

  // Compute all SEO modules
  const executeAnalysisComputation = useCallback((
    text: string, 
    kw: string, 
    currentAiLinksActive: boolean, 
    currentAiGrammarActive: boolean,
    titleToPass?: string,
    competitorsToPass?: CompetitorResult[]
  ) => {
    if (!text.trim()) return null;

    const currentTitle = titleToPass !== undefined ? titleToPass : (isBloggerMode ? bloggerTitle : undefined);
    const kwr = analyzeKeywordUsage(text, kw, currentTitle);
    const allKeywords = [kw, ...bloggerRelatedKeywords.filter(Boolean)];
    const activeComps = competitorsToPass !== undefined ? competitorsToPass : competitors;
    const sem = analyzeSemanticKeywords(text, kw, activeComps);
    const intent = analyzeSearchIntent(text);
    const read = analyzeReadability(text);
    const sent = analyzeSentences(text);
    const para = analyzeParagraphs(text);
    const trans = analyzeTransitionWords(text);
    const gram = analyzeGrammar(text);
    const head = analyzeHeadingStructure(text);
    const eeat = analyzeEEAT(text, kw, { intent: intent.dominant, competitors: activeComps, semanticKeywords: sem.recommended });
    const eng = analyzeEngagement(text);
    const snip = analyzeSnippetPotential(text);
    const risk = analyzeAIRisk(text);
    const uniq = analyzeUniqueness(text);
    const meta = generateMeta(text, kw);

    setKwResult(kwr);
    setSemanticResult(sem);
    setIntentResult(intent);
    setReadabilityResult(read);
    setSentenceResult(sent);
    setParaResult(para);
    setTransitionResult(trans);

    if (!currentAiGrammarActive) {
      setGrammarResult(gram);
    }
    setHeadingResult(head);
    setEeatResult(eeat);
    setEngagementResult(eng);
    setSnippetResult(snip);
    setAiRiskResult(risk);
    setUniquenessResult(uniq);
    setMetaResult(meta);

    // Keep active internal links grounded and mapped against current article edits with locked keywords
    setInternalLinks(prev => {
      if (prev.length === 0) return prev;
      return matchInternalLinksToArticle(prev, text, kw, allKeywords);
    });

    const computed = computeOverallScores({ kwResult: kwr, readability: read, grammar: gram, eeat, headings: head, engagement: eng, snippet: snip, uniqueness: uniq });
    setScores(computed);
    return {
      kwr, sem, intent, read, sent, para, trans, gram, head, eeat, eng, snip, risk, uniq, meta, computed
    };
  }, [bloggerTitle, isBloggerMode, bloggerRelatedKeywords]);

  // Pre-auth redirection with safe returnTo
  const handleAuthRedirect = useCallback((targetRoute: '/signup' | '/login') => {
    saveDraft(content, keyword, false);
    const safeReturn = window.location.pathname + window.location.search || '/ai-checker-for-bloggers';
    navigate(`${targetRoute}?returnTo=${encodeURIComponent(safeReturn)}`);
  }, [content, keyword, navigate]);

  // Main billable full SEO Analysis execution
  const handleAnalyzeArticle = async () => {
    if (!content.trim() || wordCount < 5) {
      toast.error('Please enter or paste your article content first.');
      return;
    }

    if (isAnalyzing) return; // Prevent double trigger

    // If in Blogger mode and 30 credits have already been charged upon locking title in Step 2:
    if (isBloggerMode && isBloggerCreditsCharged) {
      setIsAnalyzing(true);
      try {
        const analysisData = executeAnalysisComputation(content, keyword, aiLinksActive, aiGrammarActive, bloggerTitle);
        const hash = generateContentHash(content, keyword);
        if (analysisData) {
          const historyItem: SEOAnalysisHistoryItem = {
            id: `seo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            title: bloggerTitle || extractArticleTitle(content, keyword),
            keyword: keyword.trim(),
            wordCount,
            creditCost: 0,
            content,
            scores: analysisData.computed,
            snapshot: {
              kwResult: analysisData.kwr,
              semanticResult: analysisData.sem,
              intentResult: analysisData.intent,
              readabilityResult: analysisData.read,
              sentenceResult: analysisData.sent,
              paraResult: analysisData.para,
              transitionResult: analysisData.trans,
              grammarResult: analysisData.gram,
              headingResult: analysisData.head,
              eeatResult: analysisData.eeat,
              engagementResult: analysisData.eng,
              snippetResult: analysisData.snip,
              aiRiskResult: analysisData.risk,
              uniquenessResult: analysisData.uniq,
              metaResult: analysisData.meta,
              balancedResult,
              plagiarismResult,
              authorshipResult,
            },
            createdAt: Date.now(),
            contentHash: hash,
            bloggerSession: {
              primaryKeyword: keyword.trim(),
              relatedKeywords: [...bloggerRelatedKeywords],
              title: bloggerTitle,
              step: 3,
              isKeywordsLocked: true,
              isTitleLocked: true,
              isCreditsCharged: true,
              metrics: bloggerMetrics || undefined,
              targetCountry: bloggerTargetCountry,
              targetLanguage: bloggerTargetLanguage,
              autoGenerateRelated: bloggerAutoGenerateRelated,
            },
          };
          void saveSyncedSEOAssistantHistoryItem(historyItem);
          setHistoryCount(getSEOAssistantHistory().length);
        }
        setLastAnalyzedHash(hash);
        setIsAnalyzed(true);
        setIsStale(false);
        setIsAnalyzing(false);
        toast.success('Full analysis completed! Content optimized for target keywords & title.');
        return;
      } catch (err) {
        setIsAnalyzing(false);
        toast.error('Analysis failed to complete. Please try again.');
        return;
      }
    }

    setIsAnalyzing(true);
    const cost = 30; // Exactly 30 credits per check as shown in UI
    const featureSlug = featureSlugForBilling;

    try {
      // 1. Authoritative credit reservation before execution
      const res = await reserveEntitlement(featureSlug, cost, { words: wordCount });

      if (!res.allowed) {
        setIsAnalyzing(false);
        if (!user && (res.errorCode === 'REGISTER_REQUIRED' || res.errorCode === 'TRIAL_EXHAUSTED')) {
          toast.error('Free trial check limit reached. Please sign up to get additional free checks.');
          handleAuthRedirect('/signup');
          return;
        }

        const availableBalance = summary?.creditsBalance ?? entitlement?.remainingCredits ?? 0;
        openUpgradeModal({
          featureName: isBloggerLanding ? 'AI Checker for Bloggers' : 'SEO Assistant',
          trigger: res.errorCode === 'CREDITS_EXHAUSTED' ? 'limit_reached' : 'pro_feature',
          remaining: availableBalance,
          limit: cost,
        });
        return;
      }

      // 2. Execute full analysis
      const analysisData = executeAnalysisComputation(content, keyword, aiLinksActive, aiGrammarActive);

      // 3. Finalize reservation authoritatively
      await finalizeReservation(res.reservationId, 'success', {
        words: wordCount,
        feature: featureSlug,
        creditsDeducted: res.isTrialCheck ? 0 : cost,
      });

      // 4. Refresh live balance from server
      await refresh();

      // 5. Persist completed analysis to History
      const hash = generateContentHash(content, keyword);
      if (analysisData) {
        const historyItem: SEOAnalysisHistoryItem = {
          id: `seo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          title: extractArticleTitle(content, keyword),
          keyword: keyword.trim(),
          wordCount,
          creditCost: res.isTrialCheck ? 0 : cost,
          content,
          scores: analysisData.computed,
          snapshot: {
            kwResult: analysisData.kwr,
            semanticResult: analysisData.sem,
            intentResult: analysisData.intent,
            readabilityResult: analysisData.read,
            sentenceResult: analysisData.sent,
            paraResult: analysisData.para,
            transitionResult: analysisData.trans,
            grammarResult: analysisData.gram,
            headingResult: analysisData.head,
            eeatResult: analysisData.eeat,
            engagementResult: analysisData.eng,
            snippetResult: analysisData.snip,
            aiRiskResult: analysisData.risk,
            uniquenessResult: analysisData.uniq,
            metaResult: analysisData.meta,
            balancedResult,
            plagiarismResult,
            authorshipResult,
          },
          createdAt: Date.now(),
          contentHash: hash,
        };
        void saveSyncedSEOAssistantHistoryItem(historyItem);
        setHistoryCount(getSEOAssistantHistory().length);
      }

      setLastAnalyzedHash(hash);
      setIsAnalyzed(true);
      setIsStale(false);
      setIsAnalyzing(false);

      if (res.isTrialCheck) {
        toast.success('Analysis completed! (1 Free trial check used)');
      } else {
        toast.success(`Analysis completed! ${cost} credits deducted.`);
      }
    } catch (err) {
      setIsAnalyzing(false);
      console.error('Analysis execution failed:', err);
      toast.error('Analysis failed to complete. Please try again.');
    }
  };

  // Open History. Backfill the currently active Blogger analysis first so
  // sessions completed before history persistence was introduced are not lost.
  const handleOpenHistory = useCallback(() => {
    if (
      isBloggerMode &&
      isBloggerCreditsCharged &&
      content.trim() &&
      content !== DEFAULT_PLACEHOLDER
    ) {
      try {
        const analysisData = executeAnalysisComputation(
          content,
          keyword,
          aiLinksActive,
          aiGrammarActive,
          bloggerTitle
        );
        if (analysisData) {
          const historyItem: SEOAnalysisHistoryItem = {
            id: `seo_current_${generateContentHash(content, keyword)}`,
            title: bloggerTitle.trim() || extractArticleTitle(content, keyword),
            keyword: keyword.trim(),
            wordCount,
            creditCost: 30,
            content,
            scores: analysisData.computed,
            snapshot: {
              kwResult: analysisData.kwr,
              semanticResult: analysisData.sem,
              intentResult: analysisData.intent,
              readabilityResult: analysisData.read,
              sentenceResult: analysisData.sent,
              paraResult: analysisData.para,
              transitionResult: analysisData.trans,
              grammarResult: analysisData.gram,
              headingResult: analysisData.head,
              eeatResult: analysisData.eeat,
              engagementResult: analysisData.eng,
              snippetResult: analysisData.snip,
              aiRiskResult: analysisData.risk,
              uniquenessResult: analysisData.uniq,
              metaResult: analysisData.meta,
              balancedResult,
              plagiarismResult,
              authorshipResult,
            },
            createdAt: Date.now(),
            contentHash: generateContentHash(content, keyword),
            bloggerSession: {
              primaryKeyword: keyword,
              relatedKeywords: [...bloggerRelatedKeywords],
              title: bloggerTitle,
              step: bloggerStep,
              isKeywordsLocked,
              isTitleLocked,
              isCreditsCharged: true,
              metrics: bloggerMetrics || undefined,
            },
          };
          void saveSyncedSEOAssistantHistoryItem(historyItem);
          setHistoryCount(getSEOAssistantHistory().length);
        }
      } catch (err) {
        console.error('Failed to backfill current Blogger analysis into History:', err);
      }
    }
    setHistoryOpen(true);
  }, [
    isBloggerMode, isBloggerCreditsCharged, content, keyword, aiLinksActive,
    aiGrammarActive, bloggerTitle, wordCount, bloggerRelatedKeywords, bloggerStep,
    isKeywordsLocked, isTitleLocked, bloggerMetrics, balancedResult,
    plagiarismResult, authorshipResult, executeAnalysisComputation
  ]);

  // Restore analysis from History (100% free, 0 credits)
  const handleRestoreFromHistory = useCallback((item: SEOAnalysisHistoryItem) => {
    setContent(item.content);
    // Competitor intelligence belongs to the previously active keyword/market and must not leak into a restored session.
    setCompetitors([]);
    setContentGap(null);
    const restoredPrimary = item.bloggerSession?.primaryKeyword || item.keyword;
    setKeyword(restoredPrimary);
    setWordCount(item.wordCount);
    setScores(item.scores);
    setKwResult(item.snapshot.kwResult);
    setSemanticResult(item.snapshot.semanticResult);
    setIntentResult(item.snapshot.intentResult);
    setReadabilityResult(item.snapshot.readabilityResult);
    setSentenceResult(item.snapshot.sentenceResult);
    setParaResult(item.snapshot.paraResult);
    setTransitionResult(item.snapshot.transitionResult);
    setGrammarResult(item.snapshot.grammarResult);
    setHeadingResult(item.snapshot.headingResult);
    setEeatResult(item.snapshot.eeatResult);
    setEngagementResult(item.snapshot.engagementResult);
    setSnippetResult(item.snapshot.snippetResult);
    setAiRiskResult(item.snapshot.aiRiskResult);
    setUniquenessResult(item.snapshot.uniquenessResult);
    setMetaResult(item.snapshot.metaResult);
    if (item.snapshot.balancedResult) setBalancedResult(item.snapshot.balancedResult);
    if (item.snapshot.plagiarismResult) setPlagiarismResult(item.snapshot.plagiarismResult);
    if (item.snapshot.authorshipResult) setAuthorshipResult(item.snapshot.authorshipResult);

    editorRef.current?.setContent(item.content);
    setLastAnalyzedHash(item.contentHash);
    setIsAnalyzed(true);
    setIsStale(false);

    // Requirement 1: When user opens history in blogger mode, related keywords and title are restored and locked
    // in Step 3. It does not require to put again, analyze again, or charge credits again.
    if (isBloggerMode || item.bloggerSession) {
      const savedSession = item.bloggerSession;
      const savedStep = Math.min(3, Math.max(1, Number(savedSession?.step || (savedSession?.isTitleLocked ? 3 : 2)))) as 1 | 2 | 3;
      const restoredTitle = savedSession?.title || (savedStep >= 3 ? (item.title || extractArticleTitle(item.content, item.keyword)) : '');
      const restoredRelated = savedSession?.relatedKeywords || ['', '', ''];
      const restoredKeywordsLocked = savedSession?.isKeywordsLocked ?? true;
      const restoredTitleLocked = savedSession?.isTitleLocked ?? savedStep >= 3;
      const restoredCharged = savedSession?.isCreditsCharged ?? item.creditCost > 0;
      const metrics = savedSession?.metrics ?? null;

      bloggerLockAttemptKeyRef.current = null;
      setBloggerStep(savedStep);
      setIsKeywordsLocked(restoredKeywordsLocked);
      setIsTitleLocked(restoredTitleLocked);
      setIsBloggerCreditsCharged(restoredCharged);
      setBloggerTitle(restoredTitle);
      setBloggerRelatedKeywords(restoredRelated);
      setBloggerTargetCountry(savedSession?.targetCountry || 'United States');
      setBloggerTargetLanguage(savedSession?.targetLanguage || 'en');
      setBloggerAutoGenerateRelated(Boolean(savedSession?.autoGenerateRelated));
      setBloggerMetrics(metrics);
      setBloggerAnalysisSignature(null);

      try {
        localStorage.setItem(BLOGGER_SESSION_KEY, JSON.stringify({
          step: savedStep,
          primaryKeyword: restoredPrimary,
          relatedKeywords: restoredRelated,
          title: restoredTitle,
          isKeywordsLocked: restoredKeywordsLocked,
          isTitleLocked: restoredTitleLocked,
          isCreditsCharged: restoredCharged,
          metrics,
          targetCountry: savedSession?.targetCountry || 'United States',
          targetLanguage: savedSession?.targetLanguage || 'en',
          autoGenerateRelated: Boolean(savedSession?.autoGenerateRelated),
        }));
      } catch (e) {
        console.error('Failed to sync restored blogger session:', e);
      }

      // Only run article optimization when a saved article/title actually reached Step 3.
      if (savedStep >= 3 && item.content.trim()) {
        executeAnalysisComputation(item.content, restoredPrimary, false, false, restoredTitle);
        toast.success('Saved article restored. Ready to continue optimization.');
      } else {
        setIsAnalyzed(false);
        toast.success('Saved keyword session restored. Continue by entering your content title.');
      }
    }
  }, [isBloggerMode, executeAnalysisComputation]);

  // Save draft locally
  const saveDraft = useCallback((textToSave: string, kwToSave: string, explicit = false) => {
    if (!textToSave && !kwToSave) return;
    try {
      const draft = {
        content: textToSave,
        keyword: kwToSave,
        internalLinkDomain,
        updatedAt: Date.now(),
        sourcePage: window.location.pathname || '/ai-checker-for-bloggers',
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      setDraftSavedTime(draft.updatedAt);
      if (explicit) {
        toast.success('Draft saved successfully.');
      }
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
  }, [internalLinkDomain]);

  // Clear workspace completely while preserving History
  const handleClearDraft = useCallback(() => {
    if (window.confirm('Are you sure you want to clear your draft article? This will reset the workspace. Your past analyses will remain saved in History.')) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setContent('');
      setKeyword('');
      setWordCount(0);
      setDraftSavedTime(null);
      editorRef.current?.setContent('');
      setScores(DEFAULT_SCORES);
      setIsAnalyzed(false);
      setIsStale(false);
      setLastAnalyzedHash(null);

      // Reset all 20 modules to clean empty state
      setKwResult(DEFAULT_KW_RESULT);
      setSemanticResult({ recommended: [], found: [], missing: [], coveragePercent: 0 });
      setIntentResult({ informational: 25, commercial: 25, transactional: 25, navigational: 25, dominant: 'informational', matchPercent: 25, recommendation: 'Analyze content to see intent match.' });
      setReadabilityResult({ score: 0, label: 'Difficult', avgWordsPerSentence: 0, avgSyllablesPerWord: 0 });
      setSentenceResult({ longSentenceCount: 0, passiveVoiceCount: 0, totalSentences: 0, longSentences: [], veryLongSentences: [], recommendations: ['Start writing to analyze sentence structure.'] });
      setParaResult({ longParagraphCount: 0, veryLongParagraphCount: 0, totalParagraphs: 0, recommendations: ['Start writing to analyze paragraphs.'] });
      setTransitionResult({ count: 0, totalSentences: 0, percentage: 0, found: [], missing: [], recommendations: ['Start writing to analyze transition words.'] });
      setGrammarResult({ score: 100, issues: [] });
      setHeadingResult({ h1Count: 0, h2Count: 0, h3Count: 0, headings: [], issues: [], score: 0 });
      setEeatResult({ score: 0, hasPersonalExamples: false, hasStats: false, hasCitations: false, hasAuthor: false, recommendations: ['Start writing to analyze EEAT signals.'] });
      setEngagementResult({ score: 0, questionCount: 0, exampleCount: 0, dataCount: 0, recommendations: ['Start writing to analyze engagement.'] });
      setSnippetResult({ score: 0, hasDefinition: false, hasList: false, hasTable: false, hasFAQ: false, recommendations: [] });
      setAiRiskResult({ humanScore: 50, aiScore: 50, riskLevel: 'Medium', recommendations: [] });
      setUniquenessResult({ score: 100, duplicatePhrases: [], overusedWords: [], recommendations: [] });
      setMetaResult({ suggestedTitle: '', suggestedDescription: '', suggestedSlug: '', titleLength: 0, descLength: 0, titleOk: false, descOk: false });
      setInternalLinks([]);
      setCompetitors([]);
      setContentGap(null);
      setBalancedResult(null);
      setPlagiarismResult(null);
      setAuthorshipResult(null);
      toast.info('Workspace cleared. Past analyses remain available in History.');
    }
  }, []);

  // Insert hook / text into editor from EEAT / Engagement / Contextual suggestions
  const handleInsertHook = useCallback((textToInsert: string, target: 'intro' | 'after_h1' | 'end' | 'cursor' = 'cursor') => {
    if (!textToInsert) return;
    editorRef.current?.insertTextAtLocation(textToInsert, target);
    setTimeout(() => {
      const updated = editorRef.current?.getContent() || '';
      if (updated) {
        setContent(updated);
        const wCount = updated.split(/\s+/).filter(Boolean).length;
        setWordCount(wCount);
        saveDraft(updated, keyword, false);
        if (isAnalyzed) {
          setIsStale(true);
        }
      }
    }, 50);
  }, [keyword, saveDraft, isAnalyzed]);

  // Live content editing handler with robust versioning & real-time re-analysis
  const handleContentChange = (val: string) => {
    setContent(val);
    const words = val.split(/\s+/).filter(Boolean);
    setWordCount(words.length);
    setAiGrammarActive(false);

    documentVersionRef.current += 1;
    const currentVersion = documentVersionRef.current;
    const currentHash = generateContentHash(val, keyword);

    // Clear active highlights on content change so no orphaned highlights remain
    editorRef.current?.clearHighlights();

    if (isAnalyzed || (isBloggerMode && (bloggerStep === 3 || isTitleLocked || isBloggerCreditsCharged))) {
      if (analysisDebounceRef.current) clearTimeout(analysisDebounceRef.current);
      analysisDebounceRef.current = setTimeout(() => {
        if (documentVersionRef.current === currentVersion && val.trim()) {
          const res = executeAnalysisComputation(val, keyword, aiLinksActive, false, isBloggerMode ? bloggerTitle : undefined);
          if (res) {
            setLastAnalyzedHash(currentHash);
            setIsAnalyzed(true);
            setIsStale(false);
          }
        }
      }, 300);
    }

    if (autoSaveDebounceRef.current) clearTimeout(autoSaveDebounceRef.current);
    autoSaveDebounceRef.current = setTimeout(() => saveDraft(val, keyword, false), 800);
  };

  const handleKeywordChange = (val: string) => {
    setKeyword(val);
    setCompetitors([]);
    documentVersionRef.current += 1;
    const currentVersion = documentVersionRef.current;
    const currentHash = generateContentHash(content, val);

    if (isAnalyzed || (isBloggerMode && (bloggerStep === 3 || isTitleLocked || isBloggerCreditsCharged))) {
      if (analysisDebounceRef.current) clearTimeout(analysisDebounceRef.current);
      analysisDebounceRef.current = setTimeout(() => {
        if (documentVersionRef.current === currentVersion && content.trim()) {
          const res = executeAnalysisComputation(content, val, aiLinksActive, aiGrammarActive, isBloggerMode ? bloggerTitle : undefined);
          if (res) {
            setLastAnalyzedHash(currentHash);
            setIsAnalyzed(true);
            setIsStale(false);
          }
        }
      }, 300);
    }

    if (autoSaveDebounceRef.current) clearTimeout(autoSaveDebounceRef.current);
    autoSaveDebounceRef.current = setTimeout(() => saveDraft(content, val, false), 800);
  };

  // Immediate initial content or draft recovery on mount
  useEffect(() => {
    if (initialContent) {
      const words = initialContent.split(/\s+/).filter(Boolean);
      setWordCount(words.length);
      if (isBloggerMode && (bloggerStep === 3 || isTitleLocked || isBloggerCreditsCharged)) {
        setIsAnalyzed(true);
        setIsStale(false);
        executeAnalysisComputation(initialContent, keyword, false, false, bloggerTitle);
      }
      return;
    }

    // Try restoring draft from localStorage
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY) || localStorage.getItem('seo_assistant_draft');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.content && typeof parsed.content === 'string') {
          setContent(parsed.content);
          if (parsed.keyword) setKeyword(parsed.keyword);
          if (parsed.internalLinkDomain && typeof parsed.internalLinkDomain === 'string') {
            setInternalLinkDomain(parsed.internalLinkDomain);
          }
          const words = parsed.content.split(/\s+/).filter(Boolean);
          setWordCount(words.length);
          setDraftSavedTime(parsed.updatedAt || Date.now());
          editorRef.current?.setContent(parsed.content);

          if (isBloggerMode && (bloggerStep === 3 || isTitleLocked || isBloggerCreditsCharged)) {
            setIsAnalyzed(true);
            setIsStale(false);
            executeAnalysisComputation(parsed.content, parsed.keyword || keyword, false, false, bloggerTitle);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load saved draft:', e);
    }
  }, [initialContent]);

  // Auto-prefill website/domain from user's active SEO project
  useEffect(() => {
    getActiveSEOProjectSummary().then((summary) => {
      if (summary) {
        if (summary.projectName) setActiveProjectName(summary.projectName);
        if (summary.domain) {
          setInternalLinkDomain((prev) => prev || summary.domain);
        }
      }
    });

    resolveSavedSEOProjectDomain().then((domain) => {
      if (domain) {
        setInternalLinkDomain((prev) => prev || domain);
      }
    });
  }, []);

  const handleSaveActiveProjectDomain = async (domainToSave?: string) => {
    const targetDomain = (domainToSave || internalLinkDomain || '').trim();
    if (!targetDomain) {
      toast.error('Please enter a website domain first.');
      return;
    }
    setSavingProjectDomain(true);
    try {
      const res = await saveDomainToActiveSEOProject(targetDomain);
      if (res.success) {
        setActiveProjectName(res.projectName);
        setInternalLinkDomain(res.domain);
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save domain into active SEO project.');
    } finally {
      setSavingProjectDomain(false);
    }
  };

  const handleInsertCompetitorKeyword = (kw: string) => {
    setContent((prev) => {
      const next = prev ? `${prev} ${kw}` : kw;
      handleContentChange(next);
      return next;
    });
    toast.success(`Inserted "${kw}" into draft.`);
  };

  const handleDomainChange = (val: string) => {
    setInternalLinkDomain(val);
    if (val.trim()) {
      persistSEOProjectDomain(val.trim());
    }
  };

  const gateAIAccess = async (featureNameOverride?: string): Promise<boolean> => {
    if (isGuest) {
      handleAuthRedirect('/signup');
      return false;
    }
    if (entitlementLoading) {
      toast.info('Checking your plan, please wait...');
      return false;
    }
    if (!isSubscriber) {
      openUpgradeModal({
        featureName: featureNameOverride || (isBloggerLanding ? 'AI Checker for Bloggers' : 'SEO Assistant'),
        trigger: 'pro_feature',
        remaining: summary?.creditsBalance ?? 0,
        limit: 5,
      });
      return false;
    }
    if (!entitlement?.allowed) {
      openUpgradeModal({
        featureName: featureNameOverride || (isBloggerLanding ? 'AI Checker for Bloggers' : 'SEO Assistant'),
        trigger: 'limit_reached',
        remaining: entitlement?.remaining ?? 0,
        limit: entitlement?.limit ?? 5,
      });
      return false;
    }
    return true;
  };

  // Generate article with AI (dedicated 5 credits)
  const handleGenerateArticle = async () => {
    if (!aiKeyword.trim()) { toast.error('Please enter a target keyword.'); return; }
    if (!(await gateAIAccess('Generate Article with AI'))) return;
    setAiGenerating(true);
    setContent('');
    let raw = '';

    await streamLLM({
      featureSlug: FEATURE_SLUG,
      contents: [{
        role: 'user',
        parts: [{
          text: `Write a comprehensive, SEO-optimized blog article about "${aiKeyword}". 
Requirements:
- Start with an H1 heading using ##-markdown syntax (# Title)
- Include 4-6 H2 sections with H3 subsections
- 800-1200 words
- Natural keyword usage of "${aiKeyword}" (0.8-1.5% density)
- Include personal examples, statistics, and authoritative citations
- Add a FAQ section at the end
- Write for Grade 8 reading level with high engagement
Write the article in clean Markdown:`
        }]
      }],
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
      onChunk: (chunk) => {
        raw += chunk;
        setContent(raw);
        editorRef.current?.setContent(raw);
        setWordCount(raw.split(/\s+/).filter(Boolean).length);
      },
      onComplete: () => {
        setAiGenerating(false);
        setAiModalOpen(false);
        setKeyword(aiKeyword);
        const wCount = raw.split(/\s+/).filter(Boolean).length;
        setWordCount(wCount);
        setIsAnalyzed(false);
        setIsStale(false);
        toast.success('Article generated! Click "Analyze Article" to run full SEO & AI scoring.');
      },
      onError: () => {
        setAiGenerating(false);
        toast.error('Generation failed. Please retry.');
      },
    });
  };

  // Rewrite content (Humanizer / Readability / Tone)
  const handleRewrite = async (mode: string) => {
    if (!content.trim()) { toast.error('Please add content to rewrite.'); return; }
    if (!(await gateAIAccess('Rewrite Tools'))) return;
    setAiRewriting(true);
    let raw = '';

    let instructions = '';
    if (mode === 'humanize') instructions = 'Humanize the text, making it sound more natural, engaging, and less like AI. Use varied sentence structures.';
    else if (mode === 'readability') instructions = 'Improve readability. Use simpler words, shorter sentences, and active voice. Target an 8th-grade reading level.';
    else if (mode === 'shorten') instructions = 'Shorten the content to be more concise while keeping the core message and SEO value.';
    else if (mode === 'expand') instructions = 'Expand the content, adding more detail, examples, and depth while keeping the same tone.';
    else if (mode === 'expert') instructions = 'Rewrite in an expert, authoritative tone suitable for professionals.';
    else if (mode === 'conversational') instructions = 'Rewrite in a friendly, conversational tone as if speaking directly to the reader.';
    else if (mode === 'academic') instructions = 'Rewrite in a formal, academic tone with objective language.';
    else if (mode === 'journalistic') instructions = 'Rewrite in a journalistic, objective tone, focusing on facts and reporting style.';

    setContent('');
    editorRef.current?.setContent('');

    await streamLLM({
      featureSlug: FEATURE_SLUG,
      contents: [{
        role: 'user',
        parts: [{
          text: `You are an expert SEO editor. Rewrite the following content according to these instructions:
Instructions: ${instructions}
Preserve all SEO optimization and keywords. Return ONLY the rewritten text in Markdown.
Content:\n${content}`
        }]
      }],
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
      onChunk: (chunk) => {
        raw += chunk;
        setContent(raw);
        editorRef.current?.setContent(raw);
        setWordCount(raw.split(/\s+/).filter(Boolean).length);
      },
      onComplete: () => {
        setAiRewriting(false);
        const wCount = raw.split(/\s+/).filter(Boolean).length;
        setWordCount(wCount);
        setIsAnalyzed(false);
        setIsStale(false);
        toast.success(`Content rewritten (${mode})! Click "Analyze Article" to update report.`);
      },
      onError: () => {
        setAiRewriting(false);
        toast.error('Rewrite failed. Please retry.');
      },
    });
  };

  // AI recommendations
  const handleAIRecommendations = async () => {
    if (!content.trim()) { toast.error('Please add content first.'); return; }
    if (!(await gateAIAccess('AI Recommendations'))) return;
    setAiRecLoading(true);
    setAiRec('');
    let raw = '';

    await streamLLM({
      featureSlug: FEATURE_SLUG,
      contents: [{
        role: 'user',
        parts: [{
          text: `You are an enterprise SEO consultant. Analyze this content for keyword "${keyword || 'general'}" and provide high-impact recommendations for Search Intent, Semantic SEO, EEAT, and Featured Snippets.
Content:\n${content.slice(0, 3000)}`
        }]
      }],
      tools: [{ googleSearch: {} }],
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
      onChunk: (chunk) => { raw += chunk; setAiRec(raw); },
      onComplete: () => setAiRecLoading(false),
      onError: () => { setAiRecLoading(false); toast.error('Failed to get recommendations.'); },
    });
  };

  // Internal Links Discovery & Matching
  const handleGenerateLinks = async (rawDomain: string) => {
    if (!content.trim()) {
      toast.error('Add article content first to discover matching internal links.');
      return;
    }

    const norm = normalizeAndValidateDomain(rawDomain);
    if (!norm.valid || !norm.domain || !norm.origin) {
      setInternalLinkStatus('invalid_domain');
      setInternalLinkStatusMessage(norm.error || 'Please enter a valid website domain.');
      toast.error(norm.error || 'Invalid domain format.');
      return;
    }

    const { domain: normalizedDomain, origin: canonicalOrigin } = norm;
    setInternalLinkDomain(normalizedDomain);
    persistSEOProjectDomain(normalizedDomain);
    setInternalLinkStatus('loading');
    setInternalLinkStatusMessage(`Discovering verified pages and matching internal link opportunities on ${normalizedDomain}...`);
    setGeneratingLinks(true);

    if (!(await gateAIAccess('Internal Links Generation'))) {
      setGeneratingLinks(false);
      setInternalLinkStatus(internalLinks.length > 0 ? 'success' : 'not_fetched');
      return;
    }

    // Strategy 1: High-speed server-side sitemap & domain discovery
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/fetch-internal-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          domain: normalizedDomain,
          articleText: content,
          primaryKeyword: keyword,
          relatedKeywords: semanticResult.recommended || [],
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.status === 'success' && Array.isArray(data.links) && data.links.length > 0) {
          const matched = matchInternalLinksToArticle(data.links, content, keyword, semanticResult.recommended || []);
          if (matched.length > 0) {
            setInternalLinks(matched);
            setAiLinksActive(true);
            setInternalLinkStatus('success');
            setInternalLinkStatusMessage(`Discovered ${matched.length} qualified internal link opportunities from ${data.discoveredCount || matched.length} verified pages on ${normalizedDomain}.`);
            toast.success(`Found ${matched.length} verified internal links on ${normalizedDomain}`);
            setGeneratingLinks(false);
            return;
          } else {
            setInternalLinks([]);
            setInternalLinkStatus('no_opportunities');
            setInternalLinkStatusMessage(`Discovered ${data.discoveredCount || 0} indexable pages on ${normalizedDomain}, but none met the relevance threshold for the current article and keywords.`);
            setGeneratingLinks(false);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Edge function sitemap discovery fallback to search grounding:', e);
    }

    // Strategy 2: Web-aware Google Search grounding
    let raw = '';
    await streamLLM({
      featureSlug: FEATURE_SLUG,
      contents: [{
        role: 'user',
        parts: [{
          text: `You have access to Google Search. Discover real indexable pages and URLs from the website "${normalizedDomain}" (canonical origin: ${canonicalOrigin}).
Find 3 to 6 genuinely existing pages on this website that are relevant to this article.

Article Content:
"${content.slice(0, 2000)}"

Target Keyword: "${keyword || 'general topic'}"

CRITICAL REQUIREMENTS:
1. Every URL must be a REAL, VERIFIED URL belonging to https://${normalizedDomain}/
2. Do not invent fake /blog/ URLs that do not exist.
3. Return ONLY a valid JSON object in this exact format:
{"links":[{"url":"https://${normalizedDomain}/page-slug","title":"Actual Page Title","anchorText":"exact phrase from article or relevant keyword","reason":"Relevance explanation"}]}`
        }]
      }],
      tools: [{ googleSearch: {} }],
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
      onChunk: (c) => { raw += c; },
      onComplete: () => {
        setGeneratingLinks(false);
        const extracted = extractLinksFromJsonResponse(raw, normalizedDomain);

        if (extracted.length > 0) {
          const matched = matchInternalLinksToArticle(extracted, content, keyword, semanticResult.recommended || []);
          if (matched.length > 0) {
            setInternalLinks(matched);
            setAiLinksActive(true);
            setInternalLinkStatus('success');
            setInternalLinkStatusMessage(`Discovered ${matched.length} qualified internal link opportunities from ${normalizedDomain}.`);
            toast.success(`Found ${matched.length} verified internal links from ${normalizedDomain}`);
          } else {
            setInternalLinks([]);
            setInternalLinkStatus('no_opportunities');
            setInternalLinkStatusMessage(`Discovered pages on ${normalizedDomain}, but none met the relevance threshold for the current article and keywords.`);
            toast.info(`No high-relevance link opportunities found on ${normalizedDomain} for this article.`);
          }
        } else {
          const isBlocked = /blocked|cloudflare|captcha|403|access denied|forbidden/i.test(raw);
          if (isBlocked) {
            setInternalLinkStatus('site_blocked');
            setInternalLinkStatusMessage(`Could not retrieve pages from ${normalizedDomain} due to access challenge or crawler protection.`);
            toast.error(`Could not retrieve pages from ${normalizedDomain} (Access Protected).`);
          } else {
            setInternalLinkStatus('no_opportunities');
            setInternalLinkStatusMessage(`Discovered pages on ${normalizedDomain}, but no direct contextual anchor matches were found in the current article text.`);
            toast.info(`No relevant link opportunities found on ${normalizedDomain} for this article.`);
          }
        }
      },
      onError: (err: any) => {
        setGeneratingLinks(false);
        setInternalLinkStatus('error');
        setInternalLinkStatusMessage(`Failed to connect to link discovery service: ${err?.message || 'Network error'}. Please retry.`);
        toast.error('Internal link fetch failed. Please retry.');
      },
    });
  };

  const handleApplyInternalLink = (link: DiscoveredInternalLink) => {
    const success = editorRef.current?.applyHyperlink(link.anchorText, link.url, {
      text: link.anchorText,
      start: link.start,
      end: link.end,
      contextSnippet: link.contextSnippet,
      sentenceIndex: link.sentenceIndex
    });

    if (success) {
      setInternalLinks(prev => prev.map(l => l.url === link.url ? { ...l, isApplied: true } : l));
      toast.success(`Applied link "${link.anchorText}" → ${link.url}`);
      setTimeout(() => {
        const updated = editorRef.current?.getContent() || '';
        if (updated) {
          setContent(updated);
          saveDraft(updated, keyword, false);
        }
      }, 50);
    } else {
      toast.error('Could not apply link to editor.');
    }
  };

  // Grammar suggestions
  const handleFixGrammar = async () => {
    if (!content.trim()) { toast.error('Add content first.'); return; }
    if (!(await gateAIAccess('Grammar Engine'))) return;
    setFixingGrammar(true);
    let raw = '';

    await streamLLM({
      featureSlug: FEATURE_SLUG,
      contents: [{
        role: 'user',
        parts: [{
          text: `Analyze this content strictly for grammar, spelling, punctuation, and extra spacing issues.
Content: "${content.slice(0, 1500)}"
Return ONLY valid JSON: {"issues":[{"text":"exact error text","suggestion":"how to fix","type":"Spacing | Grammar | Spelling | Punctuation"}]}`
        }]
      }],
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
      onChunk: (c) => { raw += c; },
      onComplete: () => {
        setFixingGrammar(false);
        try {
          const m = raw.match(/\{[\s\S]*\}/);
          if (!m) throw new Error();
          const parsed = JSON.parse(m[0]);
          if (parsed.issues && Array.isArray(parsed.issues)) {
            setAiGrammarActive(true);
            setGrammarResult(prev => ({
              score: Math.max(0, 100 - parsed.issues.length * 8),
              issues: parsed.issues
            }));
            toast.success(`Identified ${parsed.issues.length} grammar suggestions.`);
          }
        } catch { toast.error('Failed to analyze grammar.'); }
      },
      onError: () => { setFixingGrammar(false); toast.error('Grammar analysis failed.'); },
    });
  };

  // Generate FAQ
  const handleGenerateFAQ = async () => {
    if (!content.trim()) { toast.error('Add content first.'); return; }
    if (!(await gateAIAccess('Generate FAQ'))) return;
    setGeneratingFaq(true);
    let raw = '';

    await streamLLM({
      featureSlug: FEATURE_SLUG,
      contents: [{
        role: 'user',
        parts: [{
          text: `Generate 5 FAQ pairs for an article about "${keyword || 'this topic'}".
Content: "${content.slice(0, 1500)}"
Return ONLY valid JSON: {"faqs":[{"question":"...","answer":"..."}]}`
        }]
      }],
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
      onChunk: (c) => { raw += c; },
      onComplete: () => {
        setGeneratingFaq(false);
        try {
          const m = raw.match(/\{[\s\S]*\}/);
          if (!m) throw new Error();
          const parsed = JSON.parse(m[0]);
          setFaqs(parsed.faqs || []);
          toast.success('FAQ generated.');
        } catch { toast.error('Failed to parse FAQ.'); }
      },
      onError: () => { setGeneratingFaq(false); toast.error('FAQ generation failed.'); },
    });
  };

  // Competitor analysis
  const handleAnalyzeCompetitors = async () => {
    const cleanKeyword = keyword.trim();
    if (!cleanKeyword) { toast.error('Enter a target keyword first.'); return; }
    if (!(await gateAIAccess('Competitor Intelligence'))) return;

    const marketCountry = isBloggerMode ? bloggerTargetCountry : 'United States';
    const marketLanguage = isBloggerMode ? bloggerTargetLanguage : 'en';
    setLoadingCompetitors(true);

    // Prefer location-aware SERP evidence from the existing keyword-research service.
    // If it is unavailable or returns no usable competitors, keep the current
    // search-grounded competitor workflow as the graceful fallback.
    let verifiedSerpCompetitors: Array<{ url: string; wordCount?: number }> = [];
    if (isBloggerMode) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const response = await fetch(`${SUPABASE_URL}/functions/v1/run-keyword-research`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${session.access_token}`,
              'x-timezone': Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            },
            body: JSON.stringify({
              seed_keyword: cleanKeyword,
              country: marketCountry,
              language: marketLanguage,
              billing_feature: 'ai_checker_for_bloggers',
              analyze_only: true,
            }),
          });
          const payload = await response.json().catch(() => ({}));
          if (response.ok && payload?.success !== false) {
            const kd = payload?.keyword_data || {};
            verifiedSerpCompetitors = (payload?.competitors || kd?.competitors || [])
              .map((item: any) => ({
                url: String(item?.url || '').trim(),
                wordCount: Number.isFinite(Number(item?.wordCount)) ? Number(item.wordCount) : undefined,
              }))
              .filter((item: any) => /^https?:\/\//i.test(item.url))
              .slice(0, 5);
          }
        }
      } catch {
        // Provider enrichment is optional; current grounded search remains available.
        verifiedSerpCompetitors = [];
      }
    }

    const verifiedUrls = verifiedSerpCompetitors.map(item => item.url);
    const evidenceInstruction = verifiedUrls.length
      ? `The following competitor URLs came from location-aware organic SERP evidence for this exact market. Analyze these pages as the competitor set and do not replace them with invented competitors:\n${verifiedUrls.map((url, index) => `${index + 1}. ${url}`).join('\n')}`
      : `Discover the top organic Google ranking pages for this keyword in the selected market using grounded search. Use only identifiable pages actually supported by search evidence; return fewer competitors if evidence is insufficient.`;

    let raw = '';
    await streamLLM({
      featureSlug: FEATURE_SLUG,
      contents: [{
        role: 'user',
        parts: [{
          text: `Analyze Content Gap & Competitor Keywords for keyword "${cleanKeyword}" specifically in country "${marketCountry}", language "${marketLanguage}".
${evidenceInstruction}
Extract competitor keywords/topics from the evidenced pages and compare them with the user's article. Do not invent URLs, rankings, keywords, word counts, headings, or FAQs when they cannot be supported.
Return ONLY valid JSON:
{"competitors":[{"url":"https://...","title":"Title","wordCount":1200,"readability":"Standard","h2Headings":["H2 1","H2 2"],"keywordsUsed":["kw1"],"strengths":["Clear"],"weaknesses":["Short"]}],"contentGap":{"missingKeywords":["keyword"],"missingHeadings":["Heading"],"missingFAQs":["Question?"],"missingSubtopics":["Subtopic A"],"targetWordCountRange":"1200-1500","recommendedH2s":["Rec H2"]}}`
        }]
      }],
      tools: [{ googleSearch: {} }],
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
      onChunk: (chunk) => { raw += chunk; },
      onComplete: () => {
        setLoadingCompetitors(false);
        try {
          const match = raw.match(/\{[\s\S]*\}/);
          if (!match) throw new Error();
          const parsed = JSON.parse(match[0]);
          const parsedCompetitors = Array.isArray(parsed.competitors) ? parsed.competitors : [];
          const evidenceSet = new Set(verifiedUrls.map(url => url.replace(/\/$/, '').toLowerCase()));
          const groundedCompetitors: CompetitorResult[] = (verifiedUrls.length
            ? parsedCompetitors.filter((item: any) => evidenceSet.has(String(item?.url || '').replace(/\/$/, '').toLowerCase()))
            : parsedCompetitors.filter((item: any) => /^https?:\/\//i.test(String(item?.url || ''))))
            .map((item: any) => {
              const normalizedUrl = String(item?.url || '').trim();
              const verified = verifiedSerpCompetitors.find(v => v.url.replace(/\/$/, '').toLowerCase() === normalizedUrl.replace(/\/$/, '').toLowerCase());
              const parsedWordCount = Number(item?.wordCount);
              return {
                url: normalizedUrl,
                title: String(item?.title || normalizedUrl),
                // When SERP evidence is available, only retain its verified count.
                // In fallback mode, accept a grounded positive numeric count or mark it unavailable.
                wordCount: verifiedUrls.length
                  ? (typeof verified?.wordCount === 'number' ? verified.wordCount : null)
                  : (Number.isFinite(parsedWordCount) && parsedWordCount > 0 ? parsedWordCount : null),
              };
            });

          setCompetitors(groundedCompetitors);
          if (groundedCompetitors.length) {
            executeAnalysisComputation(content, cleanKeyword, aiLinksActive, aiGrammarActive, isBloggerMode ? bloggerTitle : undefined, groundedCompetitors);
          }
          const gap = parsed.contentGap || {};
          const competitorKeywords = groundedCompetitors.flatMap((item: any) => Array.isArray(item.keywordsUsed) ? item.keywordsUsed : []);
          const coverage = computeCompetitorKeywordCoverage(
            content,
            Array.isArray(gap.missingKeywords) ? gap.missingKeywords : [],
            [...(Array.isArray(gap.missingKeywords) ? gap.missingKeywords : []), ...competitorKeywords],
            Array.isArray(gap.missingHeadings) ? gap.missingHeadings : [],
            Array.isArray(gap.missingFAQs) ? gap.missingFAQs : [],
            Array.isArray(gap.missingSubtopics) ? gap.missingSubtopics : [],
            typeof gap.targetWordCountRange === 'string' ? gap.targetWordCountRange : undefined,
            Array.isArray(gap.recommendedH2s) ? gap.recommendedH2s : []
          );
          setContentGap(coverage);
          toast.success(`Competitor analysis complete for ${marketCountry}: ${coverage.coveragePercent}% keyword coverage.`);
        } catch {
          toast.error('Competitor data could not be verified for this market. Please try again.');
        }
      },
      onError: () => {
        setLoadingCompetitors(false);
        toast.error('Competitor analysis is temporarily unavailable. Please try again.');
      },
    });
  };

  const charCount = content.length;

  // Analysis Sidebar Modules Render
  const renderAnalysisModules = () => (
    <div className="flex flex-col gap-2 relative">
      {/* Scores overview - Live preview available to all users */}
      <OverallScorePanel
        scores={scores}
        isAnalyzed={isBloggerMode && (bloggerStep === 3 || isTitleLocked || isBloggerCreditsCharged) ? true : isAnalyzed}
        isStale={isBloggerMode ? false : isStale}
        isAnalyzing={isAnalyzing}
        operationCost={currentCost}
        isGuest={isGuest}
        isSubscriber={isSubscriber}
        isBloggerMode={isBloggerMode}
        onRegister={() => handleAuthRedirect('/signup')}
        onUpgrade={() => openUpgradeModal({
          featureName: isBloggerMode ? 'AI Checker for Bloggers' : 'SEO Assistant',
          trigger: 'pro_feature',
          remaining: summary?.creditsBalance ?? 0,
          limit: currentCost,
        })}
        onAnalyze={isBloggerMode ? undefined : handleAnalyzeArticle}
      />

      {/* Modules 3–20 & Integrity Tools */}
      {!isSubscriber ? (
        <div className="relative mt-2 rounded-xl overflow-hidden border border-border bg-card/60">
          {/* Blurred Background Preview */}
          <div className="filter blur-[5px] select-none pointer-events-none opacity-30 p-2 space-y-3">
            <KeywordUsagePanel result={kwResult} keyword={keyword} onKeywordChange={handleKeywordChange} />
            <SemanticKeywordsPanel result={semanticResult} />
            <SearchIntentPanel result={intentResult} />
            <ReadabilityPanel result={readabilityResult} />
            <SentenceAnalysisPanel result={sentenceResult} onNavigateIssue={handleNavigateIssue} />
            <CompetitorIntelligencePanel 
              competitors={competitors} 
              contentGap={contentGap}
              onAnalyze={handleAnalyzeCompetitors}
              loading={loadingCompetitors}
              keyword={keyword}
              content={content}
              onInsertKeyword={handleInsertCompetitorKeyword}
            />
          </div>

          {/* Locked Gating Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-card/85 backdrop-blur-sm z-10">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
              <Lock className="w-6 h-6" />
            </div>

            {isGuest ? (
              <>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  Detailed SEO & AI Analysis Locked
                </h4>
                <p className="text-xs text-muted-foreground max-w-xs mb-4 text-pretty">
                  Create a free account or sign in to unlock comprehensive keyword tracking, EEAT audits, and sentence-level writing recommendations.
                </p>
                <Button
                  onClick={() => handleAuthRedirect('/signup')}
                  className="h-9 px-5 text-xs font-semibold bg-primary text-primary-foreground gap-1.5 shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Register to View Full Analysis</span>
                </Button>
                <p className="text-[11px] text-muted-foreground mt-2.5">
                  Already have an account?{' '}
                  <button
                    onClick={() => handleAuthRedirect('/login')}
                    className="text-primary hover:underline font-medium"
                  >
                    Log in
                  </button>
                </p>
              </>
            ) : (
              <>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  Full SEO Assistant Analysis (Pro Plan)
                </h4>
                <p className="text-xs text-muted-foreground max-w-xs mb-4 text-pretty">
                  Upgrade to Pro to unlock the complete 20-module deep audit, semantic keyword clustering, EEAT recommendations, AI risk breakdown, and publishing readiness.
                </p>
                <Button
                  onClick={() => openUpgradeModal({
                    featureName: isBloggerLanding ? 'AI Checker for Bloggers' : 'SEO Assistant',
                    trigger: 'pro_feature',
                    remaining: summary?.creditsBalance ?? 0,
                    limit: currentCost,
                  })}
                  className="h-9 px-5 text-xs font-semibold bg-primary text-primary-foreground gap-1.5 shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Upgrade to View Full Analysis</span>
                </Button>
                <span className="text-[11px] text-muted-foreground mt-2">
                  Pro includes 1,000 monthly credits · From $19/mo
                </span>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Modules 3–10 */}
          <KeywordUsagePanel result={kwResult} keyword={keyword} onKeywordChange={handleKeywordChange} />
          <SemanticKeywordsPanel result={semanticResult} />
          <SearchIntentPanel result={intentResult} />
          <ReadabilityPanel result={readabilityResult} />
          <SentenceAnalysisPanel result={sentenceResult} onNavigateIssue={handleNavigateIssue} />
          <ParagraphAnalysisPanel result={paraResult} onNavigateIssue={handleNavigateIssue} />
          <TransitionWordsPanel result={transitionResult} />
          <GrammarPanel result={grammarResult} onFix={handleFixGrammar} fixing={fixingGrammar} onNavigateIssue={handleNavigateIssue} />

          <CompetitorIntelligencePanel 
            competitors={competitors} 
            contentGap={contentGap}
            onAnalyze={handleAnalyzeCompetitors}
            loading={loadingCompetitors}
            keyword={keyword}
            content={content}
            onInsertKeyword={handleInsertCompetitorKeyword}
          />

          {/* Modules 11–20 */}
          <HeadingStructurePanel result={headingResult} onNavigateIssue={handleNavigateIssue} />
          <EEATPanel 
            result={eeatResult} 
            content={content}
            keyword={keyword}
            onInsertHook={handleInsertHook} 
            onNavigateLocation={handleNavigateIssue}
          />
          <EngagementPanel 
            result={engagementResult} 
            content={content}
            keyword={keyword}
            onInsertHook={handleInsertHook} 
            onNavigateLocation={handleNavigateIssue}
          />
          <InternalLinkingPanel 
            links={internalLinks} 
            onGenerateLinks={handleGenerateLinks} 
            generatingLinks={generatingLinks} 
            discoveryStatus={internalLinkStatus}
            statusMessage={internalLinkStatusMessage}
            domain={internalLinkDomain}
            onDomainChange={handleDomainChange}
            onNavigateLocation={handleNavigateIssue}
            onApplyLink={handleApplyInternalLink}
            onSaveProjectDomain={handleSaveActiveProjectDomain}
            savedProjectName={activeProjectName}
          />
          <SnippetPanel result={snippetResult} />
          <MetaOptimizationPanel result={metaResult} />
          <UniquenessPanel result={uniquenessResult} onNavigateOccurrence={handleNavigateIssue} />
          <AIRiskPanel result={aiRiskResult} />
          <FAQPanel faqs={faqs} onGenerate={handleGenerateFAQ} generating={generatingFaq} />

          {/* Secondary Section: Content Integrity & Authorship */}
          <div className="pt-3 pb-1 border-t border-border flex flex-col gap-2">
            <div className="flex items-center gap-1.5 px-1">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">Content Integrity & Authorship</span>
            </div>
            <p className="text-[10px] text-muted-foreground px-1 -mt-1 text-pretty">
              Calibrated AI detection, multilingual plagiarism scan, and immutable authorship registration.
            </p>

            <BalancedDetectionModule
              content={content}
              balancedResult={balancedResult}
              setBalancedResult={setBalancedResult}
              aggressiveResult={aiRiskResult}
              loading={balancedLoading}
              setLoading={setBalancedLoading}
              onSentenceHighlightToggle={setBalancedHighlightActive}
              sentenceHighlightActive={balancedHighlightActive}
              onNavigateIssue={handleNavigateIssue}
            />

            <MultilingualPlagiarismModule
              content={content}
              plagiarismResult={plagiarismResult}
              setPlagiarismResult={setPlagiarismResult}
              loading={plagiarismLoading}
              setLoading={setPlagiarismLoading}
              onHighlightToggle={setPlagiarismHighlightActive}
              highlightActive={plagiarismHighlightActive}
            />

            <AuthorshipSignatureModule
              content={content}
              metaTitle={metaResult.suggestedTitle || keyword || 'SEO Article'}
              registrationResult={authorshipResult}
              setRegistrationResult={setAuthorshipResult}
            />
          </div>

          <ExportPanel
            content={content}
            metaTitle={metaResult.suggestedTitle}
            metaDescription={metaResult.suggestedDescription}
            slug={metaResult.suggestedSlug}
            balancedResult={balancedResult}
            plagiarismResult={plagiarismResult}
            registrationResult={authorshipResult}
          />
        </>
      )}
    </div>
  );

  return (
    <div className={`flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden ${className}`}>
      <UpgradeModal
        open={open}
        onOpenChange={closeUpgradeModal}
        featureName={featureName}
        trigger={trigger}
        remaining={remaining}
        limit={limit}
      />

      <SEOAssistantHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onRestore={handleRestoreFromHistory}
        onHistoryChange={() => setHistoryCount(getSEOAssistantHistory().length)}
      />

      {/* Top Workspace Header Controls */}
      {showHeaderControls && (
        <div className="border-b border-border bg-card px-4 md:px-6 py-3 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center flex-wrap gap-2">
              <h2 className="text-sm md:text-base font-bold text-foreground">
                {isBloggerLanding ? 'Blog Post SEO & AI Analysis Workspace' : (enableBloggerOptimization ? 'SEO Writing Assistant & Blogger Optimization' : 'SEO Writing Assistant')}
              </h2>
              {isBloggerMode && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                  Interactive Engine
                </span>
              )}
              {draftSavedTime && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-normal ml-1 shrink-0">
                  <Check className="w-3 h-3 text-success shrink-0" />
                  <span>Draft saved</span>
                </span>
              )}
              {content && (
                <span className="text-xs text-muted-foreground hidden sm:inline-flex items-center ml-auto xl:ml-2 shrink-0">
                  {wordCount} words · {charCount} chars
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-pretty mt-0.5">
              {isBloggerMode 
                ? 'Type or paste your blog post below for instant SEO, readability, AI risk & publishing readiness.' 
                : 'Real-time analysis · 20 modules · Semrush-style scoring'}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0 justify-start xl:justify-end">
            <UsageBadge
              featureSlug={featureSlugForBilling}
              label={isBloggerMode ? `Analyze Article · ${currentCost} Credits` : 'Daily AI uses'}
              operationCost={currentCost}
            />

            {/* Run Full Analysis Action */}
            {isGuest ? (
              <Button
                size="sm"
                onClick={() => handleAuthRedirect('/signup')}
                className="h-8 text-xs font-semibold bg-primary text-primary-foreground gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Register to View Full Analysis</span>
              </Button>
            ) : !isSubscriber ? (
              <Button
                size="sm"
                onClick={() => openUpgradeModal({
                  featureName: isBloggerMode ? 'AI Checker for Bloggers' : 'SEO Assistant',
                  trigger: 'pro_feature',
                  remaining: summary?.creditsBalance ?? 0,
                  limit: currentCost,
                })}
                className="h-8 text-xs font-semibold bg-primary text-primary-foreground gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Upgrade to View Full Analysis</span>
              </Button>
            ) : isBloggerMode ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-success/10 border border-success/30 text-success text-xs font-semibold select-none">
                <Check className="w-3.5 h-3.5 text-success" />
                <span>Live Real-Time SEO Active</span>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleAnalyzeArticle}
                disabled={isAnalyzing || !content.trim() || wordCount < 5}
                className="h-8 text-xs font-semibold bg-primary text-primary-foreground gap-1.5 shadow-sm"
                title={`Execute full SEO & AI analysis (${currentCost} credits)`}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : isStale ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-run Analysis ({currentCost} Cr)</span>
                  </>
                ) : isAnalyzed ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-success" />
                    <span>Analyzed</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Analyze Article ({currentCost} Cr)</span>
                  </>
                )}
              </Button>
            )}
            
            {/* History Action */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-border gap-1 text-muted-foreground hover:text-foreground"
              onClick={handleOpenHistory}
              title="Open past analyses (free)"
            >
              <History className="w-3.5 h-3.5" />
              <span>History {historyCount > 0 ? `(${historyCount})` : ''}</span>
            </Button>

            {/* Save / Clear Draft Actions */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-border gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => saveDraft(content, keyword, true)}
              title="Save draft locally (does not consume credits)"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </Button>

            {content.trim() && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1 px-2"
                onClick={handleClearDraft}
                title="Clear current workspace"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="sr-only sm:not-sr-only">Clear</span>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 text-xs border-border gap-1.5" disabled={!content.trim() || aiRewriting}>
                  {aiRewriting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileEdit className="w-3.5 h-3.5" />}
                  {aiRewriting ? 'Rewriting...' : 'Rewrite Tools'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">Optimization</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleRewrite('humanize')} className="text-xs">Humanize Content</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRewrite('readability')} className="text-xs">Improve Readability</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs">Length</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleRewrite('shorten')} className="text-xs">Shorten Content</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRewrite('expand')} className="text-xs">Expand Content</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs">Tone</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleRewrite('expert')} className="text-xs">Expert Tone</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRewrite('conversational')} className="text-xs">Conversational</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRewrite('academic')} className="text-xs">Academic Tone</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRewrite('journalistic')} className="text-xs">Journalistic</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-border gap-1.5"
              onClick={handleAIRecommendations}
              disabled={aiRecLoading || !content.trim()}
            >
              {aiRecLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {aiRecLoading ? 'Analyzing…' : 'AI Recommendations'}
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs bg-primary text-primary-foreground gap-1.5"
              onClick={() => { setAiModalOpen(true); setAiKeyword(keyword); }}
            >
              <Wand2 className="w-3.5 h-3.5" /> Generate with AI
            </Button>
          </div>
        </div>
      )}

      {/* Active SEO Project & Website Domain Settings Bar */}
      <div className="border-b border-border bg-muted/20 px-4 md:px-6 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-muted-foreground font-medium flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-primary" /> Active SEO Project:
          </span>
          <span className="font-semibold text-foreground px-2 py-0.5 rounded bg-background border border-border">
            {activeProjectName || 'Default Website Project'}
          </span>
          <div className="flex items-center gap-1.5 ml-0 md:ml-2">
            <Input
              value={internalLinkDomain}
              onChange={(e) => handleDomainChange(e.target.value)}
              placeholder="e.g. yourwebsite.com"
              className="h-7 text-xs border-border w-44 md:w-56 font-mono"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSaveActiveProjectDomain()}
              disabled={savingProjectDomain || !internalLinkDomain.trim()}
              className="h-7 text-xs border-border gap-1 hover:bg-background cursor-pointer"
              title="Save this website domain into your active SEO project settings"
            >
              {savingProjectDomain ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookmarkCheck className="w-3.5 h-3.5 text-primary" />}
              <span>Save to Project Settings</span>
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
          <span>Domain synced with project settings for internal links & competitor gap analysis</span>
        </div>
      </div>

      {/* Editorial Spacing Warning Notice (Consecutive spaces in lines) */}
      {/\S[ ]{2,}\S/.test(content) && (
        <div className="px-4 py-1.5 bg-warning/10 border-b border-warning/20 text-warning text-[11px] flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Spacing Notice: Consecutive whitespace detected inside text lines. Standard single-spacing recommended for cleaner search parsing.</span>
        </div>
      )}

      {/* ── Blogger Sequential 3-Step Workflow ── */}
      {isBloggerMode && (
        <BloggerWorkflowSteps
          step={bloggerStep}
          primaryKeyword={keyword}
          relatedKeywords={bloggerRelatedKeywords}
          title={bloggerTitle}
          content={content}
          isKeywordsLocked={isKeywordsLocked}
          isTitleLocked={isTitleLocked}
          metrics={bloggerMetrics}
          onPrimaryKeywordChange={(val) => {
            if (!isKeywordsLocked) {
              setKeyword(val);
              handleKeywordChange(val);
            }
          }}
          onRelatedKeywordChange={(idx, val) => {
            if (!isKeywordsLocked) {
              setBloggerRelatedKeywords((prev) => {
                const next = [...prev];
                next[idx] = val;
                return next;
              });
            }
          }}
          onTitleChange={(val) => {
            if (!isTitleLocked) {
              setBloggerTitle(val);
            }
          }}
          onAnalyzeKeyword={handleAnalyzeKeyword}
          onLockKeywords={handleLockKeywords}
          hasCurrentAnalysis={hasCurrentBloggerAnalysis}
          onLockTitleAndPay={handleLockTitleAndPay}
          onStartNew={handleStartNewBloggerSession}
          isLockingTitle={isLockingTitle}
          creditsBalance={summary?.creditsBalance ?? entitlement?.remainingCredits ?? 0}
          targetCountry={bloggerTargetCountry}
          targetLanguage={bloggerTargetLanguage}
          onTargetCountryChange={(country) => {
            if (!isKeywordsLocked) {
              setBloggerTargetCountry(country);
              setCompetitors([]);
              setContentGap(null);
            }
          }}
          onTargetLanguageChange={(language) => {
            if (!isKeywordsLocked) {
              setBloggerTargetLanguage(language);
              setCompetitors([]);
              setContentGap(null);
            }
          }}
          autoGenerateRelated={bloggerAutoGenerateRelated}
          onAutoGenerateRelatedChange={(checked) => {
            if (!isKeywordsLocked) {
              setBloggerAutoGenerateRelated(checked);
              if (checked) setBloggerRelatedKeywords(['', '', '']);
              setBloggerMetrics(null);
              setBloggerAnalysisSignature(null);
            }
          }}
        />
      )}

      {/* Main Split Layout */}
      <div className="flex flex-col md:flex-row h-[600px] md:h-[720px] lg:h-[780px] overflow-hidden">
        
        {/* ── Left / Main: Editor Area ── */}
        <div className="flex-1 min-w-0 flex flex-col border-b md:border-b-0 md:border-r border-border overflow-hidden h-full min-h-0">
          {/* Target Keyword Bar */}
          {!isBloggerMode ? (
            <div className="px-4 md:px-6 py-2.5 border-b border-border bg-secondary/15 flex items-center gap-3 shrink-0">
              <Label htmlFor="blogger-target-keyword" className="text-xs font-medium text-muted-foreground shrink-0">
                Primary Keyword:
              </Label>
              <Input
                id="blogger-target-keyword"
                value={keyword}
                onChange={(e) => handleKeywordChange(e.target.value)}
                placeholder="e.g. AI checker for bloggers"
                className="h-7 text-xs border-border max-w-xs"
              />
              {wordCount > 0 && (
                <span className="text-xs text-muted-foreground ml-auto hidden sm:block">
                  {wordCount} words · {currentCost} Credits
                </span>
              )}
            </div>
          ) : bloggerStep === 3 ? (
            <div className="px-4 md:px-6 py-2 border-b border-border bg-secondary/10 flex items-center justify-between gap-3 shrink-0 text-xs">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-[11px] font-semibold text-muted-foreground shrink-0">Optimizing for:</span>
                <span className="font-bold text-foreground truncate">{keyword}</span>
                {bloggerRelatedKeywords.filter(Boolean).length > 0 && (
                  <span className="text-[11px] text-muted-foreground hidden md:inline-block">
                    (+{bloggerRelatedKeywords.filter(Boolean).join(', ')})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-muted-foreground text-[11px]">
                  {wordCount} words · 30 Credits Active
                </span>
              </div>
            </div>
          ) : null}

          {isBloggerMode && bloggerStep < 3 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/10">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">
                {bloggerStep === 1 ? 'Step 1: Set & Lock Target Keywords' : 'Step 2: Enter & Lock Content Title'}
              </h3>
              <p className="text-xs text-muted-foreground max-w-md text-pretty mb-4">
                {bloggerStep === 1
                  ? 'Complete Step 1 above by entering your primary keyword and up to 3 related keywords. The engine will evaluate keyword difficulty, search volume, and ranking requirements.'
                  : 'Enter your content title above (must contain the primary keyword) and lock it to unlock the full drafting & optimization editor. No additional credits are charged.'}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-primary">Next Action:</span>
                <span>Use the step panel above to proceed.</span>
              </div>
            </div>
          ) : (
            <>
              {/* Highlight Layer */}
              <SEOAssistantHighlights
                content={content}
                plagiarismResult={plagiarismResult}
                balancedResult={balancedResult}
                plagiarismHighlightActive={plagiarismHighlightActive}
                balancedHighlightActive={balancedHighlightActive}
              />

              {/* Editor Container */}
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <RichTextEditor
                  ref={editorRef}
                  initialValue={content}
                  onChange={handleContentChange}
                  placeholder={placeholder}
                  className="flex-1 min-h-0 overflow-hidden"
                />
              </div>
            </>
          )}
        </div>

        {/* ── Right: Analysis Panel (Desktop) ── */}
        <div className="hidden md:flex flex-col w-80 lg:w-96 shrink-0 bg-secondary/5 border-l border-border h-full min-h-0">
          <div className="p-3.5 border-b border-border bg-card/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground">SEO & AI Intelligence</span>
            </div>
            <div className="flex items-center gap-1.5">
              {isStale && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/30">
                  Modified
                </span>
              )}
              {isAnalyzed && !isStale && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30">
                  Live Report
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {renderAnalysisModules()}
          </div>
        </div>

        {/* ── Mobile Drawer Trigger ── */}
        <div className="md:hidden border-t border-border bg-card p-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground">
              {isAnalyzed ? `Score: ${scores.overall}/100` : 'Analysis Ready'}
            </span>
            {isStale && <span className="text-[10px] text-warning font-semibold">(Modified)</span>}
          </div>
          <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
            <SheetTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1 border-primary/30 text-primary">
                <span>View Full Analysis</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-card">
              <SheetHeader className="p-4 border-b border-border">
                <SheetTitle className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> SEO & AI Intelligence Report
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {renderAnalysisModules()}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* AI Generate Modal */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm md:text-base">
              <Wand2 className="w-4 h-4 text-primary" /> Generate SEO-Optimized Article
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-xs text-muted-foreground text-pretty">
              Enter your target keyword and Miaoda AI will draft a complete, structured 1,000-word blog post optimized for search engines and high readability.
            </p>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Target Keyword</Label>
              <Input
                value={aiKeyword}
                onChange={(e) => setAiKeyword(e.target.value)}
                placeholder="e.g. how to optimize blog post for SEO"
                className="h-9 text-xs"
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateArticle(); }}
              />
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => setAiModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleGenerateArticle}
                disabled={aiGenerating || !aiKeyword.trim()}
                className="text-xs bg-primary text-primary-foreground gap-1.5"
              >
                {aiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {aiGenerating ? 'Generating...' : 'Generate Article (5 Credits)'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Recommendations Dialog */}
      <Dialog open={!!aiRec} onOpenChange={() => setAiRec('')}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[85dvh] flex flex-col p-0">
          <DialogHeader className="p-4 md:p-6 pb-2 border-b border-border bg-card shrink-0">
            <DialogTitle className="text-sm md:text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Enterprise SEO Strategic Recommendations
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 md:p-6 text-xs text-foreground space-y-3 leading-relaxed whitespace-pre-wrap font-mono bg-secondary/10">
            {aiRec}
          </div>
          <div className="p-4 border-t border-border bg-card flex justify-end shrink-0">
            <Button size="sm" onClick={() => setAiRec('')} className="text-xs">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
