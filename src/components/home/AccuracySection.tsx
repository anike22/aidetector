import { Info, AlertTriangle, FileText, Shuffle, GitMerge, Scale } from 'lucide-react';

const POINTS = [
  {
    icon: Scale,
    title: 'AI Detection Is Probabilistic',
    description:
      'Every result is an estimate of the probability that a text is AI-generated — not a definitive determination. The detector outputs a percentage, not a verdict. The same text could reasonably receive different scores under different calibration models.',
  },
  {
    icon: AlertTriangle,
    title: 'False Positives and False Negatives Are Possible',
    description:
      'A false positive means human-written text is flagged as AI-generated. A false negative means AI-generated text is not flagged. Formal, technical, or highly edited human writing is more likely to trigger a false positive. Raw AI output that has been heavily paraphrased is more likely to produce a false negative.',
  },
  {
    icon: FileText,
    title: 'Longer Samples Provide Stronger Evidence',
    description:
      'Short passages — under 100 words — give the detector little signal to work from and results should be treated with extra caution. Longer, complete documents with consistent style and structure produce more reliable probability estimates.',
  },
  {
    icon: Shuffle,
    title: 'Heavily Edited AI Text Is Harder to Classify',
    description:
      'When AI-generated text has been substantially rewritten, paraphrased, or edited by a human, the original machine-like patterns are disrupted. The result may be a lower AI probability even for text that originated from a language model.',
  },
  {
    icon: Info,
    title: 'Results Should Be Read Alongside Context',
    description:
      'A detection result should not be treated in isolation. Consider the writing history, the author\'s voice in other documents, assignment context, and whether the topic or register tends to produce formal, structured prose that detectors may flag.',
  },
  {
    icon: GitMerge,
    title: 'Independent Detectors Can Legitimately Disagree',
    description:
      'The Balanced and High-Sensitivity modes use different calibration thresholds. Disagreement between them is expected for borderline text — it reflects genuine uncertainty, not an error in either model. When both modes agree strongly, the evidence is stronger.',
  },
];

export default function AccuracySection() {
  return (
    <section className="py-16 md:py-24 bg-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4 text-balance">
            Understanding AI Detector Accuracy
          </h2>
          <p className="text-base md:text-lg text-muted-foreground text-pretty">
            No AI detector can be 100% accurate. Here is what the results mean and how to interpret them responsibly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
          {POINTS.map((p) => (
            <div key={p.title} className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <p.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1.5">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 p-5 rounded-xl border border-border/60 bg-muted/30 text-sm text-muted-foreground text-pretty">
          <strong className="text-foreground">Our commitment to transparency:</strong>{' '}
          We do not publish accuracy percentages we cannot substantiate. AI detection research is ongoing, results vary by text type and language, and responsible use requires acknowledging these limits — not hiding them.
        </div>
      </div>
    </section>
  );
}
