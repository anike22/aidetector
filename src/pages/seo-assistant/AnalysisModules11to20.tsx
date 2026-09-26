import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Check, Loader2, Globe, Sparkles, FileText, Award, ShieldCheck, ChevronLeft, ChevronRight, ChevronDown, X, Search, RefreshCw, Link2, ExternalLink, AlertCircle, CheckCircle2, Info, BookmarkCheck, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { AnalysisModule, CheckItem, Rec } from './AnalysisShared';
import { GoogleSERPPreview } from '@/components/seo-assistant/GoogleSERPPreview';
import { toast } from 'sonner';
import type { DiscoveredInternalLink } from '@/lib/seo/internalLinkDiscovery';
import { saveDomainToActiveSEOProject } from '@/lib/seo/domainPrefill';
import type {
  HeadingStructureResult, EEATResult, EEATOpportunity, EEATEvidenceStatus, EngagementResult,
  SnippetResult, MetaResult, AIRiskResult, UniquenessResult,
} from './analysisEngine';
import type { CompetitorResult, ContentGapResult } from './analysisEngine';
import type { BalancedDetectorResult } from '@/lib/detection/balancedDetectorService';
import type { PlagiarismAnalysisResult } from '@/pages/detector/detectionEngine';
import type { RegisterResult } from '@/lib/verifiedAuthorship/authorshipService';

