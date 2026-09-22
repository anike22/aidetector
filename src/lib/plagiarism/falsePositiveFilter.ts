/**
 * False-Positive Reduction & Classification Engine
 *
 * Distinguishes academic terminology, common knowledge, idioms, and legal boilerplate
 * from actual unauthorized copying.
 */

import type { FalsePositiveCategory, FalsePositiveClassification } from './types';

// Common knowledge and standard academic idioms
const ACADEMIC_FORMULAS = [
  'in this paper, we propose', 'the results show that', 'further research is needed',
  'in accordance with the literature', 'data were collected and analyzed',
  'a statistically significant difference', 'as shown in table', 'as shown in figure',
  'the purpose of this study is', 'previous studies have demonstrated',
  'it is well established that', 'standard deviation of', 'confidence interval of',
  'p-value less than', 'linear regression model', 'principal component analysis',
  'cross-sectional study design', 'double-blind randomized controlled trial',
];

const COMMON_KNOWLEDGE_PHRASES = [
  'the earth revolves around the sun', 'water boils at 100 degrees celsius',
  'the capital of france is paris', 'dna is the hereditary material',
  'mitochondria are the powerhouse of the cell', 'newton published the principia mathematica',
  'world war ii ended in 1945', 'the speed of light in a vacuum',
  'oxygen is essential for cellular respiration', 'photosynthesis converts sunlight into energy',
];

const LEGAL_BOILERPLATE = [
  'without prejudice to the generality of the foregoing',
  'the terms and conditions set forth herein',
  'governed by and construed in accordance with',
  'in no event shall either party be liable',
  'indemnify, defend, and hold harmless',
  'severability of provisions',
  'entire agreement between the parties',
  'force majeure event beyond reasonable control',
  'all rights reserved',
  'privacy policy applies',
  'terms of service',
];

export function evaluateFalsePositive(
  passage: string,
  startIndex: number,
  endIndex: number,
  isProperlyCited: boolean
): FalsePositiveClassification {
  const norm = passage.toLowerCase().trim();

  if (isProperlyCited) {
    return {
      id: `fp_${startIndex}_${endIndex}`,
      spanText: passage,
      startIndex,
      endIndex,
      category: 'properly_cited',
      categoryLabel: 'Properly Cited',
      explanation: 'Passage contains valid citation/quotation attribution and is excluded from unmitigated risk.',
      isExcludedFromRisk: true,
    };
  }

  // Check Academic Formula
  for (const formula of ACADEMIC_FORMULAS) {
    if (norm.includes(formula) || formula.includes(norm)) {
      return {
        id: `fp_${startIndex}_${endIndex}`,
        spanText: passage,
        startIndex,
        endIndex,
        category: 'academic_terminology',
        categoryLabel: 'Academic Terminology',
        explanation: 'Standard scholarly convention/methodological phrasing commonly shared across academic papers.',
        isExcludedFromRisk: true,
      };
    }
  }

  // Check Common Knowledge
  for (const ck of COMMON_KNOWLEDGE_PHRASES) {
    if (norm.includes(ck) || ck.includes(norm)) {
      return {
        id: `fp_${startIndex}_${endIndex}`,
        spanText: passage,
        startIndex,
        endIndex,
        category: 'common_knowledge',
        categoryLabel: 'Common Knowledge',
        explanation: 'Widely recognized factual statement or standard definition in the public domain.',
        isExcludedFromRisk: true,
      };
    }
  }

  // Check Legal / Template Boilerplate
  for (const lb of LEGAL_BOILERPLATE) {
    if (norm.includes(lb) || lb.includes(norm)) {
      return {
        id: `fp_${startIndex}_${endIndex}`,
        spanText: passage,
        startIndex,
        endIndex,
        category: 'legal_boilerplate',
        categoryLabel: 'Legal / Template Boilerplate',
        explanation: 'Standardized institutional disclaimer or contract boilerplate.',
        isExcludedFromRisk: true,
      };
    }
  }

  // Short idioms
  if (norm.split(/\s+/).length <= 6 && (norm.startsWith('as a result') || norm.startsWith('on the other hand') || norm.startsWith('in addition to'))) {
    return {
      id: `fp_${startIndex}_${endIndex}`,
      spanText: passage,
      startIndex,
      endIndex,
      category: 'common_phrase',
      categoryLabel: 'Common Phrase',
      explanation: 'Standard linguistic transitional idiom.',
      isExcludedFromRisk: true,
    };
  }

  return {
    id: `fp_${startIndex}_${endIndex}`,
    spanText: passage,
    startIndex,
    endIndex,
    category: 'unattributed_match',
    categoryLabel: 'Unattributed Match',
    explanation: 'Substantive textual overlap without recognized boilerplate or citation attribution.',
    isExcludedFromRisk: false,
  };
}
