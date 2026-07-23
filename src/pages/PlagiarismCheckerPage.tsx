import { useState, useRef } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  TextSearch, AlertTriangle, CheckCircle2, RefreshCw, Download,
  Link2, ExternalLink, X, ClipboardPaste, FileText, Shield,
  GraduationCap, Briefcase, Newspaper, PenTool, Users, Bot
} from 'lucide-react';
import { analyzePlagiarism, type PlagiarismAnalysisResult } from './detector/detectionEngine';

// ── SEO schemas ───────────────────────────────────────────────────────────────
const faqItems = [
  {
    q: 'What is a plagiarism checker?',
    a: 'A plagiarism checker is a tool that compares your text against a database of published content — websites, academic papers, and other sources — to identify passages that match existing material. It helps writers, students, and publishers verify the originality of their work before submission or publication.',
  },
  {
    q: 'How does the AIDetector.cx plagiarism checker work?',
    a: 'Our plagiarism detector uses a multi-layer analysis engine. It first performs exact string matching against indexed web content, then applies semantic similarity detection to catch paraphrased and reworded content. Finally, it uses AI-pattern recognition to identify AI-generated text that may have been submitted as original work.',
  },
  {
    q: 'What is the difference between exact plagiarism and paraphrased plagiarism?',
    a: 'Exact plagiarism is a word-for-word copy of source material. Paraphrased plagiarism rewrites the original content with different words while preserving the same ideas and structure — it is still plagiarism even when sentences are changed. Our checker detects both types and reports them separately.',
  },
  {
    q: 'Who should use a plagiarism checker?',
    a: 'Students checking assignments before submission, teachers and professors verifying academic integrity, journalists and bloggers confirming content originality, publishers screening manuscripts, and businesses auditing website copy or employee-generated reports all benefit from regular plagiarism checking.',
  },
  {
    q: 'Can the checker detect AI-generated plagiarism?',
    a: 'Yes. AIDetector.cx uniquely combines traditional plagiarism detection with AI content detection. This means the tool identifies not only copied human-written content but also AI-generated text from ChatGPT, Gemini, Claude, and others that may be submitted as original human writing.',
  },
  {
    q: 'How many words can I check at once?',
    a: 'The free tier supports up to 2,000 words per check. Pro plan users can analyze up to 10,000 words per submission with higher accuracy and batch processing for multiple documents. Upgrade your plan from the Pricing page for higher limits.',
  },
];

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
    { '@type': 'ListItem', position: 2, name: 'Plagiarism Checker', item: 'https://aidetector.cx/plagiarism-checker' },
  ],
};

const SAMPLE_TEXT = `Artificial intelligence has rapidly transformed the way organizations operate across every industry, enabling unprecedented levels of automation and efficiency. As these systems become more sophisticated, questions about authorship, accountability, and content originality have become increasingly important. Universities, publishers, and businesses alike are grappling with how to distinguish human-written content from AI-generated text in an era where the two are nearly indistinguishable.`;

// ── Score color helpers ───────────────────────────────────────────────────────
const scoreColor = (v: number) =>
  v >= 90 ? 'text-success' : v >= 70 ? 'text-warning' : 'text-destructive';
const scoreBorder = (v: number) =>
  v >= 90 ? 'border-success/30 bg-success/5' : v >= 70 ? 'border-warning/30 bg-warning/5' : 'border-destructive/30 bg-destructive/5';

