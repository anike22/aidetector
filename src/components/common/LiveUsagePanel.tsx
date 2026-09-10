import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEntitlement } from '@/hooks/useEntitlement';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Zap,
  Coins,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  Calendar,
  Layers,
} from 'lucide-react';
import { preserveDraftText } from '@/lib/visitorId';
import { isTrialEligibleOperation, RATE_TABLE } from '@/lib/entitlements';

interface LiveUsagePanelProps {
  featureSlug?: string;
  operationCost?: number;
  operationCostLabel?: string;
  currentDraftText?: string;
  compact?: boolean;
  className?: string;
}

export function LiveUsagePanel({
  featureSlug = 'text_detect_balanced',
  operationCost = 1,
  operationCostLabel = '1 check',
  currentDraftText,
  compact = false,
  className = '',
}: LiveUsagePanelProps) {
  const navigate = useNavigate();
  const { summary, entitlement, loading, refresh } = useEntitlement(featureSlug);

  const plan = summary?.plan || entitlement?.plan || 'guest';
  const isAuthenticated = summary?.isAuthenticated ?? entitlement?.isAuthenticated ?? false;
  const isPaid = summary?.isPaidActive ?? false;
  const wasPaidPlan = ['pro', 'pro_plus', 'pro+', 'business', 'enterprise'].includes(plan.toLowerCase());
  const isExpiredPaidPlan = isAuthenticated && wasPaidPlan && !isPaid;

  const trialChecksRemaining = typeof summary?.trialChecksRemaining === 'number'
    ? summary.trialChecksRemaining
    : typeof entitlement?.trialChecksRemaining === 'number'
    ? entitlement.trialChecksRemaining
    : 0;
  const trialChecksTotal = summary?.trialChecksTotal ?? entitlement?.trialChecksTotal ?? (isAuthenticated ? 5 : 1);
  const trialChecksUsed = summary?.trialChecksUsed ?? Math.max(0, trialChecksTotal - trialChecksRemaining);

  const creditsBalance = summary?.creditsBalance ?? 0;
  const monthlyAllocation = summary?.monthlyCreditAllocation ?? 0;
  const refillDate = summary?.creditsRefillDate;
  const planEndDate = summary?.planEndDate;

  const trialEligible = isTrialEligibleOperation(featureSlug);
  const hasTrialRemaining = trialChecksRemaining > 0;

  // Format refill date
  const formattedRefillDate = useMemo(() => {
    if (!refillDate) return null;
    try {
      return new Date(refillDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  }, [refillDate]);
  const formattedPlanEndDate = useMemo(() => {
    if (!planEndDate) return null;
    const date = new Date(planEndDate);
    return Number.isFinite(date.getTime()) ? date.toLocaleDateString() : null;
  }, [planEndDate]);

  // Percentage calculations
  const progressPercent = useMemo(() => {
    if (isPaid) {
      if (!monthlyAllocation || monthlyAllocation <= 0) return 100;
      return Math.max(0, Math.min(100, Math.round((creditsBalance / monthlyAllocation) * 100)));
    }
    if (!trialChecksTotal || trialChecksTotal <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((trialChecksRemaining / trialChecksTotal) * 100)));
  }, [isPaid, monthlyAllocation, creditsBalance, trialChecksRemaining, trialChecksTotal]);

  const handleAction = (path: string) => {
    if (currentDraftText) {
      preserveDraftText(currentDraftText, featureSlug);
    }
    navigate(path);
  };

  const isExhausted = isPaid
    ? creditsBalance < operationCost
    : !hasTrialRemaining && creditsBalance < operationCost;

  if (compact) {
    const indicatorText = isPaid
      ? `${creditsBalance} credits`
      : !isAuthenticated
      ? trialChecksRemaining > 0
        ? '1 free check left'
        : '0 free checks left'
      : `${trialChecksRemaining} free check${trialChecksRemaining === 1 ? '' : 's'} left`;

    return (
      <div className={`flex items-center gap-1.5 shrink-0 ${className}`}>
        <button
          type="button"
          onClick={() => handleAction(isAuthenticated ? (isPaid ? '/dashboard' : '/pricing') : '/signup')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors bg-muted/60 hover:bg-muted text-foreground border border-border/50 cursor-pointer"
          title={!isAuthenticated ? '1 free check left. Create an account to get 4 additional checks.' : 'View usage and plans'}
        >
          {isPaid ? (
            <Coins className="h-3 w-3 text-primary shrink-0" />
          ) : (
            <Zap className={`h-3 w-3 shrink-0 ${trialChecksRemaining > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
          )}
          <span className="whitespace-nowrap">{indicatorText}</span>
        </button>
      </div>
    );
  }

  return (
    <Card className={`border-border bg-card shadow-sm w-full min-w-0 overflow-hidden ${className}`}>
      <CardHeader className="pb-3 pt-4 px-3 sm:px-4 md:px-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              {isPaid ? <Coins className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <CardTitle className="text-sm sm:text-base font-bold text-foreground break-words text-pretty">
                  {isPaid
                    ? 'Active Paid Balance'
                    : isExpiredPaidPlan
                    ? 'Your paid entitlement has expired. Renew to continue.'
                    : !isAuthenticated
                    ? trialChecksRemaining > 0
                      ? 'You have 1 free check remaining. Register to unlock 4 additional free checks.'
                      : 'You’ve used your free guest check. Create an account to get 4 additional free checks.'
                    : trialChecksRemaining > 0
                    ? `You have ${trialChecksRemaining} free check${trialChecksRemaining === 1 ? '' : 's'} remaining.`
                    : 'You’ve used all your free checks. Choose a plan to continue.'}
                </CardTitle>
                <Badge
                  variant={isExhausted ? 'destructive' : isPaid ? 'default' : 'secondary'}
                  className="capitalize text-xs font-semibold shrink-0"
                >
                  {plan === 'guest' ? 'Guest' : plan === 'free' ? 'Free Account' : plan}
                </Badge>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-0.5 break-words text-pretty">
                {isPaid
                  ? `Monthly credit grant refilled automatically on your billing cycle`
                  : isExpiredPaidPlan
                  ? `Plan ended${formattedPlanEndDate ? ` on ${formattedPlanEndDate}` : ''}; paid features and remaining period credits are inactive.`
                  : isAuthenticated
                  ? `One-time introductory trial allowance (authoritative server balance)`
                  : `Instant single check. Create a free account anytime to unlock 4 additional free checks.`}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh()}
              disabled={loading}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            {!isPaid && !isAuthenticated && (
              <Button
                size="sm"
                className="h-8 text-xs bg-primary text-primary-foreground font-semibold gap-1.5"
                onClick={() => handleAction('/signup')}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Register for 4 Free Checks
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 sm:px-4 md:px-6 pb-4 pt-1 space-y-4 min-w-0">
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              {isPaid ? (
                <>
                  <Coins className="h-3.5 w-3.5 text-primary" />
                  Available Monthly Credits
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  Trial Checks Remaining
                </>
              )}
            </span>
            <span className="font-bold text-foreground">
              {isPaid ? (
                `${creditsBalance} / ${monthlyAllocation || creditsBalance} credits`
              ) : !isAuthenticated ? (
                `${trialChecksRemaining} of 1 check remaining`
              ) : (
                `${trialChecksRemaining} of ${trialChecksTotal} checks remaining`
              )}
            </span>
          </div>

          <Progress value={progressPercent} className="h-2" />

          <div className="flex justify-between items-center text-[11px] text-muted-foreground">
            <span>
              {isPaid
                ? `${summary?.creditsUsedTotal || 0} total credits used`
                : `${trialChecksUsed} check${trialChecksUsed === 1 ? '' : 's'} used`}
            </span>
            {isPaid && formattedRefillDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Next monthly refill: {formattedRefillDate}
              </span>
            )}
            {!isPaid && (
              <span className="text-muted-foreground italic">
                One-time introductory checks (lifetime)
              </span>
            )}
          </div>
        </div>

        {/* Status Callout when Low or Exhausted */}
        {isExhausted && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-destructive font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                {isPaid
                  ? 'Your monthly credit balance is depleted. Top up credits or upgrade your plan to continue.'
                  : isExpiredPaidPlan
                  ? 'Your subscription period has ended. Renew your plan to restore paid features and credits.'
                  : isAuthenticated
                  ? 'You’ve used all your free checks. Choose a plan to continue.'
                  : 'You’ve used your free guest check. Create an account to get 4 additional free checks.'}
              </span>
            </div>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground font-semibold shrink-0 text-xs h-7 px-3"
              onClick={() => handleAction(isAuthenticated ? '/pricing' : '/signup')}
            >
              {isAuthenticated ? 'View Plans' : 'Create Account'}
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}

        {/* Feature Rates & Operation Cost helper */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground">Current Feature:</span>
            <span>{RATE_TABLE[featureSlug]?.name || featureSlug}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
              {trialEligible && hasTrialRemaining ? '1 Trial Check' : `${operationCost} credit${operationCost === 1 ? '' : 's'}`}
            </Badge>
          </div>
          <button
            type="button"
            onClick={() => navigate('/pricing')}
            className="text-primary hover:underline font-medium text-[11px] inline-flex items-center gap-1"
          >
            <Layers className="h-3 w-3" />
            View Pricing & Plans
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
