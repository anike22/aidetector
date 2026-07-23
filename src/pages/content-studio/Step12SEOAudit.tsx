import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Copy, Download, Eye, EyeOff, ChevronLeft, Check, Trophy, Loader2
} from 'lucide-react';
import type { WizardState, SEOAuditScores, computeOverallScore } from './types';
import { defaultAuditScores } from './types';
import { toast } from 'sonner';

interface Props {
  state: WizardState;
  onChange: (partial: Partial<WizardState>) => void;
  onBack: () => void;
  computeOverall: typeof computeOverallScore;
}

function ScoreGauge({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative flex items-center justify-center w-36 h-36 mx-auto">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-navy">{score}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

function ScoreRow({ label, score }: { label: string; score: number }) {
  const color = score >= 80 ? 'bg-success' : score >= 60 ? 'bg-warning' : 'bg-destructive';
  const textColor = score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-destructive';
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-foreground/70 w-36 shrink-0">{label}</span>
      <div className="flex-1 min-w-0 bg-muted rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-sm font-bold w-10 text-right shrink-0 ${textColor}`}>{score}</span>
    </div>
  );
}

function computeScores(state: WizardState): SEOAuditScores {
  const kw = state.keyword.toLowerCase();
  const content = state.fullContent.toLowerCase();
  const words = content.split(/\s+/).filter(Boolean).length || 1;
  const kwCount = (content.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  const density = (kwCount / words) * 100;

  const keywordUsage = density >= 0.8 && density <= 1.5 ? 100 :
    density < 0.8 ? Math.round(70 + (density / 0.8) * 30) :
    Math.round(100 - ((density - 1.5) * 30));

  const readability = state.readabilityAfter || state.readabilityBefore || 70;

  const internalLinks = state.internalLinks.filter((l) => l.accepted).length;
  const internalScore = Math.min(100, 60 + internalLinks * 8);

  const eeat = state.eeatConfig;
  const eeatScore = Math.round(
    (Number(eeat.includeExamples) + Number(eeat.includeCaseStudy) +
     Number(eeat.includeStats) + Number(eeat.includeCitations) +
     Number(!!eeat.authorName) + Number(!!eeat.reviewerName)) / 6 * 100
  );

  const h2Count = (state.fullContent.match(/^## /gm) || []).length;
  const headingStructure = Math.min(100, 60 + h2Count * 8);

  const faqCount = state.faqItems.filter((f) => f.keep).length;
  const faqScore = faqCount >= 6 ? 100 : faqCount >= 4 ? 85 : faqCount >= 2 ? 70 : 40;

  const schema = state.seoAssets?.schemaJson ? 100 : 0;

  return {
    keywordUsage: Math.max(0, Math.min(100, keywordUsage)),
    readability: Math.max(0, Math.min(100, readability)),
    internalLinks: Math.max(0, Math.min(100, internalScore)),
    eeat: Math.max(0, Math.min(100, eeatScore)),
    headingStructure: Math.max(0, Math.min(100, headingStructure)),
    faq: faqScore,
    schema,
  };
}

export default function Step12SEOAudit({ state, onChange, onBack, computeOverall }: Props) {
  const [preview, setPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scores, setScores] = useState<SEOAuditScores>(state.auditScores?.keywordUsage ? state.auditScores : defaultAuditScores);

  useEffect(() => {
    const computed = computeScores(state);
    setScores(computed);
    onChange({ auditScores: computed });
  }, []);

  const overall = computeOverall(scores);

  const overallLabel = overall >= 85 ? { text: 'Excellent', color: 'text-success' } :
    overall >= 70 ? { text: 'Good', color: 'text-warning' } :
    { text: 'Needs Work', color: 'text-destructive' };

  const handleCopy = () => {
    navigator.clipboard.writeText(state.fullContent);
    setCopied(true);
    toast.success('Article copied to clipboard as Markdown.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportHTML = () => {
    const faqHtml = state.faqItems.filter((f) => f.keep)
      .map((f) => `<details><summary><strong>${f.question}</strong></summary><p>${f.answer}</p></details>`)
      .join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${state.seoAssets?.metaTitle || state.brief?.title}</title>
  <meta name="description" content="${state.seoAssets?.metaDescription}">
  <meta property="og:title" content="${state.seoAssets?.ogTitle}">
  <meta property="og:description" content="${state.seoAssets?.ogDescription}">
  <link rel="canonical" href="${state.seoAssets?.canonicalUrl}">
  <script type="application/ld+json">${state.seoAssets?.schemaJson}</script>
</head>
<body>
  <article>
    <h1>${state.brief?.title}</h1>
    ${state.sections.map((s) => `<h2>${s.heading}</h2>\n<p>${s.content.replace(/\n/g, '</p><p>')}</p>`).join('\n')}
    <section class="faq">
      <h2>Frequently Asked Questions</h2>
      ${faqHtml}
    </section>
  </article>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.brief?.slug || 'article'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Article exported as HTML.');
  };

  const handleExportMD = () => {
    const faqMd = state.faqItems.filter((f) => f.keep)
      .map((f) => `**${f.question}**\n${f.answer}`)
      .join('\n\n');

    const md = `# ${state.brief?.title}

---
**Meta Title:** ${state.seoAssets?.metaTitle}
**Meta Description:** ${state.seoAssets?.metaDescription}
**Canonical:** ${state.seoAssets?.canonicalUrl}

---

${state.fullContent}

## Frequently Asked Questions

${faqMd}
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.brief?.slug || 'article'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Article exported as Markdown.');
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-navy mb-1">SEO Audit Score</h2>
        <p className="text-sm text-muted-foreground">
          Final quality check across 7 ranking factors. Export your article to publish manually.
        </p>
      </div>

      {/* Overall score */}
      <Card className="border-border shadow-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="text-center">
              <ScoreGauge score={overall} />
              <div className={`text-lg font-bold mt-2 ${overallLabel.color}`}>{overallLabel.text}</div>
              <div className="text-xs text-muted-foreground">Overall SEO Score</div>
            </div>
            <div className="flex-1 w-full min-w-0">
              <div className="flex flex-col gap-3">
                <ScoreRow label="Keyword Usage" score={scores.keywordUsage} />
                <ScoreRow label="Readability" score={scores.readability} />
                <ScoreRow label="Internal Links" score={scores.internalLinks} />
                <ScoreRow label="EEAT" score={scores.eeat} />
                <ScoreRow label="Heading Structure" score={scores.headingStructure} />
                <ScoreRow label="FAQ" score={scores.faq} />
                <ScoreRow label="Schema" score={scores.schema} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export actions */}
      <Card className="border-border shadow-card">
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-sm font-semibold text-navy">Export Your Article</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground mb-4 text-pretty">
            Your article is ready. Copy or export below, then publish manually to your website or CMS.
            <strong className="text-navy"> Direct publishing is intentionally not available</strong> — review before you publish.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="border-border gap-2 h-10"
              onClick={() => setPreview(!preview)}
            >
              {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {preview ? 'Hide Preview' : 'Preview Article'}
            </Button>
            <Button
              variant="outline"
              className="border-border gap-2 h-10"
              onClick={handleCopy}
            >
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Markdown'}
            </Button>
            <Button
              variant="outline"
              className="border-border gap-2 h-10"
              onClick={handleExportHTML}
            >
              <Download className="w-4 h-4" /> Export as HTML
            </Button>
            <Button
              variant="outline"
              className="border-border gap-2 h-10"
              onClick={handleExportMD}
            >
              <Download className="w-4 h-4" /> Export as Markdown
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Article preview */}
      {preview && (
        <Card className="border-border shadow-card">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold text-navy">Article Preview</CardTitle>
          </CardHeader>
          <CardContent className="p-5 max-h-96 overflow-y-auto">
            <h1 className="text-xl font-bold text-navy mb-4 text-balance">{state.brief?.title}</h1>
            <pre className="text-sm text-foreground/75 whitespace-pre-wrap font-sans leading-relaxed text-pretty">
              {state.fullContent}
            </pre>
            {state.faqItems.filter((f) => f.keep).length > 0 && (
              <div className="mt-6 pt-4 border-t border-border">
                <h2 className="text-base font-bold text-navy mb-3">FAQ</h2>
                {state.faqItems.filter((f) => f.keep).map((f, i) => (
                  <div key={i} className="mb-4">
                    <p className="font-semibold text-sm text-navy mb-1 text-balance">{f.question}</p>
                    <p className="text-sm text-muted-foreground text-pretty">{f.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Completion notice */}
      <div className="p-4 bg-success/5 border border-success/30 rounded-lg flex items-start gap-3">
        <Trophy className="w-5 h-5 text-success shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-success">Article Complete!</p>
          <p className="text-xs text-muted-foreground text-pretty mt-0.5">
            Your article has been saved and scored {overall}/100. Export the content and review it before publishing to your site.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-start pt-2">
        <Button variant="outline" className="h-10 border-border" onClick={onBack}>Back</Button>
      </div>
    </div>
  );
}
