import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, Cpu, Network, Shield, Zap, Lock, 
  CheckCircle2, ArrowRight, Settings, Workflow, ChevronDown 
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

export default function AIConsultingPage() {
  const processSteps = [
    { title: "AI Readiness Audit", desc: "We evaluate your current data infrastructure, workflows, and pinpoint high-ROI AI opportunities." },
    { title: "Strategy & Architecture", desc: "We design a custom AI implementation roadmap and select the right LLMs and tools for your needs." },
    { title: "Pilot Development", desc: "We build a proof-of-concept (PoC) to validate the solution in a controlled environment." },
    { title: "Integration & Deployment", desc: "We seamlessly integrate the AI models into your existing software stack and business processes." },
    { title: "Training & Adoption", desc: "We train your team to effectively collaborate with the new AI tools to maximize productivity." },
    { title: "Monitoring & Scaling", desc: "We monitor model performance, ensure security compliance, and scale the solution across departments." }
  ];

  const serviceSchema = {
    "@context": "https://schema.org/",
    "@type": "Service",
    "serviceType": "AI Consulting",
    "provider": {
      "@type": "Organization",
      "name": "AIDetector.cx",
      "url": "https://aidetector.cx"
    },
    "description": "Enterprise AI Consulting to integrate Generative AI, machine learning, and automation into your workflows.",
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
        "name": "Is our company data secure?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely. We implement enterprise-grade solutions where your data is never used to train public models. We use zero-retention APIs and can deploy open-source models directly on your private cloud infrastructure."
        }
      },
      {
        "@type": "Question",
        "name": "How long does an AI implementation take?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "An initial discovery phase takes 2-3 weeks. A proof-of-concept (PoC) can usually be developed in 4-6 weeks. Full enterprise integration depends on complexity but typically spans 2-4 months."
        }
      },
      {
        "@type": "Question",
        "name": "Do we need to hire data scientists?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Not necessarily. We act as your external AI engineering team to build and deploy the solutions. We also design systems that are user-friendly so your existing software engineers can maintain them."
        }
      },
      {
        "@type": "Question",
        "name": "What is RAG?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "RAG stands for Retrieval-Augmented Generation. It's a technique that connects an LLM to your private databases. The system searches your specific documents first, then uses the AI to summarize the exact answer, preventing hallucinations."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Enterprise AI Consulting & Implementation | AIDetector.cx"
        description="Transform your operations with custom AI solutions. We build secure, private LLM and automation systems tailored for enterprise needs."
        canonicalUrl="https://aidetector.cx/services/ai-consulting"
        ogTitle="Enterprise AI Consulting & Implementation | AIDetector.cx"
        ogDescription="Don't get left behind. We help forward-thinking companies integrate Generative AI, machine learning, and automation to cut costs and accelerate growth."
        schemas={[serviceSchema, faqSchema]}
      />

      {/* 1. Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6">
          <Breadcrumbs items={[{ label: 'Services', href: '/services' }, { label: 'AI Consulting' }]} />
          <div className="text-center mt-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-6">
            <Bot className="w-4 h-4" />
            <span className="text-sm font-medium">Enterprise AI Consulting</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-foreground text-balance">
            Transform Your Operations with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Custom AI Solutions</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 text-pretty">
            Don't get left behind. We help forward-thinking companies integrate Generative AI, machine learning, and automation to cut costs and accelerate growth.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="h-14 px-8 text-base shadow-lg shadow-primary/25" onClick={() => document.getElementById('inquiry')?.scrollIntoView({ behavior: 'smooth' })}>
              Book a Strategy Call <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base" onClick={() => document.getElementById('process')?.scrollIntoView({ behavior: 'smooth' })}>
              See Implementation Process
            </Button>
          </div>
          </div>
        </div>
      </section>

      {/* 2. Problem Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance text-foreground">The Cost of Ignoring AI</h2>
            <p className="text-lg text-muted-foreground text-pretty">Companies that fail to adopt AI are facing shrinking margins and losing competitive advantage to faster, more efficient rivals.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                  <Workflow className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Manual Inefficiencies</h3>
                <p className="text-muted-foreground text-pretty">Your team spends thousands of hours on repetitive data entry, content generation, and customer support triage.</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Data Security Risks</h3>
                <p className="text-muted-foreground text-pretty">Employees are using public AI tools (like ChatGPT) and accidentally leaking your proprietary company data.</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center mb-4">
                  <Network className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Implementation Paralysis</h3>
                <p className="text-muted-foreground text-pretty">You know AI is important, but the landscape changes daily, making it impossible to know where to start.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. Services Included */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance text-foreground">Our AI Consulting Capabilities</h2>
            <p className="text-lg text-muted-foreground max-w-2xl text-pretty">We provide end-to-end support from ideation to deployment.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6 flex gap-4">
                <Bot className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Custom LLM Development</h3>
                  <p className="text-muted-foreground">We build fine-tuned language models and RAG (Retrieval-Augmented Generation) systems trained on your private company data.</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex gap-4">
                <Settings className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Workflow Automation</h3>
                  <p className="text-muted-foreground">Intelligent automations that connect your CRM, ERP, and communication tools to eliminate manual data handling.</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex gap-4">
                <Cpu className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">AI Product Integration</h3>
                  <p className="text-muted-foreground">Embed AI capabilities directly into your existing SaaS products to offer new features to your users.</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex gap-4">
                <Lock className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Enterprise Security & Governance</h3>
                  <p className="text-muted-foreground">Setup secure, private AI environments that comply with SOC2, GDPR, and HIPAA data regulations.</p>
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
              <Card className="bg-card border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-muted/50">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">Operational Efficiency</h4>
                    <span className="text-sm text-emerald-500 font-medium">+340% Output</span>
                  </div>
                </div>
                <div className="p-8 flex items-center justify-center bg-background">
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted" />
                      <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" strokeDasharray="251.2" strokeDashoffset="62.8" className="text-primary" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-3xl font-bold">75%</span>
                      <span className="text-xs text-muted-foreground">Time Saved</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            <div className="w-full md:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance text-foreground">Why AI With Us?</h2>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Vendor Agnostic</h4>
                    <p className="text-muted-foreground">We aren't tied to OpenAI or Google. We recommend the best models (Claude, Llama, GPT) based on your specific use case.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Focus on ROI</h4>
                    <p className="text-muted-foreground">We don't build AI for the sake of hype. Every project must prove a clear path to cost reduction or revenue generation.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold">Rapid Prototyping</h4>
                    <p className="text-muted-foreground">We deploy functional prototypes in weeks, not months, allowing you to validate ideas quickly.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Process */}
      <section id="process" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance text-foreground">Our AI Implementation Process</h2>
            <p className="text-lg text-muted-foreground text-pretty">A secure, phased approach to enterprise AI adoption.</p>
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance">What You Get</h2>
              <p className="text-primary-foreground/80 text-lg mb-8 text-pretty">Clear deliverables that transform your technical infrastructure.</p>
            </div>
            <div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-primary-foreground/10 p-6 rounded-xl border border-primary-foreground/20">
                <h4 className="font-semibold text-lg mb-2">Technical Architecture Document</h4>
                <p className="text-primary-foreground/70 text-sm">Detailed blueprints of data flows and model integrations.</p>
              </div>
              <div className="bg-primary-foreground/10 p-6 rounded-xl border border-primary-foreground/20">
                <h4 className="font-semibold text-lg mb-2">Production-Ready Code</h4>
                <p className="text-primary-foreground/70 text-sm">Fully tested repositories deployed to your cloud infrastructure.</p>
              </div>
              <div className="bg-primary-foreground/10 p-6 rounded-xl border border-primary-foreground/20">
                <h4 className="font-semibold text-lg mb-2">Custom RAG Pipelines</h4>
                <p className="text-primary-foreground/70 text-sm">Vector databases connected to your proprietary knowledge base.</p>
              </div>
              <div className="bg-primary-foreground/10 p-6 rounded-xl border border-primary-foreground/20">
                <h4 className="font-semibold text-lg mb-2">Staff Training Materials</h4>
                <p className="text-primary-foreground/70 text-sm">SOPs and prompt engineering guides for your employees.</p>
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
              <AccordionTrigger>Is our company data secure?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                Absolutely. We implement enterprise-grade solutions where your data is never used to train public models. We use zero-retention APIs and can deploy open-source models (like Llama 3) directly on your private cloud infrastructure for maximum security.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>How long does an AI implementation take?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                An initial discovery and strategy phase takes 2-3 weeks. A proof-of-concept (PoC) can usually be developed in 4-6 weeks. Full enterprise integration depends on the complexity of your legacy systems but typically spans 2-4 months.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Do we need to hire data scientists?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                Not necessarily. We act as your external AI engineering team to build and deploy the solutions. We also design systems that are user-friendly so your existing software engineers or operations managers can maintain them without needing PhDs in machine learning.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>What is RAG?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                RAG stands for Retrieval-Augmented Generation. It's a technique that connects an LLM (like GPT-4) to your private databases. When a user asks a question, the system searches your specific documents first, then uses the AI to summarize the exact answer, preventing hallucinations and ensuring accuracy.
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
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground text-balance">Ready to build the future?</h2>
              <p className="text-xl text-muted-foreground mb-8 text-pretty">
                Schedule a confidential consultation. We'll discuss your operational bottlenecks and explore how custom AI can solve them. Interested in marketing? Check out our <Link to="/services/growth-marketing" className="text-primary hover:underline">Growth Marketing</Link> and <Link to="/services/seo-consulting" className="text-primary hover:underline">SEO</Link> solutions.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>Identify high-ROI use cases</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>Assess data readiness</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>Get a custom implementation roadmap</span></li>
              </ul>
            </div>
            <div>
              <ServiceInquiryForm serviceName="AI Consulting" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
