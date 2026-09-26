import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Compass,
  Check,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Layers,
  ChevronRight,
  Target,
  DollarSign,
  Monitor,
  Users,
  Code2,
} from 'lucide-react';
import { AI_DIRECTORY_PRODUCTS } from '@/data/aiDirectoryData';
import type { DirectoryProduct, DiscoveryNeedAnswer } from '@/types/directory';
import { Link } from 'react-router-dom';

const GOAL_OPTIONS = [
  { id: 'detect', label: 'Detect AI-generated text/media', category: 'AI Detection', icon: '🛡️' },
  { id: 'write', label: 'Write, edit & summarize content', category: 'AI Writing', icon: '✍️' },
  { id: 'code', label: 'Code, refactor & debug software', category: 'AI Coding', icon: '💻' },
  { id: 'search', label: 'Research & cited web search', category: 'AI Search', icon: '🔍' },
  { id: 'image', label: 'Generate images & concept art', category: 'AI Image Generation', icon: '🎨' },
  { id: 'voice', label: 'Voice synthesis, cloning & audio', category: 'AI Audio & Voice', icon: '🎙️' },
  { id: 'assist', label: 'General conversational assistant', category: 'AI Assistants', icon: '🤖' },
];

interface DiscoveryWizardProps {
  onApplyFilters?: (matchedProductIds: string[]) => void;
}

