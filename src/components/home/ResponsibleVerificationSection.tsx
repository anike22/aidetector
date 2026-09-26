import { ShieldCheck, AlertTriangle, Eye, BarChart3, Globe, FileLock2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Dual Detection',
    description: 'Two independent engines help you understand the range of possible classifications for the same text.',
  },
  {
    icon: Globe,
    title: 'Multilingual Analysis',
    description: 'Language-aware detection with explicit status and calibration for supported languages.',
  },
  {
    icon: Eye,
    title: 'Sentence-Level Evidence',
    description: 'Inspect individual sentences and paragraphs flagged as AI, human, or mixed.',
  },
  {
    icon: ShieldCheck,
    title: 'Mixed-Content Detection',
    description: 'Identify text that combines human and AI contributions rather than forcing a binary answer.',
  },
  {
    icon: AlertTriangle,
    title: 'False-Positive Awareness',
    description: 'Clear messaging that highly technical, formal, or polished human writing can trigger detectors.',
  },
  {
    icon: FileLock2,
    title: 'Privacy-Conscious Analysis',
    description: 'Text is analyzed for detection purposes; no unnecessary data is retained or used for training.',
  },
];

export default function ResponsibleVerificationSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4 text-balance">
            Built for Responsible AI Verification
          </h2>
          <p className="text-base md:text-lg text-muted-foreground text-pretty">
            Our goal is to give you transparent, explainable signals — not a definitive judgment.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {FEATURES.map((f) => (
            <Card key={f.title} className="p-6 border-border/50 bg-card/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </Card>
          ))}
        </div>

        <div className="p-6 rounded-2xl border border-border/60 bg-muted/30 text-center">
          <p className="text-sm md:text-base text-muted-foreground text-pretty max-w-3xl mx-auto">
            <strong>AI detection is probabilistic and should not be used as the sole evidence</strong> for academic, employment, or disciplinary decisions. Always combine results with human judgment, context, and other evidence.
          </p>
        </div>
      </div>
    </section>
  );
}
