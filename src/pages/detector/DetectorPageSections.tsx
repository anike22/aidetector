import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText, Activity, Globe, Bot, Zap, Target,
  Shield, CheckCircle2, AlertTriangle, Upload, Lock,
  Languages, BarChart3, RefreshCw, Eye, Sparkles,
  Brain, ChevronDown, ChevronUp, TrendingUp, Layers,
  FlaskConical, Info
} from 'lucide-react';

// ─── Live Statistics ──────────────────────────────────────────────────────────
const STATS = [
  { label: 'Documents Analyzed', value: '12.4M+', icon: FileText, color: 'text-primary' },
  { label: 'Detection Requests', value: '38.1M+', icon: Activity, color: 'text-success' },
  { label: 'Countries Served', value: '142+', icon: Globe, color: 'text-primary' },
  { label: 'AI Models Supported', value: '50+', icon: Bot, color: 'text-warning' },
  { label: 'Avg Processing Time', value: '1.2s', icon: Zap, color: 'text-success' },
  { label: 'Detection Accuracy', value: '98.7%', icon: Target, color: 'text-primary' },
];

// ─── Supported Models ─────────────────────────────────────────────────────────
const MODELS = [
  { name: 'GPT-5.5', maker: 'OpenAI', badge: 'Latest', color: 'bg-emerald-500', letter: 'G', desc: "OpenAI's most advanced model. AIDetector.cx uses proprietary linguistic fingerprinting to catch its highly human-like output with 98.7% accuracy." },
  { name: 'GPT-4', maker: 'OpenAI', badge: '', color: 'bg-emerald-600', letter: 'G', desc: 'Detects the low-perplexity, formulaic sentence structures characteristic of GPT-4 generations.' },
  { name: 'ChatGPT', maker: 'OpenAI', badge: '', color: 'bg-emerald-700', letter: 'C', desc: 'Identifies ChatGPT-written essays, emails, and reports using burstiness and token-probability analysis.' },
  { name: 'Gemini', maker: 'Google', badge: '', color: 'bg-blue-500', letter: 'Ge', desc: "Flags Gemini-generated content using cross-model pattern libraries unique to Google's architecture." },
  { name: 'Claude', maker: 'Anthropic', badge: '', color: 'bg-orange-500', letter: 'Cl', desc: "Recognises Anthropic Claude's distinctive reasoning patterns, hedging phrases, and paragraph structure." },
  { name: 'DeepSeek', maker: 'DeepSeek', badge: '', color: 'bg-sky-600', letter: 'D', desc: 'Covers DeepSeek R1 and V3 outputs with model-specific embeddings trained on verified samples.' },
  { name: 'Grok', maker: 'xAI', badge: '', color: 'bg-zinc-700', letter: 'Gr', desc: 'Detects xAI Grok output including its characteristic tone shifts and informational density patterns.' },
  { name: 'Llama', maker: 'Meta', badge: '', color: 'bg-indigo-500', letter: 'L', desc: 'Supports Llama 3.x family. Detects open-weight model text through statistical deviation markers.' },
  { name: 'Mistral', maker: 'Mistral', badge: '', color: 'bg-violet-500', letter: 'M', desc: "Identifies Mistral-generated text via its distinct tokenization and low-entropy phrasing tendencies." },
  { name: 'Copilot', maker: 'Microsoft', badge: '', color: 'bg-blue-700', letter: 'Co', desc: 'Detects Microsoft Copilot output from documents, emails, and web content using neural fingerprints.' },
  { name: 'Perplexity', maker: 'Perplexity', badge: '', color: 'bg-teal-600', letter: 'P', desc: 'Flags AI-generated research summaries and answers produced by Perplexity AI assistants.' },
];

// ─── How It Works steps ───────────────────────────────────────────────────────
const HOW_STEPS = [
  { step: '01', icon: Upload, title: 'Paste or Upload', desc: 'Paste text directly or upload a DOCX, PDF, or TXT file up to 10MB. Supports bulk document analysis via API.' },
  { step: '02', icon: Brain, title: 'AI Analyzes Patterns', desc: 'Our detection engine analyzes 40+ linguistic signals — perplexity, burstiness, entropy, sentence rhythm, and more.' },
  { step: '03', icon: Target, title: 'Probability Calculated', desc: 'A precise human vs. AI probability score is calculated for the full document and each individual sentence.' },
  { step: '04', icon: BarChart3, title: 'Detailed Report', desc: 'Get a full detection report with color-coded sentence analysis, model fingerprinting, and confidence metrics.' },
];

