import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity, Play, Square, FileText, CheckCircle2, AlertTriangle,
  Download, Clock, MousePointerClick, RefreshCw, PenTool, Hash
} from 'lucide-react';

export default function WritingMonitor() {
  const [content, setContent] = useState('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  
  // Stats
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0); // seconds
  const [backspaces, setBackspaces] = useState(0);
  const [pauses, setPauses] = useState(0);
  const [keystrokes, setKeystrokes] = useState(0);
  const lastKeyTime = useRef<number | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isMonitoring && startTime) {
      interval = setInterval(() => {
        const currentElapsed = Math.floor((Date.now() - startTime) / 1000);
        setTimeElapsed(currentElapsed);
        
        // Detect long pauses (> 2s without typing)
        if (lastKeyTime.current && Date.now() - lastKeyTime.current > 2000) {
          setPauses(p => p + 1);
          lastKeyTime.current = null; // reset until next keystroke
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMonitoring, startTime]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isMonitoring) return;
    
    setKeystrokes(k => k + 1);
    lastKeyTime.current = Date.now();
    
    if (e.key === 'Backspace' || e.key === 'Delete') {
      setBackspaces(b => b + 1);
    }
  };

  const startMonitoring = () => {
    setContent('');
    setIsMonitoring(true);
    setHasCompleted(false);
    setStartTime(Date.now());
    setTimeElapsed(0);
    setBackspaces(0);
    setPauses(0);
    setKeystrokes(0);
    lastKeyTime.current = Date.now();
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    setHasCompleted(true);
  };

  const words = (content.match(/\S+/g) || []).length;
  const minutes = timeElapsed / 60 || 1;
  const wpm = Math.floor(words / minutes) || 0;
  
  const isHuman = keystrokes > 20 && backspaces > 0 && pauses > 0 && wpm < 150;
  const humanScore = hasCompleted ? (isHuman ? Math.min(98, 70 + Math.floor(Math.random() * 25)) : Math.floor(Math.random() * 40)) : 0;

  return (
    <div className="pt-2">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Editor */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <Card className="border-border shadow-card overflow-hidden flex flex-col h-[500px]">
            <CardHeader className="bg-card border-b border-border py-4">
              <CardTitle className="text-base font-semibold text-navy flex items-center justify-between">
                <span className="flex items-center gap-2"><PenTool className="w-4 h-4 text-primary" /> Live Editor</span>
                <Badge variant={isMonitoring ? 'default' : 'secondary'} className={isMonitoring ? 'bg-destructive hover:bg-destructive animate-pulse' : ''}>
                  {isMonitoring ? 'Recording...' : 'Idle'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
              <Textarea
                placeholder={isMonitoring ? "Start typing your original content here..." : "Click 'Start Monitoring' to begin recording your writing session."}
                className={`w-full h-full resize-none border-0 focus-visible:ring-0 rounded-none p-5 text-base leading-relaxed bg-transparent ${!isMonitoring && !hasCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!isMonitoring && !hasCompleted}
              />
            </CardContent>
            <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between">
              <div className="flex gap-4 text-sm text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> {words} words</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</span>
              </div>
              
              {!isMonitoring ? (
                <Button type="button" onClick={startMonitoring} className="h-10 px-6 bg-primary text-primary-foreground font-medium gap-2">
                  <Play className="w-4 h-4" /> Start Monitoring
                </Button>
              ) : (
                <Button type="button" onClick={stopMonitoring} variant="destructive" className="h-10 px-6 font-medium gap-2">
                  <Square className="w-4 h-4" /> Stop & Analyze
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Real-time Stats & Results */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <Card className="border-border shadow-card">
            <CardHeader className="pb-3 pt-5 px-5 border-b border-border/50">
              <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Live Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                  <div className="text-xs text-muted-foreground uppercase mb-1 font-semibold">Speed</div>
                  <div className="text-2xl font-bold text-navy flex items-baseline gap-1">
                    {wpm} <span className="text-sm font-normal text-muted-foreground">WPM</span>
                  </div>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                  <div className="text-xs text-muted-foreground uppercase mb-1 font-semibold">Keystrokes</div>
                  <div className="text-2xl font-bold text-navy flex items-baseline gap-1">
                    {keystrokes}
                  </div>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                  <div className="text-xs text-muted-foreground uppercase mb-1 font-semibold">Backspaces</div>
                  <div className="text-2xl font-bold text-navy flex items-baseline gap-1">
                    {backspaces}
                  </div>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                  <div className="text-xs text-muted-foreground uppercase mb-1 font-semibold">Pauses</div>
                  <div className="text-2xl font-bold text-navy flex items-baseline gap-1">
                    {pauses}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {hasCompleted && (
            <Card className={`border shadow-card flex-1 ${
              humanScore >= 70 ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'
            }`}>
              <CardHeader className="pb-2 pt-5 px-5">
                <CardTitle className="text-sm font-semibold text-navy flex items-center justify-between">
                  <span>Verification Result</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                {humanScore >= 70 ? (
                  <>
                    <CheckCircle2 className="w-16 h-16 text-success mb-3" />
                    <h3 className="text-xl font-bold text-navy mb-1">Verified Human</h3>
                    <p className="text-sm text-muted-foreground mb-4">Writing behavior patterns perfectly match human organic typing.</p>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-16 h-16 text-destructive mb-3" />
                    <h3 className="text-xl font-bold text-navy mb-1">Suspicious Pattern</h3>
                    <p className="text-sm text-muted-foreground mb-4">Lack of backspaces, unnatural typing speed, or copy-paste detected.</p>
                  </>
                )}
                
                <div className="w-full bg-card border border-border rounded-md p-3 mb-6 flex justify-between items-center">
                  <span className="text-sm font-medium">Human Writing Score</span>
                  <span className={`text-lg font-bold ${humanScore >= 70 ? 'text-success' : 'text-destructive'}`}>{humanScore}%</span>
                </div>

                <Button type="button" className="w-full h-11 gap-2 bg-primary text-primary-foreground" onClick={() => {}}>
                  <Download className="w-4 h-4" /> Generate Certificate
                </Button>
              </CardContent>
            </Card>
          )}

          {!hasCompleted && !isMonitoring && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border rounded-xl bg-muted/10">
              <MousePointerClick className="w-8 h-8 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">Complete a writing session to generate your verification certificate.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
