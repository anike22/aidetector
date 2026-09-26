import React from 'react';
import type { IndividualSourceContribution } from '@/lib/plagiarism/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExternalLink, BookOpen, Globe, Link2 } from 'lucide-react';

interface Props {
  sources: IndividualSourceContribution[];
  overallSimilarity: number;
}

export function SourceBreakdownView({ sources, overallSimilarity }: Props) {
  if (!sources || sources.length === 0) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          No external source contributions to report.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border">
        <strong>Non-Overlapping Accounting:</strong> Individual source contributions represent unique matching passages. Overlapping passages are not counted multiple times toward the overall {overallSimilarity}% similarity score.
      </div>

      <div className="grid grid-cols-1 gap-2">
        {sources.map((src, idx) => (
          <Card key={idx} className="border-border shadow-sm">
            <CardContent className="p-3 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  {src.provider === 'web' ? (
                    <Globe className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  ) : (
                    <BookOpen className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  )}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-semibold text-foreground truncate text-sm" title={src.sourceTitle}>
                      {src.sourceTitle}
                    </span>
                    <span className="text-muted-foreground text-[11px]">{src.publisher} · {src.provider}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px]">{src.matchType}</Badge>
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {src.uniqueNonOverlappingPercentage}% Unique Contribution
                  </Badge>
                </div>
              </div>

              <Progress value={src.uniqueNonOverlappingPercentage} className="h-1.5" />

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border">
                <span>Passage match contribution: {src.matchContribution}%</span>
                <a
                  href={src.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <ExternalLink className="w-3 h-3" /> View Source Record
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