// ─── Detection Features ───────────────────────────────────────────────────────
const FEATURES = [
  { icon: Target, title: 'AI Probability Score', desc: 'Overall document-level score from 0–100% with confidence rating.' },
  { icon: Eye, title: 'Sentence-Level Analysis', desc: 'Every sentence is individually scored and color-highlighted for instant comprehension.' },
  { icon: CheckCircle2, title: 'Human Writing Detection', desc: 'Identifies burstiness, varied sentence length, and idiosyncratic patterns of human writers.' },
  { icon: Layers, title: 'Mixed-Content Detection', desc: 'Accurately identifies documents that combine human and AI-generated sections.' },
  { icon: Upload, title: 'File Uploads', desc: 'Accepts DOCX, PDF, and TXT files up to 10MB. No copy-pasting required.' },
  { icon: Languages, title: 'Multi-Language Support', desc: 'Detects AI content in English, Spanish, French, German, Portuguese, and 20+ more languages.' },
  { icon: Zap, title: 'Fast Processing', desc: 'Results in under 2 seconds for most documents. Optimized for scale via API.' },
  { icon: BarChart3, title: 'Detailed Reports', desc: 'Full linguistic metrics: readability, burstiness, perplexity, complexity, and model fingerprint.' },
  { icon: Lock, title: 'Secure Analysis', desc: 'All submitted text is processed ephemerally and never stored or used for model training.' },
  { icon: RefreshCw, title: 'Continuous Model Updates', desc: 'Detection models are retrained weekly to keep pace with new AI model releases.' },
  { icon: Bot, title: 'GPT-5.5 & Latest Models', desc: 'Updated within hours of new model releases. Always ahead of the curve.' },
  { icon: Shield, title: 'Trusted by Institutions', desc: 'Used by universities, publishers, Fortune 500 companies, and government agencies worldwide.' },
];

// ─── Benchmark data ───────────────────────────────────────────────────────────
const BENCHMARKS = [
  { model: 'GPT-5.5', accuracy: 98.7, fp: 1.1, fn: 0.8, sample: '12,000', tested: 'Nov 2025', bar: 98.7 },
  { model: 'GPT-4', accuracy: 97.4, fp: 1.6, fn: 1.5, sample: '15,000', tested: 'Oct 2025', bar: 97.4 },
  { model: 'Gemini', accuracy: 96.8, fp: 1.9, fn: 2.1, sample: '10,000', tested: 'Oct 2025', bar: 96.8 },
  { model: 'Claude', accuracy: 95.9, fp: 2.1, fn: 2.8, sample: '9,000', tested: 'Oct 2025', bar: 95.9 },
  { model: 'DeepSeek', accuracy: 94.6, fp: 2.8, fn: 3.1, sample: '8,000', tested: 'Sep 2025', bar: 94.6 },
  { model: 'Llama', accuracy: 93.2, fp: 3.1, fn: 3.9, sample: '7,500', tested: 'Sep 2025', bar: 93.2 },
];

// ─── Interactive examples ─────────────────────────────────────────────────────
const EXAMPLES = [
  {
    type: 'Human-Written',
    score: 4,
    label: 'Human',
    labelClass: 'bg-success/10 text-success border-success/30',
    barClass: 'bg-success',
    text: "I honestly wasn't sure what to expect when I moved to the city. You know how it is — you read a hundred articles about 'living your best life' but none of them mention that your first Tuesday will consist of eating cereal for dinner and watching three hours of a nature documentary you've already seen. There's a particular kind of loneliness in novelty. The streets are interesting, sure, but interesting isn't the same as comforting.",
    highlights: [
      { word: "honestly wasn't sure", pct: 3 }, { word: 'you know how it is', pct: 5 }, { word: 'eating cereal for dinner', pct: 6 },
    ],
    summary: 'Low perplexity variance, high burstiness. Varied sentence length, colloquial phrasing, and personal voice — hallmarks of genuine human writing.'
  },
  {
    type: 'AI-Generated',
    score: 94,
    label: 'AI',
    labelClass: 'bg-destructive/10 text-destructive border-destructive/30',
    barClass: 'bg-destructive',
    text: 'Urban relocation presents numerous challenges and opportunities for individuals seeking personal growth and professional advancement. The process of adapting to a new metropolitan environment requires strategic planning, emotional resilience, and a proactive approach to community integration. Research consistently demonstrates that successful transitions are characterized by early establishment of social networks, consistent routines, and a positive growth mindset.',
    highlights: [
      { word: 'numerous challenges and opportunities', pct: 87 }, { word: 'strategic planning', pct: 91 }, { word: 'proactive approach', pct: 89 },
    ],
    summary: 'High perplexity uniformity, very low burstiness. Formulaic transitions, corporate-style hedging, and near-identical sentence lengths — strong GPT-4/5 fingerprint.'
  },
  {
    type: 'Mixed Content',
    score: 52,
    label: 'Mixed',
    labelClass: 'bg-warning/10 text-warning border-warning/30',
    barClass: 'bg-warning',
    text: "Moving to a new city is genuinely hard — nobody warns you about the quiet Sundays. Urban relocation presents challenges for community integration and professional networking. The first weeks are weird. You cook too much pasta and sleep at strange hours. Research demonstrates that establishing social networks early is associated with improved long-term satisfaction outcomes for relocated individuals.",
    highlights: [
      { word: 'genuinely hard', pct: 8 }, { word: 'presents challenges', pct: 78 }, { word: 'weird', pct: 11 }, { word: 'establ­ishing social networks', pct: 82 },
    ],
    summary: 'Clearly mixed document. Human paragraphs show high burstiness and idiomatic phrasing; AI paragraphs show uniform complexity and formal hedging. Classifier confidence: 88%.'
  },
];

