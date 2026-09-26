import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  Search, ExternalLink, Shield, Bot, Video, Image as ImageIcon, Sparkles,
  FileText, PenSquare, Lock, Globe, Code, Layers, BookOpen, Users,
  BarChart2, CheckCircle2, ChevronRight, HelpCircle, Briefcase, FileCode,
  ArrowRight, Filter, ShieldCheck, Terminal, GraduationCap
} from 'lucide-react';

interface PageDirectoryEntry {
  title: string;
  url: string;
  description: string;
  category: string;
  badge?: string;
  access: 'Public' | 'Requires Account' | 'Admin';
  isKeyAction?: boolean;
}

const PAGE_SECTIONS: { id: string; name: string; icon: any; description: string; pages: PageDirectoryEntry[] }[] = [
  {
    id: 'tools-writing',
    name: 'AI Detection & Writing Tools',
    icon: Bot,
    description: 'Text detection, humanization, plagiarism verification, and academic writing assistance.',
    pages: [
      {
        title: 'AI Detector',
        url: '/detector',
        description: 'Multi-engine AI text detection with probability scoring and sentence breakdown.',
        category: 'Writing Tools',
        badge: 'Core Tool',
        access: 'Public',
        isKeyAction: true,
      },
      {
        title: 'Word Counter & AI Detector',
        url: '/word-counter',
        description: 'Instant client-side word, character, sentence, and paragraph counter with integrated AI pattern analysis.',
        category: 'Writing Tools',
        badge: 'Free Tool',
        access: 'Public',
        isKeyAction: true,
      },
      {
        title: 'AI Summarizer',
        url: '/ai-summarizer',
        description: 'Summarize articles, reports, and documents into short, medium, or detailed summaries with source references.',
        category: 'Writing Tools',
        badge: 'Free Tool',
        access: 'Public',
        isKeyAction: true,
      },
      {
        title: 'AI Humanizer',
        url: '/humanizer',
        description: 'Rewrite and humanize AI text to bypass detection while preserving core meaning.',
        category: 'Writing Tools',
        badge: 'Popular',
        access: 'Public',
        isKeyAction: true,
      },
      {
        title: 'Plagiarism Checker',
        url: '/plagiarism-checker',
        description: 'Check content originality across billions of web pages and academic archives.',
        category: 'Writing Tools',
        access: 'Public',
      },
      {
        title: 'SEO Assistant',
        url: '/seo-assistant',
        description: 'Real-time content scoring, keyword density analysis, and readability checks.',
        category: 'Writing Tools',
        access: 'Public',
      },
      {
        title: 'Essay Studio',
        url: '/essay-studio',
        description: 'Structured, AI-assisted academic essay crafting with citation and drafting history.',
        category: 'Writing Tools',
        badge: 'Academic',
        access: 'Requires Account',
      },
      {
        title: 'Content Studio',
        url: '/content-studio',
        description: '12-step guided article creation wizard with automated SEO and humanization.',
        category: 'Writing Tools',
        access: 'Public',
      },
      {
        title: 'AI Tools Directory',
        url: '/tools',
        description: 'Searchable directory of top artificial intelligence tools across writing, video, and design.',
        category: 'Writing Tools',
        access: 'Public',
      },
    ],
  },
  {
    id: 'tools-media',
    name: 'Media Detection & Forensics',
    icon: Video,
    description: 'Deepfake detection, synthetic image inspection, video forensics, and optical flow analysis.',
    pages: [
      {
        title: 'AI Image Detector',
        url: '/ai-image-detector',
        description: 'Analyze visual noise, latent diffusion patterns, and metadata for Midjourney, DALL-E, and Flux images.',
        category: 'Media Detection',
        badge: 'Forensics',
        access: 'Public',
        isKeyAction: true,
      },
      {
        title: 'AI Video Detector',
        url: '/ai-video-detector',
        description: 'Multi-modal optical flow, temporal coherence, and C2PA provenance detection for Sora, Runway, Kling, and deepfakes.',
        category: 'Media Detection',
        badge: 'Multi-modal',
        access: 'Public',
        isKeyAction: true,
      },
      {
        title: 'Why TikTok Flagged My Video as AI',
        url: '/studies/why-tiktok-flagged-my-real-video',
        description: 'Comprehensive creator troubleshooting guide for diagnosing false positive AI labels on TikTok.',
        category: 'Media Detection',
        badge: 'Guide',
        access: 'Public',
      },
      {
        title: 'WhatsApp Compression & AI Video Detection',
        url: '/studies/whatsapp-compression-ai-video',
        description: 'Technical investigation on codec quantization, macroblocking, and video classifier reliability.',
        category: 'Media Detection',
        badge: 'Technical Study',
        access: 'Public',
      },
      {
        title: 'Authentic Video False Positive Guide',
        url: '/studies/authentic-video-false-positives',
        description: 'Forensic breakdown of why pristine camera footage triggers synthetic video detectors.',
        category: 'Media Detection',
        badge: 'Study',
        access: 'Public',
      },
    ],
  },
  {
    id: 'verification',
    name: 'Verified Authorship & Provenance',
    icon: ShieldCheck,
    description: 'Cryptographic proof of human authorship, immutable timestamps, and attestation.',
    pages: [
      {
        title: 'Verified Authorship Overview',
        url: '/authorship',
        description: 'Proof of human authorship certificates with verifiable SHA-256 content hashes.',
        category: 'Verification',
        badge: 'Trust Standard',
        access: 'Public',
        isKeyAction: true,
      },
      {
        title: 'Verify Authorship Portal',
        url: '/verified-authorship/verify',
        description: 'Public lookup tool to verify any tracking code, manuscript certificate, or author claim.',
        category: 'Verification',
        access: 'Public',
      },
      {
        title: 'Register Authorship Claim',
        url: '/verified-authorship/register',
        description: 'Submit an original manuscript or article to generate a cryptographically timestamped record.',
        category: 'Verification',
        access: 'Public',
      },
      {
        title: 'Author Profile & Attestation',
        url: '/authorship/profile',
        description: 'Public and authenticated verified author identities, credentials, and published records.',
        category: 'Verification',
        access: 'Requires Account',
      },
    ],
  },
  {
    id: 'solutions-services',
    name: 'Solutions & Agency Services',
    icon: Briefcase,
    description: 'Professional SEO, AI consulting, custom website development, and conversion optimization.',
    pages: [
      {
        title: 'All Agency Services',
        url: '/services',
        description: 'Overview of bespoke consulting, SEO acceleration, and enterprise AI development services.',
        category: 'Solutions',
        badge: 'Services',
        access: 'Public',
      },
      {
        title: 'SEO Consulting Services',
        url: '/services/seo-consulting',
        description: 'High-impact enterprise search strategy, algorithmic recovery, and topical authority building.',
        category: 'Solutions',
        access: 'Public',
      },
      {
        title: 'AI Consulting & Integration',
        url: '/services/ai-consulting',
        description: 'Bespoke LLM deployments, fine-tuning, automated content pipelines, and AI governance.',
        category: 'Solutions',
        access: 'Public',
      },
      {
        title: 'Conversion Rate Optimization',
        url: '/services/conversion-optimization',
        description: 'Auditing, split-testing, and funnel optimization to maximize customer acquisition.',
        category: 'Solutions',
        access: 'Public',
      },
      {
        title: 'Growth Marketing',
        url: '/services/growth-marketing',
        description: 'Scalable multi-channel user acquisition, paid performance, and lifecycle funnels.',
        category: 'Solutions',
        access: 'Public',
      },
      {
        title: 'Website Development Services',
        url: '/services/website-development',
        description: 'Custom React, Next.js, and headless web engineering with built-in speed and SEO.',
        category: 'Solutions',
        access: 'Public',
      },
      {
        title: 'Case Studies',
        url: '/case-studies',
        description: 'Real client results and ROI metrics across SEO, AI integration, and content humanization.',
        category: 'Solutions',
        access: 'Public',
      },
      {
        title: 'Hire an Expert',
        url: '/hire-expert',
        description: 'Connect with certified AI consultants, forensic analysts, and technical SEO architects.',
        category: 'Solutions',
        access: 'Public',
      },
    ],
  },
  {
    id: 'integrations-developer',
    name: 'Integrations, API & Ecosystem',
    icon: Code,
    description: 'Enterprise REST APIs, CMS plugins, browser extensions, and developer tooling.',
    pages: [
      {
        title: 'Developer Portal',
        url: '/developer',
        description: 'Developer hub with SDKs, quickstart guides, sandbox keys, and code samples.',
        category: 'Developer',
        badge: 'Developer',
        access: 'Public',
      },
      {
        title: 'Enterprise REST API Platform',
        url: '/api',
        description: 'Low-latency REST API endpoints for text, image, and video detection at enterprise scale.',
        category: 'Developer',
        badge: 'API',
        access: 'Public',
      },
      {
        title: 'API Documentation',
        url: '/api/docs',
        description: 'Full interactive OpenAPI specifications, endpoint parameters, and error handling.',
        category: 'Developer',
        access: 'Public',
      },
      {
        title: 'API Dashboard',
        url: '/api/dashboard',
        description: 'Manage API keys, inspect request volume, monitor latency, and configure rate limits.',
        category: 'Developer',
        access: 'Public',
      },
      {
        title: 'WordPress Plugin',
        url: '/wordpress-plugin',
        description: 'Seamlessly scan posts, Gutenberg blocks, and editor drafts inside WordPress.',
        category: 'Integrations',
        badge: 'CMS Plugin',
        access: 'Public',
      },
      {
        title: 'Chrome Extension',
        url: '/chrome-extension',
        description: 'Right-click to scan web pages, Google Docs, ChatGPT chats, and email drafts.',
        category: 'Integrations',
        badge: 'Browser Addon',
        access: 'Public',
      },
      {
        title: 'Integrations Hub',
        url: '/integrations',
        description: 'Connect AIDetector.cx to Zapier, Make, Slack, HubSpot, and custom webhooks.',
        category: 'Integrations',
        access: 'Public',
      },
      {
        title: 'Apps Marketplace',
        url: '/apps',
        description: 'Discover third-party workflows, community extensions, and automation recipes.',
        category: 'Integrations',
        access: 'Public',
      },
    ],
  },
  {
    id: 'resources-research',
    name: 'Resources, Research & Editorial Guides',
    icon: BookOpen,
    description: 'In-depth research benchmarks, tool comparisons, educational guides, and community.',
    pages: [
      {
        title: 'Case Studies',
        url: '/case-studies',
        description: 'Real enterprise and institutional benchmarks across AI detection, API integration, and content provenance.',
        category: 'Resources',
        access: 'Public',
      },
      {
        title: 'Educational Guides Hub',
        url: '/guides',
        description: 'Practical guides on AI detection mechanics, algorithmic signals, and best practices.',
        category: 'Resources',
        access: 'Public',
      },
      {
        title: 'Research & Benchmarks Hub',
        url: '/research',
        description: 'Transparent empirical accuracy tests and detection benchmarks across LLM models.',
        category: 'Resources',
        access: 'Public',
      },
      {
        title: 'Tool Comparisons Hub',
        url: '/comparisons',
        description: 'Side-by-side breakdowns comparing AIDetector.cx against Turnitin, GPTZero, Copyleaks, and more.',
        category: 'Resources',
        access: 'Public',
      },
      {
        title: 'Official Blog & News',
        url: '/blog',
        description: 'Product updates, AI industry news, regulatory developments, and expert commentary.',
        category: 'Resources',
        access: 'Public',
      },
      {
        title: 'Best AI Detector in 2026',
        url: '/guides/best-ai-detector',
        description: 'Comprehensive 400-sample benchmark testing leading commercial and open detectors.',
        category: 'Resources',
        access: 'Public',
      },
      {
        title: 'How AI Detection Works: Technical Guide',
        url: '/guides/how-ai-detection-works',
        description: 'Algorithmic explanation of perplexity, burstiness, n-gram probabilities, and classifiers.',
        category: 'Resources',
        access: 'Public',
      },
      {
        title: 'Why Was My Essay Flagged as AI?',
        url: '/guides/why-was-my-essay-flagged-as-ai',
        description: 'Why human academic writing triggers false alarms and how to appeal with evidence.',
        category: 'Resources',
        access: 'Public',
      },
      {
        title: 'Words That Trigger AI Detection',
        url: '/guides/words-that-trigger-ai-detection',
        description: 'Statistical word patterns and transitional phrases frequently overrepresented in AI text.',
        category: 'Resources',
        access: 'Public',
      },
      {
        title: 'Turnitin vs AIDetector.cx Comparison',
        url: '/comparisons/turnitin-vs-aidetector-cx',
        description: 'Direct feature, accuracy, cost, and workflow comparison for universities and publishers.',
        category: 'Resources',
        access: 'Public',
      },
      {
        title: 'Can Universities Detect ChatGPT?',
        url: '/guides/can-universities-detect-chatgpt',
        description: 'In-depth analysis of university detection policies, LMS integration, and limitations.',
        category: 'Resources',
        access: 'Public',
      },
      {
        title: 'Community Forum',
        url: '/community',
        description: 'Join discussions with 85,000+ creators, researchers, and SEO specialists.',
        category: 'Resources',
        access: 'Public',
      },
      {
        title: 'Weekly Newsletter',
        url: '/newsletter',
        description: 'Get the latest AI detection benchmarks, prompt engineering tips, and industry alerts.',
        category: 'Resources',
        access: 'Public',
      },
      {
        title: 'Affiliate & Partner Hub',
        url: '/affiliate-hub',
        description: 'Earn 30% recurring commissions promoting the top AI detection and humanizer platform.',
        category: 'Resources',
        access: 'Public',
      },
    ],
  },
  {
    id: 'company-legal',
    name: 'Company, Pricing & Legal',
    icon: Globe,
    description: 'About our mission, contact details, pricing plans, security, and legal policies.',
    pages: [
      {
        title: 'Pricing & Plans',
        url: '/pricing',
        description: 'Transparent subscription tiers for individuals, professional creators, and enterprise teams.',
        category: 'Company',
        badge: 'Plans',
        access: 'Public',
        isKeyAction: true,
      },
      {
        title: 'About AIDetector.cx',
        url: '/about',
        description: 'Our mission, technology background, leadership, and vision for trusted content.',
        category: 'Company',
        access: 'Public',
      },
      {
        title: 'Contact Support & Inquiries',
        url: '/contact',
        description: 'Get in touch with customer support, sales, enterprise partnerships, or press inquiries.',
        category: 'Company',
        access: 'Public',
      },
      {
        title: 'Careers',
        url: '/careers',
        description: 'Join our team building the next generation of AI provenance and verification tools.',
        category: 'Company',
        access: 'Public',
      },
      {
        title: 'Press & Media Kit',
        url: '/press',
        description: 'Brand assets, press releases, media contacts, and executive bios.',
        category: 'Company',
        access: 'Public',
      },
      {
        title: 'Privacy Policy',
        url: '/privacy',
        description: 'Our data protection commitments, zero-retention scanning modes, and GDPR compliance.',
        category: 'Legal',
        access: 'Public',
      },
      {
        title: 'Terms of Service',
        url: '/terms',
        description: 'User agreement, acceptable use guidelines, and platform service terms.',
        category: 'Legal',
        access: 'Public',
      },
      {
        title: 'Cookie Policy',
        url: '/cookies',
        description: 'Information about browser cookies, tracking settings, and preference controls.',
        category: 'Legal',
        access: 'Public',
      },
    ],
  },
  {
    id: 'user-workspace',
    name: 'User Workspace & Account Portals',
    icon: Lock,
    description: 'Authenticated dashboards for scans, team collaboration, and account management.',
    pages: [
      {
        title: 'User Dashboard',
        url: '/dashboard',
        description: 'Overview of recent text scans, credit balances, usage analytics, and active tools.',
        category: 'Account',
        badge: 'Protected',
        access: 'Requires Account',
      },
      {
        title: 'Scan Progress & History',
        url: '/dashboard/progress',
        description: 'Detailed logs of previous text and media detection jobs with full reports.',
        category: 'Account',
        access: 'Requires Account',
      },
      {
        title: 'Verified Authorship Dashboard',
        url: '/authorship/dashboard',
        description: 'Manage registered manuscripts, certificates, blockchain timestamps, and attestation.',
        category: 'Account',
        access: 'Requires Account',
      },
      {
        title: 'Organizations & Team Seats',
        url: '/organizations',
        description: 'Multi-seat team workspace, shared credit pools, and role-based permissions.',
        category: 'Account',
        access: 'Requires Account',
      },
      {
        title: 'Shared Team Reports',
        url: '/reports/shared',
        description: 'Collaborative analysis reports accessible by team members and external stakeholders.',
        category: 'Account',
        access: 'Requires Account',
      },
      {
        title: 'Security & Privacy Controls',
        url: '/security',
        description: 'Manage two-factor authentication, active sessions, API credentials, and data retention.',
        category: 'Account',
        access: 'Requires Account',
      },
      {
        title: 'Communication Preferences',
        url: '/settings/preferences',
        description: 'Configure email alerts, newsletter subscriptions, and notification settings.',
        category: 'Account',
        access: 'Requires Account',
      },
    ],
  },
];

