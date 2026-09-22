import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  TextSearch, AlertTriangle, CheckCircle2, Globe, BookOpen, ExternalLink,
  RefreshCw, Layers, Link2, Info
} from 'lucide-react';
import { AnalysisModule } from '@/pages/seo-assistant/AnalysisShared';
import { analyzePlagiarism, type PlagiarismAnalysisResult } from '@/pages/detector/detectionEngine';
import { toast } from 'sonner';

export const SUPPORTED_LANGUAGES = [
  { code: 'auto', name: 'Auto-Detect Language' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'it', name: 'Italian (Italiano)' },
  { code: 'nl', name: 'Dutch (Nederlands)' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'pl', name: 'Polish (Polski)' },
  { code: 'tr', name: 'Turkish (Türkçe)' },
];

interface MultilingualPlagiarismModuleProps {
  content: string;
  plagiarismResult: PlagiarismAnalysisResult | null;
  setPlagiarismResult: (res: PlagiarismAnalysisResult | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  onHighlightToggle?: (active: boolean) => void;
  highlightActive?: boolean;
}

export function MultilingualPlagiarismModule({
  content,
  plagiarismResult,
  setPlagiarismResult,
  loading,
  setLoading,
  onHighlightToggle,
  highlightActive = false,
}: MultilingualPlagiarismModuleProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('auto');
  const [analyzedContent, setAnalyzedContent] = useState<string>('');

  const isOutdated = Boolean(plagiarismResult && analyzedContent && content.trim() !== analyzedContent.trim());

  const handleRunPlagiarism = async () => {
    if (!content.trim() || content.split(/\s+/).filter(Boolean).length < 25) {
      toast.error('Please enter at least 25 words to check for plagiarism.');
      return;
    }
    setLoading(true);
    try {
      const currentText = content;
      const res = await analyzePlagiarism(currentText, selectedLanguage);
      if (res.upgrade_required || res.errorCode) {
        if (res.errorCode === 'INSUFFICIENT_CREDITS') {
          toast.error(res.errorMessage || 'Insufficient credits for plagiarism check. Please top up your balance.');
        } else if (res.errorCode === 'TRIAL_EXHAUSTED') {
          toast.error(res.errorMessage || 'Free plagiarism check limit reached. Please upgrade your plan.');
        } else if (res.errorCode === 'UPGRADE_REQUIRED' || res.errorCode === 'PAID_ONLY_FEATURE') {
          toast.error(res.errorMessage || 'Plagiarism checking requires an active Pro plan. Please upgrade.');
        } else {
          toast.error(res.errorMessage || 'Plagiarism check limit reached. Please upgrade your plan.');
        }
        return;
      }
      if (res.status === 'analysis_failed' || res.status === 'provider_unavailable') {
        if (res.errorMessage) {
          toast.error(res.errorMessage);
        } else {
          toast.error('Plagiarism checker could not reach source providers. Please retry.');
        }
        setPlagiarismResult(res);
        return;
      }
      setPlagiarismResult(res);
      setAnalyzedContent(currentText);
      toast.success('Multilingual Plagiarism check completed.');
    } catch (err: any) {
      console.error('Plagiarism check error:', err);
      toast.error(err?.message || 'Plagiarism checker is temporarily unavailable. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const score = plagiarismResult ? plagiarismResult.originalityScore : undefined;

  return (
    <AnalysisModule
      title="Multilingual Plagiarism"
      score={score}
      defaultOpen={false}
    >
      <div className="flex flex-col gap-3">
        {isOutdated && (
          <div className="flex items-center gap-1.5 p-2 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1 text-pretty">Analyzed an earlier version of content.</span>
            <Button size="sm" variant="ghost" className="h-6 text-[10px] px-1.5 font-medium underline" onClick={handleRunPlagiarism}>
              Rerun
            </Button>
          </div>
        )}
        <p className="text-xs text-muted-foreground text-pretty">
          Searches indexed academic registries (Crossref, OpenAlex, Unpaywall) and live web sources across multiple languages.
        </p>

        {/* Language Selection */}
        <div className="flex items-center gap-2">
          <Label className="text-[11px] text-muted-foreground shrink-0 flex items-center gap-1">
            <Globe className="w-3 h-3 text-primary" /> Language:
          </Label>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="h-7 text-xs border-border flex-1">
              <SelectValue placeholder="Auto-Detect Language" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code} className="text-xs">
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleRunPlagiarism}
          disabled={loading || !content.trim()}
          className="h-8 text-xs border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 gap-1.5 w-full font-medium"
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Searching Scholarly & Web Sources…
            </>
          ) : (
            <>
              <TextSearch className="w-3.5 h-3.5" />
              {plagiarismResult ? 'Re-check Plagiarism' : 'Run Plagiarism Check'}
            </>
          )}
        </Button>

        {plagiarismResult && (
          <div className="flex flex-col gap-3 mt-1">
            {/* Status Feedback */}
            {plagiarismResult.status === 'no_verified_matches' ? (
              <div className="p-2.5 bg-success/10 border border-success/20 rounded flex items-start gap-2 text-xs text-success">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">No matches found within searched sources</span>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">
                    No verified matches detected in searched repositories. (Recent private or unindexed pages may not be covered.)
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-destructive/5 border border-destructive/20 rounded flex flex-col items-center">
                  <span className="text-base font-bold text-destructive">{plagiarismResult.similarityScore}%</span>
                  <span className="text-[10px] text-muted-foreground uppercase">Similarity</span>
                </div>
                <div className="p-2 bg-success/5 border border-success/20 rounded flex flex-col items-center">
                  <span className="text-base font-bold text-success">{plagiarismResult.originalityScore}%</span>
                  <span className="text-[10px] text-muted-foreground uppercase">Originality</span>
                </div>
              </div>
            )}

            {/* Breakdown details */}
            {plagiarismResult.similarityScore > 0 && (
              <div className="grid grid-cols-2 gap-1.5 text-[10px] p-2 bg-muted/20 border border-border rounded">
                <div>
                  <span className="text-muted-foreground">Exact Match: </span>
                  <span className="font-semibold text-foreground">{plagiarismResult.exactMatchScore}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Near Match: </span>
                  <span className="font-semibold text-foreground">{plagiarismResult.nearMatchScore}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Paraphrase: </span>
                  <span className="font-semibold text-foreground">{plagiarismResult.paraphraseMatchScore}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Semantic: </span>
                  <span className="font-semibold text-foreground">{plagiarismResult.semanticMatchScore}%</span>
                </div>
              </div>
            )}

            {/* Highlight Toggle */}
            {onHighlightToggle && plagiarismResult.sources.length > 0 && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-muted-foreground">Editor Overlay:</span>
                <Button
                  size="sm"
                  variant={highlightActive ? 'default' : 'outline'}
                  onClick={() => onHighlightToggle(!highlightActive)}
                  className="h-6 text-[10px] px-2 gap-1"
                >
                  <Layers className="w-3 h-3" />
                  {highlightActive ? 'Hide Match Highlights' : 'Highlight Matched Spans'}
                </Button>
              </div>
            )}

            {/* Matched Passages List */}
            {plagiarismResult.sources.flatMap((s) => s.matchedSpans).length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Matched Passages ({plagiarismResult.sources.flatMap((s) => s.matchedSpans).length})
                </span>
                <div className="max-h-36 overflow-y-auto flex flex-col gap-1.5">
                  {plagiarismResult.sources
                    .flatMap((s) => s.matchedSpans)
                    .slice(0, 5)
                    .map((span, i) => (
                      <div key={i} className="p-2 bg-warning/10 border border-warning/20 rounded text-[11px]">
                        <div className="flex items-center justify-between text-[9px] text-warning font-semibold mb-0.5">
                          <span className="capitalize">{span.matchType} Match</span>
                          <span>{Math.round(span.spanSimilarity * 100)}% Match</span>
                        </div>
                        <p className="text-foreground/80 italic line-clamp-2">"{span.submittedPassage}"</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Verified Sources List */}
            {plagiarismResult.sources.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-1 border-t border-border">
                <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground uppercase">
                  <span>Verified Sources</span>
                  <span>{plagiarismResult.sources.length} found</span>
                </div>
                <div className="max-h-36 overflow-y-auto divide-y divide-border/50 border border-border rounded bg-background/50 text-xs">
                  {plagiarismResult.sources.map((src, i) => (
                    <div key={i} className="p-2 hover:bg-muted/30 flex flex-col gap-0.5">
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-medium text-navy text-[11px] truncate flex-1" title={src.title}>
                          {src.title}
                        </span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0 bg-warning/10 text-warning shrink-0">
                          {src.matchContribution}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="truncate max-w-[60%]">{src.publisher || 'Web Reference'}</span>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline flex items-center gap-0.5 shrink-0"
                        >
                          View Source <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coverage Note */}
            <div className="p-2 bg-muted/20 border border-border/50 rounded flex items-start gap-1.5 text-[10px] text-muted-foreground">
              <Info className="w-3 h-3 text-primary shrink-0 mt-0.5" />
              <span className="text-pretty">{plagiarismResult.coverageNote}</span>
            </div>
          </div>
        )}
      </div>
    </AnalysisModule>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
