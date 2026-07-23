import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CaseStudiesPage() {
  const cases = [
    { 
      id: 1, 
      client: 'TechFlow SaaS', 
      title: 'How we increased organic traffic by 450% in 6 months',
      category: 'SEO',
      metrics: ['+450% Traffic', '+120% Leads', '#1 Ranking for 15 keywords']
    },
    { 
      id: 2, 
      client: 'Global Logistics', 
      title: 'Automating document processing with custom AI models',
      category: 'AI Integration',
      metrics: ['80% Time Saved', '99.9% Accuracy', '$250k Annual Savings']
    },
    { 
      id: 3, 
      client: 'E-commerce Plus', 
      title: 'Scaling revenue to $5M/ARR using data-driven growth marketing',
      category: 'Growth',
      metrics: ['3.5x ROAS', '+85% Conversion Rate', '$5M ARR']
    }
  ];

  return (
    <div className="container mx-auto py-16 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-navy">
          Client Success Stories
        </h1>
        <p className="text-xl text-muted-foreground">
          See how we've helped companies scale their revenue, automate processes, and dominate search.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8">
        {cases.map((study) => (
          <Card key={study.id} className="flex flex-col overflow-hidden group hover:shadow-lg transition-all border-border">
            <div className="h-48 bg-muted/50 flex items-center justify-center p-6 border-b border-border group-hover:bg-primary/5 transition-colors">
              <TrendingUp className="w-16 h-16 text-primary/40 group-hover:text-primary/60 transition-colors" />
            </div>
            <CardHeader>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-primary uppercase tracking-wider">{study.client}</span>
                <Badge variant="secondary" className="font-normal">{study.category}</Badge>
              </div>
              <CardTitle className="text-xl leading-tight">{study.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="space-y-3 mb-8 flex-1">
                {study.metrics.map(metric => (
                  <div key={metric} className="flex items-center text-sm font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-success mr-2 shrink-0" />
                    {metric}
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" onClick={() => {}}>
                Read Full Case Study <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-primary/5 rounded-3xl p-12 text-center mt-16 max-w-4xl mx-auto border border-primary/10">
        <h2 className="text-3xl font-bold mb-4">Ready to be our next success story?</h2>
        <p className="text-muted-foreground mb-8">Schedule a free strategy session with our growth experts.</p>
        <Button size="lg" asChild>
          <Link to="/hire-expert">Book Strategy Session</Link>
        </Button>
      </div>
    </div>
  );
}