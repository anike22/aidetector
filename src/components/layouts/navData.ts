import {
  Bot, BarChart2, User, FileSearch, FileText, PenSquare, Globe, Link as LinkIcon, Code,
  Search, Zap, Target, Briefcase, ShoppingBag, BookOpen, Users, LayoutGrid, Puzzle, Sparkles,
  Crown, Home, Building2, FolderOpen, Bell, Activity, Shield, User as UserIcon, CreditCard,
  Gift, TrendingUp, Webhook, Terminal, FileCode, GraduationCap, ClipboardList,
} from 'lucide-react';

export interface NavGroup {
  id: string;
  title: string;
  icon: typeof Bot;
  items: { label: string; href: string; icon: typeof Bot; desc: string }[];
}

export const navStructure: NavGroup[] = [
  {
    id: 'products',
    title: 'Products',
    icon: LayoutGrid,
    items: [
      { label: 'AI Detector', href: '/detector', icon: BarChart2, desc: 'Enterprise-grade AI detection' },
      { label: 'AI Humanizer', href: '/humanizer', icon: User, desc: 'Bypass detection seamlessly' },
      { label: 'Plagiarism Checker', href: '/plagiarism-checker', icon: FileSearch, desc: 'Originality verification' },
      { label: 'Essay Studio', href: '/essay-studio', icon: GraduationCap, desc: 'Guided AI-safe academic writing' },
      { label: 'SEO Assistant', href: '/seo-assistant', icon: FileText, desc: 'Optimize content for search' },
      { label: 'Content Studio', href: '/content-studio', icon: PenSquare, desc: 'All-in-one creation suite' },
    ],
  },
  {
    id: 'extensions',
    title: 'Extensions',
    icon: Puzzle,
    items: [
      { label: 'Chrome Extension', href: '/chrome-extension', icon: Globe, desc: 'Detect AI anywhere' },
      { label: 'WordPress Plugin', href: '/wordpress-plugin', icon: LinkIcon, desc: 'Integrate into your CMS' },
    ],
  },
  {
    id: 'solutions',
    title: 'Solutions',
    icon: Sparkles,
    items: [
      { label: 'SEO Intelligence', href: '/seo-dashboard', icon: Search, desc: 'Data-driven rankings' },
      { label: 'Technical SEO', href: '/technical-seo', icon: Zap, desc: 'Site structure auditing' },
      { label: 'Keyword Research', href: '/keyword-research', icon: Target, desc: 'Find winning terms' },
      { label: 'Link Building', href: '/link-building', icon: LinkIcon, desc: 'Earn quality backlinks' },
    ],
  },
  {
    id: 'services',
    title: 'Services',
    icon: Briefcase,
    items: [
      { label: 'All Services', href: '/services', icon: Briefcase, desc: 'Overview of our agency services' },
      { label: 'SEO Consulting', href: '/services/seo-consulting', icon: Search, desc: 'Data-driven rankings strategy' },
      { label: 'AI Consulting', href: '/services/ai-consulting', icon: Bot, desc: 'Enterprise AI implementation' },
      { label: 'Website Development', href: '/services/website-development', icon: Code, desc: 'High-converting custom sites' },
      { label: 'Growth Marketing', href: '/services/growth-marketing', icon: BarChart2, desc: 'Scalable acquisition channels' },
    ],
  },
  {
    id: 'resources',
    title: 'Resources',
    icon: BookOpen,
    items: [
      { label: 'Guides', href: '/guides', icon: BookOpen, desc: 'Educational guides on AI detection' },
      { label: 'Research', href: '/research', icon: BarChart2, desc: 'Benchmarks and original studies' },
      { label: 'Comparisons', href: '/comparisons', icon: Search, desc: 'Side-by-side tool comparisons' },
      { label: 'Blog', href: '/blog', icon: PenSquare, desc: 'AI industry news and updates' },
      { label: 'AI Tools Directory', href: '/tools', icon: Zap, desc: 'Curated list of top AI tools' },
      { label: 'Community', href: '/community', icon: Users, desc: 'Join 85K+ creators' },
    ],
  },
  {
    id: 'developer',
    title: 'Developer',
    icon: Code,
    items: [
      { label: 'Developer Portal', href: '/developer', icon: Code, desc: 'Developer portal and getting started' },
      { label: 'API Platform', href: '/api', icon: Terminal, desc: 'Build with our detection models' },
      { label: 'API Documentation', href: '/api/docs', icon: FileCode, desc: 'Endpoints, SDKs, and examples' },
      { label: 'API Dashboard', href: '/api/dashboard', icon: BarChart2, desc: 'Usage, keys, and analytics' },
      { label: 'Webhooks', href: '/webhooks', icon: Webhook, desc: 'Event-driven integrations' },
    ],
  },
];

