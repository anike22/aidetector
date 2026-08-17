import { BookOpen, Microscope, Scale, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const AUTHORITY_AREAS = [
  {
    title: 'Guides',
    href: '/guides',
    icon: BookOpen,
    description: 'Educational content about AI detection, scores, and best practices for educators and writers.',
    links: [
      { label: 'Understanding AI Detection Scores', to: '/guides/understanding-ai-detection-scores' },
      { label: 'Best Practices for Educators', to: '/guides/best-practices-for-educators' },
      { label: 'Multilingual Detection Guide', to: '/guides/multilingual-detection-guide' },
    ],
  },
  {
    title: 'Research',
    href: '/research',
    icon: Microscope,
    description: 'Original benchmarks, detection methodology, and language-specific performance studies.',
    links: [
      { label: 'How Our Dual-Engine Works', to: '/research/dual-engine-detection-methodology' },
      { label: 'Language Benchmark Overview', to: '/research/language-benchmark-overview' },
      { label: 'False-Positive Analysis', to: '/research/false-positive-analysis' },
    ],
  },
  {
    title: 'Comparisons',
    href: '/comparisons',
    icon: Scale,
    description: 'Feature breakdowns and use-case comparisons with other AI detection products.',
    links: [
      { label: 'Balanced vs Aggressive Mode', to: '/comparisons/balanced-vs-aggressive-detection' },
      { label: 'AIDetector.cx vs Turnitin', to: '/comparisons/aidetector-vs-turnitin' },
      { label: 'Detector Comparison Table', to: '/comparisons/ai-detector-comparison' },
    ],
  },
];

export default function SEOAuthoritySection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4 text-balance">
            Learn More About AI Detection
          </h2>
          <p className="text-base md:text-lg text-muted-foreground text-pretty">
            Guides, research, and comparisons to help you use AI detection responsibly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {AUTHORITY_AREAS.map((a) => (
            <Card key={a.title} className="p-6 border-border/50 bg-card/50 h-full flex flex-col">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <a.icon className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{a.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
                {a.description}
              </p>
              <ul className="space-y-2 mb-5">
                {a.links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {l.label} <ArrowRight className="w-3 h-3" />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to={a.href}
                className="text-sm font-semibold text-foreground hover:text-primary inline-flex items-center gap-1"
              >
                View all {a.title.toLowerCase()} <ArrowRight className="w-4 h-4" />
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
