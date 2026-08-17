import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Crown } from 'lucide-react';
import { isPaidSubscriptionActive, isSubscriptionLoading } from '@/lib/subscription';

interface SubscriptionActionsProps {
  plan: string | null | undefined;
  status: string | null | undefined;
  planEndDate: string | null | undefined;
  onRefresh: () => Promise<void>;
  onManage: () => void;
}

export function SubscriptionActions({ plan, status, planEndDate, onRefresh, onManage }: SubscriptionActionsProps) {
  const [refreshing, setRefreshing] = useState(false);

  const isPaidActive = isPaidSubscriptionActive(plan, status, planEndDate);
  const isLoading = isSubscriptionLoading(plan, status);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-lg text-xs font-semibold"
          aria-label="Refresh subscription status"
        >
          {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          <span className="ml-1.5 hidden sm:inline">Refresh Status</span>
        </Button>
      </div>
    );
  }

  if (isPaidActive) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-lg text-xs font-semibold"
          aria-label="Refresh subscription status"
        >
          {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          <span className="ml-1.5 hidden sm:inline">Refresh</span>
        </Button>
        <Button
          size="sm"
          onClick={onManage}
          className="rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Crown className="w-3.5 h-3.5 mr-1.5" /> Manage Subscription
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={refreshing}
        className="rounded-lg text-xs font-semibold"
        aria-label="Refresh subscription status"
      >
        {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        <span className="ml-1.5 hidden sm:inline">Refresh</span>
      </Button>
      <Button
        size="sm"
        onClick={onManage}
        className="rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
      >
        <Crown className="w-3.5 h-3.5 mr-1.5" /> Upgrade
      </Button>
    </div>
  );
}
