import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  History,
  Sparkles,
  ArrowRight,
  Plus,
  Minus,
  ExternalLink,
  ShieldCheck,
  ArrowRightLeft,
  Info,
} from 'lucide-react';
import type { ProductEvolutionMilestone } from '@/types/directory';

interface ProductEvolutionTimelineProps {
  productName: string;
  milestones: ProductEvolutionMilestone[];
}

export function ProductEvolutionTimeline({ productName, milestones }: ProductEvolutionTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(milestones[0]?.id || null);
  const [compareV1, setCompareV1] = useState<string>(
    milestones.length >= 2 ? milestones[milestones.length - 1].id : (milestones[0]?.id || '')
  );
  const [compareV2, setCompareV2] = useState<string>(milestones[0]?.id || '');
  const [showComparator, setShowComparator] = useState<boolean>(false);

  if (!milestones || milestones.length === 0) {
    return null;
  }

  const v1Milestone = milestones.find(m => m.id === compareV1);
  const v2Milestone = milestones.find(m => m.id === compareV2);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div id="evolution" className="space-y-6 scroll-mt-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              {productName} Product Evolution & Architecture Timeline
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Factual milestone history tracking major model generations, capability expansions, and architectural shifts.
          </p>
        </div>

        {milestones.length >= 2 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowComparator(prev => !prev)}
            className={`h-8 text-xs gap-1.5 shrink-0 ${
              showComparator ? 'border-primary text-primary bg-primary/5' : ''
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>{showComparator ? 'Hide Version Comparator' : 'Compare Two Versions'}</span>
          </Button>
        )}
      </div>

      {/* Interactive Version / Generation Comparator */}
      {showComparator && v1Milestone && v2Milestone && (
        <Card className="bg-primary/5 border border-primary/20 rounded-2xl overflow-hidden shadow-sm">
          <CardHeader className="p-4 sm:p-5 bg-card border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Generation & Milestone Comparator
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Compare capability evolution and breaking architectural differences between releases.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-40">
                  <Select value={compareV1} onValueChange={setCompareV1}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Baseline version" />
                    </SelectTrigger>
                    <SelectContent>
                      {milestones.map(m => (
                        <SelectItem key={m.id} value={m.id} className="text-xs">
                          {m.versionOrModel} ({m.date.split('-')[0]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="w-40">
                  <Select value={compareV2} onValueChange={setCompareV2}>
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue placeholder="Target version" />
                    </SelectTrigger>
                    <SelectContent>
                      {milestones.map(m => (
                        <SelectItem key={m.id} value={m.id} className="text-xs">
                          {m.versionOrModel} ({m.date.split('-')[0]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* V1 Card */}
              <div className="p-4 rounded-xl bg-card border border-border/80 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs font-mono">
                    {v1Milestone.versionOrModel}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{v1Milestone.date}</span>
                </div>
                <h4 className="text-xs font-bold text-foreground">{v1Milestone.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{v1Milestone.summary}</p>
                <div className="space-y-1 pt-2 border-t border-border/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Core Capabilities Introduced
                  </span>
                  <ul className="space-y-1 text-xs text-foreground/80">
                    {v1Milestone.capabilitiesAdded.map((cap, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* V2 Card */}
              <div className="p-4 rounded-xl bg-card border border-primary/30 ring-1 ring-primary/20 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className="text-xs font-mono bg-primary text-primary-foreground">
                    {v2Milestone.versionOrModel}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{v2Milestone.date}</span>
                </div>
                <h4 className="text-xs font-bold text-foreground">{v2Milestone.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{v2Milestone.summary}</p>
                <div className="space-y-1 pt-2 border-t border-border/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Core Capabilities Introduced
                  </span>
                  <ul className="space-y-1 text-xs text-foreground/80">
                    {v2Milestone.capabilitiesAdded.map((cap, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Differential Breakdown */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 text-xs space-y-2">
              <span className="font-bold text-foreground block">Key Evolution Shifts Between Selected Milestones:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-muted-foreground">
                <div>
                  <strong className="text-foreground">Platform / Ecosystem Shift:</strong>{' '}
                  {v2Milestone.platformImpact || 'Continuous multi-platform updates'}
                </div>
                <div>
                  <strong className="text-foreground">Pricing & Access Model Impact:</strong>{' '}
                  {v2Milestone.pricingImpact || 'Maintained existing tier structure'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chronological Timeline List */}
      <div className="relative border-l-2 border-border ml-4 sm:ml-6 pl-5 sm:pl-7 space-y-6">
        {milestones.map((milestone, index) => {
          const isExpanded = expandedId === milestone.id;
          return (
            <div key={milestone.id} className="relative group">
              {/* Timeline Indicator Dot */}
              <div
                className={`absolute -left-[27px] sm:-left-[35px] top-1.5 w-4 h-4 rounded-full border-2 bg-card flex items-center justify-center transition-all ${
                  milestone.isCurrent
                    ? 'border-primary ring-4 ring-primary/20 bg-primary'
                    : 'border-muted-foreground/40 group-hover:border-primary'
                }`}
              >
                {milestone.isCurrent && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
              </div>

              {/* Milestone Card */}
              <div
                className={`rounded-2xl border transition-all ${
                  milestone.isCurrent
                    ? 'bg-card border-primary/40 shadow-sm'
                    : 'bg-card/70 border-border hover:border-border/90'
                }`}
              >
                <div
                  onClick={() => toggleExpand(milestone.id)}
                  className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={milestone.isCurrent ? 'default' : 'secondary'}
                        className="text-xs font-mono font-bold"
                      >
                        {milestone.versionOrModel}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {milestone.date}
                      </span>
                      {milestone.isCurrent && (
                        <Badge className="text-[10px] py-0 h-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                          Current Primary Architecture
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-foreground">{milestone.title}</h3>

                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {milestone.summary}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(milestone.id);
                    }}
                    className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-2 border-t border-border/60 space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Added Capabilities */}
                      <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1.5">
                        <span className="font-bold text-foreground flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5 text-primary" />
                          Major Capabilities Added
                        </span>
                        <ul className="space-y-1 text-muted-foreground">
                          {milestone.capabilitiesAdded.map((cap, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-primary font-bold">•</span>
                              <span>{cap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Major Architectural Changes */}
                      <div className="p-3 rounded-xl bg-muted/30 border border-border/60 space-y-1.5">
                        <span className="font-bold text-foreground flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          Key Architectural Changes
                        </span>
                        <ul className="space-y-1 text-muted-foreground">
                          {milestone.majorChanges.map((change, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-amber-500 font-bold">•</span>
                              <span>{change}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Pricing and Platform impacts */}
                    {(milestone.pricingImpact || milestone.platformImpact) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-background border border-border/80">
                        {milestone.pricingImpact && (
                          <div>
                            <span className="font-bold text-foreground block text-[11px]">
                              Pricing & Tier Impact
                            </span>
                            <span className="text-muted-foreground text-xs">{milestone.pricingImpact}</span>
                          </div>
                        )}
                        {milestone.platformImpact && (
                          <div>
                            <span className="font-bold text-foreground block text-[11px]">
                              Platform Availability Impact
                            </span>
                            <span className="text-muted-foreground text-xs">{milestone.platformImpact}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Source reference */}
                    {milestone.sourceRef && (
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-500" />
                          Verified source: {milestone.sourceRef.title} ({milestone.sourceRef.lastChecked})
                        </span>
                        <a
                          href={milestone.sourceRef.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline flex items-center gap-0.5"
                        >
                          <span>Official Announcement</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
