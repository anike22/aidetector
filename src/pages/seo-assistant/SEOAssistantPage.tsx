import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Wand2, Sparkles, RefreshCw, ChevronRight, Loader2, X, FileEdit
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { streamLLM } from '@/lib/sse';
import { toast } from 'sonner';
import { RichTextEditor, type RichTextEditorRef } from './RichTextEditor';

// Analysis engine
import {
  analyzeKeywordUsage, analyzeSemanticKeywords, analyzeSearchIntent,
  analyzeReadability, analyzeSentences, analyzeParagraphs,
  analyzeTransitionWords, analyzeGrammar, analyzeHeadingStructure,
  analyzeEEAT, analyzeEngagement, analyzeSnippetPotential,
  analyzeAIRisk, analyzeUniqueness, generateMeta, computeOverallScores,
  suggestInternalLinks,
  type KeywordUsageResult, type SemanticKeywordsResult, type SearchIntentResult,
  type ReadabilityResult, type SentenceAnalysisResult, type ParagraphAnalysisResult,
  type TransitionWordsResult, type GrammarResult, type HeadingStructureResult,
  type EEATResult, type EngagementResult, type SnippetResult,
  type AIRiskResult, type UniquenessResult, type MetaResult, type OverallScores,
  type CompetitorResult, type ContentGapResult
} from './analysisEngine';

// Modules 1–10
import {
  OverallScorePanel, KeywordUsagePanel, SemanticKeywordsPanel,
  SearchIntentPanel, ReadabilityPanel, SentenceAnalysisPanel,
  ParagraphAnalysisPanel, TransitionWordsPanel, GrammarPanel,
} from './AnalysisModules1to10';

// Modules 11–20
import {
  HeadingStructurePanel, EEATPanel, EngagementPanel, InternalLinkingPanel,
  SnippetPanel, MetaOptimizationPanel, UniquenessPanel, AIRiskPanel,
  FAQPanel, ExportPanel, CompetitorIntelligencePanel
} from './AnalysisModules11to20';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const PLACEHOLDER = `# Your Article Title Here

Start writing or paste your content to begin real-time SEO analysis.

## Introduction

Begin your article introduction here. The SEO Writing Assistant will analyze keyword usage, readability, structure, EEAT signals, and more as you write.

## Main Section

Add your main content here...`;

const DEFAULT_KW_RESULT: KeywordUsageResult = { density: 0, count: 0, inH1: false, inIntro: false, inHeadings: false, inConclusion: false, recommendations: ['Enter a primary keyword above to analyze placement.'] };
const DEFAULT_SCORES: OverallScores = { seo: 0, readability: 0, grammar: 0, eeat: 0, structure: 0, engagement: 0, overall: 0, publishingScore: 0, readyToPublish: false };

