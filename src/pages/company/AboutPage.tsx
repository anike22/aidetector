import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import MainLayout from '@/components/layouts/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShieldCheck, 
  FileText, 
  Sparkles, 
  Code2, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertTriangle, 
  Compass, 
  ExternalLink, 
  Globe, 
  Linkedin, 
  Github, 
  Twitter, 
  BookOpen, 
  Mail, 
  Info,
  Scale,
  RefreshCw,
  Eye,
  Lock,
  ArrowRight
} from 'lucide-react';
import { 
  getFounderProfile, 
  FounderProfile, 
  DEFAULT_FOUNDER_PROFILE,
  generateAboutStructuredData
} from '@/lib/founderSettings';

export default function AboutPage() {
  const [founder, setFounder] = useState<FounderProfile>(DEFAULT_FOUNDER_PROFILE);

  useEffect(() => {
    // Load dynamic founder settings from storage
    const profile = getFounderProfile();
    setFounder(profile);
  }, []);

  // Filter only enabled and non-empty social links
  const activeSocialLinks = (founder.socialLinks || [])
    .filter(link => link.enabled && link.url && link.url.trim() !== '')
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return <Linkedin className="w-4 h-4 text-[#0077b5]" />;
      case 'x':
        return <Twitter className="w-4 h-4 text-foreground" />;
      case 'github':
        return <Github className="w-4 h-4 text-foreground" />;
      case 'website':
      default:
        return <Globe className="w-4 h-4 text-primary" />;
    }
  };

  const structuredData = generateAboutStructuredData(founder);

  return (
    <MainLayout>
      <Helmet>
        <title>About AIDetector.cx | AI Content Detection &amp; Integrity</title>
        <meta 
          name="description" 
          content="Building practical tools for understanding AI-generated and human-created digital content. Learn about our probabilistic approach, responsible use guidelines, and platform founder Anike Tobechukwu." 
        />
        <link rel="canonical" href="https://aidetector.cx/about" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://aidetector.cx/about" />
        <meta property="og:title" content="About AIDetector.cx | AI Content Detection &amp; Integrity" />
        <meta property="og:description" content="Building practical tools for understanding AI-generated and human-created digital content." />
        <meta property="og:image" content="https://aidetector.cx/brand/aidetector-og.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About AIDetector.cx | AI Content Detection &amp; Integrity" />
        <meta name="twitter:description" content="Building practical tools for understanding AI-generated and human-created digital content." />
        <meta name="twitter:image" content="https://aidetector.cx/brand/aidetector-og.png" />

        {/* JSON-LD Schema */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      {/* ── 1. Page Hero ── */}
      <section className="bg-navy text-white py-12 md:py-16 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <Badge className="bg-primary/20 text-primary border-primary/30 mb-3 px-3 py-1 font-mono text-xs uppercase tracking-wider">
            About AIDetector.cx
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-3 text-balance leading-tight tracking-tight">
            About AIDetector.cx
          </h1>
          <p className="text-white/90 text-base md:text-xl font-medium max-w-2xl mx-auto text-pretty mb-3 leading-relaxed">
            Building practical tools for understanding AI-generated and human-created digital content.
          </p>
          <p className="text-white/70 text-xs md:text-sm max-w-2xl mx-auto text-pretty leading-relaxed">
            AIDetector.cx develops tools for analyzing AI-generated content and supporting content-integrity workflows. We provide probabilistic analysis to help users examine where digital text, imagery, and media may originate. Our tools are designed to assist—not replace—human judgment in content evaluation.
          </p>
        </div>
      </section>

      {/* ── 2. Our Purpose ── */}
      <section className="py-12 md:py-16 bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4">
              <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5 mb-2.5 font-mono">
                Mission &amp; Philosophy
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-navy text-balance leading-tight">
                Our Purpose
              </h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Why we are building practical tools for digital content transparency.
              </p>
            </div>

            <div className="md:col-span-8 space-y-4 text-muted-foreground text-sm md:text-base leading-relaxed text-pretty">
              <p>
                AI-generated content has rapidly become part of education, publishing, marketing, research, and everyday communication. Generative models now craft articles, draft essays, synthesize code, and generate visual media with unprecedented fluency.
              </p>
              <p>
                At the same time, writers, educators, editors, and researchers increasingly need tools that help them examine where content may have originated and understand the signals behind an analysis.
              </p>
              <p>
                <strong className="text-navy font-semibold">AIDetector.cx is being developed to make these analyses more understandable, accessible, and useful.</strong> We believe software should provide transparent signals and context rather than opaque, black-box verdicts.
              </p>
              <div className="p-4 rounded-xl bg-muted/40 border border-border/80 text-xs md:text-sm text-foreground/80 mt-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-navy block mb-0.5">Contextual Interpretation Principle</strong>
                  Detection results should always be interpreted with context. We do not present an automated detector score as definitive proof of authorship or AI usage.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. What We Build ── */}
      <section className="py-12 md:py-16 bg-muted/20 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5 mb-2.5 font-mono">
              Platform Architecture
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy text-balance mb-2">
              What We Build
            </h2>
            <p className="text-sm text-muted-foreground text-pretty">
              A modular suite of content integrity and workflow tools engineered for creators, educators, and teams.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Group 1: Text & Content Integrity */}
            <Card className="border-border shadow-card h-full flex flex-col">
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy text-base">Text &amp; Content Integrity</h3>
                    <p className="text-xs text-muted-foreground">Statistical linguistic signals and verification</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed flex-1">
                  Dual-mode statistical analysis (Balanced and High-Sensitivity), explainable sentence-level scoring, real-time word counting, and multilingual plagiarism comparison against indexed digital literature.
                </p>
                <div className="pt-3 border-t border-border flex flex-wrap gap-2 text-xs">
                  <Link to="/ai-detector" className="inline-flex items-center text-primary font-medium hover:underline">
                    AI Text Detector →
                  </Link>
                  <span className="text-muted-foreground/40">•</span>
                  <Link to="/plagiarism-checker" className="inline-flex items-center text-primary font-medium hover:underline">
                    Plagiarism Checker →
                  </Link>
                  <span className="text-muted-foreground/40">•</span>
                  <Link to="/verified-authorship" className="inline-flex items-center text-primary font-medium hover:underline">
                    Verified Authorship →
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Group 2: Multimodal Analysis */}
            <Card className="border-border shadow-card h-full flex flex-col">
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <ImageIcon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy text-base">Multimodal Analysis</h3>
                    <p className="text-xs text-muted-foreground">Synthetic visual media and deepfake detection</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed flex-1">
                  Computer vision and forensic analysis tools designed to examine image artifact patterns, GAN signatures, diffusion textures, and temporal video frame consistency across media types.
                </p>
                <div className="pt-3 border-t border-border flex flex-wrap gap-2 text-xs">
                  <Link to="/ai-image-detector" className="inline-flex items-center text-primary font-medium hover:underline">
                    AI Image Detector →
                  </Link>
                  <span className="text-muted-foreground/40">•</span>
                  <Link to="/ai-video-detector" className="inline-flex items-center text-primary font-medium hover:underline">
                    AI Video Detector →
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Group 3: Writing & Content Workflows */}
            <Card className="border-border shadow-card h-full flex flex-col">
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy text-base">Writing &amp; Content Workflows</h3>
                    <p className="text-xs text-muted-foreground">SEO optimization, humanization, and research tools</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed flex-1">
                  Integrated writing environments including real-time SEO content assistance, intelligent document summarization, student academic guidance, and nuanced editorial humanization tools.
                </p>
                <div className="pt-3 border-t border-border flex flex-wrap gap-2 text-xs">
                  <Link to="/seo-assistant" className="inline-flex items-center text-primary font-medium hover:underline">
                    SEO Assistant →
                  </Link>
                  <span className="text-muted-foreground/40">•</span>
                  <Link to="/ai-summarizer" className="inline-flex items-center text-primary font-medium hover:underline">
                    AI Summarizer →
                  </Link>
                  <span className="text-muted-foreground/40">•</span>
                  <Link to="/humanizer" className="inline-flex items-center text-primary font-medium hover:underline">
                    Humanizer →
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Group 4: Developer & Directory Ecosystem */}
            <Card className="border-border shadow-card h-full flex flex-col">
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Code2 className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy text-base">Developer &amp; Directory Ecosystem</h3>
                    <p className="text-xs text-muted-foreground">REST APIs and third-party software intelligence</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed flex-1">
                  High-throughput REST API endpoints for seamless workflow integration, alongside our transparent AI Tools Directory with multi-factor benchmarks, community reviews, and verified evidence.
                </p>
                <div className="pt-3 border-t border-border flex flex-wrap gap-2 text-xs">
                  <Link to="/api-docs" className="inline-flex items-center text-primary font-medium hover:underline">
                    API Documentation →
                  </Link>
                  <span className="text-muted-foreground/40">•</span>
                  <Link to="/directory" className="inline-flex items-center text-primary font-medium hover:underline">
                    AI Tools Directory →
                  </Link>
                  <span className="text-muted-foreground/40">•</span>
                  <Link to="/compare" className="inline-flex items-center text-primary font-medium hover:underline">
                    Compare AI Tools →
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── 4. Company Principles ── */}
      <section className="py-12 md:py-16 bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="max-w-3xl mb-10">
            <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5 mb-2.5 font-mono">
              Core Tenets
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy text-balance mb-3">
              Company Principles
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-pretty">
              The foundational commitments guiding our product architecture, research, and community interactions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card className="border-border shadow-card h-full flex flex-col">
              <CardContent className="p-5 space-y-2.5 flex-1">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-navy text-sm">Transparency</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We explain what detection results represent and disclose score confidence rather than pretending automated algorithms are infallible.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-card h-full flex flex-col">
              <CardContent className="p-5 space-y-2.5 flex-1">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-navy text-sm">Responsible Interpretation</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Detection scores should inform contextual inquiry and discussion, never automatically substitute for independent human judgment.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-card h-full flex flex-col">
              <CardContent className="p-5 space-y-2.5 flex-1">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-navy text-sm">Continuous Improvement</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Generative models evolve rapidly; our benchmark calibrations and detection methodologies undergo ongoing research and active updates.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-card h-full flex flex-col">
              <CardContent className="p-5 space-y-2.5 flex-1">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-navy text-sm">Data Privacy</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Text submitted for analysis is processed securely under strict session boundaries without selling user content or training commercial foundation models.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── 5. How We Approach AI Detection ── */}
      <section className="py-12 md:py-16 bg-muted/20 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="max-w-3xl mb-10">
            <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5 mb-2.5 font-mono">
              Transparency &amp; Methodology
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy text-balance mb-3">
              How We Think About AI Detection
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-pretty">
              Clear principles on how statistical classification works and why transparency matters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="border-border shadow-card">
              <CardContent className="p-5 space-y-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-navy text-sm">Detection Is Probabilistic</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Automated detection calculates likelihood distributions based on perplexity, burstiness, syntax regularity, and vocabulary patterns. It outputs a probability score, not a binary truth.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-card">
              <CardContent className="p-5 space-y-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-navy text-sm">Detectors Vary by Model &amp; Tuning</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Different detection engines use distinct training corpora, calibration thresholds, and scoring heuristics. Variance between tools is a natural reflection of differing model sensitivities.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border shadow-card">
              <CardContent className="p-5 space-y-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-navy text-sm">False Positives &amp; Negatives Occur</h3>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Formal, structured, or non-native human writing can exhibit high regularity, while heavily edited AI text can lower detection signals. Scores represent analytical indicators rather than infallible proof.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 p-4 rounded-xl border border-border bg-card">
            <h4 className="font-semibold text-navy text-sm mb-1.5 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Sentence-Level Explanatory Context
            </h4>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              Where AIDetector.cx highlights individual sentences or passages, the goal is to provide granular interpretability. This allows reviewers to inspect which specific phrases triggered elevated statistical regularity, enabling informed, human-guided evaluation.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6. Responsible Use ── */}
      <section className="py-12 md:py-16 bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="p-6 md:p-8 rounded-2xl border border-border bg-muted/20 shadow-card">
            <div className="flex flex-col md:flex-row gap-5 items-start">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1 space-y-3">
                <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/5 font-mono">
                  Ethical Guidance
                </Badge>
                <h2 className="text-xl md:text-2xl font-bold text-navy text-balance">
                  Responsible Use &amp; Human Oversight
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
                  We strongly advise educators, employers, and organizations to <strong className="text-navy font-semibold">avoid making significant academic, disciplinary, or employment decisions solely from an automated AI detection score</strong>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs md:text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>Always pair automated scores with holistic contextual review</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>Engage in constructive dialogue with writers and students</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>Seek supporting evidence such as draft revision histories</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span>Follow established institutional policies and due process</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Founder Section ── */}
      <section className="py-12 md:py-16 bg-muted/20 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-center mb-8">
            <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5 mb-2.5 font-mono">
              Leadership
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-navy text-balance">
              Founder
            </h2>
          </div>

          <Card className="border-border shadow-card overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col sm:flex-row gap-6 md:gap-8 items-center sm:items-start text-center sm:text-left">
                {/* Founder Portrait: Rendered in BLACK AND WHITE via non-destructive CSS grayscale */}
                <div className="shrink-0">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-2 border-border bg-card shadow-sm relative group">
                    {founder.photoUrl ? (
                      <img 
                        src={founder.photoUrl} 
                        alt="Anike Tobechukwu, founder of AIDetector.cx"
                        className="w-full h-full object-cover grayscale contrast-105 transition-all duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted/80 to-muted/30 text-navy font-bold text-2xl select-none">
                        <span className="text-primary">{founder.name.split(' ').map(n => n[0]).join('').slice(0, 2) || 'AT'}</span>
                        <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground mt-1">Founder</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Founder Bio & Information */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold text-navy tracking-tight">
                      {founder.name || 'Anike Tobechukwu'}
                    </h3>
                    <p className="text-sm font-medium text-primary mt-0.5">
                      {founder.title || 'Founder, AIDetector.cx'}
                    </p>
                  </div>

                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-pretty">
                    {founder.bio || 'Anike Tobechukwu is the founder of AIDetector.cx and leads the development and direction of the platform, with a focus on practical tools for AI-content analysis, content integrity and transparent digital-content workflows.'}
                  </p>

                  {/* Social Profile Links (Rendered ONLY if configured & enabled) */}
                  {activeSocialLinks.length > 0 && (
                    <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                      {activeSocialLinks.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Visit Anike Tobechukwu's ${link.label} profile`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-muted hover:border-primary/40 text-xs font-medium transition-colors shadow-xs"
                        >
                          {getSocialIcon(link.platform)}
                          <span>{link.label}</span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground/60 ml-0.5" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── 8. Trust & Transparency Links ── */}
      <section className="py-10 md:py-14 bg-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-navy mb-1">
              Trust &amp; Transparency Resources
            </h3>
            <p className="text-xs text-muted-foreground">
              Review our technical documentation, ethical policies, and community guidelines.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <Link 
              to="/directory" 
              className="p-3.5 rounded-xl border border-border bg-card hover:bg-muted hover:border-primary/30 transition-colors text-xs font-medium text-foreground flex flex-col items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-primary" />
              <span>AI Tools Directory</span>
            </Link>
            <Link 
              to="/api-docs" 
              className="p-3.5 rounded-xl border border-border bg-card hover:bg-muted hover:border-primary/30 transition-colors text-xs font-medium text-foreground flex flex-col items-center gap-1.5"
            >
              <Code2 className="w-4 h-4 text-primary" />
              <span>API Documentation</span>
            </Link>
            <Link 
              to="/community" 
              className="p-3.5 rounded-xl border border-border bg-card hover:bg-muted hover:border-primary/30 transition-colors text-xs font-medium text-foreground flex flex-col items-center gap-1.5"
            >
              <Globe className="w-4 h-4 text-primary" />
              <span>Community Forum</span>
            </Link>
            <Link 
              to="/contact" 
              className="p-3.5 rounded-xl border border-border bg-card hover:bg-muted hover:border-primary/30 transition-colors text-xs font-medium text-foreground flex flex-col items-center gap-1.5"
            >
              <Mail className="w-4 h-4 text-primary" />
              <span>Contact Desk</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 9. Restrained Call to Action (CTA) ── */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-navy text-balance mb-2.5">
            Understand Your Content
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto text-pretty mb-6 leading-relaxed">
            Analyze content with AIDetector.cx and review the signals behind the result.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 gap-2">
              <Link to="/ai-detector">
                Try AI Detector <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-border">
              <Link to="/directory">
                Browse Directory
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
