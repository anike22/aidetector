import React, { useMemo, useState } from 'react';
import { computeGeographicIntelligence } from '@/lib/customerIntelligence/geographicIntelligence';
import { GeographicIntelligenceItem } from '@/types/customerIntelligence';
import { CustomerProfile } from '@/types/cdp';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Globe, MapPin, AlertCircle, TrendingUp, Users, DollarSign } from 'lucide-react';

interface GeographicIntelligenceTabProps {
  profiles?: CustomerProfile[];
}

export function GeographicIntelligenceTab({ profiles = [] }: GeographicIntelligenceTabProps) {
  const { countries, regions, cities } = useMemo(() => {
    return computeGeographicIntelligence(profiles);
  }, [profiles]);

  const [geoTab, setGeoTab] = useState<'country' | 'region' | 'city'>('country');

  const items: GeographicIntelligenceItem[] = geoTab === 'country' ? countries : geoTab === 'region' ? regions : cities;

  return (
    <div className="space-y-6">
      {/* Header & Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            Geographic Telemetry &amp; Regional Yield
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Geographic distribution of global traffic, tool consumption, registrations, and subscription revenue.
          </p>
        </div>

        <Tabs value={geoTab} onValueChange={(v) => setGeoTab(v as any)}>
          <TabsList className="h-9">
            <TabsTrigger value="country" className="text-xs px-3">Top Countries ({countries.length})</TabsTrigger>
            <TabsTrigger value="region" className="text-xs px-3">Top Regions ({regions.length})</TabsTrigger>
            <TabsTrigger value="city" className="text-xs px-3">Top Cities ({cities.length})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Privacy & Location Accuracy Note */}
      <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-400">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold">Privacy &amp; Precision Notice:</strong> Geolocation coordinates are derived at country, state/region, and metro-city level for macro traffic analytics and fraud protection. IP data is never treated as exact physical location or used for invasive surveillance.
        </div>
      </div>

      {/* Table */}
      <Card className="border border-border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold capitalize">
            Top {geoTab === 'country' ? 'Countries' : geoTab === 'region' ? 'Regions & States' : 'Cities & Metropolitan Areas'} Performance
          </CardTitle>
          <CardDescription className="text-xs">
            Volume, conversion velocity, tool utilization, and generated subscription revenue.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full overflow-x-auto">
            <Table className="[&>div]:max-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Location Name</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Visitors</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Registrations</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Paid Customers</TableHead>
                  <TableHead className="whitespace-nowrap text-right font-bold text-primary">Paid Conv %</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Tool Uses</TableHead>
                  <TableHead className="whitespace-nowrap text-right font-bold text-emerald-600">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it.name}>
                    <TableCell className="whitespace-nowrap font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{it.name}</span>
                        {it.countryCode && (
                          <Badge variant="outline" className="text-[10px] font-mono">{it.countryCode}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-mono font-medium">
                      {it.visitors.toLocaleString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-mono text-muted-foreground">
                      {it.registrations.toLocaleString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-mono font-semibold text-foreground">
                      {it.paidUsers.toLocaleString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-mono font-bold text-primary">
                      {it.conversionRatePct}%
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-mono">
                      {it.totalToolUses.toLocaleString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ${it.revenue.toLocaleString()}
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
