import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import PageMeta from '@/components/common/PageMeta';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  LayoutTemplate, Shield, CheckCircle2, Zap, Download, Key, Activity,
  Star, Globe, Settings, Bell, Database, BarChart3, BookOpen, Users,
  Building2, Newspaper, Briefcase, Megaphone, PenTool, GraduationCap,
  Code2, FileText, Layers, RefreshCw, Lock, ArrowRight, ArrowDown,
  ChevronRight, Sparkles, ShieldCheck, Bot, Terminal, Puzzle, History,
  ClipboardList, TrendingUp, Edit3, Eye, Package, UserCheck
} from 'lucide-react';

// ─── preserved download / auth logic — DO NOT CHANGE ─────────────────────────
const PLUGIN_URL = 'https://hzjnrmxwzkeaodvusszx.supabase.co/storage/v1/object/public/plugins/aidetector-wp.zip?v=2.4.5';

// ─── constants ────────────────────────────────────────────────────────────────
const META_STATS = [
  { label: 'WordPress Compatibility', value: '6.0+', sub: 'Up to WP 6.8' },
  { label: 'PHP Compatibility', value: '7.4+', sub: 'Tested on PHP 8.3' },
  { label: 'Version', value: '2.4.5', sub: 'Released May 2025' },
  { label: 'Active Installs', value: '25K+', sub: 'Latest update May 2025' },
];

const WORKFLOW_STEPS = [
  { icon: Edit3, label: 'Write article', color: 'text-primary' },
  { icon: Bot, label: 'Run AI detection', color: 'text-primary' },
  { icon: Zap, label: 'Humanize if needed', color: 'text-primary' },
  { icon: Shield, label: 'Check plagiarism', color: 'text-success' },
  { icon: TrendingUp, label: 'Optimize content', color: 'text-success' },
  { icon: Globe, label: 'Publish', color: 'text-success' },
];

const FEATURES = [
  { icon: Layers, title: 'Gutenberg Integration', desc: 'Analyze and humanize blocks directly inside the Block Editor. AI scores appear inline without leaving your editor.' },
  { icon: Edit3, title: 'Classic Editor Support', desc: 'Full support for TinyMCE-based Classic Editor via a native toolbar button and sidebar panel.' },
  { icon: ClipboardList, title: 'Bulk Content Scanning', desc: 'Scan all posts, pages, or custom post types in one click from the Posts or Pages admin list.' },
  { icon: Bell, title: 'Scheduled Detection', desc: 'Set up cron-based scheduled scans for all new content or content updated within a time window.' },
  { icon: Activity, title: 'Real-time Analysis', desc: 'Instant AI score in the sidebar as you type, powered by a non-blocking background API call.' },
  { icon: TrendingUp, title: 'SEO Workflow', desc: 'Integrates with Rank Math and Yoast to show AI scores alongside SEO scores in the same panel.' },
  { icon: UserCheck, title: 'Editorial Review', desc: 'Flag posts for editorial review when AI probability exceeds a configurable threshold before publishing.' },
  { icon: Key, title: 'API Integration', desc: 'REST API endpoints for external automation and headless publishing pipelines.' },
  { icon: Users, title: 'Role Permissions', desc: 'Configure which WordPress user roles (Editor, Author, Contributor) can view and run AI detection.' },
  { icon: Globe, title: 'Multi-site Support', desc: 'Full WordPress Multisite network support with per-site configuration and network-level admin.' },
  { icon: BarChart3, title: 'Dashboard Reports', desc: 'AI detection statistics, humanization counts, and content quality trends in a custom admin dashboard.' },
  { icon: History, title: 'Publishing History', desc: 'Per-post history of all AI detection scores, humanization events, and plagiarism check results.' },
];

