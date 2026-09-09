// Evidence Report Generator: Exports comprehensive PDF/HTML and JSON forensic certificates

import type { ImageAnalysisResult } from './types';

/**
 * Generates structured JSON report download
 */
export function downloadJsonReport(result: ImageAnalysisResult): void {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `AIDetector_Report_${result.sha256.substring(0, 8)}_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Generates an official downloadable/printable HTML & PDF Evidence Report
 */
export function openPrintableEvidenceReport(result: ImageAnalysisResult): void {
  const win = window.open('', '_blank');
  if (!win) {
    alert('Please allow popups to view and print the Forensic Evidence Report');
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>AIDetector.cx – Forensic Evidence Certificate</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 36px;
      line-height: 1.5;
    }
    .container { max-width: 860px; margin: 0 auto; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand { font-size: 24px; font-weight: 700; letter-spacing: -0.03em; }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      background: #f1f5f9;
      color: #334155;
    }
    .badge-ai { background: #fee2e2; color: #991b1b; }
    .badge-auth { background: #dcfce7; color: #166534; }
    .badge-warn { background: #fef3c7; color: #92400e; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      background: #f8fafc;
    }
    .card-title { font-size: 14px; font-weight: 600; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
    .verdict-box {
      background: #0f172a;
      color: #ffffff;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .verdict-val { font-size: 22px; font-weight: 700; }
    .hash-row {
      font-family: monospace;
      font-size: 11px;
      background: #e2e8f0;
      padding: 6px 10px;
      border-radius: 4px;
      word-break: break-all;
      margin-top: 6px;
    }
    ul { margin: 6px 0; padding-left: 20px; font-size: 13px; color: #334155; }
    li { margin-bottom: 4px; }
    .meta-table { width: 100%; font-size: 13px; border-collapse: collapse; margin-top: 8px; }
    .meta-table td { padding: 6px 0; border-bottom: 1px solid #e2e8f0; }
    .meta-table td:first-child { font-weight: 600; color: #64748b; width: 40%; }
    .disclaimer {
      font-size: 11px;
      color: #64748b;
      margin-top: 32px;
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
    }
    .btn-print {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #0f172a;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }
    @media print {
      .btn-print { display: none; }
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
  <div class="container">
    <div class="header">
      <div>
        <div class="brand">AIDetector.cx</div>
        <div style="font-size: 13px; color: #64748b;">Automated Forensic Evidence Certificate</div>
      </div>
      <div style="text-align: right; font-size: 12px; color: #64748b;">
        <div><strong>Scan ID:</strong> ${result.id}</div>
        <div><strong>Date:</strong> ${new Date(result.analyzedAt).toUTCString()}</div>
      </div>
    </div>

    <!-- SHA-256 Checksum -->
    <div style="margin-bottom: 20px;">
      <div style="font-size: 12px; font-weight: 600; color: #475569;">FILE IDENTIFICATION (SHA-256 CRYPTOGRAPHIC DIGEST):</div>
      <div class="hash-row">${result.sha256}</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
        File: <strong>${result.fileName}</strong> | Size: ${(result.fileSize / 1024).toFixed(1)} KB | Format: ${result.fileType}
      </div>
    </div>

    <!-- Main Findings Verdict Banner -->
    <div class="verdict-box">
      <div>
        <div style="font-size: 12px; text-transform: uppercase; opacity: 0.8;">Primary AI Generation Finding</div>
        <div class="verdict-val">${result.aiGeneration.verdict}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 12px; opacity: 0.8;">Confidence Level</div>
        <div style="font-size: 18px; font-weight: 600;">${result.aiGeneration.confidenceLevel} (${result.aiGeneration.confidenceScore}%)</div>
      </div>
    </div>

    <!-- 4 Independent Finding Categories -->
    <div class="grid">
      <!-- 1. AI Generation Evidence -->
      <div class="card">
        <div class="card-title">1. AI Generation Evidence</div>
        <div style="font-weight: 600; margin-bottom: 6px;">Outcome: <span class="badge ${result.aiGeneration.verdict === 'Likely AI-generated' ? 'badge-ai' : result.aiGeneration.verdict === 'No strong AI-generation evidence' ? 'badge-auth' : 'badge-warn'}">${result.aiGeneration.verdict}</span></div>
        <ul>
          ${result.aiGeneration.reasoning.map((r) => `<li>${r}</li>`).join('')}
        </ul>
        ${result.aiGeneration.detectedGenerators.length > 0 ? `<div style="font-size: 12px; margin-top: 6px;"><strong>Identified Signatures:</strong> ${result.aiGeneration.detectedGenerators.join(', ')}</div>` : ''}
      </div>

      <!-- 2. Editing & Manipulation -->
      <div class="card">
        <div class="card-title">2. Editing & Manipulation Evidence</div>
        <div style="font-weight: 600; margin-bottom: 6px;">Outcome: <span class="badge ${result.manipulation.verdict === 'AI editing indicated' ? 'badge-ai' : result.manipulation.verdict === 'No significant manipulation detected' ? 'badge-auth' : 'badge-warn'}">${result.manipulation.verdict}</span></div>
        <ul>
          ${result.manipulation.reasoning.map((r) => `<li>${r}</li>`).join('')}
        </ul>
        <div style="font-size: 12px; margin-top: 6px;"><strong>ELA Delta Score:</strong> ${result.manipulation.elaDeltaScore}/100</div>
      </div>

      <!-- 3. Recorded Origin & Provenance -->
      <div class="card">
        <div class="card-title">3. Provenance & C2PA Records</div>
        <div style="font-weight: 600; margin-bottom: 6px;">C2PA Status: <span class="badge">${result.provenance.c2paStatus}</span></div>
        <table class="meta-table">
          <tr><td>Manifest Present:</td><td>${result.provenance.manifestPresent ? 'Yes (Signed)' : 'None detected'}</td></tr>
          <tr><td>Issuer / Authority:</td><td>${result.provenance.trustedIssuer || 'Unspecified'}</td></tr>
          <tr><td>EXIF Integrity:</td><td>${result.provenance.exifIntegrity}</td></tr>
          <tr><td>Hardware Make:</td><td>${result.provenance.cameraExif?.make || 'N/A (Stripped)'}</td></tr>
        </table>
      </div>

      <!-- 4. Image Quality & Reliability -->
      <div class="card">
        <div class="card-title">4. Image Quality & Fidelity</div>
        <div style="font-weight: 600; margin-bottom: 6px;">Status: <span class="badge">${result.quality.qualityVerdict}</span></div>
        <table class="meta-table">
          <tr><td>Dimensions:</td><td>${result.quality.width} × ${result.quality.height} px (${result.quality.megapixels} MP)</td></tr>
          <tr><td>Compression Estimate:</td><td>${result.quality.compressionQualityEstimate}/100</td></tr>
          <tr><td>Noise Characteristic:</td><td>${result.quality.noiseLevel}</td></tr>
          <tr><td>Permits Reliable Analysis:</td><td>${result.quality.permitsReliableAnalysis ? 'Yes' : 'Restricted (Low resolution)'}</td></tr>
        </table>
      </div>
    </div>

    <!-- Verification & Version Metadata -->
    <div class="card" style="margin-bottom: 24px;">
      <div class="card-title">Analysis System Versions & Diagnostic Parameters</div>
      <div style="font-size: 12px; color: #475569; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div><strong>Pipeline Engine:</strong> ${result.modelVersions.pipeline}</div>
        <div><strong>Spectral Classifier:</strong> ${result.modelVersions.spectralClassifier}</div>
        <div><strong>ELA Engine:</strong> ${result.modelVersions.elaEngine}</div>
        <div><strong>C2PA Parser:</strong> ${result.modelVersions.c2paParser}</div>
      </div>
    </div>

    <div class="disclaimer">
      <strong>Important Forensic Disclaimer:</strong> This certificate presents empirical statistical and cryptographic evidence derived from file structure, Error Level Analysis, high-frequency residuals, and metadata parsing. Detection results are probabilistic evidence and should be combined with human judgment and contextual source verification. AIDetector.cx does not guarantee 100% universal generator attribution.
    </div>
  </div>
</body>
</html>
  `;

  win.document.open();
  win.document.write(htmlContent);
  win.document.close();
}
