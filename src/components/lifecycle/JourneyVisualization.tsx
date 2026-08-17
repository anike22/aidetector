import { Check } from 'lucide-react';
import { useLifecycle } from '@/contexts/LifecycleContext';

const JOURNEY_STAGES = [
  { key: 'signup', label: 'Signup' },
  { key: 'email_verification', label: 'Verify Email' },
  { key: 'first_detector_use', label: 'First Scan' },
  { key: 'first_humanizer_use', label: 'First Humanize' },
  { key: 'pricing_visit', label: 'Pricing Visit' },
  { key: 'upgrade_to_pro', label: 'Upgrade' },
  { key: 'api_key_generation', label: 'API Key' },
  { key: 'extension_install', label: 'Extension' },
  { key: 'plugin_install', label: 'Plugin' },
  { key: 'renewal', label: 'Renewal' },
];

export function JourneyVisualization() {
  const { journeyStages, loading } = useLifecycle();

  const completed = new Set(journeyStages.filter((s) => s.completed).map((s) => s.stage_key));
  const lastCompletedIndex = JOURNEY_STAGES.reduce((last, stage, index) => (
    completed.has(stage.key) ? index : last
  ), -1);

  if (loading) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-6">
      <h3 className="text-base font-semibold">Your Product Journey</h3>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {JOURNEY_STAGES.map((stage, index) => {
          const isCompleted = completed.has(stage.key);
          const isCurrent = index === lastCompletedIndex + 1;
          return (
            <div key={stage.key} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                  isCompleted
                    ? 'bg-success/10 text-success'
                    : isCurrent
                    ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted && <Check className="h-3.5 w-3.5" />}
                {stage.label}
              </div>
              {index < JOURNEY_STAGES.length - 1 && (
                <span className="hidden md:inline-block h-px w-4 bg-border" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
