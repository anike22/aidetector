import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Lock, Unlock, Sparkles, CheckCircle2, AlertCircle, ArrowRight,
  RotateCcw, Target, TrendingUp, BookOpen, Layers, Check, Coins,
  Search, Eye, ChevronDown, ChevronUp
} from 'lucide-react';
import type { BloggerKeywordEvaluationResult } from '@/lib/seo/bloggerKeywordMetrics';
import { GoogleSERPPreview } from './GoogleSERPPreview';

interface BloggerWorkflowStepsProps {
  step: 1 | 2 | 3;
  primaryKeyword: string;
  relatedKeywords: string[];
  title: string;
  content?: string;
  isKeywordsLocked: boolean;
  isTitleLocked: boolean;
  metrics: BloggerKeywordEvaluationResult | null;
  onPrimaryKeywordChange: (val: string) => void;
  onRelatedKeywordChange: (index: number, val: string) => void;
  onTitleChange: (val: string) => void;
  onLockKeywords: () => void;
  onLockTitleAndPay: () => void;
  onStartNew: () => void;
  isLockingTitle?: boolean;
  creditsBalance?: number;
}

export const BloggerWorkflowSteps: React.FC<BloggerWorkflowStepsProps> = ({
  step,
  primaryKeyword,
  relatedKeywords,
  title,
  content = '',
  isKeywordsLocked,
  isTitleLocked,
  metrics,
  onPrimaryKeywordChange,
  onRelatedKeywordChange,
  onTitleChange,
  onLockKeywords,
  onLockTitleAndPay,
  onStartNew,
  isLockingTitle = false,
  creditsBalance = 0,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSERPPreview, setShowSERPPreview] = useState(true);

  const cleanPrimary = primaryKeyword.trim();
  const hasRelated = relatedKeywords.some(k => k.trim().length > 0);
  const titleHasKeyword = cleanPrimary.length > 0 && title.toLowerCase().includes(cleanPrimary.toLowerCase());

  return (
    <div className="w-full bg-card border-b border-border p-4 md:p-5 transition-all">
      {/* ── Progress Stepper ── */}
      <div className="max-w-5xl mx-auto mb-4">
        <div className="flex items-center justify-between gap-2 text-xs">
          {/* Step 1 indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step > 1 || isKeywordsLocked
                  ? 'bg-success text-success-foreground'
                  : 'bg-primary text-primary-foreground ring-2 ring-primary/30'
              }`}
            >
              {isKeywordsLocked ? <Check className="w-3.5 h-3.5" /> : '1'}
            </span>
            <div className="flex flex-col">
              <span className={`font-semibold ${step === 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
                1. Keywords & Metrics
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isKeywordsLocked ? 'Locked' : 'Evaluate & Lock'}
              </span>
            </div>
          </div>

          <div className={`flex-1 h-0.5 mx-2 ${step >= 2 ? 'bg-primary' : 'bg-border'}`} />

          {/* Step 2 indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step > 2 || isTitleLocked
                  ? 'bg-success text-success-foreground'
                  : step === 2
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {isTitleLocked ? <Check className="w-3.5 h-3.5" /> : '2'}
            </span>
            <div className="flex flex-col">
              <span className={`font-semibold ${step === 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
                2. Title & Lock
              </span>
              <span className="text-[10px] text-muted-foreground">
                {isTitleLocked ? 'Locked (30 Credits)' : 'Cost: 30 Credits'}
              </span>
            </div>
          </div>

          <div className={`flex-1 h-0.5 mx-2 ${step >= 3 ? 'bg-primary' : 'bg-border'}`} />

          {/* Step 3 indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 3
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              3
            </span>
            <div className="flex flex-col">
              <span className={`font-semibold ${step === 3 ? 'text-foreground' : 'text-muted-foreground'}`}>
                3. Content Optimization
              </span>
              <span className="text-[10px] text-muted-foreground">
                Analyze target keywords
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── STEP 1: KEYWORD INPUT & EVALUATION ── */}
      {step === 1 && (
        <div className="max-w-5xl mx-auto bg-muted/20 border border-border rounded-xl p-4 md:p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm md:text-base font-bold text-foreground flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Step 1: Enter Keywords & Evaluate Ranking Metrics
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enter 1 primary keyword and up to 3 related keywords. The engine evaluates keyword difficulty (KD), search volume, and word count target needed to rank. Once locked, keywords cannot be changed.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div className="md:col-span-1">
              <Label htmlFor="blogger-primary-kw" className="text-xs font-semibold text-foreground mb-1 block">
                Primary Target Keyword <span className="text-destructive">*</span>
              </Label>
              <Input
                id="blogger-primary-kw"
                value={primaryKeyword}
                onChange={(e) => onPrimaryKeywordChange(e.target.value)}
                placeholder="e.g. AI checker for bloggers"
                className="h-9 text-xs border-border bg-background"
                disabled={isKeywordsLocked}
              />
            </div>

            <div className="md:col-span-1">
              <Label htmlFor="blogger-related-1" className="text-xs font-medium text-muted-foreground mb-1 block">
                Related Keyword 1
              </Label>
              <Input
                id="blogger-related-1"
                value={relatedKeywords[0] || ''}
                onChange={(e) => onRelatedKeywordChange(0, e.target.value)}
                placeholder="e.g. blog SEO tools"
                className="h-9 text-xs border-border bg-background"
                disabled={isKeywordsLocked}
              />
            </div>

            <div className="md:col-span-1">
              <Label htmlFor="blogger-related-2" className="text-xs font-medium text-muted-foreground mb-1 block">
                Related Keyword 2
              </Label>
              <Input
                id="blogger-related-2"
                value={relatedKeywords[1] || ''}
                onChange={(e) => onRelatedKeywordChange(1, e.target.value)}
                placeholder="e.g. AI content detector"
                className="h-9 text-xs border-border bg-background"
                disabled={isKeywordsLocked}
              />
            </div>

            <div className="md:col-span-1">
              <Label htmlFor="blogger-related-3" className="text-xs font-medium text-muted-foreground mb-1 block">
                Related Keyword 3
              </Label>
              <Input
                id="blogger-related-3"
                value={relatedKeywords[2] || ''}
                onChange={(e) => onRelatedKeywordChange(2, e.target.value)}
                placeholder="e.g. readability score"
                className="h-9 text-xs border-border bg-background"
                disabled={isKeywordsLocked}
              />
            </div>
          </div>

          {/* Metric Evaluation Preview */}
          {metrics && cleanPrimary && (
            <div className="bg-card border border-border rounded-lg p-3 md:p-4 mb-4">
              <div className="text-xs font-bold text-foreground mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  Live Keyword Difficulty & Search SERP Evaluation
                </span>
                <Badge variant="outline" className="text-[10px] font-normal border-primary/20 bg-primary/5 text-primary">
                  Evaluated Target
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                <div className="p-2.5 rounded bg-muted/40 border border-border/60">
                  <span className="text-[10px] text-muted-foreground block">Primary Keyword Difficulty (KD)</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-base font-extrabold text-foreground">{metrics.primary.difficulty}/100</span>
                    <span className={`text-xs font-semibold ${metrics.primary.difficultyColor}`}>
                      {metrics.primary.difficultyLabel}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-muted/40 border border-border/60">
                  <span className="text-[10px] text-muted-foreground block">Monthly Search Volume</span>
                  <div className="text-base font-extrabold text-foreground mt-0.5">
                    {metrics.primary.searchVolumeFormatted}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-muted/40 border border-border/60">
                  <span className="text-[10px] text-muted-foreground block">Recommended Word Count to Rank</span>
                  <div className="text-sm md:text-base font-extrabold text-primary mt-0.5">
                    {metrics.recommendedWordCount.rangeText}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-muted/40 border border-border/60">
                  <span className="text-[10px] text-muted-foreground block">Search Intent & SERP Features</span>
                  <div className="text-xs font-bold text-foreground mt-1 truncate">
                    {metrics.primary.intent} · {metrics.competitiveDepth} Competition
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>
                  <strong>Ranking Strategy:</strong> {metrics.recommendedWordCount.rationale}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/60">
            <Button
              size="sm"
              onClick={onLockKeywords}
              disabled={!cleanPrimary}
              className="h-9 px-5 text-xs font-semibold bg-primary text-primary-foreground gap-1.5 shadow-sm"
            >
              <Lock className="w-3.5 h-3.5" />
              Lock Keywords & Proceed to Step 2
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2: TITLE & CREDIT CHARGE ── */}
      {step === 2 && (
        <div className="max-w-5xl mx-auto bg-muted/20 border border-border rounded-xl p-4 md:p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm md:text-base font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Step 2: Enter Content Title & Lock (Static 30 Credits)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your title must contain the primary keyword. Once confirmed, the title is locked and static 30 credits are deducted to activate multi-keyword optimization.
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              <Coins className="w-3.5 h-3.5" />
              <span>Static Cost: 30 Credits</span>
            </div>
          </div>

          {/* Locked keywords badge review */}
          <div className="p-3 rounded-lg bg-card border border-border mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Lock className="w-3 h-3 text-primary" /> Locked Primary:
            </span>
            <Badge variant="secondary" className="font-semibold text-xs text-foreground">
              {primaryKeyword}
            </Badge>
            {relatedKeywords.filter(Boolean).length > 0 && (
              <>
                <span className="text-xs text-muted-foreground ml-2">Related:</span>
                {relatedKeywords.filter(Boolean).map((rk, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs text-muted-foreground">
                    {rk}
                  </Badge>
                ))}
              </>
            )}
            {metrics && (
              <span className="text-xs text-primary font-medium ml-auto">
                Target to rank: {metrics.recommendedWordCount.rangeText}
              </span>
            )}
          </div>

          {/* Title Input */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="blogger-title-input" className="text-xs font-semibold text-foreground">
                Blog Article Title <span className="text-destructive">*</span>
              </Label>
              <span className={`text-[11px] font-medium ${titleHasKeyword ? 'text-success' : 'text-warning'}`}>
                {titleHasKeyword 
                  ? '✓ Primary keyword present in title' 
                  : `⚠️ Title must contain "${primaryKeyword}"`}
              </span>
            </div>
            <Input
              id="blogger-title-input"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={`e.g. Complete Guide to ${primaryKeyword}: Tips & Best Practices`}
              className="h-10 text-sm border-border bg-background"
              disabled={isTitleLocked}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Note: The primary keyword must appear in this content title. H1 in the markdown body is optional and will not be penalized.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/60">
            <div className="text-xs text-muted-foreground">
              Current balance: <strong className="text-foreground">{creditsBalance}</strong> credits. Static optimization charge: <strong className="text-primary">30 credits</strong>.
            </div>

            <Button
              size="sm"
              onClick={onLockTitleAndPay}
              disabled={!title.trim() || !titleHasKeyword || isLockingTitle}
              className="h-9 px-6 text-xs font-semibold bg-primary text-primary-foreground gap-2 shadow-sm"
            >
              {isLockingTitle ? (
                <>Locking & Processing...</>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  Lock Title & Start Optimization (30 Credits)
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: PERSISTENT LOCKED SESSION BAR & START NEW ── */}
      {step === 3 && (
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="bg-card border border-border rounded-xl p-3 md:p-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    <Lock className="w-3 h-3" /> Locked Optimization Session
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">
                    30 Credits Charged (Full Session Active)
                  </span>
                  {metrics && (
                    <span className="text-xs text-primary font-medium ml-auto hidden sm:inline-block">
                      Target: {metrics.recommendedWordCount.rangeText} to rank
                    </span>
                  )}
                </div>

                <h4 className="text-sm md:text-base font-extrabold text-foreground truncate" title={title}>
                  {title}
                </h4>

                <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
                  <Badge variant="default" className="text-xs font-semibold bg-primary text-primary-foreground gap-1">
                    <Target className="w-3 h-3" />
                    Primary: {primaryKeyword}
                  </Badge>
                  {metrics && (
                    <Badge variant="outline" className="text-[11px] font-normal border-border">
                      KD {metrics.primary.difficulty}/100 ({metrics.primary.difficultyLabel}) · Vol {metrics.primary.searchVolumeFormatted}
                    </Badge>
                  )}
                  {relatedKeywords.filter(Boolean).map((rk, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs text-muted-foreground">
                      +{rk}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions: SERP Preview Toggle & Start New Button */}
              <div className="shrink-0 flex items-center flex-wrap gap-2 self-end lg:self-center">
                <Button
                  size="sm"
                  variant={showSERPPreview ? "secondary" : "outline"}
                  onClick={() => setShowSERPPreview(prev => !prev)}
                  className="h-8 text-xs border-border gap-1.5 text-foreground"
                  title="Toggle live Google Search SERP snippet preview"
                >
                  <Search className="w-3.5 h-3.5 text-primary" />
                  <span>Google SERP Preview</span>
                  {showSERPPreview ? <ChevronUp className="w-3 h-3 ml-0.5 opacity-60" /> : <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />}
                </Button>

                {!showResetConfirm ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowResetConfirm(true)}
                    className="h-8 text-xs border-border gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    title="Save current work to History and start new session"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Start New
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-primary/10 p-1 rounded-lg border border-primary/20">
                    <span className="text-[11px] text-foreground font-medium px-1">Auto-save & reset?</span>
                    <Button
                      size="sm"
                      onClick={() => {
                        setShowResetConfirm(false);
                        onStartNew();
                      }}
                      className="h-7 px-2.5 text-xs font-semibold bg-primary text-primary-foreground"
                    >
                      Save & Start New
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowResetConfirm(false)}
                      className="h-7 px-2 text-xs text-muted-foreground"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Live Google SERP Snippet Preview Component for Locked Title ── */}
          {showSERPPreview && (
            <GoogleSERPPreview
              title={title}
              keyword={primaryKeyword}
              content={content}
              className="w-full"
            />
          )}
        </div>
      )}
    </div>
  );
};
