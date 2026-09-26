import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Scissors, Target, FileText, GitCompareArrows, ShieldCheck, Languages, Lock, HelpCircle,
} from 'lucide-react';

export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'How accurate is the AI Summarizer?',
    a: 'Every summary passes automated accuracy checks before it is shown: names and numbers are matched against the source, negation and certainty are reviewed for meaning changes, truncated or duplicated output is rejected, and a separate review pass compares each statement against the source. If the engine cannot produce a summary that passes validation, you receive an honest failure message and nothing is charged. Summaries are still AI-generated — check the source references before relying on a summary for high-stakes work.',
  },
  {
    q: 'What can I upload, and what file types are supported?',
    a: 'You can paste text directly, load article text from public web URLs (HTTP/HTTPS), or upload PDF, DOCX, TXT, HTML, or Markdown files with a readable text layer. Scanned documents and image-only PDFs cannot be summarized because there is no text to extract — you will see a clear error explaining this rather than an empty result. Video and audio summarization are not supported.',
  },
  {
    q: 'How many free summaries do I get?',
    a: 'The AI Summarizer shares the site-wide free trial: one free check as a guest, plus four additional checks after you create a free account. Each trial check covers inputs up to 2,000 words. Longer inputs require plan credits. Copying, downloading, or reopening a completed summary is always free.',
  },
  {
    q: 'How long can the input be?',
    a: 'The minimum is 60 words and the maximum is 10,000 words per summary. Long documents are processed with structured chunking and overlap, followed by a synthesis step — the full document is covered, and if any part cannot be processed you will see a clear partial-coverage notice instead of a silently incomplete summary.',
  },
  {
    q: 'Do you store my text or summaries?',
    a: 'No. Your text and the generated summary are processed in memory and are not saved to our database or logs. Nothing you summarize is used to train models, and private content is never placed in URLs, metadata, or analytics.',
  },
  {
    q: 'What is the difference between Short, Medium, and Detailed?',
    a: 'Short targets roughly 5–12% of the source length, Medium roughly 10–25%, and Detailed roughly 20–45%. These are targets, not promises — the page shows the actual output word count for every summary so you can see exactly what was produced.',
  },
  {
    q: 'Can I summarize in another language?',
    a: 'Yes. The summarizer can write output in 20 languages, including English, Spanish, French, German, Portuguese, Japanese, Korean, and both Simplified and Traditional Chinese, regardless of the source language.',
  },
  {
    q: 'What do source references show?',
    a: 'Key summary statements are linked to the section of your document they came from, with optional exact quotes you can verify yourself. References show where a statement originated — they do not independently verify that the source itself is true.',
  },
];

interface SectionProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ id, icon, title, children }: SectionProps) {
  return (
    <section id={id} className="scroll-mt-24">
      <Card className="min-w-0">
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <span className="text-primary">{icon}</span>
            <CardTitle className="text-lg text-balance">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground text-pretty">
          {children}
        </CardContent>
      </Card>
    </section>
  );
}

