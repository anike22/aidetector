import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

/**
 * Supporting guide for the /word-counter page.
 * Rendered BELOW the tool workspace. All counting claims verified
 * against src/utils/wordCounter.ts (see test-verified examples inline).
 */

const GUIDE_SECTIONS = [
  { id: 'how-to-use', label: 'How to use' },
  { id: 'understand-counts', label: 'Understand your counts' },
  { id: 'how-counting-works', label: 'How counting works' },
  { id: 'use-counts', label: 'Use your counts' },
  { id: 'ai-detection-privacy', label: 'AI detection & privacy' },
  { id: 'faq', label: 'FAQ' },
];

const COUNT_DEFINITIONS: Array<{ term: string; definition: string }> = [
  {
    term: 'Words',
    definition: 'The total number of words, counting contractions, hyphenated compounds, numbers, URLs, and email addresses as single words.',
  },
  {
    term: 'Characters',
    definition: 'Every character including spaces, line breaks, and emoji — one emoji counts as one character, not several.',
  },
  {
    term: 'Characters (no spaces)',
    definition: 'The same count with all spaces and line breaks removed. Many submission forms and ad platforms use this figure.',
  },
  {
    term: 'Sentences',
    definition: 'An estimated count based on sentence-ending punctuation, with common abbreviations kept inside their sentence.',
  },
  {
    term: 'Paragraphs',
    definition: 'Blocks of text separated by one or more blank lines. A single line break does not start a new paragraph.',
  },
  {
    term: 'Reading time',
    definition: 'An estimate of silent reading duration at 225 words per minute by default, adjustable in Options.',
  },
  {
    term: 'Speaking time',
    definition: 'An estimate of spoken delivery at 130 words per minute by default, adjustable in Options.',
  },
];

