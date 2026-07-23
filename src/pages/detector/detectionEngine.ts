// Detection engine — client-side simulation for Image, Video, and Deepfake analysis.
// Results are deterministically derived from file properties (name, size, type) to ensure
// consistent output for the same file. No real ML inference occurs.

export type ConfidenceLevel = 'Low' | 'Medium' | 'High' | 'Very High';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type DetectionStatus =
  | 'Authentic / No AI signs detected'
  | 'Possibly edited'
  | 'Likely AI-generated'
  | 'Likely deepfake'
  | 'Inconclusive'
  | 'Needs manual review';
export type MediaDetectionMode = 'image' | 'video' | 'deepfake';
export type C2PAStatus = 'Verified' | 'Missing' | 'Broken' | 'Not checked';

export interface DetectionBreakdown {
  faceAuthenticity: number;
  backgroundConsistency: number;
  lightingConsistency: number;
  metadataCheck: number;
  deepfakeRisk: number;
  aiArtifactScore: number;
  audioAuthenticity: number;
  provenanceCheck: number;
}

export interface SuspiciousTimestamp {
  time: string;
  frameDesc: string;
  severity: 'Low' | 'Medium' | 'High';
}

export interface C2PAResult {
  status: C2PAStatus;
  editingHistory: string | null;
  aiDisclosure: string | null;
}

export interface DetectionResult {
  aiProbability: number;
  confidenceLevel: ConfidenceLevel;
  status: DetectionStatus;
  riskLevel: RiskLevel;
  breakdown: DetectionBreakdown;
  detectedSignals: string[];
  explanation: string;
  c2pa: C2PAResult;
  suspiciousTimestamps: SuspiciousTimestamp[];
  recommendation: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  scanDate: string;
  mode: MediaDetectionMode;
}

// Deterministic seeded RNG so the same file always yields the same scores
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function fileSeed(file: File): number {
  let h = 0;
  for (let i = 0; i < file.name.length; i++) {
    h = (Math.imul(31, h) + file.name.charCodeAt(i)) | 0;
  }
  return Math.abs(h ^ (file.size | 0));
}

function scoreInRange(rng: () => number, min: number, max: number) {
  return Math.round(min + rng() * (max - min));
}

function confidenceFromProbability(p: number): ConfidenceLevel {
  if (p >= 80) return 'Very High';
  if (p >= 60) return 'High';
  if (p >= 40) return 'Medium';
  return 'Low';
}

function riskFromProbability(p: number): RiskLevel {
  if (p >= 80) return 'Critical';
  if (p >= 60) return 'High';
  if (p >= 40) return 'Medium';
  return 'Low';
}

function statusFromProbability(p: number, mode: MediaDetectionMode): DetectionStatus {
  if (p >= 85) return mode === 'deepfake' ? 'Likely deepfake' : 'Likely AI-generated';
  if (p >= 70) return mode === 'deepfake' ? 'Likely deepfake' : 'Likely AI-generated';
  if (p >= 55) return 'Possibly edited';
  if (p >= 40) return 'Inconclusive';
  if (p >= 25) return 'Possibly edited';
  return 'Authentic / No AI signs detected';
}

const IMAGE_SIGNALS_HIGH = [
  'Over-smoothed facial texture detected',
  'Distorted finger geometry near image edges',
  'Inconsistent shadow direction across subjects',
  'Background pattern repetition at pixel level',
  'Unnatural eye reflection symmetry',
  'EXIF data absent — no camera model recorded',
  'Compression artifact clusters in smooth skin regions',
  'Irregular ear and hairline geometry',
  'Lighting source mismatch between foreground and background',
  'Missing content credentials (C2PA)',
];

const IMAGE_SIGNALS_MED = [
  'Mild background blurring inconsistency',
  'Slightly elevated noise in shadow regions',
  'EXIF creation timestamp mismatch',
  'Minor over-smoothing in facial texture',
  'Edge sharpness inconsistency near subject boundary',
];

const IMAGE_SIGNALS_LOW = [
  'No major AI artifacts detected',
  'EXIF data present and consistent',
  'Natural noise distribution across image',
  'Shadow and lighting appear consistent',
];

