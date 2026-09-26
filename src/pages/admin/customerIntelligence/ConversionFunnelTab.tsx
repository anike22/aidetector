import React, { useMemo, useState } from 'react';
import { FunnelStageData, DeviceCategory, TrafficChannel, DateRangePreset } from '@/types/customerIntelligence';
import { FunnelFilterOptions, computeConversionFunnel } from '@/lib/customerIntelligence/analyticsEngine';
import { CustomerProfile, LeadEvent } from '@/types/cdp';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowDown, Filter, RefreshCw, TrendingUp, TrendingDown, Users, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ConversionFunnelTabProps {
  profiles?: CustomerProfile[];
  events?: LeadEvent[];
}

export function ConversionFunnelTab({ profiles = [], events = [] }: ConversionFunnelTabProps) {
  const [filters, setFilters] = useState<FunnelFilterOptions>({
    device: 'all',
    trafficSource: 'all',
    visitorType: 'all',
    dateRange: '30d',
  });

  const funnelData: FunnelStageData[] = useMemo(() => {
    return computeConversionFunnel(filters, profiles, events);
  }, [filters, profiles, events]);

  const resetFilters = () => {
    setFilters({
      device: 'all',
      trafficSource: 'all',
      visitorType: 'all',
      dateRange: '30d',
    });
  };

  const overallConvRate = funnelData.length > 0 ? funnelData[funnelData.length - 1].overallConversionRate : 0;

  return (
    <div className="space-y-6">
      {/* Funnel Filters Bar */}
      <Card className="border border-border shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Filter className="w-4 h-4 text-primary" />
              <span>Interactive Funnel Segmentation:</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={filters.device}
                onValueChange={(v) => setFilters((prev) => ({ ...prev, device: v as any }))}
              >
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <SelectValue placeholder="Device" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Devices</SelectItem>
                  <SelectItem value="desktop">Desktop</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="tablet">Tablet</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.trafficSource}
                onValueChange={(v) => setFilters((prev) => ({ ...prev, trafficSource: v as any }))}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="organic">Organic Search</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="paid">Paid Campaigns</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.visitorType}
                onValueChange={(v) => setFilters((prev) => ({ ...prev, visitorType: v as any }))}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="Visitor Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Visitors</SelectItem>
                  <SelectItem value="new">New Visitors</SelectItem>
                  <SelectItem value="returning">Returning</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 text-xs">
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main 8-Stage Funnel Display */}
      <Card className="border border-border shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                8-Stage Acquisition &amp; Monetization Conversion Funnel
              </CardTitle>
              <CardDescription className="text-xs">
                Tracks users from initial landing to tool activation, signup, pricing review, checkout, and successful subscription.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs px-3 py-1 font-mono">
                Overall Conv: <span className="font-bold text-primary ml-1">{overallConvRate}%</span>
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {funnelData.map((stage, idx) => {
            const widthPct = Math.max(6, Math.min(100, stage.overallConversionRate));
            const isFirst = idx === 0;
            const isLast = idx === funnelData.length - 1;

            return (
              <div key={stage.stageId} className="space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-sm">{stage.label}</span>
                    <span className="text-muted-foreground font-mono">({stage.count.toLocaleString()} users)</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    {!isFirst && (
                      <span className="text-muted-foreground">
                        Step Conv: <strong className="text-foreground font-mono">{stage.conversionRate}%</strong>
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      Overall: <strong className="text-primary font-mono">{stage.overallConversionRate}%</strong>
                    </span>
                    {!isFirst && (
                      <span className="text-rose-600 dark:text-rose-400">
                        Dropoff: <strong className="font-mono">{stage.dropoffRate}%</strong>
                      </span>
                    )}
                    <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                      <span>+{stage.deltaPct}%</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full bg-muted/60 h-7 rounded-lg overflow-hidden relative flex items-center p-1 border border-border/50">
                  <div
                    className={`h-full rounded-md transition-all duration-500 flex items-center px-3 ${
                      isLast
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                        : isFirst
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/80 text-primary-foreground'
                    }`}
                    style={{ width: `${widthPct}%` }}
                  >
                    <span className="text-xs font-mono font-bold drop-shadow-xs">
                      {stage.count.toLocaleString()}
                    </span>
                  </div>
                </div>

                {!isLast && (
                  <div className="flex justify-center py-0.5">
                    <ArrowDown className="w-3.5 h-3.5 text-muted-foreground/40" />
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
