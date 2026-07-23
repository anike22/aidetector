import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Rocket, TrendingUp, Users, Target, MousePointerClick, 
  CheckCircle2, ArrowRight, LineChart, PieChart, ChevronDown 
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

export default function ConversionOptimizationPage() {
  const processSteps = [
    { title: "Funnel Analysis", desc: "We map your entire customer journey from first touchpoint to retention, identifying drop-off points." },
    { title: "Audience Segmentation", desc: "We build precise buyer personas using first-party data and competitor intelligence." },
    { title: "Channel Strategy", desc: "We determine the optimal mix of paid search, social, and organic channels to acquire users." },
    { title: "Experimentation Sprint", desc: "We launch rapid A/B tests on ad creatives, landing pages, and email sequences." },
    { title: "Optimization", desc: "We double down on winning variations to lower customer acquisition cost (CAC)." },
    { title: "Scale", desc: "Once we achieve profitable unit economics, we aggressively scale ad spend and outreach." }
  ];

  const serviceSchema = {
    "@context": "https://schema.org/",
    "@type": "Service",
    "serviceType": "Growth Marketing",
    "provider": {
      "@type": "Organization",
      "name": "AIDetector.cx",
      "url": "https://aidetector.cx"
    },
    "description": "Scale your revenue with data-driven B2B growth marketing, paid acquisition, and conversion optimization.",
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
        "name": "What ad budget do you require?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "For B2B growth marketing engagements, we typically require a minimum ad spend budget of $5,000 to $10,000 per month to generate enough statistical significance for proper A/B testing and optimization."
        }
      },
      {
        "@type": "Question",
        "name": "How is growth marketing different from traditional marketing?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Traditional marketing often focuses on brand awareness and top-of-funnel metrics. Growth marketing relies heavily on data, rapid experimentation, and optimizing the entire funnel—from awareness through activation, revenue, and retention."
        }
      },
      {
        "@type": "Question",
        "name": "Do you design the ad creatives?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Our team includes designers and copywriters who specialize in performance marketing. We handle the production of all assets required for your campaigns."
        }
      },
      {
        "@type": "Question",
        "name": "How often do we communicate?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We act as an extension of your team. You will have a dedicated Slack/Teams channel for real-time communication, along with a formal bi-weekly or monthly sprint review to discuss performance and strategy."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="B2B Growth Marketing Agency | AIDetector.cx"
        description="Scale customer acquisition with our data-driven paid media, CRO, and lifecycle marketing strategies designed specifically for B2B growth."
        canonicalUrl="https://aidetector.cx/services/growth-marketing"
        ogTitle="B2B Growth Marketing Agency | AIDetector.cx"
        ogDescription="We optimize your entire funnel—from acquisition to retention—to aggressively scale your business with profitable unit economics."
        schemas={[serviceSchema, faqSchema]}
      />

      {/* 1. Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6">
          <Breadcrumbs items={[{ label: 'Services', href: '/services' }, { label: 'Growth Marketing' }]} />
          <div className="text-center mt-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-6">
            <Rocket className="w-4 h-4" />
            <span className="text-sm font-medium">B2B Growth Marketing</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-foreground text-balance">
            Scale Your Revenue with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">Data-Driven Growth</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 text-pretty">
            We don't just run ads. We optimize your entire funnel—from acquisition to retention—to aggressively scale your business with profitable unit economics.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="h-14 px-8 text-base shadow-lg shadow-primary/25" onClick={() => document.getElementById('inquiry')?.scrollIntoView({ behavior: 'smooth' })}>
              Get a Growth Audit <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base" onClick={() => document.getElementById('process')?.scrollIntoView({ behavior: 'smooth' })}>
              See Our Framework
            </Button>
          </div>
          </div>
        </div>
      </section>

      {/* 2. Problem Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance text-foreground">Why Marketing Fails to Scale</h2>
            <p className="text-lg text-muted-foreground text-pretty">Most agencies focus on top-of-funnel vanity metrics instead of full-funnel revenue generation.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Unprofitable CAC</h3>
                <p className="text-muted-foreground text-pretty">Your Customer Acquisition Cost is creeping up, making it impossible to scale ad spend without losing money.</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Leaky Funnels</h3>
                <p className="text-muted-foreground text-pretty">You are driving traffic to your site, but visitors aren't converting into leads, and leads aren't closing.</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                  <PieChart className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Siloed Data</h3>
                <p className="text-muted-foreground text-pretty">Sales and Marketing are looking at different numbers. You can't accurately attribute revenue to specific campaigns.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. Services Included */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance text-foreground">Our Growth Solutions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl text-pretty">A holistic approach to customer acquisition and retention.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6 flex gap-4">
                <MousePointerClick className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Paid Acquisition (PPC)</h3>
                  <p className="text-muted-foreground">Expert management of Google Ads, LinkedIn Ads, and Meta Ads focused entirely on B2B lead generation and CPA reduction.</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex gap-4">
                <LineChart className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Conversion Rate Optimization (CRO)</h3>
                  <p className="text-muted-foreground">Data-driven A/B testing on your landing pages and checkout flows to maximize the value of your existing traffic.</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex gap-4">
                <Users className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Account-Based Marketing (ABM)</h3>
                  <p className="text-muted-foreground">Hyper-targeted campaigns designed to engage specific high-value enterprise accounts and decision-makers.</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex gap-4">
                <Target className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Lifecycle Marketing</h3>
                  <p className="text-muted-foreground">Automated email sequencing, onboarding workflows, and retention campaigns to increase Customer Lifetime Value (LTV).</p>
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance text-foreground">The Growth Marketing Advantage</h2>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Agile Execution</h4>
                    <p className="text-muted-foreground">We operate in rapid sprints, testing new hypotheses weekly to find scalable growth levers.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Revenue Alignment</h4>
                    <p className="text-muted-foreground">We measure success by pipeline generated and closed-won deals, not clicks or impressions.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Multi-Channel Expertise</h4>
                    <p className="text-muted-foreground">We break down silos, ensuring your SEO, paid media, and email marketing all tell a cohesive story.</p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="w-full md:w-1/2">
              <Card className="bg-card border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/50">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">Customer Acquisition Cost</h4>
                    <span className="text-sm text-emerald-500 font-medium">-42% Decrease</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-64 flex items-end gap-4">
                    {[100, 95, 88, 75, 70, 65, 58].map((h, i) => (
                      <div key={i} className="flex-1 bg-primary/80 rounded-t-sm relative group flex flex-col justify-end" style={{ height: `${h}%` }}>
                        <div className="w-full h-full bg-primary/20 absolute inset-0"></div>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance text-foreground">Our Growth Framework</h2>
            <p className="text-lg text-muted-foreground text-pretty">A scientific approach to discovering scalable customer acquisition channels.</p>
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">The Outputs</h2>
              <p className="text-primary-foreground/80 text-lg mb-8 text-pretty">Everything you need to run a high-performance revenue engine.</p>
            </div>
            <div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-primary-foreground/10 p-6 rounded-xl border border-primary-foreground/20">
                <h4 className="font-semibold text-lg mb-2">Campaign Architecture</h4>
                <p className="text-primary-foreground/70 text-sm">Fully built and managed campaigns across Google Ads, LinkedIn, and Meta.</p>
              </div>
              <div className="bg-primary-foreground/10 p-6 rounded-xl border border-primary-foreground/20">
                <h4 className="font-semibold text-lg mb-2">Ad Creatives & Copy</h4>
                <p className="text-primary-foreground/70 text-sm">High-converting graphics, videos, and copywriting designed for B2B audiences.</p>
              </div>
              <div className="bg-primary-foreground/10 p-6 rounded-xl border border-primary-foreground/20">
                <h4 className="font-semibold text-lg mb-2">Optimized Landing Pages</h4>
                <p className="text-primary-foreground/70 text-sm">Custom-built landing pages designed specifically to maximize conversion rates.</p>
              </div>
              <div className="bg-primary-foreground/10 p-6 rounded-xl border border-primary-foreground/20">
                <h4 className="font-semibold text-lg mb-2">Closed-Loop Reporting</h4>
                <p className="text-primary-foreground/70 text-sm">Dashboards integrating CRM data with ad platforms to prove true ROI.</p>
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
              <AccordionTrigger>What ad budget do you require?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                For B2B growth marketing engagements, we typically require a minimum ad spend budget of $5,000 to $10,000 per month to generate enough statistical significance for proper A/B testing and optimization.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>How is growth marketing different from traditional marketing?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                Traditional marketing often focuses on brand awareness and top-of-funnel metrics. Growth marketing relies heavily on data, rapid experimentation, and optimizing the entire funnel—from awareness through activation, revenue, and retention.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Do you design the ad creatives?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                Yes. Our team includes designers and copywriters who specialize in performance marketing. We handle the production of all assets required for your campaigns.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>How often do we communicate?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                We act as an extension of your team. You will have a dedicated Slack/Teams channel for real-time communication, along with a formal bi-weekly or monthly sprint review to discuss performance and strategy.
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
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground text-balance">Ready to scale faster?</h2>
              <p className="text-xl text-muted-foreground mb-8 text-pretty">
                Let's find the bottlenecks in your funnel. Request a free growth audit and we'll show you exactly how to lower your CAC. Pair this with our <Link to="/services/seo-consulting" className="text-primary hover:underline">SEO</Link> or <Link to="/services/ai-consulting" className="text-primary hover:underline">AI Consulting</Link> for maximum impact.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>Ad account structure review</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>Landing page conversion audit</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>Actionable 90-day growth plan</span></li>
              </ul>
            </div>
            <div>
              <ServiceInquiryForm serviceName="Growth Marketing" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
