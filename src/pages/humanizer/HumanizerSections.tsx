import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Check, ChevronDown, BarChart2, FileSearch, PenTool, Search, Globe,
  Puzzle, BookOpen, ArrowRight, Sparkles, Eye, Zap, RefreshCw, ShieldCheck, Code2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCustomerDataPlatform } from '@/contexts/CustomerDataPlatformContext';

interface InternalLinkProps {
  to: string;
  children: React.ReactNode;
  linkText: string;
}

function InternalLink({ to, children, linkText }: InternalLinkProps) {
  const { trackEvent } = useCustomerDataPlatform();

  const handleClick = () => {
    trackEvent({
      event_type: 'custom',
      metadata: { event_name: 'internal_link_clicked', link_text: linkText, link_url: to }
    });
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      className="text-primary hover:text-primary/80 underline underline-offset-4 font-medium"
    >
      {children}
    </Link>
  );
}

function SectionHeading({ children, subtitle }: { children: React.ReactNode; subtitle?: string }) {
  return (
    <div className="space-y-2 md:space-y-3 max-w-3xl">
      <h2 className="text-xl md:text-3xl font-bold tracking-tight text-balance text-foreground">
        {children}
      </h2>
      {subtitle && <p className="text-sm md:text-base text-muted-foreground text-pretty">{subtitle}</p>}
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
        {number}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm md:text-base font-semibold">{title}</h3>
        <p className="text-xs md:text-sm text-muted-foreground text-pretty">{description}</p>
      </div>
    </div>
  );
}

const BEST_PRACTICES = [
  {
    title: 'Review every rewrite carefully',
    description: 'Humanizers improve flow, but only you can confirm that nuance, technical terms, and brand voice remain intact. Always read the output before publishing.'
  },
  {
    title: 'Verify facts and citations',
    description: 'Enable fact preservation and protected terms, then double-check statistics, dates, names, and references in the final version.'
  },
  {
    title: 'Choose the right humanization level',
    description: 'Use Light mode for minor polishing, Balanced for general content, and Advanced only when the original shows strong robotic patterns.'
  },
  {
    title: 'Preserve your target keywords',
    description: 'Turn on keyword preservation for SEO content so important phrases survive the rewrite and rankings remain stable.'
  },
  {
    title: 'Run a final quality check',
    description: 'After humanizing, use the sentence analysis and readability report to catch any remaining awkward phrasing before you finalize.'
  }
];

const RELATED_TOOLS = [
  { icon: BarChart2, label: 'AI Detector', href: '/detector', description: 'Identify AI-generated text across models and use cases.' },
  { icon: PenTool, label: 'Grammar Checker', href: '/grammar-checker', description: 'Catch grammar, punctuation, and style issues instantly.' },
  { icon: FileSearch, label: 'Plagiarism Checker', href: '/plagiarism-checker', description: 'Verify originality before you publish or submit.' },
  { icon: Search, label: 'SEO Assistant', href: '/seo-assistant', description: 'Optimize content structure, keywords, and readability.' },
  { icon: Code2, label: 'API Platform', href: '/api', description: 'Integrate humanization into your app, CMS, or pipeline.' },
  { icon: Globe, label: 'Chrome Extension', href: '/chrome-extension', description: 'Detect and humanize text anywhere on the web.' },
  { icon: Puzzle, label: 'WordPress Plugin', href: '/wordpress-plugin', description: 'Add humanization directly into your WordPress workflow.' },
];

