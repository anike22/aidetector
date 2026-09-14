import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  FileSearch,
  PenTool,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';

const FAQS = [
  {
    q: 'What is the best AI checker for bloggers?',
    a: 'The best AI checker for a blogger should do more than return one AI percentage. It should help you review likely AI-written passages, check originality, protect against plagiarism, improve publishing quality, and make the result easy to interpret before a post goes live. AIDetector.cx combines AI detection with plagiarism checking and SEO-focused content review so bloggers can use one pre-publication workflow.',
  },
  {
    q: 'Can bloggers use an AI checker before publishing?',
    a: 'Yes. A pre-publication AI check can be used as an editorial signal before a draft is published. The result should not be treated as proof of authorship. Review flagged sections in context, verify originality, and make a human editorial decision.',
  },
  {
    q: 'Does Google penalize blog posts just because AI was used?',
    a: 'Google focuses on content quality and usefulness rather than treating AI use by itself as an automatic penalty. Bloggers should prioritize helpful, original, accurate content created for people rather than publishing low-value pages at scale.',
  },
  {
    q: 'Can an AI detector be 100% accurate?',
    a: 'No responsible AI detector should be treated as perfect. Detection is probabilistic. Human writing can sometimes be flagged and AI-assisted text can sometimes pass. Use the result together with editorial review, source checking, plagiarism analysis, and knowledge of how the content was created.',
  },
  {
    q: 'Should I rewrite every sentence that is flagged as AI?',
    a: 'No. A flagged sentence is a signal to inspect, not an instruction to rewrite automatically. Check whether the sentence is repetitive, generic, overly predictable, unsupported, or inconsistent with your normal voice. Preserve clear writing when it is already strong.',
  },
  {
    q: 'Can I check plagiarism and AI writing in the same workflow?',
    a: 'Yes. AIDetector.cx provides an AI detector and a plagiarism checker, while the SEO Assistant adds content-quality and search-focused review. That lets bloggers evaluate multiple publishing risks before going live.',
  },
];

const workflow = [
  {
    icon: Bot,
    title: '1. Check AI-writing signals',
    text: 'Run the draft through the Balanced AI Detector and review the overall probability together with sentence-level signals.',
    href: '/detector',
    cta: 'Open AI Detector',
  },
  {
    icon: FileSearch,
    title: '2. Check originality and plagiarism',
    text: 'Verify whether passages overlap with web or academic sources before you publish or deliver work to a client.',
    href: '/plagiarism-checker',
    cta: 'Check Plagiarism',
  },
  {
    icon: Search,
    title: '3. Review SEO and readability',
    text: 'Use the SEO Assistant to inspect search intent, headings, semantic coverage, readability, internal linking, and other on-page signals.',
    href: '/seo-assistant',
    cta: 'Use SEO Assistant',
  },
  {
    icon: PenTool,
    title: '4. Edit with human judgment',
    text: 'Fix weak or generic passages, add first-hand detail, verify claims, and preserve your own voice instead of chasing a detector score.',
    href: '/humanizer',
    cta: 'Open Writing Tools',
  },
];

const criteria = [
  'Sentence-level signals, not only one percentage',
  'Clear uncertainty and responsible interpretation',
  'Plagiarism and originality checks in the same publishing workflow',
  'SEO and readability review for search-focused bloggers',
  'Support for long-form drafts and editorial review',
  'A workflow that helps improve the article instead of only labeling it',
];

