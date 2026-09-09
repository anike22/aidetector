import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  FileText,
  Download,
  Layers,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { InteractiveVideoStage } from './InteractiveVideoStage';
import { Link } from 'react-router-dom';

export interface VideoFormatOption {
  id: string;
  label: string;
  duration: string;
  aspect: string;
  resolution: string;
  badge: string;
  src: string;
  audioSrc?: string;
  captionsSrc?: string;
  poster: string;
  description: string;
}

export const PROMO_FORMATS: VideoFormatOption[] = [
  {
    id: 'main_60s_captioned',
    label: 'Main Overview (Captioned)',
    duration: '60s',
    aspect: '16:9',
    resolution: '1920×1080',
    badge: 'Recommended for Web',
    src: '/promo/aidetector-promo-main-60s-captioned.mp4',
    audioSrc: '/promo/promo_audio_60s.wav',
    captionsSrc: '/promo/promo-captions.vtt',
    poster: '/promo/promo-poster.jpg',
    description: 'Full 60-second landscape demonstration with synchronized burned-in captions and audio narration.',
  },
  {
    id: 'main_60s_clean',
    label: 'Main Overview (Clean)',
    duration: '60s',
    aspect: '16:9',
    resolution: '1920×1080',
    badge: 'YouTube & Keynotes',
    src: '/promo/aidetector-promo-main-60s.mp4',
    audioSrc: '/promo/promo_audio_60s.wav',
    captionsSrc: '/promo/promo-captions.vtt',
    poster: '/promo/promo-poster.jpg',
    description: 'Clean master landscape export without burned-in text overlays, with WebVTT subtitle track.',
  },
  {
    id: 'vertical_30s',
    label: 'Vertical Story (30s)',
    duration: '30s',
    aspect: '9:16',
    resolution: '1080×1920',
    badge: 'TikTok / Shorts / Reels',
    src: '/promo/aidetector-promo-vertical-30s.mp4',
    captionsSrc: '/promo/promo-captions.vtt',
    poster: '/promo/promo-poster-vertical.jpg',
    description: 'Vertical social edit recomposed specifically for mobile screens with high-contrast subtitles.',
  },
  {
    id: 'feed_30s',
    label: 'Feed Square/Portrait (30s)',
    duration: '30s',
    aspect: '4:5',
    resolution: '1080×1350',
    badge: 'Instagram & LinkedIn',
    src: '/promo/aidetector-promo-feed-30s.mp4',
    captionsSrc: '/promo/promo-captions.vtt',
    poster: '/promo/promo-poster.jpg',
    description: 'Optimized 4:5 aspect ratio for social feeds with clear, centered metrics and readable typography.',
  },
  {
    id: 'teaser_15s',
    label: 'Short Teaser (15s)',
    duration: '15s',
    aspect: '9:16',
    resolution: '1080×1920',
    badge: 'Stories & Ads',
    src: '/promo/aidetector-promo-teaser-15s.mp4',
    poster: '/promo/promo-poster-vertical.jpg',
    description: 'High-energy 15-second mobile teaser highlighting text, image, and video detection features.',
  },
];

interface PromoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFormat?: string;
}

export function PromoVideoModal({
  isOpen,
  onClose,
}: PromoVideoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-4xl max-h-[92vh] overflow-y-auto p-3 sm:p-6 bg-slate-950 text-slate-100 border-indigo-900/60"
        aria-label="AIDetector.cx Product Demonstration Video Player"
      >
        <DialogHeader className="mb-2 space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-indigo-950 text-indigo-300 border-indigo-800">
              <Sparkles className="w-3 h-3 mr-1" /> Product Demonstration (60s)
            </Badge>
            <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800 text-xs">
              Universal High-Definition Playback
            </Badge>
          </div>
          <DialogTitle className="text-lg sm:text-2xl font-bold tracking-tight text-white">
            AIDetector.cx — “Before you trust it, check it.”
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-slate-400">
            Interactive, frame-synchronized video demonstration of AIDetector.cx multi-model content analysis with real voiceover narration.
          </DialogDescription>
        </DialogHeader>

        {/* Interactive Video Stage */}
        <div className="my-2">
          <InteractiveVideoStage
            aspectRatio="16:9"
            autoPlay={true}
            onNavigateToDetector={() => onClose()}
          />
        </div>

        {/* Media Downloads & Direct Assets */}
        <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Available in 16:9 Landscape, 9:16 Vertical, and 4:5 Feed</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-xs h-8 bg-slate-900 border-slate-700 text-slate-200 hover:text-white gap-1.5"
            >
              <a href="/promo/aidetector-promo-main-60s-captioned.mp4" download>
                <Download className="w-3.5 h-3.5" /> Download Video
              </a>
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-xs h-8 bg-slate-900 border-slate-700 text-slate-200 hover:text-white gap-1.5"
            >
              <a href="/promo/promo-captions.vtt" download>
                <FileText className="w-3.5 h-3.5" /> Subtitles (.vtt)
              </a>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              asChild
              className="text-xs h-8 gap-1.5"
            >
              <Link to="/promo" onClick={onClose}>
                <ExternalLink className="w-3.5 h-3.5" /> Fullscreen Page
              </Link>
            </Button>
          </div>
        </div>

        {/* Highlights Bar */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-indigo-950 text-xs text-slate-400">
          <div className="flex items-start gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">98.7% Accuracy:</span> Multi-model perplexity evaluation.
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Multi-Modal:</span> Text, plagiarism, image & video deepfakes.
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Zero-Retention:</span> Strict volatile in-memory processing.
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
