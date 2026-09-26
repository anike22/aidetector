// Image Detection and Forensic Analysis Types

export type AIGenerationVerdict =
  | 'Likely AI-generated'
  | 'AI editing indicated'
  | 'No strong AI-generation evidence'
  | 'Inconclusive';

export type ManipulationVerdict =
  | 'AI editing indicated'
  | 'Possible manual manipulation'
  | 'No significant manipulation detected'
  | 'Inconclusive';

export type C2PAStatus =
  | 'Valid trusted credentials'
  | 'Untrusted signer'
  | 'Invalid credentials'
  | 'Absent credentials'
  | 'Unsupported format';

export type QualityVerdict =
  | 'Optimal for forensic analysis'
  | 'Acceptable with minor limitations'
  | 'Degraded - results may be inconclusive';

export type ConfidenceLevel = 'Low' | 'Medium' | 'High' | 'Very High';

export interface ManipulatedRegion {
  id: string;
  box: [number, number, number, number]; // [xPercent, yPercent, widthPercent, heightPercent]
  confidence: number;
  label: string;
  areaPercent: number;
  anomalyType: 'compression_delta' | 'noise_mismatch' | 'edge_inconsistency' | 'generative_fill';
}

export interface ImageAIGenerationFinding {
  verdict: AIGenerationVerdict;
  score: number; // 0-100 calibrated
  confidenceScore: number; // 0-100
  confidenceLevel: ConfidenceLevel;
  detectedGenerators: string[];
  spectralArtifactScore: number; // 0-100
  noiseUniformityScore: number; // 0-100
  compressionAnomalyScore: number; // 0-100
  diffusionGridScore: number; // 0-100
  reasoning: string[];
  limitations: string[];
}

export interface ImageManipulationFinding {
  verdict: ManipulationVerdict;
  manipulationScore: number; // 0-100
  elaDeltaScore: number; // 0-100
  splicingScore: number; // 0-100
  inpaintingScore: number; // 0-100
  regionsDetected: ManipulatedRegion[];
  hasLocalizedEdits: boolean;
  reasoning: string[];
}

export interface CameraExifData {
  make?: string;
  model?: string;
  software?: string;
  dateTimeOriginal?: string;
  lens?: string;
  iso?: number;
  exposureTime?: string;
  fNumber?: string;
  focalLength?: string;
  dimensions?: string;
  colorSpace?: string;
}

export interface WatermarkDetectionResult {
  detected: boolean;
  type?: string;
  provider?: string;
  confidence: number;
  location?: string;
}

export interface ImageProvenanceFinding {
  c2paStatus: C2PAStatus;
  manifestPresent: boolean;
  trustedIssuer: string | null;
  claimGenerator: string | null;
  digitalSourceType: string | null;
  creationDate: string | null;
  editHistory: string[];
  cameraExif: CameraExifData | null;
  exifIntegrity: 'Camera original EXIF present' | 'Standard EXIF headers present (unsigned)' | 'Stripped / Cleaned metadata' | 'Software editor tags present';
  isMetadataClaimOnly: boolean; // Always true for unsigned EXIF
  watermark: WatermarkDetectionResult;
  rawMetadataTags: Record<string, string>;
  reasoning: string[];
}

export interface ImageQualityFinding {
  permitsReliableAnalysis: boolean;
  width: number;
  height: number;
  megapixels: number;
  aspectRatio: string;
  fileSizeBytes: number;
  mimeType: string;
  compressionQualityEstimate: number; // 0-100
  blurLevel: 'Sharp' | 'Slightly soft' | 'High blur';
  noiseLevel: 'Natural sensor noise' | 'Ultra-smooth (AI trait)' | 'Heavy compression noise';
  dynamicRangeScore: number; // 0-100
  qualityVerdict: QualityVerdict;
  limitations: string[];
}

export interface ImageAnalysisResult {
  id: string;
  analyzedAt: string;
  sha256: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  previewUrl: string;
  aiGeneration: ImageAIGenerationFinding;
  manipulation: ImageManipulationFinding;
  provenance: ImageProvenanceFinding;
  quality: ImageQualityFinding;
  heatmapUrl: string | null; // Base64 Error Level Analysis (ELA) map
  noiseMapUrl: string | null; // Base64 High-Frequency Noise map
  modelVersions: {
    pipeline: string;
    spectralClassifier: string;
    elaEngine: string;
    c2paParser: string;
  };
  zeroRetention: boolean;
  entitlement?: {
    plan: string;
    creditsDeducted: number;
    dailyRemaining: number | null;
  };
}

export interface ImageComparisonResult {
  id: string;
  analyzedAt: string;
  originalFileName: string;
  editedFileName: string;
  differenceScore: number; // 0-100 percentage of pixels changed
  alteredAreaPercent: number;
  diffHeatmapUrl: string;
  detectedChanges: {
    region: [number, number, number, number];
    type: 'content_added' | 'content_removed' | 'color_adjusted' | 'inpainting';
    description: string;
  }[];
  summary: string;
}

export interface FeedbackReportSubmission {
  imageId: string;
  imageHash: string;
  reportedVerdict: string;
  userCorrection: 'authentic' | 'ai_generated' | 'partially_edited' | 'uncertain';
  comment: string;
  allowTraining: boolean;
}
