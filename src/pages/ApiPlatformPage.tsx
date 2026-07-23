import { useState } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Copy, Check, Shield, Zap, BarChart3, List, Layers, Globe, Lock,
  Rocket, Building2, GraduationCap, Newspaper, Briefcase, Users,
  PenTool, ChevronRight, BookOpen, KeyRound, AlertCircle, Code2,
  Activity, Terminal, ArrowRight, CheckCircle2, Webhook, Gauge, LayoutDashboard
} from 'lucide-react';

// ── Copy-to-clipboard code block ─────────────────────────────────────────────
function CodeBlock({ code, lang = 'json' }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-xl overflow-hidden border border-border">
      <div className="flex items-center justify-between bg-muted/60 px-4 py-2 border-b border-border">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{lang}</span>
        <button
          onClick={copy}
          aria-label="Copy code"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <><Check className="w-3.5 h-3.5 text-success" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
        </button>
      </div>
      <pre className="bg-[hsl(var(--navy)/0.96)] text-emerald-300 p-5 overflow-x-auto text-sm font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ── Feature card data ─────────────────────────────────────────────────────────
const features = [
  { icon: Activity,        title: 'AI Detection API',         desc: 'Detect AI-generated content across ChatGPT, Gemini, Claude, and 50+ models with a single REST call.' },
  { icon: List,            title: 'Sentence-Level Detection', desc: 'Identify exactly which sentences are AI-written with per-sentence probability scores.' },
  { icon: BarChart3,       title: 'AI Probability Score',     desc: 'Receive a 0–100% AI probability score for every text submission.' },
  { icon: Users,           title: 'Human Probability Score',  desc: 'Complementary human-authorship score for complete confidence in content authenticity.' },
  { icon: Layers,          title: 'Batch Detection',          desc: 'Analyze up to 100 texts in a single API request — ideal for high-volume pipelines.' },
  { icon: Globe,           title: 'REST API',                 desc: 'Standard HTTP REST interface with JSON. Works with Python, JavaScript, PHP, Ruby, Go, and more.' },
  { icon: Code2,           title: 'JSON Responses',           desc: 'Structured, predictable JSON responses that are easy to parse and integrate.' },
  { icon: Lock,            title: 'Secure API Keys',          desc: 'Bearer-token authentication. Generate, rotate, and revoke keys from your dashboard at any time.' },
  { icon: LayoutDashboard, title: 'Usage Dashboard',          desc: 'Real-time request counters, quota tracking, and per-key analytics from your API Dashboard.' },
  { icon: Zap,             title: 'Fast Processing',          desc: 'Sub-200 ms median response time backed by a 99.9% uptime SLA on Pro and Enterprise plans.' },
  { icon: Gauge,           title: 'Rate Limiting',            desc: 'Transparent rate limit headers on every response so your integration can self-throttle gracefully.' },
  { icon: Webhook,         title: 'Webhooks (Coming Soon)',   desc: 'Push detection results to your endpoint in real time without polling. Available for Enterprise.' },
  { icon: Building2,       title: 'Enterprise Ready',         desc: 'Dedicated infrastructure, custom rate limits, and a named account manager for enterprise customers.' },
];

// ── Supported models ──────────────────────────────────────────────────────────
const models = [
  { name: 'ChatGPT',   color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', abbr: 'GPT' },
  { name: 'GPT-5.5',   color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', abbr: 'G5' },
  { name: 'Gemini',    color: 'bg-blue-500/10 text-blue-600 border-blue-200',           abbr: 'GEM' },
  { name: 'Claude',    color: 'bg-orange-500/10 text-orange-600 border-orange-200',     abbr: 'CLR' },
  { name: 'DeepSeek',  color: 'bg-purple-500/10 text-purple-600 border-purple-200',     abbr: 'DS' },
  { name: 'Llama',     color: 'bg-rose-500/10 text-rose-600 border-rose-200',           abbr: 'LLM' },
  { name: 'Mistral',   color: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',     abbr: 'MST' },
];

// ── Use cases ─────────────────────────────────────────────────────────────────
const useCases = [
  { icon: GraduationCap, title: 'Universities',         desc: 'Maintain academic integrity by automatically detecting AI-generated essays and assignments at scale.' },
  { icon: Newspaper,     title: 'Publishers',           desc: 'Verify content authenticity before publication to protect editorial standards and reader trust.' },
  { icon: Briefcase,     title: 'SaaS Platforms',       desc: 'Embed AI detection natively into your product to give users instant content authenticity signals.' },
  { icon: Users,         title: 'Recruiters',           desc: 'Screen resumes and cover letters to identify AI-generated applications during candidate evaluation.' },
  { icon: PenTool,       title: 'AI Writing Platforms', desc: 'Integrate detection to help users understand and improve the authenticity of their content.' },
  { icon: Building2,     title: 'Agencies',             desc: 'Validate client deliverables and maintain content quality standards across all creative projects.' },
  { icon: Shield,        title: 'Compliance Teams',     desc: 'Enforce AI-content policies across regulated industries: finance, legal, healthcare, and government.' },
];

// ── Pricing plans ─────────────────────────────────────────────────────────────
const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    desc: 'Explore the API and build a proof of concept.',
    features: ['100 API requests / month', 'Text detection endpoint', 'JSON responses', 'Community support', 'API key management'],
    cta: 'Get Started Free',
    href: '/signup',
    highlight: false,
    badge: null,
  },
  {
    name: 'Pro',
    price: '$49',
    period: '/month',
    desc: 'For growing apps and production integrations.',
    features: ['10,000 API requests / month', 'Sentence-level detection', 'Batch detection (up to 50)', 'All supported AI models', 'Priority email support', '99.9% uptime SLA'],
    cta: 'Start Pro Trial',
    href: '/signup',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'Unlimited scale with dedicated support and SLAs.',
    features: ['Unlimited API requests', 'Custom rate limits', 'Dedicated infrastructure', 'Named account manager', 'Custom SLA & contracts', 'On-premise deployment options'],
    cta: 'Contact Sales',
    href: '/contact',
    highlight: false,
    badge: null,
  },
];

// ── Documentation topics ───────────────────────────────────────────────────────
const docTopics = [
  { icon: KeyRound,    title: 'Authentication',  desc: 'Learn how to obtain and use API keys for secure Bearer-token authentication.',         href: '/api/docs#authentication' },
  { icon: Terminal,    title: 'Endpoints',       desc: 'Full reference for /v1/detect, /v1/batch, and all available endpoints.',              href: '/api/docs#detect' },
  { icon: Zap,         title: 'Rate Limits',     desc: 'Understand per-plan rate limits, headers, and best practices for high-volume use.',   href: '/api/docs#rate-limits' },
  { icon: AlertCircle, title: 'Error Codes',     desc: 'Comprehensive error code reference with causes and recommended fixes.',               href: '/api/docs#errors' },
  { icon: Code2,       title: 'SDKs',            desc: 'Official SDKs for Python, JavaScript, PHP, Ruby, and Java to speed up integration.', href: '/api/docs#sdks' },
  { icon: Rocket,      title: 'Quick Start',     desc: 'Step-by-step guide to make your first API call in under five minutes.',              href: '/api/docs#quickstart' },
];

// ── FAQ data ──────────────────────────────────────────────────────────────────
const faqs = [
  {
    q: 'What is the AIDetector.cx AI Detector API?',
    a: 'The AIDetector.cx AI Detector API is a REST API that lets you integrate AI content detection into any application. Submit text and receive a detailed JSON response with AI probability scores, sentence-level analysis, model fingerprinting, and confidence scores — all in a single HTTP call.',
  },
  {
    q: 'What is an AI Detection API and how does it work?',
    a: 'An AI Detection API is a programmatic interface that analyses text for statistical and linguistic patterns associated with large language models. AIDetector.cx compares your submitted text against multi-model classifiers trained on billions of human-written and AI-generated samples, returning a probability score for each model.',
  },
  {
    q: 'Does the API support ChatGPT detection?',
    a: 'Yes. The API detects content generated by ChatGPT (GPT-3.5 and GPT-4), GPT-5.5, Gemini, Claude, DeepSeek, Llama, Mistral, and many more. The fingerprint field in the response identifies the most likely source model. We continuously expand coverage as new models are released.',
  },
  {
    q: 'How do I authenticate API requests?',
    a: 'All requests must include your API key as a Bearer token in the Authorization header: Authorization: Bearer YOUR_API_KEY. You can create, rotate, and revoke API keys from your account dashboard at any time.',
  },
  {
    q: 'What are the API rate limits?',
    a: 'Free plan includes 100 requests per month. Pro includes 10,000 requests per month. Enterprise plans offer custom, negotiated limits with no hard cap. Rate-limit headers (X-RateLimit-Remaining and X-RateLimit-Reset) are returned on every response so your app can manage usage dynamically.',
  },
  {
    q: 'Which programming languages are supported?',
    a: 'The REST API works with any language that supports HTTP. Official SDKs are available for Python, JavaScript / TypeScript, PHP, Ruby, and Java. Community-maintained libraries exist for Go, .NET, and Rust.',
  },
  {
    q: 'How accurate is the AI content detection API?',
    a: 'Our detection models achieve over 98% accuracy on standard benchmarks for GPT-4, Claude 3, and Gemini 1.5. Accuracy is highest on texts of 150 words or more. Every response includes a confidence_score field so you can apply your own threshold for downstream decisions.',
  },
  {
    q: 'Can I process multiple texts at once with the batch endpoint?',
    a: 'Yes. POST /v1/batch accepts an array of up to 100 text items in a single request. Each item is analyzed independently and the response contains an array of results in the same order. Batch processing is available on Pro and Enterprise plans.',
  },
  {
    q: 'What does the API response contain?',
    a: 'The JSON response includes: ai_probability (0.0–1.0), human_probability, confidence_score, detected_model (the most likely AI source), and a sentence_analysis array with per-sentence scores. Enterprise responses may include additional metadata fields.',
  },
  {
    q: 'Do you offer enterprise support and custom SLAs?',
    a: 'Yes. Enterprise customers receive a dedicated account manager, custom rate limits, a negotiated SLA (up to 99.99% uptime), priority escalation channels, and optional on-premise or private-cloud deployment. Contact our sales team at sales@aidetector.cx to get started.',
  },
];

// ── JSON snippets ─────────────────────────────────────────────────────────────
const requestSnippet = `POST /v1/detect
Host: api.aidetector.cx
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "text": "Artificial intelligence has rapidly transformed
           the way organizations operate across every
           industry, enabling unprecedented levels of
           automation and efficiency.",
  "include_sentences": true
}`;

const responseSnippet = `{
  "success": true,
  "data": {
    "ai_probability": 0.92,
    "human_probability": 0.08,
    "confidence_score": 0.95,
    "detected_model": "ChatGPT",
    "sentence_analysis": [
      {
        "sentence": "Artificial intelligence has rapidly transformed...",
        "ai_probability": 0.89,
        "human_probability": 0.11
      },
      {
        "sentence": "...enabling unprecedented levels of automation...",
        "ai_probability": 0.96,
        "human_probability": 0.04
      }
    ]
  }
}`;

// ── SEO structured data ───────────────────────────────────────────────────────
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'AI Detector API by AIDetector.cx',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  description: 'REST API for detecting AI-generated content from ChatGPT, Gemini, Claude, DeepSeek, and more.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  url: 'https://aidetector.cx/api',
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aidetector.cx' },
    { '@type': 'ListItem', position: 2, name: 'API',  item: 'https://aidetector.cx/api' },
  ],
};

