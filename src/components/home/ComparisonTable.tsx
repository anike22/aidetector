import { Check, X, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ComparisonTable() {
  const features = [
    { name: 'AI Detection Accuracy', us: '99.8%', comp1: '85%', comp2: '78%' },
    { name: 'False Positive Rate', us: '< 0.1%', comp1: '2.5%', comp2: '4.2%' },
    { name: 'Humanization Engine', us: true, comp1: false, comp2: false },
    { name: 'Plagiarism Checker', us: true, comp1: true, comp2: false },
    { name: 'SEO Optimization', us: true, comp1: false, comp2: false },
    { name: 'Chrome Extension', us: true, comp1: true, comp2: true },
    { name: 'API Access', us: true, comp1: true, comp2: false },
  ];

  return (
    <section className="py-24 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4">
            Why Choose AIDetector.cx?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how we compare against the industry standard detection tools.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border/50 shadow-sm bg-card">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="py-5 px-6 font-semibold text-muted-foreground w-1/3">Feature</th>
                <th className="py-5 px-6 font-extrabold text-primary w-1/4">AIDetector.cx</th>
                <th className="py-5 px-6 font-semibold text-muted-foreground w-1/4">Competitor A</th>
                <th className="py-5 px-6 font-semibold text-muted-foreground w-1/4">Competitor B</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {features.map((feature, i) => (
                <tr key={i} className="hover:bg-muted/10 transition-colors">
                  <td className="py-4 px-6 font-medium text-foreground">{feature.name}</td>
                  <td className="py-4 px-6 font-bold text-foreground">
                    {typeof feature.us === 'boolean' ? (
                      feature.us ? <Check className="w-5 h-5 text-success" /> : <X className="w-5 h-5 text-muted-foreground/30" />
                    ) : (
                      <span className="text-primary">{feature.us}</span>
                    )}
                  </td>
                  <td className="py-4 px-6 font-medium text-muted-foreground">
                    {typeof feature.comp1 === 'boolean' ? (
                      feature.comp1 ? <Check className="w-5 h-5 text-muted-foreground/50" /> : <X className="w-5 h-5 text-muted-foreground/30" />
                    ) : (
                      feature.comp1
                    )}
                  </td>
                  <td className="py-4 px-6 font-medium text-muted-foreground">
                    {typeof feature.comp2 === 'boolean' ? (
                      feature.comp2 ? <Check className="w-5 h-5 text-muted-foreground/50" /> : <X className="w-5 h-5 text-muted-foreground/30" />
                    ) : (
                      feature.comp2
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
