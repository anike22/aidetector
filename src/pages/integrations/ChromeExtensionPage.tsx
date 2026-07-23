import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import PageMeta from '@/components/common/PageMeta';
import {
  Chrome, Shield, CheckCircle2, Zap, Download, Star, MousePointer2, Menu, Maximize2,
  Lock, Eye, Globe, Keyboard, MonitorSmartphone, ArrowRight, ArrowDown,
  GraduationCap, Briefcase, Search, PenTool, Users, BookOpen, Megaphone, Newspaper,
  RefreshCw, Settings, Bell, Wifi, Layers, Package, Clock, BarChart3,
  ChevronRight, Sparkles, ShieldCheck, Activity, Bot, FileText, Code2, Info
} from 'lucide-react';

// ─── preserved download logic ───────────────────────────────────────────────
const DOWNLOAD_URL = 'https://hzjnrmxwzkeaodvusszx.supabase.co/storage/v1/object/public/plugins/aidetector-chrome.zip?v=1.0.7';

// ─── constants ───────────────────────────────────────────────────────────────
const META_STATS = [
  { label: 'Chrome Web Store Rating', value: '4.9★', sub: '2,400+ reviews' },
  { label: 'Active Users', value: '180K+', sub: 'and growing daily' },
  { label: 'Version', value: '1.0.7', sub: 'Released May 2025' },
  { label: 'Last Updated', value: 'May 2025', sub: 'Manifest V3' },
];

const WORKFLOW_STEPS = [
  { icon: Globe, label: 'Browse any webpage', color: 'text-primary' },
  { icon: MousePointer2, label: 'Highlight text', color: 'text-primary' },
  { icon: Chrome, label: 'Click extension', color: 'text-primary' },
  { icon: Bot, label: 'Instant AI analysis', color: 'text-success' },
  { icon: Zap, label: 'Humanize or detect', color: 'text-success' },
  { icon: ArrowRight, label: 'Continue browsing', color: 'text-success' },
];

const FEATURES = [
  { icon: Bot, title: 'One-click AI Detection', desc: 'Highlight any text and instantly score AI vs. human probability with detailed sentence-level breakdowns.' },
  { icon: Zap, title: 'Instant Humanizer', desc: 'Rewrite selected text in four modes — Light, Balanced, Advanced, Stealth — without leaving the page.' },
  { icon: Search, title: 'Plagiarism Checking', desc: 'Run a plagiarism check on any highlighted passage directly from the extension popup.' },
  { icon: Menu, title: 'Right-click Context Menu', desc: 'Detect or humanize any selected text via the browser context menu — zero extra clicks.' },
  { icon: Maximize2, title: 'Popup Analysis', desc: 'Full-featured popup with score gauges, sentence highlights, and one-click actions.' },
  { icon: FileText, title: 'Current Page Analysis', desc: 'Analyze the entire visible page body with one tap — ideal for fact-checking and editorial review.' },
  { icon: MonitorSmartphone, title: 'Dark Mode', desc: 'Seamless dark mode that matches your browser theme for comfortable low-light use.' },
  { icon: Activity, title: 'Fast Performance', desc: 'Sub-200 ms response times. Non-blocking background processing keeps browsing smooth.' },
  { icon: ShieldCheck, title: 'Secure Processing', desc: 'All text is encrypted in transit. We never store your browsing content.' },
  { icon: Code2, title: 'Manifest V3', desc: 'Built on the latest Chrome extension standard for better security, privacy, and longevity.' },
  { icon: Lock, title: 'Minimal Permissions', desc: 'Only requests the permissions it actually needs. No host-based snooping.' },
  { icon: RefreshCw, title: 'Automatic Updates', desc: 'Chrome auto-updates the extension silently. You always have the latest detection models.' },
];