export function CompetitorIntelligencePanel({ 
  competitors, 
  contentGap,
  onAnalyze,
  loading,
  keyword,
  content = '',
  onInsertKeyword,
}: { 
  competitors: CompetitorResult[]; 
  contentGap: ContentGapResult | null;
  onAnalyze: () => void;
  loading: boolean;
  keyword: string;
  content?: string;
  onInsertKeyword?: (kw: string) => void;
}) {
  const coveragePercent = contentGap?.coveragePercent ?? (
    contentGap?.competitorKeywords?.length 
      ? Math.round((contentGap.competitorKeywords.filter(k => k.foundInPost).length / contentGap.competitorKeywords.length) * 100)
      : (competitors.length > 0 ? 100 : 0)
  );

  const coveredKeywords = contentGap?.competitorKeywords?.filter(k => k.foundInPost) || [];
  const missingKeywords = contentGap?.competitorKeywords?.filter(k => !k.foundInPost) || (contentGap?.missingKeywords?.map(kw => ({ keyword: kw, foundInPost: false, frequencyInPost: 0 })) || []);

  return (
    <AnalysisModule 
      title="Content Gap & Competitor Keywords" 
      score={coveragePercent} 
      scoreLabel={contentGap?.totalCompetitorKeywords ? `${contentGap.coveredCount || 0}/${contentGap.totalCompetitorKeywords} Covered` : undefined}
      defaultOpen={false}
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground text-pretty leading-relaxed">
          Benchmark this post against top 5 Google search competitor pages to reveal ranking keyword coverage and topic gaps.
        </p>

        <Button 
          variant="outline"
          size="sm" 
          onClick={onAnalyze} 
          disabled={loading || !keyword.trim()}
          className="w-full text-xs h-8 border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 gap-1.5 font-medium"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          {loading ? 'Checking Competitor Coverage...' : 'Check Content Gap & Competitor Keyword Coverage'}
        </Button>

        {/* Coverage Score Metric */}
        {contentGap && (contentGap.totalCompetitorKeywords !== undefined || contentGap.coveragePercent !== undefined) && (
          <div className="p-2.5 bg-muted/30 border border-border rounded flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Competitor Keyword Coverage</span>
              <span className={cn(
                "font-bold text-xs",
                (contentGap.coveragePercent || 0) >= 70 ? "text-success" : (contentGap.coveragePercent || 0) >= 40 ? "text-warning" : "text-destructive"
              )}>
                {contentGap.coveragePercent || 0}%
              </span>
            </div>
            <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-300 rounded-full",
                  (contentGap.coveragePercent || 0) >= 70 ? "bg-success" : (contentGap.coveragePercent || 0) >= 40 ? "bg-warning" : "bg-destructive"
                )}
                style={{ width: `${Math.min(100, Math.max(0, contentGap.coveragePercent || 0))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{contentGap.coveredCount || 0} of {contentGap.totalCompetitorKeywords || 0} competitor keywords in this post</span>
              <span>Target: 70%+</span>
            </div>
          </div>
        )}

        {/* Missing Competitor Keywords / Opportunities */}
        {missingKeywords.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] font-semibold text-destructive uppercase flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-destructive" /> Missing Competitor Keywords ({missingKeywords.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {missingKeywords.map((item, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-destructive/20 bg-destructive/5 text-destructive font-medium"
                >
                  <span>{item.keyword}</span>
                  {onInsertKeyword && (
                    <button
                      type="button"
                      onClick={() => onInsertKeyword(item.keyword)}
                      className="p-0.5 hover:bg-destructive/10 rounded transition-colors"
                      title="Insert into post content"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Covered Competitor Keywords */}
        {coveredKeywords.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="text-[10px] font-semibold text-success uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-success" /> Covered in this Post ({coveredKeywords.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {coveredKeywords.map((item, i) => (
                <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 bg-success/5 border-success/30 text-success gap-1">
                  <Check className="w-2.5 h-2.5" />
                  <span>{item.keyword}</span>
                  <span className="opacity-70 text-[9px]">({item.frequencyInPost}x)</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Top Ranking Competitors */}
        {competitors.length > 0 && (
          <div className="mt-1 flex flex-col gap-2">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase">Top Ranking Competitor Pages</div>
            {competitors.map((comp, i) => (
              <div key={i} className="p-2 bg-muted/20 border border-border rounded flex flex-col gap-1">
                <div className="text-xs font-medium text-navy truncate">{comp.title}</div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="truncate flex-1 max-w-[70%] font-mono text-primary/70">{comp.url}</span>
                  <span className="shrink-0 font-medium">{comp.wordCount} words</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Suggested Headings & FAQs */}
        {contentGap && (contentGap.missingHeadings?.length > 0 || (contentGap.missingFAQs && contentGap.missingFAQs.length > 0)) && (
          <div className="mt-2 flex flex-col gap-2 pt-2 border-t border-border">
            {contentGap.missingHeadings && contentGap.missingHeadings.length > 0 && (
              <div>
                <div className="text-[10px] text-muted-foreground font-semibold mb-1">Suggested Competitor Headings</div>
                <ul className="text-[11px] text-foreground/80 list-disc pl-3.5 flex flex-col gap-1">
                  {contentGap.missingHeadings.map((hd, i) => (
                    <li key={i}>{hd}</li>
                  ))}
                </ul>
              </div>
            )}
            {contentGap.missingFAQs && contentGap.missingFAQs.length > 0 && (
              <div className="mt-1">
                <div className="text-[10px] text-muted-foreground font-semibold mb-1">Suggested Competitor FAQs</div>
                <ul className="text-[11px] text-foreground/80 list-disc pl-3.5 flex flex-col gap-1">
                  {contentGap.missingFAQs.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </AnalysisModule>
  );
}

// ─── Module 11: Heading Structure ────────────────────────────────────────

export function HeadingStructurePanel({ 
  result,
  onNavigateIssue
}: { 
  result: HeadingStructureResult;
  onNavigateIssue?: (location: any) => void;
}) {
  return (
    <AnalysisModule title="Heading Structure" score={result.score}>
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        {[
          { label: 'H1 (Optional)', count: result.h1Count, ok: result.h1Count <= 1 },
          { label: 'H2', count: result.h2Count, ok: result.h2Count >= 2 },
          { label: 'H3', count: result.h3Count, ok: result.h3Count >= 1 },
        ].map((h) => (
          <div key={h.label} className={`text-center p-2 rounded border ${h.ok ? 'bg-success/5 border-success/20' : 'bg-muted/30 border-border'}`}>
            <div className={`text-sm font-bold ${h.ok ? 'text-success' : h.count === 0 ? 'text-muted-foreground' : 'text-warning'}`}>{h.count}</div>
            <div className="text-[10px] text-muted-foreground">{h.label}</div>
          </div>
        ))}
      </div>
      {result.headings.length > 0 && (
        <div className="flex flex-col gap-1 mb-2">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase">Article Headings (click to jump)</div>
          {result.headings.slice(0, 8).map((h, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onNavigateIssue?.({
                type: 'heading',
                text: h.text,
                start: h.start,
                end: h.end,
                headingLevel: h.level,
                severity: 'info'
              })}
              className="text-left flex items-center gap-1.5 p-1 rounded hover:bg-muted/40 transition-colors cursor-pointer group"
            >
              <span className="text-[10px] font-bold text-primary shrink-0">H{h.level}</span>
              <span className="text-xs text-foreground/80 truncate flex-1 group-hover:text-primary">{h.text}</span>
            </button>
          ))}
        </div>
      )}
      {result.issues.length > 0 && (
        <ul className="flex flex-col gap-0.5 mt-1">
          {result.issues.map((issue, i) => <Rec key={i} text={issue} />)}
        </ul>
      )}
    </AnalysisModule>
  );
}

// ─── Module 12: EEAT Analysis ─────────────────────────────────────────────

export function EEATPanel({ 
  result,
  content = '',
  keyword = '',
  onInsertHook,
  onNavigateLocation
}: { 
  result: EEATResult;
  content?: string;
  keyword?: string;
  onInsertHook?: (text: string, target?: 'intro' | 'after_h1' | 'end' | 'cursor') => void;
  onNavigateLocation?: (target: any) => void;
}) {
  const [selectedHook, setSelectedHook] = useState<{ title: string; text: string; target: 'intro' | 'after_h1' | 'end' | 'cursor' } | null>(null);
  
  // Intelligent Personal Experience Opportunity
  const [personalExpOpen, setPersonalExpOpen] = useState(false);
  const [customExpText, setCustomExpText] = useState('');
  const [isEditingExp, setIsEditingExp] = useState(false);
  const [expNoticeDismissed, setExpNoticeDismissed] = useState(false);

  // Derive dynamic, content-aware angle based on content & keyword
  const getPersonalExperienceAngle = () => {
    const kw = keyword.trim() || 'this topic';
    const hasAIContext = /ai|detection|detector|gpt|chatgpt|model/i.test(content + ' ' + kw);
    const hasSEOContext = /seo|ranking|traffic|google|keyword|backlink/i.test(content + ' ' + kw);

    if (hasAIContext) {
      return {
        title: 'Suggested personal-experience angle',
        explanation: 'This section would be stronger with a real comparison from your own testing. You could describe a passage you tested across two or more tools, the different scores or outcomes you received, and what you learned from comparing their granular results.',
        locationText: 'After your introductory problem statement or testing methodology section.',
        target: 'after_h1' as const,
        framework: `> **Author's Practical Note & Field Testing:**\n> In our hands-on evaluation of ${kw}, we observed specific edge cases that standard automated checks often misinterpret. When comparing results across multiple iterations, the most reliable signal came from structured validation rather than isolated indicators. *(Adapt with your actual testing details)*`,
      };
    }

    if (hasSEOContext) {
      return {
        title: 'Suggested personal-experience angle',
        explanation: 'This section would benefit from a first-hand implementation milestone or observation. Describe a live test where applying this specific guideline influenced content clarity or search indexing.',
        locationText: 'Immediately following the primary guideline heading or key takeaway.',
        target: 'after_h1' as const,
        framework: `> **Field Note & Implementation Experience:**\n> When auditing content around ${kw}, we noticed a significant improvement in reader retention once concrete milestone data was incorporated. *(Adapt with your real findings)*`,
      };
    }

    return {
      title: 'Suggested personal-experience angle',
      explanation: `This passage would be significantly more authoritative with a genuine author experience or test scenario regarding ${kw}. Explain the practical trade-offs you encountered when putting this advice into practice.`,
      locationText: 'Under the key insight section or before the conclusion.',
      target: 'after_h1' as const,
      framework: `> **Hands-On Experience:**\n> While applying these principles to ${kw}, the primary takeaway from real-world execution was that clear, verifiable evidence always outperforms theoretical explanations. *(Adapt with your real experience)*`,
    };
  };

  const expAngle = getPersonalExperienceAngle();

  const handleGenerateFramework = () => {
    setCustomExpText(expAngle.framework);
    setIsEditingExp(false);
  };

  const dynamicOpportunities: EEATOpportunity[] = result.opportunities || [];
  const [selectedOpp, setSelectedOpp] = useState<EEATOpportunity | null>(null);
  const [editingOppId, setEditingOppId] = useState<string | null>(null);
  const [editedOppText, setEditedOppText] = useState<string>('');

  return (
    <AnalysisModule title="EEAT Analysis" score={result.score}>
      <div className="grid grid-cols-2 gap-1 mb-2">
        <CheckItem ok={result.hasPersonalExamples} label="Personal examples" />
        <CheckItem ok={result.hasStats} label="Stats & data" />
        <CheckItem ok={result.hasCitations} label="Citations" />
        <CheckItem ok={result.hasAuthor} label="Author attribution" />
      </div>

      {/* Strengthen Personal Experience Action Card */}
      <div className="mb-2 p-2 bg-muted/20 border border-border rounded flex flex-col gap-2">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-[11px] font-semibold text-foreground">Strengthen Personal Experience</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setPersonalExpOpen(!personalExpOpen);
              if (!customExpText) setCustomExpText(expAngle.framework);
            }}
            className="h-5 text-[10px] px-2 text-primary hover:bg-primary/10"
          >
            {personalExpOpen ? 'Close' : 'View Angle'}
          </Button>
        </div>

        {personalExpOpen && (
          <div className="flex flex-col gap-2 pt-1 border-t border-border/60">
            <div>
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">{expAngle.title}</span>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed text-pretty">
                "{expAngle.explanation}"
              </p>
            </div>

            <div className="text-[10px] bg-background/80 p-1.5 rounded border border-border/50">
              <span className="font-medium text-foreground">Suggested Location:</span>{' '}
              <span className="text-muted-foreground">{expAngle.locationText}</span>
            </div>

            {/* Anti-fabrication ethical notice */}
            {!expNoticeDismissed && (
              <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] text-amber-600 dark:text-amber-400 leading-tight flex items-start justify-between gap-1">
                <span>
                  <strong>Notice:</strong> Adapt this suggestion using your real experience. Do not include events, tests, credentials, results or statistics that did not actually happen.
                </span>
                <button onClick={() => setExpNoticeDismissed(true)} className="text-muted-foreground hover:text-foreground shrink-0 p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Editable Framework Draft */}
            {isEditingExp ? (
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-semibold text-foreground">Edit Framework Before Inserting:</span>
                <textarea
                  value={customExpText}
                  onChange={(e) => setCustomExpText(e.target.value)}
                  rows={4}
                  className="w-full text-[10px] font-mono p-1.5 border border-border rounded bg-background text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
            ) : customExpText ? (
              <div className="p-1.5 bg-background border border-border rounded text-[10px]">
                <span className="font-semibold text-foreground block mb-0.5">Draft Framework:</span>
                <p className="text-muted-foreground font-mono text-[9px] whitespace-pre-wrap">{customExpText}</p>
              </div>
            ) : null}

            {/* Action buttons */}
            <div className="flex items-center flex-wrap gap-1 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (onNavigateLocation) {
                    onNavigateLocation({
                      type: 'eeat_opportunity',
                      text: content.slice(0, 120),
                      start: 0,
                      end: Math.min(120, content.length),
                      severity: 'info'
                    });
                  }
                  toast.info('Navigated to suggested location in editor');
                }}
                className="h-6 text-[9px] px-2"
              >
                Go to Location
              </Button>

              {!customExpText && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateFramework}
                  className="h-6 text-[9px] px-2 text-primary border-primary/30"
                >
                  Generate Draft Framework
                </Button>
              )}

              {customExpText && !isEditingExp && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingExp(true)}
                  className="h-6 text-[9px] px-2"
                >
                  Edit
                </Button>
              )}

              {customExpText && isEditingExp && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingExp(false)}
                  className="h-6 text-[9px] px-2"
                >
                  Done Editing
                </Button>
              )}

              {customExpText && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleGenerateFramework();
                    toast.info('Regenerated draft framework');
                  }}
                  className="h-6 text-[9px] px-1.5 text-muted-foreground"
                  title="Regenerate framework"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                </Button>
              )}

              {customExpText && onInsertHook && (
                <Button
                  size="sm"
                  onClick={() => {
                    onInsertHook(customExpText, expAngle.target);
                    toast.success('Inserted personal experience framework!');
                  }}
                  className="h-6 text-[9px] px-2.5 bg-primary text-primary-foreground font-medium ml-auto"
                >
                  Insert
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4-Dimension E-E-A-T Health Overview */}
      {result.dimensions && (
        <div className="mb-2 p-2 bg-muted/30 border border-border rounded flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-foreground uppercase tracking-wide">E-E-A-T Gap Analysis</span>
            {result.articleType && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 capitalize font-mono">
                {result.articleType}
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="p-1 bg-background/80 rounded border border-border/60">
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Experience:</span>
                <span className={cn(result.dimensions.experience.score >= 60 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600 dark:text-amber-400')}>
                  {result.dimensions.experience.score}%
                </span>
              </div>
            </div>
            <div className="p-1 bg-background/80 rounded border border-border/60">
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Expertise:</span>
                <span className={cn(result.dimensions.expertise.score >= 60 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600 dark:text-amber-400')}>
                  {result.dimensions.expertise.score}%
                </span>
              </div>
            </div>
            <div className="p-1 bg-background/80 rounded border border-border/60">
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Authority:</span>
                <span className={cn(result.dimensions.authoritativeness.score >= 60 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600 dark:text-amber-400')}>
                  {result.dimensions.authoritativeness.score}%
                </span>
              </div>
            </div>
            <div className="p-1 bg-background/80 rounded border border-border/60">
              <div className="flex justify-between font-medium">
                <span className="text-muted-foreground">Trust:</span>
                <span className={cn(result.dimensions.trust.score >= 60 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600 dark:text-amber-400')}>
                  {result.dimensions.trust.score}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Contextual EEAT Opportunities */}
      {dynamicOpportunities.length > 0 && onInsertHook && (
        <div className="mb-2 p-2 bg-primary/5 border border-primary/20 rounded flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-semibold text-primary uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" /> Contextual E-E-A-T Opportunities
            </div>
            <span className="text-[9px] text-muted-foreground font-mono">
              {dynamicOpportunities.length} {dynamicOpportunities.length === 1 ? 'action' : 'actions'} identified
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Targeted evidence enhancements based on your article content, claims, and search intent:
          </p>

          <div className="flex flex-col gap-1.5 mt-0.5">
            {dynamicOpportunities.map((opp) => {
              const isSelected = selectedOpp?.id === opp.id;
              const isEditing = editingOppId === opp.id;
              const displayText = isEditing ? editedOppText : opp.suggestedText;

              const statusBadgeConfig: Record<
                EEATEvidenceStatus,
                { label: string; className: string; icon: any }
              > = {
                ready_to_insert: {
                  label: 'Ready to Insert',
                  className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
                  icon: CheckCircle2,
                },
                author_input_required: {
                  label: 'Author Input Required',
                  className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
                  icon: AlertCircle,
                },
                source_required: {
                  label: 'Source Required',
                  className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
                  icon: ExternalLink,
                },
                review_required: {
                  label: 'Review Required',
                  className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
                  icon: Info,
                },
              };

              const statusCfg = statusBadgeConfig[opp.evidenceStatus];
              const StatusIcon = statusCfg.icon;

              return (
                <div
                  key={opp.id}
                  className={cn(
                    'p-2 bg-background border rounded flex flex-col gap-1.5 transition-colors',
                    isSelected ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border'
                  )}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] font-semibold text-foreground truncate">
                          {opp.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn('text-[8.5px] px-1 py-0 h-3.5 border font-medium flex items-center gap-0.5', statusCfg.className)}
                        >
                          <StatusIcon className="w-2 h-2" />
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <span className="text-[9px] text-muted-foreground leading-tight text-pretty">
                        {opp.reason}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      {opp.targetPassage && onNavigateLocation && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            onNavigateLocation({
                              type: 'eeat_claim',
                              text: opp.targetPassage,
                              start: opp.targetStartOffset,
                              end: opp.targetEndOffset,
                              severity: 'warning',
                            });
                            toast.info('Navigated to claim passage in editor');
                          }}
                          className="h-5 text-[9px] px-1.5 text-muted-foreground hover:text-foreground"
                          title="Locate claim in editor"
                        >
                          Locate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedOpp(null);
                            setEditingOppId(null);
                          } else {
                            setSelectedOpp(opp);
                            setEditingOppId(null);
                          }
                        }}
                        className="h-5 text-[9px] px-1.5 text-muted-foreground hover:text-foreground"
                      >
                        {isSelected ? 'Hide' : 'Preview'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          const textToInsert = isEditing ? editedOppText : opp.suggestedText;
                          const target = (opp.targetSection === 'cursor' || opp.targetSection === 'intro' || opp.targetSection === 'after_h1' || opp.targetSection === 'end')
                            ? opp.targetSection
                            : 'after_h1';
                          onInsertHook(textToInsert, target);
                          toast.success(`Inserted ${opp.title} into article!`);
                        }}
                        className="h-5 text-[9px] px-2 bg-primary text-primary-foreground font-medium"
                      >
                        Insert
                      </Button>
                    </div>
                  </div>

                  {opp.targetPassage && (
                    <div className="text-[9px] bg-muted/30 px-1.5 py-1 rounded border border-border/40 font-mono text-muted-foreground">
                      <span className="font-semibold text-foreground">Passage: </span>
                      "{opp.targetPassage.length > 90 ? `${opp.targetPassage.slice(0, 90)}...` : opp.targetPassage}"
                    </div>
                  )}

                  {isSelected && (
                    <div className="p-2 bg-muted/40 border border-border rounded text-[10px] flex flex-col gap-1.5 mt-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          Contextual Snippet ({opp.targetSection}):
                        </span>
                        {!isEditing ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingOppId(opp.id);
                              setEditedOppText(opp.suggestedText);
                            }}
                            className="h-4 text-[9px] px-1.5 text-primary hover:bg-primary/10"
                          >
                            Edit Real Evidence
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingOppId(null)}
                            className="h-4 text-[9px] px-1.5 text-muted-foreground hover:text-foreground"
                          >
                            Done Editing
                          </Button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="flex flex-col gap-1">
                          <textarea
                            value={editedOppText}
                            onChange={(e) => setEditedOppText(e.target.value)}
                            rows={3}
                            className="w-full text-[9px] font-mono p-1.5 border border-border rounded bg-background text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/40"
                            placeholder="Enter your genuine first-hand evidence, benchmark source, or credential..."
                          />
                          <span className="text-[8.5px] text-muted-foreground italic">
                            * Tip: Ensure this reflects your real testing, credentials, or actual source URLs.
                          </span>
                        </div>
                      ) : (
                        <p className="text-muted-foreground font-mono text-[9px] italic whitespace-pre-wrap bg-background/60 p-1 rounded border border-border/40">
                          {displayText}
                        </p>
                      )}

                      {opp.evidenceStatus !== 'ready_to_insert' && (
                        <div className="p-1 bg-amber-500/10 border border-amber-500/20 rounded text-[8.5px] text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                          <span>
                            <strong>Non-fabrication notice:</strong> Adapt with genuine evidence. Do not publish unverified benchmarks or fake credentials.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* If no opportunities exist and score is high */}
      {dynamicOpportunities.length === 0 && result.score >= 75 && (
        <div className="mb-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          <span>Strong E-E-A-T signals validated — all key evidence dimensions adequately covered.</span>
        </div>
      )}

      <ul className="flex flex-col gap-0.5 mt-1">
        {result.recommendations.map((r, i) => <Rec key={i} text={r} />)}
      </ul>
    </AnalysisModule>
  );
}

// ─── Module 13: Engagement Analysis ──────────────────────────────────────

export function EngagementPanel({ 
  result,
  content = '',
  keyword = '',
  onInsertHook,
  onNavigateLocation
}: { 
  result: EngagementResult;
  content?: string;
  keyword?: string;
  onInsertHook?: (text: string, target?: 'intro' | 'after_h1' | 'end' | 'cursor') => void;
  onNavigateLocation?: (target: any) => void;
}) {
  const [questionPanelOpen, setQuestionPanelOpen] = useState(false);
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);

  // Generate content-specific rhetorical question and insertion location metadata
  const getSuggestedRhetoricalQuestion = () => {
    const kw = keyword.trim() || 'this approach';
    const hasAIContext = /ai|detection|detector|gpt|false positive/i.test(content + ' ' + kw);
    const hasSEOContext = /seo|ranking|traffic|algorithm|optimization/i.test(content + ' ' + kw);

    if (hasAIContext) {
      return {
        question: `If two AI detectors analyze the exact same paragraph and return completely different probabilities, which result should an editor actually trust?`,
        reason: 'This section contains technical explanations without a reader-engagement transition.',
        locationName: 'Before the detailed mechanism comparison section',
        target: 'cursor' as const,
        contextHeading: 'AI Detection Consistency',
      };
    }

    if (hasSEOContext) {
      return {
        question: `What happens when an article follows every standard optimization rule, yet continues to lose search visibility?`,
        reason: 'Presents a compelling dilemma to hook reader interest before presenting solutions.',
        locationName: 'Between the initial problem overview and your core solution framework',
        target: 'cursor' as const,
        contextHeading: 'SEO Problem & Solution',
      };
    }

    return {
      question: `How can writers and publishers maintain peak content quality when production speed demands keep escalating?`,
      reason: 'Connects the theoretical guide with the reader’s immediate everyday operational challenge.',
      locationName: 'Directly before the first actionable takeaway section',
      target: 'cursor' as const,
      contextHeading: 'Reader Challenges',
    };
  };

  const currentSuggestion = getSuggestedRhetoricalQuestion();

  const handleOpenQuestionSuggestion = () => {
    setQuestionPanelOpen(true);
    setCustomQuestionText(currentSuggestion.question);
    setIsEditingQuestion(false);
  };

  const engagementHooks = [
    {
      title: 'Rhetorical Question Hook',
      show: result.questionCount === 0,
      text: currentSuggestion.question,
    },
    {
      title: 'Concrete Scenario Example',
      show: result.exampleCount === 0,
      text: 'For example, consider a production deployment scenario where automated checks flag discrepancies before publication.',
    },
    {
      title: 'Data-Backed Milestone Point',
      show: result.dataCount === 0,
      text: 'Recent comparative research shows an average 42% decrease in bounce rates when articles integrate structured breakdown points.',
    },
  ];

  const availableHooks = engagementHooks.filter(h => h.show);

  return (
    <AnalysisModule title="Engagement" score={result.score} defaultOpen={false}>
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        {[
          { label: 'Questions', val: result.questionCount },
          { label: 'Examples', val: result.exampleCount },
          { label: 'Data points', val: result.dataCount },
        ].map((s) => (
          <div key={s.label} className="text-center p-2 bg-muted/30 rounded">
            <div className={`text-sm font-bold ${s.val > 0 ? 'text-navy' : 'text-muted-foreground/50'}`}>{s.val}</div>
            <div className="text-[10px] text-muted-foreground leading-tight">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Suggest Rhetorical Question Action Card */}
      <div className="mb-2 p-2 bg-muted/20 border border-border rounded flex flex-col gap-2">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-warning shrink-0" />
            <span className="text-[11px] font-semibold text-foreground">Suggest Rhetorical Question</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (!questionPanelOpen) {
                handleOpenQuestionSuggestion();
              } else {
                setQuestionPanelOpen(false);
              }
            }}
            className="h-5 text-[10px] px-2 text-warning hover:bg-warning/10"
          >
            {questionPanelOpen ? 'Close' : 'Generate Suggestion'}
          </Button>
        </div>

        {questionPanelOpen && (
          <div className="flex flex-col gap-2 pt-1 border-t border-border/60">
            <div>
              <span className="text-[10px] font-semibold text-warning uppercase tracking-wide">Suggested Rhetorical Question</span>
              {isEditingQuestion ? (
                <textarea
                  value={customQuestionText}
                  onChange={(e) => setCustomQuestionText(e.target.value)}
                  rows={2}
                  className="w-full mt-1 text-[10px] p-1.5 border border-border rounded bg-background text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-warning/40"
                />
              ) : (
                <p className="text-[10px] text-foreground font-medium mt-0.5 italic p-1.5 bg-background border border-border rounded">
                  "{customQuestionText || currentSuggestion.question}"
                </p>
              )}
            </div>

            <div className="text-[10px] flex flex-col gap-1">
              <div>
                <span className="font-semibold text-foreground">Why here? </span>
                <span className="text-muted-foreground">{currentSuggestion.reason}</span>
              </div>
              <div>
                <span className="font-semibold text-foreground">Suggested Location: </span>
                <span className="text-muted-foreground">{currentSuggestion.locationName}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center flex-wrap gap-1 pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (onNavigateLocation) {
                    onNavigateLocation({
                      type: 'rhetorical_question',
                      text: customQuestionText || currentSuggestion.question,
                      start: 0,
                      end: Math.min(80, content.length),
                      severity: 'info'
                    });
                  }
                  toast.info('Navigated to suggested insertion location');
                }}
                className="h-6 text-[9px] px-2"
              >
                Go to Location
              </Button>

              {!isEditingQuestion ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingQuestion(true)}
                  className="h-6 text-[9px] px-2"
                >
                  Edit
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditingQuestion(false)}
                  className="h-6 text-[9px] px-2"
                >
                  Done
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCustomQuestionText(currentSuggestion.question);
                  toast.info('Regenerated rhetorical question');
                }}
                className="h-6 text-[9px] px-1.5 text-muted-foreground"
                title="Regenerate question"
              >
                <RefreshCw className="w-2.5 h-2.5" />
              </Button>

              {onInsertHook && (
                <Button
                  size="sm"
                  onClick={() => {
                    const text = customQuestionText || currentSuggestion.question;
                    onInsertHook(`\n\n*${text}*\n\n`, 'cursor');
                    toast.success('Inserted rhetorical question into article!');
                  }}
                  className="h-6 text-[9px] px-2.5 bg-primary text-primary-foreground font-medium ml-auto"
                >
                  Insert Question
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {availableHooks.length > 0 && onInsertHook && (
        <div className="mb-2 p-2 bg-muted/20 border border-border rounded flex flex-col gap-1.5">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-warning" /> Boost Engagement Hooks
          </div>
          <div className="flex flex-col gap-1">
            {availableHooks.map((h, i) => (
              <div key={i} className="flex items-center justify-between gap-1 p-1 bg-background border border-border/70 rounded">
                <span className="text-[10px] text-foreground truncate">{h.title}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onInsertHook(h.text, 'cursor');
                    toast.success(`Inserted ${h.title}!`);
                  }}
                  className="h-5 text-[9px] px-1.5 border-primary/30 text-primary hover:bg-primary/10 shrink-0"
                >
                  Insert Hook
                </Button>
              </div>
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

// ─── Module 14: Internal Linking ──────────────────────────────────────────

export function InternalLinkingPanel({
  links,
  onGenerateLinks,
  generatingLinks,
  discoveryStatus = 'not_fetched',
  statusMessage,
  domain: initialDomain = '',
  onDomainChange,
  onNavigateLocation,
  onApplyLink,
  onSaveProjectDomain,
  savedProjectName,
}: {
  links: DiscoveredInternalLink[];
  onGenerateLinks: (domain: string) => void;
  generatingLinks: boolean;
  discoveryStatus?: 'not_fetched' | 'loading' | 'success' | 'no_opportunities' | 'site_blocked' | 'invalid_domain' | 'error';
  statusMessage?: string;
  domain?: string;
  onDomainChange?: (domain: string) => void;
  onNavigateLocation?: (location: any) => void;
  onApplyLink?: (link: DiscoveredInternalLink) => void;
  onSaveProjectDomain?: (domain: string) => Promise<void> | void;
  savedProjectName?: string;
}) {
  const [localDomain, setLocalDomain] = useState(initialDomain);
  const [expandedWhy, setExpandedWhy] = useState<Record<number, boolean>>({});
  const [expandedSnippet, setExpandedSnippet] = useState<Record<number, boolean>>({});
  const [savingProject, setSavingProject] = useState(false);

  useEffect(() => {
    if (initialDomain) {
      setLocalDomain(initialDomain);
    }
  }, [initialDomain]);

  const currentDomain = localDomain;

  const handleDomainChange = (val: string) => {
    setLocalDomain(val);
    onDomainChange?.(val);
  };

  const handleFetch = () => {
    if (!currentDomain.trim()) {
      toast.error('Please enter your website domain.');
      return;
    }
    onGenerateLinks(currentDomain.trim());
  };

  const handleSaveToProject = async () => {
    if (!currentDomain.trim()) {
      toast.error('Please enter your website domain first.');
      return;
    }
    setSavingProject(true);
    try {
      if (onSaveProjectDomain) {
        await onSaveProjectDomain(currentDomain.trim());
      } else {
        const res = await saveDomainToActiveSEOProject(currentDomain.trim());
        if (res.success) {
          toast.success(res.message);
        } else {
          toast.error(res.message);
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save domain into active SEO project.');
    } finally {
      setSavingProject(false);
    }
  };

  const effectiveStatus = generatingLinks ? 'loading' : (discoveryStatus || (links.length > 0 ? 'success' : 'not_fetched'));
  const appliedCount = links.filter(l => l.isApplied).length;
  const score = links.length > 0 ? Math.min(100, Math.round((appliedCount / links.length) * 100)) : 0;

  return (
    <AnalysisModule 
      title="Internal Linking" 
      score={score} 
      scoreLabel={links.length > 0 ? `${appliedCount}/${links.length} Linked` : undefined}
      defaultOpen={false}
    >
      <div className="flex flex-col gap-2 mb-3">
        <p className="text-xs text-muted-foreground text-pretty leading-relaxed">
          Discover verified internal link opportunities tailored to your content and keywords.
        </p>
        
        <div className="flex items-center justify-between gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <button 
                type="button" 
                className="text-[11px] text-primary/80 hover:text-primary flex items-center gap-1 transition-colors px-1 py-0.5 rounded hover:bg-muted/50 cursor-pointer"
                title="How internal-link recommendations work"
              >
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>How recommendations work</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3.5 text-xs shadow-md border-border bg-popover" align="start">
              <div className="font-semibold text-foreground mb-1 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <span>How internal-link recommendations work</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed text-pretty">
                Recommendations are based on the relevance between your current content, target keywords, and pages discovered on your website. AIDetector.cx does not assume a suggested page is your highest-authority or highest-ranking page unless supporting SEO performance data is available. Review recommendations alongside your site&apos;s content strategy before applying them.
              </p>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-2">
          <Input 
            placeholder="e.g. yourwebsite.com" 
            value={currentDomain} 
            onChange={(e) => handleDomainChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !generatingLinks) handleFetch(); }}
            disabled={generatingLinks}
            className="h-8 text-xs border-border font-mono"
          />
          <Button 
            size="sm" 
            onClick={handleFetch} 
            disabled={generatingLinks || !currentDomain.trim()}
            className="h-8 text-xs gap-1.5 shrink-0"
          >
            {generatingLinks ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
            {generatingLinks ? 'Fetching...' : 'Fetch Links'}
          </Button>
        </div>

        <div className="flex items-center justify-between gap-1 pt-1">
          <button
            type="button"
            onClick={handleSaveToProject}
            disabled={savingProject || !currentDomain.trim()}
            className="text-[11px] text-primary hover:text-primary/80 flex items-center gap-1 transition-colors px-1 py-0.5 rounded hover:bg-muted/50 cursor-pointer disabled:opacity-50"
            title="Save this website domain into your active SEO project settings"
          >
            {savingProject ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookmarkCheck className="w-3.5 h-3.5 text-primary" />}
            <span className="font-medium">Save to Project Settings</span>
          </button>
          {savedProjectName ? (
            <span className="text-[10px] text-muted-foreground truncate max-w-[140px]" title={`Project: ${savedProjectName}`}>
              Project: <strong className="font-semibold text-foreground">{savedProjectName}</strong>
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground">SEO Project Sync</span>
          )}
        </div>
      </div>
      
      {/* State Machine Views */}
      {effectiveStatus === 'loading' && (
        <div className="p-3 bg-muted/30 border border-border rounded flex flex-col items-center justify-center gap-2 text-center py-5">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
          <div className="text-xs font-medium text-foreground">Discovering Pages & Matching Opportunities</div>
          <p className="text-[11px] text-muted-foreground max-w-[280px]">
            Retrieving sitemaps, verifying real site URLs on <span className="font-mono text-foreground font-semibold">{currentDomain}</span>, and locating contextual anchor matches in your article...
          </p>
        </div>
      )}

      {effectiveStatus === 'not_fetched' && links.length === 0 && (
        <div className="p-3 bg-muted/10 border border-border/50 rounded flex flex-col gap-1.5 text-center py-4">
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Globe className="w-4 h-4 opacity-60" />
            <span>Ready for Website Link Discovery</span>
          </div>
          <p className="text-[11px] text-muted-foreground text-pretty">
            Enter your website domain and click <strong>Fetch Links</strong> to identify relevant internal linking targets.
          </p>
        </div>
      )}

      {effectiveStatus === 'invalid_domain' && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded flex items-start gap-2 text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5 text-xs">
            <span className="font-semibold">Invalid Domain</span>
            <span className="text-[11px] opacity-90 leading-relaxed">
              {statusMessage || 'Please enter a valid public website domain (e.g. example.com or www.example.com).'}
            </span>
          </div>
        </div>
      )}

      {effectiveStatus === 'site_blocked' && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded flex flex-col gap-2 text-amber-800 dark:text-amber-300">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div className="flex flex-col gap-0.5 text-xs">
              <span className="font-semibold">Site Discovery Protected / Unreachable</span>
              <span className="text-[11px] leading-relaxed opacity-90">
                {statusMessage || `Could not retrieve pages from ${currentDomain}. The site may use anti-bot challenge protection (e.g. Cloudflare) or have no public index.`}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleFetch}
            className="h-6 text-[10px] self-end border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Retry Discovery
          </Button>
        </div>
      )}

      {effectiveStatus === 'no_opportunities' && links.length === 0 && (
        <div className="p-3 bg-muted/20 border border-border rounded flex flex-col gap-1.5 text-center py-4">
          <div className="flex items-center justify-center gap-1.5 text-xs text-foreground font-medium">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span>No strong internal-link opportunities found for this content.</span>
          </div>
          <p className="text-[11px] text-muted-foreground text-pretty">
            {statusMessage || `Discovered indexable pages on ${currentDomain}, but none met the contextual relevance threshold for the current article and keywords.`}
          </p>
        </div>
      )}

      {effectiveStatus === 'error' && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded flex flex-col gap-2 text-destructive">
          <div className="flex items-start gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">Discovery Failed</span>
              <span className="text-[11px] opacity-90 leading-relaxed">
                {statusMessage || 'An unexpected error occurred while fetching links from the specified domain.'}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleFetch}
            className="h-6 text-[10px] self-end border-destructive/30 hover:bg-destructive/10 gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </Button>
        </div>
      )}

      {/* Discovered Opportunities List */}
      {links.length > 0 && effectiveStatus !== 'loading' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
            <span>Relevant Opportunities ({links.length})</span>
            <span>{appliedCount} Applied</span>
          </div>

          {links.map((link, i) => (
            <div 
              key={i} 
              className={`p-2.5 rounded border transition-all flex flex-col gap-1.5 ${
                link.isApplied 
                  ? 'bg-success/5 border-success/30' 
                  : 'bg-primary/5 border-primary/20 hover:border-primary/40'
              }`}
            >
              {/* Row 1: Badges */}
              <div className="flex items-center gap-1 flex-wrap">
                {link.recommendationBasis && (
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 font-medium bg-primary/10 text-primary border-primary/30"
                  >
                    {link.recommendationBasis}
                  </Badge>
                )}
                <Badge 
                  variant="outline" 
                  className={`text-[9px] px-1.5 py-0 font-medium ${
                    link.isExistingAnchor 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  }`}
                >
                  {link.isExistingAnchor ? 'Existing in Article' : 'Suggested wording'}
                </Badge>
              </div>

              {/* Row 2: Destination & Link */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-baseline gap-1 min-w-0">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">DESTINATION:</span>
                  <span className="text-xs font-semibold text-foreground truncate">{link.title}</span>
                </div>
                <a 
                  href={link.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-[10px] text-primary/80 hover:text-primary font-mono truncate flex items-center gap-1 mt-0.5"
                >
                  <span className="truncate">{link.url}</span>
                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                </a>
              </div>

              {/* Row 3: Anchor & Interactive Details */}
              <div className="p-2 bg-background/80 rounded border border-border/60 text-[10px] flex flex-col gap-1.5">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="font-semibold text-foreground shrink-0">
                    {link.isExistingAnchor ? 'Anchor Text:' : 'Suggested Anchor:'}
                  </span>
                  <span className="font-semibold text-primary">"{link.anchorText}"</span>
                </div>

                {/* Interactive "Why this fits" */}
                {link.reason && (
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setExpandedWhy(prev => ({ ...prev, [i]: !prev[i] }));
                      }}
                      className="text-[10px] font-medium text-foreground/90 hover:text-primary flex items-center gap-1 cursor-pointer transition-colors self-start"
                    >
                      <span className="font-semibold">Why this fits:</span>
                      <span className="text-[9px] text-primary underline decoration-dotted">
                        {expandedWhy[i] ? 'Hide reason' : 'Show reason'}
                      </span>
                      <ChevronDown className={cn("w-3 h-3 transition-transform text-muted-foreground", expandedWhy[i] && "rotate-180")} />
                    </button>
                    {expandedWhy[i] && (
                      <div className="text-[9px] text-muted-foreground bg-muted/40 p-1.5 rounded border border-border/40 leading-relaxed animate-in fade-in-50 duration-150">
                        <span className="font-semibold text-foreground">Reason:</span> {link.reason}
                      </div>
                    )}
                  </div>
                )}

                {/* Interactive Context Snippet */}
                {link.contextSnippet && (
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setExpandedSnippet(prev => ({ ...prev, [i]: !prev[i] }));
                      }}
                      className="text-[9px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer self-start transition-colors"
                    >
                      <span>{expandedSnippet[i] ? 'Hide context quote' : 'Show context quote'}</span>
                      <ChevronDown className={cn("w-2.5 h-2.5 transition-transform", expandedSnippet[i] && "rotate-180")} />
                    </button>
                    {expandedSnippet[i] && (
                      <div className="text-muted-foreground text-[9px] leading-relaxed italic border-l-2 border-primary/40 pl-1.5 bg-muted/20 p-1 rounded-r animate-in fade-in-50 duration-150">
                        "{link.contextSnippet}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Row 4: Action Buttons */}
              <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-border/30">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onNavigateLocation) {
                      if (link.isExistingAnchor) {
                        onNavigateLocation({
                          type: 'internal_link_anchor',
                          text: link.anchorText,
                          start: link.start,
                          end: link.end,
                          sentenceIndex: link.sentenceIndex,
                          contextSnippet: link.contextSnippet,
                          severity: 'info'
                        });
                        toast.info(`Navigated to "${link.anchorText}" in editor`);
                      } else {
                        onNavigateLocation({
                          type: 'suggested_insertion_target',
                          text: link.contextSnippet,
                          sentenceIndex: link.sentenceIndex,
                          contextSnippet: link.contextSnippet,
                          severity: 'info'
                        });
                        toast.info(`Navigated to target sentence in editor`);
                      }
                    }
                  }}
                  className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
                >
                  Go to Location
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant={link.isApplied ? 'outline' : 'default'}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onApplyLink?.(link);
                  }}
                  disabled={link.isApplied}
                  className={`h-6 text-[10px] px-2.5 gap-1 ${
                    link.isApplied
                      ? 'bg-success/10 text-success border-success/30 cursor-default'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  {link.isApplied ? (
                    <>
                      <Check className="w-3 h-3" />
                      Applied
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3 h-3" />
                      Apply Link
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AnalysisModule>
  );
}

// ─── Module 15: Featured Snippet Optimization ────────────────────────────

export function SnippetPanel({ result }: { result: SnippetResult }) {
  return (
    <AnalysisModule title="Snippet Potential" score={result.score} defaultOpen={false}>
      <div className="grid grid-cols-2 gap-1">
        <CheckItem ok={result.hasDefinition} label="Definition" />
        <CheckItem ok={result.hasList} label="List" />
        <CheckItem ok={result.hasTable} label="Table" />
        <CheckItem ok={result.hasFAQ} label="FAQ" />
      </div>
      <ul className="flex flex-col gap-0.5 mt-1">
        {result.recommendations.map((r, i) => <Rec key={i} text={r} />)}
      </ul>
    </AnalysisModule>
  );
}

// ─── Module 16: Meta Optimization ────────────────────────────────────────

export function MetaOptimizationPanel({ result, onChange }: {
  result: MetaResult;
  onChange?: (field: 'title' | 'desc' | 'slug', val: string) => void;
}) {
  const [titleVal, setTitleVal] = useState(result.suggestedTitle);
  const [descVal, setDescVal] = useState(result.suggestedDescription);
  const [slugVal, setSlugVal] = useState(result.suggestedSlug);

  const titleLen = titleVal.length;
  const descLen = descVal.length;

  return (
    <AnalysisModule title="Meta Optimization" defaultOpen={false}>
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">SEO Title</span>
            <span className={`text-[10px] font-bold ${titleLen >= 50 && titleLen <= 60 ? 'text-success' : 'text-warning'}`}>{titleLen}/60</span>
          </div>
          <input
            value={titleVal}
            onChange={(e) => { setTitleVal(e.target.value); onChange?.('title', e.target.value); }}
            className="w-full h-7 px-2 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Meta Description</span>
            <span className={`text-[10px] font-bold ${descLen >= 140 && descLen <= 160 ? 'text-success' : 'text-warning'}`}>{descLen}/160</span>
          </div>
          <textarea
            value={descVal}
            onChange={(e) => { setDescVal(e.target.value); onChange?.('desc', e.target.value); }}
            className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 leading-relaxed"
            rows={3}
          />
        </div>
        <div>
          <div className="mb-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">URL Slug</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground shrink-0">aidetector.cx/</span>
            <input
              value={slugVal}
              onChange={(e) => { setSlugVal(e.target.value); onChange?.('slug', e.target.value); }}
              className="flex-1 min-w-0 h-7 px-2 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Live Google SERP Snippet Preview */}
        <div className="pt-2 border-t border-border">
          <GoogleSERPPreview
            title={titleVal}
            keyword=""
            content={descVal}
            domain="aidetector.cx"
            customSlug={slugVal}
          />
        </div>
      </div>
    </AnalysisModule>
  );
}

// ─── Module 17: Content Uniqueness ───────────────────────────────────────

export function UniquenessPanel({ 
  result,
  onNavigateOccurrence
}: { 
  result: UniquenessResult;
  onNavigateOccurrence?: (item: {
    type: 'word' | 'phrase';
    text: string;
    index: number;
    total: number;
    start?: number;
    end?: number;
    severity?: 'warning' | 'error' | 'info';
  }) => void;
}) {
  const [activeNav, setActiveNav] = useState<{
    type: 'word' | 'phrase';
    term: string;
    currentIndex: number;
    occurrences: { start: number; end: number; text: string; index: number }[];
  } | null>(null);

  const handleSelectWord = (word: string) => {
    const wordData = result.wordOccurrences?.find(w => w.word.toLowerCase() === word.toLowerCase());
    const occs = wordData?.occurrences || [];
    if (occs.length > 0) {
      setActiveNav({
        type: 'word',
        term: word,
        currentIndex: 0,
        occurrences: occs
      });
      onNavigateOccurrence?.({
        type: 'word',
        text: occs[0].text,
        start: occs[0].start,
        end: occs[0].end,
        index: 0,
        total: occs.length,
        severity: 'warning'
      });
    } else {
      onNavigateOccurrence?.({
        type: 'word',
        text: word,
        index: 0,
        total: 1,
        severity: 'warning'
      });
    }
  };

  const handleSelectPhrase = (phrase: string) => {
    const phraseData = result.phraseOccurrences?.find(p => p.phrase.toLowerCase() === phrase.toLowerCase());
    const occs = phraseData?.occurrences || [];
    if (occs.length > 0) {
      setActiveNav({
        type: 'phrase',
        term: phrase,
        currentIndex: 0,
        occurrences: occs
      });
      onNavigateOccurrence?.({
        type: 'phrase',
        text: occs[0].text,
        start: occs[0].start,
        end: occs[0].end,
        index: 0,
        total: occs.length,
        severity: 'warning'
      });
    } else {
      onNavigateOccurrence?.({
        type: 'phrase',
        text: phrase,
        index: 0,
        total: 1,
        severity: 'warning'
      });
    }
  };

  const handleNextOccurrence = () => {
    if (!activeNav || activeNav.occurrences.length === 0) return;
    const nextIdx = (activeNav.currentIndex + 1) % activeNav.occurrences.length;
    setActiveNav(prev => prev ? { ...prev, currentIndex: nextIdx } : null);
    const target = activeNav.occurrences[nextIdx];
    onNavigateOccurrence?.({
      type: activeNav.type,
      text: target.text,
      start: target.start,
      end: target.end,
      index: nextIdx,
      total: activeNav.occurrences.length,
      severity: 'warning'
    });
  };

  const handlePrevOccurrence = () => {
    if (!activeNav || activeNav.occurrences.length === 0) return;
    const prevIdx = (activeNav.currentIndex - 1 + activeNav.occurrences.length) % activeNav.occurrences.length;
    setActiveNav(prev => prev ? { ...prev, currentIndex: prevIdx } : null);
    const target = activeNav.occurrences[prevIdx];
    onNavigateOccurrence?.({
      type: activeNav.type,
      text: target.text,
      start: target.start,
      end: target.end,
      index: prevIdx,
      total: activeNav.occurrences.length,
      severity: 'warning'
    });
  };

  return (
    <AnalysisModule title="Content Uniqueness" score={result.score} defaultOpen={false}>
      {/* Active Occurrence Navigation Controller */}
      {activeNav && (
        <div className="mb-3 p-2 bg-warning/10 border border-warning/30 rounded flex flex-col gap-1.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-warning uppercase flex items-center gap-1">
              <Search className="w-3 h-3 text-warning" /> Occurrence Navigation
            </span>
            <button
              type="button"
              onClick={() => setActiveNav(null)}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-foreground font-semibold truncate max-w-[130px]">"{activeNav.term}"</span>
            <span className="text-muted-foreground text-[11px]">
              {activeNav.currentIndex + 1} of {activeNav.occurrences.length}
            </span>
          </div>
          <div className="flex gap-1.5 mt-0.5">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrevOccurrence}
              className="h-6 flex-1 text-[10px] gap-1 border-warning/30 hover:bg-warning/10"
            >
              <ChevronLeft className="w-3 h-3" /> Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNextOccurrence}
              className="h-6 flex-1 text-[10px] gap-1 border-warning/30 hover:bg-warning/10"
            >
              Next <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {result.overusedWords.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Overused Words (click to locate)</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {result.overusedWords.slice(0, 8).map((w) => {
              const count = result.wordOccurrences?.find(item => item.word.toLowerCase() === w.toLowerCase())?.count;
              const isActive = activeNav?.term.toLowerCase() === w.toLowerCase();
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => handleSelectWord(w)}
                  className={`text-[10px] py-0.5 px-2 rounded-full border transition-all cursor-pointer font-mono ${
                    isActive
                      ? 'bg-warning text-warning-foreground font-bold border-warning ring-2 ring-warning/30'
                      : 'border-warning/30 text-warning hover:bg-warning/15'
                  }`}
                >
                  {w} {count ? `(${count})` : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {result.duplicatePhrases.length > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Repeated Phrases (click to locate)</p>
          </div>
          <div className="flex flex-col gap-1">
            {result.duplicatePhrases.slice(0, 4).map((p) => {
              const count = result.phraseOccurrences?.find(item => item.phrase.toLowerCase() === p.toLowerCase())?.count;
              const isActive = activeNav?.term.toLowerCase() === p.toLowerCase();
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSelectPhrase(p)}
                  className={`text-left text-xs p-1.5 rounded border transition-all cursor-pointer font-mono flex items-center justify-between group ${
                    isActive
                      ? 'bg-warning/20 border-warning ring-1 ring-warning/40 text-foreground font-medium'
                      : 'bg-muted/30 border-border/70 text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }`}
                >
                  <span className="truncate flex-1">"{p}"</span>
                  <span className="text-[10px] text-warning shrink-0 ml-1 font-bold group-hover:underline">
                    {count ? `${count}x →` : 'Find →'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <ul className="flex flex-col gap-0.5">
        {result.recommendations.map((r, i) => <Rec key={i} text={r} />)}
      </ul>
    </AnalysisModule>
  );
}

// ─── Module 18: AI Detection Risk ────────────────────────────────────────

export function AIRiskPanel({ result }: { result: AIRiskResult }) {
  const riskColor = result.riskLevel === 'Low' ? 'text-success' : result.riskLevel === 'Medium' ? 'text-warning' : 'text-destructive';
  const score = result.humanScore;
  return (
    <AnalysisModule title="AI Detection Risk" score={score} defaultOpen={false}>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center p-2 bg-success/5 border border-success/20 rounded flex-1">
          <span className="text-lg font-bold text-success">{result.humanScore}%</span>
          <span className="text-[10px] text-muted-foreground">Human</span>
        </div>
        <div className="flex flex-col items-center p-2 bg-destructive/5 border border-destructive/20 rounded flex-1">
          <span className="text-lg font-bold text-destructive">{result.aiScore}%</span>
          <span className="text-[10px] text-muted-foreground">AI</span>
        </div>
        <div className="flex flex-col items-center p-2 bg-muted/30 rounded flex-1">
          <span className={`text-xs font-bold ${riskColor}`}>{result.riskLevel}</span>
          <span className="text-[10px] text-muted-foreground">Risk</span>
        </div>
      </div>
      <ul className="flex flex-col gap-0.5">
        {result.recommendations.map((r, i) => <Rec key={i} text={r} />)}
      </ul>
    </AnalysisModule>
  );
}

// ─── Module 19: FAQ Generator ─────────────────────────────────────────────

export function FAQPanel({ faqs, onGenerate, generating }: {
  faqs: { question: string; answer: string }[];
  onGenerate: () => void;
  generating: boolean;
}) {
  const [copiedSchema, setCopiedSchema] = useState(false);

  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }, null, 2);

  const copySchema = () => {
    navigator.clipboard.writeText(schema);
    setCopiedSchema(true);
    toast.success('JSON-LD schema copied.');
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <AnalysisModule title="FAQ Generator" defaultOpen={false}>
      <Button
        size="sm"
        className="h-7 text-xs bg-primary text-primary-foreground gap-1 w-full"
        onClick={onGenerate}
        disabled={generating}
      >
        {generating ? 'Generating…' : faqs.length > 0 ? 'Regenerate FAQ' : 'Generate FAQ'}
      </Button>
      {faqs.length > 0 && (
        <>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-0.5">
            {faqs.map((f, i) => (
              <div key={i} className="p-2 bg-muted/20 rounded border border-border/50">
                <p className="text-xs font-semibold text-navy mb-0.5 text-balance">{f.question}</p>
                <p className="text-[10px] text-muted-foreground text-pretty line-clamp-2">{f.answer}</p>
              </div>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-border gap-1 w-full"
            onClick={copySchema}
          >
            {copiedSchema ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
            {copiedSchema ? 'Copied!' : 'Copy JSON-LD Schema'}
          </Button>
        </>
      )}
    </AnalysisModule>
  );
}

// ─── Module 20: Export Options ────────────────────────────────────────────

export function ExportPanel({
  content,
  metaTitle,
  metaDescription,
  slug,
  balancedResult,
  plagiarismResult,
  registrationResult,
}: {
  content: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
  balancedResult?: BalancedDetectorResult | null;
  plagiarismResult?: PlagiarismAnalysisResult | null;
  registrationResult?: RegisterResult | null;
}) {
  const handleExportHTML = () => {
    const trackingCode = registrationResult?.registration?.trackingCode;
    const trackingBadge = trackingCode
      ? `\n  <div class="authorship-badge">\n    <p><strong>Verified Authorship Code:</strong> <a href="https://aidetector.cx/verify/${trackingCode}">${trackingCode}</a></p>\n  </div>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metaTitle}</title>
  <meta name="description" content="${metaDescription}">
  <link rel="canonical" href="https://aidetector.cx/${slug}">
</head>
<body>
<article>
${content.split('\n').map((line) => {
  const hm = line.match(/^(#{1,6})\s+(.*)/);
  if (hm) return `  <h${hm[1].length}>${hm[2]}</h${hm[1].length}>`;
  if (line.trim()) return `  <p>${line}</p>`;
  return '';
}).filter(Boolean).join('\n')}
${trackingBadge}
</article>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${slug || 'article'}.html`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as HTML.');
  };

  const handleExportMD = () => {
    const trackingCode = registrationResult?.registration?.trackingCode;
    const authorshipFrontmatter = trackingCode
      ? `verified_authorship_code: "${trackingCode}"\nauthorship_verification_url: "https://aidetector.cx/verify/${trackingCode}"\n`
      : '';

    const md = `---\ntitle: "${metaTitle}"\ndescription: "${metaDescription}"\nslug: "${slug}"\n${authorshipFrontmatter}---\n\n${content}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${slug || 'article'}.md`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as Markdown.');
  };

  const handleExportJSON = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      seo: {
        title: metaTitle,
        description: metaDescription,
        slug,
        wordCount: content.split(/\s+/).filter(Boolean).length,
        characterCount: content.length,
      },
      content,
      balancedAiDetection: balancedResult
        ? {
            aiScore: balancedResult.ai,
            humanScore: balancedResult.human,
            mixedScore: balancedResult.mixed,
            verdict: balancedResult.verdict,
            risk: balancedResult.risk,
            confidence: balancedResult.confidence,
            confidenceLevel: balancedResult.confidenceLevel,
            language: balancedResult.language,
            engineVersion: balancedResult.engineVersion,
            analyzedAt: balancedResult.analyzedAt,
          }
        : null,
      plagiarismCheck: plagiarismResult
        ? {
            similarityScore: plagiarismResult.similarityScore,
            originalityScore: plagiarismResult.originalityScore,
            status: plagiarismResult.status,
            sourcesCount: plagiarismResult.sources.length,
            coverageNote: plagiarismResult.coverageNote,
            verifiedSources: plagiarismResult.sources.map((s) => ({
              title: s.title,
              url: s.url,
              publisher: s.publisher,
              matchContribution: s.matchContribution,
              matchType: s.matchType,
            })),
          }
        : null,
      verifiedAuthorship: registrationResult?.registration
        ? {
            trackingCode: registrationResult.registration.trackingCode,
            contentHash: registrationResult.registration.contentHash,
            status: registrationResult.registration.status,
            version: registrationResult.registration.currentVersionNumber,
            verificationUrl: `https://aidetector.cx/verify/${registrationResult.registration.trackingCode}`,
            declaration: registrationResult.registration.creationDeclaration,
          }
        : null,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${slug || 'seo-report'}-audit.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Complete SEO Audit JSON exported.');
  };

  return (
    <AnalysisModule title="Export Options" defaultOpen={false}>
      <div className="flex flex-col gap-2">
        <Button size="sm" variant="outline" className="h-8 text-xs border-border gap-1.5 justify-start" onClick={handleExportHTML}>
          <Download className="w-3.5 h-3.5" /> Export as HTML
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs border-border gap-1.5 justify-start" onClick={handleExportMD}>
          <Download className="w-3.5 h-3.5" /> Export as Markdown
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs border-border gap-1.5 justify-start" onClick={handleExportJSON}>
          <FileText className="w-3.5 h-3.5" /> Export Full JSON Audit Report
        </Button>
      </div>
    </AnalysisModule>
  );
}
