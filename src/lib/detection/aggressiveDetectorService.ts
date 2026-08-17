// Aggressive Detector Service — isolated adapter for the SEO Assistant's
// AI risk analysis engine (analyzeAIRisk from analysisEngine.ts).
//
// CRITICAL: This adapter calls analyzeAIRisk() without modification.
// Do NOT alter, wrap, or override the underlying SEO Assistant logic.
// The SEO Assistant page, its files, and its behavior are completely untouched.
//
// The SEO Assistant engine returns only two categories (AI + Human), plus a
// risk level and recommendations. There is NO Mixed category — do not invent one.

import { analyzeAIRisk } from '@/pages/seo-assistant/analysisEngine';

export interface AggressiveDetectorResult {
  // Scores (0–100) — exactly two categories, as returned by analyzeAIRisk.
  ai: number;
  human: number;
  // No 'mixed' field: the aggressive engine does not return a Mixed category.
  risk: 'Low' | 'Medium' | 'High';
  // Recommendations returned as-is from the underlying engine.
  recommendations: string[];
}

export interface AggressiveDetectorError {
  message: string;
  canRetry: boolean;
}

// runAggressiveDetector calls the SEO Assistant's analyzeAIRisk function.
// The text is passed unchanged — no preprocessing.
export async function runAggressiveDetector(
  text: string
): Promise<AggressiveDetectorResult> {
  // analyzeAIRisk is synchronous but we wrap in a Promise to keep the
  // orchestration layer uniform (both engines return Promise).
  const raw = analyzeAIRisk(text);
  return {
    ai: raw.aiScore,
    human: raw.humanScore,
    risk: raw.riskLevel,
    recommendations: raw.recommendations,
  };
}
