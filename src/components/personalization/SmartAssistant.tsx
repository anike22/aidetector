import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { usePersonalization } from '@/contexts/PersonalizationContext';
import type { PersonalizedRecommendation, UserPrediction } from '@/types/personalization';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  X,
  Send,
  Lightbulb,
  TrendingUp,
  HelpCircle,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  Zap,
  ArrowRight,
  ExternalLink,
  Lock,
  RefreshCw,
} from 'lucide-react';

export type AssistantMessage = {
  role: 'assistant' | 'user';
  text: string;
  actions?: { label: string; to?: string; action?: () => void }[];
  timestamp?: string;
};

export type AssistantContext =
  | 'detector_text'
  | 'detector_image'
  | 'detector_video'
  | 'humanizer'
  | 'summarizer'
  | 'seo'
  | 'plagiarism'
  | 'word_counter'
  | 'authorship'
  | 'essay_studio'
  | 'pricing'
  | 'api'
  | 'security'
  | 'dashboard'
  | 'general';

/**
 * Accurately classifies the user's current route to supply specialized assistance
 */
export function resolveAssistantContext(pathname: string): AssistantContext {
  if (pathname === '/' || pathname === '/detector') return 'detector_text';
  if (pathname.startsWith('/ai-image-detector') || pathname.startsWith('/image-detector')) return 'detector_image';
  if (
    pathname.startsWith('/ai-video-detector') ||
    pathname.startsWith('/video-detector') ||
    pathname.startsWith('/studies')
  )
    return 'detector_video';
  if (pathname.startsWith('/humanizer')) return 'humanizer';
  if (pathname.startsWith('/ai-summarizer')) return 'summarizer';
  if (pathname.startsWith('/seo')) return 'seo';
  if (pathname.startsWith('/plagiarism')) return 'plagiarism';
  if (pathname.startsWith('/word-counter')) return 'word_counter';
  if (
    pathname.startsWith('/verified-authorship') ||
    pathname.startsWith('/authorship') ||
    pathname.startsWith('/verify')
  )
    return 'authorship';
  if (pathname.startsWith('/essay-studio') || pathname.startsWith('/essay-template')) return 'essay_studio';
  if (pathname.startsWith('/pricing')) return 'pricing';
  if (pathname.startsWith('/api') || pathname.startsWith('/developer') || pathname.startsWith('/webhooks')) return 'api';
  if (pathname.startsWith('/security')) return 'security';
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/insights')) return 'dashboard';
  return 'general';
}

/**
 * Builds accurate contextual greetings and high-value initial action links
 */
