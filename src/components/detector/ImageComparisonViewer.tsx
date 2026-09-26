// Original vs. Edited Side-by-Side and Difference Heatmap Comparator

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Upload, GitCompare, ArrowRightLeft, Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { compareOriginalVsEditedImages } from '@/lib/imageDetection/imageComparisonEngine';
import type { ImageComparisonResult } from '@/lib/imageDetection/types';
import { toast } from 'sonner';

export default function ImageComparisonViewer() {
  const [origFile, setOrigFile] = useState<File | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [origPreview, setOrigPreview] = useState<string | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<ImageComparisonResult | null>(null);
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [viewMode, setViewMode] = useState<'split' | 'diff' | 'side-by-side'>('split');

  const handleOrigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      setOrigFile(f);
      setOrigPreview(URL.createObjectURL(f));
      setResult(null);
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      setEditFile(f);
      setEditPreview(URL.createObjectURL(f));
      setResult(null);
    }
  };

  const handleRunComparison = async () => {
    if (!origFile || !editFile) {
      toast.error('Please upload both the original and edited images to compare.');
      return;
    }
    setComparing(true);
    try {
      const res = await compareOriginalVsEditedImages(origFile, editFile);
      setResult(res);
      toast.success('Image difference comparison complete.');
    } catch (err: any) {
      toast.error(err.message || 'Comparison failed');
    } finally {
      setComparing(false);
    }
  };

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Original vs. Edited Difference Inspector
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Compare two supplied image files to isolate localized edits, generative inpainting, or composite alterations.
              </p>
            </div>
          </div>
          {result && (
            <Badge variant={result.alteredAreaPercent > 10 ? 'destructive' : 'secondary'} className="text-xs">
              {result.alteredAreaPercent}% Pixel Alteration
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 flex flex-col gap-6">
        {/* Upload Dual Zones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* File 1: Original */}
          <div className="border border-dashed border-border rounded-xl p-4 bg-muted/20 flex flex-col items-center justify-center min-h-48 text-center relative">
            {origPreview ? (
              <div className="flex flex-col items-center gap-2 w-full">
                <img src={origPreview} alt="Original" className="max-h-40 max-w-full rounded object-contain" />
                <span className="text-xs font-semibold text-foreground truncate max-w-xs">{origFile?.name}</span>
                <Badge variant="outline" className="text-[10px]">Reference / Original</Badge>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center gap-2 w-full">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">1. Upload Original Image</span>
                <span className="text-xs text-muted-foreground">JPG, PNG, WEBP up to 25MB</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleOrigChange} />
              </label>
            )}
          </div>

          {/* File 2: Edited / Suspicious */}
          <div className="border border-dashed border-border rounded-xl p-4 bg-muted/20 flex flex-col items-center justify-center min-h-48 text-center relative">
            {editPreview ? (
              <div className="flex flex-col items-center gap-2 w-full">
                <img src={editPreview} alt="Edited" className="max-h-40 max-w-full rounded object-contain" />
                <span className="text-xs font-semibold text-foreground truncate max-w-xs">{editFile?.name}</span>
                <Badge variant="destructive" className="text-[10px]">Edited / Candidate</Badge>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center gap-2 w-full">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">2. Upload Edited / Suspect Image</span>
                <span className="text-xs text-muted-foreground">JPG, PNG, WEBP up to 25MB</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleEditChange} />
              </label>
            )}
          </div>
        </div>

        {/* Action Button */}
        {origFile && editFile && !result && (
          <Button
            onClick={handleRunComparison}
            disabled={comparing}
            className="w-full bg-primary text-primary-foreground h-10 gap-2 font-semibold"
          >
            {comparing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Computing Pixel Discrepancies...
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4" /> Compare Images & Detect Modifications
              </>
            )}
          </Button>
        )}

        {/* Results Visualizer */}
        {result && origPreview && editPreview && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg text-xs">
                <Button
                  size="sm"
                  variant={viewMode === 'split' ? 'secondary' : 'ghost'}
                  className="h-7 text-xs px-2"
                  onClick={() => setViewMode('split')}
                >
                  Interactive Split Slider
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'diff' ? 'secondary' : 'ghost'}
                  className="h-7 text-xs px-2"
                  onClick={() => setViewMode('diff')}
                >
                  Difference Heatmap
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'side-by-side' ? 'secondary' : 'ghost'}
                  className="h-7 text-xs px-2"
                  onClick={() => setViewMode('side-by-side')}
                >
                  Side-by-Side
                </Button>
              </div>

              <div className="text-xs text-muted-foreground font-medium">
                {result.summary}
              </div>
            </div>

            {/* Split Slider Mode */}
            {viewMode === 'split' && (
              <div className="flex flex-col gap-3">
                <div className="relative w-full h-80 md:h-96 rounded-xl overflow-hidden border border-border bg-slate-950 select-none">
                  {/* Edited Image (Background) */}
                  <img
                    src={editPreview}
                    alt="Edited version"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  />

                  {/* Original Image (Clipped Foreground) */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPos}%` }}
                  >
                    <img
                      src={origPreview}
                      alt="Original version"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                      style={{ width: '100%', maxWidth: 'none' }}
                    />
                  </div>

                  {/* Divider Line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.8)] z-10 flex items-center justify-center pointer-events-none"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="w-6 h-6 rounded-full bg-white text-slate-900 shadow-md flex items-center justify-center text-[10px] font-bold">
                      ↔
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Original</span>
                  <Slider
                    value={[sliderPos]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(val) => setSliderPos(val[0])}
                    className="flex-1"
                  />
                  <span className="font-semibold text-foreground">Edited</span>
                </div>
              </div>
            )}

            {/* Diff Heatmap Mode */}
            {viewMode === 'diff' && (
              <div className="relative w-full h-80 md:h-96 rounded-xl overflow-hidden border border-border bg-slate-950 flex items-center justify-center p-2">
                <img
                  src={result.diffHeatmapUrl}
                  alt="Difference Heatmap"
                  className="max-h-full max-w-full object-contain rounded"
                />
              </div>
            )}

            {/* Side-by-Side Mode */}
            {viewMode === 'side-by-side' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-border rounded-xl p-3 bg-muted/20 flex flex-col items-center">
                  <span className="text-xs font-semibold mb-2 text-foreground">Original Image</span>
                  <img src={origPreview} alt="Original" className="max-h-64 object-contain rounded" />
                </div>
                <div className="border border-border rounded-xl p-3 bg-muted/20 flex flex-col items-center">
                  <span className="text-xs font-semibold mb-2 text-foreground">Edited Image</span>
                  <img src={editPreview} alt="Edited" className="max-h-64 object-contain rounded" />
                </div>
              </div>
            )}

            {/* Detected Change Quadrants */}
            {result.detectedChanges.length > 0 && (
              <div className="border border-border rounded-xl p-4 bg-muted/10 flex flex-col gap-2">
                <div className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Localized Alteration Breakdown ({result.detectedChanges.length} Quadrants)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.detectedChanges.map((ch, idx) => (
                    <div key={idx} className="p-2 rounded border border-border bg-card text-xs flex items-center justify-between">
                      <span className="text-muted-foreground">{ch.description}</span>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {ch.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
