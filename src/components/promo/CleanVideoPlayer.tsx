import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Subtitles,
} from 'lucide-react';
import { InteractiveVideoStage } from './InteractiveVideoStage';

interface CleanVideoPlayerProps {
  autoPlay?: boolean;
  onEnded?: () => void;
}

export function CleanVideoPlayer({
  autoPlay = true,
}: CleanVideoPlayerProps) {
  // We embed the rich, authentic, 60fps canvas-synchronized product walkthrough stage
  // in clean mode (hiding any format pills or editing UI)
  return (
    <div className="w-full h-full bg-slate-950 rounded-2xl overflow-hidden flex flex-col">
      <InteractiveVideoStage
        aspectRatio="16:9"
        autoPlay={autoPlay}
        cleanMode={true}
      />
    </div>
  );
}

export default CleanVideoPlayer;
