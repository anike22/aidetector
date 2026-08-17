import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload, Video, CheckCircle2, AlertTriangle,
  RefreshCw, Download, Save, Activity, Volume2, Clock
} from 'lucide-react';
import { analyzeDeepfakeVideo, type DeepfakeVideoAnalysisResult } from './detectionEngine';

export default function DeepfakeVideoDetector() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DeepfakeVideoAnalysisResult | null>(null);
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
      const res = await analyzeDeepfakeVideo(file);
      setResult(res);
      setIsAnalyzing(false);
    }, 3000);
  };

  return (
    <div className="pt-2">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input and Video */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <Card className="border-border shadow-card overflow-hidden flex flex-col">
            <CardHeader className="bg-card border-b border-border py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-navy flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" /> Upload Video
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
                  <p className="text-base font-semibold text-navy mb-2">Click or drag video to upload</p>
                  <p className="text-sm text-muted-foreground text-center mb-6">Supports MP4, MOV, AVI, WEBM up to 100MB</p>
                  <Button type="button" variant="outline" className="h-10" onClick={() => {}}>Select File</Button>
                </div>
              ) : (
                <div className="relative">
                  <div className="aspect-video bg-black flex items-center justify-center">
                    <video src={preview} controls className="w-full h-full max-h-[400px]" />
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button type="button" variant="secondary" size="icon" className="w-8 h-8 rounded-full shadow-sm" onClick={() => fileInputRef.current?.click()}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileChange} />
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
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Analyzing Video...</>
                  ) : (
                    <><Activity className="w-4 h-4 mr-2" /> Detect Deepfake Video</>
                  )}
                </Button>
              </div>
            )}
          </Card>

          {/* Manipulation Timeline */}
          {result && result.timeline.length > 0 && (
            <Card className="border-border shadow-card flex-1">
              <CardHeader className="pb-3 pt-5 px-5 border-b border-border">
                <CardTitle className="text-base font-semibold text-navy flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Manipulation Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                  {result.timeline.map((event, i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-muted/10">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono text-xs bg-muted/50">{event.timestamp}</Badge>
                        <span className="text-sm font-medium text-navy">{event.type}</span>
                      </div>
                      <span className="text-sm font-bold text-destructive">{event.confidence}% Confidence</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audio Analysis */}
          {result && (
            <Card className="border-border shadow-card flex-1">
              <CardHeader className="pb-3 pt-5 px-5 border-b border-border">
                <CardTitle className="text-base font-semibold text-navy flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-primary" /> Audio & Sync Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Lip Sync</span>
                    <p className="text-sm text-foreground/80">{result.audioAnalysis?.lipSyncAnalysis}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Audio Artifacts</span>
                    <p className="text-sm text-foreground/80">{result.audioAnalysis?.artifacts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {!result ? (
            <Card className="border-border shadow-card h-full flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                <Video className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-semibold text-navy mb-1">No analysis yet</p>
              <p className="text-sm text-muted-foreground text-center max-w-xs text-pretty">
                Upload a video to scan for face replacement, voice cloning, and lip sync issues.
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
                      <Activity className="w-4 h-4 text-primary" /> Overall Analysis
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

              {/* Breakdown */}
              <Card className="border-border shadow-card">
                <CardHeader className="pb-2 pt-4 px-5 border-b border-border/50">
                  <CardTitle className="text-sm font-semibold text-navy">Detection Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Face Replacement</span>
                      <span className="font-semibold text-navy">{result.detectionBreakdown.faceReplacement}%</span>
                    </div>
                    <Progress value={result.detectionBreakdown.faceReplacement} className={`h-2 ${result.detectionBreakdown.faceReplacement > 50 ? '[&>div]:bg-destructive' : '[&>div]:bg-success'}`} />
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Voice Cloning</span>
                      <span className="font-semibold text-navy">{result.detectionBreakdown.voiceCloning}%</span>
                    </div>
                    <Progress value={result.detectionBreakdown.voiceCloning} className={`h-2 ${result.detectionBreakdown.voiceCloning > 50 ? '[&>div]:bg-destructive' : '[&>div]:bg-success'}`} />
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Synthetic Speech</span>
                      <span className="font-semibold text-navy">{result.detectionBreakdown.syntheticSpeech}%</span>
                    </div>
                    <Progress value={result.detectionBreakdown.syntheticSpeech} className={`h-2 ${result.detectionBreakdown.syntheticSpeech > 50 ? '[&>div]:bg-destructive' : '[&>div]:bg-success'}`} />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Facial Manipulation</span>
                      <span className="font-semibold text-navy">{result.detectionBreakdown.facialManipulation}%</span>
                    </div>
                    <Progress value={result.detectionBreakdown.facialManipulation} className={`h-2 ${result.detectionBreakdown.facialManipulation > 50 ? '[&>div]:bg-destructive' : '[&>div]:bg-success'}`} />
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
