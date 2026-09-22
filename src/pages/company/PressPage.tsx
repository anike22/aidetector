import React from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Mail,
  ExternalLink,
  ShieldCheck,
  Search,
  Sparkles,
  Camera,
  Video,
  Award,
  Code2,
  Download,
  Info,
  CheckCircle2,
  Newspaper,
  Layers,
  Globe,
  ArrowRight
} from 'lucide-react';

/**
 * Structured schema for verified press coverage.
 * Each entry must represent a genuine, published third-party article with a working URL.
 */
export interface VerifiedPressItem {
  id: string;
  publication: string;
  headline: string;
  date: string;
  articleUrl: string;
  description?: string;
  author?: string;
}

/**
 * Verified media coverage registry.
 * Currently empty pending verified third-party published features.
 */
export const VERIFIED_PRESS_COVERAGE: VerifiedPressItem[] = [];

/**
 * Verified product overview for media & reviewers based strictly on existing features.
 */
export const PRODUCTS_OVERVIEW = [
  {
    title: 'Multi-Engine AI Text Detection',
    category: 'Text Analysis',
    description: 'Sentence-by-sentence analysis using statistical perplexity, burstiness scoring, and multi-model linguistic evaluation across diverse text genres.',
    href: '/detector',
    icon: Search,
    highlights: ['Multi-engine evaluation', 'Perplexity & burstiness metrics', 'Sentence-level heatmaps']
  },
  {
    title: 'Multilingual Academic Plagiarism Checker',
    category: 'Academic & Web',
    description: 'Evidence-first similarity scanning indexing open academic registries (Crossref, OpenAlex, Unpaywall) and live web sources without inventing citations.',
    href: '/plagiarism-checker',
    icon: ShieldCheck,
    highlights: ['Academic registry matching', 'Exact & semantic overlap', 'Source contribution attribution']
  },
  {
    title: 'AI Checker for Bloggers & SEO Assistant',
    category: 'Editorial & SEO',
    description: 'Comprehensive editorial inspection offering readability scoring, keyword distribution checks, heading structure audits, and internal linking suggestions.',
    href: '/ai-checker-for-bloggers',
    icon: Sparkles,
    highlights: ['20+ real-time SEO metrics', 'Internal link discovery', 'Publishing readiness score']
  },
  {
    title: 'AI Text Humanizer',
    category: 'Writing Workflow',
    description: 'Refines machine-generated phrasing into natural, fluent human prose with multiple nuance and pacing modes.',
    href: '/humanizer',
    icon: Layers,
    highlights: ['Multiple tone presets', 'Preserves factual meaning', 'Side-by-side comparison']
  },
  {
    title: 'AI Image & Video Forensics',
    category: 'Visual Media',
    description: 'Specialized deepfake and synthetic media detection evaluating spatial frequency artifacts, face inconsistencies, and temporal stability.',
    href: '/ai-image-detector',
    icon: Camera,
    highlights: ['Visual artifact heatmaps', 'Video frame forensics', 'Balanced and sensitive modes']
  },
  {
    title: 'Verified Digital Authorship',
    category: 'Provenance & IP',
    description: 'Cryptographic registration and verifiable authorship tracking codes to authenticate original human authorship and content provenance.',
    href: '/verified-authorship',
    icon: Award,
    highlights: ['Cryptographic verification', 'Public tracking codes', 'Embeddable authorship seals']
  },
  {
    title: 'Developer Platform & Integrations',
    category: 'Integrations & API',
    description: 'High-throughput REST API, native WordPress plugin for Gutenberg/Classic editors, and Chrome extension for in-browser analysis.',
    href: '/api-platform',
    icon: Code2,
    highlights: ['REST API access', 'WordPress plugin', 'Chrome browser extension']
  }
];

/**
 * Official brand assets available for journalists and media creators.
 */