const FAQS = [
  {
    q: 'What is an AI Humanizer?',
    a: 'An AI humanizer is a writing tool that rewrites machine-generated text to read more naturally. It changes sentence structure, word choice, and rhythm while keeping the original meaning, facts, and intent intact.'
  },
  {
    q: 'How does the AIDetector.cx humanizer preserve meaning?',
    a: 'Our system first analyzes the input to identify facts, protected terms, and semantic structure. It then generates alternatives and verifies that core claims remain unchanged. You can also lock specific keywords, names, and citations so they are never altered.'
  },
  {
    q: 'Can I use the humanizer for academic or professional writing?',
    a: 'Yes. Academic and Professional tones preserve formal register and technical vocabulary while improving sentence variety. Always follow your institution’s or publisher’s policies on AI-assisted writing.'
  },
  {
    q: 'What file formats are supported?',
    a: 'You can paste text directly or upload TXT, DOCX, PDF, RTF, and Markdown files up to 10MB. Documents are processed in memory and never stored after the request completes.'
  },
  {
    q: 'Is my content secure and private?',
    a: 'Yes. We process content over encrypted connections, do not store your text after processing, and never use it for model training. Enterprise customers can also request dedicated processing environments.'
  },
  {
    q: 'How long does humanization take?',
    a: 'Most short texts finish in a few seconds. Longer documents up to 50,000 characters typically complete in under a minute. You receive three alternative versions when processing finishes.'
  },
  {
    q: 'Is there an API for developers?',
    a: 'Yes. The AIDetector.cx API lets you integrate humanization into any application. It supports REST endpoints, authentication, rate limits, and usage tracking. Visit the API Platform page for documentation.'
  },
  {
    q: 'How is this different from a basic paraphrasing tool?',
    a: 'A paraphraser changes words to avoid duplication. Our humanizer is built to reduce AI-writing signals, preserve meaning, and produce alternatives with different levels of naturalness — not just synonym swaps.'
  }
];

function FAQItem({ item, index }: { item: typeof FAQS[0]; index: number }) {
  const [open, setOpen] = useState(false);
  const { trackEvent } = useCustomerDataPlatform();

  const handleToggle = () => {
    if (!open) {
      trackEvent({
        event_type: 'custom',
        metadata: { event_name: 'faq_clicked', question: item.q, index }
      });
    }
    setOpen(!open);
  };

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-muted/30 transition-colors min-h-[48px]"
        aria-expanded={open}
      >
        <span className="text-sm md:text-base font-medium text-foreground">{item.q}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-1 fade-in-50 duration-200">
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed text-pretty">{item.a}</p>
        </div>
      )}
    </div>
  );
}

function useTrackedInternalLink() {
  const { trackEvent } = useCustomerDataPlatform();
  return (label: string, href: string) => {
    trackEvent({
      event_type: 'custom',
      metadata: { event_name: 'internal_link_clicked', link_text: label, link_url: href }
    });
  };
}