// ─────────────────────────────────────────────────────────────────────────────
export default function PlagiarismCheckerPage() {
  const [content, setContent]       = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult]         = useState<PlagiarismAnalysisResult | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const wordCount = (content.match(/\S+/g) || []).length;
  const charCount = content.length;

  const handleAnalyze = async () => {
    if (!content.trim() || wordCount < 20) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyzePlagiarism(content);
      setResult(res);
    } catch {
      setError('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setContent(text);
    } catch {
      // clipboard access denied — ignore
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setContent(ev.target?.result as string ?? '');
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = () => {
    if (!result) return;
    const text = [
      'Plagiarism Report — AIDetector.cx',
      `Date: ${new Date().toLocaleString()}`,
      '',
      `Originality Score: ${result.originalityScore}%`,
      `Risk Level: ${result.riskLevel}`,
      `Exact Match: ${result.matchTypes.exact}%`,
      `AI Paraphrased: ${result.matchTypes.aiParaphrased}%`,
      '',
      'Sources:',
      ...result.sources.map(s => `  - ${s.url} (${s.similarity}% similarity, ${s.matchType})`),
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'plagiarism-report.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout>
      <PageMeta
        title="Free Plagiarism Checker — AI & Duplicate Content Detector | AIDetector.cx"
        description="Check your text for plagiarism, duplicate content, and AI-generated writing instantly. Detect exact matches, paraphrased content, and AI sources with AIDetector.cx free plagiarism checker."
        canonicalUrl="https://aidetector.cx/plagiarism-checker"
        ogTitle="Free Plagiarism Checker — AI & Duplicate Content Detector | AIDetector.cx"
        ogDescription="Instantly check for plagiarism, paraphrasing, and AI-generated content. Free plagiarism checker with originality scores and source URLs."
        schemas={[faqSchema, breadcrumbSchema]}
      />

      {/* ── Hero / Tool section ───────────────────────────────────────────── */}
      <section className="bg-navy pt-16 pb-10">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-8">
            <Badge className="bg-primary/20 text-primary border-0 mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              Plagiarism Checker
            </Badge>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
              Free Plagiarism & Originality Checker
            </h1>
            <p className="text-white/60 max-w-2xl mx-auto text-sm md:text-base text-pretty">
              Detect exact matches, paraphrased content, and AI-generated writing in seconds.
              Get a detailed originality report with source URLs.
            </p>
          </div>

          {/* ── Tool card ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* Input column */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <Card className="border-border shadow-card overflow-hidden flex flex-col">
                {/* Toolbar */}
                <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-navy">Paste or type your content</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost" size="sm"
                      className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={handlePaste}
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" /> Paste
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => fileRef.current?.click()}
                    >
                      <FileText className="w-3.5 h-3.5" /> Upload
                    </Button>
                    <input ref={fileRef} type="file" accept=".txt,.doc,.docx,.pdf" className="hidden" onChange={handleFile} />
                    <Button
                      variant="ghost" size="sm"
                      className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setContent(SAMPLE_TEXT)}
                    >
                      Sample
                    </Button>
                    {content && (
                      <Button
                        variant="ghost" size="sm"
                        className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => { setContent(''); setResult(null); setError(null); }}
                      >
                        <X className="w-3.5 h-3.5" /> Clear
                      </Button>
                    )}
                  </div>
                </div>

                {/* Textarea */}
                <div className="relative flex-1">
                  <Textarea
                    placeholder="Paste or type your text here to check for plagiarism, paraphrased content, and AI-generated writing (minimum 20 words)..."
                    className="w-full min-h-[280px] resize-none border-0 focus-visible:ring-0 rounded-none p-5 text-base leading-relaxed bg-transparent"
                    value={content}
                    onChange={e => { setContent(e.target.value); setResult(null); setError(null); }}
                  />
                </div>

                {/* Footer row */}
                <div className="px-4 py-3 bg-muted/30 border-t border-border flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className={wordCount > 0 && wordCount < 20 ? 'text-warning font-medium' : ''}>
                      {wordCount.toLocaleString()} words
                    </span>
                    <span>{charCount.toLocaleString()} characters</span>
                    {wordCount > 0 && wordCount < 20 && (
                      <span className="text-warning flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Min 20 words
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || wordCount < 20}
                    className="h-9 px-6 bg-primary text-primary-foreground font-semibold gap-2 shrink-0"
                  >
                    {isAnalyzing
                      ? <><RefreshCw className="w-4 h-4 animate-spin" /> Checking…</>
                      : <><TextSearch className="w-4 h-4" /> Check Plagiarism</>}
                  </Button>
                </div>
              </Card>

              {/* Matched sections panel */}
              {result && (
                <Card className="border-border shadow-card">
                  <CardHeader className="pb-3 pt-4 px-5 border-b border-border">
                    <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
                      <TextSearch className="w-4 h-4 text-primary" /> Matched Sections
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    {result.sources.length === 0 ? (
                      <div className="flex items-center gap-2 text-sm text-success bg-success/5 border border-success/20 rounded-lg p-3">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        No matching content found. Your text appears to be original.
                      </div>
                    ) : (
                      <div className="bg-warning/10 p-4 rounded-lg border border-warning/20 text-sm text-muted-foreground text-pretty">
                        <span className="font-semibold text-warning flex items-center gap-1.5 mb-1">
                          <AlertTriangle className="w-4 h-4" /> Similar Content Detected
                        </span>
                        Some sentences in your text closely match existing sources. Review the sources panel on the right for details.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Error panel */}
              {error && (
                <Card className="border-destructive/30 bg-destructive/5 shadow-card">
                  <CardContent className="p-4 flex items-center gap-3 text-sm text-destructive">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Results column */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Loading state */}
              {isAnalyzing && (
                <Card className="border-border shadow-card flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                  </div>
                  <p className="font-semibold text-navy text-sm">Analyzing originality…</p>
                  <p className="text-xs text-muted-foreground text-center max-w-[200px] text-pretty">
                    Checking against web sources, academic databases, and AI patterns.
                  </p>
                </Card>
              )}

              {/* Empty state */}
              {!isAnalyzing && !result && (
                <Card className="border-border shadow-card flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center">
                    <TextSearch className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-navy text-sm">No analysis yet</p>
                  <p className="text-xs text-muted-foreground text-center max-w-[220px] text-pretty">
                    Paste your content on the left and click Check Plagiarism to see your originality score.
                  </p>
                  <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                    {['Exact match detection', 'Paraphrase detection', 'AI-generated content check', 'Source URLs included'].map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" /> {f}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Results */}
              {!isAnalyzing && result && (
                <div className="space-y-4">
                  {/* Score card */}
                  <Card className={`border shadow-card ${scoreBorder(result.originalityScore)}`}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className={`w-4 h-4 ${result.originalityScore >= 90 ? 'text-success' : 'text-muted-foreground'}`} />
                          Originality Score
                        </span>
                        <Badge
                          className={
                            result.riskLevel === 'Critical' || result.riskLevel === 'High'
                              ? 'bg-destructive/10 text-destructive border-destructive/20'
                              : result.riskLevel === 'Medium'
                              ? 'bg-warning/10 text-warning border-warning/20'
                              : 'bg-success/10 text-success border-success/20'
                          }
                        >
                          {result.riskLevel} Risk
                        </Badge>
                      </div>
                      <div className="flex items-end gap-3 mb-2">
                        <span className={`text-5xl font-extrabold ${scoreColor(result.originalityScore)}`}>
                          {result.originalityScore}%
                        </span>
                        <span className="text-sm text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Original</span>
                      </div>
                      <Progress value={result.originalityScore} className="h-2.5 mb-4" />
                      <div className="grid grid-cols-2 gap-3 text-xs border-t border-border/50 pt-4">
                        {[
                          ['Similarity', `${100 - result.originalityScore}%`],
                          ['Exact Match', `${result.matchTypes.exact}%`],
                          ['Paraphrased', `${result.matchTypes.partial}%`],
                          ['AI Content', `${result.matchTypes.aiParaphrased}%`],
                        ].map(([label, val]) => (
                          <div key={label} className="flex justify-between items-center">
                            <span className="text-muted-foreground">{label}:</span>
                            <span className="font-semibold text-navy">{val}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sources */}
                  <Card className="border-border shadow-card">
                    <CardHeader className="pb-2 pt-4 px-5 border-b border-border/50">
                      <CardTitle className="text-sm font-semibold text-navy flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Link2 className="w-4 h-4 text-primary" /> Similarity Sources
                        </span>
                        <span className="text-xs text-muted-foreground font-normal">{result.sources.length} source{result.sources.length !== 1 ? 's' : ''}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {result.sources.length === 0 ? (
                        <div className="p-5 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                          <CheckCircle2 className="w-6 h-6 text-success" />
                          No matching sources found. Great originality!
                        </div>
                      ) : (
                        <div className="divide-y divide-border/50 max-h-[280px] overflow-y-auto">
                          {result.sources.map((source, i) => (
                            <div key={i} className="p-4 hover:bg-muted/30 transition-colors">
                              <div className="flex justify-between items-start gap-2 mb-1.5">
                                <span className="font-medium text-xs text-navy flex-1 truncate min-w-0" title={source.url}>
                                  {source.url}
                                </span>
                                <Badge className="bg-warning/10 text-warning border-warning/20 shrink-0 text-[10px]">
                                  {source.similarity}%
                                </Badge>
                              </div>
                              <div className="flex justify-between items-center text-xs text-muted-foreground">
                                <span>{source.matchType}</span>
                                <a
                                  href={`https://${source.url}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 text-primary hover:underline"
                                >
                                  View <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <Button
                    className="w-full h-10 gap-2 bg-primary text-primary-foreground font-semibold"
                    onClick={handleExport}
                  >
                    <Download className="w-4 h-4" /> Export Report
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── SEO Content Section ───────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 md:px-6">

          {/* What is plagiarism? */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <Badge className="bg-primary/10 text-primary border-0 mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                About
              </Badge>
              <h2 className="text-2xl md:text-3xl font-extrabold text-navy mb-4">
                What is a Plagiarism Checker?
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4 text-pretty">
                A plagiarism checker is a tool that compares submitted text against a large database of published
                web pages, academic journals, books, and other sources to detect copied or reworded content.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4 text-pretty">
                AIDetector.cx goes beyond standard plagiarism detection by combining two analyses in one:
                traditional duplicate-content matching and AI authorship detection. This means we flag both
                copied human text and AI-generated content submitted as original work.
              </p>
              <div className="space-y-3 mt-5">
                {[
                  ['Exact Match', 'Word-for-word copies of source material are flagged with full source URLs.'],
                  ['Paraphrased Match', 'Semantically similar content that rewrites source text is detected.'],
                  ['AI-Generated Content', 'Text from ChatGPT, Claude, Gemini, and others is identified separately.'],
                ].map(([title, desc]) => (
                  <div key={title} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-navy text-sm">{title} — </span>
                      <span className="text-sm text-muted-foreground">{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Shield,        label: 'Originality %',    desc: 'Overall originality score from 0–100%' },
                { icon: Link2,         label: 'Source URLs',      desc: 'Direct links to matched source content' },
                { icon: TextSearch,    label: 'Match Highlights', desc: 'Exact vs paraphrased breakdown' },
                { icon: Bot,           label: 'AI Detection',     desc: 'Identifies AI-authored content too' },
              ].map(({ icon: Icon, label, desc }) => (
                <Card key={label} className="border-border shadow-card">
                  <CardContent className="p-5">
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <p className="font-semibold text-navy text-sm mb-1">{label}</p>
                    <p className="text-xs text-muted-foreground text-pretty">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Who should use it */}
          <div className="mb-20">
            <div className="text-center mb-10">
              <Badge className="bg-primary/10 text-primary border-0 mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                Use Cases
              </Badge>
              <h2 className="text-2xl md:text-3xl font-extrabold text-navy mb-3">
                Who Should Use a Plagiarism Checker?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
                Originality verification matters across every industry and discipline.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: GraduationCap, title: 'Students',   desc: 'Verify assignments and essays are original before submission to avoid academic integrity violations.' },
                { icon: Users,         title: 'Teachers',   desc: 'Screen student submissions quickly to identify copied or AI-generated content across any class size.' },
                { icon: PenTool,       title: 'Writers',    desc: 'Confirm that articles, blog posts, and creative writing are fully original before publishing.' },
                { icon: Newspaper,     title: 'Publishers', desc: 'Protect editorial integrity by screening manuscripts and contributed content for duplication.' },
                { icon: Briefcase,     title: 'Businesses', desc: 'Audit website copy, marketing materials, and reports for duplicate content that harms SEO.' },
                { icon: Bot,           title: 'AI Monitors','desc': 'Detect AI-written submissions in any context where human authorship is expected or required.' },
              ].map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="border-border shadow-card hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-navy text-sm mb-1.5">{title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <Badge className="bg-primary/10 text-primary border-0 mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                FAQ
              </Badge>
              <h2 className="text-2xl md:text-3xl font-extrabold text-navy mb-3">
                Frequently Asked Questions
              </h2>
            </div>
            <Accordion type="single" collapsible className="space-y-3">
              {faqItems.map(({ q, a }, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border border-border rounded-lg px-5 shadow-none"
                >
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
        </div>
      </section>
    </MainLayout>
  );
}