export function buildAssistantGreeting(
  context: AssistantContext,
  rec: PersonalizedRecommendation | undefined,
  prediction: UserPrediction | undefined,
  profile: ReturnType<typeof usePersonalization>['profile']
): { text: string; actions: { label: string; to?: string }[]; quickChips: string[] } {
  const actions: { label: string; to?: string }[] = [];
  let text = 'Hello! I am your AIDetector.cx Assistant. How can I assist with your AI detection, humanization, or content verification today?';
  let quickChips = ['Explain AI detection score', 'Recommend best tool for me', 'How do trial checks work?'];

  switch (context) {
    case 'detector_text':
      text =
        'Welcome to AI Text Detection! Our 98.7% accurate multi-model engine checks for GPT-5, ChatGPT, Claude, Gemini, and DeepSeek signatures using perplexity and burstiness analysis.';
      actions.push({ label: 'Humanize AI Text', to: '/humanizer' });
      actions.push({ label: 'Check Plagiarism', to: '/plagiarism-checker' });
      quickChips = ['How to interpret my score?', 'How to lower AI probability?', 'What models are detected?'];
      break;

    case 'detector_image':
      text =
        'Welcome to AI Image Detection! I can explain synthetic artifact heatmaps, generative frequency patterns (Midjourney, DALL-E, Stable Diffusion), or EXIF metadata integrity.';
      actions.push({ label: 'Detect Video / Deepfakes', to: '/ai-video-detector' });
      quickChips = ['Explain image heatmap', 'Can compression cause false positives?', 'What image formats work?'];
      break;

    case 'detector_video':
      text =
        'Welcome to AI Video & Live-Call Deepfake Protection! Monitor Zoom/Teams/Meet streams in real-time, analyze participant video grid tiles, and verify synthetic facial warping without call interruptions.';
      actions.push({ label: 'Live Call Shield Guide', to: '/ai-video-detector' });
      actions.push({ label: 'Upload Video File', to: '/ai-video-detector' });
      quickChips = ['How does live call monitoring work?', 'Explain video compression artifacts', 'What are video credit costs?'];
      break;

    case 'humanizer':
      text =
        'Welcome to the Humanizer! I can help you restructure AI-flagged sentences into natural, engaging human prose while preserving your exact meaning and citations.';
      actions.push({ label: 'Check AI Score', to: '/' });
      actions.push({ label: 'Grammar & Word Counter', to: '/word-counter' });
      quickChips = ['How does the Humanizer work?', 'Does Humanizer bypass turnitin/GPTZero?', 'Compare Humanizer modes'];
      break;

    case 'summarizer':
      text =
        'Welcome to AI Summarizer! Paste text, YouTube links, web URLs, or upload PDF/Word files to generate bullet takeaways, executive briefs, or action item lists.';
      actions.push({ label: 'Summarize Text or URL', to: '/ai-summarizer' });
      quickChips = ['How to summarize YouTube videos?', 'Supported document formats', 'How to export summaries?'];
      break;

    case 'seo':
      text =
        'Welcome to the SEO Writing Assistant! Optimize keyword density, readability scores, and search intent while maintaining natural human authenticity.';
      actions.push({ label: 'Open SEO Assistant', to: '/seo-assistant' });
      quickChips = ['How is SEO score calculated?', 'What is keyword density limit?', 'Check content readability'];
      break;

    case 'plagiarism':
      text =
        'Welcome to the Plagiarism Checker! Cross-reference your writing across academic repositories, open web sources, and journals.';
      actions.push({ label: 'Verify Authorship', to: '/verified-authorship/register' });
      quickChips = ['What is a good originality score?', 'Are submissions stored in database?', 'How does plagiarism differ from AI?'];
      break;

    case 'word_counter':
      text =
        'Welcome to Word & Grammar Counter! View character counts, reading time, speaking pace, and readability grade level in real-time.';
      actions.push({ label: 'Detect AI Content', to: '/' });
      quickChips = ['How is reading time calculated?', 'Explain Flesch-Kincaid score', 'Grammar assistant features'];
      break;

    case 'authorship':
      text =
        'Welcome to Verified Authorship! Cryptographically timestamp your original writing, generate public verification tracking codes, and issue verifiable certificates.';
      actions.push({ label: 'Register Content', to: '/verified-authorship/register' });
      actions.push({ label: 'Verify a Tracking Code', to: '/verified-authorship/verify' });
      quickChips = ['How does Verified Authorship work?', 'How to look up a certificate?', 'Is my intellectual property protected?'];
      break;

    case 'essay_studio':
      text =
        'Welcome to Essay Studio! Guided brainstorming, structured drafting, citation formatting, and teacher assignment portals with integrated originality checks.';
      actions.push({ label: 'Start New Essay', to: '/essay-studio' });
      quickChips = ['How to use teacher mode?', 'Format MLA/APA citations', 'Run originality check'];
      break;

    case 'pricing':
      text =
        'Explore AIDetector.cx plans! Every new user gets 5 introductory trial checks (1 as guest, +4 upon free signup). Paid plans include high-volume credits and API access.';
      actions.push({ label: 'Compare Plans', to: '/pricing' });
      actions.push({ label: 'Contact Enterprise', to: '/contact' });
      quickChips = ['How do trial checks work?', 'What are credit rates per tool?', 'Is there an API subscription?'];
      break;

    case 'api':
      text =
        'Welcome to the Developer API Portal! Integrate AI text detection, humanization, and video forensics into your applications with our high-throughput REST API.';
      actions.push({ label: 'View API Documentation', to: '/api/docs' });
      actions.push({ label: 'API Key Dashboard', to: '/api/dashboard' });
      quickChips = ['API rate limits and endpoints', 'How to authenticate API calls', 'Webhook notifications'];
      break;

    case 'security':
      text =
        'Security & Privacy: AIDetector.cx operates under a strict Zero-Retention Policy. All scans are processed in volatile memory with no data training or unauthorized storage.';
      actions.push({ label: 'Privacy Policy', to: '/privacy' });
      actions.push({ label: 'Contact Security Team', to: '/contact' });
      quickChips = ['Is my data saved or stored?', 'Zero-retention policy details', 'GDPR and compliance standards'];
      break;

    case 'dashboard':
      text =
        'Welcome to your Workspace Dashboard! Review your recent scans, track credit balances, manage shared team reports, and monitor usage trends.';
      actions.push({ label: 'View Credits & Plan', to: '/pricing' });
      quickChips = ['How to share reports with team?', 'Export detection history', 'Upgrade credit allowance'];
      break;

    default:
      actions.push({ label: 'AI Text Detector', to: '/' });
      actions.push({ label: 'Humanizer', to: '/humanizer' });
      actions.push({ label: 'Explore All Tools', to: '/tools' });
      break;
  }

  if (rec && rec.context_path && !actions.some((a) => a.to === rec.context_path)) {
    actions.push({ label: rec.title, to: rec.context_path });
  }

  return { text, actions, quickChips };
}

