import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart2, FileSearch, Bot, Rocket, PenSquare, Zap, 
  ArrowRight, CheckCircle2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ServiceInquiryForm from '@/components/forms/ServiceInquiryForm';
import PageMeta from '@/components/common/PageMeta';
import Breadcrumbs from '@/components/common/Breadcrumbs';

export default function ServicesOverviewPage() {
  const services = [
    {
      id: 'seo-consulting',
      title: 'SEO Consulting',
      icon: FileSearch,
      desc: 'Dominate search results with enterprise-grade technical SEO and content strategy.',
      features: ['Technical Audits', 'Keyword Strategy', 'Link Building'],
      href: '/services/seo-consulting',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      id: 'ai-consulting',
      title: 'AI Consulting',
      icon: Bot,
      desc: 'Transform your operations by integrating custom LLMs and automated workflows.',
      features: ['Custom Models', 'Process Automation', 'AI Strategy'],
      href: '/services/ai-consulting',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      id: 'growth-marketing',
      title: 'Growth Marketing',
      icon: Rocket,
      desc: 'Scale customer acquisition with data-driven paid media and conversion optimization.',
      features: ['Paid Acquisition', 'CRO', 'Lifecycle Marketing'],
      href: '/services/growth-marketing',
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    },
    {
      id: 'technical-seo',
      title: 'Technical SEO',
      icon: Zap,
      desc: 'Ensure search engines can crawl, render, and index your website flawlessly.',
      features: ['Core Web Vitals', 'Site Architecture', 'JavaScript SEO'],
      href: '/technical-seo',
      color: 'text-rose-500',
      bg: 'bg-rose-500/10'
    },
    {
      id: 'conversion-optimization',
      title: 'Conversion Optimization',
      icon: BarChart2,
      desc: 'Turn more of your existing traffic into qualified leads and paying customers.',
      features: ['A/B Testing', 'Funnel Analysis', 'UX Research'],
      href: '/services/conversion-optimization',
      color: 'text-teal-500',
      bg: 'bg-teal-500/10'
    }
  ];

  const serviceCatalogSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": services.map((s, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "url": `https://aidetector.cx${s.href}`,
      "name": s.title
    }))
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Digital Growth Services & Consulting | AIDetector.cx"
        description="Partner with us for enterprise SEO, AI consulting, and growth marketing. We drive predictable revenue and operational efficiency."
        canonicalUrl="https://aidetector.cx/services"
        ogTitle="Digital Growth Services & Consulting | AIDetector.cx"
        ogDescription="Partner with ambitious companies to drive predictable revenue growth through search, AI implementation, and performance marketing."
        schemas={[serviceCatalogSchema]}
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6">
          <Breadcrumbs items={[{ label: 'Services' }]} />
          <div className="text-center mt-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-foreground text-balance">
              Expert Consulting to <span className="text-primary">Scale Your Business</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 text-pretty">
              We partner with ambitious companies to drive predictable revenue growth through search, AI implementation, and performance marketing.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Card key={service.id} className="group hover:border-primary/50 transition-colors flex flex-col h-full">
                  <CardContent className="p-8 flex flex-col flex-grow">
                    <div className={`w-14 h-14 rounded-xl ${service.bg} ${service.color} flex items-center justify-center mb-6`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                    <p className="text-muted-foreground mb-6 flex-grow">{service.desc}</p>
                    <ul className="space-y-2 mb-8">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button asChild variant="outline" className="w-full mt-auto group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Link to={service.href}>
                        Learn More <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Shared CTA / Inquiry */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground text-balance">Not sure where to start?</h2>
              <p className="text-xl text-muted-foreground mb-8 text-pretty">
                Let's discuss your business goals. We'll help you identify the highest-leverage opportunities for growth, whether that's through SEO, AI, or paid acquisition.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>30-minute strategic consultation</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>No-obligation business audit</span></li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> <span>Custom recommendations</span></li>
              </ul>
            </div>
            <div>
              <ServiceInquiryForm serviceName="General Inquiry" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