export const BRAND_ASSETS = [
  {
    title: 'AIDetector.cx Primary Logo (SVG)',
    format: 'Vector SVG',
    description: 'Dark horizontal vector logo with brand mark and typography.',
    downloadUrl: '/images/logo/logo-dark.svg',
    filename: 'aidetector-logo-dark.svg'
  },
  {
    title: 'AIDetector.cx Brand Icon (PNG)',
    format: 'High-Res PNG',
    description: 'Full resolution square brand icon and app glyph.',
    downloadUrl: '/brand/aidetector-icon.png',
    filename: 'aidetector-icon.png'
  },
  {
    title: 'AIDetector.cx Favicon & Symbol',
    format: 'PNG',
    description: 'Compact square brand symbol suitable for avatar and icon grids.',
    downloadUrl: '/favicon.png',
    filename: 'aidetector-symbol.png'
  }
];

/**
 * Factual platform facts for media background.
 */
export const FACT_SHEET = [
  { label: 'Platform Name', value: 'AIDetector.cx' },
  { label: 'Core Category', value: 'AI Content Detection & Integrity Suite' },
  { label: 'Primary Domain', value: 'aidetector.cx' },
  { label: 'Available Formats', value: 'Web Application, REST API, WordPress Plugin, Chrome Extension' },
  { label: 'Analysis Modalities', value: 'Text, Academic Writing, SEO Articles, Images, Video Media' },
  { label: 'Academic Search Coverage', value: 'Crossref, OpenAlex, Unpaywall & Open Web Sources' },
  { label: 'Media Contact', value: 'press@aidetector.cx' }
];

