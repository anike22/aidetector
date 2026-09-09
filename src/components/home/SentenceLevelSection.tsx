import { ScanText, ArrowRight, Highlighter, AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';

const FEATURES = [
  {
    icon: ScanText,
    title: 'Passage-by-Passage Breakdown',
    description:
      'Rather than relying on a single document-level percentage, sentence-level AI detection highlights individual passages so you can see exactly which parts of the text look most AI-generated.',
  },
  {
    icon: Highlighter,
    title: 'Mixed-Authorship Visibility',
    description:
      'When a document mixes human and AI writing, a global score alone can be misleading. The AI sentence detector surfaces the contrast between sections, giving you better evidence for judgment.',
  },
  {
    icon: AlignLeft,
    title: 'Paragraph-Level Context',
    description:
      'Signals are grouped by paragraph as well as sentence, so you can identify patterns across larger blocks of text — useful for longer essays, reports, and articles.',
  },
];

export default function SentenceLevelSection() {
  return (
    <section className="py-16 md:py-24 bg-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-5">
            <ScanText className="w-6 h-6" />
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4 text-balance">
            See Which Sentences Look AI-Generated
          </h2>
          <p className="text-base md:text-lg text-muted-foreground text-pretty">
            Document-level scores give you an overview, but sentence-level AI detection lets you inspect individual passages rather than relying exclusively on a single percentage. The full detector page shows a colour-coded breakdown of which sentences carry the strongest AI-like signals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {FEATURES.map((f) => (
            <Card key={f.title} className="p-6 border-border/50 bg-card h-full flex flex-col">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary shrink-0">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">{f.description}</p>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button asChild>
            <Link to="/detector">
              Try Sentence-Level Detection <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
