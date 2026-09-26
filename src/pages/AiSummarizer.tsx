import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowRight, Check, ChevronDown, Clock, Copy, Download, FileText, Globe, Info, Languages,
  ListChecks, Loader2, RotateCcw, Scissors, Sparkles, Target, Trash2, Undo2, Upload, X,
} from 'lucide-react';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import UpgradeModal from '@/components/common/UpgradeModal';
import SummarizerHistoryDrawer from '@/components/ai-summarizer/SummarizerHistoryDrawer';
import { useAuth } from '@/contexts/AuthContext';
import { useUpgradeModal } from '@/hooks/useUpgradeModal';
import { useEntitlement } from '@/hooks/useEntitlement';
import { extractTextFromFile } from '@/utils/fileExtractor';
import { extractTextFromWebUrl } from '@/utils/urlExtractor';
import {
  getSummaryHistory, saveSummaryToHistory, removeSummaryFromHistory,
  clearSummaryHistory, type SummaryHistoryItem
} from '@/utils/summarizerHistory';
import AiSummarizerSeoContent, { FAQ_ITEMS } from '@/components/ai-summarizer/AiSummarizerSeoContent';
import {
  FORMAT_OPTIONS, LENGTH_OPTIONS, MAX_INPUT_WORDS, MIN_INPUT_WORDS,
  SUPPORTED_LANGUAGES, TRIAL_MAX_WORDS, buildSummaryTxt, computeSummaryCreditCost,
  countSummaryWords, previewSummarizeCost, runSummarizer,
  type SummaryFormat, type SummaryLength, type SummarizeResult,
} from '@/lib/summarizerApi';
import { preserveDraftText, getPreservedDraftText, clearPreservedDraftText } from '@/lib/visitorId';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const FEATURE_SLUG = 'ai_summarizer';
const SAMPLE_TEXT = `Remote work has reshaped how distributed teams collaborate, and the evidence is more mixed than headlines suggest. A 2023 Stanford study of 16,000 workers found that fully remote employees were about 10 percent less productive than their in-office peers, while hybrid schedules with one or two office days showed no measurable productivity loss. The researchers cautioned, however, that productivity differences varied sharply by role: software engineers showed little change, while junior employees in mentorship-heavy roles appeared to lose the most from full-time remote arrangements.

The findings complicate the return-to-office debate. Advocates of office mandates argue that spontaneous collaboration drives innovation, yet the Stanford team found that scheduled video calls replaced most informal exchanges without a clear drop in creative output. Critics of mandates counter that commute time is an unrecovered cost for workers; the study estimated the average remote worker saved roughly 70 minutes of commuting per day, though part of that time was absorbed by longer workdays.

Cost is another dividing line. Companies such as Dropbox and Airbnb have downsized office footprints and reported savings, but the study's authors note that real-estate savings often fund technology stipends and retreats, offsetting much of the gain. Whether hybrid work endures may depend less on productivity data than on which outcome executives choose to measure.`;

function hashText(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (Math.imul(31, h) + text.charCodeAt(i)) | 0;
  }
  return `h${h}_${text.length}`;
}

type Preview = {
  isTrial: boolean;
  cost: number;
  allowed: boolean;
  trialBlockedByLength: boolean;
  reason: string | null;
} | null;

