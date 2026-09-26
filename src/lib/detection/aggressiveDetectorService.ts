// Aggressive Detector Service — adapter for High-Sensitivity Analysis (Strict screen)
// Calibrated to aggressively detect and score AI text high while flagging subtle AI patterns.
//
// Leverages both the SEO Assistant's analyzeAIRisk engine and the full multi-layer
// detection ensemble (analyzeAdvancedText) to ensure aggressive sensitivity and accurate high scores.

import { analyzeAIRisk } from '@/pages/seo-assistant/analysisEngine';
import { analyzeAdvancedText } from './engine';
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

  // If balancedResult was not provided, run the comprehensive multi-layer ensemble engine directly
  let balanced = balancedResult;
  if (!balanced && text.trim().length >= 25) {
    try {
      const adv = await analyzeAdvancedText(text);
      balanced = {
        ai: adv.overall.aiProbability,
        human: adv.overall.humanProbability,
        mixed: adv.overall.mixedProbability,
        verdict: adv.overall.verdict,
        risk: adv.overall.riskLevel,
        confidence: adv.overall.confidence,
        confidenceLevel: adv.overall.confidenceLevel,
        language: adv.language.primary?.name || 'English',
        engineVersion: adv.metadata.detectorVersion,
        modelVersion: adv.metadata.modelVersion,
        calibrationVersion: adv.metadata.calibrationVersion,
        languagePipelineVersion: adv.metadata.languagePipelineVersion,
        requestId: adv.metadata.requestId,
        analyzedAt: adv.metadata.analyzedAt,
        full: adv,
      };
    } catch {
      // Fallback cleanly to heuristic if advanced engine encounters error
    }
  }

  const baseAi = balanced?.ai ?? 0;
  const mixedSignal = balanced?.mixed ?? 0;
  const verdict = balanced?.verdict ?? '';
  const confidence = balanced?.confidence ?? 50;
  const isHighConfidence = balanced?.confidenceLevel !== 'Low' && confidence >= 35;

  // High-Sensitivity Strict Mode:
  // Designed as an aggressive screen to completely detect and score AI text high.
  let strictAi = raw.aiScore;

  const isClearAi =
    raw.aiScore >= 65 ||
    (isHighConfidence && baseAi >= 50) ||
    verdict === 'likely-ai' ||
    (baseAi >= 35 && raw.aiScore >= 45);

  const isModerateAi =
    raw.aiScore >= 40 ||
    (isHighConfidence && (baseAi >= 28 || mixedSignal >= 15)) ||
    (baseAi >= 25 && raw.aiScore >= 35);

  if (isClearAi) {
    // Clear AI text is aggressively detected and scored high (85%–98% AI, High Risk)
    strictAi = Math.max(
      raw.aiScore,
      Math.round(baseAi * 1.35 + mixedSignal * 0.85 + 16)
    );
    strictAi = Math.min(98, Math.max(85, strictAi));
  } else if (isModerateAi) {
    // Moderate/hybrid AI signals are strictly elevated to 52%–84%
    strictAi = Math.max(
      raw.aiScore,
      Math.round(baseAi * 1.25 + mixedSignal * 0.75 + 10)
    );
    strictAi = Math.min(84, Math.max(52, strictAi));
  } else {
    // Pure human writing with low balanced AI and human markers remains low
    strictAi = Math.max(
      raw.aiScore,
      Math.round(baseAi * 0.6 + mixedSignal * 0.5)
    );
    strictAi = Math.min(32, strictAi);
  }

  // Ensure invariant: strict AI can never be lower than verified balanced AI
  if (balancedResult || isHighConfidence) {
    strictAi = Math.max(strictAi, baseAi);
  }
  strictAi = Math.min(98, Math.max(4, strictAi));

  const finalHumanScore = 100 - strictAi;
  const finalRisk: 'Low' | 'Medium' | 'High' =
    strictAi >= 65 ? 'High' : strictAi >= 35 ? 'Medium' : 'Low';

  const recommendations = [...raw.recommendations];
  if (mixedSignal > 10 && !recommendations.some((r) => r.includes('mixed') || r.includes('Hybrid'))) {
    recommendations.unshift('Hybrid AI-assisted phrasing detected across sentences; strict screen flagged weaker AI traces.');
  }

  return {
    ai: strictAi,
    human: finalHumanScore,
    risk: finalRisk,
    recommendations,
  };
}
