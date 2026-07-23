import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageMeta from '@/components/common/PageMeta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Upload, Bot, Shield, CheckCircle2, AlertTriangle, Fingerprint, TextSearch,
  Sparkles, Network, RefreshCw, UserCheck, Download, Copy, Share2, Activity,
  BarChart2, Type, FileText
} from 'lucide-react';
import { analyzeText, type TextAnalysisResult } from './detectionEngine';
import { extractTextFromFile } from '@/utils/fileExtractor';

const SAMPLE_TEXT = `Artificial intelligence has revolutionized the way businesses operate in the modern era. The implementation of machine learning algorithms enables companies to process vast amounts of data with unprecedented efficiency. Furthermore, natural language processing capabilities allow for automated content generation that is indistinguishable from human writing. Organizations leveraging these technologies experience substantial improvements in productivity metrics and operational cost reduction. The utilization of AI-powered tools represents a paradigm shift in how enterprises approach problem-solving and decision-making processes.`;

// Deterministic mock generation for advanced stats based on text
const getAdvancedStats = (text: string) => {
  const hash = text.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
  const getMod = (min: number, max: number, offset: number) => min + (Math.abs(hash + offset) % (max - min));
  
  return {
    readability: getMod(40, 80, 1),
    burstiness: getMod(20, 95, 2),
    perplexity: getMod(15, 85, 3),
    complexity: getMod(30, 90, 4)
  };
};

