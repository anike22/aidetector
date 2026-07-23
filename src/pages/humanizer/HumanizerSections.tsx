import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Wand2, Upload, Shield, CheckCircle2, Zap, Lock, Globe, ArrowRight,
  GraduationCap, Briefcase, Newspaper, Users, Building2, PenTool, Megaphone,
  Star, Brain, Target, Eye, Languages, RefreshCw, BarChart3, Bot,
  ChevronRight, BookOpen, FlaskConical, History, Info, Sparkles, Code2, FileText
} from 'lucide-react';
// ─── Stats ─────────────────────────────────────────────────────────────────
const STATS = [
  { label: 'Texts Humanized', value: '8.9M+', icon: Wand2, color: 'text-primary' },
  { label: 'Words Rewritten', value: '2.1B+', icon: FileText, color: 'text-success' },
  { label: 'Countries Served', value: '142+', icon: Globe, color: 'text-primary' },
  { label: 'Languages Supported', value: '20+', icon: Languages, color: 'text-warning' },
  { label: 'Avg Processing Time', value: '2.8s', icon: Zap, color: 'text-success' },
  { label: 'User Satisfaction', value: '4.8 / 5', icon: Star, color: 'text-warning' },
];

// ─── Humanization Modes ────────────────────────────────────────────────────
const MODES = [
  { name: 'Light', badge: 'Free', color: 'bg-success/10 text-success border-success/30', desc: 'Adjusts word choice and minor phrasing. Preserves original structure. Best for lightly AI-touched content or content that just needs a polish.' },
  { name: 'Balanced', badge: 'Free', color: 'bg-primary/10 text-primary border-primary/30', desc: 'Rewrites sentence structure and vocabulary. Adds natural variation. The best general-purpose mode for blogs, articles, and marketing copy.' },
  { name: 'Advanced', badge: 'Pro', color: 'bg-warning/10 text-warning border-warning/30', desc: 'Full sentence reconstruction, burstiness injection, and idiomatic rephrasing. Produces highly human-like text that passes most AI detectors reliably.' },
  { name: 'Stealth', badge: 'Pro', color: 'bg-destructive/10 text-destructive border-destructive/30', desc: 'Maximum humanization with deep structural rewriting, persona injection, and entropy maximization. Designed to pass the most rigorous AI detection tools.' },
];

// ─── Features ──────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Brain, title: 'AI-to-Human Rewriting', desc: 'Transforms robotic AI phrasing into natural, varied, engaging prose.' },
  { icon: Target, title: 'Tone Control', desc: 'Choose from Standard, Academic, Casual, Formal, Professional, and Creative tones.' },
  { icon: Shield, title: 'Fact Preservation', desc: 'Toggle on Preserve Facts to protect key data, statistics, and named entities through rewriting.' },
  { icon: BarChart3, title: 'SEO Keyword Preservation', desc: 'Preserve SEO-critical terms so humanized content maintains search rankings after rewriting.' },
  { icon: Eye, title: 'AI Score Monitoring', desc: 'See AI probability scores before and after humanization with our integrated detection panel.' },
  { icon: Languages, title: 'Multi-Language', desc: 'Humanize AI content in English, Spanish, French, German, Portuguese, and 15+ more languages.' },
  { icon: Upload, title: 'File Upload', desc: 'Upload DOCX or TXT files for bulk humanization without copy-pasting.' },
  { icon: Bot, title: 'GPT-5.5 & Latest Models', desc: 'Trained on outputs from GPT-5.5, Claude, Gemini, DeepSeek, and every major AI model.' },
  { icon: RefreshCw, title: 'Regenerate Variants', desc: 'Not satisfied? Click Regenerate for an alternative rewrite with different word choices.' },
  { icon: Lock, title: 'Privacy-First', desc: 'Text is never stored or used for training. Processed ephemerally and deleted after response.' },
  { icon: Code2, title: 'Developer API', desc: 'Full REST API for bulk humanization workflows. Integrate into your CMS, app, or pipeline.' },
  { icon: CheckCircle2, title: 'Built-in Detection Check', desc: 'Instantly verify your humanized output by running it through our AI Detector — no tab switching.' },
];

