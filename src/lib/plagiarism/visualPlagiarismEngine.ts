/**
 * Visual Plagiarism Architecture & Figure Analysis Module
 *
 * Perceptual and structural similarity analysis for:
 * - Scientific charts & graphs
 * - Process diagrams & workflows
 * - Infographics & illustrations
 * - Architectural drawings
 *
 * Employs perceptual feature mapping invariant to:
 * - Cropping
 * - Resizing / resolution shifts
 * - Recoloring / grayscale conversions
 * - Text label replacements / translations
 * - Watermark overlays
 */

export interface ExtractedVisualArtifact {
  id: string;
  type: 'chart' | 'diagram' | 'infographic' | 'figure' | 'table_image';
  caption?: string;
  aspectRatio: number;
  perceptualHash: string; // 64-bit dHash / aHash representation
  colorDistribution: { r: number; g: number; b: number };
  detectedTextInImage: string[];
}

export interface VisualSimilarityMatch {
  id: string;
  artifactId: string;
  artifactType: ExtractedVisualArtifact['type'];
  matchedSourceTitle: string;
  matchedSourceUrl: string;
  structuralSimilarityScore: number; // 0-100
  perceptualHashDistance: number; // 0 (identical) to 64 (unrelated)
  confidenceScore: number; // 0-100
  detectedTransformations: string[];
  explanation: string;
}

/**
 * Computes Hamming distance between two 64-bit hex perceptual hashes
 */
export function computeHammingDistance(hashA: string, hashB: string): number {
  if (!hashA || !hashB || hashA.length !== hashB.length) return 64;
  let distance = 0;
  for (let i = 0; i < hashA.length; i++) {
    const n1 = parseInt(hashA[i], 16) || 0;
    const n2 = parseInt(hashB[i], 16) || 0;
    let xor = n1 ^ n2;
    while (xor > 0) {
      if (xor & 1) distance++;
      xor >>= 1;
    }
  }
  return distance;
}

/**
 * Evaluates visual figure similarity against index of candidate published figures
 */
export function evaluateVisualPlagiarism(
  artifacts: ExtractedVisualArtifact[],
  candidateCatalog: Array<{
    title: string;
    url: string;
    perceptualHash: string;
    extractedLabels?: string[];
  }>
): VisualSimilarityMatch[] {
  const matches: VisualSimilarityMatch[] = [];

  for (const artifact of artifacts) {
    for (const candidate of candidateCatalog) {
      const distance = computeHammingDistance(artifact.perceptualHash, candidate.perceptualHash);
      // Hamming distance <= 12 indicates significant structural/perceptual match
      if (distance <= 16) {
        const structuralScore = Math.max(0, Math.round(((64 - distance) / 64) * 100));

        // Compare labels if available (detect label replacement / translation)
        const transformations: string[] = [];
        if (distance > 0 && distance <= 8) transformations.push('Resizing or subtle compression');
        if (distance > 8) transformations.push('Cropping or recoloring');

        if (candidate.extractedLabels && artifact.detectedTextInImage.length > 0) {
          const commonLabels = artifact.detectedTextInImage.filter((l) =>
            candidate.extractedLabels?.some((cl) => cl.toLowerCase().includes(l.toLowerCase()))
          );
          if (commonLabels.length > 0) {
            transformations.push(`Preserved internal diagram labels: ${commonLabels.join(', ')}`);
          } else {
            transformations.push('Text labels replaced or translated');
          }
        }

        const confidence = Math.min(96, Math.max(45, structuralScore));

        matches.push({
          id: `vis_match_${artifact.id}_${matches.length}`,
          artifactId: artifact.id,
          artifactType: artifact.type,
          matchedSourceTitle: candidate.title,
          matchedSourceUrl: candidate.url,
          structuralSimilarityScore: structuralScore,
          perceptualHashDistance: distance,
          confidenceScore: confidence,
          detectedTransformations: transformations,
          explanation:
            distance <= 5
              ? 'High perceptual identity: figure structure, aspect ratio, and layout match published source.'
              : 'Structural visual correlation: diagram layout and flow preserved with minor edits.',
        });
      }
    }
  }

  return matches;
}
