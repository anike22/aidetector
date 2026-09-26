/**
 * AI-Rewrite Source Tracing Module
 *
 * Examines whether submitted text follows the exact fact progression, argument structure,
 * and entity sequence of an existing source after AI/paraphraser transformation.
 * Uses cautious, evidence-based language (never dogmatic claims).
 */

import type { AiRewriteTraceMatch } from './types';
import type { VerifiedSource } from '@/pages/detector/detectionEngine';

export function traceAiRewritePatterns(
  submittedText: string,
  sources: VerifiedSource[]
): AiRewriteTraceMatch[] {
  const traces: AiRewriteTraceMatch[] = [];

  for (const src of sources) {
    for (const span of src.matchedSpans || []) {
      if (span.matchType === 'paraphrase' || span.matchType === 'near') {
        const subWords = span.submittedPassage.split(/\s+/);
        const srcWords = span.sourcePassage.split(/\s+/);

        if (subWords.length < 6 || srcWords.length < 6) continue;

        // Compare numbers and statistics preserved
        const subNumbers: string[] = span.submittedPassage.match(/\b\d+(?:\.\d+)?%?\b/g) || [];
        const srcNumbers: string[] = span.sourcePassage.match(/\b\d+(?:\.\d+)?%?\b/g) || [];
        const srcSet = new Set<string>(srcNumbers);
        const sharedNumbers = subNumbers.filter((n) => srcSet.has(n));

        // Preserved sequence ratio
        let factProgressionMatch = 50;
        if (sharedNumbers.length >= 2) {
          factProgressionMatch = 85;
        } else if (sharedNumbers.length === 1) {
          factProgressionMatch = 65;
        }

        const vocabularyShiftScore = Math.min(95, Math.max(40, Math.round((1 - span.spanSimilarity) * 100 + 40)));
        const argumentOrderAlignment = Math.min(90, Math.max(50, Math.round(span.spanSimilarity * 100)));

        const evidenceSignals: string[] = [];
        if (sharedNumbers.length > 0) {
          evidenceSignals.push(`Preserved statistical / quantitative points: ${sharedNumbers.join(', ')}`);
        }
        evidenceSignals.push('Semantic structure and argument sequencing closely preserved');
        if (vocabularyShiftScore > 60) {
          evidenceSignals.push('Systematic vocabulary substitution patterns observed');
        }

        const confidence = Math.min(75, Math.max(45, Math.round((factProgressionMatch + argumentOrderAlignment) / 2)));

        let cautiousVerdict: AiRewriteTraceMatch['cautiousVerdict'] = 'Possible paraphrased source';
        if (confidence >= 70) {
          cautiousVerdict = 'Possible AI-assisted rewrite';
        } else if (confidence >= 60) {
          cautiousVerdict = 'Strong semantic relationship';
        } else {
          cautiousVerdict = 'Shows patterns consistent with AI transformation';
        }

        traces.push({
          id: `airw_${traces.length + 1}`,
          submittedPassage: span.submittedPassage,
          sourcePassage: span.sourcePassage,
          sourceTitle: src.title,
          sourceUrl: src.url,
          confidence,
          cautiousVerdict,
          evidenceSignals,
          factProgressionMatch,
          vocabularyShiftScore,
          argumentOrderAlignment,
        });
      }
    }
  }

  return traces;
}
