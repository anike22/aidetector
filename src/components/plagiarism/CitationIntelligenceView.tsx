import React from 'react';
import type { CitationItem } from '@/lib/plagiarism/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface Props {
  citations: CitationItem[];
}

export function CitationIntelligenceView({ citations }: Props) {
  if (!citations || citations.length === 0) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
          No in-text citations or academic references (APA, MLA, Chicago, IEEE, Harvard) recognized in the submitted text.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border">
        <strong>Attribution Quality:</strong> Recognizes formal in-text citations, verifying author names, publication years, and format compliance.
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {citations.map((cit) => {
          const isOk = cit.status === 'properly_cited';
          const isWarning = cit.status === 'improperly_attributed_quote' || cit.status === 'incorrect_citation';

          return (
            <Card key={cit.id} className="border-border shadow-sm">
              <CardContent className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start sm:items-center gap-2.5">
                  {isOk ? (
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5 sm:mt-0" />
                  ) : isWarning ? (
                    <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5 sm:mt-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5 sm:mt-0" />
                  )}
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-foreground font-mono text-sm">
                      {cit.inTextCitation}
                    </span>
                    <span className="text-muted-foreground">
                      {cit.statusExplanation}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline">{cit.format} Format</Badge>
                  <Badge variant={isOk ? 'secondary' : 'destructive'} className="capitalize">
                    {cit.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
