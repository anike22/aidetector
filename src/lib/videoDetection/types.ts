// ─── Multimodal Video Authenticity & Forensic Detection Types ─────────────────

/**
 * Recording or processing type (separated from AI content assessment)
 */
export type RecordingProcessingType =
  | 'Camera recording'
  | 'Camera recording inside an app'
  | 'Screen recording'
  | 'Conventionally edited or re-encoded media'
  | 'Unknown';

/**
 * Content assessment (separated from recording capture method)
 */
export type ContentAssessment =
  | 'Evidence of AI-generated or AI-manipulated content'
  | 'No strong AI evidence detected'
  | 'Inconclusive or unsupported';

/**
 * Audio stream decoding and speech presence status
 */
export type AudioStreamStatus =
  | 'absent'
  | 'silent'
  | 'music_or_system_only'
  | 'usable_speech'
  | 'decoding_failed';

/**
 * Analyzer applicability gates
 */
export interface ApplicableAnalyses {
  visualSynthesis: boolean;
  faceTrackable: boolean;
  faceSwapAnalysis: boolean;
  facialReenactment: boolean;
  audioStreamPresent: boolean;
  usableSpeechPresent: boolean;
  voiceCloning: boolean;
  lipSyncAnalysis: boolean;
  acousticReverb: boolean;
  screenRecordingAudit: boolean;
  generatorAttribution: boolean;
}

/**
 * Pre-analysis media capability and stream inspection record
 */
export interface MediaCapabilityInspection {
  fileHash: string;
  jobId: string;
  durationSeconds: number;
  dimensions: { width: number; height: number };
  videoStreamAvailable: boolean;
  decodedFrameCoverage: number; // e.g. 100%
  audioStreamStatus: AudioStreamStatus;
  audioStreamAvailable: boolean;
  usableSpeechPresent: boolean;
  facesVisibleAndTrackable: boolean;
  detectedFaceCount: number;
  recordingProcessingType: RecordingProcessingType;
  contentAssessment: ContentAssessment;
  applicableAnalyses: ApplicableAnalyses;
  analysisLimitations: string[];
}

/**
 * Required 17-Verdict Taxonomy for Video Authenticity Analysis
 */
export type VideoVerdictTaxonomy =
  | 'Fully AI-generated video'
  | 'Face swap'
  | 'Facial reenactment'
  | 'AI lip synchronization'
  | 'Synthetic or cloned voice'
  | 'AI-generated background'
  | 'AI-generated object or person'
  | 'Video-to-video transformation'
  | 'AI inpainting or object replacement'
  | 'AI-enhanced or upscaled video'
  | 'Conventionally edited video'
  | 'Partially synthetic video'
  | 'Authenticity supported'
  | 'No synthetic indicators detected'
  | 'Suspected unknown synthetic process'
  | 'Insufficient quality'
  | 'Inconclusive';

/**
 * 3 Calibrated Analysis Modes
 */
export type VideoAnalysisMode = 'balanced' | 'high_sensitivity' | 'forensic';

/**
 * Asynchronous Video Job Processing Statuses
 */
export type VideoJobStatus =
  | 'awaiting_upload'
  | 'queued'
  | 'preprocessing'
  | 'analyzing_visual'
  | 'analyzing_audio'
  | 'analyzing_semantic'
  | 'verifying_provenance'
  | 'fusing_evidence'
  | 'generating_report'
  | 'completed'
  | 'inconclusive'
  | 'failed'
  | 'cancelled';

/**
 * Temporal Localization Interval
 */
export interface SuspiciousInterval {
  id: string;
  startTimestamp: number; // in seconds
  endTimestamp: number;   // in seconds
  category: VideoVerdictTaxonomy;
  affectedSubject: string; // e.g. "Primary Face #1", "Background Quadrant 2", "Vocal Tract Audio Track"
  regionBoundingBox?: {
    x: number;      // 0.0 - 1.0 (percentage from left)
    y: number;      // 0.0 - 1.0 (percentage from top)
    width: number;  // 0.0 - 1.0
    height: number; // 0.0 - 1.0
  };
  signalStrength: number; // 0 - 100
  confidenceScore: number; // 0 - 100
  uncertaintyRange: [number, number]; // e.g. [72, 88]
  supportingFrames: {
    timestamp: number;
    frameIndex: number;
    thumbnailUrl?: string;
    artifactType: string;
    description: string;
  }[];
  alternativeExplanations: string[]; // e.g. "H.264 macroblock compression artifacts", "Fast pans / motion blur"
  modality: 'visual' | 'audio' | 'audio_visual_sync' | 'provenance';
}

