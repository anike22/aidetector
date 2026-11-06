import { useMemo, useRef, useState } from 'react';
import { Check, Clipboard, Download, FileText, RotateCcw, Sparkles, X } from 'lucide-react';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { analyzeGrammar as analyzeCoreGrammar, type GrammarIssueItem } from '@/lib/grammar/grammarEngine';
import {
  analyzeGrammar as analyzeLanguageRules,
  SUPPORTED_GRAMMAR_LANGUAGES,
  type GrammarSuggestion,
  type GrammarCategory,
} from '@/utils/grammarAssistant';

type Finding = {
  id: string;
  category: string;
  title: string;
  explanation: string;
  originalText: string;
  replacementText: string;
  startIndex: number;
  endIndex: number;
  confidence?: number;
};

const SAMPLE = 'Their is several simple ways to improve your writing. The collection of examples are useful, and its important to review each sentence carefully . In order to make your message clearer, remove repeated words and choose the right expression.';

const CATEGORY_LABELS: Record<string, string> = {
  grammar: 'Grammar',
  agreement: 'Subject–verb agreement',
  punctuation: 'Punctuation',
  spacing: 'Spacing',
  capitalization: 'Capitalization',
  style: 'Style',
  redundancy: 'Conciseness',
  spelling: 'Spelling pattern',
  clarity: 'Word choice',
};

function mapCoreIssue(issue: GrammarIssueItem, index: number): Finding {
  const category = String(issue.category || issue.type || 'grammar').toLowerCase();
  return {
    id: issue.issueId || 'core-' + index + '-' + issue.start,
    category,
    title: CATEGORY_LABELS[category] || CATEGORY_LABELS[String(issue.type || '').toLowerCase()] || 'Grammar suggestion',
    explanation: issue.message || 'Review this expression in context.',
    originalText: issue.text,
    replacementText: issue.suggestion,
    startIndex: issue.start,
    endIndex: issue.end,
    confidence: issue.confidence,
  };
}

function mapLanguageIssue(issue: GrammarSuggestion): Finding {
  return {
    id: issue.id,
    category: issue.category,
    title: issue.title,
    explanation: issue.explanation,
    originalText: issue.originalText,
    replacementText: issue.replacementText,
    startIndex: issue.startIndex,
    endIndex: issue.endIndex,
  };
}

function scanText(text: string, language: string): Finding[] {
  if (!text.trim()) return [];
  const core = language === 'en' ? analyzeCoreGrammar(text).issues.map(mapCoreIssue) : [];
  const languageRules = analyzeLanguageRules(text, language).map(mapLanguageIssue);
  const combined = [...core, ...languageRules].filter((item) =>
    item.originalText.length > 0 &&
    item.originalText !== item.replacementText &&
    item.startIndex >= 0 &&
    item.endIndex <= text.length &&
    text.slice(item.startIndex, item.endIndex) === item.originalText
  );
  combined.sort((a, b) => a.startIndex - b.startIndex || b.endIndex - a.endIndex);
  const unique: Finding[] = [];
  for (const item of combined) {
    const overlaps = unique.some((accepted) =>
      Math.max(accepted.startIndex, item.startIndex) < Math.min(accepted.endIndex, item.endIndex)
    );
    if (!overlaps) unique.push(item);
  }
  return unique.sort((a, b) => a.startIndex - b.startIndex);
}

function applyFinding(text: string, finding: Finding): string {
  if (text.slice(finding.startIndex, finding.endIndex) !== finding.originalText) return text;
  return text.slice(0, finding.startIndex) + finding.replacementText + text.slice(finding.endIndex);
}