// ═════════════════════════════════════════════════════════════════════════════
// Page component
// ═════════════════════════════════════════════════════════════════════════════
export default function ApiPlatformPage() {
  const { user, profile } = useAuth();
  const plan = profile?.subscription_plan || 'free';
  const isAdmin = profile?.role === 'admin';
  const planLevels: Record<string, number> = { free: 0, pro: 1, business: 2, enterprise: 3 };
  const hasPro = isAdmin || planLevels[plan] >= 1;

  // Contextual CTA based on auth state
  const primaryCta = !user
    ? { label: 'Get Started Free', href: '/signup' }
    : !hasPro
    ? { label: 'Upgrade to Pro', href: '/pricing' }
    : { label: 'Manage API', href: '/api/dashboard' };

  return (
    <MainLayout>
      <PageMeta
        title="AI Detector API — Integrate AI Content Detection | AIDetector.cx"
        description="Integrate AI content detection into your application with AIDetector.cx REST API. Detect ChatGPT, Gemini, Claude, GPT-5.5, DeepSeek, Llama. Fast, secure, enterprise-ready."
        canonicalUrl="https://aidetector.cx/api"
        ogTitle="AI Detector API — Integrate AI Content Detection | AIDetector.cx"
        ogDescription="Fast, secure REST API for detecting AI-generated content. Supports ChatGPT, Gemini, Claude, DeepSeek, and more. Free tier available."
        schemas={[faqSchema, softwareSchema, breadcrumbSchema]}
      />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="bg-navy relative overflow-hidden py-20 md:py-28">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-40" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl opacity-30" />

        <div className="relative max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* left */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Badge className="bg-primary/20 text-primary hover:bg-primary/20 border-0 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                  Developer API
                </Badge>
                <Badge className="bg-warning/20 text-warning border-warning/30 px-3 py-1 text-xs font-semibold">
                  Pro Feature
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl xl:text-6xl font-extrabold text-white leading-tight mb-6">
                AI Detector API
              </h1>
              <p className="text-lg text-white/70 leading-relaxed max-w-xl mb-8 text-pretty">
                Integrate AI content detection into your application using a fast, secure REST API.
                Detect AI-generated text from <strong className="text-white/90">ChatGPT, Gemini, Claude, GPT-5.5, DeepSeek, Llama</strong>, and more.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="h-12 px-7 bg-primary text-primary-foreground font-semibold gap-2 shadow-lg" asChild>
                  <Link to={primaryCta.href}>{primaryCta.label} <ArrowRight className="w-4 h-4" /></Link>
                </Button>
                <Button size="lg" variant="ghost" className="h-12 px-7 border border-white/40 text-white hover:bg-white/10 font-semibold gap-2" asChild>
                  <Link to="/api/docs">View API Documentation <ChevronRight className="w-4 h-4" /></Link>
                </Button>
              </div>
              {/* trust row */}
              <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-white/50">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-success" /> No credit card for Free tier</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-success" /> Sub-200 ms latency</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-success" /> 99.9% uptime SLA</span>
              </div>
            </div>

            {/* right — request code block */}
            <div>
              <CodeBlock code={requestSnippet} lang="http" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-background" aria-labelledby="features-heading">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <Badge className="bg-primary/10 text-primary border-0 mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              Capabilities
            </Badge>
            <h2 id="features-heading" className="text-3xl md:text-4xl font-extrabold text-navy mb-4">
              AI Detection API Features
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              Everything you need to build robust AI content verification into your product—
              from quick integrations to enterprise-scale pipelines.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {features.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="border-border shadow-card hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-navy text-sm mb-1.5">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Supported Models ────────────────────────────────────────────── */}
      <section className="py-20 bg-secondary/30" aria-labelledby="models-heading">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <Badge className="bg-primary/10 text-primary border-0 mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              Model Support
            </Badge>
            <h2 id="models-heading" className="text-3xl md:text-4xl font-extrabold text-navy mb-4">
              Supported AI Models
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              Our AI Detection API accurately fingerprints content from the world's leading large language models.
              Support expands automatically as new models are released.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
            {models.map(({ name, color, abbr }) => (
              <Card key={name} className="border-border shadow-none hover:shadow-card transition-shadow text-center">
                <CardContent className="p-4 flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold text-sm ${color}`}>
                    {abbr}
                  </div>
                  <span className="text-xs font-semibold text-navy">{name}</span>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            + 40 additional models continuously monitored. New models added automatically.
          </p>
        </div>
      </section>

      {/* ── API Response Example ─────────────────────────────────────────── */}
      <section className="py-20 bg-background" aria-labelledby="response-heading">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-primary/10 text-primary border-0 mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                Response Format
              </Badge>
              <h2 id="response-heading" className="text-3xl md:text-4xl font-extrabold text-navy mb-5">
                API Response Example
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed text-pretty">
                Every AI Detection API response returns a structured JSON object with everything you need to
                make informed decisions about content authenticity — no extra calls required.
              </p>
              <ul className="space-y-3">
                {[
                  ['ai_probability',    'Overall likelihood the text was AI-generated (0.0–1.0)'],
                  ['human_probability', 'Complementary human-authorship score'],
                  ['confidence_score',  'Our model\'s confidence in the prediction'],
                  ['detected_model',    'Most likely source AI model (e.g., "ChatGPT")'],
                  ['sentence_analysis', 'Per-sentence AI vs. human breakdown array'],
                ].map(([field, desc]) => (
                  <li key={field} className="flex items-start gap-3">
                    <code className="shrink-0 bg-muted rounded px-2 py-0.5 text-xs font-mono text-primary">{field}</code>
                    <span className="text-sm text-muted-foreground">{desc}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <CodeBlock code={responseSnippet} lang="json" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Use Cases ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-secondary/30" aria-labelledby="usecases-heading">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <Badge className="bg-primary/10 text-primary border-0 mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              Use Cases
            </Badge>
            <h2 id="usecases-heading" className="text-3xl md:text-4xl font-extrabold text-navy mb-4">
              Who Uses the AI Content Detection API?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              From academic institutions to global enterprises, teams trust our ChatGPT Detection API
              to protect content integrity at every scale.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="border-border shadow-card hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-navy mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-background" aria-labelledby="pricing-heading">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <Badge className="bg-primary/10 text-primary border-0 mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              Pricing
            </Badge>
            <h2 id="pricing-heading" className="text-3xl md:text-4xl font-extrabold text-navy mb-4">
              API Pricing Plans
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Start for free and scale as your usage grows. No hidden fees, no surprise overages.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={`border flex flex-col ${plan.highlight ? 'border-primary ring-2 ring-primary/20 shadow-lg' : 'border-border shadow-card'}`}
              >
                <CardHeader className="pb-2 pt-6 px-6">
                  <div className="flex items-center justify-between mb-1">
                    <CardTitle className="text-lg font-bold text-navy">{plan.name}</CardTitle>
                    {plan.badge && (
                      <Badge className="bg-primary text-primary-foreground border-0 text-xs">{plan.badge}</Badge>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-extrabold text-navy">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 text-pretty">{plan.desc}</p>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 px-6 pb-6 pt-4">
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full h-11 font-semibold mt-auto ${plan.highlight ? 'bg-primary text-primary-foreground' : ''}`}
                    variant={plan.highlight ? 'default' : 'outline'}
                    asChild
                  >
                    <Link to={plan.href}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Documentation Preview ────────────────────────────────────────── */}
      <section id="docs" className="py-20 bg-secondary/30" aria-labelledby="docs-heading">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <Badge className="bg-primary/10 text-primary border-0 mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              Documentation
            </Badge>
            <h2 id="docs-heading" className="text-3xl md:text-4xl font-extrabold text-navy mb-4">
              API Documentation
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              Comprehensive reference docs, quick-start guides, and official SDKs to help you
              integrate the AI Checker API in minutes.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {docTopics.map(({ icon: Icon, title, desc, href }) => (
              <Card key={title} className="border-border shadow-card hover:shadow-md transition-all group cursor-pointer">
                <CardContent className="p-5 flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <Link to={href} className="font-semibold text-navy text-sm mb-1 flex items-center gap-1 hover:text-primary transition-colors">
                      {title} <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                    <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center">
            <Button size="lg" className="h-12 px-8 bg-primary text-primary-foreground font-semibold gap-2" asChild>
              <Link to="/api/docs">
                <BookOpen className="w-4 h-4" /> View Full Documentation
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Pro Access Gate Section ──────────────────────────────────── */}
      <section className="py-20 bg-background" aria-labelledby="access-heading">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <Badge className="bg-warning/10 text-warning border-warning/30 mb-4 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            Pro Feature
          </Badge>
          <h2 id="access-heading" className="text-3xl md:text-4xl font-extrabold text-navy mb-4">
            API Access is a Pro Exclusive
          </h2>
          <p className="text-muted-foreground text-lg mb-10 leading-relaxed text-pretty">
            Generate API keys, access all detection endpoints, and monitor your usage — 
            all available exclusively on the <strong className="text-navy">Pro plan</strong> and above.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {[
              { label: 'Guest', icon: Users,     cta: 'Sign Up',       href: '/signup',   note: 'Create a free account to get started.',      variant: 'outline' as const },
              { label: 'Free',  icon: Lock,      cta: 'Upgrade to Pro',href: '/pricing',  note: 'Upgrade your plan to unlock API access.',     variant: 'default' as const },
              { label: 'Pro',   icon: KeyRound,  cta: 'Manage API',    href: '/api/dashboard', note: 'Full API access, dashboard, and keys.',  variant: 'default' as const },
            ].map(({ label, icon: Icon, cta, href, note, variant }) => (
              <Card key={label} className={`border text-center ${label === 'Pro' ? 'border-primary ring-2 ring-primary/20 shadow-lg' : 'border-border shadow-card'}`}>
                <CardContent className="p-6 flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${label === 'Pro' ? 'bg-primary/10' : 'bg-muted'}`}>
                    <Icon className={`w-5 h-5 ${label === 'Pro' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <p className="font-bold text-navy">{label} Plan</p>
                  <p className="text-xs text-muted-foreground text-pretty">{note}</p>
                  <Button className={`w-full mt-1 font-semibold ${label === 'Pro' ? 'bg-primary text-primary-foreground' : ''}`} variant={variant} asChild>
                    <Link to={href}>{cta} <ArrowRight className="w-4 h-4 ml-1" /></Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {hasPro && (
            <div className="bg-success/5 border border-success/20 rounded-xl p-4 text-sm text-success flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              You have Pro access. <Link to="/api/dashboard" className="font-semibold underline hover:text-success/80 ml-1">Open API Dashboard →</Link>
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-background" aria-labelledby="faq-heading">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <Badge className="bg-primary/10 text-primary border-0 mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              FAQ
            </Badge>
            <h2 id="faq-heading" className="text-3xl md:text-4xl font-extrabold text-navy mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-pretty">
              Everything you need to know about the AIDetector.cx AI Detector API.
            </p>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-5 shadow-none">
                <AccordionTrigger className="text-sm font-semibold text-navy hover:no-underline text-left py-4">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4 text-pretty">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-navy relative overflow-hidden" aria-labelledby="cta-heading">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-30" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 md:px-6 text-center">
          <h2 id="cta-heading" className="text-3xl md:text-4xl font-extrabold text-white mb-5">
            Ready to integrate AI detection?
          </h2>
          <p className="text-white/70 text-lg mb-8 leading-relaxed text-pretty">
            Join thousands of developers, universities, publishers, and enterprises
            already using the AIDetector.cx AI Detection API to protect content integrity.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8 bg-primary text-primary-foreground font-semibold gap-2 shadow-lg" asChild>
              <Link to={primaryCta.href}>{primaryCta.label} <ArrowRight className="w-4 h-4" /></Link>
            </Button>
            <Button size="lg" variant="ghost" className="h-12 px-8 border border-white/40 text-white hover:bg-white/10 font-semibold gap-2" asChild>
              <Link to="/api/docs">View Documentation <ChevronRight className="w-4 h-4" /></Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-white/40">
            Free tier available — no credit card required.{' '}
            <Link to="/pricing" className="text-white/60 hover:text-white underline transition-colors">View all pricing plans</Link>.
          </p>
        </div>
      </section>
    </MainLayout>
  );
}
