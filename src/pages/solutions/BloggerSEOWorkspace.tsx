import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LockKeyhole, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useEntitlement } from '@/hooks/useEntitlement';
import { RichTextEditor, type RichTextEditorRef } from '@/pages/seo-assistant/RichTextEditor';
import {
  analyzeKeywordUsage,
  analyzeSemanticKeywords,
  analyzeSearchIntent,
  analyzeReadability,
  analyzeGrammar,
  analyzeHeadingStructure,
  analyzeEEAT,
  analyzeEngagement,
  analyzeSnippetPotential,
  analyzeUniqueness,
  computeOverallScores,
  type OverallScores,
} from '@/pages/seo-assistant/analysisEngine';

const FEATURE_SLUG = 'seo_assistant';
const DEFAULT_SCORES: OverallScores = {
  seo: 0,
  readability: 0,
  grammar: 0,
  eeat: 0,
  structure: 0,
  engagement: 0,
  overall: 0,
  publishingScore: 0,
  readyToPublish: false,
};

export default function BloggerSEOWorkspace() {
  const { user } = useAuth();
  const { summary } = useEntitlement(FEATURE_SLUG);
  const paid = Boolean(summary?.isPaidActive);
  const [content, setContent] = useState('');
  const [keyword, setKeyword] = useState('');
  const [scores, setScores] = useState<OverallScores>(DEFAULT_SCORES);
  const [semanticCoverage, setSemanticCoverage] = useState(0);
  const [intent, setIntent] = useState('informational');
  const [readability, setReadability] = useState(0);
  const [grammar, setGrammar] = useState(100);
  const [headingScore, setHeadingScore] = useState(0);
  const [eeat, setEeat] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<RichTextEditorRef>(null);

  const runAnalysis = useCallback((text: string, kw: string) => {
    if (!text.trim()) {
      setScores(DEFAULT_SCORES);
      return;
    }

    const kwResult = analyzeKeywordUsage(text, kw);
    const semantic = analyzeSemanticKeywords(text, kw);
    const searchIntent = analyzeSearchIntent(text);
    const read = analyzeReadability(text);
    const gram = analyzeGrammar(text);
    const headings = analyzeHeadingStructure(text);
    const eeatResult = analyzeEEAT(text);
    const engagement = analyzeEngagement(text);
    const snippet = analyzeSnippetPotential(text);
    const uniqueness = analyzeUniqueness(text);

    setScores(computeOverallScores({
      kwResult,
      readability: read,
      grammar: gram,
      eeat: eeatResult,
      headings,
      engagement,
      snippet,
      uniqueness,
    }));
    setSemanticCoverage(semantic.coveragePercent);
    setIntent(searchIntent.dominant);
    setReadability(read.score);
    setGrammar(gram.score);
    setHeadingScore(headings.score);
    setEeat(eeatResult.score);
  }, []);

  const handleContentChange = (value: string) => {
    setContent(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runAnalysis(value, keyword), 650);
  };

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runAnalysis(content, value), 450);
  };

  const hasContent = content.trim().length > 0;
  const metrics = [
    ['Overall SEO Score', scores.overall],
    ['Publishing Readiness', scores.publishingScore],
    ['Semantic Coverage', semanticCoverage],
    ['Readability', readability],
    ['Grammar', grammar],
    ['Heading Structure', headingScore],
    ['E-E-A-T', eeat],
  ] as const;

  return (
    <section id="blogger-workspace" className="border-y border-border/60 bg-muted/20 py-10 md:py-14">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" /> Blogger SEO Workspace
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">Paste your article first. See the analysis after you unlock it.</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
            The SEO Assistant runs on the text you paste here. Visitors can use the editor and start the analysis; detailed scores and recommendations are revealed to active paid members.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-primary/5 px-4 py-3 md:px-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" /> SEO Writing Assistant
            </div>
            <span className="text-xs text-muted-foreground">Real-time analysis · publishing readiness · search intent</span>
          </div>

          <div className="grid min-h-[560px] lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 border-b border-border lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-3 border-b border-border bg-secondary/20 px-4 py-3 md:px-6">
                <label className="shrink-0 text-xs font-medium text-muted-foreground">Primary Keyword:</label>
                <Input
                  value={keyword}
                  onChange={(event) => handleKeywordChange(event.target.value)}
                  placeholder="e.g. best AI checker for bloggers"
                  className="h-8 max-w-sm text-xs"
                />
              </div>
              <div className="min-h-[500px]">
                <RichTextEditor
                  ref={editorRef}
                  initialValue={content}
                  onChange={handleContentChange}
                  placeholder="Paste or write your blog article here. The SEO Assistant will analyze it as you type..."
                  className="min-h-[500px]"
                />
              </div>
            </div>

            <div className="relative min-h-[500px] bg-secondary/10 p-3">
              <div className={!paid && hasContent ? 'pointer-events-none select-none blur-[5px]' : ''} aria-hidden={!paid && hasContent}>
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="text-sm font-semibold">Publishing overview</div>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-4xl font-bold">{scores.overall}</span>
                    <span className="pb-1 text-sm text-muted-foreground">/100 SEO score</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {hasContent ? (scores.readyToPublish ? 'Ready to publish' : 'Needs improvement') : 'Paste an article to begin'}
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {metrics.slice(1).map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-border bg-background p-3">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-medium">{label}</span>
                        <span className="font-bold">{value}/100</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="rounded-lg border border-border bg-background p-3 text-xs">
                    <span className="font-medium">Search intent:</span> <span className="capitalize text-muted-foreground">{intent}</span>
                  </div>
                </div>
              </div>

              {!hasContent && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
                  <div><Search className="mx-auto mb-3 h-6 w-6" />Your analysis will appear here after you paste or write content.</div>
                </div>
              )}

              {!paid && hasContent && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/78 p-5 backdrop-blur-[2px]">
                  <div className="max-w-sm rounded-2xl border border-primary/20 bg-background p-6 text-center shadow-xl">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <LockKeyhole className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-xl font-bold">Your SEO analysis is ready</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {user
                        ? 'Upgrade to an active paid plan to reveal the scores, recommendations and publishing-readiness analysis.'
                        : 'Create an account, then choose a paid plan to reveal the scores, recommendations and publishing-readiness analysis.'}
                    </p>
                    <div className="mt-5 flex flex-col gap-2">
                      {user ? (
                        <Button asChild><Link to="/pricing">Upgrade to View Analysis</Link></Button>
                      ) : (
                        <>
                          <Button asChild><Link to="/register">Register to Continue</Link></Button>
                          <Button asChild variant="outline"><Link to="/login">Sign In</Link></Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
