// ─── Technical Guide: Why WhatsApp Compression Can Confuse AI Video Detectors ───

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
  ListOrdered,
  HelpCircle,
  Share2,
} from 'lucide-react';

const CANONICAL_URL = 'https://www.aidetector.cx/studies/whatsapp-compression-ai-video';

interface TocItem {
  id: string;
  label: string;
}

const TOC_ITEMS: TocItem[] = [
  { id: 'quick-answer', label: 'Quick Answer' },
  { id: 'what-changes-when-shared', label: 'What Changes When a Video Is Shared?' },
  { id: 'comparison-table', label: 'Original vs. Received Comparison Matrix' },
  { id: 'why-detector-results-differ', label: 'Why Detector Results Differ' },
  { id: 'transfer-paths', label: 'Transfer Paths: Standard vs. HD vs. Document' },
  { id: 'investigation-steps', label: '6-Step Investigation Sequence' },
  { id: 'metadata-c2pa', label: 'Metadata & Content Credentials (C2PA)' },
  { id: 'credible-study-methodology', label: 'Proposed Study Methodology' },
  { id: 'product-actions', label: 'Forensic Tools & Workflow Integrations' },
  { id: 'faqs', label: 'Frequently Asked Questions' },
  { id: 'references', label: 'Peer-Reviewed References' },
];

export const WhatsAppCompressionAIDetectionPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>(TOC_ITEMS[0].id);
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

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: 'Why WhatsApp Compression Can Confuse AI Video Detectors',
    description:
      'Learn how WhatsApp video compression affects AI detector results, compare original and shared files, and investigate possible false positives.',
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
    datePublished: '2025-01-14T08:00:00Z',
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
        name: 'WhatsApp Video Compression',
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
        name: 'Does WhatsApp compression automatically make a video look like AI?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. WhatsApp compression introduces DCT blockiness, high-frequency attenuation, and bitrate reduction, but it does not generate synthetic neural features. While these artifacts can degrade detector confidence or trigger false alarms in simplistic single-frame classifiers, a compressed video is not automatically synthetic.',
        },
      },
      {
        '@type': 'Question',
        name: 'Why do AI detectors sometimes flag authentic compressed videos as deepfakes?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Heavy spatial downsampling and aggressive quantization smooth out natural micro-textures such as skin pores and fine hair. Classifiers trained primarily on uncompressed footage may misinterpret this loss of detail as neural diffusion smoothing or face-swap blending boundaries.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does sending a video as HD on WhatsApp prevent compression artifacts?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'HD mode preserves higher spatial resolution (typically up to 1080p or 720p depending on source aspect ratio) and uses a higher bitrate target than Standard mode. However, it still re-encodes the stream using lossy H.264/H.265 compression, modifying original DCT coefficients and stripping container metadata.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does sending a video as a Document preserve original bytes?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sending a video as an uncompressed document attachment transfers the raw binary stream without re-encoding, preserving exact file hashes, frame rates, and EXIF/C2PA metadata. However, this only applies if the file was not already compressed or modified on the sender device before selection.',
        },
      },
      {
        '@type': 'Question',
        name: 'What should I do if I do not have access to the original camera file?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'If only a compressed forwarded copy is available, treat any detection score as provisional and uncertain. Request the master file if possible, inspect temporal and acoustic continuity across multiple frames, check for independent corroborating footage, and never base serious allegations solely on an automated score.',
        },
      },
      {
        '@type': 'Question',
        name: 'Why does WhatsApp strip C2PA metadata and camera EXIF information?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Messaging platforms routinely strip non-essential metadata atoms—including camera serial numbers, GPS coordinates, and C2PA Content Credentials—as a user privacy protection measure and to minimize payload bandwidth during transmission transcoding.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can an AI video detector automatically compensate for WhatsApp compression?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Advanced multi-modal detectors like AIDetector.cx evaluate multi-signal indicators (temporal optical flow, phoneme-viseme alignment, spectral audio dynamics) rather than relying exclusively on fragile single-frame pixel textures. However, severe multi-generation compression can still reduce evidentiary certainty.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is an AI detection score considered legal or forensic proof of synthetic media?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Automated detection scores are evidentiary indicators that quantify statistical patterns in pixel and audio distributions. They must be evaluated alongside provenance records, chain-of-custody documentation, and contextual verification.',
        },
      },
    ],
  };

  return (
    <div className="w-full bg-background text-foreground min-h-screen">
      <PageMeta
        title="WhatsApp Video Compression & AI Detection | AIDetector.cx"
        description="Learn how WhatsApp video compression can affect AI detector results, compare original and shared files, and investigate possible false positives."
        canonicalUrl={CANONICAL_URL}
        ogTitle="WhatsApp Video Compression & AI Detection | Technical Guide"
        ogDescription="A technical guide on how messaging compression alters video forensics, how to compare original and shared files, and how to investigate false positives."
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
            <span className="text-foreground font-medium">WhatsApp Video Compression</span>
          </nav>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5 bg-primary/10 text-primary border-primary/20">
              Technical Guide
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> 8 min read
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" /> Reviewed by Media Forensics Team
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">Updated March 2026</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground max-w-4xl leading-[1.15]">
            Why WhatsApp Compression Can Confuse AI Video Detectors
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-3xl leading-relaxed">
            A forwarded video can lose context as well as image quality. Understand how compression can affect detection, compare original and received files, and investigate suspicious results without treating a score as proof.
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

              {/* Quick CTA Box */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <Shield className="w-4 h-4" /> Multi-Modal Video Scanner
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Analyze video frames, audio spectral patterns, and temporal motion vectors directly in your browser.
                </p>
                <Link to="/ai-video-detector" className="block">
                  <Button size="sm" className="w-full text-xs font-semibold gap-1.5">
                    Check a video <ArrowRight className="w-3.5 h-3.5" />
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
                  Compression can affect an AI video detector’s reliability, but a WhatsApp video is not automatically synthetic—or automatically a false positive. Compare the received file with its original when possible, review the available evidence, and treat uncertain results as uncertain.
                </p>
                <div className="pt-2 border-t border-primary/15 text-xs text-muted-foreground leading-relaxed">
                  Empirical research on compression-induced forensic distortion is detailed in this{' '}
                  <a
                    href="https://link.springer.com/article/10.1186/s13640-024-00621-8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2 hover:text-primary/80 inline-flex items-center gap-1 font-medium"
                  >
                    peer-reviewed detection assessment <ExternalLink className="w-3 h-3" />
                  </a>
                  . <em>Note: The cited paper evaluates academic baseline models on synthetic compression benchmarks, not verified AIDetector.cx performance on current WhatsApp mobile client releases.</em>
                </div>
              </div>
            </section>

            {/* ── SECTION 1: WHAT CAN CHANGE WHEN A VIDEO IS SHARED? ── */}
            <section id="what-changes-when-shared" className="space-y-4 scroll-mt-24">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20">
                  Forensic Pipeline
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  What Can Change When a Video Is Shared?
                </h2>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                When a video is transmitted through mobile messaging applications like WhatsApp, the file undergoes automated ingestion routines designed to minimize cellular data usage and ensure cross-device playback compatibility. These operations modify physical file properties that forensic detection systems examine.
              </p>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Importantly, these alterations represent <strong>properties to inspect</strong> rather than changes that universally or identically occur across every transfer. Factors such as user transfer selection (Standard vs. HD vs. Document), device hardware encoder capabilities, operating system (iOS vs. Android), and network conditions all influence the final received bitstream.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <Card className="border-border bg-card p-4 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                    <Layers className="w-4 h-4 text-primary shrink-0" /> Spatial & Pixel-Domain Alterations
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Lossy Discrete Cosine Transform (DCT) quantization groups adjacent pixel variations into 8x8 or 16x16 macroblocks, flattening high-frequency skin pores and hair strands while creating ringing artifacts along high-contrast edges.
                  </p>
                </Card>

                <Card className="border-border bg-card p-4 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                    <Clock className="w-4 h-4 text-emerald-500 shrink-0" /> Temporal & Frame-Rate Regularization
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Mobile video transcoders frequently normalize high-frame-rate inputs (such as 60 fps or 120 fps) down to standard 24–30 fps GOP structures, altering inter-frame optical flow vectors and motion continuity.
                  </p>
                </Card>

                <Card className="border-border bg-card p-4 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                    <Cpu className="w-4 h-4 text-blue-500 shrink-0" /> Acoustic Track Re-Encoding
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Audio streams are re-compressed into lossy AAC or Opus codecs with reduced bitrates and high-frequency roll-offs, attenuating subtle ambient room reverberation and microphone floor noise.
                  </p>
                </Card>

                <Card className="border-border bg-card p-4 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                    <FileCheck className="w-4 h-4 text-purple-500 shrink-0" /> Metadata Atom Stripping
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Standard in-app media sends strip EXIF camera metadata, GPS tags, encoder hardware signatures, and cryptographic C2PA provenance manifests to protect user privacy and save payload bytes.
                  </p>
                </Card>
              </div>
            </section>

            {/* ── SECTION 2: COMPARISON TABLE (ORIGINAL VS. RECEIVED) ── */}
            <section id="comparison-table" className="space-y-4 scroll-mt-24">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20">
                  Verification Matrix
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  Comparing Original and Received Video Files
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  When investigating a questioned clip, compare each technical property between the master recording and the received copy. Understand what each delta confirms—and what it cannot prove.
                </p>
              </div>

              {/* Responsive Table Wrapper */}
              <div className="rounded-xl border border-border overflow-hidden bg-card shadow-xs">
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[620px]">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border">
                        <th className="py-3 px-4 font-semibold text-foreground w-1/4">Property</th>
                        <th className="py-3 px-4 font-semibold text-foreground w-3/8">What to Compare (Original vs. Received)</th>
                        <th className="py-3 px-4 font-semibold text-foreground w-3/8">What the Observation Cannot Prove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr className="hover:bg-muted/20">
                        <td className="py-3 px-4 font-medium text-foreground">
                          Spatial Resolution & Dimensions
                        </td>
                        <td className="py-3 px-4 text-muted-foreground leading-relaxed">
                          Check for downscaling (e.g. 3840x2160 or 1920x1080 down to 1280x720 or 848x480).
                        </td>
                        <td className="py-3 px-4 text-muted-foreground leading-relaxed">
                          Downscaling proves transmission transcoding; it does <strong className="text-foreground">not</strong> prove whether the source content was generated or captured.
                        </td>
                      </tr>

                      <tr className="hover:bg-muted/20">
                        <td className="py-3 px-4 font-medium text-foreground">
                          Codec & Compression Profile
                        </td>
                        <td className="py-3 px-4 text-muted-foreground leading-relaxed">
                          Compare container formats (e.g. ProRes/HEVC Main 10 vs. AVC Baseline/Main).
                        </td>
                        <td className="py-3 px-4 text-muted-foreground leading-relaxed">
                          A standard H.264 profile confirms platform re-encoding, but cannot determine if a face was swapped or synthesized prior to sending.
                        </td>
                      </tr>

                      <tr className="hover:bg-muted/20">
                        <td className="py-3 px-4 font-medium text-foreground">
                          Duration & Frame Timing
                        </td>
                        <td className="py-3 px-4 text-muted-foreground leading-relaxed">
                          Inspect exact millisecond timestamps and frame cadence (e.g. constant 60 fps vs. variable 24–30 fps GOP).
                        </td>
                        <td className="py-3 px-4 text-muted-foreground leading-relaxed">
                          Frame rate normalization does not prove generative frame interpolation or lip-sync manipulation.
                        </td>
                      </tr>

                      <tr className="hover:bg-muted/20">
                        <td className="py-3 px-4 font-medium text-foreground">
                          Audio Sampling & Bitrate
                        </td>
                        <td className="py-3 px-4 text-muted-foreground leading-relaxed">
                          Compare channel layouts (stereo/5.1 vs. mono/stereo), sample rates (48 kHz vs. 44.1 kHz), and codec bitrates.
                        </td>
                        <td className="py-3 px-4 text-muted-foreground leading-relaxed">
                          High-frequency audio cutoff removes background air, but this lossy acoustic profile does not prove synthetic voice cloning.
                        </td>
                      </tr>

                      <tr className="hover:bg-muted/20">
                        <td className="py-3 px-4 font-medium text-foreground">
                          File Size & Encoding Bitrate
                        </td>
                        <td className="py-3 px-4 text-muted-foreground leading-relaxed">
                          Compare overall file weight (e.g. 150 MB master vs. 6 MB compressed copy).
                        </td>
                        <td className="py-3 px-4 text-muted-foreground leading-relaxed">
                          Drastic size reduction demonstrates high quantization, but cannot verify whether the creator used AI editing tools.
                        </td>
                      </tr>

                      <tr className="hover:bg-muted/20">
                        <td className="py-3 px-4 font-medium text-foreground">
                          Metadata Atoms & EXIF Tags
                        </td>
                        <td className="py-3 px-4 text-muted-foreground leading-relaxed">
                          Inspect camera model strings, lens profiles, exposure parameters, and creation timestamps.
                        </td>
                        <td className="py-3 px-4 text-muted-foreground leading-relaxed">
                          Missing metadata is standard across messaging platforms; absence does <strong className="text-foreground">not</strong> indicate malicious deception or AI origin.
                        </td>
                      </tr>

                      <tr className="hover:bg-muted/20">
                        <td className="py-3 px-4 font-medium text-foreground">
                          Cryptographic SHA-256 Hashes
                        </td>
                        <td className="py-3 px-4 text-muted-foreground leading-relaxed">
                          Compute cryptographic SHA-256 checksums of both files to verify bit-level identity.
                        </td>
                        <td className="py-3 px-4 text-muted-foreground leading-relaxed">
                          A matching hash proves exact byte-for-byte transmission fidelity, but does <strong className="text-foreground">not</strong> prove the truth or authenticity of depicted real-world events.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* ── SECTION 3: WHY DO DETECTOR RESULTS DIFFER? ── */}
            <section id="why-detector-results-differ" className="space-y-4 scroll-mt-24">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20">
                  Forensic Dynamics
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  Why Can Detector Results Differ on Compressed Files?
                </h2>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Automated AI video detectors operate by extracting mathematical patterns from pixel values, frequency transforms, and temporal motion vectors. When compression alters the underlying bitstream, it fundamentally changes the available forensic evidence.
              </p>

              <p className="text-sm text-muted-foreground leading-relaxed">
                It is vital to understand that compression does not universally shift scores in one direction. Changing the analyzed file can lead to three distinct outcome categories:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-600">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> False Positive
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    A genuine, real-world recording is erroneously classified as synthetic. Severe quantization smoothing can mimic synthetic skin textures, and frame-rate jitter can trigger motion anomaly alerts.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-rose-600">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> False Negative
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    An AI-generated or deepfaked video is classified as authentic. Heavy re-compression can wash out telltale diffusion artifacts, blur boundary seams, or destroy subtle GAN grid signatures.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-blue-600">
                    <Info className="w-4 h-4 shrink-0" /> Inconclusive Determination
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The forensic engine detects high degradation and determines that the signal-to-noise ratio is too low for a defensible classification. The result is marked uncertain rather than guessing.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/30 text-xs text-muted-foreground leading-relaxed space-y-1.5">
                <p className="font-semibold text-foreground">
                  Important Note on Model Scores and Probability Interpretation:
                </p>
                <p>
                  A detector score (e.g. 78% AI likelihood) represents an internal model confidence metric based on evaluated feature distributions. It should <strong>not</strong> be interpreted as a calibrated mathematical probability of real-world truth unless verified through controlled calibration curves against known test distributions.
                </p>
              </div>
            </section>

            {/* ── SECTION 4: TRANSFER PATHS ── */}
            <section id="transfer-paths" className="space-y-4 scroll-mt-24">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20">
                  Ingestion Pathways
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  Different Transfer Paths Need Separate Checks
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  How a file moves from sender to recipient dictates which modifications occur. Treat each transfer mechanism as a distinct technical workflow:
                </p>
              </div>

              <div className="space-y-3 pt-1 text-xs">
                <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-primary" /> 1. Standard-Quality Chat Media
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Standard sends apply aggressive spatial downscaling (often targeting 480p or 720p) and low bitrate caps to ensure instantaneous delivery. This path introduces the highest level of macroblocking, high-frequency attenuation, and metadata stripping.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-500" /> 2. HD Media Selection
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    WhatsApp HD mode allows higher spatial resolution (typically up to 1080p or 720p depending on aspect ratio) and provides higher target bitrates. <strong>However, HD is not lossless.</strong> The media stream is still re-encoded by the client transcode pipeline, modifying original pixel DCT coefficients.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" /> 3. Document Attachment Transfer
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Sending a video file as a <em>Document</em> (via the file picker rather than the gallery selector) bypasses the media transcoding pipeline, sending raw binary bytes. If the sender selected an unedited camera master, this path preserves exact byte-level parity and metadata. Always calculate SHA-256 checksums to verify integrity.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-purple-500" /> 4. In-App Forwarding vs. Re-Uploading
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Direct in-app message forwarding often references existing server-cached media blocks without triggering a secondary transcode pass. In contrast, saving a video to the local camera roll and uploading it as a new message initiates a second round of compression, compounding artifact severity (generation loss).
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card space-y-1.5">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Video className="w-4 h-4 text-amber-500" /> 5. Status Updates and Live Calls (Separate Workflows)
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    WhatsApp Status stories and real-time video calls utilize distinct WebRTC adaptive streaming and dynamic Opus/H.264 profiles that fluctuate with network throughput. <strong>Do not use live-call codec documentation to describe chat attachments.</strong>
                  </p>
                </div>
              </div>
            </section>

            {/* ── SECTION 5: 6-STEP INVESTIGATION SEQUENCE ── */}
            <section id="investigation-steps" className="space-y-4 scroll-mt-24">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20">
                  Protocol Checklist
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  How to Investigate a Suspicious Forwarded Video
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  When a received video raises concerns or yields an unexpected detector score, follow this disciplined forensic sequence before making conclusions:
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex gap-3.5 p-4 rounded-xl border border-border bg-card">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div className="space-y-1 text-xs">
                    <h3 className="font-bold text-foreground text-sm">Preserve the Received File Without Editing</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Save the raw received attachment immediately without applying mobile trims, gallery enhancements, screen recording, or cloud photo auto-sync adjustments that introduce additional artifacts.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 p-4 rounded-xl border border-border bg-card">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div className="space-y-1 text-xs">
                    <h3 className="font-bold text-foreground text-sm">Request the Original Source File</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Where feasible, request the original uncompressed recording directly from the author via document transfer, secure direct drive link, or physical memory transfer.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 p-4 rounded-xl border border-border bg-card">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div className="space-y-1 text-xs">
                    <h3 className="font-bold text-foreground text-sm">Record Transfer Method & Device Environment</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Document the transmission path (Standard send, HD send, Document send, or multi-hop forward), sender app version, operating system, and approximate timestamp.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 p-4 rounded-xl border border-border bg-card">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    4
                  </div>
                  <div className="space-y-1 text-xs">
                    <h3 className="font-bold text-foreground text-sm">Compare File Properties and Cryptographic Hashes</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Compute SHA-256 checksums and inspect container atoms. Matching hashes verify byte identity; diverging hashes indicate transcoding or alteration.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 p-4 rounded-xl border border-border bg-card">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    5
                  </div>
                  <div className="space-y-1 text-xs">
                    <h3 className="font-bold text-foreground text-sm">Compare Detector Reports Using Consistent Settings</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Run both original and received copies through the same forensic scanner configuration (e.g. AIDetector.cx Balanced Mode) to observe score variance and localized finding diffs.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5 p-4 rounded-xl border border-border bg-card">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    6
                  </div>
                  <div className="space-y-1 text-xs">
                    <h3 className="font-bold text-foreground text-sm">Corroborate with Independent Context</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Examine physical scene geometry, lighting consistency, acoustic reverberation, eyewitness records, and secondary camera angles before making public claims or accusations.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-muted-foreground leading-relaxed flex items-start gap-2">
                <Hash className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Evidentiary Rule:</strong> Matching SHA-256 hashes strongly support byte-for-byte transmission identity, but they do <strong className="text-foreground">not</strong> independently prove that the depicted event physically took place in reality.
                </span>
              </div>
            </section>

            {/* ── SECTION 6: METADATA AND CONTENT CREDENTIALS (C2PA) ── */}
            <section id="metadata-c2pa" className="space-y-4 scroll-mt-24">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20">
                  Provenance Standards
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  Metadata and Content Credentials (C2PA)
                </h2>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Cryptographic provenance frameworks such as the Coalition for Content Provenance and Authenticity (C2PA) embed verifiable digital signatures into media containers, documenting capture device information, edits, and generative AI tool usage.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
                <Card className="border-border bg-card p-4 space-y-2">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-primary" /> What Missing Metadata Means
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Social and messaging platforms routinely strip EXIF tags and JUMBF metadata atoms during standard transmission transcoding to protect personal privacy (such as location coordinates) and reduce file size. <strong>The absence of C2PA credentials does not prove AI generation or tampering.</strong>
                  </p>
                </Card>

                <Card className="border-border bg-card p-4 space-y-2">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-500" /> What Valid Provenance Confirms
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    A valid, untampered C2PA manifest confirms the software and hardware signing lineage along the documented editing chain. However, valid provenance does not independently prove that an unmanipulated real-world event occurred as depicted.
                  </p>
                </Card>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                For complete technical specifications on how cryptographic manifests are bound to media files, review the official{' '}
                <a
                  href="https://spec.c2pa.org/specifications/specifications/2.4/explainer/Explainer.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 hover:text-primary/80 inline-flex items-center gap-1 font-medium"
                >
                  C2PA Technical Explainer <ExternalLink className="w-3 h-3" />
                </a>
                .
              </p>
            </section>

            {/* ── SECTION 7: WHAT A CREDIBLE STUDY SHOULD MEASURE (PROPOSED METHODOLOGY) ── */}
            <section id="credible-study-methodology" className="space-y-4 scroll-mt-24">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20">
                  Scientific Rigor
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  What a Credible Compression Study Should Measure
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  To ensure scientific transparency, the parameters below define our <strong>proposed benchmark methodology</strong> for evaluating compression impact on video forensic systems. Until full multi-device experimental runs are finalized and published with raw replication datasets, these standards serve as the measurement framework:
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-border bg-card space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Permissioned Test Source Clips
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      A balanced corpus of genuine uncompressed camera footage across diverse sensor types (smartphone, mirrorless, cinema) paired with synthetic clips generated from known foundation models (OpenAI Sora, Kling, Runway Gen-3, Google Veo).
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Documented Transmission Conditions
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Controlled transfer matrix tracking Standard media, HD media, Document transfer, and multi-generation forwards, logging exact client app builds, OS versions, and network connection types.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Independent Sample Unit Counts
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Evaluation based on independent, distinct video recordings. <strong>Never inflating sample counts</strong> by treating multiple extracted frames from a single clip as independent videos.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Disaggregated Outcome Reporting
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Transparent reporting separating Precision, Recall, False-Positive Rate, False-Negative Rate, and Inconclusive determinations with explicitly stated denominators.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-muted/30 rounded-lg border border-border text-muted-foreground leading-relaxed">
                  <strong>Methodological Rule:</strong> Inconclusive outcomes must be reported as a separate category of uncertainty and never recorded as correct synthetic or authentic predictions.
                </div>
              </div>
            </section>

            {/* ── SECTION 8: FORENSIC TOOLS & ENTERPRISE INTEGRATIONS ── */}
            <section id="product-actions" className="space-y-4 scroll-mt-24">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20">
                  Forensic Operations
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  Actionable Forensic Tools & Integrations
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Put forensic verification into practice across individual video reviews and high-throughput enterprise pipelines:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Primary Tool CTA Card */}
                <Card className="border-primary/20 bg-primary/5 p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <Video className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-foreground">AI Video Detector Scanner</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Upload and analyze video files for visual artifacts, temporal incoherence, voice synthesis, and container provenance using our multi-modal forensic pipeline.
                    </p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <Link to="/ai-video-detector" className="block">
                      <Button className="w-full text-xs font-semibold gap-2">
                        Check a video <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <p className="text-[11px] text-muted-foreground text-center">
                      Use detection as one part of your review—not proof of authorship or authenticity.
                    </p>
                  </div>
                </Card>

                {/* Compare Tool CTA Card */}
                <Card className="border-border bg-card p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                      <Layers className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-base text-foreground">Original vs. Published Compare</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Compare an original uncompressed camera recording against a compressed social copy to isolate transcoding differentials and verify genuine creator lineage.
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

              {/* Enterprise Integration Callout */}
              <div className="p-4 rounded-xl border border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="space-y-1 max-w-xl">
                  <div className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-primary" /> Enterprise API & Workflow Integrations
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Integrate high-throughput video forensic screening directly into your moderation, trust-and-safety, or KYC workflows via our REST API.
                  </p>
                </div>
                <Link to="/api-platform" className="shrink-0">
                  <Button variant="secondary" size="sm" className="w-full sm:w-auto text-xs font-medium gap-1.5">
                    Explore API Platform <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </section>

            {/* ── SECTION 9: VISIBLE FAQS ACCORDION ── */}
            <section id="faqs" className="space-y-4 scroll-mt-24">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20">
                  Knowledge Base
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  Frequently Asked Questions
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Key answers regarding compression dynamics, transfer methods, metadata handling, and detector accuracy:
                </p>
              </div>

              <Accordion type="single" collapsible className="w-full space-y-2 pt-1">
                <AccordionItem value="faq-1" className="border border-border rounded-xl px-4 bg-card">
                  <AccordionTrigger className="text-sm font-semibold text-foreground py-3.5 text-left hover:no-underline">
                    Does WhatsApp compression automatically make a video look like AI?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4 pt-1">
                    No. WhatsApp compression introduces DCT blockiness, high-frequency attenuation, and bitrate reduction, but it does not generate synthetic neural features. While these artifacts can degrade detector confidence or trigger false alarms in simplistic single-frame classifiers, a compressed video is not automatically synthetic.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-2" className="border border-border rounded-xl px-4 bg-card">
                  <AccordionTrigger className="text-sm font-semibold text-foreground py-3.5 text-left hover:no-underline">
                    Why do AI detectors sometimes flag authentic compressed videos as deepfakes?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4 pt-1">
                    Heavy spatial downsampling and aggressive quantization smooth out natural micro-textures such as skin pores and fine hair. Classifiers trained primarily on uncompressed footage may misinterpret this loss of detail as neural diffusion smoothing or face-swap blending boundaries.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-3" className="border border-border rounded-xl px-4 bg-card">
                  <AccordionTrigger className="text-sm font-semibold text-foreground py-3.5 text-left hover:no-underline">
                    Does sending a video as 'HD' on WhatsApp prevent compression artifacts?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4 pt-1">
                    HD mode preserves higher spatial resolution (typically up to 1080p or 720p depending on source aspect ratio) and uses a higher bitrate target than Standard mode. However, it still re-encodes the stream using lossy H.264/H.265 compression, modifying original DCT coefficients and stripping container metadata.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-4" className="border border-border rounded-xl px-4 bg-card">
                  <AccordionTrigger className="text-sm font-semibold text-foreground py-3.5 text-left hover:no-underline">
                    Does sending a video as a 'Document' preserve original bytes?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4 pt-1">
                    Sending a video as an uncompressed document attachment transfers the raw binary stream without re-encoding, preserving exact file hashes, frame rates, and EXIF/C2PA metadata. However, this only applies if the file was not already compressed or modified on the sender device before selection.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-5" className="border border-border rounded-xl px-4 bg-card">
                  <AccordionTrigger className="text-sm font-semibold text-foreground py-3.5 text-left hover:no-underline">
                    What should I do if I don't have access to the original camera file?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4 pt-1">
                    If only a compressed forwarded copy is available, treat any detection score as provisional and uncertain. Request the master file if possible, inspect temporal and acoustic continuity across multiple frames, check for independent corroborating footage, and never base serious allegations solely on an automated score.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-6" className="border border-border rounded-xl px-4 bg-card">
                  <AccordionTrigger className="text-sm font-semibold text-foreground py-3.5 text-left hover:no-underline">
                    Why does WhatsApp strip C2PA metadata and camera EXIF information?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4 pt-1">
                    Messaging platforms routinely strip non-essential metadata atoms—including camera serial numbers, GPS coordinates, and C2PA Content Credentials—as a user privacy protection measure and to minimize payload bandwidth during transmission transcoding.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-7" className="border border-border rounded-xl px-4 bg-card">
                  <AccordionTrigger className="text-sm font-semibold text-foreground py-3.5 text-left hover:no-underline">
                    Can an AI video detector automatically compensate for social media compression?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4 pt-1">
                    Advanced multi-modal detectors like AIDetector.cx evaluate multi-signal indicators (temporal optical flow, phoneme-viseme alignment, spectral audio dynamics) rather than relying exclusively on fragile single-frame pixel textures. However, severe multi-generation compression can still reduce evidentiary certainty.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="faq-8" className="border border-border rounded-xl px-4 bg-card">
                  <AccordionTrigger className="text-sm font-semibold text-foreground py-3.5 text-left hover:no-underline">
                    Is an AI detection score considered legal or forensic proof of synthetic media?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4 pt-1">
                    No. Automated detection scores are evidentiary indicators that quantify statistical patterns in pixel and audio distributions. They must be evaluated alongside provenance records, chain-of-custody documentation, and contextual verification.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>

            {/* ── SECTION 10: PEER-REVIEWED REFERENCES & FURTHER READING ── */}
            <section id="references" className="space-y-4 scroll-mt-24 border-t border-border pt-8">
              <div className="space-y-2">
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/20">
                  Academic & Technical Sources
                </Badge>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                  Peer-Reviewed References & Further Reading
                </h2>
              </div>

              <div className="space-y-3 text-xs text-muted-foreground">
                <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <span>1. EURASIP Journal on Image and Video Processing</span>
                    <a
                      href="https://link.springer.com/article/10.1186/s13640-024-00621-8"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Read Study <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="leading-relaxed">
                    "Deepfake video detection under extreme social media compression: an empirical robustness assessment across neural feature representations." (Springer, 2024).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <span>2. Coalition for Content Provenance and Authenticity (C2PA)</span>
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

                <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <span>3. Google Search Central Guidelines</span>
                    <a
                      href="https://developers.google.com/search/docs/fundamentals/creating-helpful-content"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Google Docs <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="leading-relaxed">
                    "Creating helpful, reliable, people-first content: E-E-A-T principles and transparent technical documentation."
                  </p>
                </div>
              </div>

              {/* Related Topic Cluster Links */}
              <div className="pt-4 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Related Technical Studies
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <Link
                    to="/studies/why-tiktok-flagged-my-real-video"
                    className="p-3 rounded-lg border border-border bg-card hover:border-primary transition-colors block space-y-1"
                  >
                    <div className="font-semibold text-foreground">TikTok Video Transcoding Study</div>
                    <div className="text-[11px] text-muted-foreground">High-bitrate camera master vs. social transcode comparison</div>
                  </Link>

                  <Link
                    to="/studies/authentic-video-false-positives"
                    className="p-3 rounded-lg border border-border bg-card hover:border-primary transition-colors block space-y-1"
                  >
                    <div className="font-semibold text-foreground">Creator False-Positive Guide</div>
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
