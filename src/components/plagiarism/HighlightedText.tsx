/**
 * HighlightedText
 *
 * Renders submitted text with inline colour overlays based on matchedSpan
 * character offsets returned by the plagiarism-checker Edge Function.
 *
 * Span priority (highest → lowest): exact > near > semantic
 * Colours follow the design-system semantic tokens so they work in dark mode.
 */

import { useMemo } from 'react';
import type { MatchedSpan } from '@/pages/detector/detectionEngine';

interface SpanSegment {
  text: string;
  type: 'exact' | 'near' | 'semantic' | null;
  /** Tooltip label for hover */
  label?: string;
}

interface Props {
  text: string;
  /** Flat list of all matchedSpans from every VerifiedSource */
  spans: MatchedSpan[];
  className?: string;
}

// Priority order for overlapping spans
const PRIORITY: Record<MatchedSpan['matchType'], number> = {
  exact: 3, near: 2, semantic: 1,
};

function buildSegments(text: string, spans: MatchedSpan[]): SpanSegment[] {
  if (!text || !spans.length) return [{ text, type: null }];

  // Build a per-character type map (highest priority wins)
  const typeMap = new Uint8Array(text.length); // 0=none,1=semantic,2=near,3=exact
  const labelMap: (string | undefined)[] = new Array(text.length);

  for (const span of spans) {
    const start = Math.max(0, span.submittedStart);
    const end   = Math.min(text.length, span.submittedEnd);
    if (start >= end) continue;
    const p = PRIORITY[span.matchType];
    const label = `${span.matchType === 'exact' ? 'Exact' : span.matchType === 'near' ? 'Near' : 'Semantic'} match · ${Math.round(span.spanSimilarity * 100)}%`;
    for (let i = start; i < end; i++) {
      if (p > typeMap[i]) {
        typeMap[i] = p;
        labelMap[i] = label;
      }
    }
  }

  // Convert map to run-length encoded segments
  const segments: SpanSegment[] = [];
  let i = 0;
  while (i < text.length) {
    const code = typeMap[i];
    const lbl  = labelMap[i];
    const type: SpanSegment['type'] =
      code === 3 ? 'exact' : code === 2 ? 'near' : code === 1 ? 'semantic' : null;
    let j = i + 1;
    while (j < text.length && typeMap[j] === code) j++;
    segments.push({ text: text.slice(i, j), type, label: lbl });
    i = j;
  }
  return segments;
}

const HIGHLIGHT_CLASSES: Record<NonNullable<SpanSegment['type']>, string> = {
  exact:    'bg-destructive/20 text-destructive underline decoration-destructive/60 decoration-wavy underline-offset-2 cursor-help',
  near:     'bg-warning/25 text-warning-foreground underline decoration-warning/60 decoration-wavy underline-offset-2 cursor-help',
  semantic: 'bg-yellow-200/40 dark:bg-yellow-400/20 underline decoration-yellow-500/50 decoration-dashed underline-offset-2 cursor-help',
};

export default function HighlightedText({ text, spans, className = '' }: Props) {
  const segments = useMemo(() => buildSegments(text, spans), [text, spans]);

  return (
    <div
      className={`whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground ${className}`}
      aria-label="Text with plagiarism highlights"
    >
      {segments.map((seg, i) =>
        seg.type ? (
          <mark
            key={i}
            title={seg.label}
            className={`rounded-[2px] px-px ${HIGHLIGHT_CLASSES[seg.type]}`}
            style={{ background: 'inherit' }}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </div>
  );
}

/** Legend strip — place below the highlighted text */
export function HighlightLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground mt-2">
      <span className="font-medium">Highlights:</span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-3 rounded-sm bg-destructive/25 border border-destructive/40" />
        Exact match
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-3 rounded-sm bg-warning/30 border border-warning/40" />
        Near / paraphrase
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-3 rounded-sm bg-yellow-200/60 dark:bg-yellow-400/25 border border-yellow-400/50" />
        Semantic similarity
      </span>
    </div>
  );
}
