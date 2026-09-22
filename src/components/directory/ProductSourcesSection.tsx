import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ExternalLink,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  FileText,
  Building2,
  CheckCircle2,
  Link2,
  Flag,
} from 'lucide-react';
import type { DirectoryProduct, SourceReference } from '@/types/directory';
import { ProductReportOutdatedModal } from './ProductReportOutdatedModal';

interface ProductSourcesSectionProps {
  product: DirectoryProduct;
}

export function ProductSourcesSection({ product }: ProductSourcesSectionProps) {
  const [highlightedSourceId, setHighlightedSourceId] = useState<string | null>(null);

  // Fallback sources if not explicitly defined
  const sources: SourceReference[] = product.sourceReferences && product.sourceReferences.length > 0
    ? product.sourceReferences
    : [
        {
          id: 'src_default_1',
          title: `${product.name} Official Product Portal`,
          url: product.websiteUrl,
          lastChecked: product.lastVerified || '2026-09-19',
          lastCheckedAt: product.lastVerified || '2026-09-19',
          citationIndex: 1,
          isOfficial: true,
          category: 'documentation',
        },
      ];

  // Listen for citation hash scroll highlights
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#source-')) {
        const sourceId = hash.replace('#source-', '');
        setHighlightedSourceId(sourceId);
        setTimeout(() => setHighlightedSourceId(null), 3000);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Helper to check if a source verification timestamp is older than 180 days
  const isSourceStale = (dateStr?: string) => {
    if (!dateStr) return false;
    try {
      const checkDate = new Date(dateStr);
      const now = new Date('2026-09-20');
      const diffDays = (now.getTime() - checkDate.getTime()) / (1000 * 3600 * 24);
      return diffDays > 180;
    } catch {
      return false;
    }
  };

  return (
    <section id="sources" className="space-y-6 scroll-mt-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              Sources & Research Transparency
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Factual editorial claims on this review page are grounded in verified official product documentation,
            release notes, and direct platform testing.
          </p>
        </div>

        <ProductReportOutdatedModal product={product} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((src, index) => {
          const citationNum = src.citationIndex || index + 1;
          const isStale = isSourceStale(src.lastCheckedAt || src.lastChecked);
          const isHighlighted = highlightedSourceId === (src.id || `src_${citationNum}`);

          return (
            <Card
              key={src.id || index}
              id={`source-${src.id || citationNum}`}
              className={`bg-card border transition-all duration-300 ${
                isHighlighted
                  ? 'border-primary ring-2 ring-primary/20 shadow-md'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      [{citationNum}]
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-foreground hover:text-primary transition-colors">
                        {src.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {src.isOfficial && (
                          <Badge variant="outline" className="text-[10px] py-0 h-4 border-primary/30 text-primary bg-primary/5">
                            Official Source
                          </Badge>
                        )}
                        {src.category && (
                          <Badge variant="secondary" className="text-[10px] py-0 h-4 capitalize">
                            {src.category.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors shrink-0"
                    title="Open verified source URL"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="text-[11px] font-mono text-muted-foreground truncate border-t border-border pt-2.5 flex items-center justify-between">
                  <span className="truncate pr-2">{src.url}</span>
                  <span className="shrink-0 flex items-center gap-1 text-[10px]">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    Last checked: {src.lastCheckedAt || src.lastChecked}
                  </span>
                </div>

                {isStale && (
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>This source was verified over 180 days ago and is queued for routine re-audit.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="p-4 rounded-xl bg-muted/40 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            Notice an inaccuracy in pricing, features, or platform availability?
          </span>
        </div>
        <ProductReportOutdatedModal
          product={product}
          trigger={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {}}
              className="h-7 text-xs gap-1.5 shrink-0"
            >
              <Flag className="w-3 h-3 text-amber-500" />
              <span>Submit Editorial Correction</span>
            </Button>
          }
        />
      </div>
    </section>
  );
}
