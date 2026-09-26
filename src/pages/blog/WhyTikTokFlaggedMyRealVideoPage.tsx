// ─── Creator Troubleshooting Guide: Why Did TikTok Flag My Real Video as AI? ───

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Shield,
  Video,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Layers,
  FileCheck,
  Hash,
  SlidersHorizontal,
  Smartphone,
  Cpu,
  Lock,
  ArrowUpDown,
  FileText,
  Clock,
  UserCheck,
  HelpCircle,
  Copy,
  Check,
  Sparkles,
  Film,
  Camera,
  Scissors,
  Wand2,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

const CANONICAL_URL = 'https://www.aidetector.cx/studies/why-tiktok-flagged-my-real-video';

interface TocItem {
  id: string;
  label: string;
}

const TOC_ITEMS: TocItem[] = [
  { id: 'quick-answer', label: 'Quick Answer' },
  { id: 'troubleshooting-selector', label: 'Interactive Troubleshooting Selector' },
  { id: 'identify-what-happened', label: '1. Identify What Actually Happened' },
  { id: 'check-editing-workflow', label: '2. Check the Entire Editing Workflow' },
  { id: 'compression-explained', label: '3. What Compression Can & Cannot Explain' },
  { id: 'compare-files-table', label: '4. Compare Original, Export & Published Copy' },
  { id: 'action-steps', label: '5. What to Do If the Label Is Incorrect' },
  { id: 'copyable-checklist', label: '6. Copyable Evidence Checklist' },
  { id: 'credible-study-requirements', label: '7. What a Credible Case Study Requires' },
  { id: 'detector-cta', label: 'Forensic Tools & Workflow Integrations' },
  { id: 'faqs', label: 'Frequently Asked Questions' },
  { id: 'references', label: 'Official Sources & Peer-Reviewed References' },
];

type ScenarioType = 'tiktok-label' | 'third-party-score' | 'moderation-penalty' | 'community-accusation';

interface ScenarioDetail {
  title: string;
  badge: string;
  description: string;
  primaryCauses: string[];
  recommendedActions: string[];
}

const SCENARIOS: Record<ScenarioType, ScenarioDetail> = {
  'tiktok-label': {
    title: 'An "AI-generated" or "Creator labeled" badge on your published TikTok',
    badge: 'Platform Labeling Notice',
    description:
      'TikTok displays an automated or creator-applied badge. This usually indicates that Content Credentials (C2PA) from an editing tool were detected, an in-app TikTok AI filter was applied, or automated heuristics triggered.',
    primaryCauses: [
      'An export from an editing tool (e.g. Adobe Premiere, Photoshop, CapCut) embedded C2PA metadata indicating AI generative fill or generative expansion was used.',
      'A TikTok in-app AI effect or voice filter was applied during video creation.',
      'Manual creator disclosure toggle was accidentally turned on during upload.',
      'Automated visual/audio classification heuristics detected high smoothing or synthetic acoustics.',
    ],
    recommendedActions: [
      'Inspect the editing project to identify if any generative AI tool (e.g. inpainting, voice enhancement) was applied.',
      'Verify if your export software attaches C2PA metadata manifests by checking the file with a metadata inspector.',
      'Check if an in-app review or feedback option is provided directly in the video notice.',
      'Preserve the unedited camera master and project timeline files for documentation.',
    ],
  },
  'third-party-score': {
    title: 'An independent online AI detector scored your video as synthetic',
    badge: 'Third-Party Forensic Report',
    description:
      'You or someone else ran your video through an online AI detector (like AIDetector.cx or another tool) and received a high AI probability score.',
    primaryCauses: [
      'Heavy video compression (DCT macroblocking) stripped natural high-frequency skin textures, triggering visual anomaly classifiers.',
      'Aggressive studio three-point lighting or heavy beauty filter smoothing eliminated fine facial pores.',
      'Digital video stabilization or high-shutter panning modified natural optical flow vectors across frame boundaries.',
      'Audio post-processing (e.g. aggressive noise gates or studio de-essers) removed room ambiance, mimicking neural TTS silence floors.',
    ],
    recommendedActions: [
      'Run the original uncompressed camera recording rather than the re-encoded social download.',
      'Use the Original vs. Published comparison tool to evaluate whether compression altered the score.',
      'Remember that third-party scores are evidentiary indicators, not proof of platform policy decisions.',
      'Review whether the detector model has been calibrated for mobile social transcoding artifacts.',
    ],
  },
  'moderation-penalty': {
    title: 'Your video was removed, age-restricted, or suppressed from recommendations (FYP)',
    badge: 'Community Guidelines Action',
    description:
      'Your video was removed, disqualified from the For You feed, or flagged for violating Community Guidelines regarding undisclosed or deceptive synthetic media.',
    primaryCauses: [
      'TikTok policies require disclosure when realistic AI-generated people or events are depicted; failure to disclose realistic synthetic content can lead to enforcement.',
      'Automated moderation flagged perceived impersonation, synthetic likenesses, or misleading altered events.',
      'Content was flagged for policy triggers unrelated to AI (e.g. copyright audio match, safety triggers).',
    ],
    recommendedActions: [
      'Review TikTok’s official Community Guidelines on synthetic and manipulated media.',
      'Open TikTok’s System Notifications and use the official in-app Appeal button within the stated deadline.',
      'Prepare documented evidence of your original camera footage and raw project files for support review.',
      'Consult TikTok’s official Report a Problem channel if standard appeal paths are unavailable.',
    ],
  },
  'community-accusation': {
    title: 'Commenters or critics claim your video is AI-generated or a deepfake',
    badge: 'Audience Perception & Accusation',
    description:
      'Viewers in your comments or on social media are asserting that your voice, face, or background is artificial intelligence.',
    primaryCauses: [
      'Uncanny video properties (e.g. teleprompter gaze stiffness, high-key studio lighting, intense digital makeup filters).',
      'Unusual vocal cadence or heavily edited jump-cuts without breath pauses.',
      'General skepticism in online discourse surrounding realistic footage.',
    ],
    recommendedActions: [
      'Publish a behind-the-scenes recording or timeline screenshot demonstrating authentic production.',
      'Avoid escalating debates without tangible verification assets.',
      'Share raw outtakes or unedited alternate camera angles if audience trust is critical to your brand.',
    ],
  },
};