export const directLinks = [
  { label: 'Pricing', href: '/pricing', icon: Crown },
  { label: 'Integrations', href: '/integrations', icon: Puzzle },
  { label: 'Apps', href: '/apps', icon: LayoutGrid },
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
      { label: 'Dashboard', href: '/dashboard', icon: Home, desc: 'Personal dashboard' },
      { label: 'Essay Studio', href: '/essay-studio', icon: GraduationCap, desc: 'Academic writing workspace' },
      { label: 'Teacher Mode', href: '/essay-studio/teacher/assignments', icon: ClipboardList, desc: 'Manage student assignments' },
      { label: 'Organizations', href: '/organizations', icon: Building2, desc: 'Manage organizations' },
      { label: 'Shared Reports', href: '/reports/shared', icon: FolderOpen, desc: 'Collaborative reports' },
      { label: 'Notifications', href: '/notifications', icon: Bell, desc: 'Alerts and updates' },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    icon: UserIcon,
    items: [
      { label: 'Activity Feed', href: '/activity', icon: Activity, desc: 'Recent account activity' },
      { label: 'Security Center', href: '/security', icon: Shield, desc: 'Security settings' },
      { label: 'Profile Settings', href: '/settings/preferences', icon: UserIcon, desc: 'Communication preferences' },
    ],
  },
  {
    id: 'growth',
    title: 'Growth',
    icon: Gift,
    items: [
      { label: 'Rewards', href: '/rewards', icon: Gift, desc: 'Loyalty rewards' },
      { label: 'Referrals', href: '/referrals', icon: Users, desc: 'Invite and earn' },
      { label: 'Affiliate Program', href: '/affiliates/dashboard', icon: TrendingUp, desc: 'Affiliate dashboard' },
      { label: 'Partner Portal', href: '/partner', icon: Briefcase, desc: 'Partner resources' },
    ],
  },
];

function validateNavigation() {
  const allGroups = [...navStructure, ...mobileAuthGroups];
  const ids = new Set<string>();
  const routes = new Map<string, string>();
  const labels = new Map<string, string>();
  const developerLabelHolders: string[] = [];

  for (const group of allGroups) {
    if (ids.has(group.id)) {
      console.warn(`[navData] Duplicate group id: ${group.id}`);
    }
    ids.add(group.id);
    if (group.title === 'Developer') developerLabelHolders.push(`group:${group.id}`);
    for (const item of group.items) {
      if (routes.has(item.href)) {
        console.warn(`[navData] Duplicate route ${item.href} in ${group.id} and ${routes.get(item.href)}`);
      }
      routes.set(item.href, group.id);
      if (labels.has(item.label)) {
        console.warn(`[navData] Duplicate label "${item.label}" in ${group.id} and ${labels.get(item.label)}`);
      }
      labels.set(item.label, group.id);
      if (item.label === 'Developer') developerLabelHolders.push(`${group.id}:${item.href}`);
    }
  }
  for (const link of directLinks) {
    if (routes.has(link.href)) {
      console.warn(`[navData] Duplicate route ${link.href} in directLinks and ${routes.get(link.href)}`);
    }
    routes.set(link.href, 'directLinks');
    if (labels.has(link.label)) {
      console.warn(`[navData] Duplicate label "${link.label}" in directLinks and ${labels.get(link.label)}`);
    }
    labels.set(link.label, 'directLinks');
    if (link.label === 'Developer') developerLabelHolders.push(`directLinks:${link.href}`);
  }
  if (developerLabelHolders.length > 1) {
    console.warn(`[navData] Multiple items use the exact label "Developer": ${developerLabelHolders.join(', ')}`);
  }
}

if (import.meta.env?.DEV) {
  validateNavigation();
}
