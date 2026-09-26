// ─── Versioned Thresholds & Mode Configurations for Video Forensics ───────────

import { VideoAnalysisMode } from './types';

export const VIDEO_PIPELINE_VERSION = 'v5.1.0-forensic-multimodal';
export const THRESHOLD_VERSION = 'v2026.4-calibrated';

export interface ModeThresholdConfig {
  mode: VideoAnalysisMode;
  name: string;
  tagline: string;
  description: string;
  badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
  // Minimum signal threshold (0-100) before declaring synthetic verdict
  syntheticDecisionThreshold: number;
  // Minimum confidence threshold (0-100)
  minConfidenceToDeclare: number;
  // Spatial artifact sensitivity multiplier (1.0 = baseline)
  spatialSensitivity: number;
  // Optical flow / temporal variance threshold
  temporalAnomalyThreshold: number;
  // Audio-visual lip sync threshold
  lipSyncAnomalyThreshold: number;
  // Inconclusive margin
  inconclusiveMargin: number;
  // False positive warning banner required
  showFalsePositiveWarning: boolean;
  // Plan requirement ('free' | 'pro' | 'enterprise')
  requiredPlan: 'free' | 'pro' | 'enterprise';
  creditCost: number;
}

export const VIDEO_MODE_CONFIGS: Record<VideoAnalysisMode, ModeThresholdConfig> = {
  balanced: {
    mode: 'balanced',
    name: 'Balanced Mode',
    tagline: 'Default Public Mode — False Accusation Protection',
    description: 'Requires strong, multi-modal convergence before declaring synthetic manipulation. Optimized to prevent false positives on creators, low-light footage, and heavy platform compression.',
    badgeVariant: 'secondary',
    syntheticDecisionThreshold: 72,
    minConfidenceToDeclare: 75,
    spatialSensitivity: 1.0,
    temporalAnomalyThreshold: 68,
    lipSyncAnomalyThreshold: 70,
    inconclusiveMargin: 15,
    showFalsePositiveWarning: false,
    requiredPlan: 'free',
    creditCost: 2,
  },
  high_sensitivity: {
    mode: 'high_sensitivity',
    name: 'High-Sensitivity Mode',
    tagline: 'Investigative Screening — Surface Subtle Indicators',
    description: 'Calibrated to catch early-generation artifacts, subtle face morphing, and gentle inpainting. Carries a higher false-positive risk under social media compression.',
    badgeVariant: 'destructive',
    syntheticDecisionThreshold: 54,
    minConfidenceToDeclare: 55,
    spatialSensitivity: 1.45,
    temporalAnomalyThreshold: 52,
    lipSyncAnomalyThreshold: 55,
    inconclusiveMargin: 8,
    showFalsePositiveWarning: true,
    requiredPlan: 'free',
    creditCost: 2,
  },
  forensic: {
    mode: 'forensic',
    name: 'Forensic Mode',
    tagline: 'Full Deep-Dive Evidence Suite — Investigators & Fraud Teams',
    description: 'Comprehensive cross-modal analysis including frame-by-frame Fourier spectral residuals, optical flow motion fields, C2PA cryptographic chain of custody, and alternative explanation modeling.',
    badgeVariant: 'default',
    syntheticDecisionThreshold: 65,
    minConfidenceToDeclare: 70,
    spatialSensitivity: 1.25,
    temporalAnomalyThreshold: 60,
    lipSyncAnomalyThreshold: 62,
    inconclusiveMargin: 10,
    showFalsePositiveWarning: false,
    requiredPlan: 'pro',
    creditCost: 4,
  },
};

/**
 * Accepted Video Ingestion Formats & Limits
 */
export const VIDEO_INGESTION_LIMITS = {
  maxFileSizeMB: 250,
  maxDurationSeconds: 600, // 10 minutes
  acceptedExtensions: ['.mp4', '.mov', '.webm', '.avi', '.mkv', '.m4v'],
  acceptedMimeTypes: [
    'video/mp4',
    'video/quicktime',
    'video/webm',
    'video/x-msvideo',
    'video/x-matroska',
  ],
  maxAdaptiveSamples: 64,
  minResolutionWidth: 240,
  minResolutionHeight: 240,
};
