import React, { useState } from 'react';
import type { ForensicEvidenceMatch } from '@/lib/plagiarism/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ExternalLink, ShieldCheck, AlertTriangle, ArrowRight, BookOpen } from 'lucide-react';

interface Props {
  text: string;
  matches: ForensicEvidenceMatch[];
}

export function PlagiarismHeatmap({ text, matches }: Props) {
  const [selectedMatch, setSelectedMatch] = useState<ForensicEvidenceMatch | null>(null);

  if (!text) return null;

  // Render text segments with interactive click and hover highlights
  const elements: React.ReactNode[] = [];
  let currentIndex = 0;

  // Sort matches by submittedStart
  const sortedMatches = [...matches].sort((a, b) => a.submittedStart - b.submittedStart);

  sortedMatches.forEach((m, idx) => {
    if (m.submittedStart > currentIndex) {
      elements.push(
        <span key={`plain_${currentIndex}`}>
          {text.slice(currentIndex, m.submittedStart)}
        </span>
      );
    }

    const start = Math.max(0, m.submittedStart);
    const end = Math.min(text.length, m.submittedEnd);
    const segmentText = text.slice(start, end) || m.submittedPassage;

    let highlightBg = 'bg-destructive/20 text-destructive border-b-2 border-destructive';
    if (m.category === 'near') {
      highlightBg = 'bg-warning/25 text-warning-foreground border-b-2 border-warning';
    } else if (m.category === 'paraphrase') {
      highlightBg = 'bg-primary/20 text-primary border-b-2 border-primary';
    } else if (m.attributionStatus === 'properly_cited') {
      highlightBg = 'bg-success/20 text-success border-b-2 border-success';
    } else if (m.isExcludedByFalsePositiveFilter) {
      highlightBg = 'bg-muted text-muted-foreground border-b-2 border-border';
    }

    elements.push(
      <span
        key={`match_${idx}_${start}`}
        onClick={() => setSelectedMatch(m)}
        title={`Click to inspect forensic evidence · ${m.categoryLabel} (${m.confidence}% confidence)`}
        className={`px-1 py-0.5 rounded cursor-pointer transition-colors hover:opacity-80 mx-0.5 inline font-medium ${highlightBg}`}
      >
        {segmentText}
      </span>
    );

    currentIndex = Math.max(currentIndex, end);
  });

  if (currentIndex < text.length) {
    elements.push(
      <span key={`plain_tail_${currentIndex}`}>
        {text.slice(currentIndex)}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2 text-xs py-1.5 border-b border-border">
        <span className="font-semibold text-muted-foreground mr-1">Heatmap Legend:</span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
          <span>Exact Match</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-warning" />
          <span>Near Match</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span>Paraphrased</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-success" />
          <span>Properly Cited</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground" />
          <span>Boilerplate / Academic</span>
        </span>
      </div>

      {/* Text Container */}
      <div className="p-4 bg-muted/20 border border-border rounded-lg text-sm leading-relaxed whitespace-pre-wrap font-sans max-h-[420px] overflow-y-auto">
        {elements}
      </div>

      {/* Match Evidence Modal */}
      <Dialog open={!!selectedMatch} onOpenChange={(open) => !open && setSelectedMatch(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-between">
              <span>Forensic Evidence Details</span>
              {selectedMatch && (
                <Badge variant="outline" className="font-medium">
                  {selectedMatch.categoryLabel} · {selectedMatch.confidence}% confidence
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Direct comparison between submitted passage and discovered source.
            </DialogDescription>
          </DialogHeader>

          {selectedMatch && (
            <div className="flex flex-col gap-4 mt-2 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 p-3 bg-destructive/5 border border-destructive/20 rounded-md">
                  <span className="text-xs font-semibold text-destructive uppercase">Submitted Passage</span>
                  <p className="text-xs text-foreground italic leading-relaxed">
                    "{selectedMatch.submittedPassage}"
                  </p>
                </div>
                <div className="flex flex-col gap-1 p-3 bg-muted border border-border rounded-md">
                  <span className="text-xs font-semibold text-muted-foreground uppercase">Matched Source Passage</span>
                  <p className="text-xs text-foreground italic leading-relaxed">
                    "{selectedMatch.sourcePassage}"
                  </p>
                </div>
              </div>

              {/* Attribution Status */}
              <div className="p-3 bg-muted/40 border border-border rounded-md flex items-start gap-2.5 text-xs">
                {selectedMatch.attributionStatus === 'properly_cited' ? (
                  <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                )}
                <div>
                  <strong>Attribution Status:</strong> {selectedMatch.attributionExplanation}
                </div>
              </div>

              {/* Source Details */}
              <div className="flex flex-col gap-1.5 p-3 bg-card border border-border rounded-md text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{selectedMatch.sourceTitle}</span>
                  <Badge variant="secondary" className="text-[10px]">{selectedMatch.sourceProvider}</Badge>
                </div>
                <div className="text-muted-foreground">Publisher: {selectedMatch.sourcePublisher}</div>
                {selectedMatch.sourceDoi && <div className="text-muted-foreground">DOI: {selectedMatch.sourceDoi}</div>}
                <a
                  href={selectedMatch.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 font-medium mt-1 truncate"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  {selectedMatch.sourceUrl}
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