export default function SEOAssistantPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Editor state
  const [content, setContent] = useState('');
  const [keyword, setKeyword] = useState('');
  const [wordCount, setWordCount] = useState(0);

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
  const [internalLinks, setInternalLinks] = useState<ReturnType<typeof suggestInternalLinks>>([]);
  const [competitors, setCompetitors] = useState<CompetitorResult[]>([]);
  const [contentGap, setContentGap] = useState<ContentGapResult | null>(null);
  
  const [aiLinksActive, setAiLinksActive] = useState(false);
  const [aiGrammarActive, setAiGrammarActive] = useState(false);
  const [scores, setScores] = useState<OverallScores>(DEFAULT_SCORES);
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [generatingFaq, setGeneratingFaq] = useState(false);
  const [generatingLinks, setGeneratingLinks] = useState(false);
  const [fixingGrammar, setFixingGrammar] = useState(false);

  // AI modal
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiKeyword, setAiKeyword] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiRewriting, setAiRewriting] = useState(false);
  const [aiRec, setAiRec] = useState('');
  const [aiRecLoading, setAiRecLoading] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<RichTextEditorRef>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (user === null) navigate('/login');
  }, [user, navigate]);

  // Debounced analysis
  const runAnalysis = useCallback((text: string, kw: string, currentAiLinksActive: boolean, currentAiGrammarActive: boolean) => {
    if (!text.trim()) return;
    const words = text.split(/\s+/).filter(Boolean);
    setWordCount(words.length);

    const kwr = analyzeKeywordUsage(text, kw);
    const sem = analyzeSemanticKeywords(text, kw);
    const intent = analyzeSearchIntent(text);
    const read = analyzeReadability(text);
    const sent = analyzeSentences(text);
    const para = analyzeParagraphs(text);
    const trans = analyzeTransitionWords(text);
    const gram = analyzeGrammar(text);
    const head = analyzeHeadingStructure(text);
    const eeat = analyzeEEAT(text);
    const eng = analyzeEngagement(text);
    const snip = analyzeSnippetPotential(text);
    const risk = analyzeAIRisk(text);
    const uniq = analyzeUniqueness(text);
    const meta = generateMeta(text, kw);
    const links = suggestInternalLinks(text);

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
    if (!currentAiLinksActive) {
      setInternalLinks(links);
    }

    const computed = computeOverallScores({ kwResult: kwr, readability: read, grammar: gram, eeat, headings: head, engagement: eng, snippet: snip, uniqueness: uniq });
    setScores(computed);
  }, []);

  const handleContentChange = (val: string) => {
    setContent(val);
    setAiGrammarActive(false); // Reset AI grammar when user types
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runAnalysis(val, keyword, aiLinksActive, false), 800);
  };

  const handleKeywordChange = (val: string) => {
    setKeyword(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runAnalysis(content, val, aiLinksActive, aiGrammarActive), 600);
  };

  // Generate article with AI
  const handleGenerateArticle = async () => {
    if (!aiKeyword.trim()) { toast.error('Please enter a keyword.'); return; }
    setAiGenerating(true);
    setContent('');
    let raw = '';

    await streamLLM({
      contents: [{
        role: 'user',
        parts: [{
          text: `Write a comprehensive, SEO-optimized article about "${aiKeyword}". 

Requirements:
- Start with an H1 heading using ##-markdown syntax (# Title)
- Include 4-6 H2 sections with H3 subsections where relevant
- 800-1200 words
- Natural keyword usage of "${aiKeyword}" (0.8-1.5% density)
- Include personal examples, statistics, and authoritative sources
- Add a FAQ section at the end
- Write for a Grade 8 reading level
- Use varied sentence lengths
- Include transition words

Write the article now in Markdown format:`
        }]
      }],
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
      onChunk: (chunk) => {
        raw += chunk;
        setContent(raw);
        editorRef.current?.setContent(raw);
      },
      onComplete: () => {
        setAiGenerating(false);
        setAiModalOpen(false);
        setKeyword(aiKeyword);
        runAnalysis(raw, aiKeyword, aiLinksActive, aiGrammarActive);
        toast.success('Article generated! Analysis is running…');
      },
      onError: () => {
        setAiGenerating(false);
        toast.error('Generation failed. Please retry.');
      },
    });
  };

  // Rewrite content
  const handleRewrite = async (mode: string) => {
    if (!content.trim()) { toast.error('Please add content to rewrite.'); return; }
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
      contents: [{
        role: 'user',
        parts: [{
          text: `You are an expert SEO editor. Rewrite the following content according to these instructions:
          
Instructions: ${instructions}

Crucial: You must preserve all SEO optimization, including the usage of the keyword "${keyword || 'primary topic'}", headings, and semantic relevance. Return ONLY the rewritten text in Markdown. Do not add any conversational filler.

Original Content:
${content}`
        }]
      }],
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
      onChunk: (chunk) => {
        raw += chunk;
        setContent(raw);
        editorRef.current?.setContent(raw);
      },
      onComplete: () => {
        setAiRewriting(false);
        runAnalysis(raw, keyword, aiLinksActive, aiGrammarActive);
        toast.success(`Content rewritten (${mode})!`);
      },
      onError: () => {
        setAiRewriting(false);
        toast.error('Rewrite failed. Please retry.');
      },
    });
  };

  // Get AI recommendations
  const handleAIRecommendations = async () => {
    if (!content.trim()) { toast.error('Please add content first.'); return; }
    setAiRecLoading(true);
    setAiRec('');
    let raw = '';

    await streamLLM({
      contents: [{
        role: 'user',
        parts: [{
          text: `You are an enterprise-grade SEO consultant with access to Google Search.
Analyze this content for the keyword "${keyword || 'not specified'}" and provide advanced actionable recommendations.
Consider Search Intent, Semantic SEO, EEAT signals, Competitor weaknesses, Featured Snippet opportunities, and Backlink strategies.

Provide a prioritized action list in Markdown format using this exact structure:

### High Impact
- [Action 1] (Estimated ranking improvement: High)
- [Action 2]

### Medium Impact
- [Action 3]
- [Action 4]

### Backlink Opportunities
- Directory links: ...
- Guest posts: ...

### Recommended External Links
- Mention 2-3 authoritative external sources (e.g. government, research journals) to link to.

Content Excerpt:
${content.slice(0, 3000)}`
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

  // Fetch site links
  const handleGenerateLinks = async (domain: string) => {
    if (!content.trim()) { toast.error('Add content first to match links.'); return; }
    if (!domain.trim()) { toast.error('Enter a domain.'); return; }
    
    setGeneratingLinks(true);
    let raw = '';
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    await streamLLM({
      contents: [{
        role: 'user',
        parts: [{
          text: `You have access to Google Search. Find relevant internal links from the website "${cleanDomain}" that match the following content. Suggest exactly 3 to 5 internal links.

Article excerpt: "${content.slice(0, 1500)}"

Return ONLY valid JSON:
{"links":[{"url":"https://${cleanDomain}/...","title":"Page Title","anchorText":"exact phrase from excerpt to hyperlink","reason":"why"}]}`
        }]
      }],
      tools: [{ googleSearch: {} }],
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
      onChunk: (c) => { raw += c; },
      onComplete: () => {
        setGeneratingLinks(false);
        try {
          const m = raw.match(/\{[\s\S]*\}/);
          if (!m) throw new Error();
          const parsed = JSON.parse(m[0]);
          if (parsed.links && Array.isArray(parsed.links)) {
            setAiLinksActive(true);
            setInternalLinks(parsed.links);
            toast.success(`Found ${parsed.links.length} internal links from ${cleanDomain}`);
          }
        } catch { toast.error('Failed to parse links from website.'); }
      },
      onError: () => { setGeneratingLinks(false); toast.error('Link fetch failed.'); },
    });
  };

  // Identify Grammar AI Suggestions
  const handleFixGrammar = async () => {
    if (!content.trim()) { toast.error('Add content first.'); return; }
    setFixingGrammar(true);
    let raw = '';

    await streamLLM({
      contents: [{
        role: 'user',
        parts: [{
          text: `Analyze this content strictly for grammar, spelling, punctuation, and extra spacing issues.

Content:
"${content.slice(0, 1500)}"

Return ONLY valid JSON listing the issues found:
{"issues":[{"text":"exact text with error","suggestion":"how to fix it","type":"Spacing | Grammar | Spelling | Punctuation"}]}`
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
            toast.success(`Identified ${parsed.issues.length} grammar/spacing suggestions.`);
          }
        } catch { toast.error('Failed to analyze grammar.'); }
      },
      onError: () => { setFixingGrammar(false); toast.error('Grammar analysis failed.'); },
    });
  };

  // Generate FAQ
  const handleGenerateFAQ = async () => {
    if (!content.trim()) { toast.error('Add content first.'); return; }
    setGeneratingFaq(true);
    let raw = '';

    await streamLLM({
      contents: [{
        role: 'user',
        parts: [{
          text: `Generate 5 FAQ pairs for an article about "${keyword || 'this topic'}".

Content excerpt: "${content.slice(0, 1500)}"

Return ONLY valid JSON (no markdown fences):
{"faqs":[{"question":"...","answer":"..."}]}`
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

  const [loadingCompetitors, setLoadingCompetitors] = useState(false);
  const handleAnalyzeCompetitors = async () => {
    if (!keyword.trim()) { toast.error('Enter a target keyword first.'); return; }
    setLoadingCompetitors(true);
    let raw = '';
    await streamLLM({
      contents: [{
        role: 'user',
        parts: [{
          text: `You have access to Google Search. Analyze the top 5 ranking pages for the keyword "${keyword}".
          
Return ONLY valid JSON with no markdown fences, formatted exactly like this:
{
  "competitors": [
    { "url": "https...", "title": "Page Title", "wordCount": "~2000" }
  ],
  "contentGap": {
    "missingKeywords": ["keyword1", "keyword2"],
    "missingHeadings": ["heading1", "heading2"],
    "missingFAQs": ["question1", "question2"]
  }
}`
        }]
      }],
      tools: [{ googleSearch: {} }],
      supabaseUrl: SUPABASE_URL,
      supabaseAnonKey: SUPABASE_ANON_KEY,
      onChunk: (c) => { raw += c; },
      onComplete: () => {
        setLoadingCompetitors(false);
        try {
          const m = raw.match(/\{[\s\S]*\}/);
          if (!m) throw new Error();
          const parsed = JSON.parse(m[0]);
          if (parsed.competitors) setCompetitors(parsed.competitors);
          if (parsed.contentGap) setContentGap(parsed.contentGap);
          toast.success('Competitor analysis complete!');
        } catch { toast.error('Failed to parse competitor data.'); }
      },
      onError: () => { setLoadingCompetitors(false); toast.error('Competitor analysis failed.'); }
    });
  };

  const charCount = content.length;

  return (
    <MainLayout showFooter={false}>
      {/* Page header */}
      <div className="border-b border-border bg-card px-4 md:px-6 py-3 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-navy">SEO Writing Assistant</h1>
          <p className="text-xs text-muted-foreground">Real-time analysis · 20 modules · Semrush-style scoring</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {content && (
            <span className="text-xs text-muted-foreground hidden md:block">{wordCount} words · {charCount} chars</span>
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

      {/* Main split layout */}
      <div className="flex min-h-[calc(100vh-7rem)] overflow-hidden">

        {/* ── Left: Editor Panel ── */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Keyword input bar */}
          <div className="px-4 md:px-6 py-2.5 border-b border-border bg-secondary/20 flex items-center gap-3">
            <label className="text-xs font-medium text-muted-foreground shrink-0">Primary Keyword:</label>
            <Input
              value={keyword}
              onChange={(e) => handleKeywordChange(e.target.value)}
              placeholder="e.g. Gemini AI review"
              className="h-7 text-xs border-border max-w-xs"
            />
            {wordCount > 0 && (
              <span className="text-xs text-muted-foreground ml-auto hidden md:block">{wordCount} words</span>
            )}
          </div>

          {/* Rich Text Editor */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <RichTextEditor
              ref={editorRef}
              initialValue={content}
              onChange={handleContentChange}
              placeholder={PLACEHOLDER}
              className="flex-1 overflow-hidden"
            />
          </div>

          {/* AI Recommendations panel */}
          {(aiRec || aiRecLoading) && (
            <div className="border-t border-border bg-primary/3 px-4 md:px-6 py-3 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-navy">AI Recommendations</span>
                </div>
                <button onClick={() => setAiRec('')} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {aiRecLoading && !aiRec && (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Analyzing your content…</span>
                </div>
              )}
              <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed text-pretty">{aiRec}</pre>
            </div>
          )}
        </div>

        {/* ── Right: Analysis Sidebar ── */}
        <div className="hidden md:flex flex-col w-72 lg:w-80 shrink-0 border-l border-border bg-secondary/10 overflow-y-auto">
          <div className="p-3 flex flex-col gap-2">

            {/* Scores overview */}
            <OverallScorePanel scores={scores} />

            {/* Modules 3–10 */}
            <KeywordUsagePanel result={kwResult} keyword={keyword} onKeywordChange={handleKeywordChange} />
            <SemanticKeywordsPanel result={semanticResult} />
            <SearchIntentPanel result={intentResult} />
            <ReadabilityPanel result={readabilityResult} />
            <SentenceAnalysisPanel result={sentenceResult} />
            <ParagraphAnalysisPanel result={paraResult} />
            <TransitionWordsPanel result={transitionResult} />
            <GrammarPanel result={grammarResult} onFix={handleFixGrammar} fixing={fixingGrammar} />

            <CompetitorIntelligencePanel 
              competitors={competitors} 
              contentGap={contentGap}
              onAnalyze={handleAnalyzeCompetitors}
              loading={loadingCompetitors}
              keyword={keyword}
            />

            {/* Modules 11–20 */}
            <HeadingStructurePanel result={headingResult} />
            <EEATPanel result={eeatResult} />
            <EngagementPanel result={engagementResult} />
            <InternalLinkingPanel links={internalLinks} onGenerateLinks={handleGenerateLinks} generatingLinks={generatingLinks} />
            <SnippetPanel result={snippetResult} />
            <MetaOptimizationPanel result={metaResult} />
            <UniquenessPanel result={uniquenessResult} />
            <AIRiskPanel result={aiRiskResult} />
            <FAQPanel faqs={faqs} onGenerate={handleGenerateFAQ} generating={generatingFaq} />
            <ExportPanel
              content={content}
              metaTitle={metaResult.suggestedTitle}
              metaDescription={metaResult.suggestedDescription}
              slug={metaResult.suggestedSlug}
            />

          </div>
        </div>

        {/* Mobile: analysis tab button */}
        <div className="md:hidden fixed bottom-4 right-4 z-40">
          <Button
            size="sm"
            className="h-10 bg-primary text-primary-foreground shadow-lg gap-1.5"
            onClick={() => toast.info('Open on desktop to see the full analysis sidebar.')}
          >
            <ChevronRight className="w-4 h-4" /> View Analysis
          </Button>
        </div>
      </div>

      {/* Generate with AI Modal */}
      <Dialog open={aiModalOpen} onOpenChange={setAiModalOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-navy flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-primary" /> Generate Article with AI
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div>
              <Label className="text-sm font-normal mb-1.5 block">Target Keyword</Label>
              <Input
                value={aiKeyword}
                onChange={(e) => setAiKeyword(e.target.value)}
                placeholder="e.g. Gemini AI review 2026"
                className="h-10 border-border"
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateArticle(); }}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                AI will generate an 800–1200 word SEO article. You can edit it after generation.
              </p>
            </div>
            {aiGenerating && (
              <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-primary">Streaming article into editor…</span>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" className="h-9 border-border" onClick={() => setAiModalOpen(false)} disabled={aiGenerating}>
                Cancel
              </Button>
              <Button
                className="h-9 bg-primary text-primary-foreground gap-2"
                onClick={handleGenerateArticle}
                disabled={aiGenerating || !aiKeyword.trim()}
              >
                {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {aiGenerating ? 'Generating…' : 'Generate Article'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
