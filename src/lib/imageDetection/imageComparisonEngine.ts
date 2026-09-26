// Image Comparison Engine: Computes pixel delta difference maps between two images

import { loadImageElement } from './elaForensics';
import type { ImageComparisonResult } from './types';

/**
 * Compares two images (Original vs Edited) and generates difference visualization
 */
export async function compareOriginalVsEditedImages(
  originalFile: File,
  editedFile: File
): Promise<ImageComparisonResult> {
  const [origImg, editImg] = await Promise.all([
    loadImageElement(originalFile),
    loadImageElement(editedFile),
  ]);

  const w = Math.min(origImg.naturalWidth || origImg.width, editImg.naturalWidth || editImg.width, 1024);
  const h = Math.min(origImg.naturalHeight || origImg.height, editImg.naturalHeight || editImg.height, 1024);

  // Canvas A: Original
  const origCanvas = document.createElement('canvas');
  origCanvas.width = w;
  origCanvas.height = h;
  const origCtx = origCanvas.getContext('2d', { willReadFrequently: true });
  if (!origCtx) throw new Error('Canvas 2D context unavailable');
  origCtx.drawImage(origImg, 0, 0, w, h);
  const origData = origCtx.getImageData(0, 0, w, h);

  // Canvas B: Edited
  const editCanvas = document.createElement('canvas');
  editCanvas.width = w;
  editCanvas.height = h;
  const editCtx = editCanvas.getContext('2d', { willReadFrequently: true });
  if (!editCtx) throw new Error('Canvas 2D context unavailable');
  editCtx.drawImage(editImg, 0, 0, w, h);
  const editData = editCtx.getImageData(0, 0, w, h);

  // Diff Canvas
  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = w;
  diffCanvas.height = h;
  const diffCtx = diffCanvas.getContext('2d', { willReadFrequently: true });
  if (!diffCtx) throw new Error('Canvas 2D context unavailable');
  const diffData = diffCtx.createImageData(w, h);

  let alteredPixelsCount = 0;
  const threshold = 15; // Noise threshold
  const totalPixels = w * h;

  const gridRows = 8;
  const gridCols = 8;
  const cellW = Math.floor(w / gridCols);
  const cellH = Math.floor(h / gridRows);
  const cellAlteredCounts: number[][] = Array.from({ length: gridRows }, () => Array(gridCols).fill(0));

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const dr = Math.abs(origData.data[idx] - editData.data[idx]);
      const dg = Math.abs(origData.data[idx + 1] - editData.data[idx + 1]);
      const db = Math.abs(origData.data[idx + 2] - editData.data[idx + 2]);
      const totalDelta = (dr + dg + db) / 3;

      if (totalDelta > threshold) {
        alteredPixelsCount++;
        // Highlight in vibrant red/magenta overlay on diff canvas
        diffData.data[idx] = Math.min(255, 180 + Math.round(totalDelta * 0.7)); // R
        diffData.data[idx + 1] = Math.max(0, 40 - Math.round(totalDelta * 0.2)); // G
        diffData.data[idx + 2] = Math.min(255, 60 + Math.round(totalDelta * 0.5)); // B
        diffData.data[idx + 3] = 230;

        const gx = Math.min(gridCols - 1, Math.floor(x / cellW));
        const gy = Math.min(gridRows - 1, Math.floor(y / cellH));
        cellAlteredCounts[gy][gx]++;
      } else {
        // Subtle faded background of the edited image
        diffData.data[idx] = Math.round(editData.data[idx] * 0.35);
        diffData.data[idx + 1] = Math.round(editData.data[idx + 1] * 0.35);
        diffData.data[idx + 2] = Math.round(editData.data[idx + 2] * 0.35);
        diffData.data[idx + 3] = 255;
      }
    }
  }

  diffCtx.putImageData(diffData, 0, 0);
  const diffHeatmapUrl = diffCanvas.toDataURL('image/jpeg', 0.85);

  const alteredAreaPercent = parseFloat(((alteredPixelsCount / (totalPixels || 1)) * 100).toFixed(1));
  const differenceScore = Math.min(100, Math.round(alteredAreaPercent * 1.5));

  const detectedChanges: ImageComparisonResult['detectedChanges'] = [];
  const cellTotalPixels = cellW * cellH;

  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const count = cellAlteredCounts[r][c];
      const cellPercent = (count / (cellTotalPixels || 1)) * 100;
      if (cellPercent > 18) {
        detectedChanges.push({
          region: [
            Math.round((c / gridCols) * 100),
            Math.round((r / gridRows) * 100),
            Math.round((1 / gridCols) * 100),
            Math.round((1 / gridRows) * 100),
          ],
          type: cellPercent > 60 ? 'inpainting' : 'color_adjusted',
          description: `Quadrant (${c + 1}, ${r + 1}): ~${Math.round(cellPercent)}% pixels modified`,
        });
      }
    }
  }

  let summary = '';
  if (alteredAreaPercent < 1.0) {
    summary = 'Images are virtually identical with minimal compression or raster noise variances.';
  } else if (alteredAreaPercent < 15) {
    summary = `Localized modifications detected in ${detectedChanges.length} region(s), affecting approximately ${alteredAreaPercent}% of the image area.`;
  } else {
    summary = `Substantial compositional changes detected across ${alteredAreaPercent}% of the visual canvas.`;
  }

  return {
    id: `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    analyzedAt: new Date().toISOString(),
    originalFileName: originalFile.name,
    editedFileName: editedFile.name,
    differenceScore,
    alteredAreaPercent,
    diffHeatmapUrl,
    detectedChanges: detectedChanges.slice(0, 8),
    summary,
  };
}
