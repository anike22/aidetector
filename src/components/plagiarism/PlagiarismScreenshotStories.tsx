import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  ShieldCheck,
  Search,
  FolderLock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Database,
  Eye,
  FileCheck2,
  Cpu
} from 'lucide-react';

interface Props {
  onScrollToChecker?: () => void;
}

export function PlagiarismScreenshotStories({ onScrollToChecker }: Props) {
  return (
    <section className="py-16 md:py-24 bg-card/40 border-y border-border">
      <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-20 md:space-y-28">

        {/* ── Story #1: Forensic Metric Breakdown (Text Left, Screenshot Right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-0.5 font-semibold">
                Forensic Intelligence
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">STORY 01</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
              Understand What the Percentage Actually Means
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-pretty">
              A single similarity percentage is often misleading. Real-world content overlaps can reflect properly formatted quotes, common terminology, or syndicated web mirrors. AIDetector.cx deconstructs similarity into four distinct forensic metrics so you know exactly where risk lies.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-foreground">Total Similarity:</span>
                  <span className="text-muted-foreground ml-1">Comprehensive percentage of analyzed text supported by discovered matching source material.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-foreground">Plagiarism Risk Level:</span>
                  <span className="text-muted-foreground ml-1">Contextual rating calculated strictly from uncited direct matches, discounting correctly referenced citations.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-foreground">Uncited Direct Matches:</span>
                  <span className="text-muted-foreground ml-1">Verbatim passages lacking citation markers or attribution metadata that require immediate revision.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-foreground">Properly Cited & Attributed:</span>
                  <span className="text-muted-foreground ml-1">Quoted passages with validated inline citations (APA, MLA, Chicago, IEEE), separated from copying penalties.</span>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onScrollToChecker}
                className="text-xs gap-1.5 font-medium border-border hover:bg-muted"
              >
                Inspect Results Live <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <Card className="border-border shadow-xl bg-slate-950/70 overflow-hidden ring-1 ring-border/50 rounded-2xl">
              <div className="p-3 bg-slate-900/90 border-b border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-1 font-mono text-[11px] text-slate-300">Forensic Intelligence Suite — Metric Output</span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-slate-800/80 text-slate-300 border-slate-700">
                  Live Snapshot
                </Badge>
              </div>
              <div className="relative aspect-[16/9] w-full bg-slate-950 overflow-hidden group">
                <img
                  src="https://miaoda-conversation-file.s3cdn.medo.dev/user-c18kzohmrlkw/app-c18l1vf2nz7l/20260922/Screenshot_2026-09-22_065944.png"
                  alt="Plagiarism Forensic Intelligence Suite showing 4 evidence cards: Total Similarity, Plagiarism Risk Level, Uncited Direct Matches, and Properly Cited Attributions"
                  className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.01]"
                  loading="lazy"
                />
              </div>
              <div className="p-3.5 bg-slate-900/60 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between flex-wrap gap-2">
                <span>Verified Non-Overlapping Attribution Engine</span>
                <span className="font-mono text-slate-400">8-Section Audit Package (.TXT) & JSON Export Ready</span>
              </div>
            </Card>
          </div>
        </div>

        {/* ── Story #2: Live Scanner & 17 Forensic Badges (Screenshot Left, Text Right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <Card className="border-border shadow-xl bg-slate-950/70 overflow-hidden ring-1 ring-border/50 rounded-2xl">
              <div className="p-3 bg-slate-900/90 border-b border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-1 font-mono text-[11px] text-slate-300">Live Workspace & Multi-Modal Engine Badges</span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-indigo-950/80 text-indigo-300 border-indigo-800">
                  17 Engines Active
                </Badge>
              </div>
              <div className="relative aspect-[16/9] w-full bg-slate-950 overflow-hidden group">
                <img
                  src="https://miaoda-conversation-file.s3cdn.medo.dev/user-c18kzohmrlkw/app-c18l1vf2nz7l/20260922/Screenshot_2026-09-22_070025.png"
                  alt="Live Plagiarism Checker scan mode toggle between Standard Scan and Deep Forensic Scan with active forensic engine badges"
                  className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.01]"
                  loading="lazy"
                />
              </div>
              <div className="p-3.5 bg-slate-900/60 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between flex-wrap gap-2">
                <span>Engines: Code AST · Table Invariance · Figure dHash · AI Rewrite · Private Corpus</span>
                <span className="font-mono text-slate-400">Standard & Deep Scan Toggles</span>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-5 order-1 lg:order-2 space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-0.5 font-semibold">
                Scan Architecture
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">STORY 02</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
              Multi-Modal Deep Forensic Inspection
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-pretty">
              Modern academic and professional dishonesty is rarely limited to simple copy-pasting. Authors disguise source material through table transposition, programmatic variable renaming, and multi-pass AI rewrites. Our deep forensic scan brings specialized sub-engines into every run.
            </p>
            <div className="grid grid-cols-2 gap-2.5 pt-2 text-xs">
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                <div className="font-semibold text-foreground mb-0.5 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-primary" /> Code AST Analysis
                </div>
                <div className="text-[11px] text-muted-foreground">Abstract syntax tree normalization to identify structural logic reuse across codebases.</div>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                <div className="font-semibold text-foreground mb-0.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" /> Table Invariance
                </div>
                <div className="text-[11px] text-muted-foreground">Detects transposed tabular rows and data columns extracted from published research datasets.</div>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                <div className="font-semibold text-foreground mb-0.5 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-primary" /> Figure dHash Check
                </div>
                <div className="text-[11px] text-muted-foreground">Perceptual difference hashing to catch cropped, resized, or filtered scientific figures.</div>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                <div className="font-semibold text-foreground mb-0.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Rewrite Tracing
                </div>
                <div className="text-[11px] text-muted-foreground">Isolates fact sequencing and argumentative structure typical of automated rewriters.</div>
              </div>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onScrollToChecker}
                className="text-xs gap-1.5 font-medium border-border hover:bg-muted"
              >
                Try Deep Forensic Scan <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* ── Story #3: Search Coverage & Provider Audit Matrix (Text Left, Screenshot Right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-0.5 font-semibold">
                Coverage Transparency
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">STORY 03</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
              Know What Was Actually Checked
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-pretty">
              If an external registry experiences a network timeout or rate limit, conventional tools silently ignore the failure and proclaim your paper "100% Original." At AIDetector.cx, search coverage is audited with absolute transparency across all six major retrieval providers.
            </p>
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Operational Transparency:</span>
                  <span className="text-muted-foreground ml-1">Live telemetry reports which academic indexes (Crossref, OpenAlex, Unpaywall) and web search engines responded successfully.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">No False 0% Certainty:</span>
                  <span className="text-muted-foreground ml-1">If providers timeout or encounter restrictions, results are truthfully flagged as "Limited Coverage" rather than an unearned 0% similarity guarantee.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Search className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">250M+ Scholarly Records:</span>
                  <span className="text-muted-foreground ml-1">Queries are distributed across academic repositories, open-access manuscript PDFs, and neural web indexes simultaneously.</span>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onScrollToChecker}
                className="text-xs gap-1.5 font-medium border-border hover:bg-muted"
              >
                Inspect Coverage Matrix <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="lg:col-span-7">
            <Card className="border-border shadow-xl bg-slate-950/70 overflow-hidden ring-1 ring-border/50 rounded-2xl">
              <div className="p-3 bg-slate-900/90 border-b border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-1 font-mono text-[11px] text-slate-300">Search Coverage & Provider Audit Matrix</span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-slate-800/80 text-emerald-400 border-emerald-900/50">
                  75% Operational
                </Badge>
              </div>
              <div className="relative aspect-[16/9] w-full bg-slate-950 overflow-hidden group">
                <img
                  src="https://miaoda-conversation-file.s3cdn.medo.dev/user-c18kzohmrlkw/app-c18l1vf2nz7l/20260922/Screenshot_2026-09-22_070140.png"
                  alt="Search Coverage and Provider Audit Matrix showing operational status across Crossref, OpenAlex, Unpaywall, Google Custom Search, Exa Neural, and Deep Paraphrase"
                  className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.01]"
                  loading="lazy"
                />
              </div>
              <div className="p-3.5 bg-slate-900/60 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between flex-wrap gap-2">
                <span>Honest Provider Status Logging (Operational / Timeout / Restricted)</span>
                <span className="font-mono text-slate-400">14 Forensic Inspection Tabs</span>
              </div>
            </Card>
          </div>
        </div>

        {/* ── Story #4: Private Student Corpus & Institutional Archive (Screenshot Left, Text Right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 order-2 lg:order-1">
            <Card className="border-border shadow-xl bg-slate-950/70 overflow-hidden ring-1 ring-border/50 rounded-2xl">
              <div className="p-3 bg-slate-900/90 border-b border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="ml-1 font-mono text-[11px] text-slate-300">Private Student Corpus & Institutional Archive</span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-slate-800/80 text-slate-300 border-slate-700">
                  Tenant Isolated
                </Badge>
              </div>
              <div className="relative aspect-[16/9] w-full bg-slate-950 overflow-hidden group">
                <img
                  src="https://miaoda-conversation-file.s3cdn.medo.dev/user-c18kzohmrlkw/app-c18l1vf2nz7l/20260922/Screenshot_2026-09-22_070212.png"
                  alt="Private Student Corpus and Institutional Archive interface showing indexed essays, upload controls, and localized similarity audit results"
                  className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.01]"
                  loading="lazy"
                />
              </div>
              <div className="p-3.5 bg-slate-900/60 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between flex-wrap gap-2">
                <span>Upload Essay Files or Paste Text to Custom Repository</span>
                <span className="font-mono text-slate-400">Zero Public Leakage Guarantee</span>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-5 order-1 lg:order-2 space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-0.5 font-semibold">
                Corpus Auditing
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">STORY 04</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
              Check Against Your Own Content Library
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-pretty">
              Standard web crawlers cannot access your unpublished term papers, internal corporate research, or previous manuscript iterations. The Private Corpus feature enables you to index personal or classroom documents in a strictly isolated, encrypted local sandbox.
            </p>
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-start gap-2.5">
                <FolderLock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Self-Plagiarism & Draft Iteration:</span>
                  <span className="text-muted-foreground ml-1">Distinguish legitimate continuation of your prior research drafts from external uncredited plagiarism.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Database className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Classroom & Faculty Archives:</span>
                  <span className="text-muted-foreground ml-1">Educators can index past student term papers to screen current submissions against unauthorized internal reuse.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <FileCheck2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Strict Privacy & No Public Indexing:</span>
                  <span className="text-muted-foreground ml-1">Uploaded corpus documents are never contributed to commercial databases or shared with third-party training pipelines.</span>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onScrollToChecker}
                className="text-xs gap-1.5 font-medium border-border hover:bg-muted"
              >
                Access Private Corpus <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
