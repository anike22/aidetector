import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload, ScanFace, CheckCircle2, AlertTriangle,
  RefreshCw, Download, Save, Maximize, AlertCircle
} from 'lucide-react';
import { analyzeDeepfakeImage, type DeepfakeImageAnalysisResult } from './detectionEngine';

export default function DeepfakeImageDetector() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DeepfakeImageAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setTimeout(async () => {
      const res = await analyzeDeepfakeImage(file);
      setResult(res);
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="pt-2">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input and Heatmap */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <Card className="border-border shadow-card overflow-hidden">
            <CardHeader className="bg-card border-b border-border py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-navy flex items-center gap-2">
                <ScanFace className="w-5 h-5 text-primary" /> Upload Image
              </CardTitle>
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">Premium</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {!preview ? (
                <div
                  className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border m-6 rounded-xl bg-muted/20 hover:bg-muted/50 transition-colors cursor-pointer"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-base font-semibold text-navy mb-2">Click or drag image to upload</p>
                  <p className="text-sm text-muted-foreground text-center mb-6">Supports JPG, PNG, WEBP, GIF up to 20MB</p>
                  <Button type="button" variant="outline" className="h-10" onClick={() => {}}>Select File</Button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative aspect-[4/3] md:aspect-video w-full overflow-hidden bg-black/5 flex items-center justify-center">
                    <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />
                    
                    {/* Simulated Heatmap Overlay */}
                    {result && result.riskLevel === 'Critical' && (
                      <div className="absolute inset-0 bg-destructive/20 mix-blend-multiply flex items-center justify-center">
                         <div className="w-1/3 h-1/3 bg-destructive/60 rounded-full blur-3xl absolute top-1/4 left-1/3"></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button type="button" variant="secondary" size="icon" className="w-8 h-8 rounded-full shadow-sm" onClick={() => fileInputRef.current?.click()}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </CardContent>
            
            {preview && (
              <div className="p-4 bg-card border-t border-border flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground truncate max-w-[200px]">{file?.name}</span>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="h-10 px-6 bg-primary text-primary-foreground font-medium"
                >
                  {isAnalyzing ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                  ) : (
                    <><ScanFace className="w-4 h-4 mr-2" /> Detect Deepfake</>
                  )}
                </Button>
              </div>
            )}
          </Card>

          {/* Evidence */}
          {result && result.anomalies.length > 0 && (
            <Card className="border-border shadow-card flex-1">
              <CardHeader className="pb-3 pt-5 px-5 border-b border-border">
                <CardTitle className="text-base font-semibold text-navy flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-warning" /> Manipulation Evidence
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <ul className="space-y-3">
                  {result.anomalies.map((anomaly, i) => (
                    <li key={i} className="flex items-start gap-3 bg-muted/30 p-3 rounded border border-border/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-warning mt-2 shrink-0"></div>
                      <span className="text-sm text-foreground/80 leading-relaxed">{anomaly}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {!result ? (
            <Card className="border-border shadow-card h-full flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                <ScanFace className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-semibold text-navy mb-1">No analysis yet</p>
              <p className="text-sm text-muted-foreground text-center max-w-xs text-pretty">
                Upload a portrait or human image to scan for face swaps and manipulation.
              </p>
            </Card>
          ) : (
            <div className="space-y-5">
              <Card className={`border shadow-card ${
                result.deepfakeProbability >= 70 ? 'border-destructive/30 bg-destructive/5' :
                result.deepfakeProbability >= 40 ? 'border-warning/30 bg-warning/5' :
                'border-success/30 bg-success/5'
              }`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-navy flex items-center gap-2">
                      <ScanFace className="w-4 h-4 text-primary" /> Overall Analysis
                    </span>
                    <Badge variant={result.deepfakeProbability >= 70 ? 'destructive' : 'default'} className={result.deepfakeProbability < 40 ? 'bg-success hover:bg-success' : ''}>
                      {result.riskLevel} Risk
                    </Badge>
                  </div>
                  
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <span className={`text-4xl font-extrabold ${
                        result.deepfakeProbability >= 70 ? 'text-destructive' :
                        result.deepfakeProbability >= 40 ? 'text-warning' :
                        'text-success'
                      }`}>{result.deepfakeProbability}%</span>
                      <p className="text-sm font-semibold text-navy mt-1">Deepfake Probability</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-navy">{result.confidenceScore}%</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Confidence</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Facial Analysis Breakdown */}
              <Card className="border-border shadow-card">
                <CardHeader className="pb-2 pt-4 px-5 border-b border-border/50">
                  <CardTitle className="text-sm font-semibold text-navy flex items-center justify-between">
                    <span className="flex items-center gap-2"><Maximize className="w-4 h-4 text-primary" /> Facial Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Face Swap Detection</span>
                      <span className="font-semibold text-navy">{result.facialAnalysis.faceSwap}%</span>
                    </div>
                    <Progress value={result.facialAnalysis.faceSwap} className={`h-2 ${result.facialAnalysis.faceSwap > 50 ? '[&>div]:bg-destructive' : '[&>div]:bg-success'}`} />
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Synthetic Face</span>
                      <span className="font-semibold text-navy">{result.facialAnalysis.syntheticFace}%</span>
                    </div>
                    <Progress value={result.facialAnalysis.syntheticFace} className={`h-2 ${result.facialAnalysis.syntheticFace > 50 ? '[&>div]:bg-destructive' : '[&>div]:bg-success'}`} />
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Identity Manipulation</span>
                      <span className="font-semibold text-navy">{result.facialAnalysis.identityManipulation}%</span>
                    </div>
                    <Progress value={result.facialAnalysis.identityManipulation} className={`h-2 ${result.facialAnalysis.identityManipulation > 50 ? '[&>div]:bg-destructive' : '[&>div]:bg-success'}`} />
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">AI Enhanced Portrait</span>
                      <span className="font-semibold text-navy">{result.facialAnalysis.aiEnhanced}%</span>
                    </div>
                    <Progress value={result.facialAnalysis.aiEnhanced} className={`h-2 [&>div]:bg-primary`} />
                  </div>
                  
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-3">
                <Button type="button" className="flex-1 h-10 gap-2 bg-primary text-primary-foreground" onClick={() => {}}>
                  <Download className="w-4 h-4" /> Export Report
                </Button>
                <Button type="button" variant="outline" className="flex-1 h-10 gap-2 border-border text-foreground/70 hover:text-foreground" onClick={() => {}}>
                  <Save className="w-4 h-4" /> Save
                </Button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