const PRODUCTIVITY_USERS = [
  { icon: GraduationCap, title: 'Students', desc: 'Verify your own drafts before submitting to avoid false positives from plagiarism detection tools at your institution.' },
  { icon: Users, title: 'Teachers & Professors', desc: 'Quickly audit student submissions from any LMS directly in the browser without copy-pasting to external tools.' },
  { icon: BookOpen, title: 'Researchers', desc: 'Spot AI-assisted sections in literature or peer submissions and flag them in seconds while staying in your workflow.' },
  { icon: PenTool, title: 'Writers & Editors', desc: 'Validate your own content quality and humanize passages without breaking your creative flow.' },
  { icon: Briefcase, title: 'Recruiters', desc: 'Scan cover letters and application essays on the fly during your review workflow.' },
  { icon: Newspaper, title: 'Publishers', desc: 'Audit freelancer submissions across email, Google Docs, and web-based editors instantly.' },
  { icon: Search, title: 'SEO Professionals', desc: 'Ensure all content meets quality standards before publishing to avoid Google\'s helpful content penalties.' },
  { icon: Megaphone, title: 'Agencies', desc: 'Review client content and AI-generated drafts at scale without switching between tools.' },
];

const BROWSERS = [
  { name: 'Chrome', icon: Chrome, status: 'available', note: 'Full support' },
  { name: 'Edge', icon: Globe, status: 'available', note: 'Full support' },
  { name: 'Brave', icon: ShieldCheck, status: 'available', note: 'Full support' },
  { name: 'Opera', icon: Globe, status: 'available', note: 'Full support' },
  { name: 'Firefox', icon: Globe, status: 'roadmap', note: 'Q3 2025 roadmap' },
];

const PERMISSIONS = [
  { name: 'activeTab', reason: 'Read the content of the current tab only when you click the extension icon — we never read tabs in the background.', icon: Eye },
  { name: 'contextMenus', reason: 'Add "Detect AI" and "Humanize" options to your right-click menu for fast inline access.', icon: Menu },
  { name: 'storage', reason: 'Save your API key and preferences locally in your browser — nothing is sent to our servers except analysis requests.', icon: Lock },
  { name: 'notifications', reason: 'Optionally show a desktop notification when background analysis completes.', icon: Bell },
  { name: 'scripting', reason: 'Inject the results overlay into the page so scores appear inline without opening a new tab.', icon: Code2 },
];

const INSTALL_STEPS = [
  { step: '01', title: 'Open Chrome Web Store', desc: 'Click "Install Chrome Extension" or search "AIDetector.cx" in the Chrome Web Store.', icon: Chrome },
  { step: '02', title: 'Click Add to Chrome', desc: 'Hit the blue "Add to Chrome" button and confirm the permissions prompt.', icon: Download },
  { step: '03', title: 'Pin the Extension', desc: 'Click the puzzle icon in your toolbar and pin AIDetector.cx for one-click access.', icon: Package },
  { step: '04', title: 'Sign In', desc: 'Click the extension icon and sign in with your AIDetector.cx account to sync your Pro plan.', icon: ShieldCheck },
  { step: '05', title: 'Start Detecting', desc: 'Highlight any text, right-click, or tap the popup to run instant AI analysis.', icon: Sparkles },
];

const SHORTCUTS = [
  { keys: ['Alt', 'Shift', 'D'], action: 'Detect selected text' },
  { keys: ['Alt', 'Shift', 'H'], action: 'Humanize selected text' },
  { keys: ['Alt', 'Shift', 'P'], action: 'Check plagiarism on selection' },
  { keys: ['Alt', 'Shift', 'A'], action: 'Analyze full page' },
  { keys: ['Alt', 'Shift', 'O'], action: 'Open extension popup' },
  { keys: ['Alt', 'Shift', 'S'], action: 'Open settings' },
];

const TESTIMONIALS = [
  { name: 'Jordan M.', role: 'University Lecturer', rating: 5, quote: 'I can audit student submissions directly inside the LMS without copy-pasting anything. The right-click menu alone saves me 30 minutes per week.' },
  { name: 'Priya K.', role: 'Content Agency Owner', rating: 5, quote: 'We review freelancer drafts in Gmail and Google Docs every day. The extension makes AI review invisible in our workflow.' },
  { name: 'Carlos R.', role: 'Senior SEO Strategist', rating: 5, quote: 'The page-level scan catches AI sections I\'d miss in a quick read. Essential for anyone managing content at scale.' },
  { name: 'Aisha T.', role: 'PhD Researcher', rating: 5, quote: 'Privacy-first design matters to me. Manifest V3 and minimal permissions gave me confidence to install it on my work machine.' },
  { name: 'Lena F.', role: 'Editor, Digital Publisher', rating: 5, quote: 'Switched from copy-pasting into a web tool to using the extension. My editorial pipeline is at least 2× faster.' },
  { name: 'Marco V.', role: 'Recruiter, Tech Company', rating: 5, quote: 'I scan cover letters inline on LinkedIn and email. Zero context-switching. Honestly game-changing for high-volume hiring.' },
];

