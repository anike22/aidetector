import { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { usePersonalization } from '@/contexts/PersonalizationContext';
import type { PersonalizedRecommendation, UserPrediction } from '@/types/personalization';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, X, Send, Lightbulb, TrendingUp, HelpCircle, Sparkles, MessageSquare } from 'lucide-react';

type Message = {
  role: 'assistant' | 'user';
  text: string;
  actions?: { label: string; to?: string; action?: () => void }[];
};

export function SmartAssistant() {
  const { profile, recommendations, predictions } = usePersonalization();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [greeted, setGreeted] = useState(false);

  const contextName = useMemo(() => {
    if (pathname.startsWith('/detector')) return 'detector';
    if (pathname.startsWith('/humanizer')) return 'humanizer';
    if (pathname.startsWith('/grammar')) return 'grammar';
    if (pathname.startsWith('/plagiarism')) return 'plagiarism';
    if (pathname.startsWith('/api')) return 'api';
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname === '/insights') return 'insights';
    return 'general';
  }, [pathname]);

  const topRec = recommendations.filter((r) => !r.dismissed && !r.accepted).sort((a, b) => b.score - a.score)[0];
  const topPrediction = predictions
    .filter((p) => ['upgrade', 'churn', 'support_risk'].includes(p.prediction_type))
    .sort((a, b) => b.score - a.score)[0];

  useEffect(() => {
    if (!open || greeted) return;
    const greeting = buildGreeting(contextName, topRec, topPrediction, profile);
    setMessages([{ role: 'assistant', text: greeting.text, actions: greeting.actions }]);
    setGreeted(true);
  }, [open, greeted, contextName, topRec, topPrediction, profile]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((m) => [...m, { role: 'user', text: userMsg }]);
    setInput('');
    setTimeout(() => {
      const reply = answerQuery(userMsg, contextName, profile, topRec);
      setMessages((m) => [...m, { role: 'assistant', text: reply.text, actions: reply.actions }]);
    }, 400);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-4 right-4 z-40 rounded-full shadow-sm"
          size="icon"
          aria-label="Open AI assistant"
        >
          <Bot className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full max-w-md sm:max-w-md flex flex-col">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> AI Assistant
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <Card className={`max-w-[85%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <CardContent className="p-3 text-sm space-y-2">
                  <p>{msg.text}</p>
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.actions.map((a, idx) =>
                        a.to ? (
                          <Button key={idx} size="sm" variant="secondary" asChild onClick={() => setOpen(false)}>
                            <Link to={a.to}>{a.label}</Link>
                          </Button>
                        ) : (
                          <Button key={idx} size="sm" variant="secondary" onClick={a.action}>
                            {a.label}
                          </Button>
                        )
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 space-y-3">
          {messages.length === 1 && (
            <div className="flex flex-wrap gap-2">
              <QuickChip label="What should I do next?" onClick={() => setInput('What should I do next?')} />
              <QuickChip label="Explain my score" onClick={() => setInput('Explain my score')} />
              <QuickChip label="Recommend a tool" onClick={() => setInput('Recommend a tool')} />
            </div>
          )}
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function QuickChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs px-2 py-1 rounded-full border border-border bg-muted hover:bg-muted/80"
    >
      {label}
    </button>
  );
}

function buildGreeting(
  context: string,
  rec: PersonalizedRecommendation | undefined,
  prediction: UserPrediction | undefined,
  profile: ReturnType<typeof usePersonalization>['profile']
): { text: string; actions: { label: string; to?: string; action?: () => void }[] } {
  const actions: { label: string; to?: string }[] = [];
  let text = 'Hi! I am here to help you get more from AIDetector.cx.';

  if (context === 'detector') {
    text = 'Looking at an AI detection result? I can explain the score or suggest how to humanize the text.';
    actions.push({ label: 'Open Humanizer', to: '/humanizer' });
  } else if (context === 'humanizer') {
    text = 'Humanizing content? I can suggest grammar polish next or explain why a section still looks AI-generated.';
    actions.push({ label: 'Grammar Check', to: '/grammar-checker' });
  } else if (context === 'grammar') {
    text = 'Grammar results look good. Consider checking originality with the plagiarism checker.';
    actions.push({ label: 'Plagiarism Check', to: '/plagiarism-checker' });
  } else if (context === 'api') {
    text = 'Need help with the API? I can point you to the docs or suggest the best plan for your usage.';
    actions.push({ label: 'API Docs', to: '/api/docs' });
  }

  if (rec) {
    text += ` Based on your activity, I recommend: ${rec.title}.`;
    if (rec.context_path) actions.push({ label: rec.title, to: rec.context_path });
  }

  if (prediction?.prediction_type === 'churn' && prediction.score > 60) {
    text += ' I noticed you have been away — anything I can help you rediscover?';
  }

  if (profile?.ai_confidence_score && profile.ai_confidence_score < 30) {
    text += ' I am still learning your preferences; the more you use the platform, the better my suggestions become.';
  }

  actions.push({ label: 'View insights', to: '/insights' });
  return { text, actions };
}

function answerQuery(
  query: string,
  context: string,
  profile: ReturnType<typeof usePersonalization>['profile'],
  rec: PersonalizedRecommendation | undefined
): { text: string; actions: { label: string; to?: string }[] } {
  const q = query.toLowerCase();
  const actions: { label: string; to?: string }[] = [];

  if (q.includes('score') || q.includes('result')) {
    if (context === 'detector') {
      return {
        text: 'The AI detection score reflects how likely the text was generated by an AI. Lower perplexity and burstiness usually mean higher AI probability.',
        actions: [{ label: 'How to reduce AI score', to: '/humanizer' }],
      };
    }
    if (context === 'plagiarism') {
      return {
        text: 'The plagiarism score shows the percentage of text that matches existing sources. A lower score means more original content.',
        actions: [{ label: 'Run another check', to: '/plagiarism-checker' }],
      };
    }
    return { text: 'Your score is compared against our models and benchmarks. I can explain specifics if you share the page you are on.', actions: [] };
  }

  if (q.includes('recommend') || q.includes('tool') || q.includes('next')) {
    const suggestion = rec?.title || 'Humanizer';
    actions.push({ label: suggestion, to: rec?.context_path || '/humanizer' });
    return { text: `Based on your usage, ${suggestion} is a great next step.`, actions };
  }

  if (q.includes('upgrade') || q.includes('plan') || q.includes('billing')) {
    actions.push({ label: 'Compare plans', to: '/pricing' });
    return { text: 'I only recommend upgrades when your usage justifies it. Compare plans to see what fits your workflow.', actions };
  }

  if (q.includes('help') || q.includes('support')) {
    actions.push({ label: 'Help center', to: '/help' });
    return { text: 'I can answer product questions. For account issues, contact support through the help center.', actions };
  }

  return {
    text: 'I understand. Try asking me to explain a score, recommend a tool, or suggest your next best action.',
    actions: [{ label: 'View dashboard', to: '/dashboard' }],
  };
}
