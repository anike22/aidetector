import { Scale, ShieldAlert, Info, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function TwoPerspectivesSection() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4 text-balance">
            Why Two AI Detection Modes?
          </h2>
          <p className="text-base md:text-lg text-muted-foreground text-pretty">
            AI detection is probabilistic — it estimates how likely a text is AI-generated, not whether it proves authorship. Different detection approaches can identify different signals, which is why running two independent modes gives you a more complete picture.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 md:p-8 border-border/50 bg-card/50">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 text-primary">
              <Scale className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xl font-bold text-foreground">Balanced Detector</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-success/10 text-success border-success/20">Recommended</span>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Calibrated to balance AI detection sensitivity with reduced false-positive risk. Best for general-purpose detection where avoiding incorrectly flagging human writing matters.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-success bg-success/10 px-3 py-1.5 rounded-full">
              <Info className="w-3.5 h-3.5" /> Recommended for most users
            </div>
          </Card>

          <Card className="p-6 md:p-8 border-border/50 bg-card/50">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-5 text-destructive">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-xl font-bold text-foreground">High-Sensitivity Analysis</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border bg-warning/10 text-warning border-warning/20">Strict</span>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Detects weaker AI-like patterns with higher sensitivity. This mode has a greater risk of flagging human-written text and should be interpreted alongside the Balanced result.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-medium text-warning bg-warning/10 px-3 py-1.5 rounded-full">
              <Info className="w-3.5 h-3.5" /> Higher sensitivity, more false positives
            </div>
          </Card>
        </div>

        <div className="mt-8 p-5 rounded-xl border border-border/60 bg-muted/30 text-sm text-muted-foreground text-center text-pretty">
          When the two detectors disagree, that disagreement does <strong>not</strong> automatically mean mixed authorship — it often reflects borderline signals that different calibration methods weigh differently. Always use both results together with human judgment.
        </div>

        <div className="mt-8 text-center">
          <Button asChild>
            <Link to="/detector">
              Run Full Dual-Mode Analysis <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