/**
 * Intelligent Knowledge Base & Query Answering Engine
 * Grounded in exact platform features, accurate credit rates, zero-retention policies, and valid URLs.
 */
export function answerAssistantQuery(
  query: string,
  context: AssistantContext,
  profile?: ReturnType<typeof usePersonalization>['profile'],
  rec?: PersonalizedRecommendation
): { text: string; actions: { label: string; to?: string }[] } {
  const q = query.toLowerCase().trim();
  const actions: { label: string; to?: string }[] = [];

  // 1. AI Detection Scores, Perplexity, Burstiness & Interpretation
  if (
    q.includes('score') ||
    q.includes('interpret') ||
    q.includes('result') ||
    q.includes('perplexity') ||
    q.includes('burstiness') ||
    q.includes('accuracy') ||
    q.includes('false positive')
  ) {
    if (context === 'detector_video' || q.includes('video') || q.includes('deepfake')) {
      actions.push({ label: 'Live Video Detector', to: '/ai-video-detector' });
      actions.push({ label: 'Video False Positive Guide', to: '/studies/authentic-video-false-positives' });
      return {
        text: 'Video detection evaluates facial boundary blending, frequency domain compression artifacts, and temporal motion cadence. Heavy WhatsApp/TikTok re-encoding can sometimes increase noise floor, so our Balanced and Forensic modes adjust thresholds accordingly.',
        actions,
      };
    }

    if (context === 'detector_image' || q.includes('image')) {
      actions.push({ label: 'AI Image Detector', to: '/ai-image-detector' });
      return {
        text: 'Image detection analyzes generative noise residuals, sub-pixel symmetry, and model-specific latent patterns (Midjourney, Stable Diffusion, DALL-E) to produce a 0–100% synthetic probability and heatmap.',
        actions,
      };
    }

    actions.push({ label: 'Humanize AI Text', to: '/humanizer' });
    actions.push({ label: 'Understanding Scores Guide', to: '/guides/understanding-ai-detection-scores' });
    return {
      text: 'AI Text Detection scores measure probability based on Perplexity (word choice unpredictability) and Burstiness (sentence structure variation):\n• 0%–25%: Highly Human / Authentic\n• 26%–65%: Mixed / Lightly AI-assisted\n• 66%–100%: High AI Probability (GPT-5, ChatGPT, Claude, DeepSeek)\nOur benchmark achieves 98.7% precision across 12+ languages with <1.2% false positives.',
      actions,
    };
  }

  // 2. Humanizer & Lowering AI Score
  if (
    q.includes('humaniz') ||
    q.includes('lower') ||
    q.includes('bypass') ||
    q.includes('reduce') ||
    q.includes('rewrite') ||
    q.includes('undetect')
  ) {
    actions.push({ label: 'Open Humanizer', to: '/humanizer' });
    actions.push({ label: 'Grammar Polish', to: '/word-counter' });
    return {
      text: 'The AIDetector.cx Humanizer re-engineers synthetic text by introducing natural syntactic variety, irregular clause transitions, and organic cadence without altering your original argument or citations. You can compare pre- and post-humanization detection scores side-by-side.',
      actions,
    };
  }

  // 3. Live Call Deepfake Protection & Video Monitoring
  if (
    q.includes('live call') ||
    q.includes('zoom') ||
    q.includes('meet') ||
    q.includes('teams') ||
    q.includes('whatsapp') ||
    q.includes('call monitoring') ||
    q.includes('challenge')
  ) {
    actions.push({ label: 'Live-Call Protection', to: '/ai-video-detector' });
    return {
      text: 'Our Live-Call Deepfake Protection observes active video calls via window/tab sharing (getDisplayMedia on Desktop or MediaProjection companion on Android). It features:\n1. 2x2 Participant Grid ROI cropping to isolate target speakers.\n2. Non-intrusive stream isolation that never pauses or locks your meeting camera/mic.\n3. Interactive biometric challenge-response (spoken codes, 45° head turn, hand wave) to uncover generative face swaps in real time.',
      actions,
    };
  }

  // 4. Summarizer & Document Extraction
  if (
    q.includes('summariz') ||
    q.includes('summary') ||
    q.includes('youtube') ||
    q.includes('pdf') ||
    q.includes('article') ||
    q.includes('extract')
  ) {
    actions.push({ label: 'Open AI Summarizer', to: '/ai-summarizer' });
    return {
      text: 'The AI Summarizer processes text, web URLs, YouTube links, and PDF/DOCX uploads. It supports 3 distinct output formats (Executive Brief, Key Bullet Takeaways, Detailed Action Plan) and saves your session history locally for instant restoration and export.',
      actions,
    };
  }

  // 5. Credits, Trials, Pricing & Billing
  if (
    q.includes('credit') ||
    q.includes('price') ||
    q.includes('pricing') ||
    q.includes('trial') ||
    q.includes('free') ||
    q.includes('plan') ||
    q.includes('cost') ||
    q.includes('subscri')
  ) {
    actions.push({ label: 'View Pricing & Plans', to: '/pricing' });
    actions.push({ label: 'Contact Enterprise', to: '/contact' });
    return {
      text: '• Trial Checks: Every new visitor receives 5 one-time introductory trial checks (1 as a guest, +4 unlocked upon free account signup).\n• Standard Text Check: 1 credit per 250 words.\n• SEO Assistant: 3 credits per 1,000 words.\n• Image / Video Forensics: 5 credits per image or minute of video.\n• Humanizer: 2 credits per 250 words.\nSubscribers receive monthly credit allowances with priority processing and team collaboration.',
      actions,
    };
  }

  // 6. Privacy, Security & Zero-Retention
  if (
    q.includes('privacy') ||
    q.includes('retention') ||
    q.includes('security') ||
    q.includes('store') ||
    q.includes('save') ||
    q.includes('train') ||
    q.includes('safe') ||
    q.includes('gdpr')
  ) {
    actions.push({ label: 'Privacy Policy', to: '/privacy' });
    actions.push({ label: 'Security Center', to: '/security' });
    return {
      text: 'AIDetector.cx enforces a strict Zero-Retention Policy:\n• Analysis runs in volatile memory and is purged immediately upon completion.\n• No documents, video streams, audio feeds, or text submissions are ever used to train AI models or shared with third parties.\n• Session history in tools like the Summarizer is stored strictly in your local browser storage.',
      actions,
    };
  }

  // 7. Verified Authorship & Certificates
  if (
    q.includes('author') ||
    q.includes('certificate') ||
    q.includes('copyright') ||
    q.includes('tracking code') ||
    q.includes('timestamp') ||
    q.includes('ip')
  ) {
    actions.push({ label: 'Register Authorship', to: '/verified-authorship/register' });
    actions.push({ label: 'Verify a Certificate', to: '/verified-authorship/verify' });
    return {
      text: 'Verified Authorship creates an immutable cryptographic timestamp of your original content before publication. You receive a verifiable public tracking code, QR badge, and downloadable authenticity certificate to prove prior ownership in copyright disputes.',
      actions,
    };
  }

  // 8. Plagiarism & Originality
  if (q.includes('plagiarism') || q.includes('original') || q.includes('duplicate') || q.includes('cite')) {
    actions.push({ label: 'Plagiarism Checker', to: '/plagiarism-checker' });
    return {
      text: 'The Plagiarism Checker scans billions of web pages, scholarly articles, and open journals to identify verbatim matches and paraphrased overlap, providing detailed percentage breakdowns and direct source links.',
      actions,
    };
  }

  // 9. SEO Assistant & Readability
  if (q.includes('seo') || q.includes('keyword') || q.includes('ranking') || q.includes('density') || q.includes('eeat')) {
    actions.push({ label: 'SEO Writing Assistant', to: '/seo-assistant' });
    actions.push({ label: 'SEO Dashboard', to: '/seo-dashboard' });
    return {
      text: 'The SEO Writing Assistant evaluates keyword frequency, structural headings, search intent match, and Google EEAT signals while flagging keyword stuffing and synthetic readability anomalies in real-time.',
      actions,
    };
  }

  // 10. API, Webhooks & Developer Integration
  if (q.includes('api') || q.includes('webhook') || q.includes('sdk') || q.includes('endpoint') || q.includes('developer')) {
    actions.push({ label: 'API Documentation', to: '/api/docs' });
    actions.push({ label: 'API Dashboard', to: '/api/dashboard' });
    return {
      text: 'Our REST API allows seamless integration into your CMS, LMS, or security pipeline with high throughput and sub-second latency. Endpoints include /api/v1/detect, /api/v1/humanize, and /api/v1/summarize with webhooks for batch processing.',
      actions,
    };
  }

  // 11. Supported Models (GPT, Claude, Gemini, DeepSeek, etc.)
  if (
    q.includes('model') ||
    q.includes('chatgpt') ||
    q.includes('gpt-4') ||
    q.includes('gpt-5') ||
    q.includes('claude') ||
    q.includes('gemini') ||
    q.includes('deepseek') ||
    q.includes('llama')
  ) {
    actions.push({ label: 'Run Text Detection Scan', to: '/' });
    return {
      text: 'AIDetector.cx detects content generated by all major LLMs, including:\n• OpenAI: GPT-5, GPT-4o, GPT-4, ChatGPT, o1, o3-mini\n• Anthropic: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku\n• Google: Gemini 1.5 Pro, Gemini 2.0 Flash\n• DeepSeek: DeepSeek-V3, DeepSeek-R1\n• Open Weights: Meta LLaMA 3, Mistral, Qwen',
      actions,
    };
  }

  // 12. Help, Support & Contact
  if (q.includes('help') || q.includes('support') || q.includes('contact') || q.includes('bug') || q.includes('issue')) {
    actions.push({ label: 'Contact Support', to: '/contact' });
    actions.push({ label: 'Knowledge Guides', to: '/guides' });
    return {
      text: 'For assistance, troubleshooting, or enterprise licensing, our dedicated engineering and customer success team is available 24/7. Submit a ticket via our Contact page or browse our step-by-step guides.',
      actions,
    };
  }

  // 13. Tool Recommendations
  if (q.includes('recommend') || q.includes('next') || q.includes('suggest') || q.includes('what should i do')) {
    const suggestedTool = rec?.title || (context === 'detector_text' ? 'Humanizer' : 'AI Text Detector');
    const suggestedPath = rec?.context_path || (context === 'detector_text' ? '/humanizer' : '/');
    actions.push({ label: suggestedTool, to: suggestedPath });
    actions.push({ label: 'Explore All Tools', to: '/tools' });
    return {
      text: `Based on your current session in ${context.replace(/_/g, ' ')}, we recommend exploring ${suggestedTool} next.`,
      actions,
    };
  }

  // Default fallback with helpful choices
  actions.push({ label: 'AI Text Detector', to: '/' });
  actions.push({ label: 'Humanizer', to: '/humanizer' });
  actions.push({ label: 'AI Video / Deepfakes', to: '/ai-video-detector' });
  actions.push({ label: 'All Tools', to: '/tools' });

  return {
    text: 'I can help with AI text/image/video detection, Humanizer rewrites, AI Summarizer, SEO analysis, Plagiarism checking, pricing, and Zero-Retention privacy. What would you like to explore?',
    actions,
  };
}

