import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, RefreshCw, Save, ImageIcon, ShieldCheck, ShieldAlert,
  AlertTriangle, CheckCircle2, FileSearch, Layers, GitCompare,
  FileArchive, Download, Flag, ExternalLink, Info, Lock, Zap
} from 'lucide-react';
import { executeRealImageForensics } from '@/lib/imageDetection/imageForensicEngine';
import { downloadJsonReport, openPrintableEvidenceReport } from '@/lib/imageDetection/evidenceReportGenerator';
import type { ImageAnalysisResult } from '@/lib/imageDetection/types';
import ImageRegionInspectionOverlay from '@/components/detector/ImageRegionInspectionOverlay';
import ImageComparisonViewer from '@/components/detector/ImageComparisonViewer';
import ReportIncorrectResultModal from '@/components/detector/ReportIncorrectResultModal';
import BatchImageDetector from '@/components/detector/BatchImageDetector';
import ImageAIProbabilityCupCard from '@/components/detector/ImageAIProbabilityCupCard';
import { toast } from 'sonner';
import { useEntitlement } from '@/hooks/useEntitlement';
import { useUpgradeModal } from '@/hooks/useUpgradeModal';
import UpgradeModal from '@/components/common/UpgradeModal';
import { LiveUsagePanel } from '@/components/common/LiveUsagePanel';
import { reserveImageScan, finalizeImageScan } from '@/lib/entitlementsApi';

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp,.tiff,.avif,.heic';
const IMAGE_ACCEPT_LABEL = 'JPEG, PNG, WEBP, TIFF, AVIF, HEIC';
const MAX_MB = 25;
const FEATURE_SLUG = 'ai_image_detector';