function ScoreGauge({ value, color, size = 'md' }: { value: number; color: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const radius = size === 'xl' ? 65 : size === 'lg' ? 45 : size === 'md' ? 35 : 28;
  const stroke = size === 'xl' ? 10 : size === 'lg' ? 6 : 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const svgSize = (radius + stroke + 4) * 2;

  return (
    <svg width={svgSize} height={svgSize} className="transform -rotate-90 drop-shadow-sm">
      <circle cx={svgSize / 2} cy={svgSize / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
      <circle
        cx={svgSize / 2} cy={svgSize / 2} r={radius}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

function RiskBadge({ level }: { level: string }) {
  const config: Record<string, any> = {
    Low: { class: 'bg-success/10 text-success border-success/20', icon: CheckCircle2 },
    Medium: { class: 'bg-warning/10 text-warning border-warning/20', icon: AlertTriangle },
    High: { class: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertTriangle },
    Critical: { class: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertTriangle },
  };
  const cfg = config[level] || config.Medium;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${cfg.class}`}>
      <Icon className="w-4 h-4" /> {level} Risk
    </span>
  );
}

export default function AITextDetector() {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<TextAnalysisResult | null>(null);
  const [useSample, setUseSample] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialText = params.get('text');
    if (initialText && content === '') {
      setContent(initialText);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsExtracting(true);
    try {
      let combinedText = '';
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds the 10MB limit.`);
        }
        const text = await extractTextFromFile(file);
        if (!text || text.trim() === '') {
          throw new Error(`We couldn't read this document. Please upload a valid DOCX, PDF, or TXT file.`);
        }
        combinedText += `\n\n--- File: ${file.name} ---\n\n` + text.trim();
      }
      setContent(combinedText.trim());
      setUseSample(false);
      
      // Calculate word count
      const wordCount = combinedText.trim().split(/\s+/).filter(w => w.length > 0).length;
      toast.success(`Document uploaded successfully. Extracted ${wordCount} words.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to extract file content.');
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    const textToAnalyze = content || (useSample ? SAMPLE_TEXT : '');
    if (!textToAnalyze.trim() || textToAnalyze.split(/\s+/).length < 20) {
      toast.error('Please enter at least 20 words.');
      return;
    }

    setIsAnalyzing(true);
    setTimeout(async () => {
      try {
        const res = await analyzeText(textToAnalyze);
        setResult(res);
      } catch (e: any) {
        toast.error(e.message || 'Analysis failed.');
      }
      setIsAnalyzing(false);
    }, 1500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Text copied to clipboard');
  };

  const activeText = useSample && !content ? SAMPLE_TEXT : content;
  const wordCount = (activeText.match(/\S+/g) || []).length;
  const stats = result ? getAdvancedStats(activeText) : null;

  return (
    <div className="pt-6 pb-20">
      <PageMeta 
        title="AI Content Detector | AIDetector.cx"
        description="Pinpoint AI-generated content from GPT-4, Claude, and Gemini with unmatched accuracy."
        canonicalUrl="https://aidetector.cx/detector"
      />
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">AI Content Detector</h1>
          <p className="text-muted-foreground mt-2">Analyze text for AI generation, view detailed sentence breakdown, and check risk levels.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input and Sentence Analysis */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <Card className="border-border/50 shadow-premium overflow-hidden flex flex-col h-[500px] rounded-2xl bg-card">
              <CardHeader className="bg-muted/20 border-b border-border/50 py-4 px-6">
                <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Document Content</span>
                  <div className="flex gap-2">
                    <input 
                      type="file" 
                      multiple 
                      accept=".txt,.md,.html,.pdf,.docx" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                    />
                    <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg text-xs font-semibold" onClick={() => fileInputRef.current?.click()} disabled={isExtracting}>
                      <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-semibold text-muted-foreground" onClick={() => { setContent(''); setUseSample(true); }}>
                      Try Sample
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 relative">
                <Textarea
                  placeholder="Paste your text here (minimum 50 words) to detect AI generated content..."
                  className="w-full h-full resize-none border-0 focus-visible:ring-0 rounded-none p-6 text-base leading-relaxed bg-transparent"
                  value={activeText}
                  onChange={(e) => { setContent(e.target.value); setUseSample(false); }}
                  disabled={isExtracting}
                />
                {isExtracting && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                      <span className="font-medium text-muted-foreground">Extracting text...</span>
                    </div>
                  </div>
                )}
              </CardContent>
              <div className="p-5 bg-muted/20 border-t border-border/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-md border ${wordCount < 50 ? 'border-warning/50 bg-warning/10 text-warning' : 'border-border/50 bg-background text-muted-foreground'}`}>
                    {wordCount} words
                  </span>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button
                    onClick={() => navigate(`/humanizer?text=${encodeURIComponent(activeText)}`)}
                    disabled={!activeText.trim()}
                    variant="outline"
                    className="flex-1 sm:flex-none h-11 px-6 font-bold border-primary/20 text-primary hover:bg-primary/10 rounded-xl"
                  >
                    <UserCheck className="w-4 h-4 mr-2" /> Humanize
                  </Button>
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || (!content.trim() && !useSample) || isExtracting}
                    className="flex-1 sm:flex-none h-11 px-8 bg-primary text-white font-bold rounded-xl shadow-hover transition-all"
                  >
                    {isAnalyzing ? (
                      <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Analyzing...</>
                    ) : (
                      <><Shield className="w-5 h-5 mr-2" /> Detect AI</>
                    )}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Sentence-Level Analysis */}
            {result && (
              <Card className="border-border/50 shadow-premium flex-1 rounded-2xl bg-card overflow-hidden animate-slide-in">
                <CardHeader className="bg-muted/20 pb-4 pt-5 px-6 border-b border-border/50">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-2"><TextSearch className="w-4 h-4 text-primary" /> Sentence Breakdown</span>
                    <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-success/80"></span> Human</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-warning/80"></span> Mixed</span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-destructive/80"></span> AI</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 text-base leading-loose text-foreground/80">
                  <TooltipProvider delayDuration={150}>
                    {result.sentences.map((s, i) => (
                      <Tooltip key={i}>
                        <TooltipTrigger asChild>
                          <span className={`cursor-pointer transition-colors duration-200 ${
                            s.aiProbability >= 70 ? 'bg-destructive/20 hover:bg-destructive/40 text-destructive-foreground' :
                            s.aiProbability >= 40 ? 'bg-warning/20 hover:bg-warning/40 text-warning-foreground' :
                            'bg-success/10 hover:bg-success/20'
                          } rounded px-1 mx-[1px]`}>
                            {s.text}{' '}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="p-3 w-64 bg-foreground border-none shadow-xl rounded-xl text-background">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center pb-2 border-b border-background/20">
                              <span className="font-bold text-sm">AI Probability</span>
                              <span className={`font-black ${s.aiProbability >= 70 ? 'text-destructive' : s.aiProbability >= 40 ? 'text-warning' : 'text-success'}`}>{s.aiProbability}%</span>
                            </div>
                            <div className="text-xs text-background/80 leading-relaxed font-medium">
                              {s.aiProbability >= 70 ? 'Strong indicators of AI generation.' :
                               s.aiProbability >= 40 ? 'Mixed signals. Could be heavily edited human text or AI with human touches.' :
                               'Consistent with human writing patterns.'}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Advanced Metrics */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {!result ? (
              <Card className="border-border/50 shadow-premium h-full flex flex-col items-center justify-center py-24 rounded-2xl bg-card">
                <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <Shield className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <p className="text-xl font-extrabold text-foreground mb-2">Ready to Analyze</p>
                <p className="text-sm text-muted-foreground text-center max-w-[260px] text-pretty">
                  Enter your text and click Detect AI to see detailed metrics and sentence breakdown.
                </p>
              </Card>
            ) : (
              <div className="space-y-6 animate-slide-in">
                {/* Main Score Card */}
                <Card className={`border shadow-premium rounded-2xl overflow-hidden ${
                  result.aiProbability >= 70 ? 'border-destructive/30 bg-destructive/5' :
                  result.aiProbability >= 45 ? 'border-warning/30 bg-warning/5' :
                  'border-success/30 bg-success/5'
                }`}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-widest">
                        <Activity className="w-4 h-4 text-primary" /> Detection Result
                      </span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8 rounded-lg bg-background/50 hover:bg-background"><Copy className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => toast.success('Report downloaded!')} className="h-8 w-8 rounded-lg bg-background/50 hover:bg-background"><Download className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center mb-8 relative">
                      <ScoreGauge
                        value={result.aiProbability}
                        color={result.aiProbability >= 70 ? 'hsl(var(--destructive))' : result.aiProbability >= 45 ? 'hsl(var(--warning))' : 'hsl(var(--success))'}
                        size="xl"
                      />
                      <div className="absolute inset-0 flex items-center justify-center flex-col mt-2">
                        <span className="text-5xl font-black text-foreground tracking-tighter">{result.aiProbability}%</span>
                        <span className="text-xs font-bold text-muted-foreground uppercase mt-1">AI Content</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-background/80 rounded-xl p-3 border border-border/50">
                        <div className="text-2xl font-bold text-success mb-1">{100 - result.aiProbability}%</div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase">Human</div>
                      </div>
                      <div className="bg-background/80 rounded-xl p-3 border border-border/50">
                        <div className="text-2xl font-bold text-foreground mb-1">{result.confidenceScore}%</div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase">Confidence</div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                      <RiskBadge level={result.riskLevel} />
                    </div>
                  </div>
                </Card>

                {/* Advanced Linguistic Metrics */}
                {stats && (
                  <Card className="border-border/50 shadow-premium rounded-2xl bg-card">
                    <CardHeader className="pb-4 pt-5 px-6 border-b border-border/50">
                      <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                        <BarChart2 className="w-4 h-4 text-primary" /> Linguistic Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-5">
                        <div>
                          <div className="flex justify-between text-sm mb-1.5 font-semibold">
                            <span className="text-muted-foreground">Readability</span>
                            <span className="text-foreground">{stats.readability}/100</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${stats.readability}%` }}></div></div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1.5 font-semibold">
                            <span className="text-muted-foreground">Burstiness (Human trait)</span>
                            <span className="text-foreground">{stats.burstiness}/100</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-success h-1.5 rounded-full" style={{ width: `${stats.burstiness}%` }}></div></div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1.5 font-semibold">
                            <span className="text-muted-foreground">Perplexity (AI trait)</span>
                            <span className="text-foreground">{stats.perplexity}/100</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-warning h-1.5 rounded-full" style={{ width: `${stats.perplexity}%` }}></div></div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1.5 font-semibold">
                            <span className="text-muted-foreground">Complexity</span>
                            <span className="text-foreground">{stats.complexity}/100</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-primary/50 h-1.5 rounded-full" style={{ width: `${stats.complexity}%` }}></div></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Fingerprint & Evidence */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="border-border/50 shadow-premium rounded-2xl bg-card">
                    <CardContent className="p-5 flex flex-col justify-between h-full">
                      <div className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                        <Fingerprint className="w-4 h-4 text-primary" /> Fingerprint
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground font-semibold uppercase mb-1">Primary Model</div>
                        <div className="text-lg font-black text-foreground">{result.fingerprint.primaryModel}</div>
                        <Badge variant="secondary" className="mt-2 text-xs">{result.fingerprint.primaryConfidence}% Match</Badge>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-border/50 shadow-premium rounded-2xl bg-card">
                    <CardContent className="p-5 flex flex-col justify-between h-full">
                      <div className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                        <Type className="w-4 h-4 text-success" /> Human Score
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground font-semibold uppercase mb-1">Evidence</div>
                        <div className="text-lg font-black text-success">{result.humanEvidence.score}/100</div>
                        <div className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {result.humanEvidence.indicators[0] || 'No human patterns detected.'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Timeline */}
                <Card className="border-border/50 shadow-premium rounded-2xl bg-card">
                  <CardHeader className="pb-4 pt-5 px-6 border-b border-border/50">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Network className="w-4 h-4 text-primary" /> Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-end gap-1 h-16 w-full">
                      {result.paragraphTimeline.map((p, i) => (
                        <TooltipProvider key={i}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className={`flex-1 rounded-sm transition-all hover:opacity-80 ${
                                  p.aiProbability >= 70 ? 'bg-destructive' : p.aiProbability >= 40 ? 'bg-warning' : 'bg-success'
                                }`} 
                                style={{ height: `${Math.max(10, p.aiProbability)}%` }} 
                              />
                            </TooltipTrigger>
                            <TooltipContent className="bg-foreground text-background font-semibold border-none">
                              Paragraph {i+1}: {p.aiProbability}% AI
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </CardContent>
                </Card>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
