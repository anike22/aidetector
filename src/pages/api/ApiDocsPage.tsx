import { useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Copy, Check, ArrowRight, BookOpen, KeyRound, Zap, AlertCircle,
  Code2, Terminal, Activity, Layers, ChevronRight
} from 'lucide-react';

// ── Copy code block ───────────────────────────────────────────────────────────
function CodeBlock({ code, lang = 'bash', preview = false }: { code: string; lang?: string; preview?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-xl overflow-hidden border border-border my-4">
      <div className="flex items-center justify-between bg-muted/60 px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{lang}</span>
          {preview && (
            <Badge className="bg-warning/10 text-warning border-warning/30 text-[10px] px-1.5 py-0">
              Documentation Preview
            </Badge>
          )}
        </div>
        <button
          onClick={copy}
          aria-label="Copy code"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <><Check className="w-3.5 h-3.5 text-success" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
        </button>
      </div>
      <pre className="bg-[hsl(var(--navy)/0.96)] text-emerald-300 p-5 overflow-x-auto text-sm font-mono leading-relaxed whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ── Inline code ───────────────────────────────────────────────────────────────
function IC({ children }: { children: React.ReactNode }) {
  return <code className="bg-muted rounded px-1.5 py-0.5 text-xs font-mono text-primary">{children}</code>;
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-bold text-navy mt-12 mb-4 scroll-mt-24 flex items-center gap-2 group">
      {children}
      <a href={`#${id}`} className="opacity-0 group-hover:opacity-40 transition-opacity text-muted-foreground text-base">#</a>
    </h2>
  );
}

// ── Sidebar nav ───────────────────────────────────────────────────────────────
const navSections = [
  { id: 'introduction',   label: 'Introduction' },
  { id: 'quickstart',     label: 'Quick Start' },
  { id: 'authentication', label: 'Authentication' },
  { id: 'generate-key',   label: 'Generate API Key' },
  { id: 'detect',         label: 'Detect Endpoint' },
  { id: 'request-body',   label: 'Request Body' },
  { id: 'response-schema','label': 'Response Schema' },
  { id: 'sentence',       label: 'Sentence Analysis' },
  { id: 'batch',          label: 'Batch Requests' },
  { id: 'errors',         label: 'Error Codes' },
  { id: 'rate-limits',    label: 'Rate Limits' },
  { id: 'usage',          label: 'Usage & Quotas' },
  { id: 'sdks',           label: 'SDKs' },
  { id: 'faq',            label: 'FAQ' },
];

// ── Code snippets ─────────────────────────────────────────────────────────────
const curlDetect = `curl -X POST https://api.aidetector.cx/v1/detect \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Your content to analyze here...",
    "include_sentences": true
  }'`;

const jsDetect = `const response = await fetch('https://api.aidetector.cx/v1/detect', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'Your content to analyze here...',
    include_sentences: true,
  }),
});

const data = await response.json();
console.log(data.data.ai_probability); // e.g. 0.92`;

const pyDetect = `import requests

response = requests.post(
    'https://api.aidetector.cx/v1/detect',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json',
    },
    json={
        'text': 'Your content to analyze here...',
        'include_sentences': True,
    }
)

data = response.json()
print(data['data']['ai_probability'])  # e.g. 0.92`;

const responseExample = `{
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
      }
    ]
  }
}`;

const curlBatch = `curl -X POST https://api.aidetector.cx/v1/batch \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "items": [
      { "id": "doc-1", "text": "First text to analyze..." },
      { "id": "doc-2", "text": "Second text to analyze..." }
    ]
  }'`;

const jsBatch = `const response = await fetch('https://api.aidetector.cx/v1/batch', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    items: [
      { id: 'doc-1', text: 'First text to analyze...' },
      { id: 'doc-2', text: 'Second text to analyze...' },
    ],
  }),
});`;

const errorExample = `{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "You have exceeded your monthly request quota.",
    "retry_after": 86400
  }
}`;

const faqItems = [
  {
    q: 'What is the minimum text length for detection?',
    a: 'The /v1/detect endpoint requires a minimum of 50 words for accurate results. Shorter texts return lower confidence scores. For best accuracy, use 150+ words.',
  },
  {
    q: 'Are API keys scoped to a user or a project?',
    a: 'API keys are scoped to your user account. All keys share your monthly quota. We recommend creating separate named keys per integration so you can track or revoke them independently.',
  },
  {
    q: 'Does the API support languages other than English?',
    a: 'Yes. The detection engine supports 30+ languages. Pass your text as-is — language detection is automatic. Accuracy is highest for English and decreases slightly for lower-resource languages.',
  },
  {
    q: 'What happens when I exceed my rate limit?',
    a: 'The API returns HTTP 429 with a RATE_LIMIT_EXCEEDED error and a retry_after value in seconds. Use the X-RateLimit-Remaining header to monitor remaining quota proactively.',
  },
  {
    q: 'Can I test the API without a Pro subscription?',
    a: 'Yes. The Free tier includes 100 requests/month. Sign up, generate an API key from /api/dashboard, and start making calls immediately. No credit card required.',
  },
];

// ── Structured data ───────────────────────────────────────────────────────────
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aidetector.cx' },
    { '@type': 'ListItem', position: 2, name: 'API', item: 'https://aidetector.cx/api' },
    { '@type': 'ListItem', position: 3, name: 'Documentation', item: 'https://aidetector.cx/api/docs' },
  ],
};

