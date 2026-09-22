import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sparkles, ArrowRight, TextSearch, CheckCircle2 } from 'lucide-react';

interface Props {
  onScrollToChecker?: () => void;
}

export const PLAGIARISM_FAQS = [
  {
    q: 'What is a plagiarism checker?',
    a: 'A plagiarism checker is an automated forensic software tool that analyzes submitted text against millions of published academic papers, journal manuscripts, and web sources. It detects exact phrasing overlaps, near-matches, and paraphrased passages to verify originality before academic submission or commercial publication.',
  },
  {
    q: 'How does plagiarism detection work?',
    a: 'The engine segments submitted text into unique phrases, entities, and n-grams. These queries search major scholarly registries (Crossref, OpenAlex, Unpaywall) and live web indices. Discovered source documents are retrieved, normalized, and compared using multi-window exact matching and syntactic semantic models to measure unique non-overlapping textual coverage.',
  },
  {
    q: 'Can plagiarism checkers detect paraphrasing?',
    a: 'Yes. Deep forensic scanning utilizes syntactic sentence-level models to evaluate clause rearrangements, synonym replacements, and passive-to-active voice shifts. We flag these as "likely paraphrased" with verified source excerpts so editors can inspect the context.',
  },
  {
    q: 'Can translated plagiarism be detected?',
    a: 'Yes, where cross-lingual embeddings identify semantic equivalence between an English submission and foreign-language publications across Spanish, French, German, Chinese, Japanese, and other supported languages. We report cross-language candidates conservatively with confidence scores.',
  },
  {
    q: 'What does a plagiarism percentage mean?',
    a: 'Total Similarity represents the percentage of analyzed words that share verifiable textual overlap with discovered sources. It is not necessarily proof of academic dishonesty, as it may include properly cited quotes, standard terminology, or public domain phrases.',
  },
  {
    q: 'Is similarity always plagiarism?',
    a: 'No. Similarity is a technical measure of textual overlap, whereas plagiarism is the unethical presentation of another person\'s work as one\'s own without attribution. Quoted passages with valid citations contribute to raw similarity but are separated from the Plagiarism Risk score.',
  },
  {
    q: 'Can I check research papers?',
    a: 'Yes. AIDetector.cx is specifically calibrated for research papers, integrating with Crossref and OpenAlex across 250M+ scholarly works and extracting full-text manuscripts via Unpaywall open-access repositories.',
  },
  {
    q: 'Can citations create similarity matches?',
    a: 'Yes, because direct quotes naturally match the original author\'s text. Our engine parses standard citation formats (APA, MLA, Chicago, IEEE, Harvard) to classify quoted passages as "Properly Cited & Attributed", excluding them from the Plagiarism Risk calculation.',
  },
  {
    q: 'What is Deep Forensic Scan?',
    a: 'Deep Forensic Scan activates all 17 intelligence engines: multi-window token run expansion, OpenAlex & Crossref deep retrieval, AI Rewrite Source Tracing, citation style parsing, table invariance, code AST checks, and private corpus evaluation.',
  },
  {
    q: 'Does AIDetector.cx show matching sources?',
    a: 'Yes. Every verified match includes the source title, direct URL or DOI, match contribution percentage, and a side-by-side evidence comparison showing your submitted passage alongside the retrieved source excerpt.',
  },
  {
    q: 'Can I compare content against my own documents?',
    a: 'Yes. The Private Student Corpus feature enables you to index your own unpublished essays, classroom drafts, and institutional papers in an isolated, encrypted sandbox to check for self-plagiarism without submitting them to public databases.',
  },
  {
    q: 'What happens when a source provider is unavailable?',
    a: 'If a provider experiences a network timeout or rate limit, AIDetector.cx flags the provider in the Search Coverage & Provider Audit Matrix as "Unavailable / Timeout". The system reports results transparently with a "Limited Coverage" notice rather than falsely claiming 100% originality.',
  },
  {
    q: 'Does 0% similarity guarantee original content?',
    a: 'No tool can guarantee absolute originality. A 0% result indicates that no verified matching passages were discovered across the completed provider searches. Offline books, paywalled private archives, and intranet portals are not indexed.',
  },
];

export function PlagiarismFaqAndCta({ onScrollToChecker }: Props) {
  return (
    <div className="space-y-20 md:space-y-28">

      {/* ── FAQ Section ── */}
      <section className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs px-3 py-1 font-semibold uppercase tracking-wider mb-3">
            Knowledge Base
          </Badge>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            Clear, honest answers regarding similarity scoring, evidence attribution, and technical coverage.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {PLAGIARISM_FAQS.map(({ q, a }, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border border-border rounded-xl px-4 md:px-5 bg-card shadow-xs"
            >
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:text-primary text-left py-4">
                {q}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4 text-pretty">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ── Bottom Conversion CTA ── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-16">
        <Card className="border-border bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 shadow-2xl rounded-3xl overflow-hidden relative p-8 md:p-12 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs px-3 py-1 font-semibold">
              Ready to Audit Your Content?
            </Badge>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              Start Your Plagiarism Check With Verified Evidence
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed text-pretty">
              Inspect exact matches, uncover deep paraphrased passages, trace source origins, and download complete forensic audit packages.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={onScrollToChecker}
                className="w-full sm:w-auto h-11 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 shadow-lg shadow-primary/25"
              >
                <TextSearch className="w-4 h-4" /> Check for Plagiarism Now
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={onScrollToChecker}
                className="w-full sm:w-auto h-11 px-6 border-slate-700 text-slate-200 hover:bg-slate-800/80 font-medium text-xs"
              >
                Launch Deep Forensic Scan
              </Button>
            </div>
            <div className="pt-4 flex items-center justify-center gap-6 text-[11px] text-slate-400 flex-wrap">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Free Tier Allowed
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> No Credit Card Required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 100% Tenant Isolated
              </span>
            </div>
          </div>
        </Card>
      </section>

    </div>
  );
}
