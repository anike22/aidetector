import React from 'react';
import type { VisualSimilarityMatch } from '@/lib/plagiarism/visualPlagiarismEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Image, ExternalLink, Eye, AlertCircle } from 'lucide-react';

interface Props {
  matches: VisualSimilarityMatch[];
}

export function VisualPlagiarismView({ matches }: Props) {
  if (!matches || matches.length === 0) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          <Image className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
          No visual figure, diagram, or chart plagiarism detected in submitted document.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border">
        <strong>Visual Perceptual Architecture:</strong> Compares perceptual hashes (dHash) and structural flow of charts, infographics, and scientific figures. Visual similarity is maintained separately from text scores.
      </div>

      <div className="grid grid-cols-1 gap-3">
        {matches.map((m) => (
          <Card key={m.id} className="border-border shadow-sm text-xs">
            <CardHeader className="py-2.5 px-4 border-b border-border flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-bold text-foreground">
                  {m.artifactType.toUpperCase()} Match
                </CardTitle>
                <Badge variant="outline" className="text-[10px]">
                  Distance: {m.perceptualHashDistance}/64
                </Badge>
              </div>
              <Badge variant="secondary">{m.confidenceScore}% Structural Match</Badge>
            </CardHeader>
            <CardContent className="p-3.5 flex flex-col gap-2">
              <div className="text-muted-foreground font-medium">Matched Source: {m.matchedSourceTitle}</div>
              <p className="text-muted-foreground">{m.explanation}</p>
              {m.detectedTransformations.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {m.detectedTransformations.map((t, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>
                  ))}
                </div>
              )}
              <div className="pt-2 border-t border-border flex justify-end">
                <a
                  href={m.matchedSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <ExternalLink className="w-3 h-3" /> View Original Figure
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
