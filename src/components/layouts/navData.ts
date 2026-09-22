import {
  Bot, BarChart2, User, FileSearch, FileText, PenSquare, Globe, Link as LinkIcon, Code,
  Search, Zap, Target, Briefcase, ShoppingBag, BookOpen, Users, LayoutGrid, Puzzle, Sparkles,
  Crown, Home, Building2, FolderOpen, Bell, Activity, Shield, User as UserIcon, CreditCard,
  Gift, TrendingUp, Webhook, Terminal, FileCode, GraduationCap, ClipboardList, Video,
  Image as ImageIcon, CheckCircle2, ShieldCheck, HelpCircle, Newspaper, ArrowRight,
  Layers, Lock, Mail
} from 'lucide-react';
import { isFeatureVisible } from '@/lib/featureFlags';

export interface NavItem {
  label: string;
  href: string;
  icon: typeof Bot;
  desc: string;
  badge?: string;
}

export interface NavSubCategory {
  title: string;
  items: NavItem[];
}

export interface NavGroup {
  id: string;
  title: string;
  icon: typeof Bot;
  viewAllLink?: { label: string; href: string };
  subcategories?: NavSubCategory[];
  items: NavItem[];
}

export const navStructure: NavGroup[] = [
  {
    id: 'tools',
    title: 'Tools',
    icon: LayoutGrid,
    viewAllLink: { label: 'View all tools', href: '/tools' },
    subcategories: [
      {
        title: 'Writing & Text Detection',
        items: [
          { label: 'AI Detector', href: '/detector', icon: BarChart2, desc: 'Enterprise text detection engine' },
          { label: 'AI Checker for Bloggers', href: '/ai-checker-for-bloggers', icon: Sparkles, desc: 'AI, SEO, readability & uniqueness check' },
          { label: 'Word Counter', href: '/word-counter', icon: FileText, desc: 'Count words & check for AI patterns' },
          { label: 'AI Summarizer', href: '/ai-summarizer', icon: Layers, desc: 'Summarize text, articles & documents' },
          { label: 'AI Humanizer', href: '/humanizer', icon: User, desc: 'Bypass detection seamlessly' },
          { label: 'Plagiarism Checker', href: '/plagiarism-checker', icon: FileSearch, desc: 'Multi-source originality check' },
          { label: 'Essay Studio', href: '/essay-studio', icon: GraduationCap, desc: 'Guided AI-safe academic writing' },
          { label: 'SEO Assistant', href: '/seo-assistant', icon: FileText, desc: 'Optimize content readability & SEO' },
          { label: 'Content Studio', href: '/content-studio', icon: PenSquare, desc: '12-step guided article creation' },
        ],
      },
      {
        title: 'Media Detection & Forensics',
        items: [
          { label: 'AI Image Detector', href: '/ai-image-detector', icon: ImageIcon, desc: 'Detect Midjourney, DALL-E & Flux' },
          { label: 'AI Video Detector', href: '/ai-video-detector', icon: Video, desc: 'Deepfakes, Sora & Kling detection' },
        ],
      },
      {
        title: 'Verification & Provenance',
        items: [
          { label: 'Verified Authorship', href: '/authorship', icon: ShieldCheck, desc: 'Cryptographic proof & certificates' },
          { label: 'Verification Portal', href: '/verified-authorship/verify', icon: CheckCircle2, desc: 'Public tracking code lookup' },
          { label: 'Register Claim', href: '/verified-authorship/register', icon: Shield, desc: 'Generate manuscript attestation' },
          { label: 'Author Profile & Attestation', href: '/verified-authorship/profile', icon: UserIcon, desc: 'Author identity & attestation credentials' },
        ],
      },
    ],
    items: [
      { label: 'AI Detector', href: '/detector', icon: BarChart2, desc: 'Enterprise text detection engine' },
      { label: 'AI Checker for Bloggers', href: '/ai-checker-for-bloggers', icon: Sparkles, desc: 'AI, SEO & publishing analysis' },
      { label: 'AI Humanizer', href: '/humanizer', icon: User, desc: 'Bypass detection seamlessly' },
      { label: 'Plagiarism Checker', href: '/plagiarism-checker', icon: FileSearch, desc: 'Multi-source originality check' },
      { label: 'AI Image Detector', href: '/ai-image-detector', icon: ImageIcon, desc: 'Detect Midjourney, DALL-E & Flux' },
      { label: 'AI Video Detector', href: '/ai-video-detector', icon: Video, desc: 'Deepfakes, Sora & Kling detection' },
      { label: 'Verified Authorship', href: '/authorship', icon: ShieldCheck, desc: 'Cryptographic proof & attestation' },
      { label: 'Essay Studio', href: '/essay-studio', icon: GraduationCap, desc: 'Guided AI-safe academic writing' },
      { label: 'SEO Assistant', href: '/seo-assistant', icon: FileText, desc: 'Optimize content for search' },
      { label: 'Content Studio', href: '/content-studio', icon: PenSquare, desc: 'All-in-one creation suite' },
      { label: 'Verification Portal', href: '/verified-authorship/verify', icon: CheckCircle2, desc: 'Public tracking code lookup' },
      { label: 'Register Claim', href: '/verified-authorship/register', icon: Shield, desc: 'Generate manuscript attestation' },
      { label: 'Author Profile & Attestation', href: '/verified-authorship/profile', icon: UserIcon, desc: 'Author identity & attestation credentials' },
    ],
  },
  {
    id: 'resources',
    title: 'Resources',
    icon: BookOpen,
    viewAllLink: { label: 'Browse all resources', href: '/guides' },
    subcategories: [
      {
        title: 'Knowledge & Editorial',
        items: [
          { label: 'Guides', href: '/guides', icon: BookOpen, desc: 'Educational guides on AI detection' },
          { label: 'Research', href: '/research', icon: BarChart2, desc: 'Empirical benchmarks and accuracy studies' },
          { label: 'Case Studies', href: '/case-studies', icon: Layers, desc: 'Real client results & detection benchmarks' },
          { label: 'Comparisons', href: '/comparisons', icon: Search, desc: 'Side-by-side detector evaluations' },
          { label: 'Blog & News', href: '/blog', icon: Newspaper, desc: 'AI industry developments & updates' },
        ],
      },
      {
        title: 'Video & Forensic Studies',
        items: [
          { label: 'TikTok AI Label Guide', href: '/studies/why-tiktok-flagged-my-real-video', icon: Video, desc: 'Troubleshoot false AI labels on TikTok' },
          { label: 'WhatsApp Compression', href: '/studies/whatsapp-compression-ai-video', icon: Video, desc: 'Codec effects on video detectors' },
          { label: 'Authentic Video Guide', href: '/studies/authentic-video-false-positives', icon: ShieldCheck, desc: 'Why real footage gets flagged' },
        ],
      },
      {
        title: 'Community & Partners',
        items: [
          { label: 'AI Tools Directory', href: '/tools', icon: Zap, desc: 'Curated directory of 100+ AI tools' },
          { label: 'Affiliate Hub', href: '/affiliate-hub', icon: TrendingUp, desc: 'Partner with AIDetector.cx' },
          { label: 'Community Forum', href: '/community', icon: Users, desc: 'Join 85,000+ creators & analysts' },
          { label: 'Newsletter', href: '/newsletter', icon: PenSquare, desc: 'Weekly AI detection briefing' },
        ],
      },
    ],
    items: [
      { label: 'Guides', href: '/guides', icon: BookOpen, desc: 'Educational guides on AI detection' },
      { label: 'Research', href: '/research', icon: BarChart2, desc: 'Benchmarks and original studies' },
      { label: 'Case Studies', href: '/case-studies', icon: Layers, desc: 'Real client results & detection benchmarks' },
      { label: 'Comparisons', href: '/comparisons', icon: Search, desc: 'Side-by-side tool comparisons' },
      { label: 'Blog & News', href: '/blog', icon: Newspaper, desc: 'AI industry news and product updates' },
      { label: 'TikTok AI Label Guide', href: '/studies/why-tiktok-flagged-my-real-video', icon: Video, desc: 'Troubleshoot false AI labels on TikTok' },
      { label: 'WhatsApp Compression', href: '/studies/whatsapp-compression-ai-video', icon: Video, desc: 'Codec effects on video detectors' },
      { label: 'Authentic Video Guide', href: '/studies/authentic-video-false-positives', icon: ShieldCheck, desc: 'Why real footage gets flagged' },
      { label: 'AI Tools Directory', href: '/tools', icon: Zap, desc: 'Curated list of top AI tools' },
      { label: 'Affiliate Hub', href: '/affiliate-hub', icon: TrendingUp, desc: 'Partner with AIDetector.cx' },
      { label: 'Community', href: '/community', icon: Users, desc: 'Join 85K+ creators and researchers' },
      { label: 'Newsletter', href: '/newsletter', icon: PenSquare, desc: 'Weekly detection & SEO briefing' },
    ],
  },
  {
    id: 'solutions',
    title: 'Solutions',
    icon: Briefcase,
    viewAllLink: { label: 'Explore all services', href: '/services' },
    subcategories: [
      {
        title: 'Agency Services',
        items: [
          { label: 'All Services', href: '/services', icon: Briefcase, desc: 'Overview of bespoke agency services' },
          { label: 'SEO Consulting', href: '/services/seo-consulting', icon: Search, desc: 'Data-driven enterprise search strategy' },
          { label: 'AI Consulting', href: '/services/ai-consulting', icon: Bot, desc: 'Enterprise AI implementation & pipelines' },
          { label: 'Conversion Optimization', href: '/services/conversion-optimization', icon: Target, desc: 'Turn visitors into paying customers' },
          { label: 'Growth Marketing', href: '/services/growth-marketing', icon: BarChart2, desc: 'Scalable acquisition & retention' },
          { label: 'Website Development', href: '/services/website-development', icon: Code, desc: 'High-converting custom sites' },
        ],
      },
      {
        title: 'Audience Solutions',
        items: [
          { label: 'Hire an Expert', href: '/hire-expert', icon: UserIcon, desc: 'Certified AI & forensic consultants' },
        ],
      },
    ],
    items: [
      { label: 'All Services', href: '/services', icon: Briefcase, desc: 'Overview of bespoke agency services' },
      { label: 'SEO Consulting', href: '/services/seo-consulting', icon: Search, desc: 'Data-driven rankings strategy' },
      { label: 'AI Consulting', href: '/services/ai-consulting', icon: Bot, desc: 'Enterprise AI implementation' },
      { label: 'Conversion Optimization', href: '/services/conversion-optimization', icon: Target, desc: 'Turn visitors into paying customers' },
      { label: 'Growth Marketing', href: '/services/growth-marketing', icon: BarChart2, desc: 'Scalable acquisition channels' },
      { label: 'Website Development', href: '/services/website-development', icon: Code, desc: 'High-converting custom sites' },
      { label: 'Hire an Expert', href: '/hire-expert', icon: UserIcon, desc: 'Connect with certified specialists' },
    ],
  },
  {
    id: 'integrations',
    title: 'Integrations & API',
    icon: Code,
    viewAllLink: { label: 'Explore integrations', href: '/integrations' },
    subcategories: [
      {
        title: 'Developer Platform',
        items: [
          { label: 'Developer Portal', href: '/developer', icon: Code, desc: 'Developer getting started & sandbox' },
          { label: 'API Platform', href: '/api', icon: Terminal, desc: 'High-speed REST API for enterprise' },
          { label: 'API Documentation', href: '/api/docs', icon: FileCode, desc: 'Endpoints, schemas & SDK examples' },
          { label: 'API Dashboard', href: '/api/dashboard', icon: BarChart2, desc: 'Usage, keys & rate limits' },
        ],
      },
      {
        title: 'Extensions & Ecosystem',
        items: [
          { label: 'WordPress Plugin', href: '/wordpress-plugin', icon: LinkIcon, desc: 'Scan drafts directly inside WordPress' },
          { label: 'Chrome Extension', href: '/chrome-extension', icon: Globe, desc: 'Detect AI anywhere across the web' },
          { label: 'Integrations Hub', href: '/integrations', icon: Puzzle, desc: 'Connect with Zapier, Slack & Make' },
          { label: 'Apps Marketplace', href: '/apps', icon: LayoutGrid, desc: 'Third-party extensions & recipes' },
        ],
      },
    ],
    items: [
      { label: 'Developer Portal', href: '/developer', icon: Code, desc: 'Developer portal and getting started' },
      { label: 'API Platform', href: '/api', icon: Terminal, desc: 'Build with our detection models' },
      { label: 'API Documentation', href: '/api/docs', icon: FileCode, desc: 'Endpoints, SDKs, and examples' },
      { label: 'API Dashboard', href: '/api/dashboard', icon: BarChart2, desc: 'Usage, keys, and analytics' },
      { label: 'WordPress Plugin', href: '/wordpress-plugin', icon: LinkIcon, desc: 'Integrate into your CMS' },
      { label: 'Chrome Extension', href: '/chrome-extension', icon: Globe, desc: 'Detect AI anywhere' },
      { label: 'Integrations Hub', href: '/integrations', icon: Puzzle, desc: 'Zapier, Slack, and webhooks' },
      { label: 'Apps Marketplace', href: '/apps', icon: LayoutGrid, desc: 'Discover custom extensions' },
    ],
  },
];