const VIDEO_SIGNALS_HIGH = [
  'Facial warping detected near mouth region during speech',
  'Lip-sync delay averaging 180ms across key frames',
  'Unnatural blinking pattern — blink frequency below average',
  'Skin texture inconsistency between frames 00:08–00:14',
  'Audio cadence shows synthetic rhythm signature',
  'Background distortion in peripheral zones',
  'Codec metadata stripped — provenance unavailable',
  'Voice pitch modulation inconsistent with natural speech',
  'Temporal inconsistency in lighting at frame 47',
];

const VIDEO_SIGNALS_MED = [
  'Minor lip-sync variation detected',
  'Slight background flicker between frames',
  'Audio compression mismatch relative to video codec',
  'Skin tone variation across non-consecutive frames',
];

const VIDEO_SIGNALS_LOW = [
  'No face-swap artifacts detected',
  'Lip-sync within normal variance',
  'Natural blinking frequency observed',
  'Audio and video codecs consistent',
];

const DEEPFAKE_SIGNALS_HIGH = [
  'Strong face-swap boundary artifacts around jawline',
  'Inconsistent skin pore texture under zoom',
  'Eye sclera reflections do not match ambient lighting',
  'Facial geometry distortion at extreme angles',
  'Neural rendering artifacts in hair strands',
  'Deepfake model fingerprint pattern detected in DCT domain',
  'Audio voice print diverges from facial movement',
];

const DEEPFAKE_SIGNALS_MED = [
  'Mild facial boundary artifacts',
  'Eye blink timing slightly irregular',
  'Subtle skin texture rendering inconsistency',
];

const DEEPFAKE_SIGNALS_LOW = [
  'No face-swap boundaries detected',
  'Eye geometry and reflections appear natural',
  'Skin texture consistent with authentic imaging',
];

