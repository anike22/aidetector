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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Copy,
  Check,
  Youtube,
  Code2,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export const YOUTUBE_METADATA = {
  titles: [
    'AIDetector.cx Demo: Before You Trust It, Check It (Evidence-Based Content Forensics)',
    'How to Detect ChatGPT & AI Generated Content Accurately in 2026 | AIDetector.cx',
    'AI Detector That Actually Explains Its Score: Text, Plagiarism & Image Forensics | AIDetector.cx',
  ],
  description: `Before you decide what to trust, take a closer look. 

AIDetector.cx is a unified content intelligence platform designed to examine AI-generated text, plagiarism, synthetic images, and media forensics with transparent, explainable evidence.

✨ What makes AIDetector.cx different?
• Multi-Model Text Forensics: Evaluates perplexity, burstiness, and sentence predictability with granular highlighting.
• Dual Sensitivity Modes: Balanced mode (50% Bayesian decision threshold) and Aggressive mode (30% threshold for short AI snippets).
• Multi-Modal Forensics: Cross-referenced plagiarism search and deep diffusion image forensics.
• Evidence-Based Guidance: A detection score supports human judgment; it does not establish authorship.

🚀 Try AIDetector.cx free (5 introductory trial checks included):
👉 https://aidetector.cx

⏱️ Video Chapters & Timestamps:
0:00 1. The Dilemma: AI-generated or human-written?
0:05 2. Meet AIDetector.cx: Unified Content Forensics Platform
0:10 3. Deep Text Scan: Perplexity, Burstiness & Sentence Breakdown
0:28 4. Sensitivity Modes: Balanced vs. Aggressive Decision Boundaries
0:38 5. Multi-Modal Forensics: Plagiarism & Image Frequency Artifacts
0:48 6. Informed Decisions: Review the Signals, Make an Informed Decision
0:54 7. Try AIDetector.cx: "Check your content at AIDetector.cx"

#AIDetector #ChatGPT #AIChecker #DeepfakeDetection #ArtificialIntelligence #AIEthics #PlagiarismChecker #ContentIntegrity`,
  timestamps: `0:00 1. The Dilemma: AI-generated or human-written?
0:05 2. Meet AIDetector.cx: Unified Content Forensics Platform
0:10 3. Deep Text Scan: Perplexity, Burstiness & Sentence Breakdown
0:28 4. Sensitivity Modes: Balanced vs. Aggressive Decision Boundaries
0:38 5. Multi-Modal Forensics: Plagiarism & Image Frequency Artifacts
0:48 6. Informed Decisions: Review the Signals, Make an Informed Decision
0:54 7. Try AIDetector.cx: "Check your content at AIDetector.cx"`,
  tags: [
    'AI detector',
    'ChatGPT detector',
    'AI content checker',
    'how to detect AI writing',
    'AI plagiarism detector',
    'deepfake detector',
    'AI image forensics',
    'perplexity and burstiness',
    'AIDetector.cx',
    'AI writing detection tool',
    'AI essay checker',
    'Claude detector',
    'Gemini detector',
  ],
  schemaJsonLd: {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: 'AIDetector.cx Product Walkthrough — “Before you trust it, check it.”',
    description:
      'Official 60-second product walkthrough of AIDetector.cx showing dual-mode AI text analysis, perplexity and burstiness signals, plagiarism checking, and multi-modal image forensics.',
    thumbnailUrl: [
      'https://www.aidetector.cx/promo/promo-poster.jpg',
      'https://www.aidetector.cx/promo/promo-poster.png',
      'https://www.aidetector.cx/promo/promo-poster-vertical.jpg',
    ],
    uploadDate: '2026-09-09T00:00:00+00:00',
    duration: 'PT1M',
    contentUrl: 'https://www.aidetector.cx/promo/aidetector-promo-main-60s-captioned.mp4',
    embedUrl: 'https://www.aidetector.cx/promo',
    inLanguage: 'en',
    caption: 'https://www.aidetector.cx/promo/promo-captions.vtt',
    publisher: {
      '@type': 'Organization',
      name: 'AIDetector.cx',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.aidetector.cx/logo.png',
      },
    },
    hasPart: [
      {
        '@type': 'Clip',
        name: 'The Dilemma',
        startOffset: 0,
        endOffset: 5,
        url: 'https://www.aidetector.cx/promo#t=0',
      },
      {
        '@type': 'Clip',
        name: 'Meet AIDetector.cx',
        startOffset: 5,
        endOffset: 10,
        url: 'https://www.aidetector.cx/promo#t=5',
      },
      {
        '@type': 'Clip',
        name: 'Deep Text Scan',
        startOffset: 10,
        endOffset: 28,
        url: 'https://www.aidetector.cx/promo#t=10',
      },
      {
        '@type': 'Clip',
        name: 'Sensitivity Modes',
        startOffset: 28,
        endOffset: 38,
        url: 'https://www.aidetector.cx/promo#t=28',
      },
      {
        '@type': 'Clip',
        name: 'Multi-Modal Forensics',
        startOffset: 38,
        endOffset: 48,
        url: 'https://www.aidetector.cx/promo#t=38',
      },
      {
        '@type': 'Clip',
        name: 'Informed Decisions',
        startOffset: 48,
        endOffset: 54,
        url: 'https://www.aidetector.cx/promo#t=48',
      },
      {
        '@type': 'Clip',
        name: 'Try AIDetector.cx',
        startOffset: 54,
        endOffset: 60,
        url: 'https://www.aidetector.cx/promo#t=54',
      },
    ],
  },
};

