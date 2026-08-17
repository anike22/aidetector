import type { PersonalizedRecommendation } from '@/types/personalization';

export interface RecommendationRoute {
  path: string;
  name: string;
  public?: boolean;
  requiresAuth?: boolean;
  requiresPro?: boolean;
  featureSlug?: string;
  ctaLabel: string;
}

export interface ResolvedRecommendation {
  id: string;
  title: string;
  description: string | null;
  targetRoute: string;
  queryParams: string;
  ctaLabel: string;
  isActionable: boolean;
  requiresAuth: boolean;
  requiresPro: boolean;
  source: string;
  type: string;
  subtype: string;
}

export const RECOMMENDATION_ROUTES: Record<string, RecommendationRoute> = {
  humanizer: {
    path: '/humanizer',
    name: 'AI Humanizer',
    public: true,
    featureSlug: 'ai_humanizer',
    ctaLabel: 'Try Humanizer',
  },
  grammar: {
    path: '/humanizer',
    name: 'Grammar & Style',
    public: true,
    featureSlug: 'ai_humanizer',
    ctaLabel: 'Improve Text',
  },
  plagiarism: {
    path: '/plagiarism-checker',
    name: 'Plagiarism Checker',
    public: true,
    featureSlug: 'plagiarism_checker',
    ctaLabel: 'Check Plagiarism',
  },
  pro_plan: {
    path: '/pricing',
    name: 'Upgrade to Pro',
    public: true,
    ctaLabel: 'Upgrade to Pro',
  },
  business_plan: {
    path: '/pricing',
    name: 'Business Plan',
    public: true,
    ctaLabel: 'Compare Plans',
  },
  enterprise_contact: {
    path: '/contact',
    name: 'Contact Sales',
    public: true,
    ctaLabel: 'Contact Sales',
  },
  api: {
    path: '/api/dashboard',
    name: 'API Dashboard',
    requiresAuth: true,
    featureSlug: 'api_access',
    ctaLabel: 'View API Keys',
  },
  sdk: {
    path: '/api/docs',
    name: 'API Docs',
    public: true,
    ctaLabel: 'Read Docs',
  },
  chrome_extension: {
    path: '/chrome-extension',
    name: 'Chrome Extension',
    public: true,
    ctaLabel: 'Install Extension',
  },
  wordpress_plugin: {
    path: '/wordpress-plugin',
    name: 'WordPress Plugin',
    public: true,
    ctaLabel: 'Install Plugin',
  },
  tutorial: {
    path: '/blog',
    name: 'Tutorials',
    public: true,
    ctaLabel: 'Read Guide',
  },
  saved_report: {
    path: '/dashboard',
    name: 'Saved Reports',
    requiresAuth: true,
    ctaLabel: 'View Reports',
  },
  next_action: {
    path: '/dashboard',
    name: 'Next Action',
    requiresAuth: true,
    ctaLabel: 'Take Action',
  },
};

const PRO_FEATURE_SLUGS = new Set([
  'plagiarism_checker',
  'ai_image_detector',
  'hallucination_detector',
  'citation_verifier',
  'api_access',
]);

export function resolveRecommendation(
  rec: PersonalizedRecommendation,
  source = 'strip'
): ResolvedRecommendation {
  // Trust an explicit context_path first, but only if it looks like a route.
  let route: RecommendationRoute | null = rec.context_path
    ? {
        path: rec.context_path,
        name: rec.title,
        public: true,
        ctaLabel: (rec.metadata?.ctaLabel as string) || 'Try it',
      }
    : null;

  if (!route) {
    route = RECOMMENDATION_ROUTES[rec.subtype] ?? RECOMMENDATION_ROUTES[rec.type] ?? null;
  }

  if (!route) {
    return {
      id: rec.id,
      title: rec.title,
      description: rec.description,
      targetRoute: '',
      queryParams: '',
      ctaLabel: (rec.metadata?.ctaLabel as string) || 'Learn more',
      isActionable: false,
      requiresAuth: false,
      requiresPro: false,
      source,
      type: rec.type,
      subtype: rec.subtype,
    };
  }

  const queryParams = buildQueryParams(rec);
  const requiresAuth = route.requiresAuth ?? !route.public;
  const requiresPro = route.requiresPro || (route.featureSlug ? PRO_FEATURE_SLUGS.has(route.featureSlug) : false);

  return {
    id: rec.id,
    title: rec.title,
    description: rec.description,
    targetRoute: route.path,
    queryParams,
    ctaLabel: (rec.metadata?.ctaLabel as string) || route.ctaLabel,
    isActionable: true,
    requiresAuth,
    requiresPro,
    source,
    type: rec.type,
    subtype: rec.subtype,
  };
}

function buildQueryParams(rec: PersonalizedRecommendation): string {
  const params = new URLSearchParams();
  params.set('rec', rec.id);
  params.set('src', 'recommendation');
  if (rec.subtype) params.set('type', rec.subtype);
  const custom = rec.metadata?.queryParams;
  if (custom && typeof custom === 'object') {
    Object.entries(custom as Record<string, string>).forEach(([k, v]) => params.set(k, v));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function routeExists(path: string): boolean {
  // Allow known public paths and dynamic routes. Unknown paths fall back to dashboard.
  if (path === '' || path === '/') return true;
  const knownRoots = [
    '/humanizer',
    '/detector',
    '/plagiarism-checker',
    '/tools',
    '/pricing',
    '/blog',
    '/dashboard',
    '/content-studio',
    '/seo-assistant',
    '/api',
    '/developer',
    '/chrome-extension',
    '/wordpress-plugin',
    '/contact',
    '/about',
    '/login',
    '/signup',
    '/account',
    '/settings',
    '/referrals',
    '/affiliate',
    '/security',
  ];
  return knownRoots.some((root) => path === root || path.startsWith(`${root}/`));
}