const PUBLISHING_TEAMS = [
  { icon: GraduationCap, title: 'Universities', desc: 'Flag student submission content in LMS-integrated blogs and course sites before publication.' },
  { icon: Newspaper, title: 'Newsrooms', desc: 'Enforce editorial AI policy automatically — no article gets published without passing the AI review threshold.' },
  { icon: Briefcase, title: 'Agencies', desc: 'Review AI-generated client content in bulk before it goes live, from a single network admin panel.' },
  { icon: Building2, title: 'Enterprise Businesses', desc: 'API-driven integration with internal approval workflows, Slack notifications, and compliance audit logs.' },
  { icon: BookOpen, title: 'Publishers', desc: 'Multi-author editorial workflow with role-based AI score visibility for contributors and editors.' },
  { icon: Megaphone, title: 'Marketing Teams', desc: 'Humanize AI-drafted campaign content in the block editor and schedule publication in one step.' },
  { icon: PenTool, title: 'Blog Owners', desc: 'Automatically scan every post before publishing and get notified if AI content exceeds your threshold.' },
];

const INSTALL_STEPS = [
  { step: '01', icon: Download, title: 'Download the Plugin', desc: 'Click "Download Plugin" to get the latest v2.4.5 ZIP file with updated API support.' },
  { step: '02', icon: Package, title: 'Upload ZIP', desc: 'Go to WordPress Admin → Plugins → Add New → Upload Plugin. Select the ZIP and click Install Now.' },
  { step: '03', icon: Sparkles, title: 'Activate', desc: 'Click Activate Plugin. You\'ll see the AIDetector.cx entry in your WordPress admin menu.' },
  { step: '04', icon: Key, title: 'Connect Account', desc: 'Go to Settings → AIDetector.cx, paste your API key from your dashboard, and save.' },
  { step: '05', icon: Bot, title: 'Start Detecting', desc: 'Open any post or page. The AI Detection panel appears in the editor sidebar ready to use.' },
];

const COMPATIBILITY = [
  { name: 'WordPress', icon: LayoutTemplate, note: '6.0 – 6.8' },
  { name: 'WooCommerce', icon: Globe, note: 'Product descriptions' },
  { name: 'Elementor', icon: Layers, note: 'Custom post types' },
  { name: 'Divi', icon: Layers, note: 'Page builder posts' },
  { name: 'Gutenberg', icon: Edit3, note: 'Block editor native' },
  { name: 'Classic Editor', icon: FileText, note: 'TinyMCE toolbar' },
  { name: 'Rank Math', icon: TrendingUp, note: 'SEO panel integration' },
  { name: 'Yoast SEO', icon: TrendingUp, note: 'SEO panel integration' },
  { name: 'WPML', icon: Globe, note: 'Multilingual sites' },
  { name: 'Polylang', icon: Globe, note: 'Multilingual sites' },
];

const DEVELOPER_FEATURES = [
  { icon: Terminal, title: 'REST API', desc: 'POST /wp-json/aidetector/v1/detect and /humanize — full detection and humanization over HTTP for any external integration.' },
  { icon: Code2, title: 'WordPress Hooks', desc: 'action: aidetector_after_detect, aidetector_after_humanize. Trigger your own logic on every analysis result.' },
  { icon: Puzzle, title: 'Filters', desc: 'filter: aidetector_request_args, aidetector_result. Modify API payloads and transform results programmatically.' },
  { icon: Settings, title: 'Actions', desc: 'aidetector_before_publish, aidetector_scan_complete — block or annotate publishing flows based on AI scores.' },
  { icon: FileText, title: 'Shortcodes', desc: '[aidetector_score post_id="..."] — embed AI scores anywhere in your theme or page builder.' },
  { icon: Database, title: 'Enterprise Deployment', desc: 'wp-config.php constant support, WP-CLI commands for bulk scanning, and Multisite network activation.' },
];

const TESTIMONIALS = [
  { name: 'Sarah L.', role: 'Managing Editor, Digital News', rating: 5, quote: 'We process 40+ articles a day. The bulk scan and editorial threshold feature means nothing slips through. It paid for itself in one week.' },
  { name: 'Daniel K.', role: 'WordPress Agency Owner', rating: 5, quote: 'We deploy it across all client sites via Multisite. The network admin panel is clean and the API integration fits our CI pipeline perfectly.' },
  { name: 'Prof. Aisha R.', role: 'University Blog Administrator', rating: 5, quote: 'We use it on our institution\'s WordPress network. The role permission system means students see scores but cannot bypass the review gate.' },
  { name: 'Tom W.', role: 'SEO & Content Strategist', rating: 5, quote: 'The Rank Math integration is seamless. I see SEO and AI scores in the same panel, which makes editorial decisions instant.' },
  { name: 'Fatima H.', role: 'Marketing Director', rating: 5, quote: 'Our content team drafts in ChatGPT and polishes in the WordPress editor. The humanizer sidebar turns a 20-minute task into 90 seconds.' },
  { name: 'James O.', role: 'Solo Blog Owner', rating: 5, quote: 'I write 3x more posts than I used to because the AI quality check is built into my publishing flow. It feels invisible — in a good way.' },
];

