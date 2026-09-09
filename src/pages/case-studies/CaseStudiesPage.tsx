import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ShieldCheck, Terminal, Cpu, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CaseStudiesPage() {
  const cases = [
    { 
      id: 1, 
      client: 'Global Publishing Media', 
      title: 'Scaling automated AI content screening across 15,000 daily editorial submissions via REST API',
      category: 'API & Pipeline',
      icon: Terminal,
      metrics: ['15k Daily Articles', '<180ms Latency', '99.4% Uptime']
    },
    { 
      id: 2, 
      client: 'Higher Education Academic Consortium', 
      title: 'Reducing false-positive misconduct disputes by 74% with multi-model forensic analysis',
      category: 'Academic Integrity',
      icon: ShieldCheck,
      metrics: ['-74% False Positive Disputes', '120k Scanned Essays', 'Verifiable Certificates']
    },
    { 
      id: 3, 
      client: 'Enterprise Content Studio', 
      title: 'Integrating dual-mode AI detection and SEO content auditing into enterprise CMS workflows',
      category: 'Editorial & SEO',
      icon: Search,
      metrics: ['3.2x Workflow Velocity', '+40% Organic Reach', 'Zero Detection Penalties']
    }
  ];

  return (
    <div className="container mx-auto py-16 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-navy">
          Platform Case Studies & Research
        </h1>
        <p className="text-xl text-muted-foreground">
          Real-world benchmarks and integration results from enterprises, publishers, and academic institutions using AIDetector.cx.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8">
        {cases.map((study) => {
          const IconComp = study.icon;
          return (
            <Card key={study.id} className="flex flex-col overflow-hidden group hover:shadow-lg transition-all border-border">
              <div className="h-44 bg-muted/40 flex items-center justify-center p-6 border-b border-border group-hover:bg-primary/5 transition-colors">
                <IconComp className="w-14 h-14 text-primary/60 group-hover:text-primary transition-colors" />
              </div>
              <CardHeader>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">{study.client}</span>
                  <Badge variant="secondary" className="font-normal text-xs">{study.category}</Badge>
                </div>
                <CardTitle className="text-lg leading-snug">{study.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-2.5 mb-6 flex-1">
                  {study.metrics.map(metric => (
                    <div key={metric} className="flex items-center text-sm font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-success mr-2 shrink-0" />
                      {metric}
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
                  <Link to="/api">
                    View API Architecture <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-primary/5 rounded-3xl p-10 text-center mt-16 max-w-4xl mx-auto border border-primary/10">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">Scale Content Verification for Your Organization</h2>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto">Integrate AIDetector.cx’s multi-mode detection engine and cryptographic verified authorship directly into your stack.</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link to="/api">Explore API Platform</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/contact">Contact Enterprise Sales</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}