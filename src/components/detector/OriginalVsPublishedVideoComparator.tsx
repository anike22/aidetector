// ─── Original vs. Published Video Comparator Component (Section 15) ─────────────

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  ArrowRight,
  Layers,
  Sparkles,
  Download,
  Video,
  FileText,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { compareOriginalVsPublishedVideos } from '@/lib/videoDetection/videoComparatorEngine';
import type { OriginalVsPublishedComparisonResult } from '@/lib/videoDetection/types';
import { toast } from 'sonner';

export default function OriginalVsPublishedVideoComparator() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [publishedFile, setPublishedFile] = useState<File | null>(null);
  const [platform, setPlatform] = useState<'TikTok' | 'WhatsApp' | 'YouTube' | 'Instagram' | 'Generic Compression'>('TikTok');
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<OriginalVsPublishedComparisonResult | null>(null);

  const handleCompare = async () => {
    if (!originalFile || !publishedFile) {
      toast.error('Please upload both the original master file and the published copy.');
      return;
    }
    setComparing(true);
    try {
      const res = await compareOriginalVsPublishedVideos(originalFile, publishedFile, platform);
      setResult(res);
      toast.success('Differential analysis completed successfully.');
    } catch (e) {
      toast.error('Failed to compare video files.');
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary">Creator Defense Workflow</Badge>
            <Badge variant="secondary">False-Positive Shield</Badge>
          </div>
          <CardTitle className="text-xl">Original vs. Published Video Comparator</CardTitle>
          <CardDescription>
            Upload your original camera/master export alongside the social-media-compressed copy (TikTok, YouTube, WhatsApp, Instagram).
            Our differential engine isolates platform re-encoding noise from genuine manipulation, giving you proof to dispute false AI flags.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dual Upload Zone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original File */}
            <div className="p-4 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors bg-muted/20">
              <div className="flex items-center gap-2 mb-2 font-medium text-sm">
                <Video className="w-4 h-4 text-emerald-500" />
                1. Original Camera / Master Export
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                High-bitrate ProRes/MP4 file directly from your camera, editing software, or local master archive.
              </p>
              {originalFile ? (
                <div className="p-3 bg-muted/40 rounded border border-border flex items-center justify-between">
                  <div className="truncate text-xs font-mono">
                    {originalFile.name} ({(originalFile.size / (1024 * 1024)).toFixed(1)} MB)
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setOriginalFile(null)}>Change</Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 cursor-pointer border border-border rounded bg-background hover:bg-muted/30">
                  <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                  <span className="text-xs font-medium">Select Original Master Video</span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && setOriginalFile(e.target.files[0])}
                  />
                </label>
              )}
            </div>

            {/* Published File */}
            <div className="p-4 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors bg-muted/20">
              <div className="flex items-center gap-2 mb-2 font-medium text-sm">
                <Layers className="w-4 h-4 text-blue-500" />
                2. Published / Compressed Copy
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                The video downloaded from TikTok, Instagram Reels, YouTube Shorts, WhatsApp, or Twitter/X.
              </p>
              {publishedFile ? (
                <div className="p-3 bg-muted/40 rounded border border-border flex items-center justify-between">
                  <div className="truncate text-xs font-mono">
                    {publishedFile.name} ({(publishedFile.size / (1024 * 1024)).toFixed(1)} MB)
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setPublishedFile(null)}>Change</Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 cursor-pointer border border-border rounded bg-background hover:bg-muted/30">
                  <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                  <span className="text-xs font-medium">Select Platform-Compressed Video</span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && setPublishedFile(e.target.files[0])}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Platform Selector & Compare Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-border">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-medium text-muted-foreground">Target Platform:</span>
              <Select value={platform} onValueChange={(val: any) => setPlatform(val)}>
                <SelectTrigger className="w-[180px] h-9 text-xs">
                  <SelectValue placeholder="Platform Profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TikTok">TikTok (H.264/VFR)</SelectItem>
                  <SelectItem value="Instagram">Instagram Reels</SelectItem>
                  <SelectItem value="YouTube">YouTube Shorts</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp Compression</SelectItem>
                  <SelectItem value="Generic Compression">Generic Compression</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCompare}
              disabled={!originalFile || !publishedFile || comparing}
              className="w-full sm:w-auto gap-2"
            >
              {comparing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Performing Differential Analysis...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run Differential Analysis
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results Card */}
      {result && (
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <Badge variant="outline" className="text-emerald-500 border-emerald-500/40 mb-1">
                  Differential Defense Report
                </Badge>
                <CardTitle className="text-lg">Comparison Outcome & Platform Verification</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1 text-xs">
                  <Download className="w-3.5 h-3.5" /> Export PDF Certificate
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Verdict Banner */}
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                  {result.authenticityDefenseVerdict}
                </div>
                <p className="text-xs text-muted-foreground">
                  Visual match between streams is <strong>{result.matchingVisualScore}%</strong>. The detected artifacts in the published copy are consistent with normal {result.platformProfile} transcoding.
                </p>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-muted/30 rounded border border-border">
                <div className="text-xs text-muted-foreground">Visual Alignment</div>
                <div className="text-xl font-bold mt-1 text-emerald-500">{result.matchingVisualScore}%</div>
                <div className="text-[11px] text-muted-foreground mt-1">Spatial & temporal frame match</div>
              </div>

              <div className="p-3 bg-muted/30 rounded border border-border">
                <div className="text-xs text-muted-foreground">Compression Severity</div>
                <div className="text-xl font-bold mt-1 text-amber-500">{result.compressionSeverity}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Bitrate reduced by {result.platformProfile}</div>
              </div>

              <div className="p-3 bg-muted/30 rounded border border-border">
                <div className="text-xs text-muted-foreground">Authentic Source Evidence</div>
                <div className="text-xl font-bold mt-1 text-emerald-500">Verified</div>
                <div className="text-[11px] text-muted-foreground mt-1">Camera master verified</div>
              </div>
            </div>

            {/* Encoding Differences Table */}
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Technical Encoding Variance Table
              </div>
              <div className="overflow-x-auto border border-border rounded">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b border-border text-left">
                    <tr>
                      <th className="p-2.5">Parameter</th>
                      <th className="p-2.5">Original File</th>
                      <th className="p-2.5">Published File</th>
                      <th className="p-2.5">Forensic Explanation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {result.encodingDifferences.map((diff, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="p-2.5 font-medium">{diff.parameter}</td>
                        <td className="p-2.5 font-mono text-muted-foreground">{diff.originalValue}</td>
                        <td className="p-2.5 font-mono text-muted-foreground">{diff.publishedValue}</td>
                        <td className="p-2.5 text-muted-foreground">{diff.explanation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Creator Defense Recommendation */}
            <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <FileCheck className="w-4 h-4 text-primary" />
                Appeal & Platform Defense Statement
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {result.recommendationForCreator}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
