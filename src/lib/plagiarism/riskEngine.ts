/**
 * Plagiarism Risk & Attribution Scoring Engine
 *
 * Explicitly separates raw similarity % from actual Plagiarism Risk level.
 * Factors in citation status, quotation marks, match concentration, and false positives.
 */

import type { PlagiarismRiskLevel, ForensicEvidenceMatch } from './types';

export interface RiskAnalysis {
  riskLevel: PlagiarismRiskLevel;
  uncitedDirectMatchPercentage: number;
  properlyCitedPercentage: number;
  falsePositiveFilteredPercentage: number;
  riskExplanation: string;
}

function mergeIntervals(intervals: Array<[number, number]>): Array<[number, number]> {
  if (intervals.length === 0) return [];
  const sorted = intervals
    .map(([s, e]) => [Math.min(s, e), Math.max(s, e)] as [number, number])
    .filter(([s, e]) => e > s)
    .sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = sorted[i];
    if (curr[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], curr[1]);
    } else {
      merged.push(curr);
    }
  }
  return merged;
}

function sumIntervals(intervals: Array<[number, number]>): number {
  return mergeIntervals(intervals).reduce((sum, [s, e]) => sum + (e - s), 0);
}

export function computePlagiarismRisk(
  totalChars: number,
  evidenceMatches: ForensicEvidenceMatch[],
  rawSimilarityPercentage: number,
  isPartialCoverage: boolean = false
): RiskAnalysis {
  if (totalChars === 0 || evidenceMatches.length === 0 || rawSimilarityPercentage === 0) {
    if (isPartialCoverage) {
      return {
        riskLevel: 'Limited Coverage',
        uncitedDirectMatchPercentage: 0,
        properlyCitedPercentage: 0,
        falsePositiveFilteredPercentage: 0,
        riskExplanation: 'No verified matches found in completed searches. Assessment confidence is limited by partial source coverage.',
      };
    }
    return {
      riskLevel: 'None',
      uncitedDirectMatchPercentage: 0,
      properlyCitedPercentage: 0,
      falsePositiveFilteredPercentage: 0,
      riskExplanation: 'No overlapping passages detected in verified sources.',
    };
  }

  // Measure non-overlapping character spans
  const uncitedIntervals: Array<[number, number]> = [];
  const citedIntervals: Array<[number, number]> = [];
  const falsePositiveIntervals: Array<[number, number]> = [];

  for (const match of evidenceMatches) {
    const s = Math.max(0, match.submittedStart);
    const e = Math.min(totalChars, match.submittedEnd);
    if (e <= s) continue;

    if (match.isExcludedByFalsePositiveFilter) {
      falsePositiveIntervals.push([s, e]);
    } else if (match.attributionStatus === 'properly_cited') {
      citedIntervals.push([s, e]);
    } else {
      uncitedIntervals.push([s, e]);
    }
  }

  const uncitedChars = sumIntervals(uncitedIntervals);
  const citedChars = sumIntervals(citedIntervals);
  const falsePositiveChars = sumIntervals(falsePositiveIntervals);

  const uncitedDirectMatchPercentage = Math.min(100, Math.round((uncitedChars / totalChars) * 100));
  const properlyCitedPercentage = Math.min(100, Math.round((citedChars / totalChars) * 100));
  const falsePositiveFilteredPercentage = Math.min(100, Math.round((falsePositiveChars / totalChars) * 100));

  let riskLevel: PlagiarismRiskLevel = 'Low';
  let riskExplanation = '';

  if (uncitedDirectMatchPercentage > 30) {
    riskLevel = 'High';
    riskExplanation = `High plagiarism risk: ${uncitedDirectMatchPercentage}% of text contains substantive unattributed direct or near matches. Immediate citation or rephrasing required.`;
  } else if (uncitedDirectMatchPercentage >= 10) {
    riskLevel = 'Medium';
    riskExplanation = `Moderate plagiarism risk: ${uncitedDirectMatchPercentage}% unattributed text overlap. Contains passages that require attribution review.`;
  } else if (uncitedDirectMatchPercentage > 0) {
    riskLevel = 'Low';
    riskExplanation = `Low plagiarism risk: ${uncitedDirectMatchPercentage}% minor unattributed similarity. Overall document exhibits strong original composition.`;
  } else if (properlyCitedPercentage > 0) {
    riskLevel = 'None';
    riskExplanation = `No significant plagiarism risk: All overlapping passages (${properlyCitedPercentage}%) are properly cited and attributed.`;
  } else {
    riskLevel = 'None';
    riskExplanation = 'No significant unmitigated plagiarism risk detected in searched indices.';
  }

  return {
    riskLevel,
    uncitedDirectMatchPercentage,
    properlyCitedPercentage,
    falsePositiveFilteredPercentage,
    riskExplanation,
  };
}
