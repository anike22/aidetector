import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Check, Loader2, Globe, Sparkles } from 'lucide-react';
import { AnalysisModule, CheckItem, Rec } from './AnalysisShared';
import { toast } from 'sonner';
import type {
  HeadingStructureResult, EEATResult, EngagementResult,
  SnippetResult, MetaResult, AIRiskResult, UniquenessResult,
} from './analysisEngine';
import type { CompetitorResult, ContentGapResult } from './analysisEngine';

export function CompetitorIntelligencePanel({ 
  competitors, 
  contentGap,
  onAnalyze,
  loading,
  keyword
}: { 
  competitors: CompetitorResult[]; 
  contentGap: ContentGapResult | null;
  onAnalyze: () => void;
  loading: boolean;
  keyword: string;
}) {
  return (
    <AnalysisModule title="SERP Intelligence & Content Gap" score={competitors.length > 0 ? 100 : 0} defaultOpen={false}>
      <div className="flex flex-col gap-3">
        <p className="text-xs text-muted-foreground text-pretty">
          Analyze top 10 Google ranking pages to discover competitor SEO metrics and content gaps.
        </p>
        <Button 
          variant="outline"
          size="sm" 
          onClick={onAnalyze} 
          disabled={loading || !keyword.trim()}
          className="w-full text-xs h-8 border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 gap-1.5"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
          {loading ? 'Analyzing Top Competitors...' : 'Analyze SERP & Competitors'}
        </Button>

        {competitors.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase">Top Ranking Competitors</div>
            {competitors.map((comp, i) => (
              <div key={i} className="p-2 bg-muted/20 border border-border rounded flex flex-col gap-1">
                <div className="text-xs font-medium text-navy truncate">{comp.title}</div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="truncate flex-1 max-w-[70%] font-mono text-primary/70">{comp.url}</span>
                  <span className="shrink-0">{comp.wordCount} words</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {contentGap && (
          <div className="mt-3 flex flex-col gap-3 pt-3 border-t border-border">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-warning" /> Content Gap Analysis
            </div>
            
            {contentGap.missingKeywords?.length > 0 && (
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">Missing Keywords</div>
                <div className="flex flex-wrap gap-1">
                  {contentGap.missingKeywords.map((kw, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 bg-background">{kw}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {contentGap.missingHeadings?.length > 0 && (
              <div>
                <div className="text-[10px] text-muted-foreground mb-1">Suggested Headings</div>
                <ul className="text-[10px] text-foreground/80 list-disc pl-3 flex flex-col gap-0.5">
                  {contentGap.missingHeadings.map((hd, i) => (
                    <li key={i}>{hd}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </AnalysisModule>
  );
}

// ─── Module 11: Heading Structure ────────────────────────────────────────

export function HeadingStructurePanel({ result }: { result: HeadingStructureResult }) {
  return (
    <AnalysisModule title="Heading Structure" score={result.score}>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: 'H1', count: result.h1Count, ok: result.h1Count === 1 },
          { label: 'H2', count: result.h2Count, ok: result.h2Count >= 2 },
          { label: 'H3', count: result.h3Count, ok: result.h3Count >= 1 },
        ].map((h) => (
          <div key={h.label} className={`text-center p-2 rounded border ${h.ok ? 'bg-success/5 border-success/20' : 'bg-muted/30 border-border'}`}>
            <div className={`text-sm font-bold ${h.ok ? 'text-success' : h.count === 0 ? 'text-muted-foreground' : 'text-warning'}`}>{h.count}</div>
            <div className="text-[10px] text-muted-foreground">{h.label}</div>
          </div>
        ))}
      </div>
      {result.headings.slice(0, 5).map((h, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-primary shrink-0">H{h.level}</span>
          <span className="text-xs text-foreground/70 truncate">{h.text}</span>
        </div>
      ))}
      {result.issues.length > 0 && (
        <ul className="flex flex-col gap-0.5 mt-1">
          {result.issues.map((issue, i) => <Rec key={i} text={issue} />)}
        </ul>
      )}
    </AnalysisModule>
  );
}

// ─── Module 12: EEAT Analysis ─────────────────────────────────────────────

export function EEATPanel({ result }: { result: EEATResult }) {
  return (
    <AnalysisModule title="EEAT Analysis" score={result.score}>
      <div className="grid grid-cols-2 gap-1">
        <CheckItem ok={result.hasPersonalExamples} label="Personal examples" />
        <CheckItem ok={result.hasStats} label="Stats & data" />
        <CheckItem ok={result.hasCitations} label="Citations" />
        <CheckItem ok={result.hasAuthor} label="Author attribution" />
      </div>
      <ul className="flex flex-col gap-0.5 mt-1">
        {result.recommendations.map((r, i) => <Rec key={i} text={r} />)}
      </ul>
    </AnalysisModule>
  );
}

// ─── Module 13: Engagement Analysis ──────────────────────────────────────

export function EngagementPanel({ result }: { result: EngagementResult }) {
  return (
    <AnalysisModule title="Engagement" score={result.score} defaultOpen={false}>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: 'Questions', val: result.questionCount },
          { label: 'Examples', val: result.exampleCount },
          { label: 'Data points', val: result.dataCount },
        ].map((s) => (
          <div key={s.label} className="text-center p-2 bg-muted/30 rounded">
            <div className={`text-sm font-bold ${s.val > 0 ? 'text-navy' : 'text-muted-foreground/50'}`}>{s.val}</div>
            <div className="text-[10px] text-muted-foreground leading-tight">{s.label}</div>
          </div>
        ))}
      </div>
      <ul className="flex flex-col gap-0.5">
        {result.recommendations.map((r, i) => <Rec key={i} text={r} />)}
      </ul>
    </AnalysisModule>
  );
}

// ─── Module 14: Internal Linking ──────────────────────────────────────────

export function InternalLinkingPanel({
  links,
  onGenerateLinks,
  generatingLinks
}: {
  links: { url: string; title: string; anchorText: string; reason: string }[];
  onGenerateLinks: (domain: string) => void;
  generatingLinks: boolean;
}) {
  const [domain, setDomain] = useState('');
  const score = Math.min(100, links.length * 20);
  
  return (
    <AnalysisModule title="Internal Linking" score={score} defaultOpen={false}>
      <div className="flex flex-col gap-3 mb-3">
        <p className="text-xs text-muted-foreground text-pretty">
          Enter your website domain to discover AI-suggested internal links.
        </p>
        <div className="flex gap-2">
          <Input 
            placeholder="e.g. yoursite.com" 
            value={domain} 
            onChange={(e) => setDomain(e.target.value)}
            className="h-8 text-xs border-border"
          />
          <Button 
            size="sm" 
            onClick={() => onGenerateLinks(domain)} 
            disabled={generatingLinks || !domain.trim()}
            className="h-8 text-xs gap-1.5 shrink-0"
          >
            {generatingLinks ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
            Fetch Links
          </Button>
        </div>
      </div>
      
      {links.length === 0 ? (
        <p className="text-xs text-muted-foreground text-pretty italic">No internal link opportunities detected yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {links.map((link, i) => (
            <div key={i} className="p-2 bg-primary/5 border border-primary/15 rounded">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-medium text-primary truncate">{link.title}</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono shrink-0 mb-1 truncate">{link.url}</div>
              <p className="text-[10px] text-muted-foreground text-pretty">Anchor: "{link.anchorText}"</p>
              {link.reason && <p className="text-[10px] text-muted-foreground mt-0.5 opacity-80">{link.reason}</p>}
            </div>
          ))}
        </div>
      )}
    </AnalysisModule>
  );
}

// ─── Module 15: Featured Snippet Optimization ────────────────────────────

export function SnippetPanel({ result }: { result: SnippetResult }) {
  return (
    <AnalysisModule title="Snippet Potential" score={result.score} defaultOpen={false}>
      <div className="grid grid-cols-2 gap-1">
        <CheckItem ok={result.hasDefinition} label="Definition" />
        <CheckItem ok={result.hasList} label="List" />
        <CheckItem ok={result.hasTable} label="Table" />
        <CheckItem ok={result.hasFAQ} label="FAQ" />
      </div>
      <ul className="flex flex-col gap-0.5 mt-1">
        {result.recommendations.map((r, i) => <Rec key={i} text={r} />)}
      </ul>
    </AnalysisModule>
  );
}

// ─── Module 16: Meta Optimization ────────────────────────────────────────

export function MetaOptimizationPanel({ result, onChange }: {
  result: MetaResult;
  onChange?: (field: 'title' | 'desc' | 'slug', val: string) => void;
}) {
  const [titleVal, setTitleVal] = useState(result.suggestedTitle);
  const [descVal, setDescVal] = useState(result.suggestedDescription);
  const [slugVal, setSlugVal] = useState(result.suggestedSlug);

  const titleLen = titleVal.length;
  const descLen = descVal.length;

  return (
    <AnalysisModule title="Meta Optimization" defaultOpen={false}>
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">SEO Title</span>
            <span className={`text-[10px] font-bold ${titleLen >= 50 && titleLen <= 60 ? 'text-success' : 'text-warning'}`}>{titleLen}/60</span>
          </div>
          <input
            value={titleVal}
            onChange={(e) => { setTitleVal(e.target.value); onChange?.('title', e.target.value); }}
            className="w-full h-7 px-2 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Meta Description</span>
            <span className={`text-[10px] font-bold ${descLen >= 140 && descLen <= 160 ? 'text-success' : 'text-warning'}`}>{descLen}/160</span>
          </div>
          <textarea
            value={descVal}
            onChange={(e) => { setDescVal(e.target.value); onChange?.('desc', e.target.value); }}
            className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 leading-relaxed"
            rows={3}
          />
        </div>
        <div>
          <div className="mb-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">URL Slug</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-muted-foreground shrink-0">aidetector.cx/</span>
            <input
              value={slugVal}
              onChange={(e) => { setSlugVal(e.target.value); onChange?.('slug', e.target.value); }}
              className="flex-1 min-w-0 h-7 px-2 text-xs border border-border rounded bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>
      </div>
    </AnalysisModule>
  );
}

// ─── Module 17: Content Uniqueness ───────────────────────────────────────

export function UniquenessPanel({ result }: { result: UniquenessResult }) {
  return (
    <AnalysisModule title="Content Uniqueness" score={result.score} defaultOpen={false}>
      {result.overusedWords.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Overused Words</p>
          <div className="flex flex-wrap gap-1">
            {result.overusedWords.slice(0, 6).map((w) => (
              <Badge key={w} variant="outline" className="text-[10px] border-warning/30 text-warning py-0 h-4 px-1.5">{w}</Badge>
            ))}
          </div>
        </div>
      )}
      {result.duplicatePhrases.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Repeated Phrases</p>
          <div className="flex flex-col gap-0.5">
            {result.duplicatePhrases.slice(0, 3).map((p) => (
              <span key={p} className="text-xs text-muted-foreground font-mono truncate">"{p}"</span>
            ))}
          </div>
        </div>
      )}
      <ul className="flex flex-col gap-0.5">
        {result.recommendations.map((r, i) => <Rec key={i} text={r} />)}
      </ul>
    </AnalysisModule>
  );
}

// ─── Module 18: AI Detection Risk ────────────────────────────────────────

export function AIRiskPanel({ result }: { result: AIRiskResult }) {
  const riskColor = result.riskLevel === 'Low' ? 'text-success' : result.riskLevel === 'Medium' ? 'text-warning' : 'text-destructive';
  const score = result.humanScore;
  return (
    <AnalysisModule title="AI Detection Risk" score={score} defaultOpen={false}>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center p-2 bg-success/5 border border-success/20 rounded flex-1">
          <span className="text-lg font-bold text-success">{result.humanScore}%</span>
          <span className="text-[10px] text-muted-foreground">Human</span>
        </div>
        <div className="flex flex-col items-center p-2 bg-destructive/5 border border-destructive/20 rounded flex-1">
          <span className="text-lg font-bold text-destructive">{result.aiScore}%</span>
          <span className="text-[10px] text-muted-foreground">AI</span>
        </div>
        <div className="flex flex-col items-center p-2 bg-muted/30 rounded flex-1">
          <span className={`text-xs font-bold ${riskColor}`}>{result.riskLevel}</span>
          <span className="text-[10px] text-muted-foreground">Risk</span>
        </div>
      </div>
      <ul className="flex flex-col gap-0.5">
        {result.recommendations.map((r, i) => <Rec key={i} text={r} />)}
      </ul>
    </AnalysisModule>
  );
}

// ─── Module 19: FAQ Generator ─────────────────────────────────────────────

export function FAQPanel({ faqs, onGenerate, generating }: {
  faqs: { question: string; answer: string }[];
  onGenerate: () => void;
  generating: boolean;
}) {
  const [copiedSchema, setCopiedSchema] = useState(false);

  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }, null, 2);

  const copySchema = () => {
    navigator.clipboard.writeText(schema);
    setCopiedSchema(true);
    toast.success('JSON-LD schema copied.');
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  return (
    <AnalysisModule title="FAQ Generator" defaultOpen={false}>
      <Button
        size="sm"
        className="h-7 text-xs bg-primary text-primary-foreground gap-1 w-full"
        onClick={onGenerate}
        disabled={generating}
      >
        {generating ? 'Generating…' : faqs.length > 0 ? 'Regenerate FAQ' : 'Generate FAQ'}
      </Button>
      {faqs.length > 0 && (
        <>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-0.5">
            {faqs.map((f, i) => (
              <div key={i} className="p-2 bg-muted/20 rounded border border-border/50">
                <p className="text-xs font-semibold text-navy mb-0.5 text-balance">{f.question}</p>
                <p className="text-[10px] text-muted-foreground text-pretty line-clamp-2">{f.answer}</p>
              </div>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-border gap-1 w-full"
            onClick={copySchema}
          >
            {copiedSchema ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
            {copiedSchema ? 'Copied!' : 'Copy JSON-LD Schema'}
          </Button>
        </>
      )}
    </AnalysisModule>
  );
}

// ─── Module 20: Export Options ────────────────────────────────────────────

export function ExportPanel({ content, metaTitle, metaDescription, slug }: {
  content: string;
  metaTitle: string;
  metaDescription: string;
  slug: string;
}) {
  const handleExportHTML = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metaTitle}</title>
  <meta name="description" content="${metaDescription}">
  <link rel="canonical" href="https://aidetector.cx/${slug}">
</head>
<body>
<article>
${content.split('\n').map((line) => {
  const hm = line.match(/^(#{1,6})\s+(.*)/);
  if (hm) return `  <h${hm[1].length}>${hm[2]}</h${hm[1].length}>`;
  if (line.trim()) return `  <p>${line}</p>`;
  return '';
}).filter(Boolean).join('\n')}
</article>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${slug || 'article'}.html`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as HTML.');
  };

  const handleExportMD = () => {
    const md = `---\ntitle: "${metaTitle}"\ndescription: "${metaDescription}"\nslug: "${slug}"\n---\n\n${content}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${slug || 'article'}.md`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as Markdown.');
  };

  return (
    <AnalysisModule title="Export" defaultOpen={false}>
      <div className="flex flex-col gap-2">
        <Button size="sm" variant="outline" className="h-8 text-xs border-border gap-1.5 justify-start" onClick={handleExportHTML}>
          <Download className="w-3.5 h-3.5" /> Export as HTML
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs border-border gap-1.5 justify-start" onClick={handleExportMD}>
          <Download className="w-3.5 h-3.5" /> Export as Markdown
        </Button>
      </div>
    </AnalysisModule>
  );
}