interface YouTubeSchemaDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function YouTubeSchemaDrawer({ isOpen, onClose }: YouTubeSchemaDrawerProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-slate-950 text-slate-100 border-indigo-900/80">
        <DialogHeader className="mb-3 space-y-1">
          <div className="flex items-center gap-2">
            <Badge className="bg-red-950 text-red-300 border-red-800 text-xs">
              <Youtube className="w-3.5 h-3.5 mr-1 text-red-500" /> YouTube & SEO Kit
            </Badge>
            <Badge variant="outline" className="text-xs text-indigo-300 border-indigo-800">
              Schema.org VideoObject
            </Badge>
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-white">
            YouTube Video Metadata & Schema Markup
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-slate-400">
            SEO-optimized titles, timestamps, complete description, tags, and structured JSON-LD markup for Google Video Rich Results.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid grid-cols-4 bg-slate-900 border border-slate-800 mb-3">
            <TabsTrigger value="description" className="text-xs">
              <FileText className="w-3.5 h-3.5 mr-1" /> Description
            </TabsTrigger>
            <TabsTrigger value="timestamps" className="text-xs">
              <Clock className="w-3.5 h-3.5 mr-1" /> Timestamps
            </TabsTrigger>
            <TabsTrigger value="titles" className="text-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Titles & Tags
            </TabsTrigger>
            <TabsTrigger value="schema" className="text-xs">
              <Code2 className="w-3.5 h-3.5 mr-1" /> Schema JSON-LD
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Complete YouTube Description */}
          <TabsContent value="description" className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Ready-to-paste YouTube Description:</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => copyToClipboard(YOUTUBE_METADATA.description, 'desc')}
                className="h-7 text-xs gap-1.5"
              >
                {copiedKey === 'desc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Description
              </Button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
              {YOUTUBE_METADATA.description}
            </pre>
          </TabsContent>

          {/* TAB 2: Clickable Timestamps */}
          <TabsContent value="timestamps" className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">YouTube Chapters / Timestamps:</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => copyToClipboard(YOUTUBE_METADATA.timestamps, 'time')}
                className="h-7 text-xs gap-1.5"
              >
                {copiedKey === 'time' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Timestamps
              </Button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
              {YOUTUBE_METADATA.timestamps}
            </pre>
          </TabsContent>

          {/* TAB 3: Titles & Tags */}
          <TabsContent value="titles" className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300">Recommended YouTube Video Titles:</div>
              <div className="space-y-1.5">
                {YOUTUBE_METADATA.titles.map((title, i) => (
                  <div
                    key={i}
                    onClick={() => copyToClipboard(title, `title_${i}`)}
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white hover:border-indigo-600 flex items-center justify-between cursor-pointer group"
                  >
                    <span>{title}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(title, `title_${i}`);
                      }}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      aria-label={`Copy title option: ${title}`}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">YouTube Keyword Tags:</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => copyToClipboard(YOUTUBE_METADATA.tags.join(', '), 'tags')}
                  className="h-6 text-[11px] px-2 gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy All Tags
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {YOUTUBE_METADATA.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-[11px] bg-slate-900 text-slate-300 border-slate-800">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: Schema.org VideoObject */}
          <TabsContent value="schema" className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Google Video Rich Results (Schema.org / JSON-LD):</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  copyToClipboard(JSON.stringify(YOUTUBE_METADATA.schemaJsonLd, null, 2), 'schema')
                }
                className="h-7 text-xs gap-1.5"
              >
                {copiedKey === 'schema' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copy JSON-LD
              </Button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-300 whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
              {JSON.stringify(YOUTUBE_METADATA.schemaJsonLd, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
