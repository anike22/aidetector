import { Plus, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useLifecycle } from '@/contexts/LifecycleContext';

export function GoalTracker() {
  const { goals, goalTemplates, loading, setGoal } = useLifecycle();

  const availableTemplates = goalTemplates.filter(
    (t) => !goals.some((g) => g.goal_key === t.goal_key)
  );

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base md:text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Goals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.length === 0 && availableTemplates.length === 0 && (
          <p className="text-sm text-muted-foreground">No goals available.</p>
        )}
        {goals.map((goal) => (
          <div key={goal.goal_key} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{goal.template?.title || goal.goal_key}</span>
              <span className="text-xs text-muted-foreground">
                {goal.progress}/{goal.target}
              </span>
            </div>
            <Progress value={goal.target > 0 ? (goal.progress / goal.target) * 100 : 0} className="h-2" />
            {goal.completed && <p className="text-xs text-success">Completed</p>}
          </div>
        ))}
        {availableTemplates.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {availableTemplates.slice(0, 3).map((t) => (
              <Button
                key={t.goal_key}
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setGoal(t.goal_key)}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                {t.title}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
