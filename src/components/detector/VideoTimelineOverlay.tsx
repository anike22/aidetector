import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock, AlertTriangle, Eye, ShieldAlert, Film,
  Layers, Volume2, Info, ChevronRight, Activity
} from 'lucide-react';
import type { SuspiciousInterval, ShotBoundary } from '@/lib/videoDetection/types';

interface VideoTimelineOverlayProps {
  duration: number;
  intervals: SuspiciousInterval[];
  shotBoundaries: ShotBoundary[];
  previewUrl: string | null;
  onSeek?: (timestamp: number) => void;
}

export default function VideoTimelineOverlay({
  duration,
  intervals,
  shotBoundaries,
  previewUrl,
  onSeek,
}: VideoTimelineOverlayProps) {
  const [selectedIntervalId, setSelectedIntervalId] = useState<string | null>(
    intervals[0]?.id || null
  );

  const selectedInterval = intervals.find((i) => i.id === selectedIntervalId) || intervals[0] || null;

  const handleIntervalClick = (interval: SuspiciousInterval) => {
    setSelectedIntervalId(interval.id);
    onSeek?.(interval.startTimestamp);
  };

  return (
    <Card className="border-border bg-card shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
            <Clock className="w-4 h-4 text-primary" />
            Interactive Temporal Localization Timeline ({duration.toFixed(1)}s)
          </CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-destructive" /> Visual Anomaly
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Audio / Lip Sync
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full border border-primary bg-primary/20" /> Shot Boundary
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 flex flex-col gap-6">
        {/* Scrubable Timeline Track */}
        <div className="flex flex-col gap-2">
          <div className="relative w-full h-12 bg-slate-900 rounded-lg overflow-hidden border border-border p-1">
            {/* Shot boundaries markers */}
            {shotBoundaries.map((shot) => {
              const leftPercent = (shot.startTime / duration) * 100;
              return (
                <div
                  key={`shot_${shot.shotIndex}`}
                  className="absolute top-0 bottom-0 w-px bg-slate-700 z-10"
                  style={{ left: `${leftPercent}%` }}
                  title={`Shot ${shot.shotIndex} (${shot.startTime}s)`}
                />
              );
            })}

            {/* Suspicious Intervals Blocks */}
            {intervals.map((interval) => {
              const leftPercent = (interval.startTimestamp / duration) * 100;
              const widthPercent = Math.max(
                3,
                ((interval.endTimestamp - interval.startTimestamp) / duration) * 100
              );
              const isSelected = interval.id === selectedInterval?.id;
              const isAudio = interval.modality === 'audio';

              return (
                <button
                  key={interval.id}
                  onClick={() => handleIntervalClick(interval)}
                  className={`absolute top-1.5 bottom-1.5 rounded transition-all cursor-pointer z-20 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${
                    isAudio ? 'bg-amber-500/90 hover:bg-amber-500' : 'bg-destructive/90 hover:bg-destructive'
                  } ${isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 scale-105 z-30' : 'opacity-85'}`}
                  style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                  title={`${interval.category} (${interval.startTimestamp}s - ${interval.endTimestamp}s)`}
                >
                  {widthPercent > 8 && `${interval.signalStrength}%`}
                </button>
              );
            })}
          </div>

          {/* Time tick labels */}
          <div className="flex justify-between text-[11px] text-muted-foreground px-1 font-mono">
            <span>0.0s</span>
            <span>{(duration * 0.25).toFixed(1)}s</span>
            <span>{(duration * 0.5).toFixed(1)}s</span>
            <span>{(duration * 0.75).toFixed(1)}s</span>
            <span>{duration.toFixed(1)}s</span>
          </div>
        </div>

        {/* Selected Interval Detail Card */}
        {selectedInterval ? (
          <div className="border border-border/80 rounded-xl p-4 bg-muted/30 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Badge variant={selectedInterval.modality === 'audio' ? 'secondary' : 'destructive'} className="text-xs">
                  {selectedInterval.category}
                </Badge>
                <span className="text-sm font-semibold text-foreground">
                  Timestamp: {selectedInterval.startTimestamp.toFixed(1)}s – {selectedInterval.endTimestamp.toFixed(1)}s
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Signal Strength: <strong className="text-foreground">{selectedInterval.signalStrength}%</strong></span>
                <span>•</span>
                <span>Uncertainty: [{selectedInterval.uncertaintyRange[0]}% - {selectedInterval.uncertaintyRange[1]}%]</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px] block mb-1">
                  Affected Subject / Region
                </span>
                <p className="text-foreground font-medium flex items-center gap-1.5">
                  {selectedInterval.modality === 'audio' ? (
                    <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <Layers className="w-3.5 h-3.5 text-primary" />
                  )}
                  {selectedInterval.affectedSubject}
                </p>
                {selectedInterval.regionBoundingBox && (
                  <div className="mt-2 text-[11px] text-muted-foreground bg-muted/60 px-2.5 py-1.5 rounded-md">
                    Spatial Coordinates: [x: {(selectedInterval.regionBoundingBox.x * 100).toFixed(0)}%, y: {(selectedInterval.regionBoundingBox.y * 100).toFixed(0)}%, w: {(selectedInterval.regionBoundingBox.width * 100).toFixed(0)}%, h: {(selectedInterval.regionBoundingBox.height * 100).toFixed(0)}%]
                  </div>
                )}
              </div>

              <div>
                <span className="font-semibold text-muted-foreground uppercase tracking-wide text-[10px] block mb-1">
                  Alternative Explanations Considered
                </span>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                  {selectedInterval.alternativeExplanations.map((alt, idx) => (
                    <li key={idx} className="text-foreground/90">{alt}</li>
                  ))}
                </ul>
              </div>
            </div>

            {selectedInterval.supportingFrames.length > 0 && (
              <div className="mt-1 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Supporting Frame Evidence: </span>
                {selectedInterval.supportingFrames[0].description} (Frame #{selectedInterval.supportingFrames[0].frameIndex} @ {selectedInterval.supportingFrames[0].timestamp}s)
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-muted-foreground">
            No localized anomalies detected in the video stream.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
