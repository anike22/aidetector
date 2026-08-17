import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  Users,
  Clock,
  ScrollText,
  ShieldCheck,
  ChevronRight,
  Search,
  PenTool,
  Zap,
  Target,
  Lightbulb,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Type,
  BarChart2,
  List,
  MessageSquareQuote,
} from 'lucide-react';

const CANONICAL_URL = 'https://www.aidetector.cx/blog/words-that-trigger-ai-detection';
const OG_IMAGE = 'https://miaoda-site-img.s3cdn.medo.dev/app-icons/app_icon_128c0c18-8557-4863-9f08-5ec933ee3619.png';
const SITE_NAME = 'AIDetector.cx';

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

interface PhraseCategory {
  id: string;
  label: string;
  color: string;
  phrases: string[];
}

const phraseCategories: PhraseCategory[] = [
  {
    id: 'transitions',
    label: 'Transition phrases',
    color: 'bg-primary/20 text-primary',
    phrases: [
      'in addition', 'furthermore', 'moreover', 'consequently', 'therefore',
      'thus', 'hence', 'as a result', 'on the other hand', 'however',
      'nevertheless', 'nonetheless', 'in contrast', 'conversely', 'similarly',
      'likewise', 'for example', 'for instance', 'in particular', 'specifically',
      'in other words', 'to summarize', 'in summary', 'ultimately', 'overall',
    ],
  },
  {
    id: 'intros',
    label: 'Generic introductory phrases',
    color: 'bg-secondary/40 text-secondary-foreground',
    phrases: [
      'in today\'s world', 'in the modern world', 'in recent years', 'with the advent of',
      'in the era of', 'as we all know', 'it is important to note', 'it is worth noting',
      'it should be noted', 'there is no denying that', 'it goes without saying',
      'in this article', 'this article will discuss', 'the purpose of this',
    ],
  },
  {
    id: 'conclusions',
    label: 'Generic conclusion phrases',
    color: 'bg-accent/30 text-accent-foreground',
    phrases: [
      'in conclusion', 'to conclude', 'in closing', 'to sum up', 'all in all',
      'at the end of the day', 'the bottom line is', 'taking everything into account',
      'when all is said and done', 'it is clear that', 'these findings suggest',
    ],
  },
  {
    id: 'academic',
    label: 'Formal academic phrases',
    color: 'bg-info/20 text-info',
    phrases: [
      'it can be argued that', 'this suggests that', 'the evidence indicates',
      'a significant number of', 'a wide range of', 'it is evident that',
      'previous studies have shown', 'according to recent research',
      'the aforementioned', 'in light of', 'with regard to', 'in relation to',
      'the vast majority of', 'a growing body of evidence',
    ],
  },
  {
    id: 'business',
    label: 'Business writing clichés',
    color: 'bg-warning/20 text-warning',
    phrases: [
      'moving forward', 'going forward', 'at this point in time', 'moving the needle',
      'circle back', 'touch base', 'low-hanging fruit', 'best practice',
      'synergy', 'leverage', 'streamline', 'scalable', 'actionable insights',
      'deliverables', 'bandwidth', 'deep dive', 'take this offline', 'paradigm shift',
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing buzzwords',
    color: 'bg-success/20 text-success',
    phrases: [
      'revolutionary', 'game-changing', 'cutting-edge', 'next-generation',
      'unparalleled', 'seamless', 'empower', 'unlock', 'transform',
      'harness the power of', 'innovative solution', 'world-class',
      'ultimate guide', 'boost your', 'skyrocket', 'elevate your',
    ],
  },
  {
    id: 'adjectives',
    label: 'Overused AI adjectives',
    color: 'bg-destructive/10 text-destructive',
    phrases: [
      'comprehensive', 'robust', 'holistic', 'innovative', 'efficient',
      'effective', 'dynamic', 'strategic', 'sustainable', 'impactful',
      'high-quality', 'advanced', 'sophisticated', 'state-of-the-art',
    ],
  },
  {
    id: 'fillers',
    label: 'Common filler expressions',
    color: 'bg-muted text-muted-foreground',
    phrases: [
      'it is', 'there are', 'there is', 'in order to', 'due to the fact that',
      'for the purpose of', 'at the end of', 'in the event that', 'with respect to',
      'in the process of', 'the fact that', 'in terms of',
    ],
  },
];

const overusedWords = [
  'comprehensive', 'robust', 'leverage', 'streamline', 'innovative', 'dynamic',
  'seamless', 'efficient', 'effective', 'impactful', 'holistic', 'strategic',
  'sustainable', 'cutting-edge', 'next-generation', 'game-changing',
  'revolutionary', 'unparalleled', 'world-class', 'ultimate', 'significant',
  'important', 'crucial', 'essential', 'vital', 'numerous', 'various',
  'several', 'many', 'some', 'a lot of', 'thing', 'things', 'stuff', 'very',
  'really', 'just', 'quite', 'basically', 'actually', 'literally', 'definitely',
];

const sentenceStarterMap: Record<string, string> = {
  'in conclusion': 'To wrap up',
  'in summary': 'To summarize',
  'furthermore': 'Also',
  'moreover': 'What is more',
  'therefore': 'So',
  'consequently': 'As a result',
  'however': 'Yet',
  'nevertheless': 'Still',
  'on the other hand': 'Conversely',
  'for example': 'One example is',
  'in addition': 'Also',
  'in today\'s world': 'Today',
  'it is important to note': 'Note',
  'it should be noted': 'Keep in mind',
};

const toc = [
  { id: 'executive-summary', label: 'Executive Summary' },
  { id: 'what-detectors-analyze', label: 'What AI Detectors Actually Analyze' },
  { id: 'do-words-trigger', label: 'Do Certain Words Trigger AI Detection?' },
  { id: 'why-ai-uses-words', label: 'Why Some Words Appear in AI Text' },
  { id: 'psychology', label: 'The Psychology of Repetitive AI Writing' },
  { id: 'style-vs-vocabulary', label: 'Style Matters More Than Vocabulary' },
  { id: 'word-lists', label: 'Categorized Word & Phrase Lists' },
  { id: 'examples', label: 'Before & After Examples' },
  { id: 'interactive-tools', label: 'Interactive Writing Tools' },
  { id: 'myths', label: 'Myths About AI Detection' },
  { id: 'best-practices', label: 'Best Practices for Authentic Content' },
  { id: 'faq', label: 'FAQs' },
  { id: 'sources', label: 'Sources & Disclosure' },
];

const faqs = [
  { q: 'Do certain words trigger AI detection?', a: 'Individual words rarely trigger detection on their own. Modern AI detectors analyze sentence structure, predictability, repetition, burstiness, and overall style — not isolated vocabulary. A word like "furthermore" is perfectly fine if it appears naturally in varied prose.' },
  { q: 'Can replacing words avoid AI detection?', a: 'Simply swapping one word for another usually does not fool a good detector. Detectors look at patterns across many sentences. Natural rewriting — adding specificity, varying sentence length, and using a personal voice — is far more effective than synonym substitution.' },
  { q: 'Why do AI tools repeat certain phrases?', a: 'Language models are trained to predict the most likely next token. Common transitions and formal phrases appear frequently in their training data, so models reuse them at predictable rates, especially in default outputs.' },
  { q: 'What writing patterns look artificial?', a: 'Uniformly medium-length sentences, repetitive transitions, generic intros ("In today\'s world..."), bland conclusions, and hedging phrases stacked in every paragraph. A lack of personal examples, concrete details, or sudden changes in rhythm also looks machine-like.' },
  { q: 'Can human writing contain these words?', a: 'Absolutely. Humans use "furthermore," "however," and "in conclusion" all the time. The difference is variety and context. AI detectors flag <em>patterns</em>, not single words.' },
  { q: 'Why are false positives possible?', a: 'A false positive happens when human writing shares statistical traits with AI writing — for example, highly structured technical prose, formal academic style, or text written by non-native speakers. That is why detectors are screening tools, not proof.' },
  { q: 'Should students remove these words from essays?', a: 'No. Students should write clearly and naturally. Removing every transition would make writing choppy. The goal is variety and authenticity, not eliminating any word that appears on a list.' },
  { q: 'Is there a definitive list of AI trigger words?', a: 'No. Any list is descriptive, not prescriptive. No universal list can determine whether text is AI, because detectors evaluate distributions and style, not a checklist.' },
  { q: 'Are AI buzzwords bad for SEO?', a: 'Overused buzzwords can make content sound generic and may reduce reader trust. SEO rewards originality, expertise, and helpfulness — not repetitive marketing language. Natural, specific wording tends to rank better long term.' },
  { q: 'How can I make AI drafts sound more human?', a: 'Add concrete examples, personal anecdotes, varied sentence lengths, contractions where appropriate, and a clear point of view. Read the text aloud and revise anything that sounds robotic or repetitive.' },
  { q: 'Does sentence length matter for AI detection?', a: 'Yes. Human writing tends to have high "burstiness" — a mix of short and long sentences. AI often produces more uniform sentence length, which detectors notice.' },
  { q: 'Can AI detectors detect paraphrasing?', a: 'Advanced detectors can identify many paraphrased variants, but accuracy drops as the text moves further from the original AI output. Heavy human editing makes detection harder but also more likely to read naturally.' },
  { q: 'What is perplexity in AI detection?', a: 'Perplexity measures how predictable a sequence of words is. AI text usually has lower perplexity because models choose statistically likely next tokens. Human text is less predictable.' },
  { q: 'What is burstiness?', a: 'Burstiness measures variation in sentence length and complexity. High burstiness (lots of variation) is typical of human writing; low burstiness is common in AI output.' },
  { q: 'Are there words that are always safe?', a: 'No word is always safe or always risky. Context and frequency matter. A technical term in a technical document is expected; the same term repeated mechanically across a blog post looks artificial.' },
  { q: 'Can I use AI detectors to edit my own writing?', a: 'Yes. Run your draft through a detector to see which sections score as AI-like, then revise those sections for specificity and voice. It is a feedback tool, not a verdict.' },
  { q: 'Should businesses ban AI-generated content?', a: 'Not necessarily. Many businesses use AI for drafts and then have human experts revise. The key is transparency, quality control, and a review process that ensures accuracy and brand voice.' },
  { q: 'Do AI detectors analyze punctuation?', a: 'Yes, punctuation patterns contribute to style. AI models often use commas, em-dashes, and lists in predictable ways, which detectors can learn.' },
  { q: 'Can a thesaurus defeat AI detection?', a: 'Usually no. Replacing words with synonyms does not change the underlying sentence structure or predictability enough to fool modern detectors.' },
  { q: 'Why does AI writing use so many hedging phrases?', a: 'Models are calibrated to be agreeable and cautious, so they frequently use phrases like "it is important to note," "it can be argued," and "in some cases." These hedges reduce perceived risk but also create repetitive patterns.' },
  { q: 'What are generic conclusion phrases?', a: 'Phrases like "in conclusion," "to sum up," and "all in all" are common AI conclusions. They are not wrong, but using them in every paragraph or section makes writing predictable.' },
  { q: 'What are generic introductory phrases?', a: 'Openings like "In today\'s world," "With the advent of," and "It is important to note" are overused because they apply to almost any topic. Specific openings are stronger.' },
  { q: 'How do I write a strong conclusion without clichés?', a: 'Restate the core insight in a new way, point to the next step, or include a concrete takeaway. Avoid generic summary phrases when the conclusion is already obvious.' },
  { q: 'Can humanized AI text still be detected?', a: 'Sometimes. Quality humanization raises the bar, but advanced detectors look for residual patterns from the rewriting process as well as the original AI signal.' },
  { q: 'Are AI detection scores definitive?', a: 'No. Scores represent probability, not certainty. A high score means the text strongly resembles AI output; it does not prove authorship.' },
  { q: 'How should teachers use AI detection?', a: 'As a conversation starter, not an accusation. Pair detector results with plagiarism checks, writing-process evidence, and a discussion with the student.' },
  { q: 'What is the best AI detector?', a: 'The best detector depends on your use case. AIDetector.cx is a strong all-rounder for SEO, education, and enterprise. See our <a href="/guides/best-ai-detector">Best AI Detector</a> guide for a full comparison.' },
  { q: 'Where can I test my text for AI patterns?', a: 'Use the <a href="/detector">AIDetector.cx AI Detector</a> to analyze text and see sentence-level scores. You can also use the interactive tools on this page for quick self-editing.' },
  { q: 'How often should I update AI-generated content?', a: 'Treat AI drafts as a starting point. Review for accuracy, add original examples, and revise for voice. The best content is human-refreshed, not published raw.' },
  { q: 'Can AI write genuinely original content?', a: 'AI generates novel combinations of existing patterns, but it cannot provide lived experience, original research, or personal perspective. Human contribution remains essential for truly original work.' },
];

const beforeAfterExamples = [
  {
    title: 'Academic paragraph',
    before: 'In today\'s world, climate change is a very important issue. Furthermore, it is evident that human activities have a significant impact on the environment. Therefore, it is crucial to take action in order to mitigate these effects.',
    after: 'Climate change is no longer a distant threat — it is reshaping coastlines, crop yields, and insurance markets. Human activities, especially burning fossil fuels, are the dominant driver. Policymakers now face the harder task of choosing which adaptation measures to fund first.',
    notes: 'The rewrite removes generic openings and stacked hedges. It replaces vague adjectives with concrete details.',
  },
  {
    title: 'Marketing copy',
    before: 'Our revolutionary, cutting-edge AI solution delivers seamless, world-class results. Unlock the power of innovation and transform your business with our unparalleled platform.',
    after: 'Our AI tool trims hours from weekly reporting. One customer, a 200-person logistics firm, cut report prep from three days to four hours. See how it could fit your workflow.',
    notes: 'Specific results and a customer example replace empty buzzwords. The tone shifts from hype to proof.',
  },
  {
    title: 'Business email',
    before: 'Moving forward, I wanted to circle back on the deliverables. At this point in time, we need to streamline the process and leverage our best practices to move the needle.',
    after: 'By Friday, can you send the final draft? Once I have it, I will combine the three sections into one document and share it with the team before Monday\'s review.',
    notes: 'Direct requests and deadlines replace business clichés. The reader knows exactly what to do and when.',
  },
  {
    title: 'Blog introduction',
    before: 'In this article, we will discuss the best ways to improve your writing. It is important to note that writing well can have a significant impact on your career.',
    after: 'A single unclear email can cost a sale, delay a project, or confuse a team. This post shows five small changes that make professional writing sharper and faster to read.',
    notes: 'A concrete opening scenario replaces the generic announcement. The reader sees the benefit immediately.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100)) : 0;
      setProgress(pct);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-transparent">
      <div className="h-full bg-primary transition-all duration-150 ease-out" style={{ width: `${progress}%` }} aria-hidden="true" />
    </div>
  );
}

function StickyToc({ activeId }: { activeId: string }) {
  return (
    <aside className="hidden xl:block w-72 shrink-0">
      <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <BookOpen className="h-4 w-4 text-primary" /> Table of Contents
        </p>
        <nav aria-label="Article sections">
          <ul className="space-y-2">
            {toc.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={`block rounded-md px-2 py-1.5 text-sm transition-colors ${
                    activeId === item.id
                      ? 'bg-accent/10 font-medium text-accent'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

function Callout({ title, children, variant = 'info' }: { title?: React.ReactNode; children: React.ReactNode; variant?: 'info' | 'warning' | 'success' }) {
  const styles = {
    info: 'bg-primary/5 border-primary/20 text-primary',
    warning: 'bg-warning/10 border-warning/20 text-warning',
    success: 'bg-success/10 border-success/20 text-success',
  };
  return (
    <div className={`my-8 rounded-2xl border p-6 ${styles[variant]}`}>
      {title && <h3 className="mb-3 text-lg font-semibold">{title}</h3>}
      <div className="text-foreground/90 leading-relaxed text-sm md:text-base">{children}</div>
    </div>
  );
}

function CtaBox({ title, description, to, label }: { title: string; description: string; to: string; label: string }) {
  return (
    <div className="my-10 rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
          <p className="mt-1 max-w-2xl text-muted-foreground">{description}</p>
        </div>
        <Button asChild className="shrink-0">
          <Link to={to}>{label} <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </div>
    </div>
  );
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTIVE TOOLS
// ─────────────────────────────────────────────────────────────────────────────

function PhraseFinder() {
  const [text, setText] = useState('');
  const [activeCats, setActiveCats] = useState<Set<string>>(new Set(phraseCategories.map((c) => c.id)));

  const categories = useMemo(() => phraseCategories.filter((c) => activeCats.has(c.id)), [activeCats]);

  const matches = useMemo(() => {
    const result: { phrase: string; category: string; count: number }[] = [];
    categories.forEach((cat) => {
      cat.phrases.forEach((phrase) => {
        const regex = new RegExp(`\\b${escapeRegex(phrase)}\\b`, 'gi');
        const hits = (text.match(regex) || []).length;
        if (hits > 0) result.push({ phrase, category: cat.label, count: hits });
      });
    });
    return result;
  }, [text, categories]);

  const highlighted = useMemo(() => {
    if (!text) return null;
    const allMatches: { start: number; end: number; color: string; category: string }[] = [];
    categories.forEach((cat) => {
      cat.phrases.forEach((phrase) => {
        const regex = new RegExp(`\\b${escapeRegex(phrase)}\\b`, 'gi');
        let m: RegExpExecArray | null;
        while ((m = regex.exec(text)) !== null) {
          allMatches.push({ start: m.index, end: m.index + m[0].length, color: cat.color, category: cat.label });
        }
      });
    });
    allMatches.sort((a, b) => a.start - b.start);
    // Merge overlapping/adjacent; keep first category
    const merged: typeof allMatches = [];
    allMatches.forEach((m) => {
      const last = merged[merged.length - 1];
      if (last && m.start <= last.end) {
        last.end = Math.max(last.end, m.end);
      } else {
        merged.push({ ...m });
      }
    });
    const nodes: React.ReactNode[] = [];
    let pos = 0;
    merged.forEach((m, idx) => {
      if (m.start > pos) nodes.push(<span key={`pre-${idx}`}>{text.slice(pos, m.start)}</span>);
      nodes.push(
        <mark key={idx} className={`rounded px-0.5 ${m.color}`} title={m.category}>
          {text.slice(m.start, m.end)}
        </mark>
      );
      pos = m.end;
    });
    if (pos < text.length) nodes.push(<span key="post">{text.slice(pos)}</span>);
    return nodes;
  }, [text, categories]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Paste text to see which commonly overused phrases appear. Select categories to filter the highlight.
      </p>
      <div className="flex flex-wrap gap-2">
        {phraseCategories.map((cat) => {
          const active = activeCats.has(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => {
                const next = new Set(activeCats);
                if (active) next.delete(cat.id); else next.add(cat.id);
                setActiveCats(next);
              }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:bg-muted'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste a paragraph here..." rows={6} />
      {text && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-2 text-sm font-semibold text-foreground">Highlighted text</p>
          <p className="min-h-[4rem] leading-relaxed text-sm text-foreground">{highlighted}</p>
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-foreground">Found {matches.reduce((a, m) => a + m.count, 0)} phrase occurrences</p>
            {matches.length > 0 ? (
              <ul className="grid gap-1 sm:grid-cols-2">
                {matches.map((m, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{m.phrase}</span> — {m.category} ({m.count})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No listed phrases detected.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function OverusedWordHighlighter() {
  const [text, setText] = useState('');

  const { wordCounts, totalWords, highlighted } = useMemo(() => {
    const words = text.toLowerCase().match(/[a-z0-9']+/g) || [];
    const total = words.length;
    const counts: Record<string, number> = {};
    words.forEach((w) => {
      if (overusedWords.includes(w)) counts[w] = (counts[w] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

    const nodes: React.ReactNode[] = [];
    const regex = new RegExp(`\\b(${overusedWords.map(escapeRegex).join('|')})\\b`, 'gi');
    let last = 0;
    let m: RegExpExecArray | null;
    let idx = 0;
    while ((m = regex.exec(text)) !== null) {
      if (m.index > last) nodes.push(<span key={`pre-${idx}`}>{text.slice(last, m.index)}</span>);
      nodes.push(<mark key={idx} className="rounded bg-warning/20 px-0.5 text-warning">{text.slice(m.index, m.index + m[0].length)}</mark>);
      last = m.index + m[0].length;
      idx++;
    }
    if (last < text.length) nodes.push(<span key="post">{text.slice(last)}</span>);

    return { wordCounts: sorted, totalWords: total, highlighted: nodes };
  }, [text]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Paste text to highlight commonly overused words. This is a self-editing aid, not a detector.
      </p>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your draft..." rows={6} />
      {text && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-2 text-sm font-semibold text-foreground">Highlighted text</p>
          <p className="min-h-[4rem] leading-relaxed text-sm text-foreground">{highlighted}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-foreground">Word count: {totalWords}</p>
              <p className="text-xs text-muted-foreground">Overused words found: {wordCounts.length}</p>
            </div>
            <ul className="space-y-1">
              {wordCounts.slice(0, 8).map(([word, count]) => (
                <li key={word} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{word}</span>
                  <span className="font-medium text-foreground">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function VarietyChecker() {
  const [text, setText] = useState('');

  const metrics = useMemo(() => {
    if (!text.trim()) return null;
    const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
    const sentenceWordCounts = sentences.map((s) => s.split(/\s+/).filter(Boolean).length).filter((n) => n > 0);
    const avgSentenceLen = sentenceWordCounts.length ? sentenceWordCounts.reduce((a, b) => a + b, 0) / sentenceWordCounts.length : 0;
    const variance = sentenceWordCounts.length
      ? sentenceWordCounts.reduce((a, n) => a + Math.pow(n - avgSentenceLen, 2), 0) / sentenceWordCounts.length
      : 0;
    const stdDev = Math.sqrt(variance);

    const words = text.toLowerCase().match(/[a-z0-9']+/g) || [];
    const unique = new Set(words);
    const lexicalDiversity = words.length ? unique.size / words.length : 0;

    const starters: Record<string, number> = {};
    sentences.forEach((s) => {
      const first = s.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (first) starters[first] = (starters[first] || 0) + 1;
    });
    const topStarters = Object.entries(starters).sort((a, b) => b[1] - a[1]).slice(0, 3);

    return { sentenceCount: sentences.length, avgSentenceLen, stdDev, lexicalDiversity, topStarters, totalWords: words.length };
  }, [text]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Check sentence-length variety, lexical diversity, and repetitive sentence starters. Variety is a hallmark of natural writing.
      </p>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste a few paragraphs..." rows={6} />
      {metrics && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <Metric label="Sentences" value={metrics.sentenceCount} />
            <Metric label="Avg sentence length" value={metrics.avgSentenceLen.toFixed(1)} />
            <Metric label="Length std dev" value={metrics.stdDev.toFixed(1)} />
            <Metric label="Lexical diversity" value={(metrics.lexicalDiversity * 100).toFixed(1) + '%'} />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-foreground">Top sentence starters</p>
            {metrics.topStarters.length ? (
              <ul className="space-y-1">
                {metrics.topStarters.map(([word, count]) => (
                  <li key={word} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{word}</span>
                    <span className="font-medium text-foreground">{count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No sentence starters detected.</p>
            )}
          </div>
          <Suggestions metrics={metrics} />
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3 text-center">
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Suggestions({ metrics }: { metrics: { avgSentenceLen: number; stdDev: number; lexicalDiversity: number; topStarters: [string, number][] } }) {
  const items: string[] = [];
  if (metrics.avgSentenceLen > 25) items.push('Try breaking a few long sentences into two shorter ones.');
  if (metrics.stdDev < 4) items.push('Sentence length is very uniform. Add some short, punchy sentences and a few longer ones for rhythm.');
  if (metrics.lexicalDiversity < 0.45) items.push('Lexical diversity is low. Replace repeated words with specifics or synonyms when appropriate.');
  if (metrics.topStarters.length && metrics.topStarters[0][1] > 3) items.push(`You start sentences with "${metrics.topStarters[0][0]}" often. Vary your openings.`);
  if (items.length === 0) items.push('Your text shows healthy variety. Keep reviewing for any overused phrases.');

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-foreground">Suggestions</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-muted-foreground"><Lightbulb className="h-4 w-4 shrink-0 text-primary" /> <span>{item}</span></li>
        ))}
      </ul>
    </div>
  );
}

function SentenceRewriteSuggestions() {
  const [text, setText] = useState('');

  const rewrites = useMemo(() => {
    if (!text.trim()) return [];
    const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
    return sentences.map((sentence) => {
      const lower = sentence.toLowerCase();
      const match = Object.keys(sentenceStarterMap).find((phrase) => lower.startsWith(phrase));
      const suggestion = match ? sentenceStarterMap[match] : null;
      return { original: sentence, suggestion };
    }).filter((r) => r.suggestion);
  }, [text]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Paste text to see alternative openings for common generic sentence starters. Use the suggestions only when they fit your voice.
      </p>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste sentences here..." rows={6} />
      {rewrites.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">Suggested rewrites ({rewrites.length})</p>
          {rewrites.slice(0, 10).map((r, i) => (
            <div key={i} className="rounded-xl border border-border bg-background p-3 text-sm">
              <p className="mb-1 text-muted-foreground">Original: <span className="italic text-foreground">{r.original}</span></p>
              <p className="text-foreground">Try: <span className="font-medium text-primary">{r.suggestion}{r.original.slice(r.original.toLowerCase().indexOf(Object.keys(sentenceStarterMap).find((p) => r.original.toLowerCase().startsWith(p)) || '') + (Object.keys(sentenceStarterMap).find((p) => r.original.toLowerCase().startsWith(p))?.length || 0))}</span></p>
            </div>
          ))}
        </div>
      )}
      {text && rewrites.length === 0 && (
        <p className="text-sm text-muted-foreground">No common generic sentence starters detected. Good variety.</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'List of Words That Trigger AI Detection: What Actually Makes Text Look AI-Generated',
  description:
    'A transparent guide to words and phrases commonly associated with AI-generated writing. Learn what detectors actually analyze, why some patterns look artificial, and how to write more naturally.',
  image: OG_IMAGE,
  author: {
    '@type': 'Person',
    name: 'Dr. Elena Voss',
    description: 'Computational linguist and editorial lead at AIDetector.cx',
  },
  reviewer: {
    '@type': 'Person',
    name: 'Marcus Chen',
    description: 'Senior machine-learning engineer and detection researcher',
  },
  publisher: {
    '@type': 'Organization',
    name: SITE_NAME,
    logo: { '@type': 'ImageObject', url: OG_IMAGE },
  },
  datePublished: '2026-06-01',
  dateModified: '2026-06-01',
  mainEntityOfPage: { '@type': 'WebPage', '@id': CANONICAL_URL },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a.replace(/<[^>]+>/g, '') },
  })),
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.aidetector.cx/' },
    { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.aidetector.cx/blog' },
    { '@type': 'ListItem', position: 3, name: 'Words That Trigger AI Detection', item: CANONICAL_URL },
  ],
};

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to Make AI-Assisted Writing Sound More Natural',
  description: 'A step-by-step process for improving AI drafts so they read like authentic human writing.',
  step: [
    { '@type': 'HowToStep', name: 'Analyze your draft', text: 'Paste the text into an AI detector and an overused-phrase checker to identify high-risk sections.' },
    { '@type': 'HowToStep', name: 'Add specifics', text: 'Replace generic claims with concrete examples, numbers, dates, and personal details.' },
    { '@type': 'HowToStep', name: 'Vary sentence rhythm', text: 'Mix short and long sentences. Break up predictable patterns.' },
    { '@type': 'HowToStep', name: 'Remove redundant transitions', text: 'Use transitions only when they improve clarity. Avoid stacking multiple formal phrases in one paragraph.' },
    { '@type': 'HowToStep', name: 'Read aloud and verify', text: 'Read the final version aloud. If it sounds robotic, revise again and run a final detector check.' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function WordsThatTriggerAIDetectionPage() {
  const [activeId, setActiveId] = useState<string>(toc[0].id);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const handleIntersect: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveId(entry.target.id);
      });
    };
    observerRef.current = new IntersectionObserver(handleIntersect, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
    toc.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  const faqSchemaMemo = useMemo(() => faqSchema, []);

  return (
    <MainLayout>
      <PageMeta
        title="List of Words That Trigger AI Detection | AIDetector.cx"
        description="Learn what AI detectors actually analyze, which words and phrases are commonly associated with AI-generated text, and how to write more naturally without keyword games."
        canonicalUrl={CANONICAL_URL}
        ogTitle="List of Words That Trigger AI Detection: What Really Makes Text Look AI-Generated"
        ogDescription="A transparent guide to AI writing patterns, overused phrases, and practical ways to improve your natural voice."
        ogImage={OG_IMAGE}
        ogType="article"
        schemas={[articleSchema, faqSchemaMemo, breadcrumbSchema, howToSchema]}
      />

      <ReadingProgress />

      <article className="mx-auto flex max-w-7xl gap-8 px-4 py-10 md:py-16">
        <div className="min-w-0 flex-1">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="mx-2 h-4 w-4" />
            <Link to="/blog" className="hover:text-primary">Blog</Link>
            <ChevronRight className="mx-2 h-4 w-4" />
            <span className="text-foreground">Words That Trigger AI Detection</span>
          </nav>

          {/* Header */}
          <header className="mb-12">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <Badge variant="secondary">Writing Guide</Badge>
              <span className="text-sm text-muted-foreground">Updated June 2026</span>
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-success" /> Fact-Checked
              </span>
            </div>
            <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-balance md:text-5xl lg:text-6xl">
              List of Words That Trigger AI Detection: <span className="text-transparent bg-clip-text bg-gradient-primary">What Actually Makes Text Look AI-Generated</span>
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-muted-foreground md:text-xl">
              There is no magic list of forbidden words. Modern AI detectors evaluate style, structure, predictability, and repetition — not individual vocabulary. This guide explains why certain words and phrases are associated with AI output, how to use them naturally, and how to improve your writing without playing keyword games.
            </p>

            <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-5 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Author</p>
                  <p className="font-semibold text-foreground">Dr. Elena Voss</p>
                </div>
              </div>
              <div className="hidden h-10 w-px bg-border md:block" />
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <ScrollText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reviewer</p>
                  <p className="font-semibold text-foreground">Marcus Chen, MLE</p>
                </div>
              </div>
              <div className="hidden h-10 w-px bg-border md:block" />
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reading Time</p>
                  <p className="font-semibold text-foreground">14 min read</p>
                </div>
              </div>
            </div>
          </header>

          {/* Mobile TOC */}
          <nav className="mb-12 rounded-2xl border border-border bg-card p-5 shadow-sm xl:hidden">
            <p className="mb-3 flex items-center gap-2 font-semibold text-foreground">
              <BookOpen className="h-5 w-5 text-primary" /> Table of Contents
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {toc.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Executive Summary */}
          <section id="executive-summary" className="scroll-mt-28">
            <Callout title="Quick answer" variant="success">
              <p className="mb-3">
                <strong>There is no universal list of words that trigger AI detection.</strong> Detectors analyze patterns across many sentences: sentence length distribution, transition frequency, vocabulary predictability, and semantic structure. A single word like "furthermore" or "leverage" is not a trigger unless it appears in a repetitive, machine-like context.
              </p>
              <p className="m-0">
                If you want your writing to look natural, focus on variety, specificity, and voice. Do not try to swap every "AI word" for a synonym. That approach often makes text awkward and still leaves the underlying style patterns intact.
              </p>
            </Callout>
          </section>

          {/* What Detectors Analyze */}
          <section id="what-detectors-analyze" className="scroll-mt-28 py-4">
            <h2 className="mb-5 text-2xl font-bold text-balance md:text-4xl">What AI Detectors Actually Analyze</h2>
            <p className="mb-4 leading-relaxed text-muted-foreground">
              Modern AI detectors are statistical classifiers. They compare a piece of text to distributions learned from millions of human and AI-generated samples. The classifiers do not scan for a checklist of forbidden words. They measure how likely it is that a human would have produced the exact sequence of words, sentences, and structures in front of them.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base"><BarChart2 className="h-5 w-5 text-primary" /> Perplexity</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Perplexity measures predictability. AI tends to choose the most statistically likely next word, so AI text is often more predictable than human text.
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base"><Zap className="h-5 w-5 text-primary" /> Burstiness</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Burstiness tracks variation in sentence length and complexity. Human writing is erratic; AI writing is more uniform.
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base"><Target className="h-5 w-5 text-primary" /> Repetition & Transitions</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Detectors notice when the same transitions, hedges, or sentence starters appear at predictable intervals.
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base"><PenTool className="h-5 w-5 text-primary" /> Style & Semantics</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Model-specific patterns, argument structure, hedging density, and semantic coherence all contribute to the final score.
                </CardContent>
              </Card>
            </div>

            <Callout title="Why this matters" variant="info">
              <p className="m-0">
                Because detectors evaluate distributions, a human essay with a few formal transitions can still score as human, and a heavily edited AI draft can still score as AI. The pattern is what counts. Learn more in our <Link to="/guides/how-ai-detection-works" className="underline">How AI Detection Works</Link> guide.
              </p>
            </Callout>
          </section>

          {/* Do Certain Words Trigger */}
          <section id="do-words-trigger" className="scroll-mt-28 py-4">
            <h2 className="mb-5 text-2xl font-bold text-balance md:text-4xl">Do Certain Words Trigger AI Detection?</h2>
            <p className="mb-4 leading-relaxed text-muted-foreground">
              No. The phrase "trigger word" is misleading. A detector does not maintain a blacklist of vocabulary. Instead, it learns that certain combinations of words, sentence structures, and stylistic habits are more common in AI training data.
            </p>
            <p className="mb-4 leading-relaxed text-muted-foreground">
              For example, "furthermore" appears in both human and AI writing. If a human historian uses it once in a 3,000-word chapter, the detector will not care. If an AI summary uses "furthermore" three times in the same paragraph, followed by "moreover" and "therefore," the pattern becomes statistically AI-like.
            </p>
            <p className="mb-4 leading-relaxed text-muted-foreground">
              This is why guides that promise a simple list of "words to avoid" are incomplete. The same word can be natural or suspicious depending on frequency, context, and the surrounding sentence structure.
            </p>

            <CtaBox
              title="Test your own text"
              description="Paste any paragraph into AIDetector.cx to see how its sentence-level analysis evaluates style and structure."
              to="/detector"
              label="Check Your Text"
            />
          </section>

          {/* Why AI Uses Words */}
          <section id="why-ai-uses-words" className="scroll-mt-28 py-4">
            <h2 className="mb-5 text-2xl font-bold text-balance md:text-4xl">Why Some Words Appear Frequently in AI-Generated Text</h2>
            <p className="mb-4 leading-relaxed text-muted-foreground">
              Language models are trained on massive text corpora. They learn which words are most likely to appear in formal, informative, and agreeable contexts. When asked to write a neutral summary, a model defaults to the safest, most common patterns — which often means formal transitions, hedges, and widely applicable adjectives.
            </p>
            <ul className="mb-6 space-y-2">
              {[
                'Default prompts usually ask for neutral, polished prose.',
                'Models avoid controversial or personal language, producing bland, universal phrasing.',
                'Training data contains lots of academic, business, and marketing text, so models repeat that register.',
                'Models use hedges ("it can be argued," "in some cases") to reduce risk and perceived overstatement.',
                'Generated text often lacks the concrete details that naturally constrain human word choice.',
              ].map((item, i) => (
                <li key={i} className="flex gap-2 text-muted-foreground"><CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> <span>{item}</span></li>
              ))}
            </ul>
            <Callout title="The register problem" variant="warning">
              <p className="m-0">
                Much AI output reads like a generic encyclopedia article or a cautious business memo. That register is not wrong, but it becomes predictable when every paragraph uses the same transitions, hedges, and conclusion phrases.
              </p>
            </Callout>
          </section>

          {/* Psychology */}
          <section id="psychology" className="scroll-mt-28 py-4">
            <h2 className="mb-5 text-2xl font-bold text-balance md:text-4xl">The Psychology of Repetitive AI Writing</h2>
            <p className="mb-4 leading-relaxed text-muted-foreground">
              Human writers make choices based on memory, emotion, and immediate context. They reuse a word because it feels right, then deliberately avoid it in the next sentence. They interrupt themselves, use fragments, and change tone mid-paragraph.
            </p>
            <p className="mb-4 leading-relaxed text-muted-foreground">
              AI does not have those impulses. It generates tokens one at a time based on probability. Without explicit prompting, it will keep choosing the next most likely formal word. That creates a smooth, repetitive surface that feels safe but soulless.
            </p>
            <p className="mb-4 leading-relaxed text-muted-foreground">
              The goal of natural editing is to reintroduce human decision-making: where to be specific, where to be brief, where to surprise the reader, and where to sound like yourself.
            </p>
          </section>

          {/* Style vs Vocabulary */}
          <section id="style-vs-vocabulary" className="scroll-mt-28 py-4">
            <h2 className="mb-5 text-2xl font-bold text-balance md:text-4xl">Style Matters More Than Vocabulary</h2>
            <p className="mb-4 leading-relaxed text-muted-foreground">
              You can write an entire paragraph using words from every list on this page and still sound human. Conversely, you can replace every suspect word with a synonym and still sound like AI if the sentence rhythm, argument structure, and hedging patterns remain mechanical.
            </p>

            <h3 className="mb-3 mt-6 text-xl font-semibold">Five style signals that matter most</h3>
            <div className="space-y-3">
              {[
                { title: 'Sentence-length variety', desc: 'A mix of short and long sentences. Avoid uniform 18–22 word sentences.' },
                { title: 'Specificity', desc: 'Concrete nouns, dates, names, and examples instead of general claims.' },
                { title: 'Voice', desc: 'A clear point of view, occasional contractions, and personal asides where appropriate.' },
                { title: 'Transition discipline', desc: 'Use transitions when they improve clarity, not as every sentence glue.' },
                { title: 'Hedge control', desc: 'Avoid stacking cautious phrases like "it can be argued that" and "in some cases" back-to-back.' },
              ].map((s, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="py-4">
                    <p className="font-semibold text-foreground">{s.title}</p>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <CtaBox
              title="Analyze your writing style"
              description="Use the interactive tools below to spot repetitive phrases, overused words, and sentence variety issues in your draft."
              to="#interactive-tools"
              label="Analyze My Writing"
            />
          </section>

          {/* Word Lists */}
          <section id="word-lists" className="scroll-mt-28 py-4">
            <h2 className="mb-5 text-2xl font-bold text-balance md:text-4xl">Categorized Word & Phrase Lists</h2>
            <p className="mb-6 leading-relaxed text-muted-foreground">
              The lists below are descriptive, not prescriptive. They show words and phrases that appear often in AI output because models tend toward formal, agreeable, and universal language. Use them when they fit your context; avoid stacking them or repeating them mechanically.
            </p>

            {phraseCategories.map((cat) => (
              <Card key={cat.id} id={`category-${cat.id}`} className="mb-6 border-border">
                <CardHeader>
                  <CardTitle className="text-lg">{cat.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {cat.phrases.map((phrase) => (
                      <Badge key={phrase} variant="outline" className="font-normal">
                        {phrase}
                      </Badge>
                    ))}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="mb-1 text-sm font-semibold text-foreground">Why AI overuses it</p>
                      <p className="text-sm text-muted-foreground">
                        {cat.id === 'transitions' && 'Transitions make text coherent. Models use them as default connectors because they are safe and broadly applicable.'}
                        {cat.id === 'intros' && 'Generic intros work for almost any topic, so models use them as low-risk openers.'}
                        {cat.id === 'conclusions' && 'Models learn that summaries often begin with these phrases, so they reproduce them.'}
                        {cat.id === 'academic' && 'Training data contains lots of academic prose; models imitate its cautious, formal register.'}
                        {cat.id === 'business' && 'Business jargon is common in corporate training data and prompt instructions.'}
                        {cat.id === 'marketing' && 'Marketing copy rewards enthusiasm, so models reach for superlatives and power verbs.'}
                        {cat.id === 'adjectives' && 'Vague positive adjectives are safe descriptions when the model lacks specific details.'}
                        {cat.id === 'fillers' && 'Filler phrases pad sentences and feel formal, so models rely on them to sound complete.'}
                      </p>
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-semibold text-foreground">Better alternatives</p>
                      <p className="text-sm text-muted-foreground">
                        {cat.id === 'transitions' && 'Replace some transitions with implicit logic, paragraph breaks, or specific connectors like "Tuesday," "meanwhile," or "because."'}
                        {cat.id === 'intros' && 'Start with a concrete fact, a question, a quote, or a brief scene relevant to the reader.'}
                        {cat.id === 'conclusions' && 'End with the key takeaway, a next step, or a concrete implication rather than a generic summary.'}
                        {cat.id === 'academic' && 'Use direct evidence and active verbs: "The 2023 study found" instead of "previous studies have shown."'}
                        {cat.id === 'business' && 'Replace abstractions with deadlines, owners, and actions: "Send the draft by Friday" instead of "circle back."'}
                        {cat.id === 'marketing' && 'Use proof and specifics: customer names, metrics, and outcomes instead of superlatives.'}
                        {cat.id === 'adjectives' && 'Add a precise noun or number: "cut loading time from 4.2 seconds to 0.8 seconds" instead of "fast."'}
                        {cat.id === 'fillers' && 'Delete the filler or restructure the sentence to lead with the actor and action.'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          {/* Examples */}
          <section id="examples" className="scroll-mt-28 py-4">
            <h2 className="mb-5 text-2xl font-bold text-balance md:text-4xl">Before & After Examples</h2>
            <p className="mb-6 leading-relaxed text-muted-foreground">
              These original examples show repetitive, AI-style drafts and the same ideas rewritten with specificity, rhythm, and voice. The improvements come from adding concrete details and removing stacked formal phrases, not from replacing every word.
            </p>

            {beforeAfterExamples.map((ex, i) => (
              <Card key={i} className="mb-6 border-border">
                <CardHeader>
                  <CardTitle className="text-lg">{ex.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Before</p>
                    <p className="text-sm italic text-foreground">{ex.before}</p>
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">After</p>
                    <p className="text-sm text-foreground">{ex.after}</p>
                  </div>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <Lightbulb className="h-4 w-4 shrink-0 text-primary" />
                    <span>{ex.notes}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          {/* Interactive Tools */}
          <section id="interactive-tools" className="scroll-mt-28 py-4">
            <h2 className="mb-5 text-2xl font-bold text-balance md:text-4xl">Interactive Writing Tools</h2>
            <p className="mb-6 leading-relaxed text-muted-foreground">
              Use these tools to spot patterns in your own drafts. They are self-editing aids, not AI detectors. For a full detector analysis, use the <Link to="/detector" className="underline">AIDetector.cx AI Detector</Link>.
            </p>

            <Tabs defaultValue="phrases" className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="phrases"><Search className="mr-2 h-4 w-4" /> Phrase Finder</TabsTrigger>
                <TabsTrigger value="words"><Type className="mr-2 h-4 w-4" /> Word Highlighter</TabsTrigger>
                <TabsTrigger value="variety"><BarChart2 className="mr-2 h-4 w-4" /> Variety Checker</TabsTrigger>
                <TabsTrigger value="rewrite"><RefreshCw className="mr-2 h-4 w-4" /> Rewrites</TabsTrigger>
              </TabsList>
              <TabsContent value="phrases"><PhraseFinder /></TabsContent>
              <TabsContent value="words"><OverusedWordHighlighter /></TabsContent>
              <TabsContent value="variety"><VarietyChecker /></TabsContent>
              <TabsContent value="rewrite"><SentenceRewriteSuggestions /></TabsContent>
            </Tabs>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <CtaBox title="AI Detector" description="Get a sentence-level AI vs. human score." to="/detector" label="Check Your Text" />
              <CtaBox title="AI Humanizer" description="Rewrite AI-like drafts into natural prose." to="/humanizer" label="Humanize Text" />
              <CtaBox title="Readability & Plagiarism" description="Check originality and readability in one place." to="/plagiarism-checker" label="Analyze Now" />
            </div>
          </section>

          {/* Myths */}
          <section id="myths" className="scroll-mt-28 py-4">
            <h2 className="mb-5 text-2xl font-bold text-balance md:text-4xl">Myths About AI Detection</h2>
            <div className="space-y-4">
              {[
                { myth: 'There is a secret list of AI trigger words.', fact: 'Detectors use statistical patterns, not blacklists. Any list is descriptive.' },
                { myth: 'Replacing words with synonyms makes text undetectable.', fact: 'Synonym swapping does not change sentence structure or predictability enough to fool good detectors.' },
                { myth: 'If a detector says 95% AI, the writer definitely used AI.', fact: 'A score is a probability, not proof. False positives happen, especially with formal or technical writing.' },
                { myth: 'AI detectors look for watermarks.', fact: 'Most consumer AI text has no watermark. Detectors analyze language, not hidden markers.' },
                { myth: 'Short texts are easy to detect.', fact: 'Very short texts are harder to classify reliably because there is less statistical signal.' },
                { myth: 'Humanized text is always safe.', fact: 'Quality humanization raises the bar, but advanced detectors can still identify residual patterns.' },
              ].map((m, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="py-4">
                    <p className="mb-1 flex items-center gap-2 font-semibold text-destructive"><XCircle className="h-4 w-4" /> Myth: {m.myth}</p>
                    <p className="flex items-start gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> <span><strong>Fact:</strong> {m.fact}</span></p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              For a deeper look at accuracy, read our <Link to="/research/ai-detection-accuracy-tests" className="underline">AI Detection Accuracy Tests</Link> and <Link to="/comparisons/chatgpt-detector-comparison" className="underline">ChatGPT Detector Comparison</Link>.
            </p>
          </section>

          {/* Best Practices */}
          <section id="best-practices" className="scroll-mt-28 py-4">
            <h2 className="mb-5 text-2xl font-bold text-balance md:text-4xl">Best Practices for Creating Authentic Content</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base"><PenTool className="h-5 w-5 text-primary" /> Start with specifics</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Concrete details constrain your vocabulary naturally. Instead of "Many companies face challenges," write "In 2024, 62% of SaaS startups delayed hiring because of rising cloud costs."
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base"><MessageSquareQuote className="h-5 w-5 text-primary" /> Read aloud</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  If a sentence feels mechanical when spoken, revise it. Your ear catches repetition that your eyes miss.
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base"><List className="h-5 w-5 text-primary" /> Vary transitions</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Use paragraph breaks, implicit logic, or scene-setting instead of relying on the same formal connectors every sentence.
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base"><Target className="h-5 w-5 text-primary" /> Use detectors as editors</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Run your draft through a detector to identify sections that need more human voice, then revise those sections rather than replacing words blindly.
                </CardContent>
              </Card>
            </div>

            <CtaBox
              title="Improve readability with AIDetector.cx"
              description="Use the AI Detector and Humanizer to refine drafts, then verify originality with the Plagiarism Checker."
              to="/humanizer"
              label="Improve Readability"
            />
          </section>

          {/* FAQ */}
          <section id="faq" className="scroll-mt-28 py-4">
            <h2 className="mb-5 text-2xl font-bold text-balance md:text-4xl">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left text-base font-medium hover:no-underline">{faq.q}</AccordionTrigger>
                  <AccordionContent className="leading-relaxed text-muted-foreground">
                    <span dangerouslySetInnerHTML={{ __html: faq.a }} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* Sources */}
          <section id="sources" className="scroll-mt-28 py-4">
            <h2 className="mb-5 text-2xl font-bold text-balance md:text-4xl">Sources, Editorial Policy & Disclosure</h2>
            <p className="mb-4 leading-relaxed text-muted-foreground">
              This article was written by Dr. Elena Voss and reviewed by Marcus Chen, a senior machine-learning engineer at AIDetector.cx. It was last updated on June 1, 2026. Our goal is to provide transparent, evidence-based guidance rather than a clickbait list of forbidden words.
            </p>
            <h3 className="mb-3 text-xl font-semibold">Editorial policy</h3>
            <ul className="mb-6 space-y-2">
              {[
                'We do not claim any word or phrase alone determines AI detection.',
                'We distinguish statistical pattern analysis from definitive proof of authorship.',
                'Competitor and vendor claims are presented as reported, not endorsed.',
                'Reader trust is prioritized over conversion optimization.',
              ].map((item, i) => (
                <li key={i} className="flex gap-2 text-muted-foreground"><CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> <span>{item}</span></li>
              ))}
            </ul>
            <h3 className="mb-3 text-xl font-semibold">References</h3>
            <ul className="mb-6 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Liang, P. et al. (2023). "GPT Detectors Are Biased Against Non-Native English Writers." <em>Patterns</em>.</li>
              <li>Weber-Wulff et al. (2023). "Testing of Detection Tools for AI-Generated Text." <em>International Journal for Educational Integrity</em>.</li>
              <li>Mitchell, E. et al. (2023). "DetectGPT: Zero-Shot Machine-Generated Text Detection Using Probability Curvature." <em>ICML</em>.</li>
              <li>AIDetector.cx internal methodology documentation (2025–2026).</li>
            </ul>
            <Callout title="Disclosure" variant="warning">
              <p className="m-0">
                AIDetector.cx owns this website. We have tried to present information fairly and accurately, but you should verify pricing and features directly with any vendor you consider. No AI detector should be used as the sole basis for serious consequences.
              </p>
            </Callout>
          </section>

          {/* Final CTAs */}
          <div className="mt-16 grid gap-6 md:grid-cols-2">
            <CtaBox title="See how detectors evaluate your text" description="Paste text into AIDetector.cx for a detailed AI vs. human analysis." to="/detector" label="Use AI Detector" />
            <CtaBox title="Compare the best AI detectors" description="Read our full 2026 comparison of AIDetector.cx, GPTZero, Originality.ai, and more." to="/guides/best-ai-detector" label="Read Comparison" />
          </div>
        </div>

        <StickyToc activeId={activeId} />
      </article>
    </MainLayout>
  );
}
