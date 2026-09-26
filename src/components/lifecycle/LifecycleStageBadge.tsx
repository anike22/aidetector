import type { LifecycleStage } from '@/types/lifecycle';

const STAGE_LABELS: Record<LifecycleStage, string> = {
  anonymous_visitor: 'Anonymous Visitor',
  registered: 'Registered',
  email_verified: 'Email Verified',
  activated: 'Activated',
  engaged: 'Engaged',
  power_user: 'Power User',
  pro_customer: 'Pro Customer',
  business_customer: 'Business Customer',
  enterprise_customer: 'Enterprise Customer',
  inactive: 'Inactive',
  at_risk: 'At Risk',
  churned: 'Churned',
  recovered: 'Recovered',
};

const STAGE_COLORS: Record<LifecycleStage, string> = {
  anonymous_visitor: 'bg-muted text-muted-foreground',
  registered: 'bg-secondary text-secondary-foreground',
  email_verified: 'bg-info/10 text-info',
  activated: 'bg-success/10 text-success',
  engaged: 'bg-primary/10 text-primary',
  power_user: 'bg-accent text-accent-foreground',
  pro_customer: 'bg-warning/10 text-warning',
  business_customer: 'bg-warning/10 text-warning',
  enterprise_customer: 'bg-warning/10 text-warning',
  inactive: 'bg-muted text-muted-foreground',
  at_risk: 'bg-destructive/10 text-destructive',
  churned: 'bg-muted text-muted-foreground',
  recovered: 'bg-success/10 text-success',
};

export function LifecycleStageBadge({ stage }: { stage: LifecycleStage | null | undefined }) {
  if (!stage) return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">Unknown</span>;
  const label = STAGE_LABELS[stage] || stage;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_COLORS[stage] || 'bg-muted text-muted-foreground'}`}>
      {label}
    </span>
  );
}