export const adminNavStructure: NavGroup = {
  id: 'admin',
  title: 'Admin',
  icon: Shield,
  viewAllLink: { label: 'Admin Dashboard', href: '/admin' },
  subcategories: [
    {
      title: 'Customer & Intelligence',
      items: [
        { label: 'Customer Intelligence', href: '/admin/customer-intelligence', icon: Users, desc: 'Behavioral analytics & 360 journey' },
        { label: 'Customer Lifecycle', href: '/admin/lifecycle', icon: Activity, desc: 'Funnel stages, retention & cohorts' },
        { label: 'Lead Capture & CRM', href: '/admin/lead-capture', icon: Target, desc: 'Lead capture forms & pipeline' },
        { label: 'AI Personalization', href: '/admin/personalization', icon: Sparkles, desc: 'Personalization & recommendation engine' },
      ],
    },
    {
      title: 'Models & Detection Quality',
      items: [
        { label: 'Detector Benchmarks', href: '/admin/detector-benchmark', icon: BarChart2, desc: 'Empirical model accuracy tests' },
        { label: 'Detector Configuration', href: '/admin/detector-config', icon: Bot, desc: 'Thresholds & weights management' },
        { label: 'Detector Feedback', href: '/admin/detector-feedback', icon: ShieldCheck, desc: 'User report queue & false positives' },
        { label: 'Humanizer Quality', href: '/admin/humanizer-quality', icon: PenSquare, desc: 'Humanizer score & perplexity benchmarks' },
      ],
    },
    {
      title: 'Automation & Growth',
      items: [
        { label: 'Automation Center', href: '/admin/automation', icon: Bot, desc: 'Workflows, triggers & actions' },
        { label: 'Automation Logs', href: '/admin/automation/logs', icon: FileText, desc: 'Execution audit & error logs' },
        { label: 'Automation Analytics', href: '/admin/automation/analytics', icon: TrendingUp, desc: 'Workflow performance & conversions' },
        { label: 'Referrals & Affiliates', href: '/admin/referrals', icon: LinkIcon, desc: 'Referral tracking & commissions' },
      ],
    },
    {
      title: 'Governance & Infrastructure',
      items: [
        { label: 'Enterprise Admin', href: '/admin/enterprise', icon: Building2, desc: 'Workspaces & organization seats' },
        { label: 'Security Center', href: '/admin/security', icon: Shield, desc: 'Threat logs & incident governance' },
        { label: 'Compliance & Privacy', href: '/admin/compliance', icon: CheckCircle2, desc: 'GDPR/CCPA privacy requests' },
        { label: 'API Health & Connections', href: '/admin/api-health', icon: Activity, desc: 'Live endpoint latency & health' },
        { label: 'Feature Controls', href: '/admin/feature-controls', icon: Shield, desc: 'Global feature flags & kill-switches' },
        { label: 'Email Management', href: '/admin/email', icon: Mail, desc: 'Email broadcasts & notification templates' },
      ],
    },
  ],
  items: [
    { label: 'Customer Intelligence', href: '/admin/customer-intelligence', icon: Users, desc: 'Behavioral analytics & 360 journey' },
    { label: 'Customer Lifecycle', href: '/admin/lifecycle', icon: Activity, desc: 'Funnel stages, retention & cohorts' },
    { label: 'Lead Capture & CRM', href: '/admin/lead-capture', icon: Target, desc: 'Lead capture forms & pipeline' },
    { label: 'Detector Benchmarks', href: '/admin/detector-benchmark', icon: BarChart2, desc: 'Empirical model accuracy tests' },
    { label: 'Detector Configuration', href: '/admin/detector-config', icon: Bot, desc: 'Thresholds & weights management' },
    { label: 'Automation Center', href: '/admin/automation', icon: Bot, desc: 'Workflows, triggers & actions' },
    { label: 'Enterprise Admin', href: '/admin/enterprise', icon: Building2, desc: 'Workspaces & organization seats' },
    { label: 'Security Center', href: '/admin/security', icon: Shield, desc: 'Threat logs & incident governance' },
    { label: 'API Health & Connections', href: '/admin/api-health', icon: Activity, desc: 'Live endpoint latency & health' },
    { label: 'Feature Controls', href: '/admin/feature-controls', icon: Shield, desc: 'Global feature flags & kill-switches' },
  ],
};

