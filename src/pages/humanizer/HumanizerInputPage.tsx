import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText, Settings, Play, Sliders, ChevronDown, ChevronUp, Upload, X,
  Check, Shield, Lock, FileCheck, Code2, Building2, ArrowRight, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { humanizerApi } from '@/lib/humanizerApi';
import { HumanizerSettings, HumanizationLevel, WritingStyle } from '@/types/humanizer';
import { toast } from 'sonner';
import { useCustomerDataPlatform } from '@/contexts/CustomerDataPlatformContext';
import { useAuth } from '@/contexts/AuthContext';
import PageMeta from '@/components/common/PageMeta';
import { Suspense, lazy } from 'react';
import AdvancedControlsPanel from './AdvancedControlsPanel';

const HumanizerSections = lazy(() => import('./HumanizerSections'));

export default function HumanizerInputPage() {
  const navigate = useNavigate();
  const editorRef = useRef<HTMLDivElement>(null);
  const { trackToolUsage, trackCTAClick, trackEvent } = useCustomerDataPlatform();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [guestUsage, setGuestUsage] = useState<{ remaining: number; limit: number } | null>(null);

  useEffect(() => {
    trackToolUsage('humanizer_landing_viewed', { source: 'organic_or_direct' });
  }, [trackToolUsage]);

  useEffect(() => {
    if (user) return;
    humanizerApi.checkGuestUsage()
      .then((usage) => {
        if (usage) setGuestUsage(usage);
      })
      .catch((err) => {
        console.error('Failed to check guest humanizer usage:', err);
      });
  }, [user]);

  const DEFAULT_SETTINGS: HumanizerSettings = {
    level: 'balanced',
    tone: 'neutral',
    audience: 'general',
    readingLevel: 'standard',
    preserveFacts: true,
    preserveKeywords: true,
    preserveCitations: true,
    preserveFormatting: true,
    preserveParagraphStructure: true,
    preserveTechnicalTerminology: true,
    shortenText: false,
    expandExplanations: false,
    reducePassiveVoice: false,
    increaseSentenceVariation: true,
    improveTransitions: true,
    removeRepetition: true,
    improveClarity: true,
    increaseEmotionalWarmth: false,
    reduceFormality: false,
    preserveBrandVoice: false,
    avoidContractions: false,
    allowContractions: false,
    useBritishEnglish: false,
    useAmericanEnglish: true,
    wordsToPreserve: '',
    wordsToAvoid: '',
    preferredTerminology: '',
    brandVoiceInstructions: '',
    additionalInstructions: ''
  };

  const [settings, setSettings] = useState<HumanizerSettings>(DEFAULT_SETTINGS);
  const [advancedDraft, setAdvancedDraft] = useState<HumanizerSettings>(settings);

  // Lock body scroll and hide floating support widgets while advanced controls are open
  useEffect(() => {
    if (advancedOpen) {
      document.body.style.overflow = 'hidden';
      document.body.setAttribute('data-advanced-controls-open', 'true');
    } else {
      document.body.style.overflow = '';
      document.body.removeAttribute('data-advanced-controls-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.removeAttribute('data-advanced-controls-open');
    };
  }, [advancedOpen]);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const charCount = text.length;

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error('Please enter some text to humanize.');
      return;
    }

    if (charCount > 50000) {
      toast.error('Text exceeds maximum length of 50,000 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      trackToolUsage('humanizer_started', {
        text_length: charCount,
        word_count: wordCount,
        level: settings.level,
        tone: settings.tone
      });
      trackEvent({
        event_type: 'custom',
        metadata: { event_name: 'humanize_clicked', text_length: charCount, word_count: wordCount, level: settings.level, tone: settings.tone }
      });
      const { job, guestUsage } = await humanizerApi.createJob(text, settings);
      if (guestUsage) {
        setGuestUsage(guestUsage);
      }
      navigate(`/humanizer/processing/${job.job_id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to start humanization process.');
      setIsSubmitting(false);
    }
  };

  const scrollToEditor = () => {
    editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    trackCTAClick('hero_primary_cta', { cta_type: 'primary', cta_text: 'Humanize Text' });
  };

  const trackSecondaryCta = (ctaText: string, href: string) => {
    trackCTAClick('hero_secondary_cta', { cta_type: 'secondary', cta_text: ctaText, href });
  };

  const updateSetting = (key: keyof HumanizerSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const openAdvanced = () => {
    setAdvancedDraft(settings);
    setAdvancedOpen(true);
    trackEvent({
      event_type: 'advanced_controls_opened',
      metadata: { level: settings.level },
    });
  };

  const isDraftDirty = () => {
    return (Object.keys(DEFAULT_SETTINGS) as (keyof HumanizerSettings)[]).some(
      (key) => advancedDraft[key] !== settings[key]
    );
  };

  const closeAdvanced = () => {
    if (isDraftDirty()) {
      trackEvent({
        event_type: 'controls_abandoned',
        metadata: { level: settings.level, has_changes: true },
      });
    }
    setAdvancedOpen(false);
    setAdvancedDraft(settings);
  };

  const applyAdvanced = () => {
    setSettings(advancedDraft);
    setAdvancedOpen(false);
    trackEvent({
      event_type: 'controls_applied',
      metadata: {
        level: advancedDraft.level,
        preserve_facts: advancedDraft.preserveFacts,
        sentence_variation: advancedDraft.increaseSentenceVariation,
      },
    });
  };

  const resetAdvanced = () => {
    setAdvancedDraft(DEFAULT_SETTINGS);
    trackEvent({
      event_type: 'controls_reset',
      metadata: { level: settings.level },
    });
  };

  const FileUploadTrigger = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result;
        if (typeof result === 'string') setText(result);
      };
      reader.readAsText(file);
    };
    return (
      <>
        <input
          type="file"
          accept=".txt,.md,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          ref={inputRef}
          onChange={handleFile}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5 mr-1" />
          Upload
        </Button>
      </>
    );
  };

  return (
    <>
      <PageMeta
        title="AI Humanizer | Rewrite AI Text Naturally Without Changing Meaning"
        description="Transform AI-generated text into natural, human-like writing with AIDetector.cx. Preserve facts, improve readability, and get multiple rewrite alternatives."
        canonicalUrl="https://aidetector.cx/humanizer"
        ogTitle="AI Humanizer That Rewrites AI Text Naturally"
        ogDescription="Preserve meaning while reducing robotic AI patterns. Try the AIDetector.cx humanizer with multiple rewrite styles and sentence-level control."
        schemas={[
          {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'AIDetector.cx AI Humanizer',
            applicationCategory: 'TextApplication',
            description: 'An AI humanizer that rewrites AI-generated text to sound natural while preserving meaning and facts.',
            url: 'https://aidetector.cx/humanizer',
            operatingSystem: 'Web',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD'
            }
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'What is an AI Humanizer?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'An AI humanizer is a writing tool that rewrites machine-generated text to sound more natural, authentic, and human-written.'
                }
              },
              {
                '@type': 'Question',
                name: 'How does the AIDetector.cx humanizer preserve meaning?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'It analyzes input to identify facts, protected terms, and semantic structure, then generates alternatives and verifies core claims remain unchanged.'
                }
              },
              {
                '@type': 'Question',
                name: 'Is my content secure and private?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes. Content is processed over encrypted connections, never stored after processing, and never used for model training.'
                }
              }
            ]
          }
        ]}
      />
      <div className="flex flex-col w-full bg-background">
        {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-muted/50 to-background border-b border-border">
        <div className="container mx-auto px-4 py-8 md:py-12 lg:py-14 max-w-6xl">
          <div className="flex flex-col items-start md:items-center text-left md:text-center gap-5 md:gap-6">
            <Badge variant="secondary" className="px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3 w-3 mr-1.5 text-primary" />
              AI Humanizer — Natural Rewriting That Preserves Meaning
            </Badge>

            <div className="space-y-3 md:space-y-4 max-w-3xl">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight text-balance">
                AI Humanizer That Rewrites AI Text Naturally Without Changing Meaning
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-muted-foreground text-pretty max-w-2xl mx-auto">
                Transform ChatGPT, GPT-5.5, Claude, Gemini, and other AI-generated content into authentic human writing. Preserve every fact, improve readability, and choose from multiple rewrite styles.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 text-sm text-muted-foreground max-w-2xl w-full md:w-auto">
              {[
                'Preserve facts, meaning, and citations',
                'Reduce robotic wording and AI signals',
                'Get multiple rewrite alternatives',
                'Sentence-level analysis and control',
                'Support for long documents up to 50,000 characters',
                'Adjust tone, reading level, and audience'
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-foreground/80">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <Button
                size="lg"
                onClick={scrollToEditor}
                className="text-base md:text-lg px-6 md:px-8 h-11 md:h-12"
              >
                Humanize Text
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <div className="flex flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="flex-1 sm:flex-none text-base md:text-lg px-4 md:px-6 h-11 md:h-12"
                  onClick={() => trackSecondaryCta('Explore Pricing', '/pricing')}
                >
                  <a href="/pricing">Explore Pricing</a>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="flex-1 sm:flex-none text-base md:text-lg px-4 md:px-6 h-11 md:h-12"
                  onClick={() => trackSecondaryCta('View API', '/api')}
                >
                  <a href="/api">View API</a>
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-start md:justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              {[
                { icon: Shield, label: 'Secure Processing' },
                { icon: Lock, label: 'Privacy First' },
                { icon: FileCheck, label: 'Files Protected' },
                { icon: Code2, label: 'API Available' },
                { icon: Building2, label: 'Enterprise Ready' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-center md:text-center">
              <p className="text-xs text-muted-foreground">
                Your content is processed securely and is never used for AI training.
              </p>
              <p className="text-xs text-muted-foreground">
                Supports TXT, DOCX, PDF, RTF, and Markdown files up to 10MB.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Editor */}
      <section ref={editorRef} className="scroll-mt-28 py-6 md:py-8 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          {guestUsage && !user && (
            <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>
                  Free trial: <strong className="font-semibold">{guestUsage.remaining}</strong> of {guestUsage.limit} humanize sessions left today.
                </span>
                <Link to="/signup">
                  <Button variant="outline" size="sm" className="shrink-0">
                    Sign up free
                  </Button>
                </Link>
              </div>
            </div>
          )}
          <div className="flex flex-col lg:flex-row gap-4 md:gap-5">
            {/* Text Input */}
            <div className="flex-1 min-w-0">
              <Card className="flex flex-col shadow-sm border-border/80">
                <CardHeader className="py-3 px-4 md:px-5 border-b bg-muted/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <CardTitle className="text-sm md:text-base flex items-center gap-2 font-semibold">
                      <FileText className="h-4 w-4 text-primary" />
                      Original Text
                    </CardTitle>
                    <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                      <FileUploadTrigger />
                      <span>{wordCount} words</span>
                      <span className={charCount > 50000 ? 'text-destructive font-medium' : ''}>
                        {charCount.toLocaleString()} / 50,000
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 relative">
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste the text you want to humanize here, or upload a file..."
                    className="w-full min-h-[200px] max-h-[600px] p-4 md:p-5 border-0 focus-visible:ring-1 focus-visible:ring-primary/30 resize-y text-sm md:text-base bg-transparent"
                    style={{ height: text ? `${Math.max(200, Math.min(600, text.split('\n').length * 28 + 80))}px` : '200px' }}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Settings */}
            <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0">
              <Card className="shadow-sm border-border/80">
                <CardHeader className="py-3 px-4 md:px-5 border-b">
                  <CardTitle className="text-sm md:text-base flex items-center gap-2 font-semibold">
                    <Settings className="h-4 w-4 text-primary" />
                    Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="style" className="text-sm">Writing Style Mode</Label>
                    <Select value={settings.style || 'standard'} onValueChange={(v) => updateSetting('style', v as WritingStyle)}>
                      <SelectTrigger id="style" className="h-10">
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard (General & Balanced)</SelectItem>
                        <SelectItem value="academic">Academic (Scholarly & Citations)</SelectItem>
                        <SelectItem value="professional">Professional (Executive & Formal)</SelectItem>
                        <SelectItem value="conversational">Conversational (Engaging & Warm)</SelectItem>
                        <SelectItem value="technical">Technical (Precise & Specialized)</SelectItem>
                        <SelectItem value="marketing">Marketing (Persuasive & Value-Driven)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="level" className="text-sm">Humanization Level</Label>
                    <Select value={settings.level} onValueChange={(v) => updateSetting('level', v as HumanizationLevel)}>
                      <SelectTrigger id="level" className="h-10">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="strong">Strong</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {settings.level === 'light' && 'Improves grammar, fluency, and rhythm with minimal wording changes.'}
                      {settings.level === 'balanced' && 'Restructures sentences and improves naturalness while preserving style.'}
                      {settings.level === 'strong' && 'Makes deeper structural changes while preserving meaning and facts.'}
                      {settings.level === 'advanced' && 'Rewrites paragraphs more substantially to remove strong AI signals.'}
                      {settings.level === 'custom' && 'Uses your specific configuration below.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="tone" className="text-sm">Writing Tone</Label>
                      <Select value={settings.tone} onValueChange={(v) => updateSetting('tone', v)}>
                        <SelectTrigger id="tone" className="h-10">
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="conversational">Conversational</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="academic">Academic</SelectItem>
                          <SelectItem value="formal">Formal</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="persuasive">Persuasive</SelectItem>
                          <SelectItem value="confident">Confident</SelectItem>
                          <SelectItem value="empathetic">Empathetic</SelectItem>
                          <SelectItem value="technical">Technical</SelectItem>
                          <SelectItem value="journalistic">Journalistic</SelectItem>
                          <SelectItem value="creative">Creative</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="audience" className="text-sm">Target Audience</Label>
                      <Select value={settings.audience} onValueChange={(v) => updateSetting('audience', v)}>
                        <SelectTrigger id="audience" className="h-10">
                          <SelectValue placeholder="Select audience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="students">Students</SelectItem>
                          <SelectItem value="teachers">Teachers</SelectItem>
                          <SelectItem value="researchers">Researchers</SelectItem>
                          <SelectItem value="professionals">Professionals</SelectItem>
                          <SelectItem value="executives">Executives</SelectItem>
                          <SelectItem value="customers">Customers</SelectItem>
                          <SelectItem value="developers">Developers</SelectItem>
                          <SelectItem value="technical_experts">Technical Experts</SelectItem>
                          <SelectItem value="children">Children</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="readingLevel" className="text-sm">Reading Level</Label>
                    <Select value={settings.readingLevel} onValueChange={(v) => updateSetting('readingLevel', v)}>
                      <SelectTrigger id="readingLevel" className="h-10">
                        <SelectValue placeholder="Select reading level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">Simple</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="academic">Academic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Desktop Advanced Settings Toggle */}
                  <div className="pt-2 border-t hidden lg:block">
                    <button
                      type="button"
                      className="w-full flex justify-between items-center py-2.5 px-1 rounded-md hover:bg-muted/50 transition-colors min-h-[44px] touch-manipulation"
                      onClick={() => (advancedOpen ? closeAdvanced() : openAdvanced())}
                    >
                      <span className="flex items-center gap-2 font-medium text-sm">
                        <Sliders className="h-4 w-4" />
                        Advanced Controls
                      </span>
                      {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {advancedOpen && (
                      <div className="mt-2 pt-2 border-t animate-in slide-in-from-top-2 fade-in-50 duration-200">
                        <AdvancedControlsPanel
                          value={advancedDraft}
                          onChange={setAdvancedDraft}
                          onApply={applyAdvanced}
                          onCancel={closeAdvanced}
                          onReset={resetAdvanced}
                        />
                      </div>
                    )}
                  </div>

                  {/* Mobile/Tablet Advanced Settings (Sheet) */}
                  <div className="pt-2 border-t lg:hidden">
                    <Sheet open={advancedOpen} onOpenChange={setAdvancedOpen}>
                      <SheetTrigger asChild>
                        <button
                          type="button"
                          className="w-full flex justify-between items-center py-2.5 px-1 rounded-md hover:bg-muted/50 transition-colors min-h-[44px] touch-manipulation"
                          onClick={openAdvanced}
                        >
                          <span className="flex items-center gap-2 font-medium text-sm">
                            <Sliders className="h-4 w-4" />
                            Advanced Controls
                          </span>
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </SheetTrigger>
                      <SheetContent
                        side="bottom"
                        className="h-[95dvh] flex flex-col rounded-t-xl p-0"
                        onEscapeKeyDown={closeAdvanced}
                        onPointerDownOutside={closeAdvanced}
                      >
                        <div className="shrink-0 border-b px-4 py-3 flex items-center justify-between bg-background">
                          <h2 className="flex items-center gap-2 text-base font-semibold">
                            <Sliders className="h-5 w-5" />
                            Advanced Controls
                          </h2>
                        </div>
                        <AdvancedControlsPanel
                          value={advancedDraft}
                          onChange={setAdvancedDraft}
                          onApply={applyAdvanced}
                          onCancel={closeAdvanced}
                          onReset={resetAdvanced}
                          mode="sheet"
                          className="px-0"
                        />
                      </SheetContent>
                    </Sheet>
                  </div>
                </CardContent>

                <CardFooter className="p-4 border-t bg-muted/20">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !text.trim() || charCount > 50000}
                    className="w-full text-base h-11 md:h-12"
                  >
                    {isSubmitting ? 'Initializing...' : 'Humanize Text'}
                    {!isSubmitting && <Play className="ml-2 h-4 w-4" />}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Separator className="opacity-50" />

      {/* SEO Sections */}
      <Suspense fallback={<div className="py-12 md:py-20 bg-muted/20 animate-pulse" aria-hidden="true" />}>
        <HumanizerSections />
      </Suspense>
    </div>
  </>
  );
}
