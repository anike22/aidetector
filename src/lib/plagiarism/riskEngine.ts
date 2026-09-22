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

  // Measure matched character spans
  let uncitedChars = 0;
  let citedChars = 0;
  let falsePositiveChars = 0;

  for (const match of evidenceMatches) {
    const spanLen = Math.max(0, match.submittedEnd - match.submittedStart);
    if (match.isExcludedByFalsePositiveFilter) {
      falsePositiveChars += spanLen;
    } else if (match.attributionStatus === 'properly_cited') {
      citedChars += spanLen;
    } else {
      uncitedChars += spanLen;
    }
  }

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
