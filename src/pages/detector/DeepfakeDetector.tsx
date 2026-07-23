import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Save, ScanFace } from 'lucide-react';
import { simulateDetection, saveReport, DetectionResult } from './detectionEngine';
import {
  UploadZone, ResultHeader, DetectionBreakdownCard, DetectedSignalsCard,
  ExplanationCard, C2PACard, TimestampsCard, ExportButtons,
  ConfidenceDisclaimer,
} from './DetectorShared';
import { toast } from 'sonner';

const ACCEPT = '.jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.avi,.webm';
const ACCEPT_LABEL = 'JPG, PNG, WEBP, GIF, MP4, MOV, AVI, WEBM';
const MAX_MB = 100;
const IS_PREMIUM = false; // flip to true when auth + billing is integrated

export default function DeepfakeDetector() {
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
  };

  const isVideo = file ? file.type.startsWith('video/') : false;

  const handleAnalyze = async () => {
    if (!file) return;
    setScanning(true);
    try {
      const r = await simulateDetection(file, 'deepfake');
      setResult(r);
      saveReport(r); // auto-save every completed result
    } finally {
      setScanning(false);
    }
  };

  const handleSave = () => {
    if (!result) return;
    saveReport(result);
    toast.success('Report re-saved to Report History');
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {!result && (
        <div className="flex flex-col gap-4">
          {!file ? (
            <UploadZone
              accept={ACCEPT}
              acceptLabel={ACCEPT_LABEL}
              maxMB={MAX_MB}
              onFile={handleFile}
              disabled={scanning}
            />
          ) : (
            <div className="border border-border rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <ScanFace className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-navy truncate">{file.name}</span>
                <Badge className="bg-muted text-muted-foreground border-border text-xs shrink-0">
                  {(file.size / 1024).toFixed(0)} KB
                </Badge>
              </div>
              <Button size="sm" variant="outline" className="h-8 text-xs border-border shrink-0" onClick={handleReset}>
                Change
              </Button>
            </div>
          )}

          {file && !scanning && (
            <Button className="bg-primary text-primary-foreground h-10 font-medium gap-2" onClick={handleAnalyze}>
              <ScanFace className="w-4 h-4" /> Analyze for Deepfake
            </Button>
          )}

          {scanning && (
            <div className="border border-border rounded-xl p-8 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-navy mb-1">Running deepfake analysis…</p>
              <p className="text-xs text-muted-foreground">
                {isVideo
                  ? 'Analyzing facial geometry, lip-sync, blinking patterns, audio authenticity, and provenance'
                  : 'Analyzing facial geometry, skin texture, eye reflections, and boundary artifacts'}
              </p>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-4">
          <ResultHeader result={result} />
          {result.suspiciousTimestamps.length > 0 && <TimestampsCard result={result} />}
          <DetectionBreakdownCard result={result} />
          <DetectedSignalsCard signals={result.detectedSignals} />
          <ExplanationCard explanation={result.explanation} recommendation={result.recommendation} />
          <C2PACard result={result} />
          <ConfidenceDisclaimer />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ExportButtons result={result} isPremium={true} />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs border-border gap-1.5" onClick={handleSave}>
                <Save className="w-3 h-3" /> Saved ✓
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs border-border gap-1.5" onClick={handleReset}>
                <RefreshCw className="w-3 h-3" /> New Analysis
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
