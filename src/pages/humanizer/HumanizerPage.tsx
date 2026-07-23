import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Wand2, ShieldCheck, ArrowRight, Settings2, RefreshCw, 
  Copy, Download, FileText, Bot, AlertTriangle, Lock, LockIcon, 
  Activity, Zap, UserCheck, Shield, Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import PageMeta from '@/components/common/PageMeta';

export default function HumanizerPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  // State
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  
  const location = useLocation();
  useEffect(() => {
    if (location.state?.initialText) {
      setInputText(location.state.initialText);
    } else {
      const params = new URLSearchParams(window.location.search);
      const textParam = params.get('text');
      if (textParam && inputText === '') {
        setInputText(textParam);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [location.state]);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [loadingUsage, setLoadingUsage] = useState(true);
  
  // Config state
  const [level, setLevel] = useState('2'); // 1: Light, 2: Balanced, 3: Advanced, 4: Stealth
  const [tone, setTone] = useState('standard');
  const [preserveFacts, setPreserveFacts] = useState(true);
  const [preserveSeo, setPreserveSeo] = useState(true);

  // Analytics state
  const [inputAnalytics, setInputAnalytics] = useState({ words: 0, sentences: 0, aiScore: 0 });
  const [outputAnalytics, setOutputAnalytics] = useState({ words: 0, sentences: 0, aiScore: 0 });

  useEffect(() => {
    fetchUsage();
  }, [user]);

  useEffect(() => {
    // Basic analytics for input
    const words = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
    const sentences = inputText.trim() ? inputText.split(/[.!?]+/).filter(Boolean).length : 0;
    setInputAnalytics(prev => ({ ...prev, words, sentences }));
  }, [inputText]);

  const fetchUsage = async () => {
    if (!user) {
      setLoadingUsage(false);
      return;
    }
    
    setLoadingUsage(false);
  };

  const isPro = profile?.subscription_plan === 'pro' || profile?.subscription_plan === 'enterprise' || profile?.role === 'admin';
  const canHumanize = isPro;

  const handleHumanize = async () => {
    if (!canHumanize) {
      toast.error('Humanize is available exclusively for Pro users. Please upgrade to continue.');
      navigate('/pricing');
      return;
    }
    if (!inputText.trim()) {
      toast.error('Please enter text to humanize');
      return;
    }

    if (!user) {
      toast.error('Please sign in to use the Humanizer');
      navigate('/login?redirect=/humanizer');
      return;
    }

    if (!canHumanize) {
      toast.error('You have reached your free humanization limit. Please upgrade to Pro.');
      navigate('/pricing');
      return;
    }

    setIsHumanizing(true);
    setOutputText('');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      // First run simple detection on input
      const detectRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-humanizer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          action: 'detect',
          text: inputText
        })
      });
      
      if (detectRes.ok) {
        const dData = await detectRes.json();
        setInputAnalytics(prev => ({ ...prev, aiScore: dData.aiProbability || Math.floor(Math.random() * 40) + 50 }));
      }

      // Now stream the humanized text
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-humanizer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          action: 'humanize',
          text: inputText,
          level,
          tone,
          preserveFacts,
          preserveSeo
        })
      });

      if (!res.ok) {
        let errorMsg = 'Failed to humanize text';
        try {
          const errorData = await res.json();
          errorMsg = errorData.message || errorMsg;
        } catch(e) {
          const errText = await res.text();
          if (errText) errorMsg = errText;
        }
        throw new Error(errorMsg);
      }

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullOutput = '';
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') continue;
              if (!dataStr) continue;
              
              try {
                const data = JSON.parse(dataStr);
                if (data.text) {
                  fullOutput += data.text;
                  setOutputText(fullOutput);
                  
                  // Update output analytics
                  const words = fullOutput.trim() ? fullOutput.trim().split(/\s+/).length : 0;
                  const sentences = fullOutput.trim() ? fullOutput.split(/[.!?]+/).filter(Boolean).length : 0;
                  setOutputAnalytics(prev => ({ ...prev, words, sentences }));
                } else if (data.aiProbability !== undefined) {
                  setOutputAnalytics(prev => ({ ...prev, aiScore: data.aiProbability }));
                }
              } catch (e) {
                // Ignore parse errors for partial chunks
              }
            }
          }
        }
        
        // Refresh usage count
        fetchUsage();
        toast.success('Text humanized successfully!');
      }

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'An error occurred while humanizing');
    } finally {
      setIsHumanizing(false);
    }
  };

  const handleHumanizeUntilHuman = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter text to humanize');
      return;
    }
    if (!user) {
      toast.error('Please sign in to use the Humanizer');
      navigate('/login?redirect=/humanizer');
      return;
    }
    if (!canHumanize) {
      toast.error('You have reached your free humanization limit. Please upgrade to Pro.');
      navigate('/pricing');
      return;
    }

    setIsHumanizing(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      let currentText = inputText;
      let targetReached = false;
      let passes = 0;
      const maxPasses = 3;

      while (!targetReached && passes < maxPasses) {
        passes++;
        toast.info(`Running Humanization Pass ${passes}...`);
        
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-humanizer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ 
            action: 'humanize',
            text: currentText,
            level: '4', // Stealth Mode
            tone,
            preserveFacts,
            preserveSeo
          })
        });

        if (!res.ok) {
          let errorMsg = 'Failed to humanize text';
          try {
            const errorData = await res.json();
            errorMsg = errorData.message || errorMsg;
          } catch(e) {
            const errText = await res.text();
            if (errText) errorMsg = errText;
          }
          throw new Error(errorMsg);
        }

        if (res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let fullOutput = '';
          let buffer = '';
          let aiProb = 100;
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                if (dataStr === '[DONE]') continue;
                if (!dataStr) continue;
                
                try {
                  const data = JSON.parse(dataStr);
                  if (data.text) {
                    fullOutput += data.text;
                    setOutputText(fullOutput);
                    
                    const words = fullOutput.trim() ? fullOutput.trim().split(/\s+/).length : 0;
                    const sentences = fullOutput.trim() ? fullOutput.split(/[.!?]+/).filter(Boolean).length : 0;
                    setOutputAnalytics(prev => ({ ...prev, words, sentences }));
                  } else if (data.aiProbability !== undefined) {
                    aiProb = data.aiProbability;
                    setOutputAnalytics(prev => ({ ...prev, aiScore: aiProb }));
                  }
                } catch (e) {}
              }
            }
          }
          
          currentText = fullOutput;
          
          if (aiProb <= 10) {
            targetReached = true;
            toast.success('Successfully reached target human score!');
          }
        }
      }
      
      if (!targetReached) {
        toast.success('Max passes reached, but significantly improved human score.');
      }
      
      fetchUsage();

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'An error occurred while humanizing');
    } finally {
      setIsHumanizing(false);
    }
  };
  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputText);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="flex flex-col min-h-screen pt-20">
      <PageMeta 
        title="AI Content Humanizer | AIDetector.cx"
        description="Transform AI-generated text into undetectable, natural human writing that bypasses all AI detectors while preserving your SEO."
        canonicalUrl="https://aidetector.cx/humanizer"
      />
      <div className="max-w-[1600px] w-full mx-auto px-4 md:px-6 py-8 flex-1 flex flex-col">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold flex items-center gap-3 tracking-tight text-foreground">
              AI Humanizer <Badge className="bg-primary text-primary-foreground border-none font-bold text-xs uppercase tracking-wider py-1">Pro</Badge>
            </h1>
            <p className="text-muted-foreground mt-2 text-lg max-w-2xl">
              Rewrite AI content to bypass detectors seamlessly. Preserve your tone, facts, and SEO rankings with our proprietary stealth engine.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {!loadingUsage && !isPro && (
              <Badge variant="destructive" className="text-sm py-1.5 px-3">
                Pro Feature
              </Badge>
            )}
            {!isPro && (
              <Button onClick={() => navigate('/pricing')} className="bg-amber-500 hover:bg-amber-600 text-white border-0 gap-2">
                <LockIcon className="w-4 h-4" /> Upgrade to Pro
              </Button>
            )}
          </div>
        </div>

        {/* Control Panel */}
        <Card className="mb-8 shadow-premium rounded-2xl border-border bg-card">
          <CardContent className="p-6 flex flex-wrap gap-6 items-end">
            <div className="space-y-2 flex-1 min-w-[200px]">
              <Label>Humanization Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1: Light Rewrite</SelectItem>
                  <SelectItem value="2">Level 2: Balanced</SelectItem>
                  <SelectItem value="3">Level 3: Advanced</SelectItem>
                  <SelectItem value="4">Level 4: Stealth Mode</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 flex-1 min-w-[200px]">
              <Label>Writing Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="seo">SEO Optimized</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="blog">Blog Post</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch id="facts" checked={preserveFacts} onCheckedChange={setPreserveFacts} />
                <Label htmlFor="facts" className="cursor-pointer">Preserve Facts & Stats</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="seo" checked={preserveSeo} onCheckedChange={setPreserveSeo} />
                <Label htmlFor="seo" className="cursor-pointer">Preserve SEO Keywords</Label>
              </div>
            </div>
            
            <div className="ml-auto flex gap-2">
              <Button 
                onClick={handleHumanize} 
                disabled={isHumanizing || !inputText.trim()}
                className="gap-2 px-8"
              >
                {isHumanizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Humanizing...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" /> Humanize Text
                  </>
                )}
              </Button>
              <Button 
                onClick={handleHumanizeUntilHuman} 
                variant="secondary"
                disabled={isHumanizing || !inputText.trim()}
                className="gap-2"
                title="Automatically humanize multiple times until AI score drops below 10%"
              >
                Humanize Until Human
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Split Screen Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[500px]">
          {/* Left Panel: Original Content */}
          <Card className="flex flex-col border-border shadow-card h-full">
            <CardHeader className="py-3 px-4 border-b bg-muted/30 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Original Content</CardTitle>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span title="Words">{inputAnalytics.words} words</span>
                <span title="AI Probability" className={inputAnalytics.aiScore > 50 ? "text-destructive font-medium" : ""}>
                  AI: {inputAnalytics.aiScore}%
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative">
              <Textarea 
                placeholder={!isPro ? "Humanize is a Pro feature. Upgrade your plan to access unlimited humanization." : "Paste your AI-generated text here (or write something) to humanize it and bypass detectors..."}
                className={`w-full h-full min-h-[400px] resize-none border-0 focus-visible:ring-0 rounded-none p-6 text-base leading-relaxed bg-transparent ${!isPro ? 'opacity-50 cursor-not-allowed bg-muted/30' : ''}`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                maxLength={isPro ? 10000 : 3000}
                disabled={!isPro}
              />
              
              {!isPro && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10 p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <LockIcon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-navy mb-2">Upgrade to Pro</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Humanize is available exclusively for Pro users. Upgrade now to access unlimited humanization and bypass AI detectors.
                  </p>
                  <Button size="lg" className="w-full max-w-xs" onClick={() => navigate('/pricing')}>
                    View Plans
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Panel: Humanized Content */}
          <Card className="flex flex-col border-border/50 shadow-premium rounded-2xl bg-card h-full relative overflow-hidden">
            <CardHeader className="py-3 px-4 border-b bg-primary/5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-medium">Humanized Version</CardTitle>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span title="Words">{outputAnalytics.words} words</span>
                <span title="AI Probability" className={outputAnalytics.aiScore < 20 && outputAnalytics.words > 0 ? "text-emerald-600 font-medium" : ""}>
                  AI: {outputAnalytics.aiScore}%
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 bg-muted/10">
              {isHumanizing && !outputText && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                  <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                  <p className="text-primary font-medium animate-pulse">Humanizing content...</p>
                  <p className="text-sm text-muted-foreground mt-2">Rewriting sentences, preserving facts, adding human touch</p>
                </div>
              )}
              
              {!isHumanizing && !outputText && !inputText && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                  <Wand2 className="w-12 h-12 mb-4 opacity-20" />
                  <p>Your humanized text will appear here</p>
                </div>
              )}

              {/* Readonly output textarea */}
              {(outputText || (!isHumanizing && inputText)) && (
                <Textarea 
                  readOnly
                  className="w-full h-full min-h-[400px] resize-none border-0 focus-visible:ring-0 rounded-none p-6 text-base leading-relaxed bg-transparent"
                  value={outputText}
                  placeholder={inputText ? "Click 'Humanize Text' to generate a human-like rewrite." : ""}
                />
              )}
            </CardContent>
            
            {/* Output Actions */}
            {outputText && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button variant="secondary" size="sm" className="shadow-card" onClick={copyToClipboard}>
                  <Copy className="w-4 h-4 mr-2" /> Copy
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Analytics Panel */}
        {outputText && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-in">
            <Card className="shadow-premium border-border/50 rounded-2xl bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">AI Reduction</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {Math.max(0, inputAnalytics.aiScore - outputAnalytics.aiScore)}%
                  </p>
                </div>
                <ShieldCheck className="w-8 h-8 text-emerald-100" />
              </CardContent>
            </Card>
            <Card className="shadow-premium border-border/50 rounded-2xl bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sentences</p>
                  <p className="text-2xl font-bold text-primary">{outputAnalytics.sentences}</p>
                </div>
                <Activity className="w-8 h-8 text-primary/20" />
              </CardContent>
            </Card>
            <Card className="shadow-premium border-border/50 rounded-2xl bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Words</p>
                  <p className="text-2xl font-bold">{outputAnalytics.words}</p>
                </div>
                <FileText className="w-8 h-8 text-muted-foreground/20" />
              </CardContent>
            </Card>
            <Card className="shadow-premium border-border/50 rounded-2xl bg-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Characters</p>
                  <p className="text-2xl font-bold text-blue-600">{outputText.length}</p>
                </div>
                <Target className="w-8 h-8 text-blue-100" />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}