import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Trash2, Eye, Download, FileText, ImageIcon, Video, ScanFace, ClipboardList,
} from 'lucide-react';
import { loadReports, deleteReport, exportAsJSON, exportAsHTML, SavedReport } from './detectionEngine';
import { StatusBadge, RiskBadge, ConfidenceBadge } from './DetectorShared';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ResultHeader, DetectionBreakdownCard, DetectedSignalsCard, ExplanationCard, C2PACard, TimestampsCard, ConfidenceDisclaimer } from './DetectorShared';
import { toast } from 'sonner';

const MODE_ICONS: Record<string, typeof FileText> = {
  image: ImageIcon,
  video: Video,
  deepfake: ScanFace,
};

const MODE_LABELS: Record<string, string> = {
  image: 'Image',
  video: 'Video',
  deepfake: 'Deepfake',
};

export default function ReportHistory() {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [viewing, setViewing] = useState<SavedReport | null>(null);
  const [filterMode, setFilterMode] = useState<string>('all');

  useEffect(() => {
    setReports(loadReports());
  }, []);

  const handleDelete = (id: string) => {
    deleteReport(id);
    setReports(loadReports());
    toast.success('Report deleted');
  };

  const filtered = filterMode === 'all' ? reports : reports.filter(r => r.mode === filterMode);

  if (reports.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ClipboardList className="w-7 h-7 text-muted-foreground" />
        </div>
        <h3 className="font-bold text-navy text-base mb-2">No saved reports yet</h3>
        <p className="text-sm text-muted-foreground mb-5 text-pretty max-w-xs mx-auto">
          Analyze an image, video, or deepfake and save the report to view it here.
        </p>
        <p className="text-xs text-muted-foreground">Note: Reports are stored for this browser session only.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'image', 'video', 'deepfake'].map(m => (
          <Button
            key={m}
            size="sm"
            variant={filterMode === m ? 'default' : 'outline'}
            className={`h-7 text-xs border-border capitalize ${filterMode === m ? 'bg-primary text-primary-foreground' : ''}`}
            onClick={() => setFilterMode(m)}
          >
            {m === 'all' ? 'All Reports' : MODE_LABELS[m]}
          </Button>
        ))}
      </div>

      {/* Report list */}
      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No {filterMode} reports saved.</p>
        )}
        {filtered.map(r => {
          const ModeIcon = MODE_ICONS[r.mode] || FileText;
          return (
            <Card key={r.id} className="border-border shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <ModeIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy truncate">{r.fileName}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <Badge className="bg-muted text-muted-foreground border-border text-xs capitalize">{MODE_LABELS[r.mode] ?? r.mode}</Badge>
                      <StatusBadge status={r.status} />
                      <RiskBadge level={r.riskLevel} />
                      <ConfidenceBadge level={r.confidenceLevel} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(r.scanDate).toLocaleString()} · AI probability: <span className="font-semibold text-navy">{r.aiProbability}%</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0 border-border" onClick={() => setViewing(r)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0 border-border" onClick={() => exportAsJSON(r)}>
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 w-7 p-0 border-border text-muted-foreground hover:text-destructive" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* View dialog — always mounted, open controlled by state (required by Radix UI) */}
      <Dialog open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-navy text-balance">
              Detection Report{viewing ? ` — ${viewing.fileName}` : ''}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="flex flex-col gap-4 mt-2">
              <ResultHeader result={viewing} />
              {viewing.suspiciousTimestamps.length > 0 && <TimestampsCard result={viewing} />}
              <DetectionBreakdownCard result={viewing} />
              <DetectedSignalsCard signals={viewing.detectedSignals} />
              <ExplanationCard explanation={viewing.explanation} recommendation={viewing.recommendation} />
              <C2PACard result={viewing} />
              <ConfidenceDisclaimer />
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="outline" className="h-8 text-xs border-border gap-1.5" onClick={() => exportAsHTML(viewing)}>
                  Export HTML
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs border-border gap-1.5" onClick={() => exportAsJSON(viewing)}>
                  Export JSON
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