export default function AICheckerForBloggersPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AIDetector.cx AI Checker for Bloggers',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: 'https://aidetector.cx/ai-checker-for-bloggers',
    description:
      'A pre-publication AI checking workflow for bloggers combining AI detection, plagiarism review, SEO analysis, and editorial guidance.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free checks are available; paid plans provide additional usage and features.',
    },
  };

  return (
    <MainLayout>
      <PageMeta
        title="AI Checker for Bloggers: Detect AI, Plagiarism & SEO Issues | AIDetector.cx"
        description="Check blog posts for AI-writing signals, plagiarism, originality and SEO issues before publishing. Built for bloggers, editors and content teams."
        canonicalUrl="https://aidetector.cx/ai-checker-for-bloggers"
        ogTitle="AI Checker for Bloggers | AIDetector.cx"
        ogDescription="A pre-publication workflow for bloggers: AI detection, plagiarism checking, SEO review and editorial guidance in one place."
        schemas={[softwareSchema, faqSchema]}
      />

      <section className="relative overflow-hidden border-b border-border/60 bg-background">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-24 md:px-6 md:pb-24 md:pt-32">
          <Breadcrumbs items={[{ label: 'AI Detector', href: '/detector' }, { label: 'AI Checker for Bloggers' }]} />

          <div className="mx-auto mt-8 max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Pre-publish content review for bloggers
            </div>

            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              AI Checker for Bloggers: Review AI, Plagiarism and SEO Before You Publish
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-pretty text-lg leading-8 text-muted-foreground md:text-xl">
              Check a blog draft for AI-writing signals, originality problems and search-quality issues in one editorial workflow. Use the score as evidence to review — not as automatic proof of who wrote the article.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild className="h-12 px-7">
                <Link to="/detector">
                  Check My Blog Post <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-7">
                <Link to="/seo-assistant">Review SEO Before Publishing</Link>
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              No detector is infallible. Always combine automated analysis with human editorial judgment.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">What should the best AI checker for bloggers actually do?</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Bloggers do not need another isolated percentage. A useful checker should support the decision that matters: whether a draft is ready to publish.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {criteria.map((item) => (
              <Card key={item} className="border-border/70 bg-card/70">
                <CardContent className="flex gap-3 p-5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="leading-7 text-foreground">{item}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="lg:sticky lg:top-24">
              <div className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                <Target className="h-4 w-4" />
                Blogger publishing workflow
              </div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">From first draft to publish-ready review</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                AIDetector.cx is most useful to a blogger when the tools work together. Start with detection, then check originality and search quality before making the final editorial call.
              </p>
              <div className="mt-7 rounded-xl border border-border bg-muted/40 p-5">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold">Responsible interpretation</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      AI detection is probabilistic. Use flagged passages to guide review, then verify the writing, sources and context yourself.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {workflow.map(({ icon: Icon, title, text, href, cta }) => (
                <Card key={title}>
                  <CardContent className="p-6 md:p-7">
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">{title}</h3>
                        <p className="mt-2 leading-7 text-muted-foreground">{text}</p>
                        <Link to={href} className="mt-4 inline-flex items-center text-sm font-semibold text-primary hover:underline">
                          {cta} <ArrowRight className="ml-1.5 h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted/30 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">How to interpret an AI score on a blog post</h2>
            <div className="mt-6 space-y-5 text-base leading-8 text-muted-foreground md:text-lg">
              <p>
                An AI score is not a verdict on authorship. It is an estimate based on patterns the detector associates with machine-generated or human-written text. That distinction matters for bloggers because polished human writing can look statistically predictable, while heavily edited AI text can look less predictable.
              </p>
              <p>
                Instead of asking only “What percentage is AI?”, inspect where the strongest signals appear. A generic introduction, repetitive transition pattern, formulaic conclusion or unusually uniform sentence structure may deserve a closer edit. A well-sourced technical paragraph written in a consistent style may be perfectly legitimate even when a detector is uncertain.
              </p>
              <p>
                The practical objective is a stronger article: original reporting where possible, accurate claims, useful examples, a clear point of view, transparent sourcing, and a structure that answers the reader’s search intent.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardContent className="p-7">
                <Bot className="h-7 w-7 text-primary" />
                <h2 className="mt-5 text-2xl font-semibold">For independent bloggers</h2>
                <p className="mt-3 leading-7 text-muted-foreground">
                  Review your own draft before publishing without turning the process into a hunt for a perfect detector score.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-7">
                <FileSearch className="h-7 w-7 text-primary" />
                <h2 className="mt-5 text-2xl font-semibold">For editors and publishers</h2>
                <p className="mt-3 leading-7 text-muted-foreground">
                  Use consistent AI and plagiarism checks when reviewing freelancer, contributor or agency submissions.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-7">
                <Search className="h-7 w-7 text-primary" />
                <h2 className="mt-5 text-2xl font-semibold">For SEO content teams</h2>
                <p className="mt-3 leading-7 text-muted-foreground">
                  Combine content integrity checks with intent, semantic coverage, internal linking and readability analysis.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="mt-8 rounded-xl border border-border bg-background px-5 md:px-7">
            {FAQS.map((faq, index) => (
              <AccordionItem key={faq.q} value={`faq-${index}`}>
                <AccordionTrigger className="text-left text-base font-semibold md:text-lg">{faq.q}</AccordionTrigger>
                <AccordionContent className="pb-5 text-base leading-7 text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 text-center md:px-6">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/10 to-background p-8 md:p-12">
            <Sparkles className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl">Check your next blog post before it goes live</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
              Start with AI detection, then review plagiarism and SEO quality before making your final publishing decision.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to="/detector">Check a Blog Post <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/plagiarism-checker">Check Originality</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
