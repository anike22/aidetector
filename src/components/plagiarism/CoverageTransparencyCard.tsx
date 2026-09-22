import React from 'react';
import type { SearchCoverageReport } from '@/lib/plagiarism/coverageMatrix';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertTriangle, CheckCircle2, WifiOff, Globe, BookOpen } from 'lucide-react';

interface Props {
  report: SearchCoverageReport;
}

export function CoverageTransparencyCard({ report }: Props) {
  return (
    <Card className="border-border shadow-sm text-xs">
      <CardHeader className="py-2.5 px-4 border-b border-border flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-bold text-foreground">
            Search Coverage & Provider Audit Matrix
          </CardTitle>
        </div>
        <Badge variant={report.allPrimaryRegistriesOperational ? 'secondary' : 'outline'} className="text-xs">
          {report.overallCoveragePercentage}% Coverage Operational
        </Badge>
      </CardHeader>

      <CardContent className="p-3.5 flex flex-col gap-2.5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {report.systems.map((sys) => {
            const isChecked = sys.status === 'checked';
            const isUnavailable = sys.status === 'unavailable';

            return (
              <div
                key={sys.id}
                className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                  isUnavailable
                    ? 'border-destructive/30 bg-destructive/5'
                    : isChecked
                    ? 'border-border bg-muted/20'
                    : 'border-border/40 bg-muted/10 opacity-60'
                }`}
              >
                {isChecked ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                ) : isUnavailable ? (
                  <WifiOff className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                )}

                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-foreground truncate">{sys.name}</span>
                    <Badge
                      variant={isUnavailable ? 'destructive' : isChecked ? 'outline' : 'secondary'}
                      className="text-[9px] px-1.5 py-0 shrink-0"
                    >
                      {sys.statusLabel}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground text-[11px]">{sys.coverageDetails}</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