const FAQS: { q: string; a: string }[] = [
  { q: 'How do I install the AI Detector WordPress Plugin?', a: 'Download the ZIP, go to WordPress Admin → Plugins → Add New → Upload Plugin, upload the ZIP, click Install Now, then Activate.' },
  { q: 'What WordPress versions are supported?', a: 'WordPress 6.0 through 6.8. We test on the latest stable release with each plugin update.' },
  { q: 'What PHP version is required?', a: 'PHP 7.4 minimum. PHP 8.0, 8.1, 8.2, and 8.3 are all fully tested and supported.' },
  { q: 'Does the plugin work with the Block (Gutenberg) Editor?', a: 'Yes. The plugin adds a native Block Editor sidebar panel with real-time AI scores, humanization controls, and plagiarism results.' },
  { q: 'Does the plugin support Classic Editor?', a: 'Yes. A toolbar button and meta box are added automatically when Classic Editor is active.' },
  { q: 'Is the plugin compatible with WooCommerce?', a: 'Yes. AI detection works on WooCommerce product descriptions in both the block editor and classic product editor.' },
  { q: 'Does it integrate with Rank Math or Yoast SEO?', a: 'Yes. AI scores appear in the same editor sidebar panel as Rank Math and Yoast, so you see SEO and AI quality in one view.' },
  { q: 'How do I connect my AIDetector.cx account to the plugin?', a: 'Go to Settings → AIDetector.cx in your WordPress admin, paste your API key from your AIDetector.cx dashboard, and click Save.' },
  { q: 'Where do I get my API key?', a: 'Log in to AIDetector.cx, go to Dashboard → API, and copy your key. Free accounts get a limited quota; Pro accounts get unlimited API access.' },
  { q: 'Can I bulk scan all posts at once?', a: 'Yes. Go to Posts → All Posts, select posts, and choose "Scan with AI Detector" from the Bulk Actions dropdown.' },
  { q: 'Is there a scheduled scan feature?', a: 'Yes. You can configure automatic scheduled scans (daily, weekly) for all new or updated content from the plugin settings.' },
  { q: 'What is the editorial review threshold?', a: 'A configurable AI probability percentage. Posts exceeding the threshold are flagged "Pending AI Review" and cannot be published until manually cleared by an Editor.' },
  { q: 'Which user roles can use the AI detection features?', a: 'Configurable per-role. By default, Editors and Administrators see full detection results; Authors see a simplified score; Contributors see no results.' },
  { q: 'Does the plugin work on WordPress Multisite?', a: 'Yes. Activate network-wide from the Network Admin → Plugins page. Each site has its own settings; the Network Admin has a centralized report.' },
  { q: 'How does the humanizer work inside WordPress?', a: 'Select text in the block or classic editor, click "Humanize" in the AI Detector sidebar, choose a mode, and the rewritten text is pasted back into the editor in one click.' },
  { q: 'Does humanization preserve my formatting and HTML?', a: 'Yes. The humanizer processes plain text and returns it formatted to match the original block structure. Bold, links, and heading hierarchy are preserved.' },
  { q: 'Does the plugin affect page load speed?', a: 'No. All AI processing happens asynchronously in the WordPress admin only. No scripts or detection logic are loaded on the public-facing site.' },
  { q: 'Is the plugin compatible with caching plugins like WP Rocket?', a: 'Yes. The plugin operates in the admin area only and has no impact on front-end page caching.' },
  { q: 'Will the plugin work with my managed WordPress host (WP Engine, Kinsta, Cloudways)?', a: 'Yes. The plugin uses standard WordPress APIs and REST calls. No server-level modifications are needed.' },
  { q: 'Does the plugin require Composer or any server-side dependencies?', a: 'No. The plugin is self-contained. No Composer, Node.js, or server CLI access required.' },
  { q: 'What API endpoints does the plugin expose?', a: 'POST /wp-json/aidetector/v1/detect, POST /wp-json/aidetector/v1/humanize, GET /wp-json/aidetector/v1/history/{post_id}.' },
  { q: 'Is there WP-CLI support?', a: 'Yes. wp aidetector scan --all, wp aidetector scan --post_id=123, wp aidetector report are available for server-side automation.' },
  { q: 'Are there WordPress action hooks available?', a: 'Yes: aidetector_after_detect, aidetector_after_humanize, aidetector_before_publish. Full documentation is in the developer section.' },
  { q: 'What filters does the plugin provide?', a: 'aidetector_request_args (modify API payload), aidetector_result (transform result data), aidetector_score_label (customize score labels in the UI).' },
  { q: 'Does the plugin store detection results in the database?', a: 'Yes. Results are stored in post meta and a custom database table for history and reporting. All data is local to your WordPress installation.' },
  { q: 'Does the plugin send my content to third-party servers?', a: 'Content is sent to the AIDetector.cx API for analysis only. It is not shared with other third parties. See our Privacy Policy for details.' },
  { q: 'Is the plugin GDPR-compliant?', a: 'Yes. Processing is consent-based, data is stored locally on your server, and the API is GDPR-compliant under our DPA.' },
  { q: 'How often is the plugin updated?', a: 'The plugin receives updates every 4–8 weeks with new detection model support, compatibility patches, and feature improvements.' },
  { q: 'Can I use the plugin with WPML or Polylang for multilingual sites?', a: 'Yes. AI detection and humanization work on all post languages. Results are stored per-language per-post.' },
  { q: 'What is the Dashboard Reports feature?', a: 'A custom admin page showing charts of AI detection scores over time, top flagged content, humanization counts, and team activity.' },
  { q: 'Can I export detection reports?', a: 'Yes. Export detection history as CSV from the Dashboard Reports page. API access allows full programmatic data retrieval.' },
  { q: 'What does the plagiarism check inside WordPress do?', a: 'It submits the post content to the plagiarism API and returns a similarity score with source matches, visible in the editor sidebar.' },
  { q: 'Is there an enterprise license?', a: 'Yes. Enterprise licenses cover unlimited sites, priority support, a dedicated account manager, custom SLA, and SAML SSO. Contact sales@aidetector.cx.' },
  { q: 'What is the difference between Free and Pro for the plugin?', a: 'Free: 50 detections/month, basic humanizer. Pro: unlimited detections, all 4 humanizer modes, bulk scanning, scheduled detection, dashboard reports, API access.' },
  { q: 'Can I use the plugin without an internet connection?', a: 'No. Detection and humanization require connectivity to the AIDetector.cx API. Admin UI and stored history are accessible offline.' },
  { q: 'Does the plugin conflict with security plugins like Wordfence?', a: 'No known conflicts. The plugin uses only standard WordPress REST API routes and post meta. Wordfence, iThemes Security, and Sucuri have been tested.' },
  { q: 'How do I update the plugin?', a: 'Updates appear in WordPress Admin → Dashboard → Updates like any other plugin. Automatic background updates can be enabled in plugin settings.' },
  { q: 'How do I get support?', a: 'Open a ticket at support@aidetector.cx, post on the community forum, or use the Help button inside the plugin\'s settings page.' },
  { q: 'Is there a free trial of the Pro plan?', a: 'Yes. Start with the free plan (50 detections/month) or activate a 7-day Pro trial from your AIDetector.cx dashboard — no credit card required.' },
  { q: 'Can the plugin send Slack or email notifications when content is flagged?', a: 'Email notifications are built-in. Slack notifications are available via the plugin\'s webhook settings or using the aidetector_after_detect hook.' },
];

