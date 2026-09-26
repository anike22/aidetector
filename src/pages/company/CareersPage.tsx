import { useState } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, ChevronRight, Zap, Heart, Globe, Coffee } from 'lucide-react';

import JobApplicationModal from '@/components/company/JobApplicationModal';

const departments = ['All', 'Engineering', 'Research', 'Product', 'Marketing', 'Operations'];

const openings = [
  { id: 1, title: 'Senior ML Engineer — Detection Models', dept: 'Engineering', location: 'Remote / San Francisco', type: 'Full-time', level: 'Senior' },
  { id: 2, title: 'Full-Stack Engineer (React + Supabase)', dept: 'Engineering', location: 'Remote', type: 'Full-time', level: 'Mid–Senior' },
  { id: 3, title: 'NLP Research Scientist', dept: 'Research', location: 'Remote / New York', type: 'Full-time', level: 'Senior' },
  { id: 4, title: 'Product Manager — Content Tools', dept: 'Product', location: 'Remote', type: 'Full-time', level: 'Mid' },
  { id: 5, title: 'Senior Product Designer (UX/UI)', dept: 'Product', location: 'Remote', type: 'Full-time', level: 'Senior' },
  { id: 6, title: 'Growth Marketing Manager', dept: 'Marketing', location: 'Remote', type: 'Full-time', level: 'Mid' },
  { id: 7, title: 'Content & SEO Strategist', dept: 'Marketing', location: 'Remote', type: 'Full-time', level: 'Mid' },
  { id: 8, title: 'Developer Advocate', dept: 'Engineering', location: 'Remote', type: 'Full-time', level: 'Mid–Senior' },
  { id: 9, title: 'Data Engineer (ML Pipelines)', dept: 'Engineering', location: 'Remote', type: 'Full-time', level: 'Mid' },
  { id: 10, title: 'Customer Success Manager', dept: 'Operations', location: 'Remote', type: 'Full-time', level: 'Mid' },
];

const perks = [
  { icon: Globe, title: 'Fully Remote', desc: 'Work from anywhere in the world. We have teammates in 18 countries.' },
  { icon: Heart, title: 'Comprehensive Health', desc: 'Full medical, dental, and vision coverage for you and your dependents.' },
  { icon: Zap, title: 'Equity Package', desc: 'Every employee gets meaningful equity — you build it, you own part of it.' },
  { icon: Coffee, title: 'Home Office Budget', desc: '$1,500/year for home office setup, coffee, and anything that helps you do your best work.' },
];

export default function CareersPage() {
  const [activeDept, setActiveDept] = useState('All');
  const [selectedJob, setSelectedJob] = useState<{title: string; id: number} | null>(null);

  const filtered = activeDept === 'All' ? openings : openings.filter((j) => j.dept === activeDept);

  return (
    <MainLayout>
      {/* Hero */}
      <section className="bg-navy text-white py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-5">We're Hiring</Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-6 text-balance">
            Help shape the future of<br className="hidden md:block" /> content authenticity
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto text-pretty leading-relaxed">
            We're a remote-first team of researchers, engineers, and product builders working on one of the most important problems in AI. Come join us.
          </p>
          <div className="flex items-center justify-center gap-2 mt-5 text-sm text-white/50">
            <span className="w-2 h-2 rounded-full bg-success inline-block"></span>
            {openings.length} open positions · Remote-first
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="py-14 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {perks.map((p) => {
              const Icon = p.icon;
              return (
                <Card key={p.title} className="border-border shadow-card h-full">
                  <CardContent className="p-5">
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                      <Icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-navy text-sm mb-1">{p.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{p.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Job listings */}
      <section className="py-16 md:py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-2 text-balance">Open Positions</h2>
            <p className="text-muted-foreground text-pretty">All roles are remote unless noted otherwise.</p>
          </div>

          {/* Department filter */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {departments.map((d) => (
              <Button
                key={d}
                size="sm"
                variant={activeDept === d ? 'default' : 'outline'}
                className={`h-8 text-xs border-border ${activeDept === d ? 'bg-primary text-primary-foreground' : ''}`}
                onClick={() => setActiveDept(d)}
              >
                {d}
              </Button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {filtered.map((job) => (
              <Card key={job.id} className="border-border shadow-card hover:border-primary/40 transition-colors cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-navy group-hover:text-primary transition-colors truncate">{job.title}</h3>
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs shrink-0">{job.dept}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.type}</span>
                        <span>{job.level}</span>
                      </div>
                    </div>
                    <Button size="sm" className="bg-primary text-primary-foreground h-8 text-xs shrink-0 gap-1" onClick={() => setSelectedJob(job)}>
                      Apply <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No openings in this department right now — check back soon.
            </div>
          )}
        </div>
      </section>

      {/* No fit CTA */}
      <section className="py-14 bg-muted/30 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-xl font-bold text-navy mb-3 text-balance">Don't see the right role?</h2>
          <p className="text-muted-foreground mb-5 text-pretty">
            We're always looking for exceptional people. Send us your CV and tell us how you'd contribute.
          </p>
          <a href="/contact" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors">
            Get in Touch
          </a>
        </div>
      </section>

      <JobApplicationModal 
        job={selectedJob} 
        isOpen={!!selectedJob} 
        onClose={() => setSelectedJob(null)} 
      />
    </MainLayout>
  );
}
