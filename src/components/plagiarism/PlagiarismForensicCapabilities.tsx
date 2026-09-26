import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Search,
  BookOpen,
  Quote,
  Languages,
  FolderLock,
  Layers,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Compass,
  ArrowRight,
  GitBranch,
  ExternalLink,
  Bot,
  SplitSquareVertical
} from 'lucide-react';

interface Props {
  onScrollToChecker?: () => void;
}

export function PlagiarismForensicCapabilities({ onScrollToChecker }: Props) {
  return (
    <div className="space-y-20 md:space-y-28">

      {/* ── 1. Quick Capability Strip ── */}
      <section className="border-y border-border bg-card/60 py-6">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-left">
            <div className="p-3 rounded-xl bg-background border border-border/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-1.5 text-primary">
                <FileText className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-xs text-foreground">Exact Matches</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Word-for-word textual overlaps across 250M+ scholarly & web records.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-1.5 text-indigo-500">
                <Layers className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-xs text-foreground">Paraphrased Content</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Rewritten sentences and clause permutations preserving original meaning.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-1.5 text-emerald-500">
                <Search className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-xs text-foreground">Source Evidence</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Direct source URLs, verified excerpts, and earliest discovered dates.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-1.5 text-amber-500">
                <Quote className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-xs text-foreground">Citation Analysis</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Separates properly cited quotes from uncredited copying.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-1.5 text-sky-500">
                <Languages className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-xs text-foreground">Cross-Language</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Identifies translated source content across foreign literature.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-1.5 text-violet-500">
                <FolderLock className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-xs text-foreground">Private Corpus</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Localized similarity audits against custom uploaded essay collections.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Product Positioning: Go Beyond a Plagiarism Percentage ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-3 py-1 font-semibold uppercase tracking-wider mb-3">
            Product Category Definition
          </Badge>
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground tracking-tight mb-4">
            Go Beyond a Plagiarism Percentage
          </h2>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-pretty">
            A single raw percentage score cannot distinguish an intentional citation from wholesale copying, nor can it identify whether a matching phrase was rewritten, syndicated across mirror domains, or verified with genuine evidence.
          </p>
        </div>

        {/* Six Visual Questions Framework */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <Card className="border-border shadow-xs hover:border-primary/40 transition-colors">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-primary tracking-widest uppercase">QUESTION 01</span>
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-base text-foreground">WHAT MATCHED?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Highlights exact verbatim sentences and near-match semantic spans with token-by-token visual run expansion rather than vague document-level flags.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs hover:border-primary/40 transition-colors">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-primary tracking-widest uppercase">QUESTION 02</span>
                <Search className="w-4 h-4 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-base text-foreground">WHERE WAS IT FOUND?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Traces each match to primary peer-reviewed journals, open-access repository DOIs (Unpaywall), and indexed web manuscripts with live outbound links.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs hover:border-primary/40 transition-colors">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-primary tracking-widest uppercase">QUESTION 03</span>
                <Layers className="w-4 h-4 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-base text-foreground">HOW SIMILAR IS IT?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Classifies matches by technical typology: verbatim duplicate, syntactic variation, structural mutation, or surface synonym substitution.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs hover:border-primary/40 transition-colors">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-primary tracking-widest uppercase">QUESTION 04</span>
                <Bot className="w-4 h-4 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-base text-foreground">WAS IT PARAPHRASED?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Evaluates sentence reorganization and clause reordering. Semantic overlap flags candidates for review without equating topic discussion with copying.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs hover:border-primary/40 transition-colors">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-primary tracking-widest uppercase">QUESTION 05</span>
                <Quote className="w-4 h-4 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-base text-foreground">IS IT ATTRIBUTED?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Parses in-text citations and quotation marks to discount properly referenced scholarly quotations from plagiarism risk calculations.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs hover:border-primary/40 transition-colors">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-primary tracking-widest uppercase">QUESTION 06</span>
                <SplitSquareVertical className="w-4 h-4 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-base text-foreground">WHAT EVIDENCE SUPPORTS IT?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generates side-by-side evidence maps comparing the submitted passage directly to the extracted source paragraph for total audit defensibility.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── 3. Source Intelligence & Evidence Mapping ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-0.5 font-semibold">
              Source Provenance
            </Badge>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Trace Matches Back to Their Sources
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-pretty">
              Knowing that a passage is similar to existing writing is only useful if you can trace its genuine origin. AIDetector.cx indexes verified academic registries and public web archives to provide actionable attribution trails.
            </p>
            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 rounded-lg bg-card border border-border">
                <h4 className="font-semibold text-foreground mb-1">Non-Overlapping Source Accounting</h4>
                <p className="text-muted-foreground">
                  When multiple websites mirror the same press release or encyclopedia article, our engine clusters them into a single primary source cluster so duplicate mirrors do not artificially inflate your similarity score.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <h4 className="font-semibold text-foreground mb-1">Chronological Discovery Timeline</h4>
                <p className="text-muted-foreground">
                  Discovered publications are sorted by earliest discovered publication date. We state this transparently as <em>"earliest source discovered during analysis"</em> rather than making absolute claims of origin.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <Card className="border-border bg-card shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-primary" /> Source Clustering & Attribution Flow
                </span>
                <Badge variant="outline" className="text-[10px]">Deduplicated</Badge>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-muted/40 border border-border/80 flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-foreground truncate max-w-[260px]">Attention Is All You Need</div>
                    <div className="text-[11px] text-muted-foreground">arXiv:1706.03762 · NeurIPS 2017</div>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">Primary Cluster (60%)</Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border/40 pl-6 text-muted-foreground flex justify-between items-center text-[11px]">
                  <span>↳ nlp.seas.harvard.edu (Annotated Transformer mirror)</span>
                  <span className="text-[10px] text-muted-foreground/70">Grouped</span>
                </div>
                <div className="p-3 rounded-lg bg-muted/20 border border-border/40 pl-6 text-muted-foreground flex justify-between items-center text-[11px]">
                  <span>↳ scispace.com/topics/machine-translation (Syndicated citation)</span>
                  <span className="text-[10px] text-muted-foreground/70">Grouped</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground/80 italic pt-1">
                Clustering ensures that republished blog posts and research mirrors do not count as separate plagiarism events.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ── 4. Paraphrase Intelligence & AI-Rewrite Tracing ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <Card className="border-border bg-card shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-indigo-500" /> Paraphrase & Voice Invariance
                </span>
                <Badge variant="outline" className="text-[10px] text-indigo-400 border-indigo-900/50">Semantic Analysis</Badge>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
                  <div className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider mb-1">Submitted Sentence</div>
                  <p className="text-foreground italic">"Artificial neural networks have swiftly altered organizational workflows throughout multiple commercial domains."</p>
                </div>
                <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
                  <div className="text-[11px] font-semibold text-indigo-500 uppercase tracking-wider mb-1">Discovered Source Excerpt</div>
                  <p className="text-muted-foreground italic">"Machine learning models have rapidly transformed business operations across numerous industry sectors."</p>
                </div>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg border border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Syntactic Invariance Score:</span>
                <span className="font-mono font-bold text-indigo-400">88% (Likely Paraphrased)</span>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
            <Badge className="bg-indigo-500/10 text-indigo-500 border-indigo-500/20 text-xs px-2.5 py-0.5 font-semibold">
              Beyond Copy & Paste
            </Badge>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Find Similarity Beyond Copy-and-Paste
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-pretty">
              Standard substring search tools fail when writers rewrite source sentences with synonyms or alter passive voice into active voice. AIDetector.cx combines token n-gram expansion with deep sentence-level semantic models to detect paraphrasing.
            </p>
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Calibrated Non-Dogmatic Language:</span>
                  <span className="text-muted-foreground ml-1">We explicitly state that <em>"Semantic similarity by itself does not prove plagiarism."</em> Potential matches are flagged for editorial review with evidence snippets.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">AI Rewrite Source Tracing:</span>
                  <span className="text-muted-foreground ml-1">Analyzes whether content maintains the fact progression, argument hierarchy, and structured layout of previously published papers.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Citation Intelligence & Attribution ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs px-2.5 py-0.5 font-semibold">
              Ethical Attribution
            </Badge>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Similarity Is Not the Same as Plagiarism
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-pretty">
              In academic literature and serious journalism, direct quotes are expected and necessary. A quoted passage containing quotation marks and an explicit author citation should never be penalized as plagiarism.
            </p>
            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Quotation Recognition:</span>
                  <span className="text-muted-foreground ml-1">Identifies standard quotation marks and indented block quotes to isolate cited text.</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Style Parsing:</span>
                  <span className="text-muted-foreground ml-1">Supports APA (Author, Year), MLA, Chicago footnotes, IEEE brackets [1], and Harvard formats.</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Independent Risk Scoring:</span>
                  <span className="text-muted-foreground ml-1">Total Similarity measures gross overlap, while Plagiarism Risk measures only uncited direct matches.</span>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <a
                href="/citation-verifier"
                className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
              >
                Learn about our Citation Verifier suite <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-6">
            <Card className="border-border bg-card shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Quote className="w-4 h-4 text-emerald-500" /> Attribution Verification Ledger
                </span>
                <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-900/50">Verified Attribution</Badge>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-emerald-500">Properly Cited Passage</span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[10px]">Zero Risk</Badge>
                  </div>
                  <p className="text-foreground text-xs italic">
                    "According to Vaswani et al. (2017), transformer architectures rely heavily on multi-head self-attention mechanisms..."
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Citation matched to Crossref DOI 10.48550/arXiv.1706.03762. Excluded from plagiarism risk.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-rose-500">Uncited Direct Match</span>
                    <Badge className="bg-rose-500/20 text-rose-400 border-0 text-[10px]">Action Needed</Badge>
                  </div>
                  <p className="text-foreground text-xs italic">
                    "...scaling language models substantially improves few-shot performance on downstream tasks."
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Matched Brown et al. (2020) without quotation marks or reference marker. Flagged for attribution.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ── 6. Standard vs Deep Forensic Scan Comparison ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-3 py-1 font-semibold uppercase tracking-wider mb-3">
            Engine Configuration
          </Badge>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mb-2">
            Standard Scan vs Deep Forensic Scan
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            Choose the diagnostic depth that matches your workflow and turnaround requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Standard Scan */}
          <Card className="border-border shadow-sm flex flex-col justify-between">
            <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-lg text-foreground">Standard Scan</h3>
                </div>
                <Badge variant="outline" className="text-xs">Rapid Draft Check</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Designed for everyday blogging, quick student draft reviews, and initial duplicate content sanity checks.
              </p>
              <ul className="space-y-2.5 text-xs text-muted-foreground flex-1 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Fast web index search
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Exact match substring detection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Basic source identification and URLs
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Word and character statistics
                </li>
                <li className="flex items-center gap-2 opacity-50">
                  <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Basic semantic paraphrase checking
                </li>
              </ul>
              <div className="pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={onScrollToChecker}
                  className="w-full text-xs font-semibold h-9"
                >
                  Use Standard Scan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Deep Forensic Scan */}
          <Card className="border-primary/40 shadow-md bg-card/90 ring-1 ring-primary/20 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-0.5 rounded-bl-lg uppercase tracking-wider">
              Recommended
            </div>
            <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-lg text-foreground">Deep Forensic Scan</h3>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">17 Engines</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Comprehensive academic and forensic audit across 250M+ scholarly works, multi-window token models, and private archives.
              </p>
              <ul className="space-y-2.5 text-xs text-muted-foreground flex-1 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> Multi-window bi-directional exact matching
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> Crossref, OpenAlex & Unpaywall full-text recovery
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> AI Rewrite Source Tracing & argument flow
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> Citation integrity & quotation separation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> Private student corpus comparison sandbox
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" /> Complete 8-section forensic report (.TXT / JSON)
                </li>
              </ul>
              <div className="pt-4 border-t border-border">
                <Button
                  onClick={onScrollToChecker}
                  className="w-full text-xs font-semibold h-9 bg-primary text-primary-foreground"
                >
                  Start Deep Forensic Scan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

    </div>
  );
}
