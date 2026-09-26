import React from 'react';
import { DateRangePreset, OverviewMetricsSummary } from '@/types/customerIntelligence';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  UserPlus,
  UserCheck,
  CreditCard,
  Percent,
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  Sparkles,
  DollarSign,
  ShoppingCart,
  Eye,
  ShieldCheck,
  Compass,
} from 'lucide-react';

interface EnhancedOverviewTabProps {
  metrics: OverviewMetricsSummary;
  dateRange: DateRangePreset;
  onDateRangeChange: (range: DateRangePreset) => void;
}

export function EnhancedOverviewTab({ metrics, dateRange, onDateRangeChange }: EnhancedOverviewTabProps) {
  const renderDelta = (delta: number, inverted = false) => {
    const isPositive = inverted ? delta < 0 : delta > 0;
    const isNeutral = delta === 0;

    return (
      <div className={`flex items-center gap-1 text-xs font-semibold ${
        isNeutral ? 'text-muted-foreground' : isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
      }`}>
        {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        <span>{delta > 0 ? `+${delta}%` : `${delta}%`}</span>
        <span className="text-muted-foreground font-normal ml-0.5">vs prev period</span>
      </div>
    );
  };

  const primaryCards = [
    {
      label: 'Unique Visitors',
      value: metrics.uniqueVisitors.toLocaleString(),
      delta: metrics.uniqueVisitorsDeltaPct,
      icon: Users,
      desc: 'Distinct visitor IDs tracked',
    },
    {
      label: 'New Visitors',
      value: metrics.newVisitors.toLocaleString(),
      delta: metrics.newVisitorsDeltaPct,
      icon: UserPlus,
      desc: 'First seen in current period',
    },
    {
      label: 'Returning Visitors',
      value: metrics.returningVisitors.toLocaleString(),
      delta: metrics.returningVisitorsDeltaPct,
      icon: UserCheck,
      desc: 'Active repeat visitor sessions',
    },
    {
      label: 'Registered Users',
      value: metrics.registeredUsers.toLocaleString(),
      delta: metrics.registeredUsersDeltaPct,
      icon: ShieldCheck,
      desc: 'Created authenticated account',
    },
    {
      label: 'Paid Customers',
      value: metrics.paidUsers.toLocaleString(),
      delta: metrics.paidUsersDeltaPct,
      icon: CreditCard,
      desc: 'Subscribed to Pro / Business / Ent',
    },
    {
      label: 'Total Revenue',
      value: `$${metrics.totalRevenue.toLocaleString()}`,
      delta: metrics.totalRevenueDeltaPct,
      icon: DollarSign,
      desc: 'Gross subscription revenue',
    },
    {
      label: 'Revenue / Visitor',
      value: `$${metrics.revenuePerVisitor.toFixed(2)}`,
      delta: metrics.revenuePerVisitorDeltaPct,
      icon: Compass,
      desc: 'Average yield per unique visitor',
    },
    {
      label: 'Total Tool Uses',
      value: metrics.totalToolUses.toLocaleString(),
      delta: metrics.totalToolUsesDeltaPct,
      icon: Sparkles,
      desc: 'Checks performed across all tools',
    },
  ];

  const conversionRates = [
    {
      label: 'Visitor → Registration Rate',
      value: `${metrics.visitorToRegistrationRate}%`,
      delta: metrics.visitorToRegistrationRateDeltaPct,
      subtext: `${metrics.registeredUsers.toLocaleString()} of ${metrics.uniqueVisitors.toLocaleString()} signed up`,
    },
    {
      label: 'Registration → Paid Conversion',
      value: `${metrics.registrationToPaidRate}%`,
      delta: metrics.registrationToPaidRateDeltaPct,
      subtext: `${metrics.paidUsers.toLocaleString()} of ${metrics.registeredUsers.toLocaleString()} paid`,
    },
    {
      label: 'Visitor → Paid Overall Conversion',
      value: `${metrics.visitorToPaidRate}%`,
      delta: metrics.visitorToPaidRateDeltaPct,
      subtext: 'End-to-end commercial conversion',
    },
    {
      label: 'Checkout Abandonment Rate',
      value: `${metrics.checkoutAbandonmentRate}%`,
      delta: metrics.checkoutAbandonmentRateDeltaPct,
      inverted: true,
      subtext: 'Started checkout but did not complete',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter & Date Range Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        <div>
          <h2 className="text-base font-semibold text-foreground">Behavioral Analytics &amp; Conversion Executive Overview</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cross-session tracking, multi-touch engagement, and commercial yield telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-medium">Comparison Period:</span>
          <Select value={dateRange} onValueChange={(v) => onDateRangeChange(v as DateRangePreset)}>
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 8 Primary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {primaryCards.map((card) => (
          <Card key={card.label} className="border border-border shadow-xs">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground tracking-wide">{card.label}</span>
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <card.icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold tracking-tight text-foreground">{card.value}</div>
              <div className="pt-1">{renderDelta(card.delta)}</div>
              <p className="text-[11px] text-muted-foreground line-clamp-1">{card.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conversion Rates & Funnel Yields */}
      <Card className="border border-border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Conversion Velocity &amp; Funnel Health</CardTitle>
          <CardDescription className="text-xs">
            Key stage-to-stage transition metrics compared against previous timeframe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {conversionRates.map((cr) => (
              <div key={cr.label} className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                <span className="text-xs text-muted-foreground font-medium block">{cr.label}</span>
                <div className="text-2xl font-bold text-foreground">{cr.value}</div>
                <div>{renderDelta(cr.delta, cr.inverted)}</div>
                <span className="text-[11px] text-muted-foreground block">{cr.subtext}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Engagement & Session Depth */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Average Session Duration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold">{metrics.avgSessionDurationSeconds} seconds</div>
            <div className="pt-1">{renderDelta(metrics.avgSessionDurationDeltaPct)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Active engagement duration across all desktop &amp; mobile visitors.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Engaged Sessions (&gt;10s)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold">{metrics.engagedSessions.toLocaleString()}</div>
            <div className="pt-1">{renderDelta(metrics.engagedSessionsDeltaPct)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Non-bounce sessions with active text paste, scan, or navigation.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> Pricing Intent Visitors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold">{metrics.pricingPageVisitors.toLocaleString()}</div>
            <div className="pt-1">{renderDelta(metrics.pricingPageVisitorsDeltaPct)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Visitors who viewed /pricing or plan selection modals.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
