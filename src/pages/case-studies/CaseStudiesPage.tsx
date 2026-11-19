import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { ArrowRight, BookOpen, FlaskConical } from 'lucide-react';

export default function CaseStudiesPage() {
  return (
    <MainLayout>
      <PageMeta
        title="Research & Case Studies | AIDetector.cx"
        description="Explore AIDetector.cx research protocols, evaluation methods and evidence-backed product studies. Results are published with transparent methods and limitations."
        canonicalUrl="https://www.aidetector.cx/case-studies"
      />
      <div className="max-w-5xl mx-auto px-4 py-14 md:py-20 space-y-10">
        <header className="text-center max-w-3xl mx-auto space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Research & evidence</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-navy">Platform Research & Case Studies</h1>
          <p className="text-lg md:text-xl text-muted-foreground">We publish evaluation methods and findings with clear sources, sample descriptions and limitations. We do not present unverified customer metrics as proven outcomes.</p>
        </header>
        <section className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="p-7 md:p-9">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="rounded-full bg-amber-100 text-amber-900 px-3 py-1 text-xs font-semibold">Protocol published · testing pending</span>
              <span className="text-sm text-muted-foreground">Education · AI detection</span>
            </div>
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-primary/10 p-3"><FlaskConical className="w-7 h-7 text-primary" /></div>
              <div>
                <h2 className="text-2xl font-bold text-navy mb-3">Evaluating AI Detection in Student Writing</h2>
                <p className="text-muted-foreground leading-relaxed mb-5">A planned evaluation of human-written, AI-generated and AI-assisted student writing. The protocol defines sample provenance, Balanced and Aggressive mode testing, false-positive analysis, evaluation metrics and safeguards for academic use.</p>
                <Link to="/research/education-ai-detection-study" className="inline-flex items-center rounded-lg bg-primary px-5 py-3 text-primary-foreground font-medium hover:opacity-90 transition-opacity">Read the research protocol <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </div>
            </div>
          </div>
          <div className="border-t border-border bg-muted/30 px-7 py-5 flex items-center gap-3 text-sm text-muted-foreground">
            <BookOpen className="w-5 h-5 shrink-0" /> Performance results will be published only after the dataset is selected, evaluated and documented.
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-7 md:p-9">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary mb-3">External product profile</p>
          <h2 className="text-2xl font-bold text-navy mb-3">AIDetector.cx on Product Hunt</h2>
          <p className="text-muted-foreground leading-relaxed mb-5">Explore the AIDetector.cx launch profile on Product Hunt, including the product overview and community discussion about its AI detection, plagiarism and content-integrity tools.</p>
          <a
            href="https://www.producthunt.com/products/aidetector-cx?comment=5997281"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-lg border border-border px-5 py-3 font-medium text-foreground hover:bg-muted transition-colors"
          >
            View AIDetector.cx on Product Hunt <ArrowRight className="w-4 h-4 ml-2" />
          </a>
        </section>
      </div>
    </MainLayout>
  );
}
