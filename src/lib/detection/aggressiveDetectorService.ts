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

  // Extract multi-layer machine learning classifier probabilities if present
  const fullResult = balanced?.full;
  const classProbs =
    fullResult?.metadata?.classProbabilities ||
    (fullResult as any)?.classProbabilities;
  const classifierAi = classProbs
    ? Math.round(
        ((classProbs.ai ?? 0) +
          (classProbs['translated-ai'] ?? 0) +
          (classProbs['human-edited-ai'] ?? 0)) *
          100
      )
    : 0;

  // Sentence-level AI verification
  const sentences = fullResult?.sentences || [];
  const aiSentenceCount = sentences.filter(
    (s) => s.verdict && (s.verdict.includes('ai') || s.verdict === 'mixed')
  ).length;
  const sentenceAiRatio =
    sentences.length > 0 ? (aiSentenceCount / sentences.length) * 100 : 0;

  // Combined AI & assisted signals
  const combinedAiSignal = baseAi + mixedSignal * 0.75;
  const hasVerifiableAiAssistance =
    verdict.includes('ai') ||
    verdict.includes('mixed') ||
    verdict === 'mostly-ai-human-edited' ||
    verdict === 'mostly-human-ai-assisted';

  const isHighConfidence =
    balanced?.confidenceLevel !== 'Low' && confidence >= 40;

  // Check if balanced detector or linguistic engine verified natural human writing
  const isVerifiedHuman =
    (balanced &&
      (verdict === 'likely-human' ||
        verdict === 'mostly-human' ||
        (balanced.human >= 75 && baseAi <= 15 && mixedSignal <= 15))) ||
    (raw.aiScore < 30 &&
      raw.recommendations.some((r) =>
        r.includes('align with natural human writing')
      ) &&
      verdict !== 'likely-ai');

  // High-Sensitivity Strict Mode:
  // Designed as an aggressive screen to decisively detect and score AI text high.
  // Flags clear AI, AI-assisted, and hybrid synthetic patterns.
  // Preserves genuine human prose when verified natural human writing is detected.
  const isStrictAi =
    !isVerifiedHuman &&
    (raw.aiScore >= 65 ||
      (isHighConfidence &&
        (classifierAi >= 35 ||
          baseAi >= 22 ||
          combinedAiSignal >= 24 ||
          (hasVerifiableAiAssistance &&
            (baseAi >= 16 || classifierAi >= 25 || mixedSignal >= 8)) ||
          sentenceAiRatio >= 20 ||
          verdict === 'likely-ai' ||
          verdict === 'mostly-ai-human-edited')));

  const isModerateAi =
    !isVerifiedHuman &&
    (raw.aiScore >= 38 ||
      (isHighConfidence &&
        (classifierAi >= 18 ||
          baseAi >= 15 ||
          combinedAiSignal >= 18 ||
          mixedSignal >= 12 ||
          sentenceAiRatio >= 10)));

  let strictAi: number;

  if (isStrictAi) {
    // Clear AI or assisted text is aggressively detected and scored high (86%–98% AI, High Risk)
    const candidate = Math.max(
      raw.aiScore,
      classifierAi > 0 ? Math.round(classifierAi * 1.15 + 10) : 0,
      Math.round(baseAi * 1.5 + mixedSignal * 0.9 + 20)
    );
    strictAi = Math.min(98, Math.max(86, candidate));
  } else if (isModerateAi) {
    // Moderate/hybrid AI signals are strictly elevated to 52%–84%
    const candidate = Math.max(
      raw.aiScore,
      classifierAi > 0 ? Math.round(classifierAi * 1.1) : 0,
      Math.round(baseAi * 1.25 + mixedSignal * 0.75 + 10)
    );
    strictAi = Math.min(84, Math.max(52, candidate));
  } else {
    // Verified or consistent human writing with low balanced AI remains low
    strictAi = Math.min(
      26,
      Math.max(raw.aiScore, Math.round(baseAi * 0.5 + mixedSignal * 0.3))
    );
  }

  // Ensure invariant: strict AI can never be lower than verified balanced AI
  if (balancedResult) {
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
