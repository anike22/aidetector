import type { AuthorshipPublicCertificate } from './types';

/**
 * Generates dynamic SVG verification badge with status colors
 */
export function generateSvgBadge(cert: AuthorshipPublicCertificate, origin = 'https://www.aidetector.cx'): string {
  const authorName = cert.collaborators?.[0]?.name || 'Creator';
  const statusColor = cert.status === 'active' ? '#10b981' : cert.status === 'pending_conflict_review' ? '#f59e0b' : '#ef4444';
  const statusText = cert.status === 'active' ? 'VERIFIED AUTHORSHIP' : cert.status.replace(/_/g, ' ').toUpperCase();

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 50" width="340" height="50" role="img" aria-label="AIDetector.cx Verified Authorship">
  <rect width="340" height="50" rx="8" fill="#0f172a"/>
  <rect x="2" y="2" width="336" height="46" rx="6" fill="#1e293b" stroke="#334155" stroke-width="1"/>
  <circle cx="25" cy="25" r="10" fill="${statusColor}" opacity="0.2"/>
  <circle cx="25" cy="25" r="5" fill="${statusColor}"/>
  <text x="45" y="21" fill="#94a3b8" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="10" font-weight="600" letter-spacing="0.5">${statusText}</text>
  <text x="45" y="36" fill="#f8fafc" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="12" font-weight="700">${cert.trackingCode}</text>
  <text x="280" y="29" fill="#38bdf8" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="11" font-weight="600">AIDetector.cx</text>
</svg>`;
}

/**
 * Generates all export formats for an Authorship Certificate
 */
export function generateExportSnippets(cert: AuthorshipPublicCertificate, origin = 'https://www.aidetector.cx') {
  const verificationUrl = `${origin}/verify/${cert.trackingCode}`;
  const authorName = cert.collaborators?.[0]?.name || 'Attested Creator';

  return {
    verificationUrl,
    markdownBadge: `[![Verified Authorship with AIDetector.cx — ${cert.trackingCode}](${origin}/api/v1/authorship/${cert.trackingCode}/badge.svg)](${verificationUrl})`,
    markdownLink: `[Authorship registered with AIDetector.cx — ${cert.trackingCode}](${verificationUrl})`,
    wordpressShortcode: `[aidetector_authorship code="${cert.trackingCode}" style="compact"]`,
    htmlEmbed: `<!-- AIDetector.cx Verified Authorship Badge -->
<a href="${verificationUrl}" target="_blank" rel="noopener noreferrer" data-tracking-code="${cert.trackingCode}" style="text-decoration:none;display:inline-block;">
  <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:inline-flex;align-items:center;gap:8px;padding:6px 12px;background:#0f172a;color:#fff;border-radius:6px;font-size:12px;border:1px solid #334155;">
    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;"></span>
    <span><strong>Registered Authorship:</strong> ${cert.title.replace(/"/g, '&quot;')}</span>
    <span style="color:#38bdf8;margin-left:4px;">${cert.trackingCode}</span>
  </div>
</a>`,
    webflowEmbed: `<div class="aidetector-authorship-embed" data-tracking-code="${cert.trackingCode}">
  <a href="${verificationUrl}" target="_blank" rel="noopener">
    <img src="${origin}/api/v1/authorship/${cert.trackingCode}/badge.svg" alt="Verified Authorship on AIDetector.cx" width="340" height="50" style="max-width:100%;height:auto;" />
  </a>
</div>`,
    ghostEmbed: `<figure class="kg-card kg-embed-card">
  <iframe src="${origin}/embed/certificate/${cert.trackingCode}" width="100%" height="80" frameborder="0" scrolling="no" style="border:none;overflow:hidden;border-radius:8px;"></iframe>
</figure>`,
    jsonManifest: {
      platform: 'AIDetector.cx Verified Authorship',
      schemaVersion: '2.0',
      trackingCode: cert.trackingCode,
      title: cert.title,
      subtitle: cert.subtitle || null,
      author: authorName,
      registeredAt: cert.createdAt,
      version: cert.currentVersionNumber || 1,
      status: cert.status,
      contentHash: cert.contentHash,
      verificationUrl,
      integrityGateSummary: cert.integrityGateSummary,
      legalDisclaimer: 'AIDetector.cx records a timestamped, cryptographically verifiable authorship claim. This certificate is not government copyright registration.',
    },
  };
}
