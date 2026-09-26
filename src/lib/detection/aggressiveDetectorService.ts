// Aggressive Detector Service — adapter for High-Sensitivity Analysis (Strict screen)
// Calibrated to flag weaker AI-like patterns with higher sensitivity.
//
// When balancedResult is provided, it synthesizes the strict perspective over
// the balanced multi-layer ensemble ensuring strict sensitivity never drops below
// balanced AI signals and appropriately accounts for mixed AI-assisted phrasing.

import { analyzeAIRisk } from '@/pages/seo-assistant/analysisEngine';
import type { BalancedDetectorResult } from './balancedDetectorService';

export interface AggressiveDetectorResult {
  // Scores (0–100) — exactly two categories (no Mixed category on this card)
  ai: number;
  human: number;
  risk: 'Low' | 'Medium' | 'High';
  // Recommendations returned for actionable improvement
  recommendations: string[];
}

export interface AggressiveDetectorError {
  message: string;
  canRetry: boolean;
}

// runAggressiveDetector performs High-Sensitivity Analysis (Strict screen flagging weaker AI-like patterns).
export async function runAggressiveDetector(
  text: string,
  balancedResult?: BalancedDetectorResult
): Promise<AggressiveDetectorResult> {
  const raw = analyzeAIRisk(text);

  if (!balancedResult) {
    return {
      ai: raw.aiScore,
      human: raw.humanScore,
      risk: raw.riskLevel,
      recommendations: raw.recommendations,
    };
  }

  // High-Sensitivity Strict Mode:
  // 1. Stricter screen: weaker AI patterns and mixed / AI-assisted signals (mixedProbability)
  //    are factored into the AI score because strict mode has higher sensitivity and no separate "Mixed" bucket.
  // 2. Strict AI score must NEVER be lower than balanced AI score! (Invariant: strict sensitivity >= balanced)
  const mixedContribution = Math.round((balancedResult.mixed || 0) * 0.75);
  const baseAi = balancedResult.ai || 0;

  // Elevate AI score with lower strict detection threshold
  const elevatedAi = baseAi > 0
    ? Math.round(baseAi * 1.1 + mixedContribution)
    : Math.max(raw.aiScore, mixedContribution);

  const finalAiScore = Math.min(
    98,
    Math.max(
      baseAi, // Never lower than balanced AI
      raw.aiScore,
      elevatedAi
    )
  );

  const finalHumanScore = 100 - finalAiScore;
  const finalRisk: 'Low' | 'Medium' | 'High' =
    finalAiScore >= 65 ? 'High' : finalAiScore >= 35 ? 'Medium' : 'Low';

  const recommendations = [...raw.recommendations];
  if (balancedResult.mixed > 10 && !recommendations.some((r) => r.includes('mixed') || r.includes('Hybrid'))) {
    recommendations.unshift('Hybrid AI-assisted phrasing detected across sentences; strict screen flagged weaker AI traces.');
  }

  return {
    ai: finalAiScore,
    human: finalHumanScore,
    risk: finalRisk,
    recommendations,
  };
}
