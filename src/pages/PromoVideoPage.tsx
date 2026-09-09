import { useState } from 'react';
import { InteractiveVideoStage } from '@/components/promo/InteractiveVideoStage';
import { PROMO_FORMATS } from '@/components/promo/PromoVideoModal';
import { YouTubeSchemaDrawer } from '@/components/promo/YouTubeSchemaDrawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  FileText,
  Sparkles,
  Shield,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Tv,
  Smartphone,
  Layers,
  Youtube,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PromoVideoPage() {
  const [isYoutubeDrawerOpen, setIsYoutubeDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-3 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Title Area */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800 text-xs text-indigo-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Official AIDetector.cx Product Video Demonstration</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            “Before you trust it, check it.”
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Explore how AIDetector.cx examines text, code, images, and video deepfakes with transparent perplexity, burstiness, and explainable neural signals.
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsYoutubeDrawerOpen(true)}
              className="h-8 text-xs bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800/60 gap-1.5"
            >
              <Youtube className="w-3.5 h-3.5 text-red-400" />
              YouTube Timestamps & Schema.org JSON-LD
            </Button>
          </div>
        </div>

        {/* Main 60 FPS Interactive Video Player */}
        <div className="bg-slate-900/50 p-2 sm:p-4 rounded-3xl border border-indigo-900/40 shadow-2xl">
          <InteractiveVideoStage aspectRatio="16:9" autoPlay={true} />
        </div>

        {/* Video Formats & Distribution Downloads */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {PROMO_FORMATS.map((fmt) => (
            <div
              key={fmt.id}
              className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 flex flex-col justify-between space-y-3 hover:border-indigo-700 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] bg-indigo-950 text-indigo-300 border-indigo-800">
                    {fmt.aspect} • {fmt.duration}
                  </Badge>
                  <span className="text-[11px] font-mono text-slate-400">{fmt.resolution}</span>
                </div>
                <h3 className="font-bold text-white text-sm sm:text-base">{fmt.label}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{fmt.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <Button
                  variant="secondary"
                  size="sm"
                  asChild
                  className="w-full text-xs gap-1.5"
                >
                  <a href={fmt.src} download>
                    <Download className="w-3.5 h-3.5" /> Download Export
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 p-6 rounded-2xl border border-indigo-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Ready to verify your content?</h3>
            <p className="text-xs text-slate-300">
              Start with 5 free trial checks. No credit card required.
            </p>
          </div>

          <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold gap-2">
            <Link to="/detector">
              Start Free Analysis <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>

      <YouTubeSchemaDrawer
        isOpen={isYoutubeDrawerOpen}
        onClose={() => setIsYoutubeDrawerOpen(false)}
      />
    </div>
  );
}
