import { Award, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLifecycle } from '@/contexts/LifecycleContext';

export function MilestonesGrid() {
  const { milestones, userMilestones, loading } = useLifecycle();

  const unlockedKeys = new Set(userMilestones.map((m) => m.milestone_key));

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base md:text-lg flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {milestones.map((m) => {
            const unlocked = unlockedKeys.has(m.milestone_key);
            return (
              <div
                key={m.milestone_key}
                className={`flex flex-col items-center justify-center rounded-lg border p-3 text-center ${
                  unlocked ? 'border-border bg-card' : 'border-dashed border-muted bg-muted/30 opacity-70'
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${unlocked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {unlocked ? <Award className="h-5 w-5" /> : <Lock className="h-4 w-4" />}
                </div>
                <p className={`mt-2 text-xs font-medium ${unlocked ? '' : 'text-muted-foreground'}`}>
                  {m.title}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
