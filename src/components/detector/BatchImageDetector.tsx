// Batch Image Analysis Component

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileArchive, Loader2, CheckCircle2, AlertTriangle, Download, Trash2 } from 'lucide-react';
import { executeRealImageForensics } from '@/lib/imageDetection/imageForensicEngine';
import { downloadJsonReport } from '@/lib/imageDetection/evidenceReportGenerator';
import type { ImageAnalysisResult } from '@/lib/imageDetection/types';
import { toast } from 'sonner';

export default function BatchImageDetector() {
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImageAnalysisResult[]>([]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).slice(0, 10);
      setFiles(selected);
      setResults([]);
    }
  };

  const handleRunBatch = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(0);
    const batchResults: ImageAnalysisResult[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const res = await executeRealImageForensics(files[i]);
        batchResults.push(res);
      } catch (err) {
        console.error('Batch error on image:', files[i].name, err);
      }
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setResults(batchResults);
    setProcessing(false);
    toast.success(`Completed batch analysis for ${batchResults.length} images.`);
  };

  const handleExportAll = () => {
    if (results.length === 0) return;
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(results, null, 2));
    const a = document.createElement('a');
    a.href = jsonStr;
    a.download = `AIDetector_Batch_${results.length}_Images_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const aiCount = results.filter((r) => r.aiGeneration.verdict === 'Likely AI-generated').length;
  const authCount = results.filter((r) => r.aiGeneration.verdict === 'No strong AI-generation evidence').length;
  const editedCount = results.filter((r) => r.aiGeneration.verdict === 'AI editing indicated').length;

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="py-4 border-b border-border flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <FileArchive className="w-5 h-5 text-primary" />
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              Batch Image Forensic Analyzer
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Analyze up to 10 images concurrently with structured per-image provenance and calibrated verdicts.
            </p>
          </div>
        </div>
        {results.length > 0 && (
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={handleExportAll}>
            <Download className="w-3.5 h-3.5" /> Export All (JSON)
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-4 flex flex-col gap-4">
        {files.length === 0 ? (
          <label className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/30 transition-colors text-center">
            <Upload className="w-8 h-8 text-muted-foreground" />
            <div>
              <span className="text-sm font-semibold text-foreground">Select multiple images for batch scanning</span>
              <p className="text-xs text-muted-foreground mt-1">Supports JPEG, PNG, WEBP, TIFF (Max 10 images per batch)</p>
            </div>
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleFiles} />
          </label>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">{files.length} images staged for analysis</span>
              {!processing && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setFiles([]);
                    setResults([]);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Clear
                </Button>
              )}
            </div>

            {processing && (
              <div className="flex flex-col gap-2 p-4 bg-muted/20 rounded-xl border border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Executing Forensic Pipeline...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {!processing && results.length === 0 && (
              <Button
                onClick={handleRunBatch}
                className="w-full bg-primary text-primary-foreground font-semibold h-10 gap-2"
              >
                <Loader2 className="w-4 h-4 hidden" /> Start Batch Analysis ({files.length} Files)
              </Button>
            )}

            {/* Results Overview Summary */}
            {results.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                  <div className="text-xl font-bold text-red-600">{aiCount}</div>
                  <div className="text-[11px] text-muted-foreground">Likely AI</div>
                </div>
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
                  <div className="text-xl font-bold text-yellow-600">{editedCount}</div>
                  <div className="text-[11px] text-muted-foreground">AI Edited</div>
                </div>
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                  <div className="text-xl font-bold text-green-600">{authCount}</div>
                  <div className="text-[11px] text-muted-foreground">No AI Signs</div>
                </div>
              </div>
            )}

            {/* Results List */}
            {results.length > 0 && (
              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                {results.map((res) => (
                  <div
                    key={res.id}
                    className="p-3 border border-border rounded-lg bg-card flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={res.previewUrl} alt="Thumbnail" className="w-10 h-10 rounded object-cover border border-border shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate">{res.fileName}</div>
                        <div className="text-muted-foreground text-[11px]">
                          {(res.fileSize / 1024).toFixed(0)} KB • {res.quality.width}x{res.quality.height}px
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          res.aiGeneration.verdict === 'Likely AI-generated'
                            ? 'destructive'
                            : res.aiGeneration.verdict === 'No strong AI-generation evidence'
                            ? 'default'
                            : 'secondary'
                        }
                        className="text-xs"
                      >
                        {res.aiGeneration.verdict}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title="Download JSON Report"
                        onClick={() => downloadJsonReport(res)}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
