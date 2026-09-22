import React from 'react';
import type { ChronologyEntry } from '@/lib/plagiarism/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, ExternalLink, Calendar, CheckCircle2 } from 'lucide-react';

interface Props {
  timeline: ChronologyEntry[];
}

export function ChronologicalTimeline({ timeline }: Props) {
  if (!timeline || timeline.length === 0) {
    return (
      <Card className="border-border shadow-sm">
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          No external source publication records discovered for chronological sequencing.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border">
        <strong>Chronology Principle:</strong> The timeline identifies the earliest discovered publication in external registries (Crossref, OpenAlex, archives) without asserting definitive original authorship.
      </div>

      <div className="relative pl-6 border-l-2 border-primary/30 space-y-4 my-2">
        {timeline.map((entry, idx) => (
          <div key={entry.sourceId || idx} className="relative group">
            {/* Timeline node */}
            <div
              className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-background flex items-center justify-center ${
                entry.isEarliestDiscovered
                  ? 'border-success bg-success/20 ring-4 ring-success/10'
                  : 'border-primary bg-primary/20'
              }`}
            >
              {entry.isEarliestDiscovered && <div className="w-1.5 h-1.5 bg-success rounded-full" />}
            </div>

            {/* Content card */}
            <div className="p-3 bg-card border border-border rounded-lg shadow-sm flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    {entry.formattedDate}
                  </span>
                  {entry.isEarliestDiscovered && (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/30 font-semibold text-[10px]">
                      Earliest Discovered Source
                    </Badge>
                  )}
                </div>
                <Badge variant="secondary" className="text-[10px]">{entry.provider}</Badge>
              </div>

              <div className="font-medium text-foreground text-sm">{entry.title}</div>
              <div className="text-muted-foreground">Publisher: {entry.publisher}</div>
              {entry.doi && <div className="text-muted-foreground">DOI: {entry.doi}</div>}

              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1 font-medium truncate mt-1"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                {entry.url}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