export const directLinks = [
  { label: 'Pricing', href: '/pricing', icon: Crown },
  { label: 'All Pages', href: '/all-pages', icon: Globe },
];

export function normalizeRoute(path: string): string {
  return path.replace(/\?.*$/, '').replace(/\/+$/, '') || '/';
}

export function matchRoute(itemHref: string, pathname: string): boolean {
  return normalizeRoute(itemHref) === normalizeRoute(pathname);
}

export function findParentGroupIdByPath(pathname: string): string | null {
  const allGroups = [...navStructure, ...mobileAuthGroups];
  let best: { id: string; length: number } | null = null;
  for (const group of allGroups) {
    for (const item of group.items) {
      const href = item.href;
      if (matchRoute(href, pathname)) return group.id;
      if (pathname.startsWith(`${href}/`)) {
        if (!best || href.length > best.length) {
          best = { id: group.id, length: href.length };
        }
      }
    }
  }
  return best?.id || null;
}

export const mobileAuthGroups: NavGroup[] = [
  {
    id: 'workspace',
    title: 'Workspace',
    icon: Home,
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: Home, desc: 'Personal scan dashboard' },
      { label: 'Verified Authorship', href: '/authorship/dashboard', icon: ShieldCheck, desc: 'Manuscripts & Certificates' },
      { label: 'Author Profile & Attestation', href: '/verified-authorship/profile', icon: UserIcon, desc: 'Author identity & attestation credentials' },
      { label: 'Essay Studio', href: '/essay-studio', icon: GraduationCap, desc: 'Academic writing workspace' },
      { label: 'Teacher Mode', href: '/essay-studio/teacher/assignments', icon: ClipboardList, desc: 'Manage student assignments' },
      { label: 'Organizations', href: '/organizations', icon: Building2, desc: 'Team seats & credit pools' },
      { label: 'Shared Reports', href: '/reports/shared', icon: FolderOpen, desc: 'Collaborative reports' },
      { label: 'Notifications', href: '/notifications', icon: Bell, desc: 'Alerts and updates' },
    ],
  },
  {
    id: 'account',
    title: 'Account & Security',
    icon: UserIcon,
    items: [
      { label: 'Activity Feed', href: '/activity', icon: Activity, desc: 'Recent account activity' },
      { label: 'Security Center', href: '/security', icon: Shield, desc: '2FA and sessions' },
      { label: 'Profile Settings', href: '/settings/preferences', icon: UserIcon, desc: 'Communication preferences' },
    ],
  },
  {
    id: 'growth',
    title: 'Growth & Rewards',
    icon: Gift,
    items: [
      { label: 'Rewards', href: '/rewards', icon: Gift, desc: 'Loyalty points and perks' },
      { label: 'Referrals', href: '/referrals', icon: Users, desc: 'Invite colleagues and earn' },
      { label: 'Affiliate Dashboard', href: '/affiliates/dashboard', icon: TrendingUp, desc: 'Track affiliate earnings' },
      { label: 'Partner Portal', href: '/partner', icon: Briefcase, desc: 'Agency partner resources' },
    ],
  },
];

export function getFilteredNavStructure(
  visibilityCheck?: (href: string, surface?: 'nav' | 'footer' | 'homepage' | 'all') => boolean
): NavGroup[] {
  const check = visibilityCheck || ((href) => isFeatureVisible(href, 'nav'));
  
  return navStructure
    .map(group => {
      // Filter direct items
      const filteredItems = group.items.filter(item => check(item.href, 'nav'));
      
      // Filter subcategories and items within
      let filteredSubcategories: NavSubCategory[] | undefined = undefined;
      if (group.subcategories) {
        filteredSubcategories = group.subcategories
          .map(sub => ({
            ...sub,
            items: sub.items.filter(item => check(item.href, 'nav')),
          }))
          .filter(sub => sub.items.length > 0);
      }
      
      // Filter viewAllLink if destination is hidden
      const viewAllLink = group.viewAllLink && check(group.viewAllLink.href, 'nav')
        ? group.viewAllLink
        : undefined;

      return {
        ...group,
        items: filteredItems,
        subcategories: filteredSubcategories,
        viewAllLink,
      };
    })
    .filter(group => {
      const hasItems = group.items.length > 0;
      const hasSubItems = group.subcategories && group.subcategories.length > 0;
      return hasItems || hasSubItems;
    });
}

