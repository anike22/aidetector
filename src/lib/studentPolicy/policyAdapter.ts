/**
 * Academic Policy Guidance Adapter
 *
 * Consumes detection results purely as READ-ONLY inputs alongside structured policy guidance.
 *
 * Rules:
 * - NEVER alters Balanced or Aggressive detector scores, verdicts, or sentence tags.
 * - NEVER inserts policy text into detector inputs.
 * - NEVER averages or combines Balanced and Aggressive scores.
 * - Enforces zero false-compliance labels.
 */

import type { BalancedDetectorResult } from '@/lib/detection/balancedDetectorService';
import type { AggressiveDetectorResult } from '@/lib/detection/aggressiveDetectorService';
import type {
  StructuredPolicyInterpretation,
  StudentDeclarationState,
  ActivityComparisonResult,
} from '@/types/studentPolicy';
import { evaluateStudentDeclaration } from './policyInterpreter';

export interface PolicyGuidanceSynthesis {
  // Detector facts (read-only)
  detectorAvailable: boolean;
  balancedAiScore: number | null;
  balancedVerdict: string | null;
  aggressiveAiScore: number | null;
  aggressiveVerdict: string | null;

  // Policy facts
  policyAvailable: boolean;
  policyStatus: string;
  policyStatusSummary: string;
  policySourceLabel: string;
  policySourceIdentifier: string;
  contentHash: string;

  // Numerical comparison (strictly evaluated without false claims)
  thresholdComparison: {
    hasExplicitThreshold: boolean;
    thresholdDescription: string;
    thresholdGuidance: string;
    isComparable: boolean;
    comparisonStatusText?: string;
    balancedComparisonNote?: string;
    aggressiveComparisonNote?: string;
    disclaimer: string;
  };

  // Declaration comparison
  declaredActivitiesCount: number;
  declarationEvaluations: ActivityComparisonResult[];

  // Conflict notice
  hasConflict: boolean;
  conflictNotice?: string;
}

export function synthesizeAcademicPolicyGuidance(options: {
  balancedResult?: BalancedDetectorResult | null;
  aggressiveResult?: AggressiveDetectorResult | null;
  interpretation?: StructuredPolicyInterpretation | null;
  declaration?: StudentDeclarationState | null;
}): PolicyGuidanceSynthesis {
  const { balancedResult, aggressiveResult, interpretation, declaration } = options;

  const bAi = balancedResult?.ai ?? (balancedResult as any)?.scores?.ai ?? null;
  const aAi = aggressiveResult?.ai ?? (aggressiveResult as any)?.scores?.ai ?? null;
  const detectorAvailable = bAi !== null || aAi !== null;

  const policyAvailable = !!interpretation && interpretation.status !== 'not-specified';
  const policyStatus = interpretation?.status || 'not-specified';
  const policyStatusSummary =
    interpretation?.ruleSummary ||
    interpretation?.statusSummary ||
    'No assignment AI policy supplied. Check with your instructor.';

  // Evaluate Numerical Threshold
  let comparisonStatusText: string | undefined;
  let balancedComparisonNote: string | undefined;
  let aggressiveComparisonNote: string | undefined;

  const threshold = interpretation?.numericalThreshold;
  const isComparable = threshold?.isInterchangeableWithAIDetector ?? false;

  if (threshold && threshold.type === 'aidetector-compatible' && threshold.percentageValue !== undefined) {
    const limit = threshold.percentageValue;
    const op = threshold.comparisonOperator || '<';

    if (bAi !== null) {
      const bSatisfied =
        op === '<' ? bAi < limit : op === '<=' ? bAi <= limit : op === '>' ? bAi > limit : bAi >= limit;
      balancedComparisonNote = bSatisfied
        ? `Balanced engine (${bAi}%) is below the stated numerical threshold (${limit}%).`
        : `Balanced engine (${bAi}%) exceeds the stated numerical threshold (${limit}%).`;
    }

    if (aAi !== null) {
      const aSatisfied =
        op === '<' ? aAi < limit : op === '<=' ? aAi <= limit : op === '>' ? aAi > limit : aAi >= limit;
      aggressiveComparisonNote = aSatisfied
        ? `High-Sensitivity engine (${aAi}%) is below the stated numerical threshold (${limit}%).`
        : `High-Sensitivity engine (${aAi}%) exceeds the stated numerical threshold (${limit}%).`;
    }

    comparisonStatusText = 'Numerical threshold explicitly specified for AIDetector.cx.';
  } else if (threshold && threshold.type === 'external-detector') {
    comparisonStatusText = threshold.guidanceText;
  } else if (threshold && threshold.type === 'actual-ai-usage') {
    comparisonStatusText = threshold.guidanceText;
  } else {
    comparisonStatusText = 'Accepted detection percentage: Not specified in the supplied policy.';
  }

  // Declaration comparison
  const declaredList = declaration?.declaredActivities || [];
  const declarationEvaluations = evaluateStudentDeclaration(declaredList, interpretation || null);

  return {
    detectorAvailable,
    balancedAiScore: bAi,
    balancedVerdict: balancedResult?.verdict || null,
    aggressiveAiScore: aAi,
    aggressiveVerdict: aggressiveResult?.risk ? `${aggressiveResult.risk} Risk` : null,

    policyAvailable,
    policyStatus,
    policyStatusSummary,
    policySourceLabel: interpretation?.sourceLabel || 'User-provided text',
    policySourceIdentifier: interpretation?.sourceIdentifier || 'Direct input',
    contentHash: interpretation?.contentHash || 'sha256-empty',

    thresholdComparison: {
      hasExplicitThreshold: threshold?.type !== 'none' && threshold !== undefined,
      thresholdDescription: threshold?.exactDescription || 'Accepted detection percentage: Not specified in the supplied policy.',
      thresholdGuidance: threshold?.guidanceText || 'A detection score alone does not determine assignment compliance.',
      isComparable,
      comparisonStatusText,
      balancedComparisonNote,
      aggressiveComparisonNote,
      disclaimer: 'This numerical comparison does not establish compliance with every assignment rule.',
    },

    declaredActivitiesCount: declaredList.length,
    declarationEvaluations,

    hasConflict: interpretation?.conflictsDetected ?? false,
    conflictNotice: interpretation?.conflictDetails,
  };
}