/**
 * Shot Boundary / Scene Cut
 */
export interface ShotBoundary {
  shotIndex: number;
  startTime: number;
  endTime: number;
  duration: number;
  keyframeTimestamp: number;
  motionIntensity: number; // 0 - 100
  adaptiveSampleCount: number;
  suspiciousSignalDetected: boolean;
}

/**
 * Finding Section 1: Visual Synthesis Evidence
 */
export interface VisualSynthesisFinding {
  verdicts: VideoVerdictTaxonomy[];
  overallVisualScore: number; // 0 - 100 (synthetic indicator strength)
  confidenceLevel: 'High' | 'Moderate' | 'Low' | 'Inconclusive';
  spatialArtifactScore: number;
  temporalConsistencyScore: number; // lower means more flickering / unnatural transitions
  opticalFlowAnomalyScore: number;
  facialCoherenceScore: number;
  bodyHandCoherenceScore: number;
  frequencyDomainAnomalyScore: number;
  lightingShadowConsistencyScore: number;
  textureStabilityScore: number;
  objectPermanenceScore: number;
  cameraMotionConsistencyScore: number;
  detectedGenerativeSignatures: string[]; // e.g. "Sora v1 motion drift", "Kling v1.5 lip jitter", "Runway Gen-3 texture warping"
  reasoning: string[];
  // Screen recording & face tracking capability gates
  faceAnalysisStatus?: 'applicable' | 'not_applicable' | 'unavailable' | 'not_assessed';
  hasTrackableFaces?: boolean;
  sceneContentType?: 'ui_screen' | 'camera_footage' | 'mixed_interface' | 'unknown';
}

/**
 * Finding Section 2: Audio & Semantic Synthesis Evidence (Phase 2 Enhanced)
 */
export interface AudioSynthesisFinding {
  hasAudioTrack: boolean;
  verdicts: VideoVerdictTaxonomy[];
  overallAudioScore: number; // 0 - 100
  confidenceLevel: 'High' | 'Moderate' | 'Low' | 'Inconclusive';
  voiceCloningProbability: number;
  ttsAcousticAnomalyScore: number;
  lipSyncCoherenceScore: number; // 0 - 100 (100 = perfect authentic physical sync)
  spectralDiscontinuityScore: number;
  backgroundAcousticUniformity: number;
  // Phase 2 Semantic Audio Metrics
  phonemeVisemeAlignmentScore: number; // 0 - 100
  emotionExpressionConsistencyScore: number; // 0 - 100
  sceneAudioCutAlignmentScore: number; // 0 - 100
  roomAcousticContinuityScore: number; // 0 - 100
  speechCadenceProsodyScore: number; // 0 - 100
  isDubbingDetected: boolean;
  dubbingConfidence: number;
  speakerChangeContinuity: number;
  silenceBreathingConsistency: number;
  detectedVoiceModels: string[]; // e.g. "ElevenLabs voice clone", "OpenAI TTS", "Cartesia sonic"
  reasoning: string[];
  // Media capability & analyzer applicability gating
  audioStreamStatus?: AudioStreamStatus;
  voiceCloningStatus?: 'applicable' | 'not_applicable' | 'unavailable' | 'not_assessed';
  lipSyncStatus?: 'applicable' | 'not_applicable' | 'unavailable' | 'not_assessed';
  acousticReverbStatus?: 'applicable' | 'not_applicable' | 'unavailable' | 'not_assessed';
  hasUsableSpeech?: boolean;
}

/**
 * Finding Section 3: Generator Attribution Engine (Phase 2)
 */
export type GeneratorAttributionStatus =
  | 'Verified generation source'
  | 'Probable generator family'
  | 'Similarity to known generator'
  | 'Unknown synthetic source'
  | 'Insufficient attribution evidence';

export interface GeneratorAttributionFinding {
  status: GeneratorAttributionStatus;
  verifiedSource: string | null; // e.g. "OpenAI Sora", "Kling AI", "Runway Gen-3", "Luma Dream Machine", "Pika", "Hedra", "DeepFaceLab"
  generatorFamily: string | null; // e.g. "Diffusion Transformer (DiT)", "Video Latent Diffusion", "Face Autoencoder Deepfake"
  confidenceScore: number; // 0 - 100
  attributionVersion: string;
  similarityMatches: {
    generatorName: string;
    similarityScore: number; // 0 - 100
    matchedSignatures: string[];
    confidenceLevel: 'High' | 'Moderate' | 'Low';
  }[];
  detectedFingerprints: string[];
  attributionReasoning: string[];
}