function countWords(text: string): number {
  return (text.match(/\b[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*\b/gu) || []).length;
}

const FAQS = [
  {
    question: 'Is the AIDetector.cx grammar checker free?',
    answer: 'Yes. You can paste or type text and run the local grammar checks without creating an account. The checker works in your browser and does not require a subscription to review the rules currently available.',
  },
  {
    question: 'Does the grammar checker upload or store my text?',
    answer: 'No. Grammar analysis runs locally in your browser using the page code. The text is not sent to an AIDetector.cx grammar API, and this page does not save your draft to an account.',
  },
  {
    question: 'What kinds of mistakes can it find?',
    answer: 'The current rules look for selected grammar and agreement errors, commonly confused words, repeated words, punctuation and spacing problems, capitalization patterns, and wordy expressions. It is a rule-based assistant, not a complete dictionary-backed proofreader.',
  },
  {
    question: 'Which languages are available?',
    answer: 'The current rule library includes English, Spanish, French, German, and Portuguese as selectable languages. The depth of checks differs by language: English has the broadest rule set, while the other languages currently have a smaller set of language-specific patterns.',
  },
  {
    question: 'Can I accept corrections one at a time?',
    answer: 'Yes. Each finding includes the original text, a suggested replacement, and an explanation. You can apply a correction individually or apply all non-overlapping suggestions at once.',
  },
  {
    question: 'Is this the same as an AI proofreader?',
    answer: 'No. This version uses transparent, local rules and pattern checks. It does not claim to understand every sentence, detect every spelling error, or provide the contextual coverage of a full AI proofreading service.',
  },
];

export default function GrammarCheckerPage() {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('en');
  const [findings, setFindings] = useState<Finding[]>([]);
  const [hasChecked, setHasChecked] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const wordCount = useMemo(() => countWords(text), [text]);
  const characterCount = text.length;
  const visibleFindings = useMemo(() => activeFilter === 'all'
    ? findings
    : findings.filter((item) => item.category.toLowerCase().includes(activeFilter)), [findings, activeFilter]);

  const runCheck = () => {
    if (!text.trim()) {
      toast.info('Paste or type some text to check.');
      return;
    }
    const result = scanText(text, language);
    setFindings(result);
    setHasChecked(true);
    setActiveFilter('all');
    toast.success(result.length ? result.length + ' suggestions found' : 'No issues found by the available rules');
  };

  const acceptOne = (finding: Finding) => {
    const next = applyFinding(text, finding);
    if (next === text) {
      toast.info('This suggestion no longer matches the current text. Run the check again.');
      return;
    }
    setText(next);
    setFindings(scanText(next, language));
    setHasChecked(true);
    toast.success('Suggestion applied');
  };

  const acceptAll = () => {
    let next = text;
    const ordered = [...findings].sort((a, b) => b.startIndex - a.startIndex);
    let applied = 0;
    for (const finding of ordered) {
      if (next.slice(finding.startIndex, finding.endIndex) === finding.originalText) {
        next = next.slice(0, finding.startIndex) + finding.replacementText + next.slice(finding.endIndex);
        applied += 1;
      }
    }
    setText(next);
    setFindings(scanText(next, language));
    setHasChecked(true);
    toast.success(applied + ' suggestion(s) applied');
  };

  const copyText = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Text copied');
    } catch {
      toast.error('Clipboard access was unavailable');
    }
  };

  const downloadText = () => {
    if (!text) return;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'grammar-checked-text.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const loadFile = (file?: File) => {
    if (!file) return;
    if (!/\.(txt|md|csv)$/i.test(file.name) && !['text/plain', 'text/markdown', 'text/csv'].includes(file.type)) {
      toast.error('Upload a TXT, Markdown, or CSV text file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('The file must be 2 MB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || '');
      setText(value);
      setFindings([]);
      setHasChecked(false);
      toast.success('Text loaded from file');
    };
    reader.onerror = () => toast.error('Could not read this file');
    reader.readAsText(file);
  };

  const reset = () => {
    setText('');
    setFindings([]);
    setHasChecked(false);
    setActiveFilter('all');
  };

  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Free Online Grammar Checker',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      browserRequirements: 'Requires JavaScript',
      url: 'https://www.aidetector.cx/grammar-checker',
      description: 'Check grammar, punctuation, spacing, agreement, word choice, and writing style with a free browser-based grammar checker.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ];

  return (
    <MainLayout>
      <PageMeta
        title="Free Grammar Checker | Check Grammar, Punctuation & Writing"
        description="Check grammar online for free. Find selected grammar, agreement, punctuation, spacing, word-choice and style issues, then apply corrections in your browser."
        canonicalUrl="https://www.aidetector.cx/grammar-checker"
        schemas={schema}
      />
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mx-auto mb-8 max-w-3xl text-center">
          <Badge variant="secondary" className="mb-4">Free online writing tool</Badge>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Free Online Grammar Checker</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Check grammar, punctuation, spacing, word choice and sentence-level patterns. Review each suggestion, understand why it was flagged, and edit your text without leaving the page.
          </p>
        </header>

        <section aria-label="Grammar checker workspace" className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
          <Card className="overflow-hidden border-border shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4 text-primary" /> Your text</div>
              <div className="flex items-center gap-2">
                <label htmlFor="grammar-language" className="sr-only">Choose language</label>
                <select id="grammar-language" value={language} onChange={(event) => { setLanguage(event.target.value); setFindings([]); setHasChecked(false); }} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                  {SUPPORTED_GRAMMAR_LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.flag} {item.name}</option>)}
                </select>
                <Button variant="ghost" size="sm" onClick={reset}><RotateCcw className="mr-1.5 h-4 w-4" /> Clear</Button>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <Textarea
                value={text}
                onChange={(event) => { setText(event.target.value); setHasChecked(false); }}
                placeholder="Paste or type your text here. Your writing stays in this browser while the checker runs."
                className="min-h-[330px] resize-y border-0 bg-muted/30 text-base leading-7 shadow-none focus-visible:ring-1"
                aria-label="Text to check for grammar and writing issues"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{wordCount.toLocaleString()} words · {characterCount.toLocaleString()} characters</span>
                <span>Local analysis · No account required</span>
              </div>
              <div
                className={'mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed p-3 ' + (isDragging ? 'border-primary bg-primary/5' : 'border-border')}
                onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => { event.preventDefault(); setIsDragging(false); loadFile(event.dataTransfer.files?.[0]); }}
              >
                <div className="text-sm text-muted-foreground">Upload a text file (TXT, MD or CSV; up to 2 MB)</div>
                <input ref={fileRef} type="file" accept=".txt,.md,.csv,text/plain,text/markdown,text/csv" className="hidden" onChange={(event) => loadFile(event.target.files?.[0])} />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Choose file</Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={runCheck} disabled={!text.trim()} className="min-w-36"><Sparkles className="mr-2 h-4 w-4" /> Check grammar</Button>
                <Button variant="outline" onClick={() => setText(SAMPLE)}>Try sample</Button>
                <Button variant="outline" onClick={copyText} disabled={!text}><Clipboard className="mr-2 h-4 w-4" /> Copy</Button>
                <Button variant="outline" onClick={downloadText} disabled={!text}><Download className="mr-2 h-4 w-4" /> Download</Button>
              </div>
            </div>
          </Card>

          <Card className="min-h-[420px] border-border shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <div>
                <h2 className="font-semibold">Writing suggestions</h2>
                <p className="mt-1 text-xs text-muted-foreground">{hasChecked ? findings.length + ' available suggestion(s)' : 'Run a check to review suggestions'}</p>
              </div>
              {hasChecked && findings.length > 0 && <Button size="sm" variant="outline" onClick={acceptAll}><Check className="mr-1.5 h-4 w-4" /> Fix all</Button>}
            </div>
            <div className="p-4">
              {!hasChecked && <div className="flex min-h-72 flex-col items-center justify-center text-center"><Sparkles className="mb-3 h-8 w-8 text-muted-foreground" /><p className="font-medium">Ready when you are</p><p className="mt-2 max-w-xs text-sm text-muted-foreground">Your findings will appear here with explanations and suggested replacements.</p></div>}
              {hasChecked && findings.length === 0 && <div className="flex min-h-72 flex-col items-center justify-center text-center"><Check className="mb-3 h-8 w-8 text-emerald-600" /><p className="font-medium">No issues found by these rules</p><p className="mt-2 max-w-xs text-sm text-muted-foreground">This does not guarantee that every grammar, spelling or style issue has been detected.</p></div>}
              {hasChecked && findings.length > 0 && <>
                <div className="mb-4 flex flex-wrap gap-1.5">
                  <Button size="sm" variant={activeFilter === 'all' ? 'secondary' : 'ghost'} onClick={() => setActiveFilter('all')}>All ({findings.length})</Button>
                  {['grammar', 'punctuation', 'style', 'spacing'].map((filter) => {
                    const total = findings.filter((item) => item.category.toLowerCase().includes(filter)).length;
                    return total ? <Button key={filter} size="sm" variant={activeFilter === filter ? 'secondary' : 'ghost'} onClick={() => setActiveFilter(filter)}>{CATEGORY_LABELS[filter]} ({total})</Button> : null;
                  })}
                </div>
                <div className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
                  {visibleFindings.map((finding) => (
                    <div key={finding.id} className="rounded-lg border border-border p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <Badge variant="outline">{CATEGORY_LABELS[finding.category.toLowerCase()] || finding.title}</Badge>
                        <span className="text-xs text-muted-foreground">{finding.startIndex + 1}–{finding.endIndex}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{finding.explanation}</p>
                      <div className="mt-3 grid gap-2 text-sm">
                        <div><span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Original</span><p className="mt-1 rounded bg-destructive/5 px-2 py-1 line-through decoration-destructive">{finding.originalText}</p></div>
                        <div><span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Suggestion</span><p className="mt-1 rounded bg-emerald-500/10 px-2 py-1 font-medium">{finding.replacementText}</p></div>
                      </div>
                      <Button size="sm" className="mt-3 w-full" variant="outline" onClick={() => acceptOne(finding)}><Check className="mr-1.5 h-4 w-4" /> Apply suggestion</Button>
                    </div>
                  ))}
                </div>
              </>}
            </div>
          </Card>
        </section>

        <section className="mx-auto mt-16 max-w-4xl space-y-12">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">A practical grammar check for clearer writing</h2>
            <p className="mt-4 leading-7 text-muted-foreground">A grammar checker reviews text for selected language and writing patterns that can make a sentence harder to read or understand. AIDetector.cx combines its existing grammar rules with a multilingual writing-assistant rule set to highlight issues, explain the pattern, and offer a replacement you can accept or ignore. You stay in control of every edit.</p>
            <p className="mt-3 leading-7 text-muted-foreground">Use the free grammar checker for a quick review of emails, essays, reports, blog drafts, product descriptions, study notes, and everyday messages. Paste your writing into the editor, choose a language, and select Check grammar. The analysis runs locally in your browser; the text is not sent to a remote grammar service by this page.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">What the grammar checker looks for</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ['Grammar and agreement', 'Selected grammar constructions and subject–verb agreement patterns, including cases where a phrase between the subject and verb can make agreement harder to spot.'],
                ['Commonly confused words', 'Contextual patterns involving expressions such as their and there, your and you’re, its and it’s, then and than, and affect and effect.'],
                ['Punctuation and spacing', 'Repeated punctuation, unnecessary spaces, and spaces immediately before punctuation marks where the selected language rules indicate they are not expected.'],
                ['Capitalization and repeated words', 'Repeated adjacent words and selected lowercase sentence starts or capitalization patterns.'],
                ['Conciseness and style', 'Wordy expressions such as “in order to” and “due to the fact that,” with shorter alternatives where the rule is appropriate.'],
                ['Language-specific patterns', 'A smaller set of Spanish, French, and German usage patterns, plus the shared repeated-word and punctuation checks.'],
              ].map(([heading, body]) => <article key={heading} className="rounded-xl border border-border p-4"><h3 className="font-semibold">{heading}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></article>)}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">How to check grammar online</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 leading-7 text-muted-foreground">
              <li><strong className="text-foreground">Paste or type your writing.</strong> Add the sentence, paragraph, email, essay section, or draft you want to review.</li>
              <li><strong className="text-foreground">Choose the language.</strong> Select the language that best matches your text. English currently has the broadest set of grammar rules.</li>
              <li><strong className="text-foreground">Run the grammar check.</strong> The checker scans for patterns covered by its current rule library and lists the findings beside your text.</li>
              <li><strong className="text-foreground">Review each suggestion.</strong> Read the explanation and compare the original phrase with the suggested replacement. Context matters, so do not accept a change automatically if it alters your meaning.</li>
              <li><strong className="text-foreground">Apply corrections and export.</strong> Accept individual suggestions or use Fix all for the non-overlapping findings, then copy or download your revised text.</li>
            </ol>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">Grammar checker vs. spell checker</h2>
            <p className="mt-3 leading-7 text-muted-foreground">A grammar checker evaluates selected sentence structures, agreement, word usage, punctuation, and writing patterns. A traditional spell checker compares words against a dictionary and may also use context to identify misspellings. This page is a rule-based grammar and writing checker; it does not currently provide comprehensive dictionary-backed spelling coverage. Proper names, specialist vocabulary, regional expressions, and unusual sentence constructions may need a human review.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">Supported languages and coverage</h2>
            <p className="mt-3 leading-7 text-muted-foreground">The language selector currently offers English, Spanish, French, German, and Portuguese. Coverage is not identical across these languages. English includes the main agreement, word-confusion, punctuation, spacing, and style rules. The additional languages currently use a smaller collection of language-specific patterns, alongside selected shared checks. A language option should not be interpreted as proof of full grammatical coverage or native-level proofreading.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">Private, browser-based grammar checking</h2>
            <p className="mt-3 leading-7 text-muted-foreground">The grammar rules execute in your browser. This page does not submit your draft to an external grammar API or save it to your AIDetector.cx account. You can clear the editor when you finish. For confidential work, still follow your organization’s document-handling policies and avoid using shared or public devices.</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">Frequently asked questions</h2>
            <div className="mt-4 divide-y divide-border rounded-xl border border-border">
              {FAQS.map((item) => <details key={item.question} className="group p-4"><summary className="cursor-pointer list-none pr-6 font-medium marker:hidden">{item.question}<span className="float-right text-muted-foreground group-open:rotate-45">+</span></summary><p className="mt-3 text-sm leading-6 text-muted-foreground">{item.answer}</p></details>)}
            </div>
          </div>

          <div className="rounded-xl bg-muted/50 p-5">
            <h2 className="text-lg font-semibold">Related writing tools</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Continue refining your text with the <a className="font-medium text-primary underline underline-offset-4" href="/word-counter">word counter</a>, review content for AI patterns with the <a className="font-medium text-primary underline underline-offset-4" href="/detector">AI detector</a>, or explore broader content optimization in the <a className="font-medium text-primary underline underline-offset-4" href="/seo-assistant">SEO Assistant</a>.</p>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">Important: Grammar suggestions are generated by a finite set of programmed rules. They can miss errors and may occasionally flag acceptable wording. Always review proposed edits in context.</p>
        </section>
      </div>
    </MainLayout>
  );
}
