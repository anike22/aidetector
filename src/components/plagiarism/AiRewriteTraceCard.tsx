import React from 'react';
import type { AiRewriteTraceMatch } from '@/lib/plagiarism/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';

interface Props {
  traces: AiRewriteTraceMatch[];
}

export function AiRewriteTraceCard({ traces }: Props) {
  if (!traces || traces.length === 0) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          <Bot className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
          No AI-assisted source rewrites or paraphraser transformations detected.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border">
        <strong>Forensic Rule:</strong> AI Rewrite Source Tracing examines information sequencing, uncommon fact preservation, and argument ordering. Cautious, probabilistic language is used rather than definitive claims.
      </div>

      <div className="grid grid-cols-1 gap-4">
        {traces.map((trace, idx) => (
          <Card key={trace.id || idx} className="border-border shadow-sm">
            <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-bold text-foreground">
                  {trace.cautiousVerdict}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {trace.confidence}% Confidence
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-3 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-muted/40 border border-border rounded-md text-xs">
                  <span className="font-semibold text-muted-foreground uppercase block mb-1">
                    Original Source Context
                  </span>
                  <p className="italic text-foreground leading-relaxed">
                    "{trace.sourcePassage}"
                  </p>
                  <div className="mt-2 text-muted-foreground">
                    Source: <span className="font-medium text-foreground">{trace.sourceTitle}</span>
                  </div>
                </div>

                <div className="p-3 bg-primary/5 border border-primary/20 rounded-md text-xs">
                  <span className="font-semibold text-primary uppercase block mb-1">
                    Submitted Transformation
                  </span>
                  <p className="italic text-foreground leading-relaxed">
                    "{trace.submittedPassage}"
                  </p>
                </div>
              </div>

              {/* Signals */}
              <div className="flex flex-col gap-1.5 pt-2 border-t border-border text-xs">
                <span className="font-semibold text-muted-foreground">Forensic Alignment Signals:</span>
                <div className="flex flex-wrap gap-1.5">
                  {trace.evidenceSignals.map((sig, sIdx) => (
                    <Badge key={sIdx} variant="outline" className="text-[11px] font-normal">
                      {sig}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
