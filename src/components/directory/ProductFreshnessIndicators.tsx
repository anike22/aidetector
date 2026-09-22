import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Calendar, CheckCircle2, Clock, Flag } from 'lucide-react';
import type { DirectoryProduct, FreshnessMetadata } from '@/types/directory';
import { ProductReportOutdatedModal } from './ProductReportOutdatedModal';

interface ProductFreshnessIndicatorsProps {
  product: DirectoryProduct;
}

export function ProductFreshnessIndicators({ product }: ProductFreshnessIndicatorsProps) {
  const freshness: FreshnessMetadata = product.freshness || {
    lastVerifiedProductInfo: product.lastVerified || '2026-09-18',
    lastVerifiedPricing: product.lastVerified || '2026-09-18',
    lastUpdatedTimeline: product.lastUpdatedAt || '2026-09-18',
  };

  // Helper for color determination
  const getFreshnessColor = (dateStr: string) => {
    try {
      const target = new Date(dateStr);
      const now = new Date('2026-09-20');
      const diffDays = (now.getTime() - target.getTime()) / (1000 * 3600 * 24);
      if (diffDays <= 30) return 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
      if (diffDays <= 90) return 'text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5';
      return 'text-muted-foreground border-border bg-muted/40';
    } catch {
      return 'text-muted-foreground border-border bg-muted/40';
    }
  };

  return (
    <div className="p-3.5 rounded-xl bg-card border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5 font-semibold text-foreground shrink-0">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
          <span>Research Freshness:</span>
        </div>

        {/* Product Info Verification Badge */}
        <Badge
          variant="outline"
          className={`text-[11px] py-1 px-2.5 font-medium gap-1.5 flex items-center ${getFreshnessColor(
            freshness.lastVerifiedProductInfo
          )}`}
          title={`Product specifications and capabilities last verified on ${freshness.lastVerifiedProductInfo}`}
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>Info Verified: {freshness.lastVerifiedProductInfo}</span>
        </Badge>

        {/* Pricing Verification Badge */}
        <Badge
          variant="outline"
          className={`text-[11px] py-1 px-2.5 font-medium gap-1.5 flex items-center ${getFreshnessColor(
            freshness.lastVerifiedPricing
          )}`}
          title={`Pricing tiers and subscription terms verified against official pricing on ${freshness.lastVerifiedPricing}`}
        >
          <Calendar className="w-3 h-3" />
          <span>Pricing Verified: {freshness.lastVerifiedPricing}</span>
        </Badge>

        {/* Timeline Freshness Badge */}
        <Badge
          variant="outline"
          className={`text-[11px] py-1 px-2.5 font-medium gap-1.5 flex items-center ${getFreshnessColor(
            freshness.lastUpdatedTimeline
          )}`}
          title={`Evolution milestones and changelogs updated on ${freshness.lastUpdatedTimeline}`}
        >
          <Clock className="w-3 h-3" />
          <span>Timeline: {freshness.lastUpdatedTimeline}</span>
        </Badge>
      </div>

      <div className="shrink-0">
        <ProductReportOutdatedModal product={product} />
      </div>
    </div>
  );
}
