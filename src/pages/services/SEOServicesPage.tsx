import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart2, LineChart, Search, Target, TrendingUp, Zap, 
  CheckCircle2, ArrowRight, Activity, Globe, FileText, ChevronDown 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ServiceInquiryForm from '@/components/forms/ServiceInquiryForm';
import PageMeta from '@/components/common/PageMeta';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function SEOServicesPage() {
  const processSteps = [
    { title: "Technical Audit & Baseline", desc: "We identify crawlability issues, site speed bottlenecks, and indexation problems." },
    { title: "Keyword & Competitor Strategy", desc: "We map out high-intent search terms your target audience is actively looking for." },
    { title: "On-Page Optimization", desc: "We optimize your site structure, meta tags, schema, and internal linking." },
    { title: "Content Gap Resolution", desc: "We produce high-quality, intent-driven content to outrank competitors." },
    { title: "Authority Building", desc: "We acquire high-authority backlinks to boost your domain rating." },
    { title: "Reporting & Refinement", desc: "We track ranking improvements, traffic increases, and ROI continuously." }
  ];

  const serviceSchema = {
    "@context": "https://schema.org/",
    "@type": "Service",
    "serviceType": "SEO Consulting",
    "provider": {
      "@type": "Organization",
      "name": "AIDetector.cx",
      "url": "https://aidetector.cx"
    },
    "description": "Enterprise SEO Consulting to drive organic revenue, technical SEO, and content strategy.",
    "areaServed": {
      "@type": "Country",
      "name": "Global"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How long does it take to see SEO results?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Typically, noticeable improvements in rankings begin within 3 to 6 months. However, significant traffic and revenue growth usually compound between months 6 and 12, depending on your industry's competitiveness and your website's baseline authority."
        }
      },
      {
        "@type": "Question",
        "name": "Do you guarantee number 1 rankings?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No reputable SEO agency guarantees #1 rankings because Google's algorithm is proprietary and constantly changing. However, we guarantee that our methodology is aligned with Google's best practices, and we commit to specific deliverables and KPIs."
        }
      },
      {
        "@type": "Question",
        "name": "How do you measure SEO ROI?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We track beyond traffic. We set up conversion tracking to measure organic leads, pipeline value, and closed revenue. By assigning value to goal completions, we can calculate the direct return on your SEO investment."
        }
      },
      {
        "@type": "Question",
        "name": "Is content creation included?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, comprehensive content strategy and production can be included. We have a team of subject matter experts and utilize AI tools to produce authoritative, perfectly optimized content that ranks and converts."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Enterprise SEO Consulting & Services | AIDetector.cx"
        description="Dominate search results and drive organic revenue with our enterprise-grade technical SEO, content strategy, and link building services."
        canonicalUrl="https://aidetector.cx/services/seo-consulting"
        ogTitle="Enterprise SEO Consulting & Services | AIDetector.cx"
        ogDescription="Stop losing customers to your competitors. Our data-driven SEO strategies turn your website into a predictable, scalable lead generation engine."
        schemas={[serviceSchema, faqSchema]}
      />

      {/* 1. Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6">
          <Breadcrumbs items={[{ label: 'Services', href: '/services' }, { label: 'SEO Consulting' }]} />
          <div className="text-center mt-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-6">
            <Search className="w-4 h-4" />
            <span className="text-sm font-medium">Enterprise SEO Consulting</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-foreground text-balance">
            Dominate Search Results and <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Drive Organic Revenue</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 text-pretty">
            Stop losing customers to your competitors. Our data-driven SEO strategies turn your website into a predictable, scalable lead generation engine.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="h-14 px-8 text-base shadow-lg shadow-primary/25" onClick={() => document.getElementById('inquiry')?.scrollIntoView({ behavior: 'smooth' })}>
              Request SEO Audit <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base" onClick={() => document.getElementById('process')?.scrollIntoView({ behavior: 'smooth' })}>
              View Our Process
            </Button>
          </div>
          </div>
        </div>
      </section>

      {/* 2. Problem Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance text-foreground">Why Your Current SEO Isn't Working</h2>
            <p className="text-lg text-muted-foreground text-pretty">Most businesses struggle with organic search because they rely on outdated tactics. Search engines demand technical excellence, topic authority, and perfect user experience.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Traffic Plateaus</h3>
                <p className="text-muted-foreground text-pretty">You're publishing content but your organic traffic hasn't grown in months. Your site is stuck on page 2.</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Wrong Intent</h3>
                <p className="text-muted-foreground text-pretty">You're ranking for vanity keywords that bring visitors, but those visitors never convert into paying customers.</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Technical Debt</h3>
                <p className="text-muted-foreground text-pretty">Slow load times, messy architecture, and poor mobile experience are quietly killing your search visibility.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. Services Included */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance text-foreground">Comprehensive SEO Solutions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl text-pretty">We cover every pillar of modern search engine optimization.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6 flex gap-4">
                <Globe className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Technical SEO</h3>
                  <p className="text-muted-foreground">Core Web Vitals optimization, schema markup implementation, XML sitemap configuration, and JavaScript SEO.</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex gap-4">
                <FileText className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Content Strategy</h3>
                  <p className="text-muted-foreground">Topic cluster creation, content gap analysis, and production of high-converting, AI-assisted content assets.</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex gap-4">
                <LinkChartIcon className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Authority Building</h3>
                  <p className="text-muted-foreground">Digital PR, strategic backlink acquisition, unlinked brand mentions, and broken link building.</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex gap-4">
                <BarChart2 className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Local & E-Commerce SEO</h3>
                  <p className="text-muted-foreground">Google Business Profile optimization, local citation management, and product page indexation.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. Benefits */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="w-full md:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance text-foreground">Why Partner With Us?</h2>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Predictable Revenue</h4>
                    <p className="text-muted-foreground">We focus on bottom-funnel keywords that drive actual sales, not just vanity traffic.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Data-Backed Decisions</h4>
                    <p className="text-muted-foreground">No guesswork. Every change is backed by competitor data and search algorithm analysis.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Complete Transparency</h4>
                    <p className="text-muted-foreground">Custom live dashboards and detailed monthly reporting on the metrics that matter to your business.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="w-full md:w-1/2">
              <Card className="bg-card border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/50">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">Organic Traffic Growth</h4>
                    <span className="text-sm text-emerald-500 font-medium">+214% YoY</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-64 flex items-end gap-2">
                    {[30, 45, 40, 60, 75, 90, 120, 150, 180, 210, 260, 310].map((h, i) => (
                      <div key={i} className="flex-1 bg-primary/20 rounded-t-sm hover:bg-primary transition-colors relative group" style={{ height: `${(h / 310) * 100}%` }}>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Process */}
      <section id="process" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance text-foreground">Our Proven SEO Process</h2>
            <p className="text-lg text-muted-foreground text-pretty">A systematic, repeatable methodology for achieving top rankings.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {processSteps.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="text-6xl font-bold text-muted/30 absolute -top-4 -left-2 -z-10">{idx + 1}</div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground text-pretty">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Deliverables */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="w-full lg:w-1/3">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">What You Get Every Month</h2>
              <p className="text-primary-foreground/80 text-lg mb-8 text-pretty">We believe in tangible outputs. Here is exactly what we deliver during our engagement.</p>
            </div>
            <div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-primary-foreground/10 p-6 rounded-xl border border-primary-foreground/20">
                <h4 className="font-semibold text-lg mb-2">Technical Health Checks</h4>
                <p className="text-primary-foreground/70 text-sm">Weekly monitoring of 404s, redirects, and crawl errors.</p>
              </div>
              <div className="bg-primary-foreground/10 p-6 rounded-xl border border-primary-foreground/20">
                <h4 className="font-semibold text-lg mb-2">Content Briefs & Assets</h4>
                <p className="text-primary-foreground/70 text-sm">Fully optimized content ready for publication.</p>
              </div>
              <div className="bg-primary-foreground/10 p-6 rounded-xl border border-primary-foreground/20">
                <h4 className="font-semibold text-lg mb-2">Link Acquisition</h4>
                <p className="text-primary-foreground/70 text-sm">Guaranteed placements on high-DR, relevant domains.</p>
              </div>
              <div className="bg-primary-foreground/10 p-6 rounded-xl border border-primary-foreground/20">
                <h4 className="font-semibold text-lg mb-2">Executive Reporting</h4>
                <p className="text-primary-foreground/70 text-sm">Video walkthroughs and custom Looker Studio dashboards.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="py-20 bg-background">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center text-foreground">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How long does it take to see SEO results?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                Typically, noticeable improvements in rankings begin within 3 to 6 months. However, significant traffic and revenue growth usually compound between months 6 and 12, depending on your industry's competitiveness and your website's baseline authority.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Do you guarantee number 1 rankings?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                No reputable SEO agency guarantees #1 rankings because Google's algorithm is proprietary and constantly changing. However, we guarantee that our methodology is aligned with Google's best practices, and we commit to specific deliverables and KPIs.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>How do you measure SEO ROI?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                We track beyond traffic. We set up conversion tracking to measure organic leads, pipeline value, and closed revenue. By assigning value to goal completions, we can calculate the direct return on your SEO investment.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Is content creation included?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                Yes, comprehensive content strategy and production can be included. We have a team of subject matter experts and utilize AI tools to produce authoritative, perfectly optimized content that ranks and converts.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* 8. CTA & 9. Inquiry Form */}
      <section id="inquiry" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground text-balance">Ready to dominate search?</h2>
              <p className="text-xl text-muted-foreground mb-8 text-pretty">
                Schedule a free discovery call. We'll analyze your site, identify your top competitors, and map out a custom strategy for growth. You can also explore our <Link to="/services/ai-consulting" className="text-primary hover:underline">AI Consulting</Link> and <Link to="/services/growth-marketing" className="text-primary hover:underline">Growth Marketing</Link> services to accelerate your digital presence.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>Free technical mini-audit</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>Competitor gap analysis</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>Custom roadmap proposal</span></li>
              </ul>
            </div>
            <div>
              <ServiceInquiryForm serviceName="SEO Consulting" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function LinkChartIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
