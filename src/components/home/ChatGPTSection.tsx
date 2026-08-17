import { BotMessageSquare, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function ChatGPTSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-5">
            <BotMessageSquare className="w-6 h-6" />
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground mb-5 text-balance">
            Can This AI Detector Detect ChatGPT?
          </h2>
        </div>

        <div className="space-y-5 text-base md:text-lg text-muted-foreground leading-relaxed text-pretty">
          <p>
            Yes — AIDetector.cx is designed to analyze patterns associated with machine-generated writing,
            including text produced by generative systems such as <strong className="text-foreground">ChatGPT</strong>,{' '}
            <strong className="text-foreground">Claude</strong>, and{' '}
            <strong className="text-foreground">Gemini</strong>. Rather than matching against a database of
            known outputs, the detector examines linguistic and statistical signals in the writing itself — things
            like sentence structure, vocabulary distribution, and stylistic consistency — that tend to differ
            between human and AI-generated text.
          </p>
          <p>
            Because these models share broadly similar training approaches and generation mechanisms, patterns
            learned from one model are often indicative of others. That said, AI detection is probabilistic:
            the result is an estimate of how likely a text is AI-generated, not a definitive proof of which
            model produced it or whether a specific individual used AI assistance.
          </p>
          <p>
            Highly polished human writing, edited AI text, or content that has been substantially rewritten
            may score differently than raw AI output. The Balanced Detector is calibrated to reduce false
            positives for these cases; the High-Sensitivity mode applies stricter thresholds and will flag
            more borderline text.
          </p>
        </div>

        <div className="mt-8 flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-muted/30 text-sm text-muted-foreground">
          <Info className="w-5 h-5 shrink-0 mt-0.5 text-primary" />
          <p>
            <strong className="text-foreground">Important:</strong> AI detection results should not be used
            as the sole evidence in academic, employment, or disciplinary decisions. Always combine detection
            results with human judgment, writing history, and other available context.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Button asChild>
            <Link to="/detector">
              Analyze Text Now <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