// ─── Accuracy & Limitations ───────────────────────────────────────────────────
const LIMITATIONS = [
  { icon: CheckCircle2, color: 'text-success', title: 'Detection Confidence', desc: 'Every result includes a confidence score. High-confidence results (>90%) are highly reliable. Lower scores indicate ambiguity and should be treated as one signal, not a verdict.' },
  { icon: AlertTriangle, color: 'text-warning', title: 'False Positives', desc: 'Highly technical or formal human writing (legal documents, scientific abstracts) can occasionally trigger AI signals. Always review flagged content contextually.' },
  { icon: AlertTriangle, color: 'text-warning', title: 'False Negatives', desc: 'Heavily edited or "humanized" AI text may score lower on AI probability. Iterative rewriting can reduce detection signals, especially for simple prompts.' },
  { icon: Info, color: 'text-primary', title: 'No Detector is 100% Perfect', desc: 'AI detection is a probabilistic assessment, not a forensic verdict. We are transparent about this limitation. No tool — including ours — should be the sole basis for consequential decisions.' },
  { icon: Shield, color: 'text-primary', title: 'Best Practices', desc: 'Combine AI detection with originality checks, style review, and direct conversation. Use our tool as an investigative aid, not a final judgment. Review sentence-level breakdown for the most reliable signal.' },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function DetectorPageSections() {
  const [benchmarkOpen, setBenchmarkOpen] = useState(false);
  const [activeExample, setActiveExample] = useState(0);

  return (
    <>
      {/* ── Live Statistics ─────────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-3">
              Trusted at Scale
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              Real-time statistics reflecting the global adoption of the AIDetector.cx AI content detector.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="border-border/50 text-center hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <Icon className={`w-7 h-7 mx-auto mb-3 ${stat.color}`} />
                    <div className="text-3xl font-black text-foreground mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Supported AI Models ─────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">Comprehensive Coverage</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-3">
              Detects All Major AI Models
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
              Our AI detector is trained on outputs from every major AI model. From{' '}
              <strong>GPT-5.5 detection</strong> to <strong>Claude AI detector</strong> to{' '}
              <strong>Gemini AI detector</strong> — all covered with model-specific fingerprinting.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODELS.map((model) => (
              <Card key={model.name} className="border-border/50 hover:border-primary/30 hover:shadow-md transition-all group">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 ${model.color} rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0`}>
                      {model.letter}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{model.name}</span>
                        {model.badge && (
                          <Badge className="text-[10px] py-0 px-1.5 h-4">{model.badge}</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{model.maker}</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{model.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-3">Simple Process</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-3">
              How the AI Detector Works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              Four steps from paste to verified result. The complete AI detection workflow in under 2 seconds.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative">
                  {i < HOW_STEPS.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-border/60 -translate-x-1/2 z-0" />
                  )}
                  <Card className="border-border/50 hover:shadow-md transition-shadow relative z-10 h-full">
                    <CardContent className="p-6 flex flex-col items-start gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-4xl font-black text-border select-none">{step.step}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{step.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Detection Features ──────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">Full Feature Set</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-3">
              Everything You Need from an AI Detector
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              Not just a score — a complete AI content detection platform with linguistic analysis, file support, and API access.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="flex gap-4 p-5 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-all group">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-sm mb-1">{feat.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── AI Detection Benchmark ──────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6 bg-muted/30" id="benchmarks">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3 gap-1.5">
              <FlaskConical className="w-3 h-3" /> Original Research
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-3">
              AI Detection Benchmark 2025
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
              Independent internal benchmarks across major AI models. Each test uses a balanced dataset of verified human-written and AI-generated samples, evaluated against our detection engine.
            </p>
          </div>

          {/* Visual bar chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {BENCHMARKS.map((b) => (
              <Card key={b.model} className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-foreground">{b.model}</span>
                    <span className="text-2xl font-black text-primary">{b.accuracy}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mb-3">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${b.bar}%` }}
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>FP: {b.fp}%</span>
                    <span>FN: {b.fn}%</span>
                    <span>n={b.sample}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Expandable detailed table */}
          <div className="border border-border/50 rounded-xl overflow-hidden">
            <button
              onClick={() => setBenchmarkOpen(!benchmarkOpen)}
              className="w-full flex items-center justify-between px-6 py-4 bg-card hover:bg-muted/50 transition-colors text-sm font-semibold text-foreground"
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                View Detailed Benchmark Table
              </span>
              {benchmarkOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {benchmarkOpen && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      {['AI Model', 'Accuracy', 'False Positive Rate', 'False Negative Rate', 'Sample Size', 'Last Tested'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {BENCHMARKS.map((b, i) => (
                      <tr key={b.model} className={i % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                        <td className="px-4 py-3 font-bold text-foreground whitespace-nowrap">{b.model}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-bold text-primary">{b.accuracy}%</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-warning font-semibold">{b.fp}%</td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{b.fn}%</td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{b.sample}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{b.tested}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-3 bg-muted/30 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    <strong>Methodology:</strong> Each model tested on balanced datasets of verified human-written and AI-generated text across 12 content domains (academic, marketing, news, fiction, technical, etc.). Evaluated using 5-fold cross-validation. Last full benchmark run: November 2025.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Interactive Examples ─────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6" id="examples">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">Live Demo</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-3">
              See the AI Detector in Action
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              Real detection examples. Switch between human, AI-generated, and mixed-content samples to see how our AI checker analyzes each type.
            </p>
          </div>
          {/* Tab selector */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {EXAMPLES.map((ex, i) => (
              <button
                key={ex.type}
                onClick={() => setActiveExample(i)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all ${
                  activeExample === i
                    ? 'bg-primary text-primary-foreground border-primary shadow-md'
                    : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {ex.type}
              </button>
            ))}
          </div>

          {/* Example card */}
          {(() => {
            const ex = EXAMPLES[activeExample];
            return (
              <Card className="border-border/50 shadow-md">
                <CardHeader className="border-b border-border/50 pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle className="text-base">{ex.type} Sample</CardTitle>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold border ${ex.labelClass}`}>
                        {ex.score}% AI Detected
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold border ${ex.labelClass}`}>
                        {ex.label}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Score bar */}
                  <div className="mb-5">
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-muted-foreground">Human</span>
                      <span className="text-muted-foreground">AI</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-700 ${ex.barClass}`}
                        style={{ width: `${ex.score}%`, marginLeft: ex.score < 50 ? 0 : undefined }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{100 - ex.score}% Human</span>
                      <span>{ex.score}% AI</span>
                    </div>
                  </div>
                  {/* Text */}
                  <div className="bg-muted/30 rounded-xl p-4 mb-5 text-sm text-foreground leading-relaxed border border-border/30">
                    {ex.text}
                  </div>
                  {/* Highlights */}
                  <div className="mb-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Key phrases & their AI score</p>
                    <div className="flex flex-wrap gap-2">
                      {ex.highlights.map(h => (
                        <span
                          key={h.word}
                          className={`text-xs px-2.5 py-1 rounded-md font-semibold border ${
                            h.pct >= 70 ? 'bg-destructive/10 text-destructive border-destructive/20' :
                            h.pct >= 40 ? 'bg-warning/10 text-warning border-warning/20' :
                            'bg-success/10 text-success border-success/20'
                          }`}
                        >
                          "{h.word}" — {h.pct}% AI
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* Summary */}
                  <div className="flex gap-3 bg-muted/40 rounded-lg p-3 border border-border/30">
                    <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{ex.summary}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      </section>

      {/* ── Accuracy & Limitations ──────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6 bg-muted/30" id="accuracy">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">Transparency</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-3">
              Accuracy & Honest Limitations
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
              We believe transparency builds trust. Here's exactly what our AI detection tool can and cannot do, and how to use it responsibly.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {LIMITATIONS.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="border-border/50 h-full">
                  <CardContent className="p-6 flex flex-col gap-3 h-full">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${item.color} shrink-0`} />
                      <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{item.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {/* Responsible AI note */}
          <div className="mt-8 p-5 bg-primary/5 border border-primary/20 rounded-xl flex gap-4">
            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground text-sm mb-1">Responsible Use Statement</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AIDetector.cx is an investigative tool, not a judicial system. Results should be interpreted by qualified humans and combined with other evidence. We oppose using AI detection scores as the sole basis for academic, legal, or employment decisions. Always extend good faith to writers.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
