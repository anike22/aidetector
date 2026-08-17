import { useEntitlement } from '@/hooks/useEntitlement';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface UsageBadgeProps {
  featureSlug: string;
  label: string;
  unit?: string;
}

export default function UsageBadge({ featureSlug, label, unit = 'uses' }: UsageBadgeProps) {
  const { entitlement, loading } = useEntitlement(featureSlug);

  if (loading) {
    return (
      <Badge variant="outline" className="gap-1.5 font-normal">
        <Loader2 className="h-3 w-3 animate-spin" />
        {label}
      </Badge>
    );
  }

  if (!entitlement || entitlement.limit === null || entitlement.remaining === null) {
    return null;
  }

  const remaining = entitlement.remaining;
  const limit = entitlement.limit;

  return (
    <Badge
      variant={remaining === 0 ? 'destructive' : 'outline'}
      className="gap-1.5 font-normal"
    >
      <span className={remaining === 0 ? 'text-destructive-foreground' : 'text-muted-foreground'}>
        {label}:
      </span>
      <span className="font-semibold">
        {remaining} of {limit} daily {unit} remaining
      </span>
    </Badge>
  );
}