export default function AllPagesDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [accessFilter, setAccessFilter] = useState<'all' | 'Public' | 'Requires Account'>('all');
  const { isFeatureVisible: checkFeatureVisible } = useFeatureFlags();

  const visibleSections = useMemo(() => {
    return PAGE_SECTIONS.map((section) => ({
      ...section,
      pages: section.pages.filter((page) => checkFeatureVisible(page.url, 'all')),
    })).filter((section) => section.pages.length > 0);
  }, [checkFeatureVisible]);

  const totalPages = useMemo(() => {
    return visibleSections.reduce((acc, section) => acc + section.pages.length, 0);
  }, [visibleSections]);

  const filteredSections = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return visibleSections.map((section) => {
      const matchingPages = section.pages.filter((page) => {
        // Access filter
        if (accessFilter !== 'all' && page.access !== accessFilter) {
          return false;
        }
        // Category filter
        if (selectedCategory !== 'all' && section.id !== selectedCategory) {
          return false;
        }
        // Search query
        if (!q) return true;
        return (
          page.title.toLowerCase().includes(q) ||
          page.description.toLowerCase().includes(q) ||
          page.url.toLowerCase().includes(q) ||
          page.category.toLowerCase().includes(q)
        );
      });

      return {
        ...section,
        pages: matchingPages,
      };
    }).filter((section) => section.pages.length > 0);
  }, [visibleSections, searchQuery, selectedCategory, accessFilter]);

  const totalMatches = useMemo(() => {
    return filteredSections.reduce((acc, section) => acc + section.pages.length, 0);
  }, [filteredSections]);

  return (
    <MainLayout>
      <PageMeta
        title="All Pages Directory · Complete Site Index | AIDetector.cx"
        description="Browse the complete directory of AIDetector.cx pages, tools, research studies, integrations, APIs, and guides. Search and access all public destinations."
      />

      <div className="bg-gradient-to-b from-primary/5 via-background to-background py-16 md:py-24 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-3">
              <Globe className="w-4 h-4" />
              <span>AIDetector.cx Site Directory</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
              Explore All Pages & Tools
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed text-pretty mb-8">
              Discover every verified tool, research study, API endpoint, guide, and service across the AIDetector.cx ecosystem.
            </p>

            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search pages by title, topic, URL, or feature..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 h-12 text-base rounded-xl bg-card border-border shadow-sm focus:ring-2 focus:ring-primary/20"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                  className="rounded-full text-xs h-8"
                >
                  All Categories ({totalPages})
                </Button>
                {PAGE_SECTIONS.map((sec) => (
                  <Button
                    key={sec.id}
                    variant={selectedCategory === sec.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(sec.id)}
                    className="rounded-full text-xs h-8"
                  >
                    {sec.name.split('&')[0].trim()}
                  </Button>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span>Access mode:</span>
                  <button
                    onClick={() => setAccessFilter('all')}
                    className={`font-medium transition-colors ${accessFilter === 'all' ? 'text-primary underline' : 'hover:text-foreground'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setAccessFilter('Public')}
                    className={`font-medium transition-colors ${accessFilter === 'Public' ? 'text-primary underline' : 'hover:text-foreground'}`}
                  >
                    Public Only
                  </button>
                  <button
                    onClick={() => setAccessFilter('Requires Account')}
                    className={`font-medium transition-colors ${accessFilter === 'Requires Account' ? 'text-primary underline' : 'hover:text-foreground'}`}
                  >
                    Account Portals
                  </button>
                </div>
                <div>
                  Showing <span className="font-semibold text-foreground">{totalMatches}</span> pages
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        {filteredSections.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border p-8">
            <HelpCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">No pages found matching "{searchQuery}"</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              Try searching with different keywords, or reset your category and access filters to explore all available destinations.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setAccessFilter('all');
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-16">
            {filteredSections.map((section) => {
              const SectionIcon = section.icon;
              return (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <SectionIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        {section.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    {section.pages.map((page) => (
                      <Link
                        key={page.url}
                        to={page.url}
                        className="group flex flex-col justify-between p-5 rounded-xl border border-border bg-card hover:bg-muted/40 hover:border-primary/40 transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                              {page.category}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {page.badge && (
                                <Badge variant="secondary" className="text-[10px] h-5 bg-primary/10 text-primary border-primary/20">
                                  {page.badge}
                                </Badge>
                              )}
                              {page.access === 'Requires Account' && (
                                <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" /> Account
                                </span>
                              )}
                            </div>
                          </div>

                          <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors flex items-center gap-1.5">
                            {page.title}
                          </h3>
                          <p className="text-muted-foreground text-xs mt-1.5 line-clamp-2 leading-relaxed">
                            {page.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50 text-xs font-medium text-muted-foreground">
                          <code className="text-[11px] text-muted-foreground/80 font-mono">
                            {page.url}
                          </code>
                          <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            Visit <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Access CTA Box */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-20">
        <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl">
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Looking for a custom integration or partnership?
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Explore our developer documentation, integrate our high-speed detection API into your workflow, or connect with our agency consulting team.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button asChild>
              <Link to="/detector">Try AI Detector</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/api">API Platform</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