export default function AiSummarizerSeoContent() {
  return (
    <div className="container mx-auto max-w-7xl px-4 pb-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center md:text-left">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-balance">
            How to get the most out of the AI Summarizer
          </h2>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            A practical guide to summarizing text, articles, and documents — and to checking what you get back.
          </p>
        </div>

        {/* In-page anchor nav */}
        <nav aria-label="Guide sections" className="flex flex-wrap gap-2">
          {[
            ['#how-to', 'How to summarize'],
            ['#length-format', 'Length & format'],
            ['#by-source', 'Articles, papers & notes'],
            ['#summary-vs-paraphrase', 'Summary vs paraphrase'],
            ['#checking', 'Checking a summary'],
            ['#limits', 'Formats, languages & limits'],
            ['#privacy', 'Privacy'],
            ['#faq', 'FAQ'],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="rounded-full border border-border/70 bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground whitespace-nowrap"
            >
              {label}
            </a>
          ))}
        </nav>

        <Section id="how-to" icon={<Scissors className="w-5 h-5" />} title="How to summarize text">
          <p>
            Start by pasting your text or uploading a document — the summarizer needs at least 60 words and accepts up
            to 10,000. Choose a length (Short, Medium, or Detailed), pick an output format, and press Summarize.
            Everything else happens on one screen: your source stays on the left and the summary appears on the right.
          </p>
          <p>
            If you only care about one aspect of a long report — say, the budget figures — enable Custom focus and
            describe the topic. Focus reorders emphasis, but it never adds facts that are not in your source; if the
            topic is not discussed, the tool tells you so instead of inventing content.
          </p>
          <p>
            One practical tip: summarize the original document, not a summary. Feeding an already-condensed text back
            through the tool compounds omissions — the details dropped by the first pass are gone before the second
            begins.
          </p>
        </Section>

        <Section id="length-format" icon={<Target className="w-5 h-5" />} title="Choosing summary length and format">
          <p>
            Length settings are relative to the source, not fixed word counts. Short aims for roughly 5–12% of the
            original length, Medium for 10–25%, and Detailed for 20–45%. A 3,000-word report summarized at Short should
            come out around 150–360 words; the same report at Detailed can run 600 words or more.
          </p>
          <p>
            Format matters as much as length. Paragraphs preserve the flow and order of an argument, which suits
            essays and news features. Bullet Points split the content into one point per line — better for meeting
            notes and technical documentation. Key Takeaways produces standalone sentences a reader can quote without
            surrounding context, which works well for reports you need to share upward.
          </p>
          <p>
            Because targets are honest rather than guaranteed, every result shows the actual output word count and the
            real length reduction, so you can judge whether the summary is right for your purpose instead of trusting
            a promised length that may not fit your text.
          </p>
        </Section>

        <Section id="by-source" icon={<FileText className="w-5 h-5" />} title="Summarizing articles, reports, research papers, and study notes">
          <p>
            News articles and blog posts summarize well at Short or Medium: pick out the central claim, the key
            actors, and any conditions attached to them. For opinion pieces, the summary keeps the author's framing —
            what is argued stays argued, what is reported stays reported.
          </p>
          <p>
            Research papers benefit from Detailed. The summarizer retains methodology details, sample sizes,
            limitations, and confidence levels stated in the paper, so "correlational finding in 212 participants"
            does not become "proven effect." If a paper's conclusions are hedged, the hedge survives into the summary.
          </p>
          <p>
            For study notes, Key Takeaways format works as a revision aid: each line is a self-contained fact or
            relationship. Because references point back to the section they came from, you can jump straight back to
            the original explanation when a takeaway is unclear.
          </p>
        </Section>

        <Section id="summary-vs-paraphrase" icon={<GitCompareArrows className="w-5 h-5" />} title="Summary versus paraphrase">
          <p>
            A summary compresses: it selects the most important ideas from a longer text and deliberately drops
            detail. A paraphrase restates: it covers the same material at roughly the same length in different words.
            Summarizing a paragraph produces a sentence; paraphrasing it produces a different paragraph.
          </p>
          <p>
            The distinction matters for academic work. Paraphrasing a source without citation is still plagiarism;
            a summary is shorter but the source must still be credited. The AI Summarizer summarizes — if you need a
            full restatement instead, AIDetector.cx's humanizer and rewriting tools handle that separately.
          </p>
          <p>
            It also matters for quotes. The summarizer uses quotation marks only for wording copied exactly from your
            source, so anything in quotes in the output can be checked against the original word for word.
          </p>
        </Section>

        <Section id="checking" icon={<ShieldCheck className="w-5 h-5" />} title="Checking a summary against its source">
          <p>
            Expand the source references under any summary to see which section each key statement came from, with
            optional exact quotes. Spot-check at least the statements you intend to rely on: open the cited section
            and confirm the claim, its numbers, and its conditions match.
          </p>
          <p>
            The automated checks catch unsupported names and numbers, changed negation or certainty, invented
            conclusions, duplicate and truncated output, and references that point outside the document. They do not
            replace your judgment on whether a summary captures what matters for your use case — a technically
            faithful summary can still emphasize the wrong things for your purpose.
          </p>
          <p>
            Keep in mind that references prove origin, not truth: they show the statement came from your source, not
            that your source was correct. Summarizing a document does not validate its claims — for that, use the
            Plagiarism Checker or a citation tool.
          </p>
        </Section>

        <Section id="limits" icon={<Languages className="w-5 h-5" />} title="Supported formats, languages, and limits">
          <p>
            Inputs: pasted text, public web URLs (HTTP/HTTPS), or PDF, DOCX, TXT, HTML, and Markdown files with a readable text layer. Minimum
            60 words, maximum 10,000 words per summary. Scanned documents and image-only PDFs are rejected with an
            explanation, because there is no text to summarize. Video and audio summarization are not offered —
            only pipelines that work end to end are advertised.
          </p>
          <p>
            Output can be written in 20 languages: English, Spanish, French, German, Italian, Portuguese, Dutch,
            Polish, Russian, Turkish, Arabic, Hindi, Indonesian, Japanese, Korean, Simplified Chinese, Traditional
            Chinese, Vietnamese, Thai, and Ukrainian — independent of the source's language.
          </p>
          <p>
            Completed summaries can be copied to the clipboard or downloaded as a TXT file. Copying, downloading, and
            reopening a finished summary never costs anything; only running a new or regenerated summary does.
          </p>
        </Section>

        <Section id="privacy" icon={<Lock className="w-5 h-5" />} title="Privacy and retention practices">
          <p>
            Your text and summaries are processed in memory and are never stored in the database or written to logs.
            Nothing you summarize is used to train models. Private content is not placed in URLs, page metadata, or
            analytics events.
          </p>
          <p>
            Processing uses the platform's shared AI generation backend. The trial and credit accounting records only
            counts and settings — word totals, length, format, language — never the content itself.
          </p>
          <p>
            If you sum up confidential material, the same retention rule applies: once the summary is on your screen,
            the source and result are no longer held anywhere on our side.
          </p>
        </Section>

        <section id="faq" className="scroll-mt-24">
          <Card className="min-w-0">
            <CardHeader>
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg text-balance">Frequently asked questions</CardTitle>
              </div>
              <CardDescription>
                Common questions about accuracy, uploads, and free trial access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {FAQ_ITEMS.map((f, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                      {f.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm leading-relaxed text-muted-foreground text-pretty">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
