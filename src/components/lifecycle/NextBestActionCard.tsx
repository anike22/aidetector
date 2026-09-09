import { ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLifecycle } from '@/contexts/LifecycleContext';

export function NextBestActionCard({ embedded = false }: { embedded?: boolean }) {
  const { nextAction, loading } = useLifecycle();

  if (loading) return null;
  if (!nextAction) return null;

  return (
    <Card className={`${embedded ? 'border-0 shadow-none' : ''} relative overflow-hidden`}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-accent" />
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Recommended Next Step
        </div>
        <CardTitle className="text-base md:text-lg">{nextAction.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{nextAction.description}</p>
        <Button asChild className="w-full md:w-auto">
          <a href={nextAction.cta_url}>
            Take Action
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
