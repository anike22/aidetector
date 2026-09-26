import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileJson, ShieldCheck, AlertTriangle, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import type { PlagiarismForensicIntelligence } from '@/lib/plagiarism/types';
import { downloadForensicAuditPackage } from '@/lib/plagiarism/forensicReportGenerator';

interface Props {
  intel: PlagiarismForensicIntelligence;
}

export function ForensicSummaryHeader({ intel }: Props) {
  const riskColor =
    intel.plagiarismRiskLevel === 'High' || intel.plagiarismRiskLevel === 'Critical'
      ? 'bg-destructive/10 text-destructive border-destructive/20'
      : intel.plagiarismRiskLevel === 'Medium'
      ? 'bg-warning/10 text-warning border-warning/20'
      : intel.plagiarismRiskLevel === 'Limited Coverage'
      ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      : 'bg-success/10 text-success border-success/20';

  const riskIcon =
    intel.plagiarismRiskLevel === 'High' || intel.plagiarismRiskLevel === 'Critical' ? (
      <ShieldAlert className="w-4 h-4 mr-1 text-destructive" />
    ) : intel.plagiarismRiskLevel === 'Medium' || intel.plagiarismRiskLevel === 'Limited Coverage' ? (
      <AlertTriangle className="w-4 h-4 mr-1 text-warning" />
    ) : (
      <ShieldCheck className="w-4 h-4 mr-1 text-success" />
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1: Raw Similarity */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
              Total Similarity
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-foreground">
                {intel.rawSimilarityPercentage}%
              </span>
              <span className="text-xs text-muted-foreground">overall matched text</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Plagiarism Risk */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
              Plagiarism Risk Level
            </span>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={`px-2.5 py-1 text-sm font-semibold flex items-center ${riskColor}`}>
                {riskIcon}
                {intel.plagiarismRiskLevel} Risk
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Uncited Direct Match */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
              Uncited Direct Matches
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-destructive">
                {intel.uncitedDirectMatchPercentage}%
              </span>
              <span className="text-xs text-muted-foreground">needs attribution</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Properly Cited */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
              Properly Cited & Attributed
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-success">
                {intel.properlyCitedPercentage}%
              </span>
              <span className="text-xs text-muted-foreground">verified attribution</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Explanatory Banner */}
      <div className="bg-primary/5 border border-primary/15 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
        <div className="flex items-start sm:items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5 sm:mt-0" />
          <span className="text-foreground">
            <strong>Forensic Assessment:</strong> {intel.riskExplanation}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs font-medium"
            onClick={() => downloadForensicAuditPackage(intel, 'json')}
          >
            <FileJson className="w-3.5 h-3.5 mr-1" />
            Audit JSON
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs font-medium bg-primary text-primary-foreground"
            onClick={() => downloadForensicAuditPackage(intel, 'txt')}
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Audit Package (.TXT)
          </Button>
        </div>
      </div>
    </div>
  );
}