export function DiscoveryWizard({ onApplyFilters }: DiscoveryWizardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [answers, setAnswers] = useState<DiscoveryNeedAnswer>({
    primaryGoal: 'detect',
    budgetPreference: 'all',
    platformNeed: 'all',
    teamScale: 'all',
    mustHaveApi: false,
  });

  const handleReset = () => {
    setStep(1);
    setAnswers({
      primaryGoal: 'detect',
      budgetPreference: 'all',
      platformNeed: 'all',
      teamScale: 'all',
      mustHaveApi: false,
    });
  };

  // Deterministic matching logic based strictly on structured product data
  const matchedProducts = useMemo(() => {
    const selectedGoal = GOAL_OPTIONS.find(g => g.id === answers.primaryGoal);
    const targetCategory = selectedGoal?.category;

    return AI_DIRECTORY_PRODUCTS.map(product => {
      let score = 0;
      const reasons: string[] = [];

      // 1. Goal / Category Match (Major weight)
      if (targetCategory) {
        if (product.primaryCategory === targetCategory) {
          score += 40;
          reasons.push(`Primary category matches ${targetCategory}`);
        } else if (product.categories.includes(targetCategory)) {
          score += 30;
          reasons.push(`Supports ${targetCategory} workflow`);
        }
      }

      // 2. Budget match
      if (answers.budgetPreference === 'free_only') {
        if (product.hasFreePlan) {
          score += 20;
          reasons.push('Has permanent free tier');
        } else {
          score -= 30;
        }
      } else if (answers.budgetPreference === 'free_trial') {
        if (product.hasFreeTrial || product.hasFreePlan) {
          score += 15;
          reasons.push('Free trial or tier available');
        }
      } else {
        score += 10;
      }

      // 3. Platform match
      if (answers.platformNeed === 'mobile') {
        if (product.mobileApp) {
          score += 15;
          reasons.push('Official mobile app available');
        }
      } else if (answers.platformNeed === 'desktop') {
        if (product.platforms.includes('macOS') || product.platforms.includes('Windows')) {
          score += 15;
          reasons.push('Native desktop application');
        }
      } else if (answers.platformNeed === 'api') {
        if (product.apiAvailable) {
          score += 20;
          reasons.push('Developer API provided');
        }
      }

      // 4. API Requirement
      if (answers.mustHaveApi) {
        if (product.apiAvailable) {
          score += 15;
        } else {
          score -= 40;
        }
      }

      // 5. Team scale
      if (answers.teamScale === 'team') {
        if (product.businessAvailability) {
          score += 15;
          reasons.push('Team workspaces & centralized billing');
        }
      }

      return {
        product,
        score,
        reasons,
      };
    })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [answers]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs font-semibold bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 gap-1.5"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Which Tool Fits My Need?</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl bg-card border-border p-6 rounded-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  AI Tool Discovery Assistant
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Deterministic, requirement-driven software recommendations based on verified features.
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          </div>
        </DialogHeader>

        {/* Step Tabs Navigation */}
        <div className="flex items-center justify-between gap-1 py-3 border-b border-border/60 text-xs font-medium">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${
              step === 1 ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>1. Goal</span>
          </button>
          <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${
              step === 2 ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>2. Budget</span>
          </button>
          <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
          <button
            type="button"
            onClick={() => setStep(3)}
            className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${
              step === 3 ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>3. Platform & API</span>
          </button>
          <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
          <button
            type="button"
            onClick={() => setStep(4)}
            className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${
              step === 4 ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>4. Recommendations</span>
          </button>
        </div>

        {/* Wizard Step Content */}
        <div className="py-4 space-y-4">
          {/* STEP 1: PRIMARY GOAL */}
          {step === 1 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                What is your primary task or workflow?
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {GOAL_OPTIONS.map(opt => {
                  const isSelected = answers.primaryGoal === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setAnswers(prev => ({ ...prev, primaryGoal: opt.id }));
                      }}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-primary ring-1 ring-primary/30 text-foreground font-semibold'
                          : 'bg-card border-border/80 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{opt.icon}</span>
                        <span className="text-xs">{opt.label}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => setStep(2)}
                  className="h-8 text-xs bg-primary text-primary-foreground font-semibold gap-1"
                >
                  <span>Next: Budget</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: BUDGET & PRICING */}
          {step === 2 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                What is your budget preference?
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'all', label: 'Any pricing model (Free or Paid)' },
                  { id: 'free_only', label: 'Must have a permanent Free Tier' },
                  { id: 'free_trial', label: 'Free Trial or Free Tier acceptable' },
                  { id: 'paid_acceptable', label: 'Commercial / Paid subscriptions acceptable' },
                ].map(b => {
                  const isSelected = answers.budgetPreference === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setAnswers(prev => ({ ...prev, budgetPreference: b.id as any }))}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-primary/10 border-primary ring-1 ring-primary/30 text-foreground font-semibold'
                          : 'bg-card border-border/80 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span className="text-xs">{b.label}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="h-8 text-xs"
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={() => setStep(3)}
                  className="h-8 text-xs bg-primary text-primary-foreground font-semibold gap-1"
                >
                  <span>Next: Platform & Access</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: PLATFORM & API */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Preferred Platform
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'all', label: 'Any' },
                    { id: 'web', label: 'Web Browser' },
                    { id: 'desktop', label: 'Desktop (macOS/Win)' },
                    { id: 'mobile', label: 'Mobile App' },
                  ].map(p => {
                    const isSelected = answers.platformNeed === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setAnswers(prev => ({ ...prev, platformNeed: p.id as any }))}
                        className={`p-2.5 rounded-xl border text-center text-xs transition-all ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-foreground font-semibold'
                            : 'bg-card border-border/80 text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Team vs Individual
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'all', label: 'Individual or Team' },
                    { id: 'team', label: 'Team / Business Workspace' },
                  ].map(t => {
                    const isSelected = answers.teamScale === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setAnswers(prev => ({ ...prev, teamScale: t.id as any }))}
                        className={`p-2.5 rounded-xl border text-center text-xs transition-all ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-foreground font-semibold'
                            : 'bg-card border-border/80 text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-muted/40 rounded-xl border border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Must have Developer API</span>
                </div>
                <input
                  type="checkbox"
                  checked={answers.mustHaveApi}
                  onChange={e => setAnswers(prev => ({ ...prev, mustHaveApi: e.target.checked }))}
                  className="w-4 h-4 rounded text-primary border-border focus:ring-primary cursor-pointer"
                />
              </div>

              <div className="pt-2 flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(2)}
                  className="h-8 text-xs"
                >
                  Back
                </Button>
                <Button
                  size="sm"
                  onClick={() => setStep(4)}
                  className="h-8 text-xs bg-primary text-primary-foreground font-semibold gap-1"
                >
                  <span>View Recommendations ({matchedProducts.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: RECOMMENDATIONS RESULT */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Top Recommended Software ({matchedProducts.length} matched)
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="h-6 px-2 text-xs text-primary hover:text-primary/80"
                >
                  Refine Criteria
                </Button>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {matchedProducts.slice(0, 5).map(({ product, reasons }, idx) => (
                  <div
                    key={product.id}
                    className="p-3.5 rounded-xl bg-muted/30 border border-border/80 hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-2xl shrink-0 shadow-sm">
                        {product.logo}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-foreground text-xs truncate">{product.name}</span>
                          <Badge variant="secondary" className="text-[10px] py-0 h-4">
                            {product.pricingModel}
                          </Badge>
                          {idx === 0 && (
                            <Badge className="text-[10px] py-0 h-4 bg-primary text-primary-foreground font-semibold">
                              Top Match
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mb-1.5">
                          {product.summary || product.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {reasons.slice(0, 2).map((r, i) => (
                            <span key={i} className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" />
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <Link to={`/tools/${product.id}`} onClick={() => setIsOpen(false)}>
                        <Button size="sm" className="h-7 px-2.5 text-xs bg-primary text-primary-foreground font-semibold">
                          Read Review
                        </Button>
                      </Link>
                      <Link to={`/tools/compare?ids=${product.id}`} onClick={() => setIsOpen(false)}>
                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                          Compare
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