export function SmartAssistant() {
  const { profile, recommendations, predictions } = usePersonalization();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const contextName = useMemo(() => resolveAssistantContext(pathname), [pathname]);

  const topRec = useMemo(
    () => recommendations.filter((r) => !r.dismissed && !r.accepted).sort((a, b) => b.score - a.score)[0],
    [recommendations]
  );
  const topPrediction = useMemo(
    () =>
      predictions
        .filter((p) => ['upgrade', 'churn', 'support_risk'].includes(p.prediction_type))
        .sort((a, b) => b.score - a.score)[0],
    [predictions]
  );

  // Initialize greeting when opened or context changes
  useEffect(() => {
    if (!open) return;
    if (messages.length === 0) {
      const greeting = buildAssistantGreeting(contextName, topRec, topPrediction, profile);
      setMessages([
        {
          role: 'assistant',
          text: greeting.text,
          actions: greeting.actions,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setActiveChips(greeting.quickChips);
    }
  }, [open, contextName, topRec, topPrediction, profile, messages.length]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (userText?: string) => {
    const textToSend = userText || input;
    if (!textToSend.trim()) return;

    const userMsg: AssistantMessage = {
      role: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((m) => [...m, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const reply = answerAssistantQuery(textToSend, contextName, profile, topRec);
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: reply.text,
          actions: reply.actions,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setIsTyping(false);
    }, 350);
  };

  const handleReset = () => {
    const greeting = buildAssistantGreeting(contextName, topRec, topPrediction, profile);
    setMessages([
      {
        role: 'assistant',
        text: greeting.text,
        actions: greeting.actions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setActiveChips(greeting.quickChips);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          className="fixed bottom-4 right-4 z-40 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground h-12 w-12 flex items-center justify-center transition-all duration-300 hover:scale-105"
          size="icon"
          aria-label="Open AI Assistant"
        >
          <Sparkles className="h-5 w-5 animate-pulse" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full max-w-[calc(100%-2rem)] md:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 border-b bg-card/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base font-semibold">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <span>AIDetector.cx Assistant</span>
            </SheetTitle>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
                Online
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleReset}
                title="Restart conversation"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
            <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
            <span>Zero-Retention volatile memory • Context: {contextName.replace(/_/g, ' ')}</span>
          </div>
        </SheetHeader>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1`}>
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted/70 text-foreground border border-border/70 rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>

                {/* Interactive Action Shortcuts */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2.5 mt-2 border-t border-border/40">
                    {msg.actions.map((a, idx) =>
                      a.to ? (
                        <Button
                          key={idx}
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs gap-1 shadow-none bg-background hover:bg-muted border border-border/80"
                          asChild
                          onClick={() => setOpen(false)}
                        >
                          <Link to={a.to}>
                            {a.label}
                            <ArrowRight className="w-3 h-3 text-primary" />
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          key={idx}
                          size="sm"
                          variant="secondary"
                          className="h-7 text-xs bg-background hover:bg-muted border border-border/80"
                          onClick={a.action}
                        >
                          {a.label}
                        </Button>
                      )
                    )}
                  </div>
                )}
              </div>
              {msg.timestamp && (
                <span className="text-[10px] text-muted-foreground px-1">{msg.timestamp}</span>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-1.5 text-muted-foreground p-2">
              <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.4s]" />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {activeChips.length > 0 && (
          <div className="px-4 py-2 bg-muted/20 border-t border-border flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
            <span className="text-[10px] text-muted-foreground font-medium shrink-0 flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-amber-500" /> Suggestions:
            </span>
            {activeChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(chip)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-background hover:bg-muted hover:border-primary/40 transition-colors text-foreground shrink-0 shadow-2xs"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <div className="p-3 border-t bg-card shrink-0">
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
              placeholder="Ask anything about detection, tools, pricing..."
              className="flex-1 text-xs sm:text-sm h-9 bg-background"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isTyping}
              className="h-9 w-9 shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
export default SmartAssistant;
