import React from 'react';
import type { TableSimilarityMatch } from '@/lib/plagiarism/tableDatasetEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, ExternalLink, Database, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Props {
  matches: TableSimilarityMatch[];
}

export function TableDataSimilarityView({ matches }: Props) {
  if (!matches || matches.length === 0) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          <Table className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
          No suspicious structured table copying or tabular dataset plagiarism detected.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border">
        <strong>Tabular Invariance Engine:</strong> Detects numerical matrices and structured datasets copied with renamed headers, reordered columns, or altered unit formatting. Public reference datasets (e.g. Census, World Bank) are excluded from proprietary penalties.
      </div>

      <div className="grid grid-cols-1 gap-3">
        {matches.map((m) => (
          <Card key={m.id} className="border-border shadow-sm text-xs">
            <CardHeader className="py-2.5 px-4 border-b border-border flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-bold text-foreground truncate max-w-[280px]">
                  {m.matchedSourceTitle}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {m.isPublicDataset ? (
                  <Badge variant="outline" className="text-success border-success/30 bg-success/5">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Public Reference Data
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                    <AlertTriangle className="w-3 h-3 mr-1" /> Proprietary Data Match
                  </Badge>
                )}
                <Badge variant="secondary">{m.overallTableConfidence}% Confidence</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3.5 flex flex-col gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-muted-foreground">
                <div className="bg-muted/30 p-2 rounded">
                  <span className="font-semibold text-foreground block mb-1">Submitted Table Headers:</span>
                  <div className="flex flex-wrap gap-1">
                    {m.submittedHeaders.map((h, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{h}</Badge>
                    ))}
                  </div>
                </div>
                <div className="bg-muted/30 p-2 rounded">
                  <span className="font-semibold text-foreground block mb-1">Matched Source Headers:</span>
                  <div className="flex flex-wrap gap-1">
                    {m.matchedHeaders.map((h, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{h}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {m.detectedTransformations.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-semibold text-muted-foreground">Transformations:</span>
                  <div className="flex flex-wrap gap-1">
                    {m.detectedTransformations.map((t, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-muted-foreground mt-1">{m.explanation}</p>

              <div className="pt-2 border-t border-border flex justify-end">
                <a
                  href={m.matchedSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 font-medium"
                >
                  <ExternalLink className="w-3 h-3" /> View Source Dataset
                </a>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
