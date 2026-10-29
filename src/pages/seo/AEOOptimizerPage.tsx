import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Zap, MessageSquare, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { seoApi } from '@/lib/api/seo';
import PageMeta from '@/components/common/PageMeta';

export default function AEOOptimizerPage() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return toast.error('Please enter a domain');
    try {
      setLoading(true);
      const data = await seoApi.runAEOOptimizer(domain);
      setReport(data);
      toast.success('AEO Analysis completed!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to run AEO analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full min-h-screen bg-background">\n      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-10">
      <PageMeta title="AEO Optimizer & Answer Engine Optimization Audit | AIDetector.cx" description="Audit your website for answer engine optimization (AEO). Check headings, FAQ schema, metadata, canonical tags, author signals, and content readiness for AI search." canonicalUrl="https://www.aidetector.cx/aeo-optimizer" />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AEO Optimizer</h1>
        <p className="text-muted-foreground mt-1">Assess HTML content readiness for AI answer engines.</p>
        <p className="text-sm text-muted-foreground mt-2" role="note">Requires a Pro entitlement and 30 credits. Not available using free introductory checks. This analysis measures HTML signals, not actual appearances or rankings in AI answers.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleAudit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter domain or URL to optimize for AEO (e.g., example.com)"
                className="pl-9 h-12"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" disabled={loading} className="sm:shrink-0">
              {loading ? 'Running Analysis...' : 'Run AEO Analysis'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {!report && <section className="grid gap-4 md:grid-cols-3" aria-label="What the audit checks">
        <Card><CardHeader><CardTitle className="text-lg">Content structure</CardTitle><CardDescription>Heading hierarchy, question-led answers and content depth.</CardDescription></CardHeader></Card>
        <Card><CardHeader><CardTitle className="text-lg">Search metadata</CardTitle><CardDescription>Page titles, descriptions, canonical signals and structured data.</CardDescription></CardHeader></Card>
        <Card><CardHeader><CardTitle className="text-lg">Trust signals</CardTitle><CardDescription>Visible author, contact, sources and page credibility signals.</CardDescription></CardHeader></Card>
      </section>}
      <p className="text-sm text-muted-foreground">Readiness scores summarize observable HTML checks. They are not measured visibility, citations, traffic or rankings within AI platforms.</p>
      {report && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">AEO Results for {report.domain_url}</h2>
            <div className="flex gap-2">
              
              
            </div>
          </div>

          <p className="text-sm text-muted-foreground">Evidence-based HTML readiness assessment. Scores are heuristics, not measured search visibility or AI citations. Inspect the observed checks before acting.</p>
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
            <Card className="col-span-2 md:col-span-2 bg-primary/5 border-primary/20">
              <CardContent className="pt-6 flex flex-col items-center text-center justify-center">
                <span className="text-sm font-medium text-muted-foreground mb-2">Overall AEO Score</span>
                <span className="text-6xl font-bold text-primary">{report.overall_aeo_score}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center justify-center h-full">
                <span className="text-sm font-medium text-muted-foreground mb-2">Question Cov.</span>
                <span className="text-2xl font-bold">{report.question_coverage_score}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center justify-center h-full">
                <span className="text-sm font-medium text-muted-foreground mb-2">Entity Cov.</span>
                <span className="text-2xl font-bold">{report.entity_coverage_score}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center justify-center h-full">
                <span className="text-sm font-medium text-muted-foreground mb-2">FAQ Quality</span>
                <span className="text-2xl font-bold">{report.faq_quality_score}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center justify-center h-full">
                <span className="text-sm font-medium text-muted-foreground mb-2">E-E-A-T</span>
                <span className="text-2xl font-bold">{report.eeat_score}</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center text-center justify-center h-full">
                <span className="text-sm font-medium text-muted-foreground mb-2">Schema</span>
                <span className="text-2xl font-bold">{report.structured_data_score}</span>
              </CardContent>
            </Card>
          </div>

          {report.aeo_data?.checks && <Card><CardHeader><CardTitle>Observed HTML checks</CardTitle></CardHeader><CardContent><ul className="space-y-2">{report.aeo_data.checks.map((check: any, index: number) => <li key={index} className="text-sm"><strong>{check.pass ? "Passed" : "Needs attention"}: {check.check}</strong> — {check.evidence}</li>)}</ul></CardContent></Card>}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-amber-500" /> AI Platform Visibility
                </CardTitle>
                <CardDescription>AI-platform appearances are not measured by this HTML audit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">ChatGPT</span>
                    <span className="font-bold">{report.aeo_data?.platforms?.chatgpt ?? 'Not measured'}</span>
                  </div>
                  <Progress value={report.aeo_data?.platforms?.chatgpt} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">Gemini</span>
                    <span className="font-bold">{report.aeo_data?.platforms?.gemini ?? 'Not measured'}</span>
                  </div>
                  <Progress value={report.aeo_data?.platforms?.gemini} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">Claude</span>
                    <span className="font-bold">{report.aeo_data?.platforms?.claude ?? 'Not measured'}</span>
                  </div>
                  <Progress value={report.aeo_data?.platforms?.claude} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">Perplexity</span>
                    <span className="font-bold">{report.aeo_data?.platforms?.perplexity ?? 'Not measured'}</span>
                  </div>
                  <Progress value={report.aeo_data?.platforms?.perplexity} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-500" /> Missing Questions & Entities
                </CardTitle>
                <CardDescription>Missing on-page signals observed in retrieved HTML, not competitor or search volume data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3 border-b pb-2">Top Missing Questions</h4>
                  <ul className="space-y-3">
                    {report.aeo_data?.missing_questions?.map((mq: any, i: number) => (
                      <li key={i} className="flex justify-between items-center text-sm">
                        <span className="truncate max-w-[70%]">{mq.q}</span>
                        <Badge variant="secondary">HTML check</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-3 border-b pb-2">Unverified entities</h4>
                  <ul className="space-y-3">
                    {report.aeo_data?.missing_entities?.map((me: any, i: number) => (
                      <li key={i} className="flex justify-between items-center text-sm">
                        <span>{me.e}</span>
                        <span className="text-muted-foreground">Rel: {me.rel}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      <section className="space-y-6" aria-labelledby="aeo-definition">
        <div className="max-w-3xl space-y-3">
          <h2 id="aeo-definition" className="text-3xl font-bold tracking-tight">What is answer engine optimization (AEO)?</h2>
          <p className="leading-7 text-muted-foreground">Answer engine optimization helps make website content understandable to search and AI-powered answer systems. It complements SEO by emphasizing direct answers, descriptive headings, structured data, and credible source information. Neither technical optimization nor a readiness score guarantees placement in AI-generated answers.</p>
          <p className="leading-7 text-muted-foreground">This AEO checker evaluates observable HTML from the URL you submit. It checks content and metadata signals, not actual ChatGPT citations, Google AI Overviews appearances, traffic, or rankings.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card><CardHeader><CardTitle>Answer-focused content</CardTitle><CardDescription>Use descriptive headings, clear answers to relevant questions, and useful explanations that address search intent.</CardDescription></CardHeader></Card>
          <Card><CardHeader><CardTitle>Structured data and entities</CardTitle><CardDescription>Use accurate structured data and consistent terminology where appropriate. Schema markup is helpful context, not a ranking guarantee.</CardDescription></CardHeader></Card>
          <Card><CardHeader><CardTitle>Metadata and canonical signals</CardTitle><CardDescription>Check title tags, descriptions, canonical URLs and indexability signals so important content can be discovered and evaluated.</CardDescription></CardHeader></Card>
          <Card><CardHeader><CardTitle>Trust and attribution</CardTitle><CardDescription>Clarify authorship, provide contact information and cite verifiable evidence for substantive claims.</CardDescription></CardHeader></Card>
        </div>
      </section>
      <section className="rounded-3xl border bg-muted/40 p-6 sm:p-10 space-y-6" aria-labelledby="aeo-steps">
        <h2 id="aeo-steps" className="text-3xl font-bold">How the AEO audit works</h2>
        <ol className="grid gap-5 md:grid-cols-3">
          <li><strong>1. Submit a public URL</strong><p className="mt-2 text-sm leading-6 text-muted-foreground">Enter a website address to retrieve its publicly accessible HTML.</p></li>
          <li><strong>2. Inspect the evidence</strong><p className="mt-2 text-sm leading-6 text-muted-foreground">Review observed headings, questions, schema, metadata, canonical and trust signals.</p></li>
          <li><strong>3. Improve and recheck</strong><p className="mt-2 text-sm leading-6 text-muted-foreground">Update the content and technical markup, then compare the new results. Use Search Console for indexing decisions.</p></li>
        </ol>
      </section>
      <section className="space-y-5" aria-labelledby="aeo-related-tools">
        <h2 id="aeo-related-tools" className="text-3xl font-bold">AEO and SEO work better together</h2>
        <p className="max-w-3xl leading-7 text-muted-foreground">AEO focuses on extractable answers and content clarity, while SEO also addresses crawling, search intent, site structure, and discoverability. Use the following tools alongside the AEO Optimizer for a broader publishing workflow.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Card><CardHeader><CardTitle>SEO Assistant</CardTitle><CardDescription>Explore broader technical SEO and content-optimization workflows alongside this on-page AEO audit.</CardDescription></CardHeader><CardContent><Link to="/seo-assistant" className="font-semibold text-primary underline underline-offset-4">Explore SEO Assistant</Link></CardContent></Card>
          <Card><CardHeader><CardTitle>AI Checker for Bloggers</CardTitle><CardDescription>Review blog content for editorial readiness, originality, readability, and SEO quality before publication.</CardDescription></CardHeader><CardContent><Link to="/ai-checker-for-bloggers" className="font-semibold text-primary underline underline-offset-4">Open AI Checker for Bloggers</Link></CardContent></Card>
        </div>
      </section>
      <section className="space-y-4" aria-labelledby="aeo-questions">
        <h2 id="aeo-questions" className="text-3xl font-bold">Frequently asked questions about AEO</h2>
        <div className="space-y-4">
          <div><h3 className="font-semibold">What does an AEO audit measure?</h3><p className="text-sm leading-6 text-muted-foreground">Observable HTML readiness signals including headings, question coverage, metadata, JSON-LD structured data, and author or trust indicators.</p></div>
          <div><h3 className="font-semibold">Is AEO different from traditional SEO?</h3><p className="text-sm leading-6 text-muted-foreground">AEO emphasizes answer clarity and content interpretation. Traditional SEO covers broader visibility, including indexing, relevance, and site architecture. Both are complementary.</p></div>
          <div><h3 className="font-semibold">Can an AEO score guarantee visibility in ChatGPT or Google AI Overviews?</h3><p className="text-sm leading-6 text-muted-foreground">No. A readiness audit is not a direct measurement of AI citations or rankings and cannot guarantee selection by an answer engine.</p></div>
          <div><h3 className="font-semibold">Does structured data guarantee AI citations?</h3><p className="text-sm leading-6 text-muted-foreground">No. Relevant structured data may help search systems understand content but does not guarantee any search feature or citation.</p></div>
        </div>
      </section>
      </div>
    </div>
  );
}