export const WhyTikTokFlaggedMyRealVideoPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>(TOC_ITEMS[0].id);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('tiktok-label');
  const [copiedChecklist, setCopiedChecklist] = useState<boolean>(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const handleIntersect: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    observerRef.current = new IntersectionObserver(handleIntersect, {
      rootMargin: '-20% 0px -65% 0px',
      threshold: 0,
    });

    TOC_ITEMS.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const handleCopyChecklist = () => {
    const checklistText = `### Creator Evidence Preparation Checklist (AIDetector.cx)
Note: This checklist is an evidentiary preparation aid for creators, not an official TikTok appeal submission.

1. Video Identification
- Post URL: [Insert URL]
- Date & Time Published: [Insert Date/Time]
- Account Handle: @[Insert Handle]
- Exact Notice / Label Displayed: [e.g. "AI-generated content", "Creator labeled", etc.]

2. Capture & Camera Documentation
- Original Camera / Device: [e.g. iPhone 15 Pro, Sony A7IV, etc.]
- Original Recording Format: [e.g. 4K 24fps HEVC, 1080p 60fps MP4, etc.]
- Original File Name: [e.g. IMG_4092.MOV]
- Original File SHA-256 Checksum: [Insert 64-char Hash]
- Creation Timestamp in File EXIF: [Insert Timestamp]

3. Editing Project History
- Editing Software & Version: [e.g. Final Cut Pro 10.8, Premiere Pro 24.5, CapCut Desktop]
- Project Timeline File: [e.g. MyVideo_v2.prproj / .fcpbundle preserved]
- Color Grading / Effects Used: [e.g. Standard LUT, Optical Stabilization, etc.]
- Generative AI Tools Used: [List honestly: None / Generative Fill / Inpainting / AI Voice Denoise / etc.]
- Audio Soundtrack Origin: [e.g. Raw Microphone Recording / Licensed Music Track]

4. Verification & C2PA Provenance
- Export Container & Codec: [e.g. MP4 H.264]
- C2PA Content Credentials Attached: [Yes / No / Unknown]
- Independent Forensic Scanner Report: [Optional AIDetector.cx report summary]

5. Next Steps
- Saved screenshot of original notification and post badge
- Kept raw uncompressed master file in secure storage without modifications
- Submitted formal review via TikTok in-app appeal or official Report a Problem workflow`;

    navigator.clipboard.writeText(checklistText);
    setCopiedChecklist(true);
    toast.success('Evidence checklist copied to clipboard!');
    setTimeout(() => setCopiedChecklist(false), 3000);
  };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: 'Why Did TikTok Flag My Real Video as AI?',
    description:
      'TikTok labeled your real video as AI? Understand possible triggers, compare original files, and prepare evidence to request a review.',
    image: 'https://www.aidetector.cx/brand/aidetector-icon.png',
    author: {
      '@type': 'Organization',
      name: 'AIDetector.cx Forensic Research Team',
      url: 'https://www.aidetector.cx',
    },
    publisher: {
      '@type': 'Organization',
      name: 'AIDetector.cx',
      url: 'https://www.aidetector.cx',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.aidetector.cx/brand/aidetector-icon.png',
      },
    },
    datePublished: '2025-02-10T08:00:00Z',
    dateModified: '2026-03-02T12:00:00Z',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': CANONICAL_URL,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.aidetector.cx/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Research & Studies',
        item: 'https://www.aidetector.cx/content-hub',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'TikTok AI Label Troubleshooting',
        item: CANONICAL_URL,
      },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Why did TikTok add an AI label to my genuine camera video?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'TikTok applies labels through multiple distinct pathways: automatic detection of C2PA Content Credentials embedded by editing software, the use of in-app AI effects or voice filters, automated platform classifiers detecting visual smoothing or acoustic patterns, or accidental toggling of the creator disclosure switch during upload.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does TikTok’s AI label mean my video has been penalized or restricted?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Not necessarily. A standard transparency label inform viewers about synthetic content in compliance with platform guidelines. However, if undisclosed realistic AI content is deemed misleading under Community Guidelines, separate recommendation restrictions or moderation penalties may apply.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can video editing tools like Premiere or CapCut cause a TikTok AI label?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. If you used generative features (such as generative expand, generative fill, or AI voice enhancement) in software that attaches C2PA Content Credentials, the export file may contain digital metadata indicating AI tool usage, which TikTok’s ingestion system reads automatically.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does video compression cause TikTok to label videos as AI?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Compression can affect external forensic classifiers by smoothing high-frequency textures and introducing macroblocking. However, there is no verified public evidence establishing that standard video transcoding alone triggers TikTok’s internal labeling system.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I remove an incorrect AI label from my TikTok video?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'If the notice includes an in-app review or appeal option, you can submit a review request through TikTok. Alternatively, consult TikTok’s official Report a Problem support flow. Note that third-party forensic reports cannot override TikTok’s platform decisions.',
        },
      },
      {
        '@type': 'Question',
        name: 'What evidence should I gather to prove my video is authentic?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Preserve the unedited raw camera recording, the full editing project file with timeline history, the master export file, and SHA-256 cryptographic hashes verifying file integrity.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does missing metadata prove that a video is AI-generated?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Social platforms and editing apps routinely strip metadata atoms and EXIF tags for privacy and file size optimization. Missing metadata is normal and does not indicate synthetic generation.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does an independent AI video detector differ from TikTok’s internal system?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Independent detectors analyze pixel textures, temporal coherence, audio dynamics, and container structure to estimate synthetic likelihood. They operate externally and have no access to TikTok’s internal labeling rules, user logs, or ingestion flags.',
        },
      },
    ],
  };

  return (
    <div className="w-full bg-background text-foreground min-h-screen">
      <PageMeta
        title="Why Did TikTok Flag My Video as AI? | AIDetector.cx"
        description="TikTok labeled your real video as AI? Understand possible triggers, compare original files, and prepare evidence to request a review."
        canonicalUrl={CANONICAL_URL}
        ogTitle="Why Did TikTok Flag My Real Video as AI? | Creator Troubleshooting Guide"
        ogDescription="Understand what TikTok's AI label means, review your editing history, and compare original footage with the published copy before drawing conclusions."
        ogType="article"
        schemas={[articleSchema, breadcrumbSchema, faqSchema]}
      />

      {/* ── Breadcrumbs & Article Header ── */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <Link to="/content-hub" className="hover:text-primary transition-colors">Research & Studies</Link>
            <span>/</span>
            <span className="text-foreground font-medium">TikTok AI Label Troubleshooting</span>
          </nav>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5 bg-primary/10 text-primary border-primary/20">
              Creator Troubleshooting Guide
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> 9 min read
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> Media Forensics & Content Policy Review
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">Updated March 2026</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground max-w-4xl leading-[1.15]">
            Why Did TikTok Flag My Real Video as AI?
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed">
            Understand what TikTok’s AI label means, review your editing history, and compare your original footage with the published copy before drawing conclusions.
          </p>
        </div>
      </header>

      {/* ── Main Editorial Body with Sticky Table of Contents ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Desktop Table of Contents Sidebar */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3">
            <div className="sticky top-24 space-y-6">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border">
                  <BookOpen className="w-4 h-4 text-primary" /> Table of Contents
                </div>
                <nav aria-label="Table of contents" className="space-y-1 text-xs">
                  {TOC_ITEMS.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block py-1.5 px-2.5 rounded-lg transition-colors leading-snug ${
                        activeSection === item.id
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>

              {/* Quick Action CTA Box */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <Shield className="w-4 h-4" /> Multi-Modal Video Scanner
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Analyze your raw camera master and social export to isolate compression differentials.
                </p>
                <Link to="/ai-video-detector" className="block">
                  <Button size="sm" className="w-full text-xs font-semibold gap-1.5">
                    Analyze a video <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <p className="text-[11px] text-muted-foreground text-center">
                  Use detection as one part of your review—not proof of authorship or authenticity.
                </p>
              </div>
            </div>
          </aside>

          {/* Article Main Content Column */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-12 min-w-0 max-w-3xl">

            {/* Mobile Collapsible Table of Contents */}
            <div className="lg:hidden rounded-xl border border-border bg-card p-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="toc-mobile" className="border-none">
                  <AccordionTrigger className="py-1 text-sm font-semibold text-foreground hover:no-underline">
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" /> Article Contents ({TOC_ITEMS.length} sections)
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-3 pb-1 space-y-1 text-xs">
                    {TOC_ITEMS.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="block py-1.5 px-2 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      >
                        {item.label}
                      </a>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* ── SECTION 0: QUICK ANSWER BOX ── */}
            <section id="quick-answer" className="scroll-mt-24">
              <div className="p-6 rounded-2xl border-2 border-primary/20 bg-primary/5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <Info className="w-4 h-4 shrink-0" /> Quick answer:
                </div>
                <p className="text-sm md:text-base text-foreground leading-relaxed font-medium">
                  An AI label does not, by itself, explain how TikTok reached its decision. Documented labeling mechanisms include creator disclosures, TikTok AI effects and information carried through Content Credentials. Compression may affect a separate detector’s results, but that does not establish why TikTok labeled a particular post.
                </p>
                <div className="pt-2 border-t border-primary/15 text-xs text-muted-foreground leading-relaxed space-y-1">
                  <div>
                    For TikTok's official policy disclosures, see{' '}
                    <a
                      href="https://newsroom.tiktok.com/en-us/partnering-with-our-industry-to-advance-ai-transparency-and-literacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 hover:text-primary/80 inline-flex items-center gap-1 font-medium"
                    >
                      TikTok’s AI-labeling announcement <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    and review the{' '}
                    <a
                      href="https://support.tiktok.com/en/using-tiktok/creating-videos/ai-generated-content"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 hover:text-primary/80 inline-flex items-center gap-1 font-medium"
                    >
                      current AI-content guidance <ExternalLink className="w-3 h-3" />
                    </a>
                    .
                  </div>
                  <div className="text-[11px] text-muted-foreground/90">
                    <em>Note: Historical industry partnership announcements describe long-term transparency initiatives, whereas current Help Center documentation outlines current in-app labeling rules.</em>
                  </div>
                </div>
              </div>
            </section>

            {/* ── SECTION 1: INTERACTIVE TROUBLESHOOTING SELECTOR ── */}
            <section id="troubleshooting-selector" className="space-y-4 scroll-mt-24">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20">
                  Interactive Triage Tool
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  What Are You Seeing?
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Select your exact situation to reveal targeted troubleshooting checks and immediate next steps:
                </p>
              </div>

              {/* 4 Accessible Selector Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {(Object.keys(SCENARIOS) as ScenarioType[]).map((key) => {
                  const scenario = SCENARIOS[key];
                  const isSelected = selectedScenario === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedScenario(key)}
                      className={`text-left p-3.5 rounded-xl border transition-all text-xs space-y-1 ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-xs ring-1 ring-primary'
                          : 'border-border bg-card hover:bg-muted/40 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground text-xs">{scenario.badge}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                      </div>
                      <p className="text-muted-foreground text-[11px] line-clamp-2 leading-relaxed">
                        {scenario.title}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Scenario Details Panel */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-4 text-xs shadow-xs">
                <div className="space-y-1">
                  <Badge variant="outline" className="text-[11px] text-primary border-primary/20">
                    {SCENARIOS[selectedScenario].badge}
                  </Badge>
                  <h3 className="text-base font-bold text-foreground">
                    {SCENARIOS[selectedScenario].title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {SCENARIOS[selectedScenario].description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border">
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" /> Potential Triggers
                    </h4>
                    <ul className="space-y-1.5 text-muted-foreground leading-relaxed list-disc pl-4 text-[11px]">
                      {SCENARIOS[selectedScenario].primaryCauses.map((cause, idx) => (
                        <li key={idx}>{cause}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Recommended Actions
                    </h4>
                    <ul className="space-y-1.5 text-muted-foreground leading-relaxed list-disc pl-4 text-[11px]">
                      {SCENARIOS[selectedScenario].recommendedActions.map((action, idx) => (
                        <li key={idx}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* ── SECTION 2: IDENTIFY WHAT ACTUALLY HAPPENED ── */}
            <section id="identify-what-happened" className="space-y-4 scroll-mt-24">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20">
                  Clarity & Evidence
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  1. First, Identify What Actually Happened
                </h2>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Before attempting to dispute a result or modify your editing setup, you must accurately categorize the event. Different events involve entirely different systems, evidentiary standards, and resolution workflows:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
                <Card className="border-border bg-card p-4 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-foreground text-xs">
                    <Smartphone className="w-4 h-4 text-primary shrink-0" /> An In-App TikTok Label
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    A visual tag (e.g. "AI-generated content" or "Creator labeled as AI") displayed on your video. This is an informational transparency marker applied by TikTok’s ingestion system, Content Credentials, or user settings. It is not an account strike.
                  </p>
                </Card>

                <Card className="border-border bg-card p-4 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-foreground text-xs">
                    <FileSearch className="w-4 h-4 text-blue-500 shrink-0" /> A Third-Party AI Detector Score
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    A statistical probability generated by an external scanning tool (e.g. AIDetector.cx). This reflects external algorithmic analysis of your video file; it does not indicate TikTok's internal status or policy evaluation.
                  </p>
                </Card>

                <Card className="border-border bg-card p-4 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-foreground text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" /> A Moderation Removal or FYP Restriction
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    An enforcement action where a video is removed or disqualified from the recommendation algorithm. This involves TikTok Trust & Safety policy enforcement and provides formal in-app appeal channels.
                  </p>
                </Card>

                <Card className="border-border bg-card p-4 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-foreground text-xs">
                    <MessageSquare className="w-4 h-4 text-amber-500 shrink-0" /> A Commenter or Audience Accusation
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Subjective skepticism from viewers responding to uncanny lighting, teleprompter delivery, or heavy digital filters. This is a community perception issue rather than a technical platform decision.
                  </p>
                </Card>
              </div>

              <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-muted-foreground leading-relaxed">
                <strong>Key Principle:</strong> Do not assume that an AI label proves your video was penalized, nor that an external third-party detector report reveals TikTok’s proprietary decision logic.
              </div>
            </section>

            {/* ── SECTION 3: CHECK THE ENTIRE EDITING WORKFLOW ── */}
            <section id="check-editing-workflow" className="space-y-4 scroll-mt-24">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20">
                  Production Audit
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  2. Check Your Entire Editing Workflow
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Many creators are surprised by AI labels because modern editing suites automatically incorporate generative features that attach digital provenance manifests without explicit notifications:
                </p>
              </div>

              <div className="space-y-3 pt-1 text-xs">
                <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary" /> Camera Capture Master
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Was the raw footage recorded directly through your camera hardware without digital facial retouching, live avatar filters, or virtual studio replacement?
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-emerald-500" /> Editing Timeline & Generative Tools
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Did you use any generative AI features during post-production? Examples include:
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground leading-relaxed">
                    <li>Generative Fill or Inpainting to remove an unwanted background object.</li>
                    <li>Generative Expand to convert horizontal 16:9 footage into vertical 9:16 portrait.</li>
                    <li>AI Voice Enhancement, audio de-reverberation, or neural speech synthesis.</li>
                    <li>AI face enhancement, skin smoothing plugins, or synthetic eye-contact correction.</li>
                  </ul>
                  <p className="text-[11px] text-muted-foreground pt-1">
                    <em>Distinction:</em> An editor's brand name (e.g. Adobe Premiere, CapCut, DaVinci Resolve) does not make a video AI-generated. What matters is the <strong>specific feature</strong> used and whether that feature embedded C2PA assertions.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Film className="w-4 h-4 text-blue-500" /> Export Settings & Content Credentials
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Did your export software embed C2PA Content Credentials? When tools like Adobe Photoshop or Premiere export media with active Content Credentials, the manifest documents which generative tools were used. When uploaded, platforms read these manifests and automatically apply transparency labels.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-purple-500" /> TikTok Upload Screen Settings
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    On the final upload screen under <em>More options</em>, check whether the <strong>"AI-generated content"</strong> creator disclosure switch was toggled on manually or defaulted from a previous post.
                  </p>
                </div>
              </div>
            </section>

            {/* ── SECTION 4: WHAT COMPRESSION CAN AND CANNOT EXPLAIN ── */}
            <section id="compression-explained" className="space-y-4 scroll-mt-24">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20">
                  Technical Forensics
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  3. What Compression Can—and Cannot—Explain
                </h2>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                When videos are shared across social platforms, video transcoders compress the file to minimize bandwidth. It is essential to distinguish between what compression does to external detection tools versus what it does to platform labeling systems:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
                <Card className="border-border bg-card p-4 space-y-2">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> What Compression Can Do
                  </h3>
                  <ul className="space-y-1.5 text-muted-foreground leading-relaxed list-disc pl-4">
                    <li>Discards high-frequency spatial detail, causing skin textures to appear unnaturally smooth.</li>
                    <li>Introduces 8x8 or 16x16 DCT macroblocking along high-contrast object boundaries.</li>
                    <li>Modifies inter-frame motion vectors when frame rates are normalized.</li>
                    <li>Alters scores generated by <strong>independent third-party forensic detectors</strong>.</li>
                  </ul>
                </Card>

                <Card className="border-border bg-card p-4 space-y-2">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" /> What Compression Cannot Explain
                  </h3>
                  <ul className="space-y-1.5 text-muted-foreground leading-relaxed list-disc pl-4">
                    <li>Compression does not generate C2PA cryptographic manifests claiming AI generation.</li>
                    <li>Compression does not prove that TikTok's internal systems decided a video was synthetic.</li>
                    <li>Compression does not transform a genuine person's speech into a neural voice clone signature.</li>
                    <li>Compression artifacts are not identical across all platforms, codecs, or resolutions.</li>
                  </ul>
                </Card>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                Published research confirms that compression impacts baseline research classifiers (see{' '}
                <a
                  href="https://link.springer.com/article/10.1186/s13640-024-00621-8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 hover:text-primary/80 inline-flex items-center gap-1 font-medium"
                >
                  Springer detection assessment <ExternalLink className="w-3 h-3" />
                </a>
                ). However, this empirical finding does not constitute proof that compression caused TikTok to apply an in-app label to a specific upload.
              </p>
            </section>

            {/* ── SECTION 5: COMPARISON TABLE (ORIGINAL VS EXPORT VS PUBLISHED) ── */}
            <section id="compare-files-table" className="space-y-4 scroll-mt-24">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20">
                  Verification Matrix
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  4. Compare the Original, Export, and Published Copy
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  When documenting a questioned video, compare the three key lifecycle files to isolate technical changes:
                </p>
              </div>

              {/* Responsive Comparison Table */}
              <div className="rounded-xl border border-border overflow-hidden bg-card shadow-xs">
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[620px]">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="py-3 px-4 font-semibold text-foreground w-1/4">Property</th>
                        <th className="py-3 px-4 font-semibold text-foreground w-1/4">Camera Master</th>
                        <th className="py-3 px-4 font-semibold text-foreground w-1/4">Editor Export Copy</th>
                        <th className="py-3 px-4 font-semibold text-foreground w-1/4">Published Social Download</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr className="hover:bg-muted/20">
                        <td className="py-3 px-4 font-medium text-foreground">Dimensions & Aspect Ratio</td>
                        <td className="py-3 px-4 text-muted-foreground">Original sensor resolution (e.g. 4K / 1080p landscape)</td>
                        <td className="py-3 px-4 text-muted-foreground">Project canvas resolution (e.g. 1080x1920 cropped/rotated)</td>
                        <td className="py-3 px-4 text-muted-foreground">Platform transcode (typically 1080x1920 or 720x1280)</td>
                      </tr>

                      <tr className="hover:bg-muted/20">
                        <td className="py-3 px-4 font-medium text-foreground">Codec & Bitrate Target</td>
                        <td className="py-3 px-4 text-muted-foreground">High bitrate recording (e.g. ProRes / HEVC All-Intra)</td>
                        <td className="py-3 px-4 text-muted-foreground">User export bitrate (e.g. 20–50 Mbps H.264)</td>
                        <td className="py-3 px-4 text-muted-foreground">Delivery transcode (variable rate, typically lower)</td>
                      </tr>

                      <tr className="hover:bg-muted/20">
                        <td className="py-3 px-4 font-medium text-foreground">Frame Timing & Cadence</td>
                        <td className="py-3 px-4 text-muted-foreground">Constant native frame rate (e.g. 24.0, 29.97, 60 fps)</td>
                        <td className="py-3 px-4 text-muted-foreground">Timeline export frame rate</td>
                        <td className="py-3 px-4 text-muted-foreground">Normalized delivery frame rate (variable GOP)</td>
                      </tr>

                      <tr className="hover:bg-muted/20">
                        <td className="py-3 px-4 font-medium text-foreground">Audio Track & Channels</td>
                        <td className="py-3 px-4 text-muted-foreground">Raw camera mic (stereo / uncompressed LPCM)</td>
                        <td className="py-3 px-4 text-muted-foreground">Master mix (e.g. 320 kbps AAC stereo)</td>
                        <td className="py-3 px-4 text-muted-foreground">Transcoded audio (lossy stream, bandwidth limited)</td>
                      </tr>

                      <tr className="hover:bg-muted/20">
                        <td className="py-3 px-4 font-medium text-foreground">Metadata & EXIF Atoms</td>
                        <td className="py-3 px-4 text-muted-foreground">Full hardware EXIF tags, GPS, lens profile</td>
                        <td className="py-3 px-4 text-muted-foreground">Editor metadata; optional C2PA manifest</td>
                        <td className="py-3 px-4 text-muted-foreground">Standard atoms stripped by platform ingestion</td>
                      </tr>

                      <tr className="hover:bg-muted/20">
                        <td className="py-3 px-4 font-medium text-foreground">SHA-256 Checksum</td>
                        <td className="py-3 px-4 text-muted-foreground font-mono text-[10px]">Unique Master Hash</td>
                        <td className="py-3 px-4 text-muted-foreground font-mono text-[10px]">Unique Export Hash</td>
                        <td className="py-3 px-4 text-muted-foreground font-mono text-[10px]">Unique Transcode Hash</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-muted/30 rounded-lg border border-border text-xs text-muted-foreground leading-relaxed">
                <strong>Important Caveat:</strong> A downloaded copy from TikTok may not represent every intermediate rendition the platform created or evaluated during ingestion. Additionally, matching hashes verify byte identity—not factual real-world truth.
              </div>
            </section>

            {/* ── SECTION 6: WHAT TO DO IF YOU BELIEVE THE LABEL IS INCORRECT ── */}
            <section id="action-steps" className="space-y-4 scroll-mt-24">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20">
                  Resolution Framework
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  5. What to Do If You Believe the Label Is Incorrect
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Follow this structured sequence to assemble your evidence and submit a request through official channels:
                </p>
              </div>

              <div className="space-y-3 pt-1 text-xs">
                <div className="flex gap-3.5 p-4 rounded-xl border border-border bg-card">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-foreground text-sm">Preserve Original Files in Secure Storage</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Archive the unedited camera master recording, raw audio files, and full project timeline files (e.g. .prproj, .fcpbundle). Do not overwrite or re-export over original files.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 p-4 rounded-xl border border-border bg-card">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-foreground text-sm">Capture Screenshots and Post Identifiers</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Save the exact post URL, video timestamp, and high-resolution screenshots of the label or system notice showing the exact wording displayed.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 p-4 rounded-xl border border-border bg-card">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-foreground text-sm">Document Effects and Tools Honestly</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Record all plugins, LUTs, stabilization tools, and generative features used. If a minor generative feature (like AI audio denoising) was used, document it transparently.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 p-4 rounded-xl border border-border bg-card">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    4
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-foreground text-sm">Check for Direct In-App Review Options</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Some automated labeling notices include an informational popup with a "Request Review" or "Provide Feedback" option. If visible, use that direct channel first.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 p-4 rounded-xl border border-border bg-card">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    5
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-foreground text-sm">Consult Official Support Guidance</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      If no direct review option exists, submit a ticket via TikTok’s official support system. Review{' '}
                      <a
                        href="https://support.tiktok.com/en/using-tiktok/report-a-problem/report-a-problem"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2 hover:text-primary/80 inline-flex items-center gap-1 font-medium"
                      >
                        TikTok’s Report a Problem instructions <ExternalLink className="w-3 h-3" />
                      </a>{' '}
                      for currently supported in-app ticket categories.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/5 text-xs text-muted-foreground leading-relaxed">
                <strong>Disclaimer:</strong> Following these steps helps organize verifiable evidence. No third-party tool or service can guarantee label removal, account strike removal, or algorithmic reach recovery.
              </div>
            </section>

            {/* ── SECTION 7: COPYABLE EVIDENCE CHECKLIST ── */}
            <section id="copyable-checklist" className="space-y-4 scroll-mt-24">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20">
                  Preparation Aid
                </Badge>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    6. Copyable Evidence Checklist
                  </h2>
                  <Button
                    onClick={handleCopyChecklist}
                    size="sm"
                    variant="outline"
                    className="text-xs font-medium gap-1.5 self-start sm:self-auto shrink-0"
                  >
                    {copiedChecklist ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied Checklist!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Template
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Fill out this structured template locally to keep your documentation organized before contacting support:
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-4 font-mono text-[11px] text-muted-foreground space-y-2 overflow-x-auto">
                <div className="text-foreground font-semibold"># Creator Evidence Preparation Checklist (AIDetector.cx)</div>
                <div><em>Note: Preparation aid for creator documentation, not an official TikTok appeal form.</em></div>
                <div className="pt-1 text-foreground font-semibold">1. Video Identification</div>
                <div>- Post URL: [Insert URL]</div>
                <div>- Date & Time Published: [Insert Date/Time]</div>
                <div>- Account Handle: @[Insert Handle]</div>
                <div>- Exact Notice / Label Displayed: [e.g. "AI-generated content", "Creator labeled", etc.]</div>
                <div className="pt-1 text-foreground font-semibold">2. Capture & Camera Documentation</div>
                <div>- Original Camera / Device: [e.g. iPhone 15 Pro, Sony A7IV, etc.]</div>
                <div>- Original Recording Format: [e.g. 4K 24fps HEVC, 1080p 60fps MP4, etc.]</div>
                <div>- Original File Name: [e.g. IMG_4092.MOV]</div>
                <div>- Original File SHA-256 Checksum: [Insert 64-char Hash]</div>
                <div>- Creation Timestamp in File EXIF: [Insert Timestamp]</div>
                <div className="pt-1 text-foreground font-semibold">3. Editing Project History</div>
                <div>- Editing Software & Version: [e.g. Final Cut Pro 10.8, Premiere Pro 24.5, CapCut Desktop]</div>
                <div>- Project Timeline File: [e.g. MyVideo_v2.prproj / .fcpbundle preserved]</div>
                <div>- Color Grading / Effects Used: [e.g. Standard LUT, Optical Stabilization, etc.]</div>
                <div>- Generative AI Tools Used: [List honestly: None / Generative Fill / Inpainting / AI Voice Denoise / etc.]</div>
                <div>- Audio Soundtrack Origin: [e.g. Raw Microphone Recording / Licensed Music Track]</div>
                <div className="pt-1 text-foreground font-semibold">4. Verification & C2PA Provenance</div>
                <div>- Export Container & Codec: [e.g. MP4 H.264]</div>
                <div>- C2PA Content Credentials Attached: [Yes / No / Unknown]</div>
                <div>- Independent Forensic Scanner Report: [Optional AIDetector.cx report summary]</div>
              </div>
            </section>

            {/* ── SECTION 8: WHAT A CREDIBLE CASE STUDY REQUIRES ── */}
            <section id="credible-study-requirements" className="space-y-4 scroll-mt-24">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20">
                  Scientific Rigor
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  7. What a Credible Case Study Requires
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  To avoid presenting unverified lab claims, we outline the strict methodological standards required for any credible investigation into platform labeling and compression effects:
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-border bg-card space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Documented Source Media
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Full access to raw camera master files with verified capture metadata, transparent editing project files, and controlled synthetic clips from documented model versions.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Controlled Ingestion Tracking
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Logging exact app versions, operating systems, upload settings (disclosure toggles), and network conditions during every test upload pass.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Disaggregated Classification Metrics
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Separate reporting of True Positives, False Positives, False Negatives, and Inconclusive determinations with explicitly stated sample denominators.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Open Replication Protocols
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Publishing test methodologies and verification steps without fabricating benchmarks, appeal success rates, or guaranteed accuracy metrics.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── SECTION 9: FORENSIC TOOLS & INTEGRATIONS ── */}
            <section id="detector-cta" className="space-y-4 scroll-mt-24">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20">
                  Forensic Operations
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  Actionable Forensic Tools & Integrations
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Examine your video files with multi-modal forensic inspection tools:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Primary Tool Card */}
                <Card className="border-primary/20 bg-primary/5 p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <Video className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-foreground">AI Video Detector Scanner</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Scan video files across visual textures, temporal optical flow, voice dynamics, and C2PA container metadata with zero-retention analysis.
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <Link to="/ai-video-detector" className="block">
                      <Button className="w-full text-xs font-semibold gap-2">
                        Analyze a video <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <p className="text-[11px] text-muted-foreground text-center">
                      Use detection as one part of your review—not proof of authorship or authenticity.
                    </p>
                  </div>
                </Card>

                {/* Compare Tool Card */}
                <Card className="border-border bg-card p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                      <Layers className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-foreground">Original vs. Published Compare</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Compare your camera master directly against the social transcode to evaluate compression impact and verify creator lineage.
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <Link to="/ai-video-detector?subtab=compare" className="block">
                      <Button variant="outline" className="w-full text-xs font-semibold gap-2">
                        Compare Two Videos <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <p className="text-[11px] text-muted-foreground text-center">
                      Side-by-side temporal and pixel differential analysis.
                    </p>
                  </div>
                </Card>
              </div>

              {/* Enterprise API Banner */}
              <div className="p-4 rounded-xl border border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="space-y-1 max-w-xl">
                  <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-primary" /> Enterprise API & Workflow Integrations
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Automate high-throughput synthetic media screening across trust-and-safety and content moderation workflows with our REST API.
                  </p>
                </div>
                <Link to="/api-platform" className="shrink-0">
                  <Button variant="secondary" size="sm" className="w-full sm:w-auto text-xs font-medium gap-1.5">
                    Explore API Platform <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </section>

            {/* ── SECTION 10: VISIBLE FAQS ── */}
            <section id="faqs" className="space-y-4 scroll-mt-24">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20">
                  Frequently Asked Questions
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  Common Creator Questions
                </h2>
              </div>

              <Accordion type="single" collapsible className="w-full space-y-2 pt-1">
                <AccordionItem value="faq-1" className="border border-border rounded-xl px-4 bg-card">
                  <AccordionTrigger className="text-sm font-semibold text-foreground py-3.5 text-left hover:no-underline">
                    Why did TikTok add an AI label to my genuine camera video?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4 pt-1">
                    TikTok applies labels through multiple distinct pathways: automatic detection of C2PA Content Credentials embedded by editing software, the use of in-app AI effects or voice filters, automated platform classifiers detecting visual smoothing or acoustic patterns, or accidental toggling of the creator disclosure switch during upload.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-2" className="border border-border rounded-xl px-4 bg-card">
                  <AccordionTrigger className="text-sm font-semibold text-foreground py-3.5 text-left hover:no-underline">
                    Does TikTok’s AI label mean my video has been penalized or restricted?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4 pt-1">
                    Not necessarily. A standard transparency label informs viewers about synthetic content in compliance with platform guidelines. However, if undisclosed realistic AI content is deemed misleading under Community Guidelines, separate recommendation restrictions or moderation penalties may apply.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-3" className="border border-border rounded-xl px-4 bg-card">
                  <AccordionTrigger className="text-sm font-semibold text-foreground py-3.5 text-left hover:no-underline">
                    Can video editing tools like Premiere or CapCut cause a TikTok AI label?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4 pt-1">
                    Yes. If you used generative features (such as generative expand, generative fill, or AI voice enhancement) in software that attaches C2PA Content Credentials, the export file may contain digital metadata indicating AI tool usage, which TikTok’s ingestion system reads automatically.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-4" className="border border-border rounded-xl px-4 bg-card">
                  <AccordionTrigger className="text-sm font-semibold text-foreground py-3.5 text-left hover:no-underline">
                    Does video compression cause TikTok to label videos as AI?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4 pt-1">
                    Compression can affect external forensic classifiers by smoothing high-frequency textures and introducing macroblocking. However, there is no verified public evidence establishing that standard video transcoding alone triggers TikTok’s internal labeling system.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-5" className="border border-border rounded-xl px-4 bg-card">
                  <AccordionTrigger className="text-sm font-semibold text-foreground py-3.5 text-left hover:no-underline">
                    Can I remove an incorrect AI label from my TikTok video?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4 pt-1">
                    If the notice includes an in-app review or appeal option, you can submit a review request through TikTok. Alternatively, consult TikTok’s official Report a Problem support flow. Note that third-party forensic reports cannot override TikTok’s platform decisions.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-6" className="border border-border rounded-xl px-4 bg-card">
                  <AccordionTrigger className="text-sm font-semibold text-foreground py-3.5 text-left hover:no-underline">
                    What evidence should I gather to prove my video is authentic?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4 pt-1">
                    Preserve the unedited raw camera recording, the full editing project file with timeline history, the master export file, and SHA-256 cryptographic hashes verifying file integrity.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-7" className="border border-border rounded-xl px-4 bg-card">
                  <AccordionTrigger className="text-sm font-semibold text-foreground py-3.5 text-left hover:no-underline">
                    Does missing metadata prove that a video is AI-generated?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4 pt-1">
                    No. Social platforms and editing apps routinely strip metadata atoms and EXIF tags for privacy and file size optimization. Missing metadata is normal and does not indicate synthetic generation.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-8" className="border border-border rounded-xl px-4 bg-card">
                  <AccordionTrigger className="text-sm font-semibold text-foreground py-3.5 text-left hover:no-underline">
                    How does an independent AI video detector differ from TikTok’s internal system?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4 pt-1">
                    Independent detectors analyze pixel textures, temporal coherence, audio dynamics, and container structure to estimate synthetic likelihood. They operate externally and have no access to TikTok’s internal labeling rules, user logs, or ingestion flags.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>

            {/* ── SECTION 11: REFERENCES ── */}
            <section id="references" className="space-y-4 scroll-mt-24 border-t border-border pt-8">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20">
                  Official & Academic Sources
                </Badge>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                  Official Sources & Peer-Reviewed References
                </h2>
              </div>

              <div className="space-y-3 text-xs text-muted-foreground">
                <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <span>1. TikTok Newsroom: AI Transparency & Content Credentials</span>
                    <a
                      href="https://newsroom.tiktok.com/en-us/partnering-with-our-industry-to-advance-ai-transparency-and-literacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Read Announcement <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="leading-relaxed">
                    "Partnering with our industry to advance AI transparency and literacy: C2PA implementation and automated Content Credentials detection."
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <span>2. TikTok Help Center: AI-Generated Content Policy</span>
                    <a
                      href="https://support.tiktok.com/en/using-tiktok/creating-videos/ai-generated-content"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      View Policy <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="leading-relaxed">
                    "Creating videos: Guidelines for labeling AI-generated content, creator disclosure requirements, and community standards."
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <span>3. TikTok Support: Report a Problem</span>
                    <a
                      href="https://support.tiktok.com/en/using-tiktok/report-a-problem/report-a-problem"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Support Guide <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="leading-relaxed">
                    "Official instructions for submitting problem reports, feature feedback, and account support inquiries directly through the TikTok app."
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <span>4. EURASIP Journal on Image and Video Processing</span>
                    <a
                      href="https://link.springer.com/article/10.1186/s13640-024-00621-8"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Springer Study <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="leading-relaxed">
                    "Deepfake video detection under extreme social media compression: an empirical robustness assessment across neural feature representations." (Springer, 2024).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <span>5. Coalition for Content Provenance and Authenticity (C2PA)</span>
                    <a
                      href="https://spec.c2pa.org/specifications/specifications/2.4/explainer/Explainer.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      C2PA Explainer <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="leading-relaxed">
                    "C2PA Specification 2.4 Architecture & Asset Binding Explainer: JUMBF Container Architecture and Cryptographic Manifest Validation."
                  </p>
                </div>
              </div>

              {/* Related Topic Cluster Links */}
              <div className="pt-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Related Technical Guides
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <Link
                    to="/studies/whatsapp-compression-ai-video"
                    className="p-3 rounded-lg border border-border bg-card hover:border-primary transition-colors block space-y-1"
                  >
                    <div className="font-semibold text-foreground">WhatsApp Video Compression Guide</div>
                    <div className="text-[11px] text-muted-foreground">How messaging compression alters spatial & acoustic forensics</div>
                  </Link>

                  <Link
                    to="/studies/authentic-video-false-positives"
                    className="p-3 rounded-lg border border-border bg-card hover:border-primary transition-colors block space-y-1"
                  >
                    <div className="font-semibold text-foreground">Creator False-Positive Defense Guide</div>
                    <div className="text-[11px] text-muted-foreground">Studio lighting, stabilization & color grade false alarms</div>
                  </Link>
                </div>
              </div>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
};