const WP_SCHEMAS = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'AI Detector WordPress Plugin',
    description: 'Detect AI-generated content, humanize writing, scan plagiarism, and improve publishing workflows directly inside WordPress.',
    url: 'https://www.aidetector.cx/wordpress-plugin',
    breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.aidetector.cx' },
      { '@type': 'ListItem', position: 2, name: 'WordPress Plugin', item: 'https://www.aidetector.cx/wordpress-plugin' },
    ]},
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AIDetector.cx WordPress Plugin',
    operatingSystem: 'WordPress 6.0+',
    applicationCategory: 'WebApplication',
    description: 'AI Detector WordPress Plugin — detect, humanize, and scan content from inside the WordPress editor.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '1200' },
    softwareVersion: '2.4.5',
    url: 'https://www.aidetector.cx/wordpress-plugin',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Install the AI Detector WordPress Plugin',
    step: INSTALL_STEPS.map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.title, text: s.desc })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AIDetector.cx',
    url: 'https://www.aidetector.cx',
    logo: 'https://www.aidetector.cx/logo.png',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function WordPressPluginPage() {
  const [downloading, setDownloading] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const { user } = useAuth();
  const installRef = useRef<HTMLDivElement>(null);

  // Preserved original download logic
  const handleDownload = async () => {
    setDownloading(true);
    setTimeout(() => {
      window.open(PLUGIN_URL, '_blank');
      setDownloading(false);
      toast.success('Plugin downloaded successfully!');
    }, 800);
  };

  const scrollToInstall = () => installRef.current?.scrollIntoView({ behavior: 'smooth' });
  const visibleFaqs = faqOpen ? FAQS : FAQS.slice(0, 10);

  return (
    <MainLayout>
      <PageMeta
        title="AI Detector WordPress Plugin — AI Content Detection Inside WordPress"
        description="Download the AI Detector WordPress Plugin to detect AI-generated content, humanize writing, and scan for plagiarism directly inside your WordPress editor. Free to start."
        ogTitle="AI Detector WordPress Plugin | AIDetector.cx"
        ogDescription="Detect AI content, humanize posts, and scan plagiarism without leaving WordPress. Gutenberg, Classic Editor, Rank Math, Yoast, and Multisite compatible."
        schemas={WP_SCHEMAS}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-20 overflow-hidden bg-gradient-to-br from-background via-background to-success/5">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-success/6 blur-3xl" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex flex-wrap gap-2 mb-5">
                <Badge className="gap-1 bg-success/10 text-success border-success/20 font-medium">
                  <LayoutTemplate className="w-3.5 h-3.5" /> WordPress Plugin
                </Badge>
                <Badge className="gap-1 bg-primary/10 text-primary border-primary/20 font-medium">
                  <Layers className="w-3.5 h-3.5" /> Gutenberg Native
                </Badge>
                <Badge className="gap-1 bg-muted text-muted-foreground border-border font-medium">
                  <Globe className="w-3.5 h-3.5" /> Multisite Ready
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5 text-balance">
                AI Detector{' '}
                <span className="bg-gradient-to-r from-success to-primary bg-clip-text text-transparent">
                  WordPress Plugin
                </span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 text-pretty max-w-lg">
                Detect AI-generated content, humanize writing, scan plagiarism, and improve publishing workflows
                directly inside WordPress — from the same editor you already use.
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <Button size="lg" className="gap-2 font-semibold bg-success hover:bg-success/90 text-success-foreground" onClick={handleDownload} disabled={downloading}>
                  {downloading
                    ? <><RefreshCw className="w-4 h-4 animate-spin" />Downloading…</>
                    : <><Download className="w-4 h-4" />Download Plugin</>}
                </Button>
                <Button size="lg" variant="outline" className="gap-2" onClick={scrollToInstall}>
                  <Eye className="w-4 h-4" /> View Documentation
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {META_STATS.map((s) => (
                  <div key={s.label} className="bg-muted/50 rounded-xl px-4 py-3 border border-border/50">
                    <div className="text-xl font-bold text-foreground">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* right — WP editor mockup */}
            <div className="hidden md:flex items-center justify-center">
              <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                {/* WP admin bar */}
                <div className="bg-[hsl(var(--navy))] px-4 py-2.5 flex items-center gap-3">
                  <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center">
                    <LayoutTemplate className="w-3 h-3 text-white/80" />
                  </div>
                  <span className="text-xs text-white/70 font-medium">Edit Post — WordPress</span>
                </div>
                {/* editor area */}
                <div className="flex">
                  {/* fake content area */}
                  <div className="flex-1 p-4 border-r border-border/50 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted/60 rounded w-full" />
                    <div className="h-3 bg-muted/60 rounded w-5/6" />
                    <div className="h-3 bg-muted/60 rounded w-full" />
                    <div className="h-3 bg-muted/60 rounded w-2/3" />
                    <div className="mt-3 h-3 bg-muted/60 rounded w-full" />
                    <div className="h-3 bg-muted/60 rounded w-5/6" />
                  </div>
                  {/* fake sidebar panel */}
                  <div className="w-[130px] shrink-0 p-3 space-y-3 bg-muted/20">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">AI Detector</div>
                    <div className="bg-card border border-border rounded-lg p-2 space-y-1.5">
                      <div className="text-[10px] text-muted-foreground">AI Score</div>
                      <div className="text-lg font-bold text-destructive">87%</div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-destructive rounded-full" style={{ width: '87%' }} />
                      </div>
                    </div>
                    <div className="flex-1 h-7 rounded-md bg-success flex items-center justify-center gap-1 cursor-default select-none">
                      <Zap className="w-3 h-3 text-success-foreground" />
                      <span className="text-[11px] font-semibold text-success-foreground">Humanize</span>
                    </div>
                    <div className="flex-1 h-7 rounded-md border border-border flex items-center justify-center cursor-default select-none">
                      <span className="text-[11px] text-muted-foreground">Plagiarism</span>
                    </div>
                    <div className="pt-1 border-t border-border/50">
                      <div className="text-[10px] text-muted-foreground mb-1">Status</div>
                      <Badge className="text-[10px] w-full justify-center bg-destructive/10 text-destructive border-destructive/20">AI Flagged</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Publishing Workflow ───────────────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-success/10 text-success border-success/20">Publishing Workflow</Badge>
            <h2 className="text-3xl font-bold mb-3 text-balance">A Better Publishing Pipeline</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              From draft to publish without leaving WordPress — AI quality checks built into every step.
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-2">
            {WORKFLOW_STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-2 bg-card border border-border rounded-2xl px-6 py-5 shadow-sm min-w-[120px] text-center">
                  <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center ${s.color}`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{s.label}</span>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0 hidden md:block" />
                )}
                {i < WORKFLOW_STEPS.length - 1 && (
                  <ArrowDown className="w-5 h-5 text-muted-foreground shrink-0 md:hidden" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WordPress Features ───────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-success/10 text-success border-success/20">Plugin Features</Badge>
            <h2 className="text-3xl font-bold mb-3 text-balance">Twelve Features Built for WordPress Publishers</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              Every capability you need for responsible AI content publishing, natively inside WordPress.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <Card key={f.title} className="border-border/50 hover:border-success/30 hover:shadow-md transition-all duration-200 h-full">
                <CardHeader className="pb-3">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center mb-3">
                    <f.icon className="w-5 h-5 text-success" />
                  </div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">{f.desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Publishing Teams ─────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-success/10 text-success border-success/20">Who Uses It</Badge>
            <h2 className="text-3xl font-bold mb-3 text-balance">Built for Every Publishing Team</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              From solo bloggers to enterprise newsrooms — the plugin adapts to your editorial workflow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PUBLISHING_TEAMS.map((t) => (
              <div key={t.title} className="bg-card border border-border/50 rounded-2xl p-5 hover:border-success/30 hover:shadow-sm transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center mb-4">
                  <t.icon className="w-5 h-5 text-success" />
                </div>
                <h3 className="font-semibold mb-2">{t.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Plugin Dashboard Mockup ───────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">Dashboard</Badge>
            <h2 className="text-3xl font-bold mb-3 text-balance">Your AI Content Intelligence Hub</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              Everything you need to monitor content quality across your entire WordPress site.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Posts Scanned', value: '1,247', icon: FileText, change: '+48 this week', color: 'text-primary' },
              { label: 'AI Flagged', value: '183', icon: Bot, change: '14.7% of total', color: 'text-destructive' },
              { label: 'Humanized', value: '156', icon: Zap, change: '85% of flagged', color: 'text-success' },
              { label: 'Avg AI Score', value: '23%', icon: BarChart3, change: 'Down from 41%', color: 'text-primary' },
            ].map(stat => (
              <div key={stat.label} className="bg-card border border-border/50 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.change}</div>
              </div>
            ))}
          </div>
          {/* fake history table */}
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Recent Detection History</h3>
              <Badge variant="outline" className="text-xs">Live</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30">
                    {['Post Title', 'AI Score', 'Status', 'Action', 'Date'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { title: '10 Best SEO Tools in 2025', score: '91%', status: 'AI Flagged', action: 'Humanized', date: 'May 28' },
                    { title: 'How to Write Engaging Blog Posts', score: '12%', status: 'Human', action: 'Published', date: 'May 27' },
                    { title: 'WordPress Performance Guide', score: '78%', status: 'AI Flagged', action: 'Pending Review', date: 'May 26' },
                    { title: 'Content Marketing Strategy 2025', score: '34%', status: 'Mixed', action: 'Published', date: 'May 25' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-foreground whitespace-nowrap">{row.title}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`font-semibold ${parseFloat(row.score) > 70 ? 'text-destructive' : parseFloat(row.score) > 30 ? 'text-warning' : 'text-success'}`}>{row.score}</span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <Badge className={`text-xs ${row.status === 'AI Flagged' ? 'bg-destructive/10 text-destructive border-destructive/20' : row.status === 'Human' ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground'}`}>{row.status}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">{row.action}</td>
                      <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── Installation Guide ───────────────────────────────────────────── */}
      <section ref={installRef} className="py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-success/10 text-success border-success/20">Installation</Badge>
            <h2 className="text-3xl font-bold mb-3 text-balance">Install in Five Minutes</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              No server access needed. Install like any WordPress plugin.
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-[29px] top-10 bottom-10 w-0.5 bg-border hidden md:block" aria-hidden="true" />
            <div className="space-y-6">
              {INSTALL_STEPS.map((s, i) => (
                <div key={i} className="flex gap-5 items-start">
                  <div className="w-[60px] shrink-0 flex flex-col items-center">
                    <div className="w-[58px] h-[58px] rounded-2xl bg-success/10 border border-success/20 flex flex-col items-center justify-center relative z-10 bg-background">
                      <span className="text-xs font-bold text-success/60 leading-none">{s.step}</span>
                      <s.icon className="w-5 h-5 text-success mt-0.5" />
                    </div>
                  </div>
                  <div className="bg-card border border-border/50 rounded-2xl p-5 flex-1 hover:border-success/20 hover:shadow-sm transition-all">
                    <h3 className="font-semibold mb-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                    {i === 0 && (
                      <Button size="sm" className="mt-3 gap-2 bg-success hover:bg-success/90 text-success-foreground" onClick={handleDownload} disabled={downloading}>
                        {downloading ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Downloading…</> : <><Download className="w-3.5 h-3.5" />Download Plugin .zip</>}
                      </Button>
                    )}
                    {i === 2 && (
                      <Button size="sm" variant="outline" className="mt-3 gap-2" onClick={() => window.location.href = '/dashboard'}>
                        <Key className="w-3.5 h-3.5" />Get Your API Key
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Developer Section ────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
              <Terminal className="w-3.5 h-3.5 mr-1" />Developer
            </Badge>
            <h2 className="text-3xl font-bold mb-3 text-balance">Built for Developers Too</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              Hooks, filters, REST API, WP-CLI, shortcodes — full programmatic control.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {DEVELOPER_FEATURES.map((f) => (
              <div key={f.title} className="bg-card border border-border/50 rounded-2xl p-5 hover:border-primary/30 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Compatibility ────────────────────────────────────────────────── */}
      <section className="py-16 bg-muted/30 border-y border-border/50">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-success/10 text-success border-success/20">Compatibility</Badge>
            <h2 className="text-2xl font-bold mb-2 text-balance">Works With Your Existing Stack</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {COMPATIBILITY.map((c) => (
              <div key={c.name} className="flex flex-col items-center gap-2 bg-card border border-border/50 rounded-2xl px-6 py-4 min-w-[110px] text-center hover:border-success/30 hover:shadow-sm transition-all">
                <c.icon className="w-6 h-6 text-success" />
                <span className="font-semibold text-sm">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-success/10 text-success border-success/20">Testimonials</Badge>
            <h2 className="text-3xl font-bold mb-3 text-balance">Trusted by Publishers Worldwide</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-card border border-border/50 rounded-2xl p-6 flex flex-col gap-4 hover:border-success/20 hover:shadow-sm transition-all">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{t.quote}"</p>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security & Privacy ───────────────────────────────────────────── */}
      <section className="py-16 bg-muted/30 border-y border-border/50">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="shrink-0 w-16 h-16 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-success" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">Security & Privacy</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Content is transmitted to AIDetector.cx over TLS for analysis only. Results are stored locally in your WordPress database. We do not share your content with third parties. GDPR and CCPA compliant with a published DPA.
              </p>
              <div className="flex flex-wrap gap-3">
                {['TLS Encrypted', 'GDPR Compliant', 'CCPA Compliant', 'Local Data Storage', 'DPA Available', 'WordPress Coding Standards'].map(b => (
                  <Badge key={b} className="gap-1 bg-success/10 text-success border-success/20">
                    <CheckCircle2 className="w-3 h-3" />{b}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-success/10 text-success border-success/20">FAQ</Badge>
            <h2 className="text-3xl font-bold mb-3 text-balance">WordPress Plugin FAQ</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              Everything publishers and developers need to know.
            </p>
          </div>
          <Accordion type="multiple" className="space-y-3">
            {visibleFaqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border/50 rounded-xl px-5 [&[data-state=open]]:border-success/30">
                <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-4">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {!faqOpen && (
            <div className="mt-6 text-center">
              <Button variant="outline" className="gap-2" onClick={() => setFaqOpen(true)}>
                Show All {FAQS.length} FAQs <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ── Internal Links ───────────────────────────────────────────────── */}
      <section className="py-12 bg-muted/30 border-t border-border/50">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-5 text-center">Explore AIDetector.cx</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { to: '/detector', label: 'AI Detector' },
              { to: '/humanizer', label: 'AI Humanizer' },
              { to: '/plagiarism-checker', label: 'Plagiarism Checker' },
              { to: '/api', label: 'API Platform' },
              { to: '/pricing', label: 'Pricing' },
              { to: '/chrome-extension', label: 'Chrome Extension' },
              { to: '/blog', label: 'Blog & Guides' },
            ].map(l => (
              <Link key={l.to} to={l.to}>
                <Badge variant="outline" className="px-4 py-1.5 text-sm hover:bg-success/5 hover:border-success/30 cursor-pointer transition-colors gap-1">
                  {l.label} <ChevronRight className="w-3 h-3" />
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-success/8 via-background to-primary/5">
        <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
          <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <LayoutTemplate className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-balance">Smarter WordPress Publishing Starts Today</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-pretty">
            Join 25,000+ WordPress sites using AIDetector.cx to publish with confidence. Free to start, no credit card required.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" className="gap-2 font-semibold bg-success hover:bg-success/90 text-success-foreground" onClick={handleDownload} disabled={downloading}>
              {downloading ? <><RefreshCw className="w-4 h-4 animate-spin" />Downloading…</> : <><Download className="w-4 h-4" />Download Plugin Free</>}
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link to="/pricing">View Pro Plans <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Free to start · WP 6.0+ · PHP 7.4+ · Gutenberg & Classic Editor</p>
        </div>
      </section>

      {/* ── Sticky mobile CTA ────────────────────────────────────────────── */}
      <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
        <Button className="w-full gap-2 font-semibold shadow-lg bg-success hover:bg-success/90 text-success-foreground" onClick={handleDownload} disabled={downloading}>
          {downloading ? <><RefreshCw className="w-4 h-4 animate-spin" />Downloading…</> : <><Download className="w-4 h-4" />Download WordPress Plugin</>}
        </Button>
      </div>
    </MainLayout>
  );
}