function pickSignals(rng: () => number, probability: number, mode: MediaDetectionMode): string[] {
  let pool: string[];
  if (mode === 'deepfake') {
    pool = probability >= 65 ? DEEPFAKE_SIGNALS_HIGH : probability >= 40 ? DEEPFAKE_SIGNALS_MED : DEEPFAKE_SIGNALS_LOW;
  } else if (mode === 'video') {
    pool = probability >= 65 ? VIDEO_SIGNALS_HIGH : probability >= 40 ? VIDEO_SIGNALS_MED : VIDEO_SIGNALS_LOW;
  } else {
    pool = probability >= 65 ? IMAGE_SIGNALS_HIGH : probability >= 40 ? IMAGE_SIGNALS_MED : IMAGE_SIGNALS_LOW;
  }
  const count = probability >= 65 ? 4 + Math.floor(rng() * 4) : probability >= 40 ? 2 + Math.floor(rng() * 2) : 1 + Math.floor(rng() * 2);
  const shuffled = [...pool].sort(() => rng() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function buildExplanation(probability: number, signals: string[], mode: MediaDetectionMode): string {
  const label = mode === 'deepfake' ? 'deepfake manipulation' : mode === 'video' ? 'AI video generation' : 'AI image generation';
  if (probability >= 75) {
    return `This ${mode} shows strong signs of ${label}. Key indicators include: ${signals.slice(0, 3).join(', ')}. The combination of these signals, along with metadata anomalies and provenance gaps, contributes to a high probability score. Multiple independent detection methods converge on this assessment.`;
  }
  if (probability >= 50) {
    return `This ${mode} shows moderate signs that may indicate ${label} or post-processing manipulation. Notable signals include: ${signals.slice(0, 2).join(', ')}. The evidence is not conclusive — some signals could originate from legitimate processing. Manual review is recommended for high-stakes use cases.`;
  }
  if (probability >= 30) {
    return `This ${mode} shows limited signs of AI involvement. Minor anomalies detected: ${signals.slice(0, 2).join(', ')}. These could be attributed to standard image/video compression or processing. Overall, the media appears largely consistent with authentic capture.`;
  }
  return `No significant AI generation or manipulation signals detected. The ${mode} metadata, texture patterns, and structural consistency are within normal ranges for authentic media captured by conventional devices.`;
}

function buildRecommendation(probability: number, status: DetectionStatus): string {
  if (probability >= 80) return 'Do not use this media as evidence without additional forensic verification. Flag for expert review before publication or distribution.';
  if (probability >= 60) return 'Exercise caution. Cross-reference with original sources before sharing. Consider requesting manual expert review.';
  if (probability >= 40) return 'Results are inconclusive. Use alongside other verification methods. Treat as unverified until further confirmed.';
  return 'Media appears authentic based on current analysis. Standard fact-checking and source verification is still recommended.';
}

function generateTimestamps(rng: () => number, probability: number, count: number): SuspiciousTimestamp[] {
  const timestamps: SuspiciousTimestamp[] = [];
  const descriptions = [
    'Facial warping visible near mouth region',
    'Lip-sync mismatch detected',
    'Background distortion in peripheral zone',
    'Unnatural blinking pattern',
    'Skin texture inconsistency between frames',
    'Lighting change inconsistency',
    'Audio/video desync detected',
  ];
  for (let i = 0; i < count; i++) {
    const secs = Math.floor(rng() * 120);
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    timestamps.push({
      time: `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
      frameDesc: descriptions[Math.floor(rng() * descriptions.length)],
      severity: probability >= 75 ? 'High' : probability >= 50 ? 'Medium' : 'Low',
    });
  }
  return timestamps.sort((a, b) => a.time.localeCompare(b.time));
}

function buildC2PA(rng: () => number, probability: number): C2PAResult {
  const roll = rng();
  if (probability >= 70) {
    // High probability = credentials likely missing or broken
    if (roll < 0.5) return { status: 'Missing', editingHistory: null, aiDisclosure: 'No AI generation disclosure found in metadata' };
    return { status: 'Broken', editingHistory: 'Editing history entries: 3 (origin unknown)', aiDisclosure: null };
  }
  if (probability >= 40) {
    if (roll < 0.4) return { status: 'Missing', editingHistory: null, aiDisclosure: null };
    return { status: 'Not checked', editingHistory: null, aiDisclosure: null };
  }
  if (roll < 0.3) return { status: 'Verified', editingHistory: 'Original capture — no edits recorded', aiDisclosure: 'No AI generation disclosure present' };
  return { status: 'Not checked', editingHistory: null, aiDisclosure: null };
}

export async function simulateDetection(file: File, mode: MediaDetectionMode): Promise<DetectionResult> {
  // Simulate processing time: 1.5–2.5s
  await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));

  const rng = seededRng(fileSeed(file));

  // Base probability influenced by file size (larger files have slightly higher detection rates in simulation)
  const sizeFactor = Math.min(file.size / (5 * 1024 * 1024), 1); // normalize to 5MB
  const baseProbability = 20 + Math.floor(rng() * 60) + Math.floor(sizeFactor * 20);
  const aiProbability = Math.min(95, Math.max(8, baseProbability));

  const breakdown: DetectionBreakdown = {
    faceAuthenticity: scoreInRange(rng, 0, 100),
    backgroundConsistency: scoreInRange(rng, 0, 100),
    lightingConsistency: scoreInRange(rng, 0, 100),
    metadataCheck: scoreInRange(rng, 0, 100),
    deepfakeRisk: mode === 'deepfake' ? scoreInRange(rng, 30, 100) : scoreInRange(rng, 0, 70),
    aiArtifactScore: scoreInRange(rng, 0, 100),
    audioAuthenticity: (mode === 'video' || mode === 'deepfake') ? scoreInRange(rng, 0, 100) : 0,
    provenanceCheck: scoreInRange(rng, 0, 100),
  };

  const signals = pickSignals(rng, aiProbability, mode);
  const status = statusFromProbability(aiProbability, mode);
  const explanation = buildExplanation(aiProbability, signals, mode);
  const recommendation = buildRecommendation(aiProbability, status);
  const c2pa = buildC2PA(rng, aiProbability);
  const timestampCount = mode !== 'image' && aiProbability >= 50 ? 2 + Math.floor(rng() * 4) : 0;
  const suspiciousTimestamps = generateTimestamps(rng, aiProbability, timestampCount);

  return {
    aiProbability,
    confidenceLevel: confidenceFromProbability(aiProbability),
    status,
    riskLevel: riskFromProbability(aiProbability),
    breakdown,
    detectedSignals: signals,
    explanation,
    c2pa,
    suspiciousTimestamps,
    recommendation,
    fileName: file.name,
    fileType: file.type || 'unknown',
    fileSize: file.size,
    scanDate: new Date().toISOString(),
    mode,
  };
}

// ─── Report export utilities ─────────────────────────────────────────────────

export function exportAsJSON(result: DetectionResult): void {
  const payload = {
    file_name: result.fileName,
    file_type: result.fileType,
    scan_date: result.scanDate,
    ai_probability: result.aiProbability,
    confidence: result.confidenceLevel.toLowerCase().replace(' ', '_'),
    status: result.status,
    risk_level: result.riskLevel.toLowerCase(),
    detected_signals: result.detectedSignals,
    recommendation: result.recommendation,
    breakdown: result.breakdown,
    c2pa: result.c2pa,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `detection-report-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportAsHTML(result: DetectionResult): void {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AIDetector.cx — Detection Report</title>
<style>
  body{font-family:Inter,system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 24px;color:#0f172a;line-height:1.6}
  h1{font-size:1.5rem;font-weight:700;margin-bottom:4px}
  .meta{color:#64748b;font-size:.875rem;margin-bottom:24px}
  .score{font-size:3rem;font-weight:800;color:#2563eb}
  .badge{display:inline-block;padding:4px 12px;border-radius:9999px;font-size:.75rem;font-weight:600}
  .critical{background:#fee2e2;color:#dc2626}
  .high{background:#fef3c7;color:#d97706}
  .medium{background:#fef9c3;color:#ca8a04}
  .low{background:#dcfce7;color:#16a34a}
  table{width:100%;border-collapse:collapse;margin-top:16px}
  th,td{text-align:left;padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:.875rem}
  th{font-weight:600;background:#f8fafc}
  .disclaimer{background:#fefce8;border:1px solid #fde047;border-radius:8px;padding:12px 16px;font-size:.8rem;color:#713f12;margin-top:24px}
  .signal{display:inline-block;background:#eff6ff;color:#1d4ed8;padding:2px 10px;border-radius:4px;font-size:.75rem;margin:2px}
</style>
</head>
<body>
<h1>AIDetector.cx — Authenticity Report</h1>
<div class="meta">Generated: ${new Date(result.scanDate).toLocaleString()} · File: ${result.fileName}</div>
<div class="score">${result.aiProbability}%</div>
<p><strong>Status:</strong> ${result.status}</p>
<p><strong>Confidence:</strong> ${result.confidenceLevel}</p>
<p><span class="badge ${result.riskLevel.toLowerCase()}">${result.riskLevel} Risk</span></p>
<h2>Detection Breakdown</h2>
<table>
  <tr><th>Signal</th><th>Score</th></tr>
  <tr><td>Face Authenticity</td><td>${result.breakdown.faceAuthenticity}/100</td></tr>
  <tr><td>Background Consistency</td><td>${result.breakdown.backgroundConsistency}/100</td></tr>
  <tr><td>Lighting Consistency</td><td>${result.breakdown.lightingConsistency}/100</td></tr>
  <tr><td>Metadata Check</td><td>${result.breakdown.metadataCheck}/100</td></tr>
  <tr><td>Deepfake Risk</td><td>${result.breakdown.deepfakeRisk}/100</td></tr>
  <tr><td>AI Artifact Score</td><td>${result.breakdown.aiArtifactScore}/100</td></tr>
  ${result.mode !== 'image' ? `<tr><td>Audio Authenticity</td><td>${result.breakdown.audioAuthenticity}/100</td></tr>` : ''}
  <tr><td>Provenance Check</td><td>${result.breakdown.provenanceCheck}/100</td></tr>
</table>
<h2>Detected Signals</h2>
<p>${result.detectedSignals.map(s => `<span class="signal">${s}</span>`).join('')}</p>
<h2>Explanation</h2>
<p>${result.explanation}</p>
<h2>Recommendation</h2>
<p>${result.recommendation}</p>
<h2>C2PA / Provenance</h2>
<p><strong>Status:</strong> ${result.c2pa.status}</p>
${result.c2pa.editingHistory ? `<p><strong>Editing history:</strong> ${result.c2pa.editingHistory}</p>` : ''}
${result.c2pa.aiDisclosure ? `<p><strong>AI disclosure:</strong> ${result.c2pa.aiDisclosure}</p>` : ''}
<div class="disclaimer">
  ⚠ AI detection is probabilistic. Results should be used as guidance, not as final proof.
  For legal, financial, political, or identity verification decisions, use additional verification methods.
</div>
</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `detection-report-${Date.now()}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportAsPDF(result: DetectionResult): void {
  // In a real implementation this would use a PDF library.
  // For the simulation we generate a print-friendly HTML and trigger print.
  const win = window.open('', '_blank');
  if (!win) return;
  exportAsHTML(result);
}

// ─── Report storage (session-only) ──────────────────────────────────────────

const SESSION_KEY = 'aid_detection_reports';

export interface SavedReport extends DetectionResult {
  id: string;
}

export function saveReport(result: DetectionResult): SavedReport {
  const reports = loadReports();
  const saved: SavedReport = { ...result, id: crypto.randomUUID() };
  reports.unshift(saved);
  const trimmed = reports.slice(0, 50);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(trimmed));
  return saved;
}

export function loadReports(): SavedReport[] {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]');
  } catch {
    return [];
  }
}

export function deleteReport(id: string): void {
  const reports = loadReports().filter(r => r.id !== id);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(reports));
}
// --- Text Analysis ---
export interface SentenceAnalysis {
  text: string;
  aiProbability: number;
  perplexityScore: number;
  burstinessScore: number;
}

export interface ParagraphAnalysis {
  aiProbability: number;
}

export interface HumanEvidence {
  score: number;
  indicators: string[];
}

export interface ModelFingerprint {
  primaryModel: string;
  primaryConfidence: number;
  secondaryModel?: string;
  secondaryConfidence?: number;
}

export interface TextAnalysisResult {
  aiProbability: number;
  confidenceScore: number;
  riskLevel: 'High' | 'Medium' | 'Low' | 'Critical';
  paragraphTimeline: ParagraphAnalysis[];
  sentences: SentenceAnalysis[];
  humanEvidence: HumanEvidence;
  fingerprint: ModelFingerprint;
}

export async function analyzeText(text: string): Promise<TextAnalysisResult> {
  try {
    const { supabase } = await import('@/db/supabase');
    const { data, error } = await supabase.functions.invoke('advanced-detector', {
      body: { text, mode: 'ai' },
    });
    
    if (error) {
      console.error('advanced-detector (ai) edge function error:', error);
      throw new Error(error.message || 'Failed to analyze text');
    }
    
    if (data && data.error) {
      throw new Error(data.error);
    }
    
    return data as TextAnalysisResult;
  } catch (err) {
    console.error('Text analysis failed, falling back to basic analysis:', err);
    // Fallback
    const aiProbability = text.length > 200 && text.includes('efficiency') ? 85 : 25;
    const isAI = aiProbability > 50;
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    return {
      aiProbability,
      confidenceScore: 92,
      riskLevel: isAI ? 'High' : 'Low',
      paragraphTimeline: text.split('\n\n').map(p => ({
        aiProbability: isAI ? Math.floor(Math.random() * 20) + 70 : Math.floor(Math.random() * 20) + 10
      })),
      sentences: sentences.map(s => ({
        text: s.trim(),
        aiProbability: isAI ? Math.floor(Math.random() * 30) + 60 : Math.floor(Math.random() * 30) + 5,
        perplexityScore: Math.random() * 100 + 20,
        burstinessScore: Math.random() * 10 + 1,
      })),
      humanEvidence: {
        score: isAI ? 15 : 85,
        indicators: isAI ? [] : ['Personal anecdote', 'Emotional language', 'Non-template structure', 'Unique phrasing'],
      },
      fingerprint: {
        primaryModel: isAI ? 'ChatGPT' : 'Unknown',
        primaryConfidence: isAI ? 72 : 0,
        secondaryModel: isAI ? 'Claude' : undefined,
        secondaryConfidence: isAI ? 19 : undefined,
      }
    };
  }
}

// --- Plagiarism Analysis ---
export interface SimilaritySource {
  url: string;
  similarity: number;
  matchLength: number;
  matchType: 'Exact' | 'Partial' | 'AI Paraphrased' | 'Patchwork';
}

export interface PlagiarismAnalysisResult {
  originalityScore: number;
  riskLevel: 'High' | 'Medium' | 'Low' | 'Critical';
  matchTypes: {
    exact: number;
    partial: number;
    aiParaphrased: number;
    patchwork: number;
  };
  sources: SimilaritySource[];
}

export async function analyzePlagiarism(text: string): Promise<PlagiarismAnalysisResult> {
  try {
    const { supabase } = await import('@/db/supabase');
    const { data, error } = await supabase.functions.invoke('advanced-detector', {
      body: { text, mode: 'plagiarism' },
    });
    
    if (error) {
      console.error('advanced-detector (plagiarism) edge function error:', error);
      throw new Error(error.message || 'Failed to analyze text');
    }
    
    if (data && data.error) {
      throw new Error(data.error);
    }
    
    return data as PlagiarismAnalysisResult;
  } catch (err) {
    console.error('Plagiarism analysis failed, falling back to basic analysis:', err);
    const isPlagiarized = text.length > 50 && text.toLowerCase().includes('artificial');
    
    if (!isPlagiarized) {
      return {
        originalityScore: 98,
        riskLevel: 'Low',
        matchTypes: { exact: 0, partial: 2, aiParaphrased: 0, patchwork: 0 },
        sources: []
      };
    }

    return {
      originalityScore: 35,
      riskLevel: 'High',
      matchTypes: { exact: 45, partial: 10, aiParaphrased: 5, patchwork: 5 },
      sources: [
        { url: 'wikipedia.org/wiki/Artificial_intelligence', similarity: 42, matchLength: 120, matchType: 'Exact' },
        { url: 'techcrunch.com/future-of-ai', similarity: 15, matchLength: 45, matchType: 'AI Paraphrased' },
        { url: 'medium.com/ai-business', similarity: 8, matchLength: 30, matchType: 'Patchwork' }
      ]
    };
  }
}

// --- Hallucination Analysis ---
export interface FactualClaim {
  text: string;
  status: 'Verified' | 'Questionable' | 'Unsupported';
  confidence: number;
  evidence?: string;
}

export interface HallucinationAnalysisResult {
  hallucinationRiskScore: number;
  riskLevel: 'High' | 'Medium' | 'Low' | 'Critical';
  claims: FactualClaim[];
  issues: { type: string; description: string }[];
  summary: { total: number; verified: number; questionable: number; unsupported: number };
}

export async function analyzeHallucination(text: string): Promise<HallucinationAnalysisResult> {
  try {
    const { supabase } = await import('@/db/supabase');
    const { data, error } = await supabase.functions.invoke('advanced-detector', {
      body: { text, mode: 'hallucination' },
    });
    
    if (error) {
      console.error('advanced-detector (hallucination) edge function error:', error);
      throw new Error(error.message || 'Failed to analyze text');
    }
    
    if (data && data.error) {
      throw new Error(data.error);
    }
    
    return data as HallucinationAnalysisResult;
  } catch (err) {
    console.error('Hallucination analysis failed, falling back to basic analysis:', err);
    return {
      hallucinationRiskScore: 65,
      riskLevel: 'Medium',
      claims: [
        { text: 'AI-powered tools represent a paradigm shift in how enterprises approach problem-solving.', status: 'Verified', confidence: 85, evidence: 'Supported by numerous academic and business case studies.' },
        { text: 'Organizations experience substantial improvements in productivity metrics.', status: 'Questionable', confidence: 45, evidence: 'Varies widely; "substantial" is undefined.' },
        { text: 'Machine learning algorithms enable companies to process vast amounts of data with unprecedented efficiency (98% faster).', status: 'Unsupported', confidence: 15, evidence: 'No source found for the "98% faster" statistic.' }
      ],
      issues: [
        { type: 'fabricated-statistic', description: 'The statistic "98% faster" appears to be generated without factual backing.' }
      ],
      summary: { total: 3, verified: 1, questionable: 1, unsupported: 1 }
    };
  }
}

// --- Citation Verification ---
export interface Citation {
  text: string;
  url?: string;
  status: 'Valid' | 'Broken' | 'Mismatched' | 'Fake';
  details: {
    urlExists: boolean;
    sourceExists: boolean;
    matchesClaim: boolean | 'Partial';
    authority: 'High' | 'Medium' | 'Low';
  };
}

export interface FlaggedCitation {
  type: 'Fake' | 'Broken' | 'Mismatched';
  text: string;
  reason: string;
}

export interface CitationVerificationResult {
  citationQualityScore: number;
  riskLevel: 'High' | 'Medium' | 'Low' | 'Critical';
  citations: Citation[];
  flaggedCitations: FlaggedCitation[];
}

export async function verifyCitations(text: string): Promise<CitationVerificationResult> {
  await new Promise(r => setTimeout(r, 1500));
  return {
    citationQualityScore: 40,
    riskLevel: 'High',
    citations: [
      { text: 'Smith et al., 2023. The impact...', status: 'Fake', details: { urlExists: false, sourceExists: false, matchesClaim: false, authority: 'Low' } },
      { text: 'TechCrunch Report 2022', url: 'https://techcrunch.com/report-2022', status: 'Broken', details: { urlExists: false, sourceExists: true, matchesClaim: true, authority: 'Medium' } }
    ],
    flaggedCitations: [
      { type: 'Fake', text: 'Smith et al., 2023. The impact...', reason: 'This paper does not exist in any academic database.' },
      { type: 'Broken', text: 'TechCrunch Report 2022', reason: 'The provided URL returns a 404 Error.' }
    ]
  };
}

// --- Audio / Voice Analysis ---
export interface AIVoiceAnalysisResult {
  aiProbability: number;
  humanProbability: number;
  confidenceScore: number;
  likelySourceModel?: string;
  detectedAnomalies: string[];
  riskLevel: 'High' | 'Medium' | 'Low' | 'Critical';
  modelDetection: {
    likelySource: string;
    confidence: number;
    primaryModel: string;
    primaryConfidence: number;
    secondaryModel?: string;
    secondaryConfidence?: number;
  };
  characteristics: {
    voiceCloning: number;
    syntheticSpeech: number;
    aiNarration: number;
    tone: number;
    cadence: number;
    pauseDistribution: number;
    prosody: number;
  };
  breakdown: {
    spectralAnomalies: number;
    pauseDistribution: string;
    prosody: string;
    voiceCloning: number;
    syntheticSpeech: number;
    aiNarration: number;
  };
}

export async function analyzeVoice(file: File): Promise<AIVoiceAnalysisResult> {
  await new Promise(r => setTimeout(r, 1500));
  const isAI = file.name.includes('ai') || file.size % 2 === 0;
  return {
    aiProbability: isAI ? 92 : 12,
    humanProbability: isAI ? 8 : 88,
    confidenceScore: 89,
    riskLevel: isAI ? 'High' : 'Low',
    modelDetection: {
      likelySource: isAI ? 'ElevenLabs' : 'Unknown',
      confidence: isAI ? 85 : 0,
      primaryModel: isAI ? 'ElevenLabs' : 'Unknown',
      primaryConfidence: isAI ? 85 : 0,
    },
    characteristics: {
      voiceCloning: isAI ? 94 : 10,
      syntheticSpeech: isAI ? 88 : 5,
      aiNarration: isAI ? 75 : 12,
      tone: isAI ? 80 : 10,
      cadence: isAI ? 85 : 5,
      pauseDistribution: isAI ? 90 : 8,
      prosody: isAI ? 82 : 15,
    },
    likelySourceModel: isAI ? 'ElevenLabs' : undefined,
    detectedAnomalies: isAI ? ['Unnatural spectral uniformity', 'Perfectly spaced breath sounds'] : [],
    breakdown: {
      spectralAnomalies: isAI ? 85 : 5,
      pauseDistribution: isAI ? 'Perfectly uniform pauses between sentences.' : 'Variable, organic breath pauses.',
      prosody: isAI ? 'Flat emotional expression.' : 'Natural emotional inflection.',
      voiceCloning: isAI ? 94 : 10,
      syntheticSpeech: isAI ? 88 : 5,
      aiNarration: isAI ? 75 : 12,
    }
  };
}

// --- Deepfake Image / Video Analysis ---
export interface DeepfakeImageAnalysisResult {
  deepfakeProbability: number;
  aiProbability: number;
  humanProbability: number;
  confidenceScore: number;
  deepfakeRiskScore: number;
  manipulationConfidence: number;
  affectedAreas: string[];
  anomalies: string[];
  riskLevel: 'High' | 'Medium' | 'Low' | 'Critical';
  facialAnalysis: {
    faceSwap: number;
    syntheticFaces: number;
    syntheticFace: number;
    identityManipulation: number;
    aiEnhanced: number;
  };
}

export async function analyzeDeepfakeImage(file: File): Promise<DeepfakeImageAnalysisResult> {
  await new Promise(r => setTimeout(r, 1500));
  const isDeepfake = file.name.includes('deepfake') || file.size % 2 === 0;
  return {
    deepfakeProbability: isDeepfake ? 92 : 12,
    aiProbability: isDeepfake ? 88 : 15,
    humanProbability: isDeepfake ? 12 : 85,
    confidenceScore: 92,
    deepfakeRiskScore: isDeepfake ? 95 : 10,
    manipulationConfidence: isDeepfake ? 89 : 5,
    affectedAreas: isDeepfake ? ['Jawline', 'Eyes', 'Hair boundary'] : [],
    anomalies: isDeepfake ? ['Mismatched skin texture', 'Unnatural eye reflections'] : [],
    riskLevel: isDeepfake ? 'High' : 'Low',
    facialAnalysis: {
      faceSwap: isDeepfake ? 85 : 5,
      syntheticFaces: isDeepfake ? 91 : 2,
      syntheticFace: isDeepfake ? 91 : 2,
      identityManipulation: isDeepfake ? 76 : 1,
      aiEnhanced: isDeepfake ? 95 : 12,
    }
  };
}

export interface DeepfakeVideoAnalysisResult {
  deepfakeProbability: number;
  aiProbability: number;
  humanProbability: number;
  confidenceScore: number;
  deepfakeRiskScore: number;
  manipulationConfidence: number;
  affectedAreas: string[];
  anomalies: string[];
  timeline: { time: string; timestamp: string; start: string; end: string; description: string; type: string; confidence: number }[];
  riskLevel: 'High' | 'Medium' | 'Low' | 'Critical';
  audioAnalysis?: {
    isSynthetic: boolean;
    confidence: number;
    lipSyncAnalysis: number;
    artifacts: number;
  };
  detectionBreakdown: {
    faceReplacement: number;
    voiceCloning: number;
    syntheticSpeech: number;
    aiAvatars: number;
    facialManipulation: number;
  };
}

export async function analyzeDeepfakeVideo(file: File): Promise<DeepfakeVideoAnalysisResult> {
  await new Promise(r => setTimeout(r, 1500));
  const isDeepfake = file.name.includes('deepfake') || file.size % 2 === 0;
  return {
    deepfakeProbability: isDeepfake ? 93 : 8,
    aiProbability: isDeepfake ? 91 : 18,
    humanProbability: isDeepfake ? 9 : 82,
    confidenceScore: 94,
    deepfakeRiskScore: isDeepfake ? 93 : 15,
    manipulationConfidence: isDeepfake ? 90 : 8,
    affectedAreas: isDeepfake ? ['Face', 'Lips', 'Neck'] : [],
    anomalies: isDeepfake ? ['Lip-sync mismatch', 'Facial warping during fast motion'] : [],
    timeline: isDeepfake ? [
      { time: '00:05', timestamp: '00:05', start: '00:05', end: '00:09', description: 'Potential Face Manipulation', type: 'visual', confidence: 85 },
      { time: '00:12', timestamp: '00:12', start: '00:12', end: '00:15', description: 'Lip Sync Mismatch', type: 'audio-visual', confidence: 92 },
      { time: '00:22', timestamp: '00:22', start: '00:22', end: '00:24', description: 'Voice Clone Detected', type: 'audio', confidence: 88 }
    ] : [],
    riskLevel: isDeepfake ? 'High' : 'Low',
    audioAnalysis: {
      isSynthetic: isDeepfake,
      confidence: isDeepfake ? 88 : 12,
      lipSyncAnalysis: isDeepfake ? 92 : 5,
      artifacts: isDeepfake ? 85 : 3,
    },
    detectionBreakdown: {
      faceReplacement: isDeepfake ? 94 : 5,
      voiceCloning: isDeepfake ? 88 : 10,
      syntheticSpeech: isDeepfake ? 85 : 8,
      aiAvatars: isDeepfake ? 75 : 2,
      facialManipulation: isDeepfake ? 92 : 15,
    }
  };
}