export default function PressPage() {
  return (
    <MainLayout>
      <PageMeta
        title="AIDetector.cx Press & Media | Media Resources"
        description="Official AIDetector.cx press and media resources, company information, product details and verified media coverage."
      />

      {/* Hero Section */}
      <section className="bg-navy text-white py-16 md:py-24 border-b border-border/20">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <Badge className="bg-primary/20 text-primary-foreground border-primary/40 px-3 py-1 mb-5 text-xs font-semibold uppercase tracking-wider">
              Press &amp; Media Desk
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-5 text-balance">
              AIDetector.cx Press &amp; Media
            </h1>
            <p className="text-white/80 text-base md:text-lg leading-relaxed text-pretty mb-8">
              Official information, product resources and media assets for journalists, researchers and publications covering AI-generated content, content integrity and AI detection.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="mailto:press@aidetector.cx"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Mail className="w-4 h-4" /> Media Inquiries
              </a>
              <a
                href="#media-assets"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
              >
                <Download className="w-4 h-4" /> Download Brand Assets
              </a>
              <Link
                to="/detector"
                className="inline-flex items-center gap-2 bg-transparent hover:bg-white/5 text-white/90 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Explore Products <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About AIDetector.cx */}
      <section className="py-14 md:py-18 bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-5">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-2">Company Overview</span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground text-balance mb-4">
                About AIDetector.cx
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed text-pretty mb-4">
                AIDetector.cx is a digital content integrity platform engineered to analyze, detect, and verify digital content in an era of rapid generative AI adoption.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
                The platform delivers transparent multi-modal analysis across text documents, academic manuscripts, editorial blog articles, synthetic images, and video media without black-box opacity or fabricated metrics.
              </p>
            </div>

            <div className="md:col-span-7 bg-muted/30 border border-border rounded-xl p-6">
              <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" /> Key Facts for Press &amp; Reviewers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {FACT_SHEET.map((fact) => (
                  <div key={fact.label} className="border-b border-border/50 pb-2.5">
                    <span className="text-xs text-muted-foreground block mb-0.5">{fact.label}</span>
                    <span className="font-medium text-foreground text-xs md:text-sm">{fact.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products & Technology */}
      <section className="py-16 md:py-20 bg-muted/10 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-2">Technology &amp; Features</span>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-balance mb-3">
              Core Platform Capabilities
            </h2>
            <p className="text-muted-foreground text-sm md:text-base text-pretty">
              An integrated suite of content verification and editorial tools designed for creators, publishers, researchers, and enterprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PRODUCTS_OVERVIEW.map((product) => {
              const Icon = product.icon;
              return (
                <Card key={product.title} className="border-border shadow-sm flex flex-col h-full hover:border-primary/40 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground">
                        {product.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-semibold text-foreground leading-snug">
                      {product.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1 leading-relaxed text-pretty">
                      {product.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 flex flex-col flex-1 justify-between">
                    <ul className="space-y-1.5 mb-4 text-xs text-muted-foreground">
                      {product.highlights.map((h) => (
                        <li key={h} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to={product.href}
                      className="mt-auto inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors pt-2 border-t border-border/50"
                    >
                      View product details <ArrowRight className="w-3 h-3" />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Brand Assets & Media Resources */}
      <section id="media-assets" className="py-16 md:py-20 bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-2">Media Kit</span>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-balance mb-3">
              Official Media &amp; Brand Assets
            </h2>
            <p className="text-muted-foreground text-sm text-pretty">
              Approved graphics, brand marks, and identity files for use by media outlets, reviewers, and partner organizations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {BRAND_ASSETS.map((asset) => (
              <Card key={asset.title} className="border-border shadow-sm flex flex-col justify-between">
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wide">{asset.format}</span>
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-1.5">{asset.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed text-pretty mb-4">
                      {asset.description}
                    </p>
                  </div>
                  <a
                    href={asset.downloadUrl}
                    download={asset.filename}
                    className="inline-flex items-center justify-center gap-2 w-full py-2 px-3 text-xs font-medium bg-muted hover:bg-muted/80 text-foreground border border-border rounded-md transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Asset
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 p-4 bg-muted/20 border border-border rounded-lg text-xs text-muted-foreground flex items-start gap-2.5">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Brand Usage Note:</strong> When referencing AIDetector.cx in media publications, please maintain the exact capitalization (AIDetector.cx) and refer to our tools using their standard functional names. For custom dimensions or specific visual materials, contact our press desk.
            </p>
          </div>
        </div>
      </section>

      {/* Verified Press Coverage */}
      <section className="py-16 md:py-20 bg-muted/10 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-2">Editorial Mentions</span>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-balance mb-3">
              Press Coverage
            </h2>
            <p className="text-muted-foreground text-sm text-pretty">
              Verified independent articles, reviews, and editorial coverage featuring AIDetector.cx.
            </p>
          </div>

          {VERIFIED_PRESS_COVERAGE.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {VERIFIED_PRESS_COVERAGE.map((item) => (
                <Card key={item.id} className="border-border shadow-sm hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wide">{item.publication}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{item.date}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-2 leading-snug">{item.headline}</h3>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mb-3 text-pretty leading-relaxed">{item.description}</p>
                    )}
                    <a
                      href={item.articleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Read article <ExternalLink className="w-3 h-3" />
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="max-w-xl mx-auto text-center bg-card border border-border/80 rounded-xl p-8 shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                <Newspaper className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                Press coverage will be added as it becomes available.
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed text-pretty mb-6">
                If your publication, journal, or media channel has published an article, benchmark, or review of AIDetector.cx, please let our press desk know so we can link to your verified story.
              </p>
              <a
                href="mailto:press@aidetector.cx?subject=Press%20Coverage%20Submission"
                className="inline-flex items-center gap-2 text-xs font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" /> Submit Coverage Link
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Press & Media Inquiries */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <Card className="border-border shadow-md bg-gradient-to-b from-card to-muted/20">
            <CardContent className="p-6 md:p-10">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-7">
                  <Badge variant="outline" className="text-primary border-primary/30 mb-3 text-xs">
                    Get in Touch
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground text-balance mb-3">
                    Media &amp; Press Inquiries
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty mb-4">
                    We welcome interview requests, product testing inquiries, research collaborations, and technical questions regarding generative AI detection, linguistic forensics, and content integrity.
                  </p>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Dedicated evaluation accounts provided for credentialed journalists</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Technical responses directly from engineering and research team</span>
                    </p>
                  </div>
                </div>

                <div className="md:col-span-5 bg-background border border-border rounded-xl p-5 text-center flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Press Contact</h3>
                  <p className="text-xs text-muted-foreground mb-4">Direct media communications</p>
                  <a
                    href="mailto:press@aidetector.cx"
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors w-full justify-center mb-3"
                  >
                    press@aidetector.cx
                  </a>
                  <Link
                    to="/contact"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                  >
                    General contact form <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