// ═════════════════════════════════════════════════════════════════════════════
export default function ApiDocsPage() {
  const [activeSection, setActiveSection] = useState('introduction');

  return (
    <MainLayout>
      <PageMeta
        title="API Documentation — AI Detector API Reference | AIDetector.cx"
        description="Complete developer documentation for the AIDetector.cx AI Detection API. Includes authentication, endpoints, request/response schemas, error codes, SDKs, and code examples in cURL, JavaScript, and Python."
        canonicalUrl="https://aidetector.cx/api/docs"
        schemas={[faqSchema, breadcrumbSchema]}
      />

      {/* Sub-header */}
      <div className="bg-navy border-b border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
              <Link to="/api" className="hover:text-white transition-colors">API</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white/80">Documentation</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">API Reference</h1>
            <p className="text-white/60 text-sm mt-1">Base URL: <IC>https://api.aidetector.cx/v1</IC></p>
          </div>
          <div className="flex gap-3">
            <Button size="sm" className="bg-primary text-primary-foreground font-semibold" asChild>
              <Link to="/api/dashboard"><KeyRound className="w-4 h-4 mr-1.5" /> Get API Key</Link>
            </Button>
            <Button size="sm" variant="ghost" className="border border-white/30 text-white hover:bg-white/10" asChild>
              <Link to="/api">← Back to API</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-1">
              {navSections.map(({ id, label }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={() => setActiveSection(id)}
                  className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                    activeSection === id
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:text-navy hover:bg-muted/50'
                  }`}
                >
                  {label}
                </a>
              ))}
              <div className="pt-4 border-t border-border mt-4">
                <Button size="sm" className="w-full bg-primary text-primary-foreground font-semibold" asChild>
                  <Link to="/api/dashboard"><KeyRound className="w-3.5 h-3.5 mr-1.5" /> API Dashboard</Link>
                </Button>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="lg:col-span-3 min-w-0">

            {/* ── Introduction */}
            <SectionHeading id="introduction"><BookOpen className="w-5 h-5 text-primary" /> Introduction</SectionHeading>
            <p className="text-muted-foreground leading-relaxed text-pretty">
              The AIDetector.cx REST API lets you integrate AI content detection directly into your application.
              Send text over HTTPS and receive a structured JSON response with AI probability scores, sentence-level
              analysis, model fingerprinting, and confidence metrics.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3 text-pretty">
              All endpoints use HTTPS. Request and response bodies are JSON.
              The base URL for all v1 endpoints is <IC>https://api.aidetector.cx/v1</IC>.
            </p>
            <Card className="border-primary/20 bg-primary/5 mt-4">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground text-pretty">
                  <strong className="text-navy">Documentation Preview.</strong> API endpoints are shown here as technical reference.
                  Endpoints marked <Badge className="bg-warning/10 text-warning border-warning/30 text-[10px] px-1 py-0">Documentation Preview</Badge> are
                  part of the planned API surface. Active Pro endpoints are available from your <Link to="/api/dashboard" className="text-primary underline">dashboard</Link>.
                </p>
              </CardContent>
            </Card>

            {/* ── Quick Start */}
            <SectionHeading id="quickstart"><Zap className="w-5 h-5 text-primary" /> Quick Start</SectionHeading>
            <p className="text-muted-foreground leading-relaxed mb-2 text-pretty">
              Make your first detection call in under 5 minutes:
            </p>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside mb-3">
              <li>Sign up or log in at <Link to="/signup" className="text-primary hover:underline">aidetector.cx/signup</Link></li>
              <li>Go to your <Link to="/api/dashboard" className="text-primary hover:underline">API Dashboard</Link> and generate a key</li>
              <li>Replace <IC>YOUR_API_KEY</IC> in the examples below and send your first request</li>
            </ol>
            <p className="text-sm font-semibold text-navy mb-1">cURL</p>
            <CodeBlock code={curlDetect} lang="bash" preview />
            <p className="text-sm font-semibold text-navy mb-1">JavaScript</p>
            <CodeBlock code={jsDetect} lang="javascript" preview />
            <p className="text-sm font-semibold text-navy mb-1">Python</p>
            <CodeBlock code={pyDetect} lang="python" preview />

            {/* ── Authentication */}
            <SectionHeading id="authentication"><KeyRound className="w-5 h-5 text-primary" /> Authentication</SectionHeading>
            <p className="text-muted-foreground leading-relaxed text-pretty">
              All requests must include your API key in the <IC>Authorization</IC> header as a Bearer token:
            </p>
            <CodeBlock code={`Authorization: Bearer YOUR_API_KEY`} lang="http" />
            <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
              Requests without a valid key return <IC>401 Unauthorized</IC>. Keys are tied to your account and plan quota.
              Never expose API keys in client-side code — always route through a backend or serverless function.
            </p>

            {/* ── Generate API Key */}
            <SectionHeading id="generate-key"><Terminal className="w-5 h-5 text-primary" /> Generate API Key</SectionHeading>
            <p className="text-muted-foreground leading-relaxed text-pretty">
              API keys are managed from your <Link to="/api/dashboard" className="text-primary hover:underline">API Dashboard</Link>.
              You can create multiple named keys per integration, copy them once at creation, and revoke any key at any time.
            </p>
            <p className="text-muted-foreground text-sm mt-2 leading-relaxed text-pretty">
              API access requires a <strong className="text-navy">Pro plan</strong> or higher. Free accounts can create keys
              limited to 100 requests/month.
            </p>
            <Button className="mt-3 bg-primary text-primary-foreground font-semibold gap-2" asChild>
              <Link to="/api/dashboard"><KeyRound className="w-4 h-4" /> Open API Dashboard <ArrowRight className="w-4 h-4" /></Link>
            </Button>

            {/* ── Detect Endpoint */}
            <SectionHeading id="detect"><Activity className="w-5 h-5 text-primary" /> POST /v1/detect</SectionHeading>
            <p className="text-muted-foreground leading-relaxed text-pretty">
              Analyzes a single text for AI generation. Returns probability scores, model fingerprint, and optional sentence-level breakdown.
            </p>
            <div className="my-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-semibold text-navy whitespace-nowrap">Property</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-navy whitespace-nowrap">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ['Method',       'POST'],
                    ['URL',          'https://api.aidetector.cx/v1/detect'],
                    ['Content-Type', 'application/json'],
                    ['Auth',         'Bearer token (required)'],
                  ].map(([k, v]) => (
                    <tr key={k} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 text-muted-foreground font-medium whitespace-nowrap">{k}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-navy whitespace-nowrap">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Request Body */}
            <SectionHeading id="request-body"><Code2 className="w-5 h-5 text-primary" /> Request Body</SectionHeading>
            <div className="overflow-x-auto rounded-xl border border-border my-4">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {['Field', 'Type', 'Required', 'Description'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 font-semibold text-navy whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ['text',              'string',  'Yes', 'The text content to analyze. Min 50 words.'],
                    ['include_sentences', 'boolean', 'No',  'Return per-sentence scores. Default: false.'],
                    ['language',          'string',  'No',  'ISO 639-1 code. Default: auto-detected.'],
                  ].map(([f, t, r, d]) => (
                    <tr key={f} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-mono text-xs text-primary whitespace-nowrap">{f}</td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{t}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <Badge variant={r === 'Yes' ? 'default' : 'secondary'} className={`text-[10px] ${r === 'Yes' ? 'bg-primary/10 text-primary border-0' : ''}`}>{r}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Response Schema */}
            <SectionHeading id="response-schema"><Code2 className="w-5 h-5 text-primary" /> Response Schema</SectionHeading>
            <p className="text-muted-foreground text-sm mb-2 text-pretty">Successful responses return HTTP 200 with the following structure:</p>
            <CodeBlock code={responseExample} lang="json" />
            <div className="overflow-x-auto rounded-xl border border-border my-4">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {['Field', 'Type', 'Description'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 font-semibold text-navy whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ['ai_probability',    'float',  'Probability the text is AI-generated. Range 0.0–1.0.'],
                    ['human_probability', 'float',  'Complement of ai_probability. Range 0.0–1.0.'],
                    ['confidence_score',  'float',  'Model confidence in the prediction. Range 0.0–1.0.'],
                    ['detected_model',    'string', 'Most likely source AI model (e.g., "ChatGPT").'],
                    ['sentence_analysis', 'array',  'Per-sentence scores. Only present when include_sentences=true.'],
                  ].map(([f, t, d]) => (
                    <tr key={f} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-mono text-xs text-primary whitespace-nowrap">{f}</td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{t}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Sentence Analysis */}
            <SectionHeading id="sentence"><Layers className="w-5 h-5 text-primary" /> Sentence Analysis</SectionHeading>
            <p className="text-muted-foreground text-sm leading-relaxed text-pretty mb-2">
              When <IC>include_sentences: true</IC> is set, the response includes a <IC>sentence_analysis</IC> array.
              Each element contains:
            </p>
            <CodeBlock code={`{
  "sentence": "The sentence text...",
  "ai_probability": 0.89,
  "human_probability": 0.11
}`} lang="json" />

            {/* ── Batch */}
            <SectionHeading id="batch"><Layers className="w-5 h-5 text-primary" /> POST /v1/batch</SectionHeading>
            <p className="text-muted-foreground text-sm leading-relaxed text-pretty mb-2">
              Analyze up to 100 texts in a single request. Each item is processed independently. Available on Pro and Enterprise plans.
            </p>
            <p className="text-sm font-semibold text-navy mb-1">cURL</p>
            <CodeBlock code={curlBatch} lang="bash" preview />
            <p className="text-sm font-semibold text-navy mb-1">JavaScript</p>
            <CodeBlock code={jsBatch} lang="javascript" preview />

            {/* ── Error Codes */}
            <SectionHeading id="errors"><AlertCircle className="w-5 h-5 text-primary" /> Error Codes</SectionHeading>
            <p className="text-muted-foreground text-sm mb-3 text-pretty">
              Errors are returned as HTTP 4xx/5xx with a JSON body:
            </p>
            <CodeBlock code={errorExample} lang="json" />
            <div className="overflow-x-auto rounded-xl border border-border my-4">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {['HTTP', 'Code', 'Description'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 font-semibold text-navy whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ['401', 'UNAUTHORIZED',          'Missing or invalid API key.'],
                    ['403', 'FORBIDDEN',              'Your plan does not have access to this endpoint.'],
                    ['422', 'VALIDATION_ERROR',       'Request body failed validation (e.g., text too short).'],
                    ['429', 'RATE_LIMIT_EXCEEDED',    'Monthly quota exhausted. Retry after reset.'],
                    ['500', 'INTERNAL_ERROR',         'Server-side error. Retry with exponential backoff.'],
                    ['503', 'SERVICE_UNAVAILABLE',    'Temporary outage. Check status page.'],
                  ].map(([h, c, d]) => (
                    <tr key={c} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-mono text-xs text-navy whitespace-nowrap">{h}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-primary whitespace-nowrap">{c}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Rate Limits */}
            <SectionHeading id="rate-limits"><Zap className="w-5 h-5 text-primary" /> Rate Limits</SectionHeading>
            <p className="text-muted-foreground text-sm leading-relaxed mb-3 text-pretty">
              Rate limit information is returned in response headers on every request:
            </p>
            <CodeBlock code={`X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9843
X-RateLimit-Reset: 1748736000`} lang="http" />
            <div className="overflow-x-auto rounded-xl border border-border my-4">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {['Plan', 'Requests/Month', 'Batch Size', 'Concurrent'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 font-semibold text-navy whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ['Free',       '100',       '—',       '1'],
                    ['Pro',        '10,000',    '50',      '10'],
                    ['Enterprise', 'Custom',    '100',     'Custom'],
                  ].map(([p, r, b, c]) => (
                    <tr key={p} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-semibold text-navy whitespace-nowrap">{p}</td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{r}</td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{b}</td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Usage */}
            <SectionHeading id="usage"><Activity className="w-5 h-5 text-primary" /> Usage & Quotas</SectionHeading>
            <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
              Quotas reset on the first day of each calendar month (UTC). Each call to <IC>/v1/detect</IC> consumes one
              request regardless of text length. Batch requests consume one request per item in the array.
              Monitor your real-time usage in your <Link to="/api/dashboard" className="text-primary hover:underline">API Dashboard</Link>.
            </p>

            {/* ── SDKs */}
            <SectionHeading id="sdks"><Code2 className="w-5 h-5 text-primary" /> SDKs</SectionHeading>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4 text-pretty">
              Official SDKs are in active development. In the meantime, the REST API works directly from any HTTP client.
              Community libraries are available for Python, JavaScript, PHP, and Go — check our GitHub organisation once launched.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['Python', 'JavaScript / TS', 'PHP', 'Ruby', 'Java', 'Go'].map(lang => (
                <Card key={lang} className="border-border shadow-none">
                  <CardContent className="p-3 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                      <Code2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium text-navy">{lang}</span>
                    <Badge className="ml-auto bg-muted text-muted-foreground border-0 text-[10px]">Coming</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* ── FAQ */}
            <SectionHeading id="faq"><BookOpen className="w-5 h-5 text-primary" /> FAQ</SectionHeading>
            <Accordion type="single" collapsible className="space-y-2">
              {faqItems.map(({ q, a }, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4 shadow-none">
                  <AccordionTrigger className="text-sm font-semibold text-navy hover:no-underline text-left py-3.5">
                    {q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4 text-pretty">
                    {a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

          </div>
        </div>
      </div>
    </MainLayout>
  );
}
