import React, { useMemo, useState } from 'react';
import { computePageAnalytics } from '@/lib/customerIntelligence/analyticsEngine';
import { LeadEvent } from '@/types/cdp';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, ArrowRight, Clock, MousePointer, Compass, LogOut } from 'lucide-react';

interface PageAnalyticsTabProps {
  events?: LeadEvent[];
}

export function PageAnalyticsTab({ events = [] }: PageAnalyticsTabProps) {
  const { pages, paths } = useMemo(() => {
    return computePageAnalytics(events);
  }, [events]);

  const [subTab, setSubTab] = useState<'pages' | 'paths'>('pages');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Page, Navigation &amp; Path Analytics</h2>
          <p className="text-xs text-muted-foreground">
            Landing page performance, exit rates, scroll depth, and common user journey paths.
          </p>
        </div>

        <Tabs value={subTab} onValueChange={(v) => setSubTab(v as any)}>
          <TabsList className="h-9">
            <TabsTrigger value="pages" className="text-xs px-3">
              <Eye className="w-3.5 h-3.5 mr-1.5" /> Pages Telemetry
            </TabsTrigger>
            <TabsTrigger value="paths" className="text-xs px-3">
              <Compass className="w-3.5 h-3.5 mr-1.5" /> Navigation Journey Paths
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {subTab === 'pages' ? (
        <Card className="border border-border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Top Pages Performance &amp; Engagement</CardTitle>
            <CardDescription className="text-xs">
              Breakdown of views, unique visitors, average time on page, bounce rate, exit rate, and CTA conversions.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="w-full overflow-x-auto">
              <Table className="[&>div]:max-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Page Path &amp; Title</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Page Views</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Unique Visitors</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Avg Time</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Bounce Rate</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Exit Rate</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Scroll Depth</TableHead>
                    <TableHead className="whitespace-nowrap text-right">CTA Clicks</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Conv Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((p) => (
                    <TableRow key={p.path}>
                      <TableCell className="whitespace-nowrap">
                        <div className="font-semibold text-foreground">{p.path}</div>
                        <div className="text-xs text-muted-foreground">{p.title}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono font-medium">
                        {p.pageViews.toLocaleString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono text-muted-foreground">
                        {p.uniqueVisitors.toLocaleString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono">
                        {p.avgTimeSeconds}s
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono">
                        {p.bounceRatePct}%
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono text-muted-foreground">
                        {p.exitRatePct}%
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono">
                        <Badge variant="outline" className="text-xs">{p.scrollDepthAvgPct}%</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono">
                        {p.ctaClicks.toLocaleString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {p.conversionRatePct}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Sequential Journey Transitions</CardTitle>
            <CardDescription className="text-xs">
              Frequent multi-step page journeys and progression toward monetization and signup.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="w-full overflow-x-auto">
              <Table className="[&>div]:max-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Origin Page / Source</TableHead>
                    <TableHead className="w-8"></TableHead>
                    <TableHead className="whitespace-nowrap">Destination Page / Action</TableHead>
                    <TableHead className="whitespace-nowrap text-right">Transition Volume</TableHead>
                    <TableHead className="whitespace-nowrap text-right font-bold text-primary">Conversion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paths.map((pth, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="whitespace-nowrap font-medium text-foreground">
                        {pth.fromPath}
                      </TableCell>
                      <TableCell className="text-center">
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-medium text-foreground">
                        <Badge variant="outline" className="font-mono text-xs">
                          {pth.toPath}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono font-semibold">
                        {pth.frequency.toLocaleString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {pth.conversionRatePct}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