/**
 * Finding Section 4: Creator False-Positive Shield (Phase 2)
 */
export interface EvaluatedAlternativeExplanation {
  category:
    | 'Studio Lighting'
    | 'Beauty Filters / Smoothing'
    | 'Color Grading'
    | 'Video Stabilization'
    | 'Green Screen / Chroma Key'
    | 'AI Upscaling / Denoising'
    | 'Repeated Social Compression'
    | 'Screen Recording'
    | 'Frame Interpolation / Slow Motion'
    | 'Legitimate Dubbing / Bluetooth Delay';
  confidence: number; // 0 - 100
  description: string;
  mitigationEffect: string;
}

export interface CreatorFalsePositiveShieldFinding {
  shieldActive: boolean;
  mitigationApplied: boolean;
  rawSyntheticScore: number;
  adjustedSyntheticScore: number;
  adjustedCertainty: number; // Reduced when plausible legitimate explanations exist
  evaluatedExplanations: EvaluatedAlternativeExplanation[];
  preservationRecommendations: string[];
  creatorDefenseSummary: string;
}

/**
 * Finding Section 5: Provenance & Metadata Records (Phase 2 Enhanced)
 */
export interface VideoProvenanceFinding {
  c2paStatus:
    | 'Verified provenance'
    | 'Valid Content Credentials'
    | 'Invalid or altered credentials'
    | 'Provenance chain interrupted'
    | 'Metadata inconsistent'
    | 'Metadata unavailable'
    | 'No supported credential found'
    | 'Valid trusted credentials'
    | 'Untrusted signer'
    | 'Invalid credentials'
    | 'Absent credentials'
    | 'Unsupported format';
  manifestPresent: boolean;
  trustedIssuer: string | null;
  claimGenerator: string | null;
  digitalSourceType: string | null;
  creationDate: string | null;
  editHistory: string[];
  // Proof at Capture / Frame Sequence Integrity
  frameSequenceIntegrityVerified: boolean;
  signedEditingHistory: {
    action: string;
    software: string;
    timestamp: string;
    verifiedSignature: boolean;
  }[];
  containerMetadata: {
    format: string;
    codec: string;
    audioCodec?: string;
    frameRate: number;
    bitrateKbps: number;
    encoderSoftware?: string;
    deviceSignature?: string;
    isCleanStandardHeader: boolean;
  };
  metadataIntegrity: 'Standard encoding metadata' | 'Stripped / Cleaned container' | 'Editor software tags present';
  watermark: {
    detected: boolean;
    provider?: string;
    confidence: number;
    type?: string;
  };
  rawMetadataTags: Record<string, string>;
  reasoning: string[];
}

/**
 * Finding Section 6: Video Quality, Counter-Forensics & Fairness (Phase 2)
 */
export interface VideoQualityFinding {
  permitsReliableAnalysis: boolean;
  width: number;
  height: number;
  resolutionLabel: string;
  durationSeconds: number;
  frameRate: number;
  fileSizeBytes: number;
  compressionBitrateRating: 'High Quality' | 'Moderate' | 'Heavy Compression Artifacts';
  lightingQuality: 'Good' | 'Low Light / Underexposed' | 'Overexposed';
  motionBlurLevel: 'Low' | 'Moderate' | 'Severe Motion Blur';
  reliabilityScore: number; // 0 - 100
  confoundingFactors: string[];
  counterForensicResilienceVersion: string;
  fairnessCalibrationVersion: string;
  outOfDistributionDetected: boolean;
  recommendation: string;
}

/**
 * Finding Section 7: Evidence Summary & Synthesis
 */
export interface VideoEvidenceSummary {
  primaryVerdict: VideoVerdictTaxonomy;
  appliedTaxonomyLabels: VideoVerdictTaxonomy[];
  overallReliabilityScore: number; // 0 - 100
  syntheticLikelihood: number; // 0 - 100
  manipulationLikelihood: number; // 0 - 100
  modeUsed: VideoAnalysisMode;
  thresholdVersion: string;
  likelyGenerator: string | null;
  generatorAttributionStatus: GeneratorAttributionStatus;
  analysisDate: string;
  isZeroRetention: boolean;
  conclusionParagraph: string;
  actionableGuidance: string;
  // Separation of recording method and content assessment
  recordingProcessingType?: RecordingProcessingType;
  contentAssessment?: ContentAssessment;
}

