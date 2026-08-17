import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Save, ImageIcon } from 'lucide-react';
import { simulateDetection, saveReport, DetectionResult } from './detectionEngine';
import {
  UploadZone, ResultHeader, DetectionBreakdownCard, DetectedSignalsCard,
  ExplanationCard, C2PACard, ExportButtons, ConfidenceDisclaimer,
} from './DetectorShared';
import { toast } from 'sonner';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useUpgradeModal } from '@/hooks/useUpgradeModal';
import UpgradeModal from '@/components/common/UpgradeModal';

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp,.gif';
const IMAGE_ACCEPT_LABEL = 'JPG, PNG, WEBP, GIF';
const MAX_MB_FREE = 5;
const FEATURE_SLUG = 'ai_image_detector';

export default function AIImageDetector() {
  const { entitlement, loading: entitlementLoading } = useEntitlement(FEATURE_SLUG);
  const { open, featureName, trigger, remaining, limit, openUpgradeModal, closeUpgradeModal } = useUpgradeModal();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    if (entitlementLoading) {
      toast.info('Checking your plan, please wait...');
      return;
    }
    if (!entitlement?.allowed) {
      openUpgradeModal({ featureName: 'AI Image Detector', trigger: 'pro_feature' });
      return;
    }
    setScanning(true);
    try {
      const r = await simulateDetection(file, 'image');
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
    setPreview(null);
    setResult(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <UpgradeModal
        open={open}
        onOpenChange={closeUpgradeModal}
        featureName={featureName}
        trigger={trigger}
        remaining={remaining}
        limit={limit}
      />
      {/* Upload / preview area */}
      {!result && (
        <div className="flex flex-col gap-4">
          {!file ? (
            <UploadZone
              accept={IMAGE_ACCEPT}
              acceptLabel={IMAGE_ACCEPT_LABEL}
              maxMB={MAX_MB_FREE}
              onFile={handleFile}
              disabled={scanning}
            />
          ) : (
            <div className="border border-border rounded-xl overflow-hidden">
              {preview && (
                <div className="bg-muted/30 flex items-center justify-center p-4 min-h-48">
                  <img src={preview} alt="Uploaded preview" className="max-h-64 max-w-full rounded-lg object-contain" />
                </div>
              )}
              <div className="p-4 border-t border-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <ImageIcon className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-medium text-navy truncate">{file.name}</span>
                  <Badge className="bg-muted text-muted-foreground border-border text-xs shrink-0">
                    {(file.size / 1024).toFixed(0)} KB
                  </Badge>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-xs border-border shrink-0" onClick={handleReset}>
                  Change
                </Button>
              </div>
            </div>
          )}

          {file && !scanning && (
            <Button
              className="bg-primary text-primary-foreground h-10 font-medium gap-2"
              onClick={handleAnalyze}
            >
              <ImageIcon className="w-4 h-4" /> Analyze Image
            </Button>
          )}

          {scanning && (
            <div className="border border-border rounded-xl p-8 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium text-navy mb-1">Analyzing image…</p>
              <p className="text-xs text-muted-foreground">Running AI artifact detection, metadata analysis, and provenance check</p>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="flex flex-col gap-4">
          <ResultHeader result={result} />
          <DetectionBreakdownCard result={result} />
          <DetectedSignalsCard signals={result.detectedSignals} />
          <ExplanationCard explanation={result.explanation} recommendation={result.recommendation} />
          <C2PACard result={result} />
          <ConfidenceDisclaimer />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ExportButtons result={result} isPremium={false} />
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
