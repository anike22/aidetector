import { AnalysisModule, CheckItem, MiniScoreBar, Rec, ScoreRing } from './AnalysisShared';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type {
  OverallScores, KeywordUsageResult, SemanticKeywordsResult, SearchIntentResult,
  ReadabilityResult, SentenceAnalysisResult, ParagraphAnalysisResult,
  TransitionWordsResult, GrammarResult,
} from './analysisEngine';

// ─── Module 1 + 2: Scores Overview ──────────────────────────────────────

export function OverallScorePanel({ scores }: { scores: OverallScores }) {
  const overallColor = scores.overall >= 80 ? 'text-success' : scores.overall >= 50 ? 'text-warning' : 'text-destructive';
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <ScoreRing score={scores.overall} size={64} />
        <div className="flex-1 min-w-0">
          <div className={`text-2xl font-bold ${overallColor}`}>{scores.overall}<span className="text-sm font-normal text-muted-foreground">/100</span></div>
          <div className="text-xs text-muted-foreground">Overall SEO Score</div>
          <div className={`text-xs font-semibold mt-0.5 ${scores.readyToPublish ? 'text-success' : 'text-warning'}`}>
            {scores.readyToPublish ? '✓ Ready to Publish' : '⚠ Needs Improvement'}
          </div>
        </div>
      </div>

      <div className="pt-1 border-t border-border/50">
        <div className="text-xs font-semibold text-navy mb-2">Publishing Readiness · <span className={scores.publishingScore >= 70 ? 'text-success' : 'text-warning'}>{scores.publishingScore}/100</span></div>
        <div className="flex flex-col gap-1.5">
          <MiniScoreBar score={scores.seo} label="SEO (25%)" />
          <MiniScoreBar score={scores.readability} label="Readability (20%)" />
          <MiniScoreBar score={scores.grammar} label="Grammar (15%)" />
          <MiniScoreBar score={scores.eeat} label="EEAT (20%)" />
          <MiniScoreBar score={scores.structure} label="Structure (10%)" />
          <MiniScoreBar score={scores.engagement} label="Engagement (10%)" />
        </div>
      </div>
    </div>
  );
}

// ─── Module 3: Keyword Usage ─────────────────────────────────────────────

export function KeywordUsagePanel({ result, keyword, onKeywordChange }: {
  result: KeywordUsageResult;
  keyword: string;
  onKeywordChange: (v: string) => void;
}) {
  const densityColor = result.density >= 0.8 && result.density <= 1.5 ? 'text-success' : result.density < 0.8 ? 'text-warning' : 'text-destructive';
  const score = result.density >= 0.8 && result.density <= 1.5 ? 90 :
    result.density < 0.8 ? Math.round(result.density / 0.8 * 60) : Math.max(20, 100 - (result.density - 1.5) * 60);

  return (
    <AnalysisModule title="Keyword Usage" score={score}>
      <input
        type="text"
        value={keyword}
        onChange={(e) => onKeywordChange(e.target.value)}
        placeholder="Enter primary keyword…"
        className="w-full h-7 px-2 text-xs border border-border rounded bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
      />
      {keyword && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Density</span>
            <span className={`text-xs font-bold ${densityColor}`}>{result.density}% ({result.count}×)</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <CheckItem ok={result.inH1} label="In H1" />
            <CheckItem ok={result.inIntro} label="In Intro" />
            <CheckItem ok={result.inHeadings} label="In Headings" />
            <CheckItem ok={result.inConclusion} label="In Conclusion" />
          </div>
          <ul className="flex flex-col gap-0.5 mt-1">
            {result.recommendations.map((r, i) => <Rec key={i} text={r} />)}
          </ul>
        </div>
      )}
    </AnalysisModule>
  );
}

// ─── Module 4: Semantic Keywords ─────────────────────────────────────────