/**
 * Complete Structured Multimodal Video Analysis Result
 */
export interface VideoAnalysisResult {
  jobId: string;
  sha256: string;
  fileName: string;
  fileSizeBytes: number;
  durationSeconds: number;
  analyzedAt: string;
  pipelineVersion: string;
  mode: VideoAnalysisMode;
  thresholdVersion: string;
  status: VideoJobStatus;
  progressPercent: number;
  currentStageLabel: string;
  // Media Capability & Pre-Inspection Information
  mediaCapabilities?: MediaCapabilityInspection;
  // 7 Independent Findings
  visualEvidence: VisualSynthesisFinding;
  audioEvidence: AudioSynthesisFinding;
  attribution: GeneratorAttributionFinding;
  falsePositiveShield: CreatorFalsePositiveShieldFinding;
  provenance: VideoProvenanceFinding;
  quality: VideoQualityFinding;
  summary: VideoEvidenceSummary;
  // Interactive Localized Timeline Data
  shotBoundaries: ShotBoundary[];
  suspiciousIntervals: SuspiciousInterval[];
}

/**
 * Asynchronous Video Analysis Queue Item
 */
export interface VideoAnalysisJob {
  id: string;
  userId?: string;
  guestId?: string;
  fileName: string;
  fileSizeBytes: number;
  sha256: string;
  mode: VideoAnalysisMode;
  status: VideoJobStatus;
  progressPercent: number;
  currentStageLabel: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  creditReservationId?: string | null;
  creditsCharged?: number;
  result?: VideoAnalysisResult;
  errorMessage?: string;
}

/**
 * Original vs. Published Differential Comparison Result (Section 15)
 */
export interface OriginalVsPublishedComparisonResult {
  comparisonId: string;
  originalFileName: string;
  originalSizeBytes: number;
  originalHash: string;
  publishedFileName: string;
  publishedSizeBytes: number;
  publishedHash: string;
  platformProfile: 'TikTok' | 'WhatsApp' | 'YouTube' | 'Instagram' | 'Generic Compression';
  matchingVisualScore: number; // 0 - 100
  compressionSeverity: 'Low' | 'Moderate' | 'Aggressive Platform Re-encoding';
  encodingDifferences: {
    parameter: string;
    originalValue: string;
    publishedValue: string;
    explanation: string;
    isStandardPlatformBehavior: boolean;
  }[];
  frameModifications: {
    croppingDetected: boolean;
    aspectRatioChanged: boolean;
    frameRateConverted: boolean;
    watermarkOverlayAdded: boolean;
  };
  audioModifications: {
    transcodedBitrate: string;
    channelDowngrade: boolean;
    dubbedOrReplaced: boolean;
  };
  platformInducedArtifacts: string[];
  postPlatformManipulations: string[];
  authenticityDefenseVerdict:
    | 'Original strongly supports authenticity — platform compression induced false artifacts'
    | 'Differences beyond expected platform re-encoding detected'
    | 'Files match with clean compression signature';
  recommendationForCreator: string;
  comparedAt: string;
}

/**
 * Live-Call Deepfake Protection Session (Section 21)
 */
export interface LiveCallProtectionSession {
  sessionId: string;
  consentConfirmed: boolean;
  consentTimestamp?: string;
  callDurationSeconds: number;
  passiveStatus: 'Monitoring' | 'Alert' | 'Normal' | 'Suspicious Stream';
  passiveSyntheticScore: number; // 0 - 100
  activeChallenge: {
    type: 'repeat_phrase' | 'head_turn' | 'camera_movement' | 'show_object' | null;
    challengePrompt: string | null;
    issuedAt?: string;
    status: 'idle' | 'in_progress' | 'passed' | 'failed' | 'inconclusive';
  };
  virtualCameraDetected: boolean;
  replayAttackDetected: boolean;
  replayProbability: number;
  audioVideoDesyncMs: number;
  logs: {
    id: string;
    timestamp: string;
    event: string;
    status: 'ok' | 'warning' | 'alert';
  }[];
}
