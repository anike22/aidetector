import { Link } from 'react-router-dom';
import { LockKeyhole, Loader2, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEntitlement } from '@/hooks/useEntitlement';

const FEATURE_SLUG = 'seo_assistant';

export default function BloggerSEOWorkspace() {
  const { summary, loading } = useEntitlement(FEATURE_SLUG);
  const paid = Boolean(summary?.isPaidActive);

  return (
    <section id="blogger-workspace" className="border-y border-border/60 bg-muted/20 py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" /> Blogger SEO Workspace
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">Paste your article and optimize it before publishing</h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground md:text-lg">
            Paid members can use the complete SEO Writing Assistant here without leaving this page: keyword analysis, search intent, semantic coverage, readability, headings, E-E-A-T, internal links, snippet potential and publishing readiness.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
          {loading ? (
            <div className="flex min-h-[420px] items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Checking membership…
            </div>
          ) : paid ? (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-primary/5 px-4 py-3 md:px-6">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Paid workspace unlocked
                </div>
                <span className="text-xs text-muted-foreground">Uses your existing SEO Assistant entitlement and credits</span>
              </div>
              <iframe
                src="/seo-assistant"
                title="AIDetector.cx SEO Writing Assistant for Bloggers"
                className="h-[820px] w-full border-0 md:h-[900px]"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="relative min-h-[500px] overflow-hidden p-5 md:p-8">
              <div aria-hidden="true" className="pointer-events-none select-none opacity-45 blur-[1px]">
                <div className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
                  <div className="rounded-xl border border-border p-5">
                    <div className="mb-4 h-9 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">Primary keyword</div>
                    <div className="min-h-[280px] rounded-lg border border-border bg-background p-4 text-left text-sm leading-7 text-muted-foreground">
                      Paste or write your blog article here to begin the publishing review…
                    </div>
                  </div>
                  <div className="space-y-3">
                    {['Overall SEO Score', 'Search Intent', 'Semantic Keywords', 'Readability', 'Heading Structure', 'E-E-A-T', 'Internal Linking'].map((label) => (
                      <div key={label} className="rounded-lg border border-border bg-background p-4 text-sm font-medium">{label}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center bg-background/72 p-5 backdrop-blur-[2px]">
                <div className="max-w-lg rounded-2xl border border-primary/20 bg-background p-7 text-center shadow-xl md:p-9">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <LockKeyhole className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-2xl font-bold">Full Blogger Analysis is a paid feature</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">
                    Upgrade to paste your article here and unlock the complete SEO Assistant workflow. Your existing paid plan and credits are used—there is no separate blogger subscription.
                  </p>
                  <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                    <Button asChild size="lg"><Link to="/pricing">View Paid Plans</Link></Button>
                    {!summary?.isAuthenticated && <Button asChild size="lg" variant="outline"><Link to="/login">Sign In</Link></Button>}
                  </div>
                  <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Search className="h-3.5 w-3.5" /> SEO · readability · E-E-A-T · semantic coverage · publishing readiness
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
