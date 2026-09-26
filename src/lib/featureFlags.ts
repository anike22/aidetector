import { supabase } from '@/db/supabase';

export interface FeatureFlag {
  id?: string;
  feature_name: string;
  feature_slug: string;
  status: 'active' | 'hidden' | 'coming_soon' | 'maintenance' | string;
  public_message?: string | null;
  requires_login?: boolean;
  is_enabled: boolean;
  show_in_navigation: boolean;
  show_on_homepage?: boolean;
  show_in_footer?: boolean;
  allow_direct_access?: boolean;
  is_indexable?: boolean;
  required_plan?: string;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_UNAVAILABLE_MESSAGE = "This service is currently unavailable. Explore AIDetector.cx’s AI detection, writing, and content verification tools.";

// Default baseline flags to ensure deterministic rendering before/without network
export const DEFAULT_FEATURE_FLAGS: Record<string, FeatureFlag> = {
  'services': {
    feature_name: 'All Services',
    feature_slug: 'services',
    status: 'hidden',
    is_enabled: false,
    show_in_navigation: false,
    show_on_homepage: false,
    show_in_footer: false,
    allow_direct_access: false,
    is_indexable: false,
    public_message: DEFAULT_UNAVAILABLE_MESSAGE,
    required_plan: 'free',
  },
  'all-services': {
    feature_name: 'All Services',
    feature_slug: 'services',
    status: 'hidden',
    is_enabled: false,
    show_in_navigation: false,
    show_on_homepage: false,
    show_in_footer: false,
    allow_direct_access: false,
    is_indexable: false,
    public_message: DEFAULT_UNAVAILABLE_MESSAGE,
    required_plan: 'free',
  },
  'ai-consulting': {
    feature_name: 'AI Consulting',
    feature_slug: 'ai-consulting',
    status: 'hidden',
    is_enabled: false,
    show_in_navigation: false,
    show_on_homepage: false,
    show_in_footer: false,
    allow_direct_access: false,
    is_indexable: false,
    public_message: DEFAULT_UNAVAILABLE_MESSAGE,
    required_plan: 'free',
  },
  'conversion-optimization': {
    feature_name: 'Conversion Optimization',
    feature_slug: 'conversion-optimization',
    status: 'hidden',
    is_enabled: false,
    show_in_navigation: false,
    show_on_homepage: false,
    show_in_footer: false,
    allow_direct_access: false,
    is_indexable: false,
    public_message: DEFAULT_UNAVAILABLE_MESSAGE,
    required_plan: 'free',
  },
  'hire-expert': {
    feature_name: 'Hire an Expert',
    feature_slug: 'hire-expert',
    status: 'hidden',
    is_enabled: false,
    show_in_navigation: false,
    show_on_homepage: false,
    show_in_footer: false,
    allow_direct_access: false,
    is_indexable: false,
    public_message: DEFAULT_UNAVAILABLE_MESSAGE,
    required_plan: 'free',
  },
  'website-development': {
    feature_name: 'Website Development',
    feature_slug: 'website-development',
    status: 'hidden',
    is_enabled: false,
    show_in_navigation: false,
    show_on_homepage: false,
    show_in_footer: false,
    allow_direct_access: false,
    is_indexable: false,
    public_message: DEFAULT_UNAVAILABLE_MESSAGE,
    required_plan: 'free',
  },
  'growth-marketing': {
    feature_name: 'Growth Marketing',
    feature_slug: 'growth-marketing',
    status: 'hidden',
    is_enabled: false,
    show_in_navigation: false,
    show_on_homepage: false,
    show_in_footer: false,
    allow_direct_access: false,
    is_indexable: false,
    public_message: DEFAULT_UNAVAILABLE_MESSAGE,
    required_plan: 'free',
  },
  'seo-consulting': {
    feature_name: 'SEO Consulting',
    feature_slug: 'seo-consulting',
    status: 'hidden',
    is_enabled: false,
    show_in_navigation: false,
    show_on_homepage: false,
    show_in_footer: false,
    allow_direct_access: false,
    is_indexable: false,
    public_message: DEFAULT_UNAVAILABLE_MESSAGE,
    required_plan: 'free',
  },
  'seo-assistant': {
    feature_name: 'SEO Assistant',
    feature_slug: 'seo-assistant',
    status: 'active',
    is_enabled: true,
    show_in_navigation: true,
    show_on_homepage: true,
    show_in_footer: true,
    allow_direct_access: true,
    is_indexable: true,
    required_plan: 'free',
  },
  'detector': {
    feature_name: 'AI Detector',
    feature_slug: 'detector',
    status: 'active',
    is_enabled: true,
    show_in_navigation: true,
    show_on_homepage: true,
    show_in_footer: true,
    allow_direct_access: true,
    is_indexable: true,
    required_plan: 'free',
  },
  'ai-summarizer': {
    feature_name: 'AI Summarizer',
    feature_slug: 'ai-summarizer',
    status: 'active',
    is_enabled: true,
    show_in_navigation: true,
    show_on_homepage: true,
    show_in_footer: true,
    allow_direct_access: true,
    is_indexable: true,
    required_plan: 'free',
  },
  'humanizer': {
    feature_name: 'AI Humanizer',
    feature_slug: 'humanizer',
    status: 'active',
    is_enabled: true,
    show_in_navigation: true,
    show_on_homepage: true,
    show_in_footer: true,
    allow_direct_access: true,
    is_indexable: true,
    required_plan: 'free',
  },
  'plagiarism-checker': {
    feature_name: 'Plagiarism Checker',
    feature_slug: 'plagiarism-checker',
    status: 'active',
    is_enabled: true,
    show_in_navigation: true,
    show_on_homepage: true,
    show_in_footer: true,
    allow_direct_access: true,
    is_indexable: false,
    required_plan: 'free',
  },
  'api-platform': {
    feature_name: 'Enterprise API',
    feature_slug: 'api-platform',
    status: 'active',
    is_enabled: true,
    show_in_navigation: true,
    show_on_homepage: true,
    show_in_footer: true,
    allow_direct_access: true,
    is_indexable: true,
    required_plan: 'free',
  },
};

// In-memory cache
export let flagsCache: Record<string, FeatureFlag> = { ...DEFAULT_FEATURE_FLAGS };
let isFetching = false;
let lastFetchTime = 0;
const CACHE_TTL_MS = 30000; // 30s cache TTL

export function getAllFeatureFlagsSync(): Record<string, FeatureFlag> {
  return { ...flagsCache };
}

// Normalize route or slug to canonical slug
export function normalizeFeatureSlug(input: string): string {
  if (!input) return '';
  let clean = input.trim();
  
  // Remove protocol and domain if full URL passed
  clean = clean.replace(/^https?:\/\/[^/]+/i, '');
  // Remove trailing query params or hash
  clean = clean.split('?')[0].split('#')[0];
  // Remove leading and trailing slashes
  clean = clean.replace(/^\/+|\/+$/g, '');
  
  if (clean === 'services' || clean === 'services/all') {
    return 'services';
  }

  // Specific path-to-slug mappings
  if (clean.startsWith('services/')) {
    clean = clean.replace('services/', '');
  }
  
  // Sub-routes for website development
  if (clean.startsWith('website-development') || 
      clean === 'business-website-design' || 
      clean === 'seo-website-design' || 
      clean === 'custom-website-development' || 
      clean === 'ecommerce-website-development' || 
      clean === 'landing-page-design') {
    return 'website-development';
  }
  
  if (clean === 'api' || clean === 'api/docs' || clean === 'api/dashboard') {
    return 'api';
  }
  
  return clean.toLowerCase();
}

/**
 * Get current feature flag synchronously from cache or baseline
 */
export function getFeatureFlagSync(slugOrRoute: string, customFlagMap?: Record<string, FeatureFlag>): FeatureFlag {
  const slug = normalizeFeatureSlug(slugOrRoute);
  if (customFlagMap && customFlagMap[slug]) return customFlagMap[slug];
  if (flagsCache[slug]) return flagsCache[slug];
  if (DEFAULT_FEATURE_FLAGS[slug]) return DEFAULT_FEATURE_FLAGS[slug];
  
  // Default to active for unrecognized non-hidden features
  return {
    feature_name: slug,
    feature_slug: slug,
    status: 'active',
    is_enabled: true,
    show_in_navigation: true,
    show_on_homepage: true,
    show_in_footer: true,
    allow_direct_access: true,
    is_indexable: true,
    required_plan: 'free',
  };
}

/**
 * Check if a feature is publicly visible on a given surface
 */
export function isFeatureVisible(
  slugOrRoute: string,
  surface: 'nav' | 'footer' | 'homepage' | 'all' = 'all',
  customFlagMap?: Record<string, FeatureFlag>
): boolean {
  const flag = getFeatureFlagSync(slugOrRoute, customFlagMap);
  
  // If status is hidden or not enabled, it is never visible
  if (flag.status === 'hidden' || !flag.is_enabled) {
    return false;
  }
  
  if (surface === 'nav' && flag.show_in_navigation === false) {
    return false;
  }
  if (surface === 'footer' && flag.show_in_footer === false) {
    return false;
  }
  if (surface === 'homepage' && flag.show_on_homepage === false) {
    return false;
  }
  
  return true;
}

/**
 * Fetch all feature flags and update cache
 */
export async function fetchFeatureFlags(force = false): Promise<Record<string, FeatureFlag>> {
  const now = Date.now();
  if (!force && now - lastFetchTime < CACHE_TTL_MS && Object.keys(flagsCache).length > Object.keys(DEFAULT_FEATURE_FLAGS).length) {
    return flagsCache;
  }
  
  if (isFetching && !force) {
    return flagsCache;
  }
  
  isFetching = true;
  try {
    const { data, error } = await supabase.from('feature_flags').select('*');
    if (!error && data) {
      const newMap: Record<string, FeatureFlag> = { ...DEFAULT_FEATURE_FLAGS };
      data.forEach((item: FeatureFlag) => {
        newMap[item.feature_slug] = item;
      });
      flagsCache = newMap;
      lastFetchTime = Date.now();
      
      // Notify subscribers and window listeners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('feature_flags_updated', { detail: newMap }));
      }
    }
  } catch (err) {
    console.warn('Could not refresh feature flags from Supabase:', err);
  } finally {
    isFetching = false;
  }
  
  return flagsCache;
}

/**
 * Invalidate cache and trigger refetch
 */
export function invalidateFeatureFlagsCache() {
  lastFetchTime = 0;
  return fetchFeatureFlags(true);
}
