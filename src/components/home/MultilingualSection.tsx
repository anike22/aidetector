import { Globe, CheckCircle2, FlaskConical, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

type LanguageStatus = 'Validated' | 'Beta' | 'Experimental';

interface Language {
  name: string;
  code: string;
  status: LanguageStatus;
}

const LANGUAGES: Language[] = [
  { name: 'English', code: 'en', status: 'Validated' },
  { name: 'Spanish', code: 'es', status: 'Beta' },
  { name: 'French', code: 'fr', status: 'Validated' },
  { name: 'German', code: 'de', status: 'Validated' },
  { name: 'Portuguese', code: 'pt', status: 'Validated' },
  { name: 'Italian', code: 'it', status: 'Beta' },
  { name: 'Arabic', code: 'ar', status: 'Beta' },
  { name: 'Chinese', code: 'zh', status: 'Beta' },
  { name: 'Japanese', code: 'ja', status: 'Beta' },
  { name: 'Korean', code: 'ko', status: 'Beta' },
  { name: 'Hindi', code: 'hi', status: 'Beta' },
  { name: 'Russian', code: 'ru', status: 'Beta' },
  { name: 'Yoruba', code: 'yo', status: 'Experimental' },
  { name: 'Hausa', code: 'ha', status: 'Experimental' },
  { name: 'Igbo', code: 'ig', status: 'Experimental' },
  { name: 'Turkish', code: 'tr', status: 'Beta' },
  { name: 'Indonesian', code: 'id', status: 'Beta' },
  { name: 'Vietnamese', code: 'vi', status: 'Beta' },
  { name: 'Dutch', code: 'nl', status: 'Beta' },
];

const STATUS_CONFIG: Record<LanguageStatus, { icon: typeof CheckCircle2; class: string; description: string }> = {
  Validated: { icon: CheckCircle2, class: 'bg-success/10 text-success border-success/20', description: 'Production-tested with higher confidence thresholds.' },
  Beta: { icon: CheckCircle2, class: 'bg-warning/10 text-warning border-warning/20', description: 'Functional and improving; accuracy may vary by genre.' },
  Experimental: { icon: FlaskConical, class: 'bg-primary/10 text-primary border-primary/20', description: 'Early-stage support; use results as directional only.' },
};

function StatusBadge({ status }: { status: LanguageStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${cfg.class}`}>
      <Icon className="w-3 h-3" /> {status}
    </span>
  );
}

export default function MultilingualSection() {
  const byStatus = (status: LanguageStatus) => LANGUAGES.filter((l) => l.status === status);

  return (
    <section className="py-16 md:py-24 bg-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-5">
            <Globe className="w-6 h-6" />
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground mb-4 text-balance">
            Multilingual AI Detection
          </h2>
          <p className="text-base md:text-lg text-muted-foreground text-pretty">
            Writing patterns vary significantly across languages, so a reliable multilingual AI detector must account for linguistic differences rather than applying identical English assumptions everywhere. AIDetector.cx analyzes text in its detected language using language-aware calibration, with explicit support status for each language.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {(['Validated', 'Beta', 'Experimental'] as LanguageStatus[]).map((status) => {
            const list = byStatus(status);
            const cfg = STATUS_CONFIG[status];
            const Icon = cfg.icon;
            return (
              <Card key={status} className="p-5 border-border/50 bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cfg.class}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{status}</h3>
                    <p className="text-xs text-muted-foreground">{cfg.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {list.map((l) => (
                    <Badge key={l.code} variant="secondary" className="font-normal text-xs bg-muted/50 text-muted-foreground">
                      {l.name}
                    </Badge>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl border border-warning/20 bg-warning/5 text-sm text-muted-foreground">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <p>
            Accuracy varies by language and status. The detector automatically reports the detected language and, where reliable, the regional variant. Mixed-language or code-switching text may be segmented and analyzed per language.
          </p>
        </div>

        <div className="mt-10 text-center">
          <Button asChild variant="outline">
            <Link to="/detector">Try Multilingual AI Detection</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
