import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ArrowRight,
  ArrowRightLeft,
  ExternalLink,
  Check,
  AlertCircle,
  Sparkles,
  Layers,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AI_DIRECTORY_PRODUCTS } from '@/data/aiDirectoryData';
import type { DirectoryProduct } from '@/types/directory';
import { useDirectoryCompare } from '@/context/DirectoryCompareContext';

interface ProductAlternativesSectionProps {
  currentProduct: DirectoryProduct;
}

interface AlternativeDifferentiator {
  product: DirectoryProduct;
  whyConsider: string[];
  tradeOffs: string[];
  keyDifferentiatorBadge: string;
}

export function ProductAlternativesSection({ currentProduct }: ProductAlternativesSectionProps) {
  const { addToCompare, isInCompare } = useDirectoryCompare();

  // Compute structured factual alternatives
  const alternativesList = useMemo<AlternativeDifferentiator[]>(() => {
    const candidates = AI_DIRECTORY_PRODUCTS.filter(p => p.id !== currentProduct.id);

    // Score candidates based on category overlap and functional similarity
    const scored = candidates.map(alt => {
      let score = 0;
      if (alt.primaryCategory === currentProduct.primaryCategory) score += 10;
      alt.categories.forEach(c => {
        if (currentProduct.categories.includes(c)) score += 3;
      });

      // Build structured reasons why someone might choose this alternative
      const whyConsider: string[] = [];
      const tradeOffs: string[] = [];
      let badge = 'Category Alternative';

      if (alt.isOpenWeight && !currentProduct.isOpenWeight) {
        whyConsider.push('Permits self-hosted, private offline deployment with full weight access');
        badge = 'Open Weights & Offline Privacy';
      }
      if (alt.hasFreePlan && !currentProduct.hasFreePlan) {
        whyConsider.push('Offers a permanent free tier with no recurring monthly subscription fee');
        badge = 'Permanent Free Plan';
      }
      if (alt.isOpenWeight || alt.openSource) {
        whyConsider.push('Completely free or open-source license with zero per-seat licensing cost');
        badge = '100% Free / Open Source';
      }
      if (alt.features.some(f => f.toLowerCase().includes('search') || f.toLowerCase().includes('citation'))) {
        whyConsider.push('Real-time web search with cited source links and index freshness');
        badge = 'Live Web Grounding';
      }
      if (alt.features.some(f => f.toLowerCase().includes('code') || f.toLowerCase().includes('git') || f.toLowerCase().includes('ide'))) {
        whyConsider.push('Deep native codebase integration and autonomous multi-file refactoring');
        badge = 'Code & IDE Integration';
      }
      if (alt.features.some(f => f.toLowerCase().includes('voice') || f.toLowerCase().includes('audio') || f.toLowerCase().includes('speech'))) {
        whyConsider.push('Ultra-low latency expressive voice cloning and multi-lingual speech');
        badge = 'Specialized Audio Synthesis';
      }

      // Default fallback differentiators if list is short
      if (whyConsider.length === 0) {
        whyConsider.push(`Optimized for ${alt.editorialAssessment?.bestFor || alt.primaryCategory}`);
        whyConsider.push(alt.features[0] || 'Distinct architectural interface and workflow');
      }

      // Limitations / trade-offs compared to current product
      if (currentProduct.hasFreePlan && !alt.hasFreePlan) {
        tradeOffs.push(`Unlike ${currentProduct.name}, requires a paid plan or API credit top-up`);
      }
      if (currentProduct.isOpenWeight && !alt.isOpenWeight) {
        tradeOffs.push('Proprietary cloud model; data is routed through vendor servers');
      }
      if (tradeOffs.length === 0) {
        tradeOffs.push(alt.limitations?.[0] || 'Different learning curve and platform ecosystem');
      }

      return {
        product: alt,
        whyConsider,
        tradeOffs,
        keyDifferentiatorBadge: badge,
        score,
      };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, 4);
  }, [currentProduct]);

  if (alternativesList.length === 0) return null;

  return (
    <div id="alternatives" className="space-y-6 scroll-mt-24">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-foreground">
            Top Verified Alternatives to {currentProduct.name}
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-pretty">
          Evidence-driven comparison of top alternatives, outlining specific reasons to consider each and key architectural trade-offs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alternativesList.map(({ product: alt, whyConsider, tradeOffs, keyDifferentiatorBadge }) => (
          <Card
            key={alt.id}
            className="bg-card border-border rounded-2xl flex flex-col justify-between hover:border-primary/40 transition-all shadow-sm group"
          >
            <CardHeader className="p-4 sm:p-5 pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                    {alt.logo}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                      {alt.name}
                      {alt.isOwnerProduct && (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] py-0 h-4 font-semibold">
                          AIDetector.cx
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      By {alt.company} • {alt.primaryCategory}
                    </CardDescription>
                  </div>
                </div>

                <Badge variant="outline" className="text-[10px] py-0.5 border-primary/30 text-primary font-medium shrink-0">
                  {keyDifferentiatorBadge}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 pt-0 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2.5 text-xs">
                {/* Why Consider Section */}
                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 space-y-1.5">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] uppercase tracking-wider block">
                    Why Consider {alt.name} Over {currentProduct.name}
                  </span>
                  <ul className="space-y-1 text-muted-foreground text-xs">
                    {whyConsider.map((reason, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-foreground/90">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Key Trade-off */}
                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1 text-xs">
                  <span className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider block">
                    Key Trade-Off / Caveat
                  </span>
                  <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{tradeOffs[0]}</span>
                  </p>
                </div>

                {/* Price & Platform metadata */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>
                    Pricing: <strong className="text-foreground">{alt.pricingModel}</strong>
                  </span>
                  <span>
                    Deployment: <strong className="text-foreground">{alt.supportsOfflineHosting ? 'Offline/Local' : 'Cloud SaaS'}</strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons: READ REVIEW & COMPARE */}
              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <Link to={`/tools/${alt.id}`} className="flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs font-semibold gap-1 hover:border-primary hover:text-primary"
                  >
                    <span>Read Review</span>
                    <ArrowRight className="w-3 h-3 ml-0.5" />
                  </Button>
                </Link>

                <Link to={`/compare/${currentProduct.id}-vs-${alt.id}`} className="flex-1">
                  <Button
                    size="sm"
                    className="w-full h-8 text-xs bg-primary text-primary-foreground font-semibold gap-1 shadow-xs"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Compare</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
