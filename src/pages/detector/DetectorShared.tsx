// Shared UI components for the AI Image & Video Detector feature.
import { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload, CheckCircle2, AlertTriangle, XCircle, ShieldAlert,
  Download, FileJson, Globe, Info, Clock, Zap,
} from 'lucide-react';
import {
  DetectionResult, RiskLevel, ConfidenceLevel, DetectionStatus,
  C2PAStatus, exportAsJSON, exportAsHTML,
} from './detectionEngine';

// ─── Score Gauge ─────────────────────────────────────────────────────────────
export function ScoreGauge({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' | 'lg' }) {
  const radius = size === 'lg' ? 54 : size === 'md' ? 40 : 28;
  const stroke = size === 'lg' ? 7 : 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const svgSize = (radius + stroke + 4) * 2;
  const color = value >= 70 ? 'hsl(var(--destructive))' : value >= 45 ? '#f59e0b' : 'hsl(var(--success))';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={svgSize} height={svgSize} className="transform -rotate-90">
        <circle cx={svgSize / 2} cy={svgSize / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <circle
          cx={svgSize / 2} cy={svgSize / 2} r={radius}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-700"
        />
      </svg>
      <span className={`absolute font-bold text-navy ${size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm'}`}>
        {value}%
      </span>
    </div>
  );
}

// ─── Risk Badge ───────────────────────────────────────────────────────────────
export function RiskBadge({ level }: { level: RiskLevel }) {
  const map: Record<RiskLevel, { cls: string; icon: typeof CheckCircle2 }> = {
    Low: { cls: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
    Medium: { cls: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: AlertTriangle },
    High: { cls: 'bg-orange-100 text-orange-700 border-orange-300', icon: AlertTriangle },
    Critical: { cls: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
  };
  const { cls, icon: Icon } = map[level];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${cls}`}>
      <Icon className="w-3.5 h-3.5" /> {level} Risk
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: DetectionStatus }) {
  const isAI = status === 'Likely AI-generated' || status === 'Likely deepfake';
  const isAuth = status === 'Authentic / No AI signs detected';
  const cls = isAI
    ? 'bg-destructive/10 text-destructive border-destructive/30'
    : isAuth
    ? 'bg-success/10 text-success border-success/30'
    : 'bg-yellow-100 text-yellow-700 border-yellow-300';
  return (
    <Badge className={`text-xs font-semibold border ${cls}`}>{status}</Badge>
  );
}

// ─── Confidence Badge ────────────────────────────────────────────────────────
export function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const map: Record<ConfidenceLevel, string> = {
    Low: 'bg-muted text-muted-foreground border-border',
    Medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    High: 'bg-blue-100 text-blue-700 border-blue-300',
    'Very High': 'bg-destructive/10 text-destructive border-destructive/30',
  };
  return (
    <Badge className={`text-xs font-semibold border ${map[level]}`}>
      Confidence: {level}
    </Badge>
  );
}

// ─── C2PA Status Badge ────────────────────────────────────────────────────────
export function C2PABadge({ status }: { status: C2PAStatus }) {
  const map: Record<C2PAStatus, { cls: string; label: string }> = {
    Verified: { cls: 'bg-success/10 text-success border-success/30', label: '✓ Verified credentials' },
    Missing: { cls: 'bg-muted text-muted-foreground border-border', label: '— No credentials found' },
    Broken: { cls: 'bg-destructive/10 text-destructive border-destructive/30', label: '✕ Broken credentials' },
    'Not checked': { cls: 'bg-muted text-muted-foreground border-border', label: '· Provenance not checked' },
  };
  const { cls, label } = map[status];
  return <Badge className={`text-xs font-semibold border ${cls}`}>{label}</Badge>;
}

// ─── Upload Zone ─────────────────────────────────────────────────────────────
interface UploadZoneProps {
  accept: string;
  acceptLabel: string;
  maxMB: number;
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function UploadZone({ accept, acceptLabel, maxMB, onFile, disabled }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    if (file.size > maxMB * 1024 * 1024) {
      alert(`File size exceeds limit. Maximum size: ${maxMB} MB`);
      return;
    }
    onFile(file);
  };

  return (
    <div
      className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:border-primary/50 hover:bg-primary/3 transition-colors cursor-pointer"
      onDragOver={e => { e.preventDefault(); }}
      onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
        disabled={disabled}
      />
      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Upload className="w-7 h-7 text-primary" />
      </div>
      <p className="text-sm font-medium text-navy mb-1">Drag &amp; drop your file here</p>
      <p className="text-xs text-muted-foreground mb-4">or click to browse</p>
      <div className="flex flex-wrap items-center justify-center gap-1.5 mb-3">
        {acceptLabel.split(',').map(f => (
          <Badge key={f} className="bg-muted text-muted-foreground border-border text-xs">{f.trim()}</Badge>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Max file size: {maxMB} MB</p>
    </div>
  );
}

// ─── Detection Breakdown Table ────────────────────────────────────────────────
export function DetectionBreakdownCard({ result }: { result: DetectionResult }) {
  const rows = [
    { label: 'Face Authenticity', value: result.breakdown.faceAuthenticity, invert: true },
    { label: 'Background Consistency', value: result.breakdown.backgroundConsistency, invert: true },
    { label: 'Lighting Consistency', value: result.breakdown.lightingConsistency, invert: true },
    { label: 'Metadata Check', value: result.breakdown.metadataCheck, invert: true },
    { label: 'Deepfake Risk', value: result.breakdown.deepfakeRisk, invert: false },
    { label: 'AI Artifact Score', value: result.breakdown.aiArtifactScore, invert: false },
    ...(result.mode !== 'image' ? [{ label: 'Audio Authenticity', value: result.breakdown.audioAuthenticity, invert: true }] : []),
    { label: 'Provenance Check', value: result.breakdown.provenanceCheck, invert: true },
  ];

  const scoreColor = (val: number, invert: boolean) => {
    const risk = invert ? val : 100 - val;
    if (risk < 40) return 'text-destructive';
    if (risk < 70) return 'text-yellow-600';
    return 'text-success';
  };

  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Detection Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {rows.map(row => (
            <div key={row.label} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-xs text-muted-foreground w-36 shrink-0">{row.label}</span>
              <Progress value={row.value} className="flex-1 h-1.5" />
              <span className={`text-xs font-semibold w-10 text-right ${scoreColor(row.value, row.invert)}`}>{row.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Signals Card ─────────────────────────────────────────────────────────────
export function DetectedSignalsCard({ signals }: { signals: string[] }) {
  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" /> Detected Signals
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex flex-col gap-2">
        {signals.map((signal, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
            <span className="text-sm text-foreground/80 text-pretty">{signal}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Explanation Card ─────────────────────────────────────────────────────────
export function ExplanationCard({ explanation, recommendation }: { explanation: string; recommendation: string }) {
  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" /> Analysis Explanation
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex flex-col gap-4">
        <p className="text-sm text-foreground/80 leading-relaxed text-pretty">{explanation}</p>
        <div className="bg-primary/5 border border-primary/15 rounded-lg p-3">
          <p className="text-xs font-semibold text-navy mb-1">Recommendation</p>
          <p className="text-xs text-foreground/70 leading-relaxed text-pretty">{recommendation}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── C2PA Card ────────────────────────────────────────────────────────────────
export function C2PACard({ result }: { result: DetectionResult }) {
  const { c2pa } = result;
  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-primary" /> C2PA / Provenance Check
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Credentials status</span>
          <C2PABadge status={c2pa.status} />
        </div>
        {c2pa.editingHistory && (
          <div className="flex items-start gap-2">
            <span className="text-xs text-muted-foreground w-28 shrink-0">Editing history</span>
            <span className="text-xs text-foreground/70">{c2pa.editingHistory}</span>
          </div>
        )}
        {c2pa.aiDisclosure && (
          <div className="flex items-start gap-2">
            <span className="text-xs text-muted-foreground w-28 shrink-0">AI disclosure</span>
            <span className="text-xs text-foreground/70">{c2pa.aiDisclosure}</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground/70 pt-1 text-pretty">
          C2PA is one of many signals. Absence of credentials does not confirm AI generation, and presence does not guarantee authenticity.
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Suspicious Timestamps ────────────────────────────────────────────────────
export function TimestampsCard({ result }: { result: DetectionResult }) {
  if (result.suspiciousTimestamps.length === 0) return null;
  return (
    <Card className="border-border shadow-card">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
          <Clock className="w-4 h-4 text-warning" /> Suspicious Timestamps
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {result.suspiciousTimestamps.map((ts, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <span className="font-mono text-xs font-semibold text-primary w-10 shrink-0">{ts.time}</span>
              <span className="text-xs text-foreground/80 flex-1">{ts.frameDesc}</span>
              <Badge className={`text-xs border shrink-0 ${
                ts.severity === 'High' ? 'bg-destructive/10 text-destructive border-destructive/30' :
                ts.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                'bg-muted text-muted-foreground border-border'
              }`}>{ts.severity}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Confidence Disclaimer ────────────────────────────────────────────────────
export function ConfidenceDisclaimer() {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2.5">
      <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
      <p className="text-xs text-yellow-800 leading-relaxed text-pretty">
        <strong>AI detection is probabilistic.</strong> Results should be used as guidance, not as final proof.
        For legal, financial, political, or identity verification decisions, use additional verification methods.
      </p>
    </div>
  );
}

// ─── Export Buttons ───────────────────────────────────────────────────────────
export function ExportButtons({ result, isPremium }: { result: DetectionResult; isPremium?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" className="h-8 text-xs border-border gap-1.5" onClick={() => exportAsHTML(result)}>
        <Globe className="w-3 h-3" /> Export HTML
      </Button>
      <Button size="sm" variant="outline" className="h-8 text-xs border-border gap-1.5" onClick={() => exportAsJSON(result)}>
        <FileJson className="w-3 h-3" /> Export JSON
      </Button>
      {isPremium ? (
        <Button size="sm" variant="outline" className="h-8 text-xs border-border gap-1.5" onClick={() => exportAsHTML(result)}>
          <Download className="w-3 h-3" /> Export PDF
        </Button>
      ) : (
        <Button size="sm" variant="outline" className="h-8 text-xs border-border gap-1.5 opacity-60" onClick={() => {}}>
          <Download className="w-3 h-3" /> PDF (Premium)
        </Button>
      )}
    </div>
  );
}

// ─── Premium Gate ─────────────────────────────────────────────────────────────
export function PremiumGate({ feature }: { feature: string }) {
  return (
    <div className="text-center py-12">
      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <ShieldAlert className="w-7 h-7 text-primary" />
      </div>
      <h3 className="font-bold text-navy text-base mb-2 text-balance">{feature} is a Premium Feature</h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto text-pretty">
        Upgrade to access video detection, deepfake analysis, heatmaps, timestamp analysis, PDF exports, and more.
      </p>
      <a href="/pricing">
        <Button className="bg-primary text-primary-foreground h-9 text-sm gap-2" onClick={() => {}}>
          View Pricing Plans
        </Button>
      </a>
    </div>
  );
}

// ─── Overall Result Header ────────────────────────────────────────────────────
export function ResultHeader({ result }: { result: DetectionResult }) {
  return (
    <Card className="border-border shadow-card">
      <CardContent className="p-5">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
          <ScoreGauge value={result.aiProbability} size="lg" />
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs text-muted-foreground mb-1">AI Probability</p>
            <StatusBadge status={result.status} />
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
              <ConfidenceBadge level={result.confidenceLevel} />
              <RiskBadge level={result.riskLevel} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{result.fileName} · {(result.fileSize / 1024).toFixed(0)} KB</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