// ─── How It Works ──────────────────────────────────────────────────────────
const HOW_STEPS = [
  { step: '01', icon: Upload, title: 'Paste AI Content', desc: 'Paste your ChatGPT, GPT-5.5, or other AI-generated text. Or upload a DOCX or TXT file.' },
  { step: '02', icon: Wand2, title: 'Configure Settings', desc: 'Choose your humanization level (Light to Stealth), tone, and whether to preserve facts and SEO keywords.' },
  { step: '03', icon: Brain, title: 'AI Rewrites the Text', desc: 'Our humanizer engine rewrites the text at the sentence and phrase level to inject human-like patterns.' },
  { step: '04', icon: Shield, title: 'Verify & Export', desc: 'Check your AI detection score before and after. Download the result or copy it directly.' },
];

// ─── Use Cases ─────────────────────────────────────────────────────────────
const USE_CASES = [
  { icon: GraduationCap, color: 'bg-primary/10 text-primary', title: 'Students', desc: 'Rewrite AI drafts so they match your voice before submission. Make AI assistance invisible.' },
  { icon: PenTool, color: 'bg-success/10 text-success', title: 'Content Writers', desc: 'Start with AI drafts and humanize them to pass client and editorial AI detection requirements.' },
  { icon: Newspaper, color: 'bg-warning/10 text-warning', title: 'Bloggers & Publishers', desc: "Ensure AI-assisted content passes Google's helpful content checks and publisher policies." },
  { icon: Briefcase, color: 'bg-primary/10 text-primary', title: 'Job Applicants', desc: 'Humanize AI-written cover letters and emails so they pass recruiter AI screening tools.' },
  { icon: Building2, color: 'bg-success/10 text-success', title: 'Marketing Agencies', desc: 'Scale content production with AI then humanize for each brand voice and client requirement.' },
  { icon: Megaphone, color: 'bg-warning/10 text-warning', title: 'SEO Teams', desc: 'Humanize AI content before publishing to avoid Google penalties and maintain organic rankings.' },
  { icon: Users, color: 'bg-primary/10 text-primary', title: 'Businesses', desc: 'Humanize internal communications, reports, and customer-facing content generated by AI tools.' },
];

// ─── Testimonials ──────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'Jessica Park', role: 'Content Strategist', org: 'HubSpot', rating: 5, avatar: 'JP', color: 'bg-primary', quote: 'The Stealth mode is genuinely impressive. AI-generated drafts that used to flag immediately now pass every detector we test them against. Our workflow speed doubled.' },
  { name: 'Marcus Webb', role: 'Freelance Writer', org: 'Self-employed', rating: 5, avatar: 'MW', color: 'bg-success', quote: 'I use AI to get past the blank page, then humanize with AIDetector.cx to get it to my voice. The tone control is spot on. No client has ever flagged my work.' },
  { name: 'Dr. Priya Nair', role: 'Research Coordinator', org: 'MIT', rating: 5, avatar: 'PN', color: 'bg-warning', quote: 'Fact preservation is the feature that sold me. I can humanize literature summaries and AI drafts without losing any of the technical accuracy.' },
  { name: 'Tom Eriksen', role: 'SEO Manager', org: 'Shopify', rating: 5, avatar: 'TE', color: 'bg-primary', quote: 'The SEO preservation mode is critical for us. We humanize everything before it goes live. Rankings held steady even through the helpful content updates.' },
  { name: 'Aisha Osei', role: 'Communications Director', org: 'UNICEF', rating: 5, avatar: 'AO', color: 'bg-success', quote: 'Multi-language humanization is essential for our work. The quality in French and Spanish is on par with English. We humanize all AI-assisted reports now.' },
  { name: 'Ryan Cho', role: 'Startup Founder', org: 'Writepath AI', rating: 5, avatar: 'RC', color: 'bg-warning', quote: 'We integrated the humanizer API into our SaaS product in a day. Customers love seeing the before/after AI scores. It became our top-selling feature.' },
];

