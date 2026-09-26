import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Play, Clock, Sparkles } from 'lucide-react';
import { CleanVideoPlayer } from '@/components/promo/CleanVideoPlayer';

export function PromoVideoSection() {
  const [isOpen, setIsOpen] = useState(false);
  const playButtonRef = useRef<HTMLButtonElement | null>(null);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    // Restore keyboard focus to play button when modal closes
    setTimeout(() => {
      playButtonRef.current?.focus();
    }, 50);
  };

  return (
    <section className="py-12 md:py-20 bg-slate-950/60 border-y border-slate-800/80 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 md:mb-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/70 border border-indigo-800/60 text-xs font-semibold text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Product Walkthrough</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            See how AIDetector.cx works
          </h2>

          <p className="text-sm md:text-base text-slate-400 leading-relaxed text-pretty">
            Watch a 60-second walkthrough of real text scanning, dual sensitivity modes, and transparent signal analysis.
          </p>
        </div>

        {/* Clean, Professional Video Thumbnail Card */}
        <div className="max-w-3xl mx-auto">
          <div
            onClick={handleOpen}
            className="group relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl cursor-pointer transition-all duration-300 hover:border-indigo-600/60 hover:shadow-2xl hover:shadow-indigo-950/50"
            role="button"
            tabIndex={0}
            aria-label="Play AIDetector.cx demonstration video (duration 60 seconds)"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleOpen();
              }
            }}
          >
            {/* Poster Thumbnail Image */}
            <img
              src="/promo/promo-poster.jpg"
              alt="AIDetector.cx product walkthrough preview showing text scanner and signal breakdown"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02] opacity-90 group-hover:opacity-100"
              loading="lazy"
            />

            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

            {/* Duration Badge */}
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/85 backdrop-blur-md border border-slate-700/60 text-xs font-medium text-slate-200">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>1:00</span>
            </div>

            {/* Center Glowing Play Button */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <button
                ref={playButtonRef}
                type="button"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg shadow-indigo-950/80 transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-400"
                aria-label="Play video"
                tabIndex={-1}
              >
                <Play className="w-7 h-7 sm:w-9 sm:h-9 ml-1 fill-white" />
              </button>
            </div>

            {/* Bottom Left Title Hint */}
            <div className="absolute bottom-4 left-4 z-10 max-w-sm hidden sm:block pointer-events-none">
              <div className="text-xs font-semibold text-indigo-300 tracking-wide uppercase">
                Interactive Walkthrough
              </div>
              <div className="text-sm font-bold text-white truncate">
                Real Text Scanning & Sensitivity Modes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accessible Video Player Modal */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent
          className="max-w-4xl p-0 overflow-hidden bg-slate-950 border-slate-800 text-slate-100 shadow-2xl"
          aria-describedby="video-dialog-description"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>AIDetector.cx Product Walkthrough Video</DialogTitle>
            <DialogDescription id="video-dialog-description">
              A 60-second walkthrough showing real text scanning, dual sensitivity modes, and transparent signal analysis.
            </DialogDescription>
          </DialogHeader>

          <div className="w-full aspect-video min-h-[340px] sm:min-h-[480px]">
            {isOpen && <CleanVideoPlayer autoPlay={true} />}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default PromoVideoSection;
