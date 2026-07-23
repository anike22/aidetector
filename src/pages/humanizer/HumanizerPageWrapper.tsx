import { useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wand2, Shield, CheckCircle2, Zap, Lock, Globe, ArrowRight, Languages } from 'lucide-react';
import HumanizerPage from './HumanizerPage';

const HumanizerSections = lazy(() => import('./HumanizerSections'));

// ─── SEO Schemas ─────────────────────────────────────────────────────────────
const SCHEMAS = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'AI Humanizer – Make AI Text Undetectable | AIDetector.cx',
    description: 'Free AI humanizer tool. Rewrite ChatGPT, GPT-5.5, Gemini, and Claude text to sound natural and pass AI detection. Sentence-level rewriting with tone control.',
    url: 'https://www.aidetector.cx/humanizer',
    inLanguage: 'en',
    dateModified: '2025-06-01',
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
    description: 'Industry-leading AI text humanizer. Rewrite AI-generated content from ChatGPT, GPT-5.5, Gemini, Claude, and DeepSeek to pass AI detection checks while preserving meaning.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: '14328', bestRating: '5' },
    featureList: [
      'AI Text Humanization', 'GPT-5.5 Bypass', 'ChatGPT Rewriter', 'Tone Control',
      'Fact Preservation', 'SEO Preservation', 'Multi-language Support', 'API Access',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Humanize AI-Generated Text',
    description: 'Use the AIDetector.cx AI Humanizer to rewrite AI content in four steps.',
    step: [
      { '@type': 'HowToStep', position: 1, name: 'Paste AI Text', text: 'Paste your ChatGPT, GPT-5.5, or other AI-generated text into the humanizer.' },
      { '@type': 'HowToStep', position: 2, name: 'Choose Settings', text: 'Select humanization level (Light, Balanced, Advanced, Stealth) and tone.' },
      { '@type': 'HowToStep', position: 3, name: 'Humanize', text: 'Click Humanize and our AI rewrites the text to sound naturally human.' },
      { '@type': 'HowToStep', position: 4, name: 'Verify', text: 'Run the output through the AI Detector to confirm it passes detection checks.' },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'What is an AI humanizer?', acceptedAnswer: { '@type': 'Answer', text: 'An AI humanizer is a tool that rewrites AI-generated text to sound more natural and human-written. It alters sentence structure, word choice, and rhythm to reduce AI detection scores.' } },
      { '@type': 'Question', name: 'Can humanized text pass AI detection?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. AIDetector.cx Humanizer in Advanced or Stealth mode can reduce AI detection scores significantly. However, no humanizer guarantees 100% bypass for every detector — results vary by original text and target detector.' } },
      { '@type': 'Question', name: 'Does humanizing AI text preserve meaning?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. AIDetector.cx Humanizer uses meaning-preserving rewriting. Enabling the "Preserve Facts" option ensures key information, statistics, and factual claims are retained through the rewrite.' } },
    ],
  },
];

const TRUST_ITEMS = [
  { icon: Wand2, label: '8.9M+ texts humanized' },
  { icon: Zap, label: 'Under 3s processing' },
  { icon: Shield, label: 'Preserves facts & SEO keywords' },
  { icon: Globe, label: '20+ languages supported' },
  { icon: Lock, label: 'Privacy-first — text never stored' },
  { icon: CheckCircle2, label: '4 humanization levels' },
];

export default function HumanizerPageWrapper() {
  const scrollToTool = () => {
    document.getElementById('humanizer-tool')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <PageMeta
        title="AI Humanizer – Make AI Text Undetectable & Sound Human | AIDetector.cx"
        description="Free AI humanizer. Rewrite ChatGPT, GPT-5.5, Gemini, Claude, and DeepSeek text to pass AI detection. Tone control, fact preservation, SEO-safe. Trusted by 1M+ users."
        canonicalUrl="https://www.aidetector.cx/humanizer"
        ogTitle="AI Humanizer – Rewrite AI Text to Sound Human | AIDetector.cx"
        schemas={SCHEMAS}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="bg-muted/40 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-2 flex items-center gap-2 text-xs text-muted-foreground">
          <a href="/" className="hover:text-primary transition-colors">Home</a>
          <span>/</span>
          <span className="text-foreground font-medium">AI Humanizer</span>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 via-background to-background pt-10 pb-6 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 text-xs font-semibold">
              ✨ #1 Rated AI Humanizer 2025
            </Badge>
            <h1 className="text-3xl md:text-4xl font-extrabold text-navy leading-tight text-balance mb-4">
              AI Humanizer – Make AI Text Sound Naturally Human
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed mb-6 max-w-2xl text-pretty">
              The most advanced <strong>AI humanizer</strong> and <strong>AI text rewriter</strong> available. Paste ChatGPT, GPT-5.5, Gemini, Claude, or DeepSeek output and our{' '}
              <strong>AI to human text converter</strong> rewrites it to sound authentic, engaging, and natural — while passing <strong>AI detection</strong> checks. The complete{' '}
              <strong>ChatGPT humanizer</strong> with tone control, fact preservation, and SEO-safe rewriting.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              <Button size="lg" className="gap-2 font-semibold" onClick={scrollToTool}>
                <Wand2 className="w-4 h-4" />
                Humanize AI Text
              </Button>
              <Button size="lg" variant="outline" className="gap-2 font-semibold" asChild>
                <Link to="/detector">
                  Check AI Score First
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
            {/* Trust strip */}
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {TRUST_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Original humanizer tool — rendered in-place */}
      <div id="humanizer-tool">
        <HumanizerPage />
      </div>

      {/* Marketing sections lazy-loaded below the fold */}
      <Suspense fallback={null}>
        <HumanizerSections />
      </Suspense>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur border-t border-border px-4 py-3">
        <Button className="w-full gap-2 font-semibold" onClick={scrollToTool}>
          <Wand2 className="w-4 h-4" />
          Humanize AI Text Free
        </Button>
      </div>
    </>
  );
}