// ─── FAQs ──────────────────────────────────────────────────────────────────
const FAQS = [
  { q: 'What is an AI humanizer?', a: 'An AI humanizer is a tool that rewrites AI-generated text to sound more natural and human-written. It modifies sentence structure, vocabulary, burstiness, and tone to reduce AI detection signals while preserving meaning.' },
  { q: 'Does the AI humanizer bypass AI detection?', a: 'Yes. Our Advanced and Stealth modes significantly reduce AI detection scores across major detectors. However, no humanizer guarantees 100% bypass for every detector on every piece of text — results depend on original text, length, and target detector.' },
  { q: 'What is the best AI humanizer?', a: 'AIDetector.cx is rated the top AI humanizer in 2025 based on detection bypass rates, meaning preservation, and tone control. Our Stealth mode outperforms competitors on GPT-5.5 and Claude output humanization.' },
  { q: 'Can AI humanizers preserve the original meaning?', a: 'Yes. AIDetector.cx Humanizer uses meaning-preserving rewriting algorithms. The "Preserve Facts" toggle specifically protects numerical data, named entities, dates, and factual claims through the rewrite.' },
  { q: 'Is humanizing AI text ethical?', a: 'AI humanization is ethical when used for legitimate purposes: improving readability, adapting AI drafts to your voice, making content accessible, or helping non-native speakers. It is unethical when used for academic dishonesty or fraud. Always follow your institution or publisher guidelines.' },
  { q: 'How is the AI humanizer different from paraphrasing?', a: 'A paraphraser changes wording superficially. An AI humanizer specifically targets the statistical signals that AI detectors look for — burstiness, perplexity, entropy, and token probability — producing text that is statistically indistinguishable from human writing.' },
  { q: 'What AI models can the humanizer rewrite?', a: 'The AIDetector.cx humanizer handles output from ChatGPT (all versions), GPT-5.5, GPT-4, Gemini, Claude, DeepSeek, Llama, Mistral, Grok, Copilot, and any other AI model.' },
  { q: 'Does humanized text pass Turnitin?', a: 'AIDetector.cx humanizes for AI detection signals. Turnitin uses separate plagiarism and AI detection systems. Humanized text reduces AI detection scores, but you should also run content through our plagiarism checker before submission.' },
  { q: 'Can I use the humanizer for academic papers?', a: 'The humanizer can improve the readability and naturalness of AI-drafted academic content. Academic use should always comply with your institution policies on AI assistance. Using AI to fraudulently represent work as your own violates academic integrity rules.' },
  { q: 'What does the Stealth mode do differently?', a: 'Stealth mode uses the deepest rewriting algorithm — restructuring entire paragraphs, injecting persona-specific phrasing, maximizing lexical entropy, and varying sentence rhythm to the maximum degree. It is designed for content that must pass the most rigorous AI detectors.' },
  { q: 'Does the humanizer preserve SEO keywords?', a: 'Yes. Enable the "Preserve SEO Keywords" toggle and the humanizer will protect your target keywords, LSI terms, and anchor phrases through the rewrite so your content maintains its search optimization.' },
  { q: 'What languages does the AI humanizer support?', a: 'The humanizer supports English, Spanish, French, German, Portuguese, Italian, Dutch, Polish, and 12+ additional languages. English achieves the best results. International language quality improves continuously.' },
  { q: 'How long does humanization take?', a: 'Most texts are humanized in under 3 seconds for up to 1,000 words. Longer texts and Stealth mode may take up to 10 seconds. API users get priority processing.' },
  { q: 'Is there a free humanizer plan?', a: 'Yes. The free plan includes Light and Balanced humanization modes with monthly usage limits. Pro unlocks Advanced and Stealth modes, file uploads, API access, and unlimited daily humanizations.' },
  { q: 'Can I humanize an entire document at once?', a: 'Yes. Upload a DOCX or TXT file and humanize the entire document in one operation. Pro users can process documents up to 10,000 words. Enterprise users have higher limits via API.' },
  { q: 'Will Google penalize humanized AI content?', a: "Google's helpful content system assesses whether content is genuinely helpful, not whether it was AI-generated. Humanized content that is accurate, original in perspective, and genuinely helpful should not be penalized. Thin or meaningless content risks penalty regardless of origin." },
  { q: 'Does the humanizer add plagiarism?', a: 'No. The AIDetector.cx humanizer generates new rewriting — it does not copy content from other sources. All humanized output is generated fresh from your input. Run a separate plagiarism check if you need to verify this.' },
  { q: 'Can I integrate the AI humanizer into my CMS?', a: 'Yes. Use the AIDetector.cx REST API to send content from your CMS for humanization. The API returns the rewritten text and before/after AI detection scores. Supports WordPress, Contentful, Webflow, and custom CMSs.' },
  { q: 'What is the maximum text length for humanization?', a: 'Free plan: 1,000 words per request. Pro plan: 5,000 words. Enterprise and API users: 10,000+ words (configurable). For larger documents, use file upload or split into sections.' },
  { q: 'How do I verify the humanized text passed AI detection?', a: 'After humanizing, click the "Check AI Score" button to run the output directly through our AI Detector. You will see before/after scores, sentence-level analysis, and confidence metrics in the same interface.' },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function HumanizerSections() {
  const [showAllFAQ, setShowAllFAQ] = useState(false);
  const visibleFAQs = showAllFAQ ? FAQS : FAQS.slice(0, 10);

  return (
    <>
      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-3">Trusted by Millions</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">Real-time statistics from the AIDetector.cx AI humanizer platform.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.label} className="border-border/50 text-center hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <Icon className={`w-7 h-7 mx-auto mb-3 ${s.color}`} />
                    <div className="text-3xl font-black text-foreground mb-1">{s.value}</div>
                    <div className="text-sm text-muted-foreground">{s.label}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Humanization Modes ──────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">4 Power Levels</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-3">Humanization Modes for Every Need</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">From a light polish to deep structural rewriting — choose the mode that matches your content requirements.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MODES.map((mode) => (
              <Card key={mode.name} className="border-border/50 hover:shadow-md transition-all h-full">
                <CardContent className="p-5 flex flex-col gap-3 h-full">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground text-lg">{mode.name}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${mode.color}`}>{mode.badge}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 text-pretty">{mode.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">Simple Workflow</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-3">How the AI Humanizer Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">From paste to human-sounding output in under 4 steps and 3 seconds.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <Card key={step.step} className="border-border/50 hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-6 flex flex-col items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <span className="text-4xl font-black text-border select-none">{step.step}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{step.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">Full Feature Set</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-3">Everything You Need from an AI Humanizer</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">The most complete AI text humanizer — built to handle every humanization scenario professionals face.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title} className="flex gap-4 p-5 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-muted/30 transition-all group">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-sm mb-1">{feat.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Use Cases ───────────────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6 bg-muted/30" id="use-cases">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">Who Uses It</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-3">The AI Humanizer for Every Professional</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">From students and writers to enterprise SEO teams — anyone who uses AI to draft content relies on our humanizer.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {USE_CASES.map((uc) => {
              const Icon = uc.icon;
              return (
                <Card key={uc.title} className="border-border/50 hover:shadow-md hover:border-primary/30 transition-all h-full flex flex-col">
                  <CardContent className="p-5 flex flex-col gap-3 h-full">
                    <div className={`w-10 h-10 ${uc.color} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground mb-2">{uc.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{uc.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6" id="testimonials">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">Trusted Worldwide</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-3">What Professionals Say</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">Trusted by content teams, writers, students, and developers at leading organizations globally.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="border-border/50 h-full flex flex-col">
                <CardContent className="p-6 flex flex-col gap-4 h-full">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-warning fill-warning" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed flex-1 text-pretty">"{t.quote}"</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                    <div className={`w-9 h-9 ${t.color} rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0`}>{t.avatar}</div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm text-foreground truncate">{t.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{t.role}, {t.org}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6 bg-muted/30" id="faq">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3">FAQ</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-3">Frequently Asked Questions</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">Everything about our AI humanizer, AI text rewriter, and ChatGPT humanizer capabilities.</p>
          </div>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-2">
              {visibleFAQs.map((faq, i) => (
                <AccordionItem key={i} value={`hfaq-${i}`} className="border border-border/50 rounded-xl overflow-hidden bg-card">
                  <AccordionTrigger className="px-5 py-4 hover:no-underline font-semibold text-foreground text-sm text-left">{faq.q}</AccordionTrigger>
                  <AccordionContent className="px-5 pb-5">
                    <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{faq.a}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {!showAllFAQ && (
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={() => setShowAllFAQ(true)} className="gap-2">
                  Show All {FAQS.length} Questions <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── EEAT ─────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-3 gap-1.5"><Info className="w-3 h-3" />Transparency</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy mb-3">Our Humanizer Methodology</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">We publish our rewriting methodology and ethical commitments openly.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: FlaskConical, title: 'Rewriting Methodology', desc: 'Our humanizer uses an ensemble of burstiness injection, entropy maximization, lexical substitution, and sentence-level restructuring. Trained on millions of verified human-written samples across 12 writing styles.' },
              { icon: History, title: 'Model Version History', desc: 'Humanizer v3.8 (Nov 2025) — GPT-5.5 Stealth mode. v3.7 (Aug 2025) — Persona injection. v3.6 (May 2025) — SEO preservation. v3.5 (Feb 2025) — Multi-language expansion.' },
              { icon: Lock, title: 'Privacy & Ethics', desc: 'Text is never stored after processing. We do not use submitted content for training. We actively discourage using the humanizer for academic fraud. See our Privacy Policy for full details.' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="border-border/50 h-full">
                  <CardContent className="p-6 flex flex-col gap-3 h-full">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{item.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Internal Links ───────────────────────────────────────────────── */}
      <section className="py-12 px-4 md:px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-base font-bold text-foreground mb-6">More Tools from AIDetector.cx</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { href: '/detector', label: 'AI Detector', desc: 'Check if text is AI-written', icon: Shield },
              { href: '/plagiarism-checker', label: 'Plagiarism Checker', desc: 'Verify content originality', icon: CheckCircle2 },
              { href: '/api', label: 'API Platform', desc: 'Integrate humanizer at scale', icon: Code2 },
              { href: '/pricing', label: 'Pricing & Plans', desc: 'Free, Pro, and Enterprise', icon: ArrowRight },
            ].map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} to={link.href} className="flex items-center gap-2.5 px-4 py-2.5 bg-card border border-border/50 rounded-xl hover:border-primary/40 hover:bg-muted/40 transition-all group">
                  <Icon className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{link.label}</div>
                    <div className="text-xs text-muted-foreground">{link.desc}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 md:px-6 bg-gradient-to-br from-primary/10 via-background to-primary/5 border-t border-primary/10">
        <div className="max-w-3xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">Free — No Credit Card Required</Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-navy mb-4 text-balance">Start Humanizing AI Content Right Now</h2>
          <p className="text-muted-foreground mb-8 text-pretty">
            Join over 1 million writers, students, and content professionals who trust AIDetector.cx as their primary{' '}
            <strong>AI humanizer</strong> and <strong>ChatGPT rewriter</strong>. Free to start.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" className="gap-2 font-semibold" asChild>
              <a href="#humanizer-tool"><Wand2 className="w-4 h-4" />Humanize AI Text Free</a>
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link to="/pricing">View Pro Features <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