export default function AiSummarizer() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { open, featureName, trigger, remaining, limit, openUpgradeModal, closeUpgradeModal } = useUpgradeModal();
  const { refresh: refreshEntitlement, entitlement } = useEntitlement(FEATURE_SLUG);

  const [text, setText] = useState('');
  const [length, setLength] = useState<SummaryLength>('medium');
  const [format, setFormat] = useState<SummaryFormat>('paragraphs');
  const [language, setLanguage] = useState('English');
  const [focusEnabled, setFocusEnabled] = useState(false);
  const [focusText, setFocusText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);

  const [isSummarizing, setIsSummarizing] = useState(false);
  const [result, setResult] = useState<SummarizeResult | null>(null);
  const [resultSourceHash, setResultSourceHash] = useState<string | null>(null);
  const [resultSettingsKey, setResultSettingsKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState<Preview>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [lastCleared, setLastCleared] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [isExtractingUrl, setIsExtractingUrl] = useState(false);
  const [history, setHistory] = useState<SummaryHistoryItem[]>(() => getSummaryHistory());
  const [historyOpen, setHistoryOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const idempotencyRef = useRef<string>('');

  const inputWords = useMemo(() => countSummaryWords(text), [text]);
  const currentSettingsKey = `${length}|${format}|${language}|${focusEnabled ? focusText : ''}`;

  // Stale-result detection: editing input or settings marks previous summary outdated (no auto rerun).
  const isResultStale = useMemo(() => {
    if (!result || !resultSourceHash) return false;
    return resultSourceHash !== hashText(text) || resultSettingsKey !== currentSettingsKey;
  }, [result, resultSourceHash, resultSettingsKey, text, currentSettingsKey]);

  // Restore preserved draft after sign-in redirect.
  useEffect(() => {
    const saved = getPreservedDraftText('ai_summarizer');
    if (saved && saved.trim()) {
      setText(saved);
      clearPreservedDraftText();
      toast.info('Your draft text has been restored.');
    }
  }, []);

  // Live cost preview (exact charge before submission).
  useEffect(() => {
    let cancelled = false;
    if (inputWords < MIN_INPUT_WORDS) {
      setPreview(null);
      return;
    }
    (async () => {
      try {
        const p = await previewSummarizeCost(inputWords);
        if (!cancelled) setPreview(p);
      } catch {
        if (!cancelled) setPreview(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inputWords, user, entitlement?.trialChecksRemaining]);

  const trialWordsExceeded = inputWords > TRIAL_MAX_WORDS && preview?.isTrial === false && preview?.trialBlockedByLength;

  const handleFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setExtractionError(null);
    try {
      const extracted = await extractTextFromFile(file);
      const words = countSummaryWords(extracted);
      if (words < MIN_INPUT_WORDS) {
        setExtractionError(
          `The file "${file.name}" extracted only ${words} words of readable text. The summarizer needs at least ${MIN_INPUT_WORDS} words. If this is a scanned document or an image-only PDF, the text cannot be extracted.`
        );
        return;
      }
      if (words > MAX_INPUT_WORDS) {
        setExtractionError(
          `The file "${file.name}" contains ${words.toLocaleString('en-US')} words, above the ${MAX_INPUT_WORDS.toLocaleString('en-US')}-word limit. Please split the document or summarize a shorter section.`
        );
        return;
      }
      setText(extracted);
      setFileName(file.name);
      setResult(null);
      toast.success(`Loaded ${words.toLocaleString('en-US')} words from ${file.name}`);
    } catch (err: any) {
      setExtractionError(
        err?.message?.includes('Unsupported file type')
          ? `Unsupported file type for "${file.name}". Please upload PDF, DOCX, TXT, HTML, or Markdown files.`
          : `The file "${file.name}" could not be read. It may be corrupt, password-protected, or a scanned document without a text layer.`
      );
    }
  }, []);

  const handleExtractUrl = useCallback(async () => {
    const trimmed = urlValue.trim();
    if (!trimmed) {
      toast.error('Please enter a web article URL.');
      return;
    }
    setExtractionError(null);
    setIsExtractingUrl(true);
    try {
      const extracted = await extractTextFromWebUrl(trimmed);
      const words = countSummaryWords(extracted);
      if (words < MIN_INPUT_WORDS) {
        setExtractionError(
          `Extracted only ${words} words of article text from the URL. The summarizer needs at least ${MIN_INPUT_WORDS} words.`
        );
        return;
      }
      if (words > MAX_INPUT_WORDS) {
        setExtractionError(
          `The web page contains ${words.toLocaleString('en-US')} words, exceeding the ${MAX_INPUT_WORDS.toLocaleString('en-US')}-word limit. Please summarize a shorter article or section.`
        );
        return;
      }
      setText(extracted);
      setFileName(`Web Article (${new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`).hostname})`);
      setResult(null);
      setShowUrlInput(false);
      setUrlValue('');
      toast.success(`Extracted ${words.toLocaleString('en-US')} words from web page.`);
    } catch (err: any) {
      setExtractionError(err?.message || 'Could not extract article text from this URL. Please verify the link or paste the text directly.');
    } finally {
      setIsExtractingUrl(false);
    }
  }, [urlValue]);

  const handleClear = useCallback(() => {
    if (!text) return;
    setLastCleared(text);
    setText('');
    setFileName(null);
    setResult(null);
    setExtractionError(null);
  }, [text]);

  const handleUndoClear = useCallback(() => {
    if (lastCleared === null) return;
    setText(lastCleared);
    setLastCleared(null);
  }, [lastCleared]);

  const handleSummarize = useCallback(async () => {
    const trimmed = text.trim();
    const words = countSummaryWords(trimmed);
    if (words < MIN_INPUT_WORDS) {
      toast.error(`Please provide at least ${MIN_INPUT_WORDS} words to summarize (you have ${words}).`);
      return;
    }
    if (words > MAX_INPUT_WORDS) {
      toast.error(`The input is ${words.toLocaleString('en-US')} words — above the ${MAX_INPUT_WORDS.toLocaleString('en-US')}-word limit.`);
      return;
    }

    if (preview && !preview.allowed) {
      preserveDraftText(trimmed, 'ai_summarizer');
      openUpgradeModal({
        featureName: 'AI Summarizer',
        trigger: 'limit_reached',
        remaining: entitlement?.remainingCredits ?? entitlement?.trialChecksRemaining ?? 0,
        limit: preview.cost || 2,
      });
      return;
    }

    setIsSummarizing(true);
    setCopied(false);
    idempotencyRef.current = `sum_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;

    try {
      const res = await runSummarizer({
        text: trimmed,
        length,
        format,
        focus: focusEnabled && focusText.trim() ? focusText.trim() : undefined,
        language,
        idempotencyKey: idempotencyRef.current,
      });
      setResult(res);
      setResultSourceHash(hashText(trimmed));
      setResultSettingsKey(`${length}|${format}|${language}|${focusEnabled ? focusText : ''}`);
      
      // Auto-save completed summary to local session history
      try {
        const title = fileName ? fileName : (trimmed.split('\n')[0]?.trim().slice(0, 50) || 'Text Summary');
        saveSummaryToHistory({
          title,
          inputText: trimmed,
          inputWords: words,
          fileName,
          result: res,
          settings: {
            length,
            format,
            language,
            focus: focusEnabled && focusText.trim() ? focusText.trim() : undefined,
          },
        });
        setHistory(getSummaryHistory());
      } catch (histErr) {
        console.warn('Could not auto-save summary to history:', histErr);
      }

      refreshEntitlement();
      toast.success(
        res.usage.is_trial_check
          ? 'Summary completed using your free trial check.'
          : `Summary completed — ${res.usage.credits_charged} credit${res.usage.credits_charged === 1 ? '' : 's'} charged.`
      );
    } catch (err: any) {
      const code = err?.error_code as string | undefined;
      if (err?.upgrade_required) {
        // Preserve input and settings; direct to registration (guest) or pricing (registered).
        preserveDraftText(trimmed, 'ai_summarizer');
        openUpgradeModal({
          featureName: 'AI Summarizer',
          trigger: 'limit_reached',
          remaining: err?.remaining ?? null,
          limit: err?.limit ?? null,
        });
      } else if (code === 'INPUT_TOO_LONG' || code === 'INPUT_TOO_SHORT') {
        toast.error(err.message);
      } else {
        toast.error(err.message || 'Summarization failed. Your input is preserved — please try again.');
      }
    } finally {
      setIsSummarizing(false);
    }
  }, [text, length, format, language, focusEnabled, focusText, openUpgradeModal, refreshEntitlement]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    const plain =
      result.summary.format === 'paragraphs'
        ? result.summary.items.join('\n\n')
        : result.summary.items.map((i) => `• ${i}`).join('\n');
    try {
      await navigator.clipboard.writeText(plain);
      setCopied(true);
      toast.success('Summary copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not access the clipboard.');
    }
  }, [result]);

  const handleDownloadTxt = useCallback(() => {
    if (!result) return;
    const blob = new Blob([buildSummaryTxt(result)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-summary.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  const handleRestoreFromHistory = useCallback((item: SummaryHistoryItem) => {
    setText(item.inputText);
    setFileName(item.fileName || null);
    setLength(item.settings.length);
    setFormat(item.settings.format);
    setLanguage(item.settings.language);
    if (item.settings.focus) {
      setFocusEnabled(true);
      setFocusText(item.settings.focus);
    } else {
      setFocusEnabled(false);
      setFocusText('');
    }
    setResult(item.result);
    setResultSourceHash(hashText(item.inputText));
    setResultSettingsKey(`${item.settings.length}|${item.settings.format}|${item.settings.language}|${item.settings.focus || ''}`);
    setExtractionError(null);
  }, []);

  const handleRemoveHistoryItem = useCallback((id: string) => {
    const updated = removeSummaryFromHistory(id);
    setHistory(updated);
  }, []);

  const handleClearAllHistory = useCallback(() => {
    clearSummaryHistory();
    setHistory([]);
    toast.success('Session history cleared.');
  }, []);

  const costLabel = useMemo(() => {
    if (isSummarizing) return 'Summarizing…';
    if (inputWords < MIN_INPUT_WORDS) return `Enter at least ${MIN_INPUT_WORDS} words`;
    if (preview === null) return `${computeSummaryCreditCost(inputWords)} credits`;
    if (preview.isTrial) return '1 free trial check';
    return `${preview.cost} credit${preview.cost === 1 ? '' : 's'}`;
  }, [isSummarizing, inputWords, preview]);

  const overLimit = inputWords > MAX_INPUT_WORDS;

  return (
    <MainLayout>
      <PageMeta
        title="AI Summarizer — Summarize Text & Documents | AIDetector.cx"
        description="Summarize articles, reports, papers, and notes into short, medium, or detailed summaries. Source-grounded output with verifiable references, three formats, and 20 languages."
        canonicalUrl="https://www.aidetector.cx/ai-summarizer"
        schemas={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'AI Summarizer — Summarize Text & Documents | AIDetector.cx',
            description:
              'Summarize articles, reports, papers, and notes into short, medium, or detailed summaries. Source-grounded output with verifiable references, three formats, and 20 languages.',
            url: 'https://www.aidetector.cx/ai-summarizer',
            inLanguage: 'en',
            isPartOf: { '@type': 'WebSite', name: 'AIDetector.cx', url: 'https://www.aidetector.cx' },
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.aidetector.cx' },
                { '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://www.aidetector.cx/tools' },
                { '@type': 'ListItem', position: 3, name: 'AI Summarizer', item: 'https://www.aidetector.cx/ai-summarizer' },
              ],
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'AIDetector.cx AI Summarizer',
            applicationCategory: 'UtilitiesApplication',
            operatingSystem: 'Web',
            url: 'https://www.aidetector.cx/ai-summarizer',
            browserRequirements: 'Requires JavaScript',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              description:
                'One guest trial check, four additional checks after free registration, then 2 credits per started 1,000 input words. Trial checks cover inputs up to 2,000 words.',
            },
            featureList: [
              'Short, Medium, and Detailed summary lengths with honest word targets',
              'Paragraphs, Bullet Points, and Key Takeaways output formats',
              'Optional custom focus topic and 20 output languages',
              'Expandable source references with real section mappings',
              'Input and output word counts with actual length reduction',
              'Copy and TXT download of completed summaries',
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ_ITEMS.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          },
        ]}
      />

      <div className="container mx-auto max-w-7xl px-4 py-8 md:py-10">
        {/* ── Compact header ─────────────────────────────────────────── */}
        <header className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="secondary" className="gap-1.5">
              <Sparkles className="w-3 h-3" /> AI Summarizer
            </Badge>
            <Badge variant="outline">Source-grounded</Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-balance">
            AI Summarizer for Text, Articles &amp; Documents
          </h1>
          <p className="mt-2 text-muted-foreground text-pretty max-w-2xl">
            Turn long content into clear summaries while preserving its main ideas, facts, and important qualifications.
          </p>
        </header>

        {/* ── Tool: input + output side-by-side on desktop ───────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Input panel */}
          <Card className="min-w-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3 min-w-0">
                <div className="min-w-0">
                  <CardTitle className="text-base">Source text</CardTitle>
                  <CardDescription className="mt-1 text-xs">
                    Paste text, or upload PDF, DOCX, TXT, HTML, or Markdown
                  </CardDescription>
                </div>
                <span
                  className={`text-xs font-medium shrink-0 ${overLimit ? 'text-destructive' : 'text-muted-foreground'}`}
                >
                  {inputWords.toLocaleString('en-US')} / {MAX_INPUT_WORDS.toLocaleString('en-US')} words
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSummarizing}
                >
                  <Upload className="w-3.5 h-3.5" /> Upload
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md,.html"
                  className="hidden"
                  onChange={(e) => {
                    handleFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setShowUrlInput((prev) => !prev)}
                  disabled={isSummarizing}
                >
                  <Globe className="w-3.5 h-3.5" /> From URL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    setText(SAMPLE_TEXT);
                    setFileName(null);
                    setResult(null);
                    setExtractionError(null);
                  }}
                  disabled={isSummarizing}
                >
                  <FileText className="w-3.5 h-3.5" /> Load sample
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => setHistoryOpen(true)}
                >
                  <Clock className="w-3.5 h-3.5" /> History
                  {history.length > 0 && (
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4">
                      {history.length}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleClear}
                  disabled={isSummarizing || !text}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </Button>
                {lastCleared !== null && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={handleUndoClear}
                  >
                    <Undo2 className="w-3.5 h-3.5" /> Undo
                  </Button>
                )}
              </div>

              {showUrlInput && (
                <div className="p-3 bg-muted/40 border rounded-lg space-y-2">
                  <Label className="text-xs font-medium">Extract Article from Web Link (HTTP/HTTPS)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      placeholder="https://example.com/news-article"
                      value={urlValue}
                      onChange={(e) => setUrlValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleExtractUrl();
                        }
                      }}
                      className="h-8 text-xs flex-1"
                      disabled={isExtractingUrl}
                    />
                    <Button
                      size="sm"
                      className="h-8 text-xs shrink-0"
                      onClick={handleExtractUrl}
                      disabled={isExtractingUrl || !urlValue.trim()}
                    >
                      {isExtractingUrl ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Extracting…
                        </>
                      ) : (
                        'Extract'
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs px-2"
                      onClick={() => {
                        setShowUrlInput(false);
                        setUrlValue('');
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Extracts clean article text. Paywalled, password-protected, or internal network links are blocked.
                  </p>
                </div>
              )}

              {fileName && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Loaded from {fileName}</span>
                </div>
              )}

              <Textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setFileName(null);
                }}
                placeholder="Paste or type your text here (minimum 60 words). You can also upload a document above."
                className="min-h-[220px] md:min-h-[280px] resize-y text-sm leading-relaxed"
                disabled={isSummarizing}
                aria-label="Source text to summarize"
              />

              {extractionError && (
                <Alert variant="destructive">
                  <Info className="h-4 w-4" />
                  <AlertTitle>File could not be used</AlertTitle>
                  <AlertDescription>{extractionError}</AlertDescription>
                </Alert>
              )}

              {trialWordsExceeded && (
                <Alert>
                  <Target className="h-4 w-4" />
                  <AlertTitle>Input exceeds the free trial limit</AlertTitle>
                  <AlertDescription>
                    Free trial checks cover up to {TRIAL_MAX_WORDS.toLocaleString('en-US')} words. Shorten the
                    input to use a trial check, or sign in and use plan credits ({computeSummaryCreditCost(inputWords)}{' '}
                    credits for {inputWords.toLocaleString('en-US')} words).
                  </AlertDescription>
                </Alert>
              )}

              {/* Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Summary length</Label>
                  <div className="grid grid-cols-3 gap-1" role="group" aria-label="Summary length">
                    {LENGTH_OPTIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        type="button"
                        variant={length === opt.value ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 text-xs"
                        title={opt.description}
                        onClick={() => setLength(opt.value)}
                        disabled={isSummarizing}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground text-pretty">
                    {LENGTH_OPTIONS.find((o) => o.value === length)?.description}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Output format</Label>
                  <div className="grid grid-cols-3 gap-1" role="group" aria-label="Output format">
                    {FORMAT_OPTIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        type="button"
                        variant={format === opt.value ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setFormat(opt.value)}
                        disabled={isSummarizing}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {format === 'paragraphs'
                      ? 'Flowing prose in the source’s order.'
                      : format === 'bullets'
                        ? 'One distinct point per line.'
                        : 'Standalone takeaway sentences.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sum-language" className="text-xs font-medium flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5" /> Output language
                  </Label>
                  <select
                    id="sum-language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={isSummarizing}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 h-9">
                    <Switch
                      id="sum-focus-toggle"
                      checked={focusEnabled}
                      onCheckedChange={setFocusEnabled}
                      disabled={isSummarizing}
                      aria-label="Enable custom focus topic"
                    />
                    <Label htmlFor="sum-focus-toggle" className="text-xs font-medium">
                      Custom focus (optional)
                    </Label>
                  </div>
                  {focusEnabled ? (
                    <Input
                      value={focusText}
                      onChange={(e) => setFocusText(e.target.value)}
                      placeholder="e.g. Focus on findings and limitations"
                      className="h-9 text-sm"
                      maxLength={300}
                      disabled={isSummarizing}
                      aria-label="Custom focus topic"
                    />
                  ) : (
                    <p className="text-[11px] text-muted-foreground text-pretty">
                      Prioritize one topic if the source covers it. Focus cannot add facts.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                <Button
                  onClick={handleSummarize}
                  disabled={isSummarizing || inputWords < MIN_INPUT_WORDS || overLimit}
                  className="h-10 px-5 font-semibold gap-2 w-full sm:w-auto"
                >
                  {isSummarizing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Scissors className="w-4 h-4" />
                  )}
                  {isSummarizing ? 'Summarizing…' : 'Summarize'}
                </Button>
                <p className="text-xs text-muted-foreground min-w-0" aria-live="polite">
                  {costLabel}
                  {!user && inputWords >= MIN_INPUT_WORDS && !overLimit && ' · 1 guest check, then 4 more free after sign-up'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Output panel */}
          <Card className="min-w-0 lg:sticky lg:top-20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3 min-w-0">
                <div className="min-w-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    Summary
                    <Badge variant="outline" className="text-[10px] font-normal shrink-0">
                      AI-generated
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs">
                    {result
                      ? `${result.stats.output_words.toLocaleString('en-US')} words · ${result.stats.reduction_pct}% shorter than the source`
                      : 'Your summary appears here'}
                  </CardDescription>
                </div>
                {result && (
                  <div className="flex gap-1.5 shrink-0">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleCopy}>
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleDownloadTxt}>
                      <Download className="w-3.5 h-3.5" /> TXT
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isSummarizing && !result && (
                <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground text-center">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                  <p className="text-sm font-medium text-foreground">Reading your source and drafting a faithful summary…</p>
                  <p className="text-xs text-muted-foreground">Extracting core facts and validating source citations</p>
                </div>
              )}

              {!isSummarizing && !result && (
                <div className="py-16 flex flex-col items-center gap-2 text-muted-foreground text-center">
                  <ListChecks className="w-6 h-6 opacity-60" />
                  <p className="text-sm text-pretty">
                    Enter at least {MIN_INPUT_WORDS} words on the left, choose your length and format, then press
                    Summarize.
                  </p>
                </div>
              )}

              {result && isResultStale && (
                <Alert className="mb-4">
                  <RotateCcw className="h-4 w-4" />
                  <AlertTitle>Previous summary is outdated</AlertTitle>
                  <AlertDescription>
                    Your input or settings changed after this summary was produced. Press Summarize again to generate
                    a fresh summary (this is a separate billable operation).
                  </AlertDescription>
                </Alert>
              )}

              {result && (
                <div className="space-y-4">
                  {result.summary.format === 'paragraphs' ? (
                    <div className="space-y-3 text-sm leading-relaxed text-foreground/90 text-pretty">
                      {result.summary.items.map((p, i) => <p key={i}>{p}</p>)}
                    </div>
                  ) : (
                    <ul className="space-y-2.5 text-sm leading-relaxed text-foreground/90 text-pretty">
                      {result.summary.items.map((item, i) => (
                        <li key={i} className="flex gap-2.5">
                          <ChevronDown className="w-3.5 h-3.5 mt-1 shrink-0 rotate-[-90deg] text-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {result.notes && (
                    <p className="text-xs text-muted-foreground border-l-2 border-border pl-3 text-pretty">
                      {result.notes}
                    </p>
                  )}

                  {!result.coverage.full && result.coverage.note && (
                    <Alert variant="destructive">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Partial coverage</AlertTitle>
                      <AlertDescription>{result.coverage.note}</AlertDescription>
                    </Alert>
                  )}

                  {/* Source references */}
                  <div className="pt-2 border-t border-border/60">
                    <Accordion type="multiple" className="w-full">
                      <AccordionItem value="refs" className="border-0">
                        <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                          <span className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-primary" />
                            Source references ({result.references.length})
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-3 pt-1">
                          {result.references_note && (
                            <p className="text-xs text-muted-foreground">{result.references_note}</p>
                          )}
                          {result.references.map((ref, i) => (
                            <div key={i} className="rounded-md border border-border/60 bg-muted/30 p-3">
                              <p className="text-xs text-foreground/90 text-pretty">{ref.claim}</p>
                              <p className="mt-1.5 text-[11px] text-muted-foreground">
                                Source section{' '}
                                {ref.section_start === ref.section_end
                                  ? ref.section_start
                                  : `${ref.section_start}–${ref.section_end}`}
                                {ref.quote && (
                                  <>
                                    {' '}·{' '}
                                    <span
                                      className={
                                        ref.verified === 'unverified'
                                          ? 'text-amber-600 dark:text-amber-400'
                                          : 'text-foreground/70'
                                      }
                                    >
                                      “{ref.quote}”
                                      {ref.verified === 'unverified' && ' (could not be matched exactly)'}
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>
                          ))}
                          <p className="text-[11px] text-muted-foreground text-pretty">
                            References show where each statement came from in your supplied text. They do not
                            independently verify whether the source itself is true.
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>

                  {/* Validation + usage footer */}
                  <div className="pt-3 border-t border-border/60 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        {result.settings.length} · {result.settings.format}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{result.settings.language}</Badge>
                      {result.settings.focus && (
                        <Badge variant="outline" className="text-[10px]">Focus: {result.settings.focus}</Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {result.usage.is_trial_check ? 'Trial check' : `${result.usage.credits_charged} credits`}
                      </Badge>
                    </div>
                    {result.validation.warnings.length > 0 && (
                      <ul className="text-[11px] text-muted-foreground space-y-1">
                        {result.validation.warnings.map((w, i) => (
                          <li key={i}>• {w}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Related tools (explicit user action only) ────────────────── */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Word Counter', desc: 'Count words and characters in this text', href: '/word-counter' },
            { label: 'Plagiarism Checker', desc: 'Check the source against scholarly databases', href: '/plagiarism-checker' },
            { label: 'AI Detector', desc: 'Check any text for AI-generated patterns', href: '/detector' },
          ].map((t) => (
            <button
              key={t.href}
              onClick={() => navigate(t.href)}
              className="group flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/40 min-w-0"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium">{t.label}</span>
                <span className="block text-xs text-muted-foreground text-pretty">{t.desc}</span>
              </span>
              <ArrowRight className="w-4 h-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </div>

      <SummarizerHistoryDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        history={history}
        onRestore={handleRestoreFromHistory}
        onRemove={handleRemoveHistoryItem}
        onClear={handleClearAllHistory}
      />

      <UpgradeModal
        open={open}
        onOpenChange={closeUpgradeModal}
        featureName={featureName}
        trigger={trigger}
        remaining={remaining}
        limit={limit}
      />

      <AiSummarizerSeoContent />
    </MainLayout>
  );
}