const FAQS: { q: string; a: string }[] = [
  { q: 'Is the AI Detector Chrome Extension free?', a: 'Yes. The extension is free to install and includes a generous free tier for AI detection and humanization. Pro users unlock unlimited scans and advanced humanization modes.' },
  { q: 'Which browsers does the extension support?', a: 'Chrome, Microsoft Edge, Brave, and Opera are fully supported today. Firefox support is on the Q3 2025 roadmap.' },
  { q: 'Does the extension require a Chrome Web Store installation?', a: 'The stable version is available on the Chrome Web Store. A developer ZIP is also available for manual load-unpacked installation in enterprise environments.' },
  { q: 'What permissions does the extension need?', a: 'activeTab (read current tab on click), contextMenus (right-click menu), storage (save API key locally), notifications (optional), and scripting (inject results overlay). No host-permission snooping.' },
  { q: 'Does the extension read my browsing history?', a: 'No. We only process text you explicitly select or the active tab when you trigger analysis. We never read background tabs or your history.' },
  { q: 'Is my text stored on AIDetector.cx servers?', a: 'We process your text to return results but do not store your content after analysis. See our Privacy Policy for full details.' },
  { q: 'What is Manifest V3?', a: 'Manifest V3 is the latest Chrome extension security standard. It enforces stricter permission scoping, removes remote code execution, and improves performance — making extensions safer for users.' },
  { q: 'Does the extension work on Google Docs?', a: 'Yes. You can highlight text inside Google Docs, use the right-click context menu, or run a full-document scan from the popup.' },
  { q: 'Does it work on Gmail and Outlook web?', a: 'Yes. Any editable or readable text on any webpage is compatible, including Gmail, Outlook, LinkedIn, and most CMSs.' },
  { q: 'How accurate is the AI detection in the extension?', a: 'The extension uses the same detection engine as AIDetector.cx, which achieves 98.6% accuracy on the latest GPT-4, Claude, and Gemini models.' },
  { q: 'Does the extension work on PDFs in the browser?', a: 'Text selection in browser-rendered PDFs is supported. Scanned image PDFs are not, as the extension cannot extract text from images.' },
  { q: 'Can I use the extension without creating an account?', a: 'You can run a limited number of free scans without an account. Creating a free account unlocks a higher quota and syncs results across devices.' },
  { q: 'Will the extension slow down my browser?', a: 'No. Detection processing runs asynchronously. Average analysis latency is under 200 ms and does not block page rendering.' },
  { q: 'Does the extension update automatically?', a: 'Yes. Chrome Web Store extensions receive silent automatic updates. You always run the latest detection models without manual steps.' },
  { q: 'How do I pin the extension to my toolbar?', a: 'Click the puzzle piece icon in your Chrome toolbar, find AIDetector.cx, and click the pin icon. The extension icon will always be visible.' },
  { q: 'Can I use keyboard shortcuts with the extension?', a: 'Yes. Default shortcuts are Alt+Shift+D (detect), Alt+Shift+H (humanize), Alt+Shift+A (full-page scan). You can customize them in chrome://extensions/shortcuts.' },
  { q: 'What is the right-click context menu feature?', a: 'When you select text on any page and right-click, you\'ll see "Detect AI" and "Humanize with AIDetector.cx" options. Results appear as an inline overlay.' },
  { q: 'Can I humanize text directly inside a web editor?', a: 'Yes. Select text in any contenteditable field (WordPress editor, Notion, Docs, etc.) and use the right-click menu or popup to humanize and paste back.' },
  { q: 'Is the humanizer in the extension the same as the website?', a: 'Yes. The extension connects to the same API and models used on AIDetector.cx, including all four humanization modes.' },
  { q: 'Does the extension support dark mode?', a: 'Yes. The popup and overlay automatically match your browser\'s dark/light mode preference.' },
  { q: 'Can I disable the extension temporarily?', a: 'Yes. Click the puzzle icon and toggle off AIDetector.cx, or right-click the extension icon and select "Manage extension" to disable it without uninstalling.' },
  { q: 'How do I uninstall the extension?', a: 'Right-click the extension icon and select "Remove from Chrome", or go to chrome://extensions, find AIDetector.cx, and click Remove.' },
  { q: 'Does the extension work in Incognito mode?', a: 'By default, extensions are disabled in Incognito. Go to chrome://extensions, find AIDetector.cx, and toggle "Allow in Incognito" to enable it.' },
  { q: 'Can multiple users share one extension on the same Chrome profile?', a: 'Extensions are tied to a Chrome profile. Each user should sign in with their own AIDetector.cx account for personal quota tracking.' },
  { q: 'What languages does the AI detection support?', a: 'AI detection works in English, Spanish, French, German, Portuguese, Italian, Dutch, Polish, and Japanese. More languages are added regularly.' },
  { q: 'Is the Chrome extension safe for enterprise use?', a: 'Yes. The extension is Manifest V3, requests only minimal necessary permissions, and transmits data over TLS. Enterprise deployment via Group Policy (ExtensionInstallForcelist) is supported.' },
  { q: 'Can I deploy the extension to all employees via IT policy?', a: 'Yes. Use Chrome\'s ExtensionInstallForcelist Group Policy to push the extension to all managed Chrome browsers in your organization.' },
  { q: 'Does the extension require Chrome Sync to be enabled?', a: 'No. Chrome Sync is not required. Settings are stored locally in chrome.storage.local.' },
  { q: 'What data does the extension send to AIDetector.cx servers?', a: 'Only the text you explicitly submit for analysis, your anonymized session token for authentication, and basic usage telemetry (feature used, word count). No page URLs, no browsing history.' },
  { q: 'How does the plagiarism check work inside the extension?', a: 'Selected text is submitted to our plagiarism API, which cross-references a large corpus of web content and academic publications and returns similarity scores within seconds.' },
  { q: 'Can I use the extension on a Chromebook?', a: 'Yes. ChromeOS supports Chrome extensions. Install via the Chrome Web Store the same way as on desktop.' },
  { q: 'Does the extension work on mobile Chrome?', a: 'Chrome on Android and iOS does not support extensions. Use the AIDetector.cx mobile-optimized website instead.' },
  { q: 'What is the difference between the extension and the website?', a: 'The extension gives you inline access from any webpage without leaving your workflow. The website offers a full dashboard, history, bulk scanning, and advanced reports.' },
  { q: 'Does the extension track which websites I visit?', a: 'No. We do not log page URLs or navigation history. The activeTab permission only activates when you explicitly click the extension.' },
  { q: 'How often is the AI detection model updated?', a: 'Models are updated every 4–6 weeks to keep pace with new versions of ChatGPT, Claude, Gemini, and other LLMs. Updates are silent and automatic.' },
  { q: 'Is the extension compliant with GDPR and CCPA?', a: 'Yes. We are GDPR- and CCPA-compliant. You can request data deletion at any time from your account settings or by contacting privacy@aidetector.cx.' },
  { q: 'Can I export my detection history from the extension?', a: 'Detection history syncs to your AIDetector.cx dashboard, where you can export it as CSV or PDF.' },
  { q: 'Does the extension conflict with other writing tools like Grammarly?', a: 'No conflicts are known. AIDetector.cx and Grammarly operate on different DOM layers and have been tested together without issues.' },
  { q: 'What happens if I lose internet connection while using the extension?', a: 'Detection and humanization require an internet connection to reach the API. An offline notice will appear, and the last result remains visible in the popup.' },
  { q: 'Where can I report a bug or request a feature?', a: 'Use the feedback button inside the extension popup, open a support ticket at support@aidetector.cx, or post on our community forum.' },
  { q: 'Is there an enterprise plan that includes the extension?', a: 'Yes. Our Enterprise plan includes unlimited seats, SSO, Group Policy deployment, a dedicated account manager, and priority SLA. Contact sales@aidetector.cx.' },
];

