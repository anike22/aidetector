import React, { useMemo, useState } from 'react';
import { computeToolIntelligence } from '@/lib/customerIntelligence/analyticsEngine';
import { ToolIntelligenceItem } from '@/types/customerIntelligence';
import { CustomerProfile, LeadEvent } from '@/types/cdp';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Trophy, Zap, TrendingUp, CheckCircle, AlertCircle, ShieldCheck, FileSearch, Search, Image, Video, FileText } from 'lucide-react';

interface ToolIntelligenceTabProps {
  tools?: ToolIntelligenceItem[];
  profiles?: CustomerProfile[];
  events?: LeadEvent[];
}

export function ToolIntelligenceTab({ tools: customTools, profiles, events }: ToolIntelligenceTabProps) {
  const tools = useMemo(() => {
    if (customTools && customTools.length > 0) return customTools;
    return computeToolIntelligence(profiles || [], events || []);
  }, [customTools, profiles, events]);

  const [sortField, setSortField] = useState<keyof ToolIntelligenceItem>('totalUses');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedTools = useMemo(() => {
    return [...tools].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'desc' ? valB - valA : valA - valB;
      }
      return 0;
    });
  }, [tools, sortField, sortOrder]);

  const topSubscriptionDriver = useMemo(() => {
    return [...tools].sort((a, b) => b.paidConversionRate - a.paidConversionRate)[0] || tools[0];
  }, [tools]);

  const mostUtilizedTool = useMemo(() => {
    return [...tools].sort((a, b) => b.totalUses - a.totalUses)[0] || tools[0];
  }, [tools]);

  const highestSignupVelocity = useMemo(() => {
    return [...tools].sort((a, b) => b.registrationConversionRate - a.registrationConversionRate)[0] || tools[0];
  }, [tools]);

  const handleSort = (field: keyof ToolIntelligenceItem) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getToolIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('text') || n.includes('shield')) return <ShieldCheck className="w-4 h-4 text-primary" />;
    if (n.includes('plagiarism')) return <FileSearch className="w-4 h-4 text-blue-500" />;
    if (n.includes('humanizer')) return <Sparkles className="w-4 h-4 text-amber-500" />;
    if (n.includes('seo')) return <Search className="w-4 h-4 text-emerald-500" />;
    if (n.includes('image')) return <Image className="w-4 h-4 text-purple-500" />;
    if (n.includes('video')) return <Video className="w-4 h-4 text-rose-500" />;
    return <FileText className="w-4 h-4 text-cyan-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Top 3 Product Highlights computed dynamically */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-border shadow-xs bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Top Subscription Driver</span>
              <Trophy className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-base font-bold">{topSubscriptionDriver?.name || 'SEO Assistant'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <div className="text-2xl font-bold text-foreground">
              {topSubscriptionDriver?.paidConversionRate || 0}% Paid Conversion
            </div>
            <p className="text-muted-foreground">
              Highest plan upgrade velocity among registered content publishers.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs bg-gradient-to-br from-card to-emerald-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Most Utilized Tool</span>
              <Zap className="w-4 h-4 text-emerald-600" />
            </div>
            <CardTitle className="text-base font-bold">{mostUtilizedTool?.name || 'AI Text Detector'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <div className="text-2xl font-bold text-foreground">
              {(mostUtilizedTool?.totalUses || 0).toLocaleString()} Scans
            </div>
            <p className="text-muted-foreground">
              Primary acquisition magnet generating high initial traffic.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs bg-gradient-to-br from-card to-purple-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Highest Signup Velocity</span>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <CardTitle className="text-base font-bold">{highestSignupVelocity?.name || 'Humanizer'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <div className="text-2xl font-bold text-foreground">
              {highestSignupVelocity?.registrationConversionRate || 0}% Registration Rate
            </div>
            <p className="text-muted-foreground">
              Strongest trigger for guest users to create a verified account.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tool Intelligence Table */}
      <Card className="border border-border shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-semibold">Product &amp; Tool Usage Telemetry</CardTitle>
              <CardDescription className="text-xs">
                Comprehensive breakdown of tool activations, success rates, user tiers, and commercial conversion rates.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full overflow-x-auto">
            <Table className="[&>div]:max-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap cursor-pointer" onClick={() => handleSort('name')}>
                    Product / Tool
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-right cursor-pointer" onClick={() => handleSort('uniqueUsers')}>
                    Unique Users
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-right cursor-pointer" onClick={() => handleSort('totalUses')}>
                    Total Operations
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-right">Success Rate</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Anonymous</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Registered</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Paid Users</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Avg Uses / User</TableHead>
                  <TableHead className="whitespace-nowrap text-right cursor-pointer" onClick={() => handleSort('registrationConversionRate')}>
                    Reg Conv %
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-right cursor-pointer font-bold text-primary" onClick={() => handleSort('paidConversionRate')}>
                    Paid Conv %
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTools.map((t) => {
                  const successRate = t.totalUses > 0 ? ((t.successfulCompletions / t.totalUses) * 100).toFixed(1) : '100.0';
                  return (
                    <TableRow key={t.toolId}>
                      <TableCell className="whitespace-nowrap font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          {getToolIcon(t.name)}
                          <span>{t.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono font-medium">
                        {t.uniqueUsers.toLocaleString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono font-bold text-foreground">
                        {t.totalUses.toLocaleString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono">
                        <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 font-mono text-xs">
                          {successRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono text-muted-foreground">
                        {t.anonymousUsers.toLocaleString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono text-muted-foreground">
                        {t.registeredUsers.toLocaleString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono font-semibold text-foreground">
                        {t.paidUsers.toLocaleString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono">
                        {t.avgUsagePerUser}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {t.registrationConversionRate}%
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right font-mono font-bold text-primary">
                        {t.paidConversionRate}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
