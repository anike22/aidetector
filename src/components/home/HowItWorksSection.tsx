import { FileText, Search, SplitSquareHorizontal, LayoutList, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const STEPS = [
  {
    icon: FileText,
    title: '1. Add Your Text',
    description: 'Paste or upload supported content. The AI checker works with essays, articles, reports, emails, and more.',
  },
  {
    icon: Search,
    title: '2. Analyze Writing Patterns',
    description: 'Multiple linguistic, structural, and statistical signals are examined across the full document in the detected language.',
  },
  {
    icon: SplitSquareHorizontal,
    title: '3. Run Independent Detection Modes',
    description: 'The Balanced and High-Sensitivity engines examine the text independently, each using its own calibration and thresholds.',
  },
  {
    icon: LayoutList,
    title: '4. Review Explainable Results',
    description: 'Review AI, human and mixed probabilities, detected language, sentence-level signals and a full detailed analysis on the detector page.',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4 text-balance">
            How Our AI Detector Works
          </h2>
          <p className="text-base md:text-lg text-muted-foreground text-pretty">
            From text to transparent, explainable analysis in four steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {STEPS.map((step, idx) => (
            <div key={step.title} className="relative">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 text-primary">
                  <step.icon className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </div>
              {idx < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[65%] w-[70%] h-px bg-gradient-to-r from-primary/20 to-transparent" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button asChild>
            <Link to="/detector">
              Run an Analysis <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
