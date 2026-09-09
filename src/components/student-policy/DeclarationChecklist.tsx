import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Info, CheckCircle2, AlertTriangle, HelpCircle, ShieldCheck } from 'lucide-react';
import {
  type DeclaredAIActivity,
  type ActivityComparisonResult,
  type StructuredPolicyInterpretation,
} from '@/types/studentPolicy';
import { DECLARED_ACTIVITIES_METADATA } from '@/lib/studentPolicy/policyInterpreter';

interface DeclarationChecklistProps {
  selectedActivities: DeclaredAIActivity[];
  onChange: (activities: DeclaredAIActivity[]) => void;
  evaluationResults: ActivityComparisonResult[];
  interpretation: StructuredPolicyInterpretation | null;
}

const ALL_ACTIVITIES: DeclaredAIActivity[] = [
  'none',
  'brainstorming',
  'outlining',
  'grammar-spelling',
  'translation',
  'rewriting-paraphrasing',
  'generated-sentences',
  'research-summaries',
  'coding-assistance',
  'other',
  'prefer-not-to-specify',
];

export const DeclarationChecklist: React.FC<DeclarationChecklistProps> = ({
  selectedActivities,
  onChange,
  evaluationResults,
  interpretation,
}) => {
  const handleToggle = (activityId: DeclaredAIActivity) => {
    if (activityId === 'none') {
      onChange(selectedActivities.includes('none') ? [] : ['none']);
      return;
    }
    if (activityId === 'prefer-not-to-specify') {
      onChange(selectedActivities.includes('prefer-not-to-specify') ? [] : ['prefer-not-to-specify']);
      return;
    }

    const withoutExclusives = selectedActivities.filter(
      (a) => a !== 'none' && a !== 'prefer-not-to-specify'
    );
    if (withoutExclusives.includes(activityId)) {
      onChange(withoutExclusives.filter((a) => a !== activityId));
    } else {
      onChange([...withoutExclusives, activityId]);
    }
  };

  const getEvaluationForActivity = (act: DeclaredAIActivity): ActivityComparisonResult | undefined => {
    return evaluationResults.find((r) => r.activityId === act);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/70 bg-muted/30 p-3.5 text-xs text-muted-foreground flex items-start gap-2.5">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold text-foreground">Student Declaration:</strong> This checklist records what you declare you used AI for. It is separate from automated detector measurements and does not change detector scores or establish certified academic compliance.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {ALL_ACTIVITIES.map((activityId) => {
          const meta = DECLARED_ACTIVITIES_METADATA[activityId];
          const isSelected = selectedActivities.includes(activityId);
          const evalResult = getEvaluationForActivity(activityId);

          return (
            <div
              key={activityId}
              className={`flex flex-col p-3 rounded-lg border transition-all text-xs ${
                isSelected
                  ? 'border-primary/50 bg-primary/5 shadow-xs'
                  : 'border-border/60 bg-card hover:bg-muted/20'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id={`activity-${activityId}`}
                  checked={isSelected}
                  onCheckedChange={() => handleToggle(activityId)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={`activity-${activityId}`}
                    className="font-semibold text-foreground cursor-pointer block leading-tight text-xs"
                  >
                    {meta.label}
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-normal">
                    {meta.description}
                  </p>
                </div>
              </div>

              {isSelected && evalResult && interpretation && (
                <div className="mt-2.5 pt-2 border-t border-border/40 pl-6">
                  <div className="flex items-center gap-1.5 mb-1">
                    {evalResult.verdict === 'permitted-with-conditions' && (
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Permitted with Conditions
                      </Badge>
                    )}
                    {evalResult.verdict === 'potential-conflict' && (
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 font-medium">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Potential Policy Conflict
                      </Badge>
                    )}
                    {evalResult.verdict === 'unaddressed-by-policy' && (
                      <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground border-border font-medium">
                        <HelpCircle className="w-3 h-3 mr-1" />
                        Unaddressed by Policy
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-foreground/90 leading-relaxed">
                    {evalResult.explanation}
                  </p>
                  {evalResult.relevantRuleExcerpt && (
                    <blockquote className="mt-1 text-[10px] italic text-muted-foreground border-l-2 border-border pl-2">
                      “{evalResult.relevantRuleExcerpt}”
                    </blockquote>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
