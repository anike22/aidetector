import React from 'react';
import type { FalsePositiveClassification } from '@/lib/plagiarism/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Filter, CheckCircle2, Info } from 'lucide-react';

interface Props {
  classifications: FalsePositiveClassification[];
}

export function FalsePositiveInspector({ classifications }: Props) {
  if (!classifications || classifications.length === 0) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          No boilerplate or academic idioms were filtered out.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border">
        <strong>False-Positive Mitigation:</strong> Academic phrases, common knowledge, and standardized boilerplate are classified transparently and excluded from aggravating your document's plagiarism risk.
      </div>

      <div className="grid grid-cols-1 gap-2">
        {classifications.map((item) => (
          <Card key={item.id} className="border-border shadow-sm">
            <CardContent className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground italic">
                    "{item.spanText}"
                  </span>
                  <span className="text-muted-foreground">{item.explanation}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline">{item.categoryLabel}</Badge>
                {item.isExcludedFromRisk && (
                  <Badge variant="secondary" className="text-success font-medium">
                    Excluded from Risk
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