const EDGE_CASES: Array<{ input: string; countedAs: string }> = [
  { input: 'state-of-the-art', countedAs: '1 word' },
  { input: "don’t, O’Connor", countedAs: '1 word each' },
  { input: '3.14159, 2026', countedAs: '1 word each' },
  { input: '$49.99, €12', countedAs: '1 word each' },
  { input: 'user@domain.com', countedAs: '1 word' },
  { input: 'https://example.com/page', countedAs: '1 word' },
  { input: 'Hello 👋', countedAs: '1 word (emoji never count as words)' },
  { input: '人工智能', countedAs: '4 word units (one per character — an approximation, not word segmentation)' },
];

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: 'Is the word counter free?',
    a: 'Yes. Counting, statistics, grammar checking, the thesaurus, word frequency, case conversion, and exports are free and unlimited, and they run entirely in your browser. The optional AI check is the only feature with usage limits.',
  },
  {
    q: 'How are hyphenated words, contractions, and emoji counted?',
    a: '“state-of-the-art” and “don’t” each count as one word. Emoji never count as words; in character totals each emoji counts as a single character. See How counting works above for the full rules and examples.',
  },
  {
    q: 'Will my count match Microsoft Word or Google Docs?',
    a: 'Not always. Every tool applies its own conventions to hyphenated words, numbers, URLs, and emoji, so small differences are normal. This page documents its exact rules in How counting works, so you can rely on it as the source of truth for text counted here.',
  },
  {
    q: 'Which languages are supported?',
    a: 'Counting works for any language that separates words with spaces, including accented characters. For Chinese, Japanese, and Korean, each character is counted as one word unit — a character-based approximation rather than true word segmentation, because those scripts do not use spaces. Sentence detection is an estimate for all languages.',
  },
  {
    q: 'Is my text saved or sent anywhere?',
    a: 'All counting and editing features run locally in your browser. A draft is auto-saved to your browser’s local storage so you can pick up where you left off; clearing the editor or your browser data removes it. Text is transmitted only when you explicitly run an AI check — see AI detection and privacy.',
  },
  {
    q: 'Can I export or upload text?',
    a: 'Yes. You can export your text as TXT, Markdown, HTML, or Word documents, copy it to the clipboard, or upload a plain-text file to count it. Exports and uploads never leave your browser.',
  },
  {
    q: 'Can I change the reading and speaking speed?',
    a: 'Yes. Open Options to set your own words-per-minute values for reading and speaking; both estimates recalculate instantly. The defaults are 225 WPM for reading and 130 WPM for speaking.',
  },
  {
    q: 'What are the limits of the optional AI check?',
    a: 'The AI check requires at least 25 words and can run on your full text or just a selection. Guests get a small number of free checks; registered accounts receive free monthly checks and can continue with credits or a subscription. Running out never affects any counting feature.',
  },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function WordCounterSeoContent() {
  const [activeSection, setActiveSection] = useState<string>('');

  return (
    <section aria-label="Word counter guide" className="mx-auto w-full max-w-[75ch]">
      {/* In-page navigation */}
      <nav aria-label="Guide sections" className="flex flex-wrap items-center gap-x-1 gap-y-1.5 border-t border-border pt-6">
        {GUIDE_SECTIONS.map((s, i) => (
          <span key={s.id} className="flex items-center">
            <a
              href={`#${s.id}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveSection(s.id);
                scrollToSection(s.id);
              }}
              className={`rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
                activeSection === s.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {s.label}
            </a>
            {i < GUIDE_SECTIONS.length - 1 && (
              <span aria-hidden="true" className="mx-0.5 text-border">·</span>
            )}
          </span>
        ))}
      </nav>

      <div className="mt-10 space-y-12">
        {/* A. How to use */}
        <section id="how-to-use" aria-labelledby="how-to-use-heading" className="scroll-mt-24">
          <h2 id="how-to-use-heading" className="text-xl font-semibold tracking-tight text-foreground text-balance">
            How to use the word counter
          </h2>
          <ol className="mt-4 space-y-3 list-decimal list-outside pl-5 text-foreground/90">
            <li className="text-pretty leading-relaxed">
              <strong>Add your text.</strong>{' '}
              <span className="text-muted-foreground">Type, paste, or upload a plain-text file. Every statistic updates as you write.</span>
            </li>
            <li className="text-pretty leading-relaxed">
              <strong>Review your counts.</strong>{' '}
              <span className="text-muted-foreground">Words, characters, sentences, paragraphs, and reading and speaking times update live above the editor. Highlight any passage to count just that part.</span>
            </li>
            <li className="text-pretty leading-relaxed">
              <strong>Adjust or check.</strong>{' '}
              <span className="text-muted-foreground">Set a word target in Advanced View, tune reading and speaking speeds in Options, or run the optional AI check on your text or selection.</span>
            </li>
          </ol>
        </section>

        {/* B. Understand your counts */}
        <section id="understand-counts" aria-labelledby="understand-counts-heading" className="scroll-mt-24">
          <h2 id="understand-counts-heading" className="text-xl font-semibold tracking-tight text-foreground text-balance">
            Understand your counts
          </h2>
          <p className="mt-3 text-muted-foreground text-pretty leading-relaxed">
            Seven statistics update as you type. Here is what each one measures:
          </p>
          <dl className="mt-5 space-y-4">
            {COUNT_DEFINITIONS.map((d) => (
              <div key={d.term} className="grid grid-cols-1 sm:grid-cols-[11rem_1fr] sm:gap-x-5 sm:items-baseline gap-y-1">
                <dt className="text-sm font-semibold text-foreground">{d.term}</dt>
                <dd className="text-sm text-muted-foreground text-pretty leading-relaxed">{d.definition}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* C. How counting works */}
        <section id="how-counting-works" aria-labelledby="how-counting-works-heading" className="scroll-mt-24">
          <h2 id="how-counting-works-heading" className="text-xl font-semibold tracking-tight text-foreground text-balance">
            How counting works
          </h2>

          <h3 className="mt-5 text-base font-semibold text-foreground">Words</h3>
          <p className="mt-2 text-muted-foreground text-pretty leading-relaxed">
            A word is a whitespace-separated unit, with adjustments that match editorial convention:
            hyphenated compounds, contractions, numbers, currency amounts, URLs, and email addresses
            each stay together as one word. Emoji and standalone punctuation never count as words.
          </p>

          <div className="mt-4 w-full max-w-full overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[45%]">Input</TableHead>
                  <TableHead>Counted as</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {EDGE_CASES.map((row) => (
                  <TableRow key={row.input}>
                    <TableCell className="font-medium text-foreground align-top">{row.input}</TableCell>
                    <TableCell className="text-muted-foreground align-top">{row.countedAs}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <h3 className="mt-6 text-base font-semibold text-foreground">Characters</h3>
          <p className="mt-2 text-muted-foreground text-pretty leading-relaxed">
            Characters are counted as user-perceived characters (grapheme clusters), not raw code
            units. “Hello 👋” is 7 characters — the emoji counts once, even though it occupies two
            code units in JavaScript. Combined emoji such as family or profession sequences also
            count as a single character.
          </p>

          <h3 className="mt-6 text-base font-semibold text-foreground">Sentences</h3>
          <p className="mt-2 text-muted-foreground text-pretty leading-relaxed">
            Sentences are an estimate, not an exact linguistic boundary. The counter splits on
            periods, question marks, and exclamation points, but keeps common abbreviations
            (“Dr.”, “e.g.”), decimal numbers, and ellipses inside their sentence — so
            “Pi is approx. 3.14 exactly.” counts as one sentence. Scripts with different
            punctuation conventions are approximated.
          </p>

          <h3 className="mt-6 text-base font-semibold text-foreground">Reading and speaking time</h3>
          <p className="mt-2 text-muted-foreground text-pretty leading-relaxed">
            Both are estimates from your word count —{' '}
            <span className="text-foreground font-medium">seconds = round(words ÷ WPM × 60)</span> —
            not measured completion times. At the defaults (225 WPM reading, 130 WPM speaking),
            152 words reads in about 41 seconds and takes 1 minute 10 seconds to speak; 1,000 words
            read in about 4 minutes 27 seconds and speak for about 7 minutes 42 seconds. Actual
            speed always depends on the reader, the material, and pauses.
          </p>

          <h3 className="mt-6 text-base font-semibold text-foreground">Limitations</h3>
          <ul className="mt-2 space-y-2 list-disc list-outside pl-5 text-muted-foreground text-pretty leading-relaxed">
            <li>
              Chinese, Japanese, and Korean text is counted <strong className="text-foreground font-medium">per character</strong> —
              a character-based approximation, not dictionary-based word segmentation. “人工智能”
              counts as 4 units, though a human might read it as fewer words.
            </li>
            <li>Sentence detection is punctuation-based and approximate, particularly for languages that use different punctuation or no terminal punctuation.</li>
            <li>Counts may differ slightly from Microsoft Word or Google Docs, which apply their own conventions. No tool’s count is wrong — they measure with different rules.</li>
            <li>Reading and speaking times are pacing estimates, not guarantees of real-world duration.</li>
          </ul>
        </section>

        {/* D. Use your counts */}
        <section id="use-counts" aria-labelledby="use-counts-heading" className="scroll-mt-24">
          <h2 id="use-counts-heading" className="text-xl font-semibold tracking-tight text-foreground text-balance">
            Use your counts
          </h2>
          <div className="mt-4 space-y-4">
            <p className="text-muted-foreground text-pretty leading-relaxed">
              <strong className="text-foreground font-semibold">Assignment limits.</strong>{' '}
              Most essay limits refer to total word count. Watch the Words figure while editing, or
              set an exact target in Advanced View to track progress. Highlight a section to count
              it alone — useful for splitting a 500-word budget across an introduction, body, and
              conclusion.
            </p>
            <p className="text-muted-foreground text-pretty leading-relaxed">
              <strong className="text-foreground font-semibold">Article and content length.</strong>{' '}
              Use the reading-time estimate to hit editorial targets — roughly 4½ minutes for a
              1,000-word article at the default speed. The word frequency tool in Advanced View
              shows which terms you repeat most.
            </p>
            <p className="text-muted-foreground text-pretty leading-relaxed">
              <strong className="text-foreground font-semibold">Speaking preparation.</strong>{' '}
              The speaking-time estimate at 130 WPM suits a measured presentation pace; adjust it
              in Options to match how you actually deliver, then confirm with a timed read-through.
            </p>
          </div>
        </section>

        {/* E. AI detection and privacy */}
        <section id="ai-detection-privacy" aria-labelledby="ai-detection-privacy-heading" className="scroll-mt-24">
          <h2 id="ai-detection-privacy-heading" className="text-xl font-semibold tracking-tight text-foreground text-balance">
            AI detection and privacy
          </h2>
          <p className="mt-4 text-muted-foreground text-pretty leading-relaxed">
            Counting measures length. The optional AI check — separate from counting — evaluates
            statistical patterns that distinguish machine-generated phrasing from human writing.
            It requires at least 25 words and can run on your full text or a selection. Guests get
            a small number of free checks; registered accounts receive free monthly checks and can
            continue with credits or a subscription. Running out never affects any counting feature.
            For what detection scores can and cannot tell you, see our guide to{' '}
            <Link to="/guides/how-ai-detection-works" className="text-primary hover:underline">how AI detection works</Link>{' '}
            and the dedicated{' '}
            <Link to="/detector" className="text-primary hover:underline">AI Detector</Link> page.
          </p>
          <p className="mt-4 text-muted-foreground text-pretty leading-relaxed">
            Every counting, grammar, thesaurus, and export feature runs locally in your browser —
            nothing is transmitted while you type. A draft is auto-saved to your browser’s local
            storage and can be removed by clearing the editor or your browser data. Text is sent
            to our servers only when you explicitly click “Check for AI”, and only for that
            analysis. If a draft is flagged and you want it to read more naturally, the{' '}
            <Link to="/humanizer" className="text-primary hover:underline">AI Humanizer</Link>{' '}
            rewrites text while preserving meaning.
          </p>
        </section>

        {/* F. FAQ */}
        <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-24">
          <h2 id="faq-heading" className="text-xl font-semibold tracking-tight text-foreground text-balance">
            Frequently asked questions
          </h2>
          <Accordion type="single" collapsible className="mt-4 w-full">
            {FAQS.map((faq, index) => (
              <AccordionItem key={index} value={`wc-faq-${index}`}>
                <AccordionTrigger className="text-left text-sm sm:text-base font-medium hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent forceMount className="text-sm sm:text-base leading-relaxed text-muted-foreground text-pretty">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </section>
  );
}
