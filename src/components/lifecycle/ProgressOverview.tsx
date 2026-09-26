import { Activity, Heart, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LifecycleStageBadge } from './LifecycleStageBadge';
import { useLifecycle } from '@/contexts/LifecycleContext';

export function ProgressOverview() {
  const { profile, checklist, loading } = useLifecycle();

  const items = checklist.filter((i) => i.item?.enabled);
  const completed = items.filter((i) => i.completed).length;
  const activationPercent = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  if (loading) return null;

  const health = profile?.health_score ?? 0;
  const readiness = profile?.upgrade_readiness_score ?? 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Lifecycle Stage</p>
              <div className="mt-2">
                <LifecycleStageBadge stage={profile?.lifecycle_stage} />
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <Activity className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Activation Score</p>
              <p className="mt-1 text-2xl font-bold">{profile?.activation_score ?? 0}</p>
              <Progress value={activationPercent} className="mt-2 h-1.5" />
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Health Score</p>
              <p className="mt-1 text-2xl font-bold">{health}</p>
              <Progress value={health} className="mt-2 h-1.5" />
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Heart className="h-5 w-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
