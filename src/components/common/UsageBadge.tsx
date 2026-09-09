import { useEntitlement } from '@/hooks/useEntitlement';
import { Badge } from '@/components/ui/badge';
import { Loader2, Coins, Zap } from 'lucide-react';
import { isTrialEligibleOperation } from '@/lib/entitlements';

export interface UsageBadgeProps {
  featureSlug: string;
  label?: string;
  unit?: string;
  operationCost?: number;
}

export default function UsageBadge({
  featureSlug,
  label = 'Cost',
  unit,
  operationCost = 1,
}: UsageBadgeProps) {
  const { summary, entitlement, loading } = useEntitlement(featureSlug);

  if (loading) {
    return (
      <Badge variant="outline" className="gap-1.5 font-normal text-xs">
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading...
      </Badge>
    );
  }

  const isPaid = summary?.isPaidActive ?? false;
  const isAuthenticated = summary?.isAuthenticated ?? entitlement?.isAuthenticated ?? false;
  const trialRemaining = summary?.trialChecksRemaining ?? entitlement?.trialChecksRemaining ?? 0;
  const trialEligible = isTrialEligibleOperation(featureSlug);

  if (trialEligible && trialRemaining > 0 && !isPaid) {
    return (
      <Badge variant="secondary" className="gap-1 font-medium text-xs bg-primary/10 text-primary border-primary/20">
        <Zap className="h-3 w-3 text-primary" />
        {isAuthenticated ? (
          <span>{trialRemaining} Free Check{trialRemaining === 1 ? '' : 's'} Remaining</span>
        ) : (
          <span>{trialRemaining} Free Check{trialRemaining === 1 ? '' : 's'} Remaining</span>
        )}
      </Badge>
    );
  }

  if (trialEligible && trialRemaining === 0 && !isPaid) {
    return (
      <Badge variant="destructive" className="gap-1 font-medium text-xs">
        <Zap className="h-3 w-3" />
        <span>0 Free Checks Remaining</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 font-medium text-xs">
      <Coins className="h-3 w-3 text-primary" />
      <span>{operationCost} Credit{operationCost === 1 ? '' : 's'}</span>
      {isPaid && (
        <span className="text-muted-foreground font-normal">
          ({summary?.creditsBalance ?? 0} available)
        </span>
      )}
    </Badge>
  );
}