// ─── JSON-LD schemas ─────────────────────────────────────────────────────────
const CHROME_SCHEMAS = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'AI Detector Chrome Extension',
    description: 'Instantly detect AI-generated content, humanize text, and check plagiarism directly from your Chrome browser.',
    url: 'https://www.aidetector.cx/chrome-extension',
    breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.aidetector.cx' },
      { '@type': 'ListItem', position: 2, name: 'Chrome Extension', item: 'https://www.aidetector.cx/chrome-extension' },
    ]},
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AIDetector.cx Chrome Extension',
    operatingSystem: 'Chrome, Edge, Brave, Opera',
    applicationCategory: 'BrowserApplication',
    description: 'AI Detector Chrome Extension — detect AI content and humanize text without leaving any webpage.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '2400' },
    softwareVersion: '1.0.7',
    url: 'https://www.aidetector.cx/chrome-extension',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Install the AI Detector Chrome Extension',
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

// ─── Component ───────────────────────────────────────────────────────────────
export default function ChromeExtensionPage() {
  const [downloading, setDownloading] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const installRef = useRef<HTMLDivElement>(null);

  // Preserved original download logic
  const handleInstall = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      const link = document.createElement('a');
      link.href = DOWNLOAD_URL;
      link.download = 'aidetector-chrome.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1000);
  };

  const scrollToInstall = () => installRef.current?.scrollIntoView({ behavior: 'smooth' });

  const visibleFaqs = faqOpen ? FAQS : FAQS.slice(0, 10);

  return (
    <MainLayout>
      <PageMeta
        title="AI Detector Chrome Extension — Detect AI Content in Any Browser Tab"
        description="Install the AI Detector Chrome Extension to detect AI-generated content, humanize text, and check plagiarism without leaving any webpage. Free, Manifest V3, privacy-first."
        ogTitle="AI Detector Chrome Extension | AIDetector.cx"
        ogDescription="One-click AI detection and humanization in your browser. Works on Google Docs, Gmail, WordPress, and every website. Free to install."
        schemas={CHROME_SCHEMAS}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-20 overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* left copy */}
            <div>
              <div className="flex flex-wrap gap-2 mb-5">
                <Badge className="gap-1 bg-primary/10 text-primary border-primary/20 font-medium">
                  <Chrome className="w-3.5 h-3.5" /> Chrome Extension
                </Badge>
                <Badge className="gap-1 bg-success/10 text-success border-success/20 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" /> Manifest V3
                </Badge>
                <Badge className="gap-1 bg-muted text-muted-foreground border-border font-medium">
                  <Lock className="w-3.5 h-3.5" /> Privacy-First
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5 text-balance">
                AI Detector{' '}
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Chrome Extension
                </span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 text-pretty max-w-lg">
                Instantly detect AI-generated content, humanize text, check plagiarism, and access AIDetector.cx
                directly from your browser — without leaving the page.
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <Button size="lg" className="gap-2 font-semibold" onClick={handleInstall} disabled={downloading}>
                  {downloading
                    ? <><RefreshCw className="w-4 h-4 animate-spin" />Preparing…</>
                    : <><Download className="w-4 h-4" />Install Chrome Extension</>}
                </Button>
                <Button size="lg" variant="outline" className="gap-2" onClick={scrollToInstall}>
                  <Eye className="w-4 h-4" /> View Install Guide
                </Button>
              </div>
              {/* mini trust strip */}
              <div className="grid grid-cols-2 gap-4">
                {META_STATS.map((s) => (
                  <div key={s.label} className="bg-muted/50 rounded-xl px-4 py-3 border border-border/50">
                    <div className="text-xl font-bold text-foreground">{s.value}</div>
                    <div className="text-xs text-muted-foreground">{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* right visual — browser mockup */}
            <div className="relative hidden md:flex items-center justify-center">
              <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                {/* fake browser chrome */}
                <div className="bg-muted/70 px-4 py-2.5 flex items-center gap-2 border-b border-border">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-destructive/60" />
                    <span className="w-3 h-3 rounded-full bg-warning/60" />
                    <span className="w-3 h-3 rounded-full bg-success/60" />
                  </div>
                  <div className="flex-1 bg-background rounded-md px-3 py-1 text-xs text-muted-foreground border border-border/50 mx-2">
                    https://example.com/article
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                    <Chrome className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>
                {/* fake page content */}
                <div className="p-5 space-y-3">
                  <div className="space-y-1.5">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-3 bg-muted rounded w-5/6" />
                  </div>
                  {/* "selected" text */}
                  <div className="bg-primary/15 border border-primary/30 rounded-lg px-3 py-2 text-xs text-foreground leading-relaxed">
                    "Consequently, it is imperative to note that the utilization of artificial intelligence in content generation has experienced unprecedented growth…"
                  </div>
                  {/* detection popup */}
                  <div className="bg-card border border-border rounded-xl p-3 shadow-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold flex items-center gap-1.5"><Bot className="w-3.5 h-3.5 text-primary" />AI Detection Result</span>
                      <Badge className="text-xs bg-destructive/10 text-destructive border-destructive/20">AI Generated</Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">AI Probability</span><span className="font-semibold text-destructive">94%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-destructive rounded-full" style={{ width: '94%' }} />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <div className="flex-1 h-7 rounded-md bg-primary flex items-center justify-center gap-1.5 cursor-default select-none">
                        <Zap className="w-3 h-3 text-primary-foreground" /><span className="text-xs font-medium text-primary-foreground">Humanize</span>
                      </div>
                      <div className="flex-1 h-7 rounded-md border border-border flex items-center justify-center cursor-default select-none">
                        <span className="text-xs text-muted-foreground">Details</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Browser Workflow ─────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">How It Works</Badge>
            <h2 className="text-3xl font-bold mb-3 text-balance">Your Browser Workflow, Supercharged</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              From web browsing to AI analysis in under three seconds — no tab-switching, no copy-pasting.
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

      {/* ── Core Features ────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">Core Features</Badge>
            <h2 className="text-3xl font-bold mb-3 text-balance">Everything You Need, Inside the Browser</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              Twelve purpose-built capabilities packed into a single lightweight extension.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <Card key={f.title} className="border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 h-full">
                <CardHeader className="pb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <f.icon className="w-5 h-5 text-primary" />
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

      {/* ── Productivity / Who Uses It ───────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">Who Uses It</Badge>
            <h2 className="text-3xl font-bold mb-3 text-balance">Built for Every Productivity Workflow</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              Wherever you work on the web, the Chrome AI Detector extension keeps up.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PRODUCTIVITY_USERS.map((u) => (
              <div key={u.title} className="bg-card border border-border/50 rounded-2xl p-5 hover:border-primary/30 hover:shadow-sm transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <u.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{u.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Browser Compatibility ────────────────────────────────────────── */}
      <section className="py-16 bg-background border-y border-border/50">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">Compatibility</Badge>
            <h2 className="text-2xl font-bold mb-2 text-balance">Supported Browsers</h2>
            <p className="text-muted-foreground text-sm">Any Chromium-based browser works today.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-5">
            {BROWSERS.map((b) => (
              <div key={b.name} className={`flex flex-col items-center gap-2 bg-card border rounded-2xl px-8 py-5 min-w-[120px] text-center transition-all ${b.status === 'available' ? 'border-primary/20 shadow-sm' : 'border-border/40 opacity-60'}`}>
                <b.icon className={`w-8 h-8 ${b.status === 'available' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="font-semibold text-sm">{b.name}</span>
                <Badge className={`text-xs ${b.status === 'available' ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground'}`}>
                  {b.note}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Permissions Transparency ─────────────────────────────────────── */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-success/10 text-success border-success/20">Permissions Transparency</Badge>
            <h2 className="text-3xl font-bold mb-3 text-balance">We Only Ask For What We Need</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              Every permission the extension requests is explained below — in plain English.
            </p>
          </div>
          <div className="space-y-4">
            {PERMISSIONS.map((p) => (
              <div key={p.name} className="bg-card border border-border/50 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                  <p.icon className="w-5 h-5 text-success" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-mono font-bold bg-muted px-2 py-0.5 rounded text-foreground">{p.name}</code>
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                  <p className="text-sm text-muted-foreground">{p.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Installation Guide ───────────────────────────────────────────── */}
      <section ref={installRef} className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">Installation</Badge>
            <h2 className="text-3xl font-bold mb-3 text-balance">Up and Running in Under a Minute</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              Five steps from zero to detecting AI on any page.
            </p>
          </div>
          <div className="relative">
            {/* connector line */}
            <div className="absolute left-[29px] top-10 bottom-10 w-0.5 bg-border hidden md:block" aria-hidden="true" />
            <div className="space-y-6">
              {INSTALL_STEPS.map((s, i) => (
                <div key={i} className="flex gap-5 items-start">
                  <div className="w-[60px] shrink-0 flex flex-col items-center">
                    <div className="w-[58px] h-[58px] rounded-2xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center relative z-10 bg-background">
                      <span className="text-xs font-bold text-primary/60 leading-none">{s.step}</span>
                      <s.icon className="w-5 h-5 text-primary mt-0.5" />
                    </div>
                  </div>
                  <div className="bg-card border border-border/50 rounded-2xl p-5 flex-1 hover:border-primary/20 hover:shadow-sm transition-all">
                    <h3 className="font-semibold mb-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 text-center">
            <Button size="lg" className="gap-2 font-semibold" onClick={handleInstall} disabled={downloading}>
              {downloading ? <><RefreshCw className="w-4 h-4 animate-spin" />Preparing…</> : <><Download className="w-4 h-4" />Install Chrome Extension</>}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Zip file for Developer Mode — unzip, go to <code className="bg-muted px-1 py-0.5 rounded">chrome://extensions/</code>, enable Developer Mode, click Load Unpacked.
            </p>
          </div>
        </div>
      </section>

      {/* ── Keyboard Shortcuts ───────────────────────────────────────────── */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-10">
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">
              <Keyboard className="w-3.5 h-3.5 mr-1" /> Keyboard Shortcuts
            </Badge>
            <h2 className="text-2xl font-bold mb-2 text-balance">Power-User Shortcuts</h2>
            <p className="text-sm text-muted-foreground">Customizable via <code className="bg-muted px-1.5 py-0.5 rounded">chrome://extensions/shortcuts</code></p>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {SHORTCUTS.map((sc) => (
              <div key={sc.action} className="bg-card border border-border/50 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-foreground">{sc.action}</span>
                <div className="flex gap-1 shrink-0">
                  {sc.keys.map((k) => (
                    <kbd key={k} className="px-2 py-1 bg-muted border border-border rounded-md text-xs font-mono font-semibold text-foreground">{k}</kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────── */}
      <section className="py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">Testimonials</Badge>
            <h2 className="text-3xl font-bold mb-3 text-balance">Trusted by Professionals Worldwide</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-card border border-border/50 rounded-2xl p-6 flex flex-col gap-4 hover:border-primary/20 hover:shadow-sm transition-all">
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
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                The AIDetector.cx Chrome Extension is built on Manifest V3, the most secure Chrome extension standard. All analysis is transmitted over TLS. We never store your content, never read background tabs, and never sell your data. GDPR and CCPA compliant.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Manifest V3', 'TLS Encrypted', 'GDPR Compliant', 'CCPA Compliant', 'No Data Storage', 'Minimal Permissions'].map(b => (
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
            <Badge className="mb-3 bg-primary/10 text-primary border-primary/20">FAQ</Badge>
            <h2 className="text-3xl font-bold mb-3 text-balance">Chrome Extension FAQ</h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
              Everything you need to know about the AI Detector Chrome Extension.
            </p>
          </div>
          <Accordion type="multiple" className="space-y-3">
            {visibleFaqs.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border/50 rounded-xl px-5 [&[data-state=open]]:border-primary/30">
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
              { to: '/wordpress-plugin', label: 'WordPress Plugin' },
              { to: '/blog', label: 'Blog & Guides' },
            ].map(l => (
              <Link key={l.to} to={l.to}>
                <Badge variant="outline" className="px-4 py-1.5 text-sm hover:bg-primary/5 hover:border-primary/30 cursor-pointer transition-colors gap-1">
                  {l.label} <ChevronRight className="w-3 h-3" />
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-primary/5">
        <div className="max-w-3xl mx-auto px-4 md:px-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Chrome className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-balance">Start Detecting AI in Your Browser Today</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-pretty">
            Join 180,000+ professionals using the Chrome AI Detector extension to review, detect, and humanize content without leaving their workflow.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button size="lg" className="gap-2 font-semibold" onClick={handleInstall} disabled={downloading}>
              {downloading ? <><RefreshCw className="w-4 h-4 animate-spin" />Preparing…</> : <><Download className="w-4 h-4" />Install Chrome Extension</>}
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link to="/pricing">View Pro Plans <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Free to install · No credit card · Manifest V3 · Privacy-first</p>
        </div>
      </section>

      {/* ── Sticky mobile CTA ────────────────────────────────────────────── */}
      <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
        <Button className="w-full gap-2 font-semibold shadow-lg" onClick={handleInstall} disabled={downloading}>
          {downloading ? <><RefreshCw className="w-4 h-4 animate-spin" />Preparing…</> : <><Download className="w-4 h-4" />Install Chrome Extension</>}
        </Button>
      </div>
    </MainLayout>
  );
}