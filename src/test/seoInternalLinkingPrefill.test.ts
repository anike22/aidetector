/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getStoredSEOProjectDomain,
  resolveSavedSEOProjectDomain,
  persistSEOProjectDomain,
} from '@/lib/seo/domainPrefill';
import { seoApi } from '@/lib/api/seo';

describe('SEO Assistant - Domain Prefill & Internal Linking Placeholder', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('getStoredSEOProjectDomain', () => {
    it('returns empty string when nothing is stored', () => {
      expect(getStoredSEOProjectDomain()).toBe('');
    });

    it('pre-fills from explicit seo_project_domain', () => {
      localStorage.setItem('seo_project_domain', 'mybrandblog.com');
      expect(getStoredSEOProjectDomain()).toBe('mybrandblog.com');
    });

    it('pre-fills from user_website_domain', () => {
      localStorage.setItem('user_website_domain', 'techinsights.org');
      expect(getStoredSEOProjectDomain()).toBe('techinsights.org');
    });

    it('pre-fills from active SEO project object in localStorage', () => {
      localStorage.setItem(
        'seo_active_project',
        JSON.stringify({
          project_id: 'proj_123',
          project_name: 'Main Site',
          domain: 'growthexpert.io',
          status: 'Active',
        })
      );
      expect(getStoredSEOProjectDomain()).toBe('growthexpert.io');
    });

    it('pre-fills from aidetector_blogger_session', () => {
      localStorage.setItem(
        'aidetector_blogger_session',
        JSON.stringify({
          step: 3,
          primaryKeyword: 'ai detection',
          domain: 'futuretools.co',
        })
      );
      expect(getStoredSEOProjectDomain()).toBe('futuretools.co');
    });

    it('pre-fills from saved draft', () => {
      localStorage.setItem(
        'aidetector_blogger_draft',
        JSON.stringify({
          content: 'Some sample blog content',
          internalLinkDomain: 'datasciencereview.com',
        })
      );
      expect(getStoredSEOProjectDomain()).toBe('datasciencereview.com');
    });
  });

  describe('resolveSavedSEOProjectDomain', () => {
    it('resolves immediately from local storage if available', async () => {
      localStorage.setItem('seo_project_domain', 'localfirst.dev');
      const spy = vi.spyOn(seoApi, 'getProjects');
      const domain = await resolveSavedSEOProjectDomain();
      expect(domain).toBe('localfirst.dev');
      expect(spy).not.toHaveBeenCalled();
    });

    it('resolves from Supabase seoApi.getProjects when local storage is empty', async () => {
      vi.spyOn(seoApi, 'getProjects').mockResolvedValueOnce([
        {
          project_id: 'p1',
          user_id: 'u1',
          project_name: 'Corporate Site',
          domain: 'enterprisetech.com',
          status: 'Active',
          competitors: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      const domain = await resolveSavedSEOProjectDomain();
      expect(domain).toBe('enterprisetech.com');
      // Should cache for next time
      expect(localStorage.getItem('seo_project_domain')).toBe('enterprisetech.com');
    });

    it('gracefully returns empty string if seoApi fails or returns no projects', async () => {
      vi.spyOn(seoApi, 'getProjects').mockRejectedValueOnce(new Error('Network error'));
      const domain = await resolveSavedSEOProjectDomain();
      expect(domain).toBe('');
    });
  });

  describe('persistSEOProjectDomain', () => {
    it('persists trimmed domain to localStorage', () => {
      persistSEOProjectDomain('   mycustomdomain.com  ');
      expect(localStorage.getItem('seo_project_domain')).toBe('mycustomdomain.com');
    });

    it('ignores empty or invalid input', () => {
      persistSEOProjectDomain('');
      expect(localStorage.getItem('seo_project_domain')).toBeNull();
    });
  });
});
