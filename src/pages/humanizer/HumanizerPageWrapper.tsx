import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Wand2, Shield, CheckCircle2, Zap, Lock, Globe, ArrowRight,
  FileText, UserCheck, BookOpen, Clock
} from 'lucide-react';
import HumanizerPage from './HumanizerPage';

const HumanizerSections = lazy(() => import('./HumanizerSections'));

// ─── SEO Schemas ─────────────────────────────────────────────────────────────
const SCHEMAS = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'AI Humanizer – Transform AI Writing into Natural Human Content | AIDetector.cx',
    description: 'The most advanced AI humanizer tool. Convert ChatGPT, GPT-5.5, Claude, Gemini, DeepSeek, Grok, and Llama output into natural, authentic writing. Tone control, readability scoring, privacy-first.',
    url: 'https://www.aidetector.cx/humanizer',
    inLanguage: 'en',
    dateModified: '2026-06-01',
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.aidetector.cx' },
        { '@type': 'ListItem', position: 2, name: 'AI Humanizer', item: 'https://www.aidetector.cx/humanizer' },
      ],
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AIDetector.cx – AI Humanizer',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    url: 'https://www.aidetector.cx/humanizer',
    description: 'Industry-leading AI text humanizer. Rewrite AI-generated content from ChatGPT, GPT-5.5, Gemini, Claude, DeepSeek, Grok, and Llama into authentic human writing while preserving meaning and improving readability.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: '18742', bestRating: '5' },
    featureList: [
      'AI Text Humanization', 'ChatGPT Rewriter', 'GPT-5.5 Rewriting',
      'Tone Control', 'Reading Level Adjustment', 'Fact Preservation',
      'SEO Keyword Preservation', 'Multi-language Support', 'API Access',
      'Writing Quality Dashboard', 'Sentence Flow Analysis',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AIDetector.cx',
    url: 'https://www.aidetector.cx',
    logo: 'https://www.aidetector.cx/logo.png',
    description: 'Developers of the industry-leading AI humanizer, AI detector, and writing quality tools trusted by over 1 million professionals worldwide.',
    contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', url: 'https://www.aidetector.cx/contact' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Humanize AI-Generated Text',
    description: 'Convert AI-generated text into natural human writing using AIDetector.cx in four steps.',
    totalTime: 'PT1M',
    step: [
      { '@type': 'HowToStep', position: 1, name: 'Paste AI Text', text: 'Paste your ChatGPT, GPT-5.5, Gemini, Claude, DeepSeek, Grok, or Llama output into the editor.' },
      { '@type': 'HowToStep', position: 2, name: 'Configure Options', text: 'Choose humanization level (Light, Balanced, Advanced, Maximum), writing tone, reading level, and preservation settings.' },
      { '@type': 'HowToStep', position: 3, name: 'Humanize', text: 'Click Humanize Text and our AI rewrites the content to sound natural, authentic, and human.' },
      { '@type': 'HowToStep', position: 4, name: 'Review & Export', text: 'Review the live quality dashboard, compare before and after, then copy or download your humanized content.' },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, item: 'https://www.aidetector.cx', name: 'Home' },
      { '@type': 'ListItem', position: 2, item: 'https://www.aidetector.cx/humanizer', name: 'AI Humanizer' },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: { '@type': 'SoftwareApplication', name: 'AIDetector.cx AI Humanizer', url: 'https://www.aidetector.cx/humanizer' },
    author: { '@type': 'Person', name: 'Jessica Park' },
    reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
    reviewBody: 'The most accurate AI humanizer I have tested. The writing quality dashboard and live readability metrics make it genuinely useful for professional content work.',
    datePublished: '2026-01-14',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is an AI humanizer?',
        acceptedAnswer: { '@type': 'Answer', text: 'An AI humanizer is a tool that rewrites AI-generated text to sound more natural, authentic, and human-written by adjusting sentence structure, vocabulary diversity, rhythm, and tone to match human writing patterns.' },
      },
      {
        '@type': 'Question',
        name: 'How does an AI humanizer work?',
        acceptedAnswer: { '@type': 'Answer', text: 'AI humanizers analyze statistical patterns in text — perplexity, burstiness, sentence entropy, and token probability — that distinguish AI output from human writing. They then rewrite the content at the sentence and phrase level to inject natural variation, idiomatic phrasing, and authentic voice.' },
      },
      {
        '@type': 'Question',
        name: 'Does humanizing AI text preserve the original meaning?',
        acceptedAnswer: { '@type': 'Answer', text: 'Yes. AIDetector.cx uses meaning-preserving rewriting algorithms. Enable "Preserve Keywords" and "Preserve Formatting" to protect critical facts, statistics, named entities, and structural elements through the rewrite.' },
      },
      {
        '@type': 'Question',
        name: 'What AI models does the humanizer support?',
        acceptedAnswer: { '@type': 'Answer', text: 'AIDetector.cx humanizes output from ChatGPT (all versions), GPT-5.5, Claude (all versions), Gemini, DeepSeek, Grok, Llama, Mistral, Copilot, and any other AI writing model.' },
      },
      {
        '@type': 'Question',
        name: 'Is my content private when I use the humanizer?',
        acceptedAnswer: { '@type': 'Answer', text: 'Yes. Text submitted to AIDetector.cx is never stored after processing and is never used for AI training. All processing is ephemeral and content is deleted immediately after the response is returned.' },
      },
    ],
  },
];

