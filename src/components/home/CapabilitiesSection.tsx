import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const CAPABILITIES = [
  {
    label: 'AI probability score',
    description: 'Percentage estimate of how likely a text is machine-generated.',
  },
  {
    label: 'Human probability score',
    description: 'Percentage estimate of how much of the writing reads as human-authored.',
  },
  {
    label: 'Mixed-content analysis',
    description: 'Identifies documents that appear to combine human and AI contributions.',
  },
  {
    label: 'Dual detection modes',
    description: 'Independent Balanced (recommended) and High-Sensitivity engines run on every analysis.',
  },
  {
    label: 'Multilingual detection',
    description: 'Language-aware analysis across 19+ languages with explicit calibration status per language.',
  },
  {
    label: 'Sentence-level analysis',
    description: 'Colour-coded breakdown of which individual sentences carry the strongest AI-like signals.',
  },
  {
    label: 'Explainable signals',
    description: 'Results are accompanied by signal indicators, not just a single black-box number.',
  },
  {
    label: 'Detailed reports',
    description: 'Full analysis page with exportable results, confidence indicators, and detected language.',
  },
  {
    label: 'Essay workflow integration',
    description: 'Verify drafts inside Essay Studio at the Write and Improve steps without leaving the workflow.',
  },
];

export default function CapabilitiesSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4 text-balance">
            What the AI Detector Measures
          </h2>
          <p className="text-base md:text-lg text-muted-foreground text-pretty">
            Every listed capability reflects what the detector actually produces — no marketing claims, no vaporware.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {CAPABILITIES.map((c) => (
            <div
              key={c.label}
              className="flex items-start gap-3 p-4 rounded-xl border border-border/40 bg-card/60"
            >
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground text-sm">{c.label}</span>
                <span className="text-sm text-muted-foreground"> — {c.description}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild>
            <Link to="/detector">
              Try the AI Detector Free <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/essay-studio">Explore Essay Studio</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
