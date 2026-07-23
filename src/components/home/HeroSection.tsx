import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Zap, Shield, FileText, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { analyzeText, type TextAnalysisResult } from '@/pages/detector/detectionEngine';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const SAMPLE_TEXT = `Artificial intelligence has revolutionized the way businesses operate in the modern era. The implementation of machine learning algorithms enables companies to process vast amounts of data with unprecedented efficiency. Furthermore, natural language processing capabilities allow for automated content generation that is indistinguishable from human writing. Organizations leveraging these technologies experience substantial improvements in productivity metrics and operational cost reduction. The utilization of AI-powered tools represents a paradigm shift in how enterprises approach problem-solving and decision-making processes.`;

export default function HeroSection() {
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<TextAnalysisResult | null>(null);
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = (content.match(/\S+/g) || []).length;

  const handleDetect = async () => {
    if (content.length < 50) {
      toast.error('Please enter at least 50 characters for accurate detection.');
      return;
    }
    setIsAnalyzing(true);
    try {
      const res = await analyzeText(content);
      setResult(res);
    } catch (error: any) {
      toast.error(error.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleHumanize = () => {
    if (!content) return;
    navigate(`/humanizer?text=${encodeURIComponent(content)}`);
  };

  const insertSample = () => {
    setContent(SAMPLE_TEXT);
    setResult(null);
  };

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-background">
      {/* Premium Background Effects */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
      <div className="absolute -top-[300px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-20 bg-primary rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 text-center">
        <Badge variant="outline" className="mb-6 px-3 py-1.5 border-primary/30 bg-primary/5 text-primary text-sm font-semibold rounded-full inline-flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          The World's Most Advanced AI Detector
        </Badge>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-balance text-foreground mb-6 leading-tight">
          Unmask AI Content with <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">Enterprise Accuracy</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 text-pretty leading-relaxed">
          Detect ChatGPT, Claude, and Gemini with 99.8% precision. Humanize AI text to bypass detectors and preserve your SEO rankings.
        </p>

        {/* The Interactive Demo Box */}
        <div className="max-w-4xl mx-auto bg-card rounded-2xl shadow-premium border border-border/50 overflow-hidden text-left transition-all duration-500 hover:shadow-2xl">
          <div className="p-4 bg-muted/30 border-b border-border/50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={insertSample} className="text-xs font-medium rounded-lg">
                <FileText className="w-3.5 h-3.5 mr-1.5" /> Try Sample
              </Button>
            </div>
            <div className="text-xs font-semibold text-muted-foreground bg-background px-3 py-1.5 rounded-md border border-border/50 shadow-sm">
              {wordCount} / 2,000 words
            </div>
          </div>
          
          <div className="p-6 relative">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setResult(null);
              }}
              placeholder="Paste your text here to detect AI or humanize it..."
              className="min-h-[240px] resize-y border-none focus-visible:ring-0 p-0 text-base md:text-lg leading-relaxed shadow-none bg-transparent placeholder:text-muted-foreground/60"
            />

            {/* Results Overlay */}
            {result && (
              <div className="absolute top-0 right-0 w-full md:w-80 h-full bg-background/95 backdrop-blur-xl border-l border-border/50 p-6 flex flex-col justify-center animate-slide-in shadow-xl">
                <div className="text-center mb-6">
                  <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">AI Probability</div>
                  <div className={`text-6xl font-extrabold tracking-tighter ${result.aiProbability > 50 ? 'text-destructive' : 'text-success'}`}>
                    {result.aiProbability}%
                  </div>
                  <Badge className={`mt-4 px-3 py-1 text-sm ${result.aiProbability > 50 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`} variant="outline">
                    {result.riskLevel} Risk
                  </Badge>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-bold text-foreground">{result.confidenceScore}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${result.confidenceScore}%` }}></div>
                  </div>
                </div>

                <Button className="w-full font-bold shadow-md" onClick={() => navigate(`/detector?text=${encodeURIComponent(content)}`)}>
                  View Full Report <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>

          <div className="p-4 bg-muted/20 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-success" /> Secure</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Instant</span>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleHumanize}
                disabled={!content || isAnalyzing}
                className="flex-1 sm:flex-none border-primary/20 text-primary hover:bg-primary/5 font-bold rounded-xl"
              >
                Humanize
              </Button>
              <Button 
                size="lg" 
                onClick={handleDetect}
                disabled={!content || isAnalyzing}
                className="flex-1 sm:flex-none bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-hover transition-all"
              >
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Shield className="w-5 h-5 mr-2" /> Detect AI</>}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
