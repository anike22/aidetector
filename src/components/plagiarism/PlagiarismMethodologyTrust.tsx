import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Search,
  Bot,
  Download,
  GraduationCap,
  Briefcase,
  Newspaper,
  PenTool,
  SearchCheck,
  Building2,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Lock,
  ArrowRight,
  Shield,
  Layers,
  HelpCircle
} from 'lucide-react';

interface Props {
  onScrollToChecker?: () => void;
}

export function PlagiarismMethodologyTrust({ onScrollToChecker }: Props) {
  return (
    <div className="space-y-20 md:space-y-28">

      {/* ── 1. How It Works (4 Simple Steps) ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-3 py-1 font-semibold uppercase tracking-wider mb-3">
            Execution Flow
          </Badge>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mb-2">
            How It Works
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            From raw text input to an 8-section evidence-backed forensic audit package in four steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <Card className="border-border shadow-xs relative overflow-hidden bg-card/60">
            <div className="absolute top-3 right-4 text-3xl font-extrabold text-muted-foreground/15 font-mono select-none">
              01
            </div>
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1.5">Paste or Upload</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Submit plain text or upload PDF, DOCX, and TXT files. The engine partitions sentences and identifies distinctive named entities.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs relative overflow-hidden bg-card/60">
            <div className="absolute top-3 right-4 text-3xl font-extrabold text-muted-foreground/15 font-mono select-none">
              02
            </div>
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1.5">Search Sources</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Queries are dispatched in parallel across Crossref, OpenAlex, Unpaywall, and live neural indices to discover matching manuscripts.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs relative overflow-hidden bg-card/60">
            <div className="absolute top-3 right-4 text-3xl font-extrabold text-muted-foreground/15 font-mono select-none">
              03
            </div>
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1.5">Analyze Similarity</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Multi-window exact matching, bi-directional token run expansion, syntactic paraphrase models, and citation parsing are executed.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs relative overflow-hidden bg-card/60">
            <div className="absolute top-3 right-4 text-3xl font-extrabold text-muted-foreground/15 font-mono select-none">
              04
            </div>
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground mb-1.5">Review Evidence</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Inspect side-by-side evidence maps, provider coverage logs, and export defensible audit packages in text or JSON formats.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── 2. Professional Use Cases Grid (7 Cards) ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-3 py-1 font-semibold uppercase tracking-wider mb-3">
            Industry Applications
          </Badge>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mb-2">
            Tailored For Academic & Professional Workflows
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            Whether preparing a dissertation or publishing enterprise content, our evidence platform delivers integrity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Card className="border-border shadow-xs bg-card/60">
            <CardContent className="p-5 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Students</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Verify term papers and dissertations before submission. Distinguish prior draft iterations via the Private Corpus and format citations properly.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs bg-card/60">
            <CardContent className="p-5 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-2">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Educators</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Audit student submissions against legitimate academic indices. Isolate uncredited copying from properly referenced quotations with clear evidence maps.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs bg-card/60">
            <CardContent className="p-5 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
                <SearchCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Researchers</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Screen scientific manuscripts across 250M+ Crossref and OpenAlex records. Verify literature review uniqueness and check data table invariance.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs bg-card/60">
            <CardContent className="p-5 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2">
                <PenTool className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Content Writers</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Prevent accidental duplicate phrasing and ensure freelance articles are original before publishing to avoid editorial disputes.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs bg-card/60">
            <CardContent className="p-5 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center mb-2">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">SEO Teams</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Protect search engine rankings from duplicate content penalties and investigate competitor syndication or unauthorized scraping.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs bg-card/60">
            <CardContent className="p-5 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2">
                <Newspaper className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Publishers</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Screen incoming book manuscripts, investigative articles, and journal articles against historical literature before licensing or printing.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs bg-card/60 md:col-span-2 lg:col-span-3">
            <CardContent className="p-5 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center mb-2">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Businesses & Corporate Legal Teams</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Audit corporate compliance manuals, white papers, and marketing decks against public documentation. Keep internal content strictly confidential using isolated private corpus sandboxes.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── 3. Methodology, Trust & System Limitations ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-6 space-y-4">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-2.5 py-0.5 font-semibold">
              Scientific Integrity
            </Badge>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              How AIDetector.cx Evaluates Similarity
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
              Our evaluation architecture follows a transparent, deterministic six-stage process designed to eliminate false positives and false certainty.
            </p>
            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-[10px]">1</div>
                <div><span className="font-semibold text-foreground">Source Discovery:</span> Parallel querying across open scientific registries and web indices.</div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-[10px]">2</div>
                <div><span className="font-semibold text-foreground">Content Retrieval:</span> Memory-safe HTML stripping and open-access PDF text extraction.</div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-[10px]">3</div>
                <div><span className="font-semibold text-foreground">Text Normalization:</span> Unicode normalization, quote standardization, and token filtering.</div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-[10px]">4</div>
                <div><span className="font-semibold text-foreground">Multi-Window Matching:</span> Exact seed matching with bi-directional token expansion.</div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-[10px]">5</div>
                <div><span className="font-semibold text-foreground">Citation Parsing:</span> Isolating properly attributed references from plagiarism penalties.</div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold text-[10px]">6</div>
                <div><span className="font-semibold text-foreground">Non-Overlapping Coverage:</span> Calculating unique character spans to prevent score inflation.</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <Card className="border-border bg-card shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Honest System Limitations</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
                We believe in total technical truthfulness. No tool can index every word ever written. We clearly disclose our operational boundaries:
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground pt-1">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span><strong>Paywalled Materials:</strong> We cannot access articles behind closed commercial paywalls that block automated indexing.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span><strong>Private Databases:</strong> We do not have unauthorized access to private corporate intranets or Turnitin proprietary archives.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span><strong>Provider Availability:</strong> If an academic provider times out, we flag results as "Limited Coverage" rather than claiming 100% originality.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span><strong>Recently Published Content:</strong> Web pages published within the last few minutes may not yet appear in live search indices.</span>
                </li>
              </ul>
            </Card>

            <Card className="border-border bg-card shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-500 font-semibold text-sm">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Data Privacy & Corpus Security</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your submitted text and documents are processed securely to generate your forensic report. We do not sell your content, license it to third parties, or add it to public databases. Documents added to your Private Corpus are strictly tenant-isolated and encrypted.
              </p>
              <div className="pt-1 flex items-center gap-3 text-xs">
                <a href="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</a>
                <span className="text-border">|</span>
                <a href="/terms" className="text-primary hover:underline font-medium">Terms of Service</a>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ── 4. Competitive Differentiation ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-3 py-1 font-semibold uppercase tracking-wider mb-3">
            Market Comparison
          </Badge>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mb-2">
            More Than a Traditional Similarity Checker
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            How AIDetector.cx's Forensic Intelligence Suite compares to basic online plagiarism checkers.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-border rounded-xl overflow-hidden bg-card">
            <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border">
              <tr>
                <th className="p-3.5 whitespace-nowrap">Capability</th>
                <th className="p-3.5 whitespace-nowrap text-primary font-bold">AIDetector.cx Forensic Suite</th>
                <th className="p-3.5 whitespace-nowrap">Traditional Free Checkers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="p-3.5 font-medium text-foreground whitespace-nowrap">Evidence Mapping</td>
                <td className="p-3.5 text-foreground whitespace-nowrap flex items-center gap-1.5 font-semibold text-emerald-500">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Side-by-side passage comparison
                </td>
                <td className="p-3.5 text-muted-foreground whitespace-nowrap">Generic highlighted text block</td>
              </tr>
              <tr>
                <td className="p-3.5 font-medium text-foreground whitespace-nowrap">Citation Separation</td>
                <td className="p-3.5 text-foreground whitespace-nowrap flex items-center gap-1.5 font-semibold text-emerald-500">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Displaced from risk score
                </td>
                <td className="p-3.5 text-muted-foreground whitespace-nowrap">Penalizes properly cited quotes</td>
              </tr>
              <tr>
                <td className="p-3.5 font-medium text-foreground whitespace-nowrap">Source Deduplication</td>
                <td className="p-3.5 text-foreground whitespace-nowrap flex items-center gap-1.5 font-semibold text-emerald-500">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Non-overlapping clustering
                </td>
                <td className="p-3.5 text-muted-foreground whitespace-nowrap">Inflates score with duplicate mirrors</td>
              </tr>
              <tr>
                <td className="p-3.5 font-medium text-foreground whitespace-nowrap">Provider Transparency</td>
                <td className="p-3.5 text-foreground whitespace-nowrap flex items-center gap-1.5 font-semibold text-emerald-500">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Live operational matrix (timeouts flagged)
                </td>
                <td className="p-3.5 text-muted-foreground whitespace-nowrap">Silent failures reported as 100% original</td>
              </tr>
              <tr>
                <td className="p-3.5 font-medium text-foreground whitespace-nowrap">Private Content Archive</td>
                <td className="p-3.5 text-foreground whitespace-nowrap flex items-center gap-1.5 font-semibold text-emerald-500">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Isolated sandbox for past essays
                </td>
                <td className="p-3.5 text-muted-foreground whitespace-nowrap">Not supported</td>
              </tr>
              <tr>
                <td className="p-3.5 font-medium text-foreground whitespace-nowrap">Exportable Defensible Audit</td>
                <td className="p-3.5 text-foreground whitespace-nowrap flex items-center gap-1.5 font-semibold text-emerald-500">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> 8-Section audit package (.TXT / JSON)
                </td>
                <td className="p-3.5 text-muted-foreground whitespace-nowrap">Basic score screenshot only</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
