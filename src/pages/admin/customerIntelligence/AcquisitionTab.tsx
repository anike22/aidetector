import React, { useMemo, useState } from 'react';
import { computeAcquisitionReport } from '@/lib/customerIntelligence/analyticsEngine';
import { CustomerProfile } from '@/types/cdp';
import { AcquisitionReportItem } from '@/types/customerIntelligence';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Compass, DollarSign, Users, Globe, ExternalLink } from 'lucide-react';

interface AcquisitionTabProps {
  profiles?: CustomerProfile[];
  reports?: AcquisitionReportItem[];
}

export function AcquisitionTab({ profiles = [], reports: customReports }: AcquisitionTabProps) {
  const [attributionMode, setAttributionMode] = useState<'first_touch' | 'last_touch'>('first_touch');

  const reports = useMemo(() => {
    if (customReports && customReports.length > 0) return customReports;
    return computeAcquisitionReport(profiles, attributionMode);
  }, [profiles, customReports, attributionMode]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        <div>
          <h2 className="text-base font-semibold text-foreground">Acquisition Channels &amp; Attribution Intelligence</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Channel breakdown for organic, direct, referral, social, paid, email, and affiliate traffic.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Attribution Model:</span>
          <div className="flex rounded-lg border border-border p-0.5 bg-muted/40">
            <Button
              variant={attributionMode === 'first_touch' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-2.5 rounded-md"
              onClick={() => setAttributionMode('first_touch')}
            >
              First-Touch (Origin)
            </Button>
            <Button
              variant={attributionMode === 'last_touch' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs px-2.5 rounded-md"
              onClick={() => setAttributionMode('last_touch')}
            >
              Last-Touch (Pre-Conversion)
            </Button>
          </div>
        </div>
      </div>

      <Card className="border border-border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Channel Acquisition Performance Matrix</CardTitle>
          <CardDescription className="text-xs">
            Showing visitors, registrations, paid customers, conversion rates, generated revenue, and engagement depth.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full overflow-x-auto">
            <Table className="[&>div]:max-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Acquisition Channel</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Visitors</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Registered Users</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Paid Customers</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Reg Conv %</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Paid Conv %</TableHead>
                  <TableHead className="whitespace-nowrap text-right font-bold text-emerald-600">Revenue</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Avg Session</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Pages / Session</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((ch) => (
                  <TableRow key={ch.channel}>
                    <TableCell className="whitespace-nowrap font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        <span>{ch.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-mono font-medium">
                      {ch.visitors.toLocaleString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-mono text-muted-foreground">
                      {ch.registeredUsers.toLocaleString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-mono font-semibold text-foreground">
                      {ch.paidCustomers.toLocaleString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-mono text-blue-600 dark:text-blue-400">
                      {ch.registrationConversionRate}%
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-mono font-bold text-primary">
                      {ch.paidConversionRate}%
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ${ch.revenue.toLocaleString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-mono text-xs text-muted-foreground">
                      {ch.avgSessionDurationSeconds}s
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-mono text-xs">
                      {ch.pageViewsPerSession}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
