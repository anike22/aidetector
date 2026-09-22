import React from 'react';
import type { PlagiarismAnalysisResult } from '@/pages/detector/detectionEngine';
import type { BalancedDetectorResult } from '@/lib/detection/balancedDetectorService';

interface SEOAssistantHighlightsProps {
  content: string;
  plagiarismResult: PlagiarismAnalysisResult | null;
  balancedResult: BalancedDetectorResult | null;
  plagiarismHighlightActive: boolean;
  balancedHighlightActive: boolean;
  onCloseHighlights?: () => void;
}

export function SEOAssistantHighlights({
  content,
  plagiarismResult,
  balancedResult,
  plagiarismHighlightActive,
  balancedHighlightActive,
  onCloseHighlights,
}: SEOAssistantHighlightsProps) {
  if (!plagiarismHighlightActive && !balancedHighlightActive) {
    return null;
  }

  // Extract plagiarism spans
  const plagiarismSpans = plagiarismHighlightActive && plagiarismResult
    ? plagiarismResult.sources.flatMap((s) => s.matchedSpans)
    : [];

  // Extract balanced detector high AI sentences
  const aiSentences = balancedHighlightActive && balancedResult?.full?.sentences
    ? balancedResult.full.sentences.filter((s) => s.aiProbability >= 50)
    : [];

  return (
    <div className="p-4 bg-muted/10 border-b border-border text-xs leading-relaxed max-h-60 overflow-y-auto font-sans">
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-navy text-[11px] uppercase tracking-wide">
            Active Highlights
          </span>
          {plagiarismHighlightActive && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-warning/20 text-warning px-1.5 py-0.5 rounded border border-warning/30">
              <span className="w-1.5 h-1.5 rounded-full bg-warning" />
              Plagiarism Matches ({plagiarismSpans.length})
            </span>
          )}
          {balancedHighlightActive && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded border border-destructive/30">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
              Balanced AI Signals ({aiSentences.length})
            </span>
          )}
        </div>
        {onCloseHighlights && (
          <button
            onClick={onCloseHighlights}
            className="text-[10px] text-muted-foreground hover:text-foreground font-medium"
          >
            Close Overlay
          </button>
        )}
      </div>

      <div className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
        {content.split('\n').map((para, pIdx) => {
          if (!para.trim()) return <br key={pIdx} />;
          return (
            <p key={pIdx} className="mb-2">
              {para}
            </p>
          );
        })}
      </div>
    </div>
  );
}