export default function AIImageDetector() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { entitlement, summary, loading: entitlementLoading } = useEntitlement(FEATURE_SLUG);
  const { open, featureName, trigger, remaining, limit, openUpgradeModal, closeUpgradeModal } = useUpgradeModal();

  const [activeTab, setActiveTab] = useState<'single' | 'compare' | 'batch'>('single');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const [result, setResult] = useState<ImageAnalysisResult | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      if (f.size > MAX_MB * 1024 * 1024) {
        toast.error(`File exceeds maximum size of ${MAX_MB}MB.`);
        return;
      }
      setFile(f);
      setResult(null);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      if (f.size > MAX_MB * 1024 * 1024) {
        toast.error(`File exceeds maximum size of ${MAX_MB}MB.`);
        return;
      }
      setFile(f);
      setResult(null);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    // Step 1: Server-side Entitlement Check & Reservation
    setScanning(true);
    setScanStep('Verifying account entitlements & credit reservation...');
    let reservationId: string | null = null;

    try {
      const reservation = await reserveImageScan(FEATURE_SLUG, 1);
      if (!reservation.allowed) {
        setScanning(false);
        if (!user) {
          toast.error('You’ve used your free guest check. Create an account to get 4 additional free checks.');
          navigate('/signup?returnTo=' + encodeURIComponent('/detector?tab=image'));
        } else {
          toast.error('You’ve used all your free checks. Choose a plan to continue.');
          navigate('/pricing');
        }
        return;
      }
      reservationId = reservation.reservationId || null;

      // Step 2: Binary metadata & C2PA parsing
      setScanStep('Parsing binary JUMBF boxes, C2PA claims, and EXIF headers...');
      await new Promise((r) => setTimeout(r, 200));

      // Step 3: Error Level Analysis & High Frequency noise computation
      setScanStep('Running Error Level Analysis (ELA) and Laplacian residual filter...');
      const forensicResult = await executeRealImageForensics(file);

      // Step 4: Calibrated synthesis and finalizing
      setScanStep('Synthesizing multi-modal forensic evidence and generating certificates...');
      setResult(forensicResult);

      // Finalize credit reservation
      await finalizeImageScan(reservationId, 'committed', {
        sha256: forensicResult.sha256,
        verdict: forensicResult.aiGeneration.verdict,
        fileName: file.name,
      });

      toast.success('Forensic image analysis complete.');
    } catch (err: any) {
      console.error('Image analysis error:', err);
      if (reservationId) {
        await finalizeImageScan(reservationId, 'released', { error: err.message });
      }
      toast.error(err.message || 'Image analysis failed. Please try a different image format.');
    } finally {
      setScanning(false);
      setScanStep('');
    }
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

      {/* Live Usage Banner */}
      <LiveUsagePanel featureSlug={FEATURE_SLUG} operationCost={1} />

      {/* Mode Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              Forensic AI Image Detector & Provenance Suite
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Evidence-based image analysis with C2PA Content Credentials validation, Error Level Analysis (ELA), and generative artifact detection.
            </p>
          </div>

          <TabsList className="bg-muted/80 self-start md:self-auto">
            <TabsTrigger value="single" className="text-xs gap-1.5">
              <FileSearch className="w-3.5 h-3.5" /> Single Image
            </TabsTrigger>
            <TabsTrigger value="compare" className="text-xs gap-1.5">
              <GitCompare className="w-3.5 h-3.5" /> Compare Edit
            </TabsTrigger>
            <TabsTrigger value="batch" className="text-xs gap-1.5">
              <FileArchive className="w-3.5 h-3.5" /> Batch Scan
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: Single Image Forensic Pipeline */}
        <TabsContent value="single" className="mt-6 flex flex-col gap-6">
          {!result ? (
            <div className="flex flex-col gap-4">
              {!file ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-border rounded-xl p-10 bg-card/60 hover:bg-muted/20 transition-colors flex flex-col items-center justify-center text-center cursor-pointer min-h-64"
                >
                  <label className="cursor-pointer flex flex-col items-center gap-3 w-full">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-base font-semibold text-foreground">
                        Drop your image here or click to browse
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supports {IMAGE_ACCEPT_LABEL} up to {MAX_MB}MB
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/60 px-3 py-1 rounded-full mt-2">
                      <Lock className="w-3 h-3 text-success" />
                      Zero-retention privacy: Original bytes analyzed in-memory with strict confidentiality
                    </div>
                    <input
                      type="file"
                      accept={IMAGE_ACCEPT}
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={scanning}
                    />
                  </label>
                </div>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                  {preview && (
                    <div className="bg-slate-950 flex items-center justify-center p-4 min-h-64 max-h-96 overflow-hidden">
                      <img
                        src={preview}
                        alt="Uploaded preview"
                        className="max-h-80 max-w-full rounded-lg object-contain"
                      />
                    </div>
                  )}
                  <div className="p-4 border-t border-border flex items-center justify-between gap-4 bg-card">
                    <div className="flex items-center gap-2 min-w-0">
                      <ImageIcon className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-semibold text-foreground truncate">{file.name}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {(file.size / 1024).toFixed(0)} KB
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs shrink-0"
                      onClick={handleReset}
                      disabled={scanning}
                    >
                      Change File
                    </Button>
                  </div>
                </div>
              )}

              {file && !scanning && (
                <Button
                  className="bg-primary text-primary-foreground h-11 font-semibold gap-2 shadow-sm text-sm"
                  onClick={handleAnalyze}
                >
                  <Zap className="w-4 h-4" /> Run Comprehensive Forensic Analysis
                </Button>
              )}

              {scanning && (
                <Card className="border-border bg-card p-8 text-center flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <div className="font-semibold text-sm text-foreground">Forensic Pipeline Active</div>
                  <p className="text-xs text-muted-foreground animate-pulse max-w-md">
                    {scanStep || 'Analyzing visual residuals, C2PA manifests, and error levels...'}
                  </p>
                </Card>
              )}
            </div>
          ) : (
            /* Results View: 4 Independent Finding Cards */
            <div className="flex flex-col gap-6">
              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-card border border-border rounded-xl shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={result.previewUrl}
                    alt="Target"
                    className="w-10 h-10 rounded object-cover border border-border shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">{result.fileName}</div>
                    <div className="text-[11px] text-muted-foreground font-mono truncate">
                      SHA256: {result.sha256.substring(0, 16)}...
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => openPrintableEvidenceReport(result)}
                  >
                    <Download className="w-3.5 h-3.5" /> PDF Certificate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => downloadJsonReport(result)}
                  >
                    <Download className="w-3.5 h-3.5" /> JSON Data
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-destructive"
                    onClick={() => setFeedbackOpen(true)}
                  >
                    <Flag className="w-3.5 h-3.5" /> Report Issue
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 text-xs gap-1.5"
                    onClick={handleReset}
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Scan Another
                  </Button>
                </div>
              </div>

              {/* Prominent AI Probability Water Cup Summary Card */}
              <ImageAIProbabilityCupCard
                score={result.aiGeneration?.score}
                isLoading={scanning}
                label="AI Probability"
                supportingText="Estimated likelihood that this image is AI-generated."
              />

              {/* 4 Independent Finding Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Evidence of AI Generation Card */}
                <Card className="border-border bg-card shadow-sm flex flex-col justify-between">
                  <CardHeader className="py-3 px-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-primary" />
                      1. Evidence of AI Generation
                    </CardTitle>
                    <Badge
                      variant={
                        result.aiGeneration.verdict === 'Likely AI-generated'
                          ? 'destructive'
                          : result.aiGeneration.verdict === 'No strong AI-generation evidence'
                          ? 'default'
                          : 'secondary'
                      }
                      className="text-xs font-semibold"
                    >
                      {result.aiGeneration.verdict}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                      <div>
                        <div className="text-xs text-muted-foreground">Calibrated AI Indicator</div>
                        <div className="text-2xl font-bold text-foreground">
                          {result.aiGeneration.score}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Confidence Level</div>
                        <div className="text-sm font-semibold text-foreground">
                          {result.aiGeneration.confidenceLevel} ({result.aiGeneration.confidenceScore}%)
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 text-xs">
                      <span className="font-semibold text-foreground">Forensic Findings:</span>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {result.aiGeneration.reasoning.map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>

                    {result.aiGeneration.detectedGenerators.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs">
                        <span className="font-semibold text-red-600 block mb-1">
                          Identified Model Signatures:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {result.aiGeneration.detectedGenerators.map((gen, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] bg-card">
                              {gen}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 2. Evidence of Editing / Manipulation Card */}
                <Card className="border-border bg-card shadow-sm flex flex-col justify-between">
                  <CardHeader className="py-3 px-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      2. Evidence of Editing & Manipulation
                    </CardTitle>
                    <Badge
                      variant={
                        result.manipulation.verdict === 'AI editing indicated'
                          ? 'destructive'
                          : result.manipulation.verdict === 'No significant manipulation detected'
                          ? 'default'
                          : 'secondary'
                      }
                      className="text-xs font-semibold"
                    >
                      {result.manipulation.verdict}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                        <div className="text-muted-foreground">Error Level (ELA) Delta</div>
                        <div className="text-lg font-bold text-foreground">
                          {result.manipulation.elaDeltaScore} / 100
                        </div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/30 border border-border">
                        <div className="text-muted-foreground">Anomaly Clusters</div>
                        <div className="text-lg font-bold text-foreground">
                          {result.manipulation.regionsDetected.length} Localized
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 text-xs">
                      <span className="font-semibold text-foreground">Manipulation Analysis:</span>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {result.manipulation.reasoning.map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Recorded Origin & Provenance (C2PA & EXIF) Card */}
                <Card className="border-border bg-card shadow-sm flex flex-col justify-between">
                  <CardHeader className="py-3 px-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      3. Recorded Origin & Provenance
                    </CardTitle>
                    <Badge
                      variant={
                        result.provenance.c2paStatus === 'Valid trusted credentials'
                          ? 'default'
                          : 'secondary'
                      }
                      className="text-xs"
                    >
                      {result.provenance.c2paStatus}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 flex flex-col gap-3 text-xs">
                    <div className="space-y-2 divide-y divide-border">
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground">C2PA Manifest:</span>
                        <span className="font-medium text-foreground">
                          {result.provenance.manifestPresent ? 'Cryptographically Present' : 'Not detected in byte stream'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground">Cert Authority / Signer:</span>
                        <span className="font-medium text-foreground">
                          {result.provenance.trustedIssuer || 'None'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground">Hardware EXIF State:</span>
                        <Badge variant="outline" className="text-[10px]">
                          {result.provenance.exifIntegrity}
                        </Badge>
                      </div>
                      {result.provenance.cameraExif?.make && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-muted-foreground">Camera Claim (Unsigned):</span>
                          <span className="font-medium text-foreground">
                            {result.provenance.cameraExif.make} {result.provenance.cameraExif.model || ''}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-2 rounded bg-muted/40 text-[11px] text-muted-foreground">
                      <strong>Standard EXIF Notice:</strong> Metadata fields without C2PA cryptographic signatures are editable by standard software and treated as supportive context only.
                    </div>
                  </CardContent>
                </Card>

                {/* 4. Image Quality & Analysis Reliability Card */}
                <Card className="border-border bg-card shadow-sm flex flex-col justify-between">
                  <CardHeader className="py-3 px-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Info className="w-4 h-4 text-primary" />
                      4. Quality & Analysis Reliability
                    </CardTitle>
                    <Badge
                      variant={
                        result.quality.permitsReliableAnalysis ? 'default' : 'destructive'
                      }
                      className="text-xs"
                    >
                      {result.quality.qualityVerdict}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 flex flex-col gap-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded bg-muted/30 border border-border">
                        <div className="text-muted-foreground">Dimensions</div>
                        <div className="font-semibold text-foreground">
                          {result.quality.width} × {result.quality.height} px ({result.quality.megapixels} MP)
                        </div>
                      </div>
                      <div className="p-2 rounded bg-muted/30 border border-border">
                        <div className="text-muted-foreground">Fidelity Rating</div>
                        <div className="font-semibold text-foreground">
                          {result.quality.compressionQualityEstimate}% Quality
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-muted-foreground">
                      <div><strong>Edge Sharpness:</strong> {result.quality.blurLevel}</div>
                      <div><strong>Sensor Noise Level:</strong> {result.quality.noiseLevel}</div>
                    </div>

                    {result.quality.limitations.length > 0 && (
                      <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20 text-[11px] text-yellow-700">
                        {result.quality.limitations.join(' ')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Interactive Region Inspection Overlay Component */}
              <ImageRegionInspectionOverlay result={result} />
            </div>
          )}
        </TabsContent>

        {/* TAB 2: Compare Edit Mode */}
        <TabsContent value="compare" className="mt-6">
          <ImageComparisonViewer />
        </TabsContent>

        {/* TAB 3: Batch Mode */}
        <TabsContent value="batch" className="mt-6">
          <BatchImageDetector />
        </TabsContent>
      </Tabs>

      {/* Report Feedback Modal */}
      {result && (
        <ReportIncorrectResultModal
          open={feedbackOpen}
          onOpenChange={setFeedbackOpen}
          imageId={result.id}
          imageHash={result.sha256}
          reportedVerdict={result.aiGeneration.verdict}
        />
      )}
    </div>
  );
}
