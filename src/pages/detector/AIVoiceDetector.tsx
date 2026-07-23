import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload, Mic, RefreshCw, Download, Save, Activity, Volume2, Fingerprint
} from 'lucide-react';
import { analyzeVoice, type AIVoiceAnalysisResult } from './detectionEngine';

export default function AIVoiceDetector() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AIVoiceAnalysisResult | null>(null);
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
      const res = await analyzeVoice(file);
      setResult(res);
      setIsAnalyzing(false);
    }, 2500);
  };

  return (
    <div className="pt-2">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Input and Audio */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <Card className="border-border shadow-card overflow-hidden flex flex-col">
            <CardHeader className="bg-card border-b border-border py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-navy flex items-center gap-2">
                <Mic className="w-5 h-5 text-primary" /> Upload Audio
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
                  <p className="text-base font-semibold text-navy mb-2">Click or drag audio to upload</p>
                  <p className="text-sm text-muted-foreground text-center mb-6">Supports MP3, WAV, M4A, OGG up to 50MB</p>
                  <Button type="button" variant="outline" className="h-10" onClick={() => {}}>Select File</Button>
                </div>
              ) : (
                <div className="relative">
                  <div className="bg-muted/30 p-8 flex flex-col items-center justify-center">
                    <Volume2 className="w-16 h-16 text-muted-foreground/50 mb-6" />
                    <audio src={preview} controls className="w-full max-w-md" />
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button type="button" variant="secondary" size="icon" className="w-8 h-8 rounded-full shadow-sm" onClick={() => fileInputRef.current?.click()}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={handleFileChange} />
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
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Analyzing Audio...</>
                  ) : (
                    <><Activity className="w-4 h-4 mr-2" /> Detect AI Voice</>
                  )}
                </Button>
              </div>
            )}
          </Card>

          {/* Audio Characteristics */}
          {result && (
            <Card className="border-border shadow-card flex-1">
              <CardHeader className="pb-3 pt-5 px-5 border-b border-border">
                <CardTitle className="text-base font-semibold text-navy flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Audio Characteristics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border/50">
                <div className="p-4 grid grid-cols-3 gap-4 hover:bg-muted/10">
                  <span className="text-sm font-semibold text-muted-foreground uppercase">Tone</span>
                  <span className="col-span-2 text-sm text-navy">{result.characteristics.tone}</span>
                </div>
                <div className="p-4 grid grid-cols-3 gap-4 hover:bg-muted/10">
                  <span className="text-sm font-semibold text-muted-foreground uppercase">Cadence</span>
                  <span className="col-span-2 text-sm text-navy">{result.characteristics.cadence}</span>
                </div>
                <div className="p-4 grid grid-cols-3 gap-4 hover:bg-muted/10">
                  <span className="text-sm font-semibold text-muted-foreground uppercase">Pauses</span>
                  <span className="col-span-2 text-sm text-navy">{result.characteristics.pauseDistribution}</span>
                </div>
                <div className="p-4 grid grid-cols-3 gap-4 hover:bg-muted/10">
                  <span className="text-sm font-semibold text-muted-foreground uppercase">Prosody</span>
                  <span className="col-span-2 text-sm text-navy">{result.characteristics.prosody}</span>
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
                <Mic className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-semibold text-navy mb-1">No analysis yet</p>
              <p className="text-sm text-muted-foreground text-center max-w-xs text-pretty">
                Upload an audio file to scan for voice cloning, synthetic speech, and AI-generated narration.
              </p>
            </Card>
          ) : (
            <div className="space-y-5">
              <Card className={`border shadow-card ${
                result.aiProbability >= 70 ? 'border-destructive/30 bg-destructive/5' :
                result.aiProbability >= 40 ? 'border-warning/30 bg-warning/5' :
                'border-success/30 bg-success/5'
              }`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-navy flex items-center gap-2">
                      <Mic className="w-4 h-4 text-primary" /> AI Voice Probability
                    </span>
                    <Badge variant={result.aiProbability >= 70 ? 'destructive' : 'default'} className={result.aiProbability < 40 ? 'bg-success hover:bg-success' : ''}>
                      {result.riskLevel} Risk
                    </Badge>
                  </div>
                  
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <span className={`text-4xl font-extrabold ${
                        result.aiProbability >= 70 ? 'text-destructive' :
                        result.aiProbability >= 40 ? 'text-warning' :
                        'text-success'
                      }`}>{result.aiProbability}%</span>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-navy">{result.confidenceScore}%</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Confidence</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Fingerprinting */}
              <Card className="border-border shadow-card">
                <CardHeader className="pb-2 pt-4 px-5">
                  <CardTitle className="text-sm font-semibold text-navy flex items-center justify-between">
                    <span className="flex items-center gap-2"><Fingerprint className="w-4 h-4 text-primary" /> Model Fingerprint</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 pt-2">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Likely Source Model</p>
                        <p className="font-semibold text-navy text-lg">{result.modelDetection.likelySource}</p>
                      </div>
                      {result.modelDetection.likelySource !== 'Unknown' && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground mb-1">Match Confidence</p>
                          <Badge variant="outline" className="font-bold border-primary/20 text-primary bg-primary/5">{result.modelDetection.confidence}%</Badge>
                        </div>
                      )}
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
                      <span className="text-muted-foreground">Voice Cloning</span>
                      <span className="font-semibold text-navy">{result.breakdown.voiceCloning}%</span>
                    </div>
                    <Progress value={result.breakdown.voiceCloning} className={`h-2 ${result.breakdown.voiceCloning > 50 ? '[&>div]:bg-destructive' : '[&>div]:bg-success'}`} />
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Synthetic Speech</span>
                      <span className="font-semibold text-navy">{result.breakdown.syntheticSpeech}%</span>
                    </div>
                    <Progress value={result.breakdown.syntheticSpeech} className={`h-2 ${result.breakdown.syntheticSpeech > 50 ? '[&>div]:bg-destructive' : '[&>div]:bg-success'}`} />
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">AI Narration</span>
                      <span className="font-semibold text-navy">{result.breakdown.aiNarration}%</span>
                    </div>
                    <Progress value={result.breakdown.aiNarration} className={`h-2 ${result.breakdown.aiNarration > 50 ? '[&>div]:bg-destructive' : '[&>div]:bg-success'}`} />
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
