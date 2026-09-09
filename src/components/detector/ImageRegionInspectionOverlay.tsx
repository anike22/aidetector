// Interactive Zoomable Region Inspection & ELA Heatmap Overlay Component

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Layers, Eye, ZoomIn, ZoomOut, RotateCcw,
  Sparkles, AlertCircle, Info, ShieldAlert
} from 'lucide-react';
import type { ImageAnalysisResult } from '@/lib/imageDetection/types';

interface Props {
  result: ImageAnalysisResult;
}

export default function ImageRegionInspectionOverlay({ result }: Props) {
  const [activeLayer, setActiveLayer] = useState<'original' | 'ela' | 'noise' | 'blend'>('blend');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(65);
  const [zoom, setZoom] = useState<number>(1);
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [selectedBox, setSelectedBox] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoom((z) => Math.min(3, parseFloat((z + 0.25).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.75, parseFloat((z - 0.25).toFixed(2))));
  const handleResetZoom = () => setZoom(1);

  const regions = result.manipulation.regionsDetected || [];

  return (
    <Card className="border-border bg-card shadow-sm overflow-hidden">
      <CardHeader className="py-3 px-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-semibold text-foreground">
            Interactive Forensic Region Inspection & Heatmaps
          </CardTitle>
          {regions.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {regions.length} Anomaly Cluster{regions.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Layer switch buttons */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg self-start md:self-auto">
          <Button
            size="sm"
            variant={activeLayer === 'original' ? 'secondary' : 'ghost'}
            className="h-7 text-xs px-2"
            onClick={() => setActiveLayer('original')}
          >
            Original
          </Button>
          <Button
            size="sm"
            variant={activeLayer === 'blend' ? 'secondary' : 'ghost'}
            className="h-7 text-xs px-2"
            onClick={() => setActiveLayer('blend')}
          >
            ELA Overlay
          </Button>
          <Button
            size="sm"
            variant={activeLayer === 'ela' ? 'secondary' : 'ghost'}
            className="h-7 text-xs px-2"
            onClick={() => setActiveLayer('ela')}
          >
            ELA Only
          </Button>
          <Button
            size="sm"
            variant={activeLayer === 'noise' ? 'secondary' : 'ghost'}
            className="h-7 text-xs px-2"
            onClick={() => setActiveLayer('noise')}
          >
            Noise Residuals
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex flex-col gap-4">
        {/* Viewport controls toolbar */}
        <div className="flex items-center justify-between gap-4 flex-wrap text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="font-medium text-foreground">Overlay Opacity:</span>
            <div className="w-28">
              <Slider
                value={[overlayOpacity]}
                min={10}
                max={100}
                step={5}
                onValueChange={(val) => setOverlayOpacity(val[0])}
                disabled={activeLayer === 'original'}
              />
            </div>
            <span className="w-8">{overlayOpacity}%</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={showBoxes ? 'secondary' : 'outline'}
              className="h-7 text-xs px-2 gap-1"
              onClick={() => setShowBoxes(!showBoxes)}
            >
              <Eye className="w-3.5 h-3.5" />
              {showBoxes ? 'Hide Bounding Boxes' : 'Show Bounding Boxes'}
            </Button>
            <div className="h-4 w-px bg-border mx-1" />
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleZoomOut} title="Zoom out">
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="font-mono">{Math.round(zoom * 100)}%</span>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleZoomIn} title="Zoom in">
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            {zoom !== 1 && (
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleResetZoom} title="Reset zoom">
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Visual Canvas Viewer */}
        <div
          ref={containerRef}
          className="relative w-full min-h-80 max-h-[500px] overflow-auto rounded-lg border border-border bg-slate-950 flex items-center justify-center p-2 select-none"
        >
          <div
            className="relative transition-transform duration-150 inline-block"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          >
            {/* Base Image */}
            <img
              src={result.previewUrl}
              alt="Analyzed target"
              className="max-h-[460px] max-w-full rounded object-contain block"
            />

            {/* ELA Heatmap Layer */}
            {(activeLayer === 'ela' || activeLayer === 'blend') && result.heatmapUrl && (
              <img
                src={result.heatmapUrl}
                alt="ELA Heatmap"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none rounded"
                style={{
                  opacity: activeLayer === 'ela' ? 1 : overlayOpacity / 100,
                  mixBlendMode: activeLayer === 'blend' ? 'screen' : 'normal',
                }}
              />
            )}

            {/* Noise Residual Layer */}
            {activeLayer === 'noise' && result.noiseMapUrl && (
              <img
                src={result.noiseMapUrl}
                alt="High frequency noise map"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none rounded"
                style={{ opacity: overlayOpacity / 100 }}
              />
            )}

            {/* Suspected Manipulated Bounding Boxes */}
            {showBoxes &&
              regions.map((reg) => {
                const [x, y, w, h] = reg.box;
                const isSelected = selectedBox === reg.id;
                return (
                  <div
                    key={reg.id}
                    onClick={() => setSelectedBox(isSelected ? null : reg.id)}
                    className={`absolute border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-yellow-400 bg-yellow-400/20 ring-2 ring-yellow-400'
                        : 'border-red-500 bg-red-500/15 hover:border-red-400 hover:bg-red-500/25'
                    }`}
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      width: `${Math.max(w, 4)}%`,
                      height: `${Math.max(h, 4)}%`,
                    }}
                    title={`${reg.label} (${reg.confidence}% confidence)`}
                  >
                    <span className="absolute -top-5 left-0 bg-red-600 text-white text-[10px] font-bold px-1 rounded shadow whitespace-nowrap">
                      {reg.confidence}% Anomaly
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Legend and Interpretation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-2.5 rounded-lg border border-border bg-muted/20">
            <div className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
              Dark / Blue Tones (Uniform)
            </div>
            <p className="text-muted-foreground">
              Consistent error level matching image-wide JPEG compression baseline. Indicates authentic untouched pixels.
            </p>
          </div>

          <div className="p-2.5 rounded-lg border border-border bg-muted/20">
            <div className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block" />
              Bright / Yellow Discrepancies
            </div>
            <p className="text-muted-foreground">
              Different compression generation or high-frequency edge transition typical of spliced objects or inpainting.
            </p>
          </div>

          <div className="p-2.5 rounded-lg border border-border bg-muted/20">
            <div className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              Red Bounding Outliers
            </div>
            <p className="text-muted-foreground">
              Statistically significant regional variance anomalies flagged for manual forensic inspection.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
