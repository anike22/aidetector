import React from 'react';
import type { SourceCluster, SourceCredibilityLevel } from '@/lib/plagiarism/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, ExternalLink, ShieldCheck, Copy, Globe } from 'lucide-react';

interface Props {
  clusters: SourceCluster[];
  credibilityMap: Record<string, SourceCredibilityLevel>;
}

export function SourceClusteringView({ clusters, credibilityMap }: Props) {
  if (!clusters || clusters.length === 0) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          No external source clusters or mirror domains detected.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border">
        <strong>Syndication Filtering:</strong> Duplicate search results and syndicated mirror sites are grouped into single clusters to prevent artificial score inflation.
      </div>

      <div className="grid grid-cols-1 gap-3">
        {clusters.map((cluster) => {
          const cred = credibilityMap[cluster.primarySource.url] || 'General Web';

          return (
            <Card key={cluster.clusterId} className="border-border shadow-sm">
              <CardHeader className="py-2.5 px-4 border-b border-border flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <CardTitle className="text-sm font-bold text-foreground truncate max-w-[320px]">
                    {cluster.primarySource.title}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {cred}
                  </Badge>
                  {cluster.totalMirrorsCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {cluster.totalMirrorsCount} Syndicated Mirrors
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-3.5 flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Publisher: {cluster.primarySource.publisher || 'Web'}</span>
                  <span className="text-muted-foreground">Provider: {cluster.primarySource.provider}</span>
                </div>

                <a
                  href={cluster.primarySource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 font-medium truncate"
                >
                  <ExternalLink className="w-3 h-3 shrink-0" />
                  {cluster.primarySource.url}
                </a>

                {cluster.mirrors.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border flex flex-col gap-1.5">
                    <span className="font-semibold text-muted-foreground">Identified Syndicated / Mirror Copies:</span>
                    <div className="flex flex-col gap-1 pl-2">
                      {cluster.mirrors.map((m, mIdx) => (
                        <div key={mIdx} className="flex items-center justify-between text-muted-foreground">
                          <span className="truncate max-w-[280px]">{m.title}</span>
                          <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            View Mirror
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
