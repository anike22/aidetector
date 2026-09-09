// ─── Video Evidence Report Generator (Printable PDF & JSON) ──────────────────

import { VideoAnalysisResult } from './types';
import { VIDEO_MODE_CONFIGS } from './config';

/**
 * Downloads comprehensive JSON forensic evidence report
 */
export function downloadVideoJsonReport(result: VideoAnalysisResult): void {
  const jsonString = JSON.stringify(result, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `video-forensic-report-${result.sha256.substring(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Opens a clean, official printable forensic evidence certificate for video
 */
export function openPrintableVideoEvidenceReport(result: VideoAnalysisResult): void {
  const modeConfig = VIDEO_MODE_CONFIGS[result.mode];
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AIDetector.cx Multimodal Video Forensic Certificate - ${result.fileName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 40px;
      line-height: 1.5;
      max-width: 900px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      background: #f1f5f9;
      color: #0f172a;
      border: 1px solid #cbd5e1;
    }
    .verdict-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 6px solid #2563eb;
      padding: 16px 20px;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .card {
      border: 1px solid #e2e8f0;
      padding: 16px;
      border-radius: 8px;
      background: #ffffff;
    }
    .card-title {
      font-size: 14px;
      font-weight: 700;
      color: #334155;
      margin-bottom: 8px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      padding: 4px 0;
    }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
      word-break: break-all;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      margin-top: 32px;
      padding-top: 16px;
      font-size: 11px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 0; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 style="margin: 0; font-size: 22px; color: #0f172a;">AIDetector.cx Multimodal Video Forensic Certificate</h1>
      <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">Enterprise Video Integrity, Temporal Localization & Provenance Verification</p>
    </div>
    <div style="text-align: right;">
      <span class="badge">${result.mode.toUpperCase()} MODE</span>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Job ID: ${result.jobId}</div>
    </div>
  </div>

  <div class="verdict-box">
    <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Primary Forensic Classification (${modeConfig.name} &bull; Decision Threshold: ${modeConfig.syntheticDecisionThreshold}%)</div>
    <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 4px 0;">${result.summary.primaryVerdict}</div>
    <div style="font-size: 13px; font-weight: 600; color: #2563eb; margin-bottom: 6px;">AI Probability: ${result.summary.syntheticLikelihood}% &bull; Reliability Score: ${result.summary.overallReliabilityScore}%</div>
    <p style="margin: 6px 0 0; font-size: 13px; color: #334155;">${result.summary.conclusionParagraph}</p>
    <div style="margin-top: 8px; font-size: 11px; color: #64748b; font-style: italic;">
      Note: Modes adjust screening sensitivity or analysis depth. Their probability scores may match when the evidence supports the same estimate.
    </div>
  </div>

  <!-- Pre-Analysis Media Capabilities & Stream Verification -->
  <div class="card" style="margin-bottom: 20px;">
    <div class="card-title">Pre-Analysis Media Capabilities & Stream Verification</div>
    <div class="meta-row"><span>Recording / Processing Type:</span><strong>${result.summary.recordingProcessingType || result.mediaCapabilities?.recordingProcessingType || 'Unknown'}</strong></div>
    <div class="meta-row"><span>Content Assessment:</span><strong>${result.summary.contentAssessment || result.mediaCapabilities?.contentAssessment || 'Evaluated'}</strong></div>
    <div class="meta-row"><span>Audio Stream Status:</span><span>${result.mediaCapabilities?.audioStreamStatus || (result.audioEvidence.hasAudioTrack ? 'usable_speech' : 'absent')}</span></div>
    <div class="meta-row"><span>Trackable Faces:</span><span>${result.mediaCapabilities?.facesVisibleAndTrackable ? 'Detected & Trackable' : 'None (UI / Screen Activity)'}</span></div>
    <div class="meta-row"><span>Video Stream Coverage:</span><span>${result.mediaCapabilities?.decodedFrameCoverage || 100}% Decoded (${result.quality.width}x${result.quality.height})</span></div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-title">1. Visual Synthesis Evidence</div>
      <div class="meta-row"><span>Visual Anomaly Score:</span><strong>${result.visualEvidence.overallVisualScore}%</strong></div>
      <div class="meta-row"><span>Spatial Artifacts:</span><span>${result.visualEvidence.spatialArtifactScore}/100</span></div>
      <div class="meta-row"><span>Temporal Consistency:</span><span>${result.visualEvidence.temporalConsistencyScore}/100</span></div>
      <div class="meta-row"><span>Optical Flow Discontinuity:</span><span>${result.visualEvidence.opticalFlowAnomalyScore}/100</span></div>
      <div class="meta-row"><span>Facial Geometry Coherence:</span><span>${result.visualEvidence.faceAnalysisStatus === 'not_applicable' ? 'N/A (No trackable faces)' : `${result.visualEvidence.facialCoherenceScore}/100`}</span></div>
    </div>

    <div class="card">
      <div class="card-title">2. Audio & Semantic Evidence</div>
      <div class="meta-row"><span>Audio Track Present:</span><span>${result.audioEvidence.hasAudioTrack ? 'Yes' : 'No (Absent)'}</span></div>
      <div class="meta-row"><span>Voice Cloning Probability:</span><strong>${result.audioEvidence.voiceCloningStatus === 'not_applicable' ? 'N/A (No speech/audio)' : `${result.audioEvidence.voiceCloningProbability}%`}</strong></div>
      <div class="meta-row"><span>Lip-Sync Physical Alignment:</span><span>${result.audioEvidence.lipSyncStatus === 'not_applicable' ? 'N/A (No speaking face)' : `${result.audioEvidence.lipSyncCoherenceScore}%`}</span></div>
      <div class="meta-row"><span>Phoneme-Viseme Alignment:</span><span>${result.audioEvidence.lipSyncStatus === 'not_applicable' ? 'N/A (No speaking face)' : `${result.audioEvidence.phonemeVisemeAlignmentScore}%`}</span></div>
      <div class="meta-row"><span>Room Acoustic Continuity:</span><span>${result.audioEvidence.acousticReverbStatus === 'not_applicable' ? 'N/A (No audio stream)' : `${result.audioEvidence.roomAcousticContinuityScore}%`}</span></div>
    </div>

    <div class="card">
      <div class="card-title">3. Generator Attribution</div>
      <div class="meta-row"><span>Attribution Status:</span><strong>${result.attribution.status}</strong></div>
      <div class="meta-row"><span>Verified / Probable Source:</span><span>${result.attribution.verifiedSource || result.summary.likelyGenerator || 'Unattributed'}</span></div>
      <div class="meta-row"><span>Generator Architecture:</span><span>${result.attribution.generatorFamily || 'Unclassified'}</span></div>
      <div class="meta-row"><span>Confidence Score:</span><span>${result.attribution.confidenceScore > 0 ? `${result.attribution.confidenceScore}%` : 'N/A'}</span></div>
    </div>
      <div class="meta-row"><span>Attribution Status:</span><strong>${result.attribution.status}</strong></div>
      <div class="meta-row"><span>Verified / Probable Source:</span><span>${result.attribution.verifiedSource || result.summary.likelyGenerator || 'N/A'}</span></div>
      <div class="meta-row"><span>Generator Architecture:</span><span>${result.attribution.generatorFamily || 'Unclassified'}</span></div>
      <div class="meta-row"><span>Confidence Score:</span><span>${result.attribution.confidenceScore}%</span></div>
    </div>

    <div class="card">
      <div class="card-title">4. Creator False-Positive Shield</div>
      <div class="meta-row"><span>Shield Active:</span><span>${result.falsePositiveShield.shieldActive ? (result.mode === 'balanced' ? 'Active (Balanced Mode)' : 'Active (Evaluation Only)') : 'Inactive'}</span></div>
      <div class="meta-row"><span>Mitigations Evaluated:</span><span>${result.falsePositiveShield.evaluatedExplanations.length} techniques</span></div>
      <div class="meta-row"><span>Raw vs. Adjusted Score:</span><span>${result.falsePositiveShield.rawSyntheticScore}% &rarr; ${result.falsePositiveShield.adjustedSyntheticScore}%</span></div>
      <div class="meta-row"><span>Certainty Adjustment:</span><span>${result.falsePositiveShield.adjustedCertainty}%</span></div>
    </div>

    <div class="card">
      <div class="card-title">5. C2PA Provenance & Integrity</div>
      <div class="meta-row"><span>C2PA Manifest Status:</span><strong>${result.provenance.c2paStatus}</strong></div>
      <div class="meta-row"><span>Trusted Signer:</span><span>${result.provenance.trustedIssuer || 'None'}</span></div>
      <div class="meta-row"><span>Frame Sequence Integrity:</span><span>${result.provenance.frameSequenceIntegrityVerified ? 'Verified' : 'Unsigned'}</span></div>
      <div class="meta-row"><span>Watermark Detected:</span><span>${result.provenance.watermark.detected ? result.provenance.watermark.provider : 'None'}</span></div>
    </div>

    <div class="card">
      <div class="card-title">6. Video Quality & Reliability</div>
      <div class="meta-row"><span>Resolution & Codec:</span><span>${result.quality.width}x${result.quality.height} (${result.provenance.containerMetadata.codec})</span></div>
      <div class="meta-row"><span>Duration:</span><span>${result.durationSeconds.toFixed(1)}s (${result.quality.frameRate} fps)</span></div>
      <div class="meta-row"><span>Overall Reliability Score:</span><strong>${result.quality.reliabilityScore}%</strong></div>
      <div class="meta-row"><span>Confounding Factors:</span><span>${result.quality.confoundingFactors.length > 0 ? result.quality.confoundingFactors.join(', ') : 'None'}</span></div>
    </div>
  </div>

  <div class="card" style="margin-bottom: 24px;">
    <div class="card-title">Cryptographic File Hashes & Pipeline Metadata</div>
    <div class="meta-row"><span>File Name:</span><strong>${result.fileName}</strong></div>
    <div class="meta-row"><span>SHA-256 Fingerprint:</span><span class="mono">${result.sha256}</span></div>
    <div class="meta-row"><span>Pipeline Version:</span><span class="mono">${result.pipelineVersion}</span></div>
    <div class="meta-row"><span>Threshold Version:</span><span class="mono">${result.thresholdVersion}</span></div>
    <div class="meta-row"><span>Analyzed Timestamp:</span><span>${result.analyzedAt}</span></div>
  </div>

  <div class="footer">
    <span>AIDetector.cx Authenticity Verification Engine &bull; Zero-Retention Session</span>
    <span>Page 1 of 1</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(() => { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}