export default function HumanizerSections() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const { trackEvent } = useCustomerDataPlatform();
  const trackLink = useTrackedInternalLink();

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackEvent({
            event_type: 'custom',
            metadata: { event_name: 'scroll_depth', percentage: 50, section: 'SEO Content' }
          });
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [trackEvent]);

  return (
    <section ref={sectionRef} className="py-10 md:py-16 bg-background">
      <div className="container mx-auto px-4 max-w-6xl space-y-12 md:space-y-20">

        {/* What is an AI Humanizer? */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-start">
          <div className="space-y-4">
            <SectionHeading subtitle="A practical guide to humanizing AI-generated content without losing accuracy.">
              What is an AI Humanizer?
            </SectionHeading>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-pretty">
              AI humanizers rewrite machine-generated text so it reads as if a person wrote it. They adjust sentence rhythm,
              vocabulary diversity, and transitions while protecting the facts, names, numbers, and citations that must stay
              the same. The goal is not to hide that AI was used — it is to make the final text clearer, more engaging, and
              more natural for real readers.
            </p>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-pretty">
              Content creators, students, marketers, researchers, and enterprise teams use humanizers to polish drafts produced
              by ChatGPT, Claude, Gemini, and other large language models. After humanizing, many writers run the output
              through an <InternalLink to="/detector" linkText="AI Detector">AI Detector</InternalLink> to confirm the text no
              longer carries obvious robotic patterns.
            </p>
          </div>
          <Card className="bg-muted/30 border-border/80">
            <CardContent className="p-4 md:p-6 space-y-4">
              <h3 className="text-sm md:text-base font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Core principles
              </h3>
              <ul className="space-y-2 text-xs md:text-sm text-muted-foreground">
                {[
                  'Preserve original meaning and facts',
                  'Increase sentence variation and flow',
                  'Remove repetitive AI-style transitions',
                  'Match tone and reading level to audience',
                  'Offer multiple rewrite alternatives'
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* How It Works */}
        <div className="space-y-6 md:space-y-8">
          <SectionHeading subtitle="A transparent, multi-stage pipeline from raw AI text to polished human writing.">
            How Our AI Humanizer Works
          </SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StepCard number="1" title="Analyze Meaning" description="The system parses sentence structure, identifies entities, and maps semantic relationships so nothing important is lost." />
            <StepCard number="2" title="Protect Facts" description="Names, dates, numbers, technical terms, and citations are flagged for preservation during rewriting." />
            <StepCard number="3" title="Plan Improvements" description="A rewrite plan selects the best sentence splits, merges, and vocabulary changes for the chosen tone and level." />
            <StepCard number="4" title="Generate Alternatives" description="Three distinct versions are created: Most Faithful, Most Natural, and Most Concise." />
            <StepCard number="5" title="Verify Meaning" description="Each alternative is checked against the original to confirm facts, claims, and intent remain intact." />
            <StepCard number="6" title="Score Quality" description="Readability, vocabulary diversity, sentence variation, and AI-signal metrics are calculated for every version." />
            <StepCard number="7" title="Deliver Results" description="You review alternatives, compare before and after, and select the version that fits your needs." />
            <StepCard number="8" title="API & Integrations" description="Developers can run the same pipeline through the REST API or CMS plugins, making humanization part of any content workflow." />
          </div>
          <p className="text-sm md:text-base text-muted-foreground text-pretty">
            Learn more about integrating humanization into your product on the{' '}
            <InternalLink to="/api" linkText="API Platform">API Platform</InternalLink> page.
          </p>
        </div>

        <Separator />

        {/* Why Preserving Meaning Matters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
          <div className="order-2 md:order-1">
            <Card className="bg-muted/30 border-border/80">
              <CardContent className="p-4 md:p-6 space-y-4">
                <h3 className="text-sm md:text-base font-semibold flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  Why meaning integrity comes first
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed text-pretty">
                  A rewrite that sounds natural but changes a key statistic, date, or conclusion is worse than useless — it is
                  misleading. That is why AIDetector.cx treats meaning preservation as the primary constraint and naturalness
                  as a secondary optimization.
                </p>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed text-pretty">
                  Use the <InternalLink to="/grammar-checker" linkText="Grammar Checker">Grammar Checker</InternalLink> alongside
                  the humanizer to catch any remaining language issues before publication.
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4 order-1 md:order-2">
            <SectionHeading subtitle="Natural writing is worthless if the message is wrong.">
              Why Preserving Meaning and Facts Matters
            </SectionHeading>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-pretty">
              Many rewriting tools focus only on surface changes: synonyms, sentence length, and word order. The result can feel
              natural but quietly distort the original message. In legal, medical, financial, and research contexts, even small
              meaning shifts can have serious consequences.
            </p>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-pretty">
              Our humanizer is built around meaning-aware rewriting. It identifies protected entities, verifies semantic
              similarity, and rejects alternatives that drift too far from the source. This makes it safe for high-stakes
              documents where accuracy is non-negotiable.
            </p>
          </div>
        </div>

        <Separator />

        {/* AI Humanizer vs AI Rewriter */}
        <div className="space-y-6 md:space-y-8">
          <SectionHeading subtitle="Two related tools with different goals. Choose the one that matches your needs.">
            AI Humanizer vs AI Rewriter: What’s the Difference?
          </SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 md:p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="text-base md:text-lg font-semibold">AI Humanizer</h3>
                </div>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-pretty">
                  Designed to reduce AI-writing signals and improve readability while preserving the original meaning, facts,
                  and intent. It produces multiple alternatives and is ideal for refining AI-generated drafts into natural,
                  audience-ready content.
                </p>
                <ul className="space-y-1.5 text-xs md:text-sm text-muted-foreground">
                  {['Preserves meaning and facts', 'Reduces robotic patterns', 'Multiple rewrite styles', 'Sentence-level control'].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-border/80 bg-card">
              <CardContent className="p-4 md:p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-base md:text-lg font-semibold">AI Rewriter</h3>
                </div>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-pretty">
                  Focuses on changing wording to avoid duplication or match a new style. Paraphrasing tools often swap
                  synonyms and restructure sentences without guaranteeing that facts, tone, or intent stay the same.
                </p>
                <ul className="space-y-1.5 text-xs md:text-sm text-muted-foreground">
                  {['Changes wording to avoid similarity', 'May alter tone or emphasis', 'Often single output', 'Best for surface-level changes'].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
          <p className="text-sm md:text-base text-muted-foreground text-center text-pretty">
            If originality is your main concern, run the result through the{' '}
            <InternalLink to="/plagiarism-checker" linkText="Plagiarism Checker">Plagiarism Checker</InternalLink> before publishing.
          </p>
        </div>

        <Separator />

        {/* Best Practices */}
        <div className="space-y-6 md:space-y-8">
          <SectionHeading subtitle="Get the best results from every humanization.">
            Best Practices for Using an AI Humanizer
          </SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {BEST_PRACTICES.map((item) => (
              <Card key={item.title} className="bg-card border-border/80 hover:border-primary/30 transition-colors">
                <CardContent className="p-4 md:p-5 space-y-2">
                  <h3 className="text-sm md:text-base font-semibold flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    {item.title}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed text-pretty">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-sm md:text-base text-muted-foreground text-pretty">
            For content that must perform in search, combine these steps with the{' '}
            <InternalLink to="/seo-assistant" linkText="SEO Assistant">SEO Assistant</InternalLink> to validate structure,
            keyword placement, and readability.
          </p>
        </div>

        <Separator />

        {/* FAQ */}
        <div className="space-y-6 md:space-y-8 max-w-3xl mx-auto">
          <SectionHeading subtitle="Quick answers to common questions about the AIDetector.cx humanizer.">
            Frequently Asked Questions
          </SectionHeading>
          <div className="space-y-3">
            {FAQS.map((item, index) => (
              <FAQItem key={index} item={item} index={index} />
            ))}
          </div>
          <p className="text-xs md:text-sm text-muted-foreground text-center">
            Looking for more? Read the <InternalLink to="/blog" linkText="Blog">Blog</InternalLink> or visit the{' '}
            <InternalLink to="/pricing" linkText="Pricing">Pricing</InternalLink> page to compare plans.
          </p>
        </div>

        <Separator />

        {/* Related Tools */}
        <div className="space-y-6 md:space-y-8">
          <SectionHeading subtitle="Explore the full AIDetector.cx platform.">
            Related Tools
          </SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {RELATED_TOOLS.map(({ icon: Icon, label, href, description }) => (
              <Link
                key={href}
                to={href}
                onClick={() => trackLink(label, href)}
                className="group p-4 md:p-5 rounded-lg bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm md:text-base font-semibold">{label}</h3>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed text-pretty mb-3">{description}</p>
                <div className="flex items-center text-xs font-medium text-primary">
                  Explore <ArrowRight className="h-3 w-3 ml-1" />
                </div>
              </Link>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to="/chrome-extension">Install Chrome Extension</Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to="/wordpress-plugin">Get WordPress Plugin</Link>
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link to="/pricing">Compare Plans</Link>
            </Button>
          </div>
        </div>

      </div>
    </section>
  );
}