export function SemanticKeywordsPanel({ result }: { result: SemanticKeywordsResult }) {
  const score = result.coveragePercent;
  return (
    <AnalysisModule title="Semantic Keywords" score={score} defaultOpen={false}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">Coverage</span>
        <span className={`text-xs font-bold ${score >= 50 ? 'text-success' : 'text-warning'}`}>{score}%</span>
      </div>
      <div className="flex flex-col gap-1">
        {result.recommended.slice(0, 8).map((term) => {
          const found = result.found.includes(term);
          return (
            <div key={term} className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold shrink-0 ${found ? 'text-success' : 'text-muted-foreground/40'}`}>{found ? '✓' : '✗'}</span>
              <span className={`text-xs ${found ? 'text-foreground/80' : 'text-muted-foreground/60'}`}>{term}</span>
            </div>
          );
        })}
      </div>
      {result.missing.length > 0 && (
        <p className="text-xs text-muted-foreground mt-1 text-pretty">
          <span className="text-primary">→</span> Add missing terms: "{result.missing.slice(0, 3).join('", "')}"
        </p>
      )}
    </AnalysisModule>
  );
}

// ─── Module 5: Search Intent ─────────────────────────────────────────────

export function SearchIntentPanel({ result }: { result: SearchIntentResult }) {
  const score = result.matchPercent;
  const intents = [
    { key: 'informational', label: 'Informational', value: result.informational },
    { key: 'commercial', label: 'Commercial', value: result.commercial },
    { key: 'transactional', label: 'Transactional', value: result.transactional },
    { key: 'navigational', label: 'Navigational', value: result.navigational },
  ];
  return (
    <AnalysisModule title="Search Intent Match" score={score} defaultOpen={false}>
      <div className="flex flex-col gap-1.5">
        {intents.map((i) => (
          <div key={i.key} className="flex items-center gap-2">
            <span className={`text-xs w-24 shrink-0 ${i.key === result.dominant ? 'font-semibold text-navy' : 'text-muted-foreground'}`}>{i.label}</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden min-w-0">
              <div className={`h-1.5 rounded-full transition-all ${i.key === result.dominant ? 'bg-primary' : 'bg-muted-foreground/30'}`} style={{ width: `${i.value}%` }} />
            </div>
            <span className="text-xs text-muted-foreground w-8 text-right shrink-0">{i.value}%</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-1 text-pretty"><span className="text-primary">→</span> {result.recommendation}</p>
    </AnalysisModule>
  );
}

// ─── Module 6: Readability ────────────────────────────────────────────────

export function ReadabilityPanel({ result }: { result: ReadabilityResult }) {
  const labelColor = result.label === 'Excellent' ? 'text-success' : result.label === 'Good' ? 'text-success' : result.label === 'Average' ? 'text-warning' : 'text-destructive';
  const score = Math.min(100, result.score);
  return (
    <AnalysisModule title="Readability" score={score}>
      <div className="flex items-center gap-3">
        <ScoreRing score={score} size={44} />
        <div>
          <div className={`text-sm font-bold ${labelColor}`}>{result.label}</div>
          <div className="text-xs text-muted-foreground">Flesch Reading Ease</div>
          <div className="text-xs text-muted-foreground">Target: 60–80</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-1">
        <div className="text-center p-2 bg-muted/30 rounded">
          <div className="text-sm font-bold text-navy">{result.avgWordsPerSentence}</div>
          <div className="text-[10px] text-muted-foreground">Avg words/sentence</div>
        </div>
        <div className="text-center p-2 bg-muted/30 rounded">
          <div className="text-sm font-bold text-navy">{result.avgSyllablesPerWord}</div>
          <div className="text-[10px] text-muted-foreground">Avg syllables/word</div>
        </div>
      </div>
    </AnalysisModule>
  );
}

// ─── Module 7: Sentence Analysis ─────────────────────────────────────────

export function SentenceAnalysisPanel({ result }: { result: SentenceAnalysisResult }) {
  const score = Math.max(0, 100 - result.longSentenceCount * 5 - (result.veryLongSentences?.length || 0) * 10 - result.passiveVoiceCount * 5);
  return (
    <AnalysisModule title="Sentence Analysis" score={score} defaultOpen={false}>
      <div className="grid grid-cols-4 gap-1.5 mb-2">
        {[
          { label: 'Total', val: result.totalSentences },
          { label: 'Long (21-25w)', val: result.longSentenceCount },
          { label: 'Too Long (26+w)', val: result.veryLongSentences?.length || 0, color: 'text-destructive' },
          { label: 'Passive', val: result.passiveVoiceCount },
        ].map((s) => (
          <div key={s.label} className="text-center p-2 bg-muted/30 rounded">
            <div className={`text-sm font-bold ${s.color || (s.val > 3 && s.label !== 'Total' ? 'text-warning' : 'text-navy')}`}>{s.val}</div>
            <div className="text-[10px] text-muted-foreground leading-tight">{s.label}</div>
          </div>
        ))}
      </div>
      <ul className="flex flex-col gap-0.5">
        {result.recommendations.map((r, i) => <Rec key={i} text={r} />)}
      </ul>
    </AnalysisModule>
  );
}

// ─── Module 8: Paragraph Analysis ────────────────────────────────────────

export function ParagraphAnalysisPanel({ result }: { result: ParagraphAnalysisResult }) {
  const score = Math.max(0, 100 - result.longParagraphCount * 10 - (result.veryLongParagraphCount || 0) * 20);
  return (
    <AnalysisModule title="Paragraph Length" score={score} defaultOpen={false}>
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        <div className="text-center p-2 bg-muted/30 rounded">
          <div className="text-sm font-bold text-navy">{result.totalParagraphs}</div>
          <div className="text-[10px] text-muted-foreground">Total</div>
        </div>
        <div className="text-center p-2 bg-muted/30 rounded">
          <div className={`text-sm font-bold ${result.longParagraphCount > 0 ? 'text-warning' : 'text-success'}`}>{result.longParagraphCount}</div>
          <div className="text-[10px] text-muted-foreground">Long (121-200w)</div>
        </div>
        <div className="text-center p-2 bg-muted/30 rounded">
          <div className={`text-sm font-bold ${result.veryLongParagraphCount > 0 ? 'text-destructive' : 'text-success'}`}>{result.veryLongParagraphCount || 0}</div>
          <div className="text-[10px] text-muted-foreground">Too long (201+w)</div>
        </div>
      </div>
      <ul className="flex flex-col gap-0.5">
        {result.recommendations.map((r, i) => <Rec key={i} text={r} />)}
      </ul>
    </AnalysisModule>
  );
}

// ─── Module 9: Transition Words ───────────────────────────────────────────

export function TransitionWordsPanel({ result }: { result: TransitionWordsResult }) {
  const score = Math.min(100, Math.round((result.percentage / 25) * 100));
  return (
    <AnalysisModule title="Transition Words" score={score} defaultOpen={false}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">Usage</span>
        <span className={`text-xs font-bold ${result.percentage >= 25 ? 'text-success' : 'text-warning'}`}>
          {result.percentage}% <span className="text-muted-foreground font-normal">(target 25%+)</span>
        </span>
      </div>
      
      {result.found.length > 0 && (
        <div className="mb-2">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Found in text</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {result.found.slice(0, 6).map((w) => (
              <span key={w} className="text-[10px] px-1.5 py-0.5 bg-success/10 border border-success/20 text-success rounded-full">{w}</span>
            ))}
          </div>
        </div>
      )}

      {result.missing && result.missing.length > 0 && result.percentage < 25 && (
        <div className="mb-2 p-2 bg-muted/20 border border-border rounded">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Missing Suggestions</div>
          <div className="flex flex-wrap gap-1">
            {result.missing.map((w, i) => (
              <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 bg-background">{w}</Badge>
            ))}
          </div>
        </div>
      )}

      <ul className="flex flex-col gap-0.5">
        {result.recommendations.map((r, i) => <Rec key={i} text={r} />)}
      </ul>
    </AnalysisModule>
  );
}

// ─── Module 10: Grammar ────────────────────────────────────────────────────

export function GrammarPanel({ 
  result, 
  onFix,
  fixing
}: { 
  result: GrammarResult; 
  onFix?: () => void;
  fixing?: boolean;
}) {
  return (
    <AnalysisModule title="Grammar & Spacing" score={result.score}>
      <div className="mb-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onFix}
          disabled={fixing}
          className="w-full text-xs h-7 border-primary/20 text-primary hover:bg-primary/5 gap-1.5"
        >
          {fixing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          {fixing ? 'Analyzing...' : 'Identify AI Suggestions'}
        </Button>
      </div>

      {result.issues.length === 0 ? (
        <p className="text-xs text-success">No grammar or spacing issues detected.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {result.issues.slice(0, 5).map((issue, i) => (
            <div key={i} className="flex items-start gap-2 p-2 bg-warning/5 border border-warning/20 rounded">
              <span className="text-[10px] font-semibold text-warning shrink-0 mt-0.5">{issue.type}</span>
              <div className="min-w-0">
                <div className="text-xs text-foreground/80 font-mono truncate">"{issue.text}"</div>
                <div className="text-xs text-muted-foreground text-pretty">{issue.suggestion}</div>
              </div>
            </div>
          ))}
          {result.issues.length > 5 && (
            <div className="text-center text-xs text-muted-foreground pt-1 border-t border-border mt-1">
              +{result.issues.length - 5} more issues detected
            </div>
          )}
        </div>
      )}
    </AnalysisModule>
  );
}
