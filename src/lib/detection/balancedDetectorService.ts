// Balanced Detector Service — thin adapter over the main detector Edge Function.
// Calibrated for balanced accuracy and reduced false positives.
// DO NOT alter detection logic here — all logic lives in the Edge Function and
// the underlying detectorApi.ts / engine pipeline.

import { analyzeText, AnalysisError, type AnalyzeTextOptions } from './detectorApi';
import type { AdvancedTextAnalysisResult } from './types';

export type { AnalysisError };

export interface BalancedDetectorResult {
  // Scores (0–100)
  ai: number;
  human: number;
  mixed: number;
  // Verdict and classification
  verdict: string;
  risk: string;
  confidence: number;
  confidenceLevel: string;
  // Metadata
  language: string;
  engineVersion: string;
  modelVersion: string;
  calibrationVersion: string;
  languagePipelineVersion: string;
  requestId: string;
  analyzedAt: string;
  processingTimeMs?: number;
  // Full result available for downstream rendering (sentence breakdown, etc.)
  full: AdvancedTextAnalysisResult;
}

export interface BalancedDetectorError {
  message: string;
  code?: string;
  canRetry: boolean;
  isUpgradeRequired?: boolean;
  isAuthRequired?: boolean;
  upgradeDetails?: { remaining?: number | null; limit?: number | null };
}

export type BalancedDetectorOptions = AnalyzeTextOptions;

export async function runBalancedDetector(
  text: string,
  options: BalancedDetectorOptions = {}
): Promise<BalancedDetectorResult> {
  const full = await analyzeText(text, options);

  return {
    ai: full.overall.aiProbability,
    human: full.overall.humanProbability,
    mixed: full.overall.mixedProbability,
    verdict: full.overall.verdict,
    risk: full.overall.riskLevel,
    confidence: full.overall.confidence,
    confidenceLevel: full.overall.confidenceLevel,
    language: full.language.primary?.name || 'Unknown',
    engineVersion: full.metadata.detectorVersion,
    modelVersion: full.metadata.modelVersion,
    calibrationVersion: full.metadata.calibrationVersion,
    languagePipelineVersion: full.metadata.languagePipelineVersion,
    requestId: full.metadata.requestId,
    analyzedAt: full.metadata.analyzedAt,
    processingTimeMs: full.metadata.processingTimeMs,
    full,
  };
}
