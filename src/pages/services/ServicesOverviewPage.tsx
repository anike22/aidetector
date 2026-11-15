import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  Code2,
  FileSearch,
  GraduationCap,
  SearchCheck,
  WandSparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import PageMeta from '@/components/common/PageMeta';
import Breadcrumbs from '@/components/common/Breadcrumbs';

const products = [
  {
    title: 'AI Detector',
    description: 'Analyze writing for AI-generated, human-written, and mixed-content signals. Review independent detection modes and sentence-level evidence to understand the result.',
    href: '/detector',
    action: 'Check your text',
    icon: Bot,
  },
  {
    title: 'Essay Studio',
    description: 'A guided academic writing workspace to plan, outline, write, verify, improve, and cite your essays in one workflow.',
    href: '/essay-studio',
    action: 'Open Essay Studio',
    icon: GraduationCap,
  },
  {
    title: 'AI Humanizer',
    description: 'Refine AI-assisted drafts into more natural-sounding writing while working to preserve the original meaning and tone.',
    href: '/humanizer',
    action: 'Humanize text',
    icon: WandSparkles,
  },
  {
    title: 'Plagiarism Checker',
    description: 'Review text for duplication and source similarity as part of your originality and content-quality checks.',
    href: '/plagiarism-checker',
    action: 'Check originality',
    icon: FileSearch,
  },
  {
    title: 'SEO Assistant',
    description: 'Improve content quality with SEO-focused analysis, readability guidance, and optimization recommendations.',
    href: '/seo-assistant',
    action: 'Optimize content',
    icon: SearchCheck,
  },
  {
    title: 'API & Integrations',
    description: 'Explore developer documentation for connecting AIDetector.cx capabilities with your own applications and workflows.',
    href: '/api/docs',
    action: 'View API documentation',
    icon: Code2,
  },
];

const productCatalogSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'AIDetector.cx Products and Tools',
  itemListElement: products.map((product, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: product.title,
    url: `https://www.aidetector.cx${product.href}`,
  })),
};

export default function ServicesOverviewPage() {
  return (
    <main className="min-h-screen bg-background">
      <PageMeta
        title="Products & Services | AI Detection, Writing & SEO Tools | AIDetector.cx"
        description="Explore AIDetector.cx products: AI Detector, Essay Studio, AI Humanizer, Plagiarism Checker, SEO Assistant, and API integrations."
        canonicalUrl="https://www.aidetector.cx/services"
        ogTitle="AIDetector.cx Products & Services"
        ogDescription="A connected toolkit for AI detection, academic writing, content originality, SEO, and developer integrations."
        schemas={[productCatalogSchema]}
      />

      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-24 md:px-6 md:pb-20 md:pt-32">
          <Breadcrumbs items={[{ label: 'Products & Services' }]} />
          <div className="mx-auto mt-8 max-w-3xl text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              AIDetector.cx toolkit
            </p>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground text-balance md:text-6xl">
              Tools for writing, originality, and content intelligence
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
              Explore the products available across AIDetector.cx, from AI-content
              analysis and academic writing to plagiarism checks, SEO guidance,
              and developer integrations.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-6 md:py-20">
        <div className="mb-10 max-w-2xl">
          <h2 className="mb-3 text-2xl font-bold text-foreground md:text-3xl">
            Explore our products
          </h2>
          <p className="text-muted-foreground">
            Choose the tool that matches the task you want to complete.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const Icon = product.icon;
            return (
              <Card key={product.title} className="group flex h-full flex-col transition-colors hover:border-primary/50">
                <CardContent className="flex flex-grow flex-col p-7">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-foreground">
                    {product.title}
                  </h3>
                  <p className="mb-7 flex-grow leading-relaxed text-muted-foreground">
                    {product.description}
                  </p>
                  <Link
                    to={product.href}
                    className="inline-flex items-center gap-2 font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {product.action}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-14 text-center md:px-6 md:py-20">
          <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
            One toolkit, multiple content workflows
          </h2>
          <p className="mx-auto max-w-3xl leading-relaxed text-muted-foreground">
            Use the tools individually or combine them as part of your writing,
            review, publishing, and development processes. AI-detection results
            are probabilistic signals and should always be interpreted with
            context and human judgment.
          </p>
          <Link
            to="/pricing"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            View plans
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
