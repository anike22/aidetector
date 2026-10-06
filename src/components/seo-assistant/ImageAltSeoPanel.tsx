import { useState } from 'react';
import { Image as ImageIcon, CheckCircle2, AlertTriangle, Copy, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnalysisModule } from '@/pages/seo-assistant/AnalysisShared';
import type { ImageAltItem, ImageAltSeoResult } from '@/lib/seo/imageAltSeo';

function statusLabel(item: ImageAltItem) {
  switch (item.status) {
    case 'optimized': return 'Optimized';
    case 'missing': return 'Missing ALT';
    case 'decorative': return 'Decorative';
    case 'generic': return 'Generic ALT';
    case 'stuffed': return 'Over-optimized';
    case 'weak': return 'Weak ALT';
  }
}

export function ImageAltSeoPanel({
  result,
  onApplyFix,
}: {
  result: ImageAltSeoResult;
  onApplyFix?: (item: ImageAltItem) => void;
}) {
  const [copied, setCopied] = useState<number | null>(null);

  const copySuggestion = async (item: ImageAltItem) => {
    await navigator.clipboard.writeText(item.suggestion);
    setCopied(item.index);
    window.setTimeout(() => setCopied(null), 1500);
  };

  return (
    <AnalysisModule title="Image ALT Attribute SEO" score={result.score} defaultOpen={false}>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Checks article images for missing, generic, weak, empty, or over-optimized ALT attributes and suggests descriptive alternatives for SEO and accessibility.
        </p>

        <div className="grid grid-cols-4 gap-1.5">
          <div className="rounded border border-border bg-muted/20 p-2 text-center">
            <div className="text-sm font-bold text-foreground">{result.total}</div>
            <div className="text-[9px] text-muted-foreground">Images</div>
          </div>
          <div className="rounded border border-success/20 bg-success/5 p-2 text-center">
            <div className="text-sm font-bold text-success">{result.optimized}</div>
            <div className="text-[9px] text-muted-foreground">Optimized</div>
          </div>
          <div className="rounded border border-destructive/20 bg-destructive/5 p-2 text-center">
            <div className="text-sm font-bold text-destructive">{result.missing}</div>
            <div className="text-[9px] text-muted-foreground">Missing</div>
          </div>
          <div className="rounded border border-warning/20 bg-warning/5 p-2 text-center">
            <div className="text-sm font-bold text-warning">{result.needsWork}</div>
            <div className="text-[9px] text-muted-foreground">Needs Work</div>
          </div>
        </div>

        {result.total === 0 ? (
          <div className="rounded border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
            No Markdown or HTML images were detected in the article content.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {result.images.map((item) => {
              const good = item.status === 'optimized';
              const decorative = item.status === 'decorative';
              return (
                <div key={item.index} className="rounded border border-border bg-muted/10 p-2.5 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-foreground truncate">
                          {item.source || `Image ${item.index + 1}`}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{item.format.toUpperCase()} image</div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        good
                          ? 'text-[9px] border-success/30 bg-success/5 text-success'
                          : decorative
                          ? 'text-[9px] border-primary/30 bg-primary/5 text-primary'
                          : 'text-[9px] border-warning/30 bg-warning/5 text-warning'
                      }
                    >
                      {good ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                      {statusLabel(item)}
                    </Badge>
                  </div>

                  <div className="text-[10px] text-muted-foreground">{item.issue}</div>

                  {item.alt !== null && (
                    <div className="rounded bg-background border border-border/60 px-2 py-1.5">
                      <span className="text-[9px] font-semibold uppercase text-muted-foreground">Current ALT</span>
                      <div className="text-[11px] text-foreground mt-0.5 break-words">{item.alt || '(empty)'}</div>
                    </div>
                  )}

                  {!good && !decorative && (
                    <div className="rounded bg-primary/5 border border-primary/20 px-2 py-2">
                      <div className="flex items-center gap-1 text-[9px] font-semibold uppercase text-primary">
                        <Sparkles className="w-3 h-3" /> Suggested ALT
                      </div>
                      <div className="text-[11px] text-foreground mt-1 break-words">{item.suggestion}</div>
                      <div className="flex gap-1.5 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copySuggestion(item)}
                          className="h-6 text-[10px] gap-1 flex-1"
                        >
                          {copied === item.index ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copied === item.index ? 'Copied' : 'Copy ALT'}
                        </Button>
                        {onApplyFix && (
                          <Button
                            size="sm"
                            onClick={() => onApplyFix(item)}
                            className="h-6 text-[10px] gap-1 flex-1"
                          >
                            <Sparkles className="w-3 h-3" /> Apply Fix
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {decorative && (
                    <div className="text-[10px] text-muted-foreground">
                      Keep <code>alt=""</code> only if this image is purely decorative. If it conveys meaning, replace it with descriptive ALT text.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AnalysisModule>
  );
}
