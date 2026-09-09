import { describe, it, expect, beforeEach } from 'vitest';
import { 
  normalizeFeatureSlug, 
  isFeatureVisible, 
  getFeatureFlagSync, 
  DEFAULT_FEATURE_FLAGS,
  invalidateFeatureFlagsCache,
  FeatureFlag
} from '@/lib/featureFlags';
import { getFilteredNavStructure } from '@/components/layouts/navData';

describe('Feature Visibility & Hidden Services Enforcement', () => {
  beforeEach(() => {
    invalidateFeatureFlagsCache();
  });

  describe('Route and Slug Normalization', () => {
    it('normalizes all withdrawn agency service routes and sub-routes', () => {
      expect(normalizeFeatureSlug('/services')).toBe('services');
      expect(normalizeFeatureSlug('/services/')).toBe('services');
      expect(normalizeFeatureSlug('/services/all')).toBe('services');
      expect(normalizeFeatureSlug('/services/website-development')).toBe('website-development');
      expect(normalizeFeatureSlug('/services/website-development/request')).toBe('website-development');
      expect(normalizeFeatureSlug('/services/website-development/book-meeting')).toBe('website-development');
      expect(normalizeFeatureSlug('/services/custom-website-development')).toBe('website-development');
      expect(normalizeFeatureSlug('/services/ecommerce-website-development')).toBe('website-development');
      expect(normalizeFeatureSlug('/services/business-website-design')).toBe('website-development');
      expect(normalizeFeatureSlug('/services/seo-website-design')).toBe('website-development');
      expect(normalizeFeatureSlug('/services/landing-page-design')).toBe('website-development');
      expect(normalizeFeatureSlug('/services/growth-marketing')).toBe('growth-marketing');
      expect(normalizeFeatureSlug('/services/seo-consulting')).toBe('seo-consulting');
      expect(normalizeFeatureSlug('/services/ai-consulting')).toBe('ai-consulting');
      expect(normalizeFeatureSlug('/services/conversion-optimization')).toBe('conversion-optimization');
      expect(normalizeFeatureSlug('/hire-expert')).toBe('hire-expert');
    });

    it('preserves active tool routes and core platforms', () => {
      expect(normalizeFeatureSlug('/detector')).toBe('detector');
      expect(normalizeFeatureSlug('/humanizer')).toBe('humanizer');
      expect(normalizeFeatureSlug('/seo-assistant')).toBe('seo-assistant');
      expect(normalizeFeatureSlug('/api')).toBe('api');
      expect(normalizeFeatureSlug('/affiliate-hub')).toBe('affiliate-hub');
      expect(normalizeFeatureSlug('/case-studies')).toBe('case-studies');
    });
  });

  describe('Hidden Service Visibility Rules (All 7 Services)', () => {
    const hiddenSlugs = [
      'services',
      'website-development',
      'growth-marketing',
      'seo-consulting',
      'ai-consulting',
      'conversion-optimization',
      'hire-expert',
    ];

    it('enforces that all 7 services are hidden across all surfaces by default', () => {
      for (const slug of hiddenSlugs) {
        expect(isFeatureVisible(slug, 'all')).toBe(false);
        expect(isFeatureVisible(slug, 'nav')).toBe(false);
        expect(isFeatureVisible(slug, 'footer')).toBe(false);
        expect(isFeatureVisible(slug, 'homepage')).toBe(false);
      }
    });

    it('enforces that specific service routes are hidden across surfaces', () => {
      expect(isFeatureVisible('/services', 'nav')).toBe(false);
      expect(isFeatureVisible('/services/ai-consulting', 'nav')).toBe(false);
      expect(isFeatureVisible('/services/conversion-optimization', 'nav')).toBe(false);
      expect(isFeatureVisible('/hire-expert', 'nav')).toBe(false);
      expect(isFeatureVisible('/services/website-development', 'footer')).toBe(false);
      expect(isFeatureVisible('/services/growth-marketing', 'homepage')).toBe(false);
      expect(isFeatureVisible('/services/seo-consulting', 'all')).toBe(false);
    });

    it('preserves active features as visible', () => {
      expect(isFeatureVisible('/detector', 'nav')).toBe(true);
      expect(isFeatureVisible('/humanizer', 'nav')).toBe(true);
      expect(isFeatureVisible('/seo-assistant', 'nav')).toBe(true);
      expect(isFeatureVisible('/api', 'nav')).toBe(true);
      expect(isFeatureVisible('/affiliate-hub', 'nav')).toBe(true);
      expect(isFeatureVisible('/case-studies', 'nav')).toBe(true);
    });
  });

  describe('Navigation Hierarchy Filtering (Desktop & Mobile)', () => {
    it('filters out hidden services and collapses empty solutions group', () => {
      const filtered = getFilteredNavStructure((href, surface) => isFeatureVisible(href, surface));

      // Solutions group should have 0 visible items and thus be pruned
      const solutionsGroup = filtered.find(g => g.id === 'solutions');
      expect(solutionsGroup).toBeUndefined();

      // Resources should be present and contain Case Studies and Affiliate Hub
      const resourcesGroup = filtered.find(g => g.id === 'resources');
      expect(resourcesGroup).toBeDefined();

      if (resourcesGroup) {
        const allHrefs: string[] = [];
        resourcesGroup.items.forEach(item => allHrefs.push(item.href));
        resourcesGroup.subcategories?.forEach(sub => {
          sub.items.forEach(item => allHrefs.push(item.href));
        });

        expect(allHrefs).toContain('/case-studies');
        expect(allHrefs).toContain('/affiliate-hub');
        expect(allHrefs).not.toContain('/services');
        expect(allHrefs).not.toContain('/services/ai-consulting');
        expect(allHrefs).not.toContain('/services/conversion-optimization');
        expect(allHrefs).not.toContain('/hire-expert');
      }
    });

    it('prunes viewAllLink when destination is hidden', () => {
      const filtered = getFilteredNavStructure((href, surface) => isFeatureVisible(href, surface));
      for (const group of filtered) {
        if (group.viewAllLink) {
          expect(isFeatureVisible(group.viewAllLink.href, 'nav')).toBe(true);
        }
      }
    });

    it('does not leave empty subcategories in navigation', () => {
      const filtered = getFilteredNavStructure((href, surface) => isFeatureVisible(href, surface));
      
      filtered.forEach(group => {
        if (group.subcategories) {
          group.subcategories.forEach(sub => {
            expect(sub.items.length).toBeGreaterThan(0);
          });
        }
      });
    });
  });

  describe('Unavailable State & Public Message', () => {
    it('provides the exact standard public message for all hidden services', () => {
      const expectedMessage = "This service is currently unavailable. Explore AIDetector.cx’s AI detection, writing, and content verification tools.";
      
      const hiddenSlugs = [
        'services',
        'website-development',
        'growth-marketing',
        'seo-consulting',
        'ai-consulting',
        'conversion-optimization',
        'hire-expert',
      ];

      for (const slug of hiddenSlugs) {
        const flag = getFeatureFlagSync(slug);
        expect(flag.public_message).toBe(expectedMessage);
        expect(flag.status).toBe('hidden');
        expect(flag.is_enabled).toBe(false);
      }
    });
  });

  describe('Feature Restoration Behavior', () => {
    it('restoring any service to active status immediately restores its visibility', () => {
      const activeAiConsulting: FeatureFlag = {
        ...DEFAULT_FEATURE_FLAGS['ai-consulting'],
        status: 'active',
        is_enabled: true,
        show_in_navigation: true,
        show_on_homepage: true,
        show_in_footer: true,
        allow_direct_access: true,
        is_indexable: true
      };

      const customFlagMap: Record<string, FeatureFlag> = {
        'ai-consulting': activeAiConsulting
      };

      const isVisibleInNav = isFeatureVisible('/services/ai-consulting', 'nav', customFlagMap);
      const isVisibleInFooter = isFeatureVisible('/services/ai-consulting', 'footer', customFlagMap);
      const isVisibleAll = isFeatureVisible('/services/ai-consulting', 'all', customFlagMap);

      expect(isVisibleInNav).toBe(true);
      expect(isVisibleInFooter).toBe(true);
      expect(isVisibleAll).toBe(true);
    });
  });
});