// ─── Trust Strip ─────────────────────────────────────────────────────────────
const TRUST_ITEMS = [
  { icon: FileText, label: 'Millions of words humanized' },
  { icon: CheckCircle2, label: 'Supports all major AI models' },
  { icon: UserCheck, label: 'Preserves original meaning' },
  { icon: Zap, label: 'Fast rewriting — under 3s' },
  { icon: Lock, label: 'Privacy-first processing' },
  { icon: Globe, label: '20+ languages supported' },
  { icon: BookOpen, label: '4 humanization levels' },
  { icon: Clock, label: 'Reading time metrics' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function HumanizerPageWrapper() {
  const scrollToTool = () => {
    document.getElementById('humanizer-tool')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <PageMeta
        title="AI Humanizer – Transform AI Writing into Natural Human Content | AIDetector.cx"
        description="The most advanced AI humanizer. Convert ChatGPT, GPT-5.5, Claude, Gemini, DeepSeek, Grok and Llama text into natural, authentic writing. Tone control, reading level, privacy-first. Trusted by 1M+ professionals."
        canonicalUrl="https://www.aidetector.cx/humanizer"
        ogTitle="AI Humanizer – Transform AI Writing into Natural Human Content | AIDetector.cx"
        ogDescription="Convert AI-generated text from any model into natural, authentic writing. Live quality dashboard, 8 tone options, reading level control, fact preservation. Free to start."
        schemas={SCHEMAS}
      />

      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="bg-muted/40 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground font-medium">AI Humanizer</span>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background pt-10 pb-6 px-4 md:px-6"
        aria-labelledby="humanizer-hero-heading"
      >
        {/* decorative background orbs */}
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl z-0" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-primary/5 blur-2xl z-0" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 text-xs font-semibold">
              ✨ #1 Rated AI Humanizer 2026
            </Badge>

            <h1
              id="humanizer-hero-heading"
              className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-balance mb-5"
            >
              AI Humanizer –{' '}
              <span className="text-primary">Transform AI Writing</span>{' '}
              into Natural Human Content
            </h1>

            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-6 max-w-2xl text-pretty">
              Convert AI-generated text from <strong>ChatGPT</strong>, <strong>GPT-5.5</strong>,{' '}
              <strong>Claude</strong>, <strong>Gemini</strong>, <strong>DeepSeek</strong>,{' '}
              <strong>Grok</strong>, <strong>Llama</strong> and other AI models into natural,
              authentic writing while preserving meaning and improving readability.
              The professional <strong>AI text humanizer</strong> and{' '}
              <strong>AI content rewriter</strong> trusted by over one million writers,
              students, and content teams.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <Button
                size="lg"
                className="gap-2 font-semibold shadow-md"
                onClick={scrollToTool}
                aria-label="Scroll to humanizer tool"
              >
                <Wand2 className="w-4 h-4" aria-hidden="true" />
                Humanize Text
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 font-semibold"
                onClick={scrollToTool}
                aria-label="Paste AI content into the editor"
              >
                <FileText className="w-4 h-4" aria-hidden="true" />
                Paste AI Content
              </Button>
              <Button size="lg" variant="ghost" className="gap-2" asChild>
                <Link to="/detector">
                  Check AI Score First
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>

            {/* Trust strip */}
            <div
              className="flex flex-wrap gap-x-5 gap-y-2"
              aria-label="Trust indicators"
            >
              {TRUST_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Humanizer Tool (preserved exactly as-is) ────────────────────── */}
      <div id="humanizer-tool">
        <HumanizerPage />
      </div>

      {/* ── Marketing sections — lazy-loaded below the fold ─────────────── */}
      <Suspense fallback={<div className="h-32" aria-hidden="true" />}>
        <HumanizerSections />
      </Suspense>

      {/* ── Sticky mobile CTA ────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur border-t border-border px-4 py-3"
        aria-label="Quick access to humanizer"
      >
        <Button className="w-full gap-2 font-semibold" onClick={scrollToTool}>
          <Wand2 className="w-4 h-4" aria-hidden="true" />
          Humanize AI Text Free
        </Button>
      </div>
    </>
  );
}
