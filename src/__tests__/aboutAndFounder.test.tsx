// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getFounderProfile, 
  saveFounderProfile, 
  DEFAULT_FOUNDER_PROFILE, 
  validateImageUrl, 
  validateSocialUrl,
  FounderProfile 
} from '@/lib/founderSettings';

describe('Founder & Company Settings Store (AIDetector.cx About Upgrade)', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it('1. returns default founder profile for Anike Tobechukwu when storage is empty', () => {
    const profile = getFounderProfile();
    expect(profile.name).toBe('Anike Tobechukwu');
    expect(profile.title).toBe('Founder, AIDetector.cx');
    expect(profile.bio).toContain('Anike Tobechukwu is the founder of AIDetector.cx');
    expect(profile.bio).toContain('content integrity and transparent digital-content workflows');
    expect(profile.socialLinks.length).toBeGreaterThanOrEqual(4);
  });

  it('2. persists updated founder information and preserves lastUpdated timestamp', () => {
    const customProfile: FounderProfile = {
      name: 'Anike Tobechukwu',
      title: 'Founder & Lead Architect, AIDetector.cx',
      bio: 'Leading research and development of practical AI content analysis tools.',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      socialLinks: [
        {
          id: 'link_linkedin',
          platform: 'linkedin',
          label: 'LinkedIn',
          url: 'https://linkedin.com/in/anike-tobechukwu',
          enabled: true,
          displayOrder: 1,
        },
        {
          id: 'link_x',
          platform: 'x',
          label: 'X (Twitter)',
          url: 'https://x.com/anike_tobe',
          enabled: true,
          displayOrder: 2,
        },
        {
          id: 'link_github',
          platform: 'github',
          label: 'GitHub',
          url: '',
          enabled: false,
          displayOrder: 3,
        },
      ],
    };

    saveFounderProfile(customProfile);
    const loaded = getFounderProfile();

    expect(loaded.name).toBe('Anike Tobechukwu');
    expect(loaded.title).toBe('Founder & Lead Architect, AIDetector.cx');
    expect(loaded.photoUrl).toBe('https://images.unsplash.com/photo-1534528741775-53994a69daeb');
    expect(loaded.lastUpdated).toBeDefined();

    const enabledLinks = loaded.socialLinks.filter(l => l.enabled && l.url.trim() !== '');
    expect(enabledLinks.length).toBe(2);
    expect(enabledLinks[0].url).toBe('https://linkedin.com/in/anike-tobechukwu');
  });

  it('3. validates image URLs and base64 data strings correctly', () => {
    expect(validateImageUrl('').valid).toBe(true);
    expect(validateImageUrl('https://example.com/photo.jpg').valid).toBe(true);
    expect(validateImageUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA').valid).toBe(true);
    expect(validateImageUrl('not-a-valid-url').valid).toBe(false);
    expect(validateImageUrl('ftp://invalid.com/file').valid).toBe(false);
  });

  it('4. validates social profile URLs strictly without throwing', () => {
    expect(validateSocialUrl('').valid).toBe(true);
    expect(validateSocialUrl('https://linkedin.com/in/anike').valid).toBe(true);
    expect(validateSocialUrl('http://github.com/anike').valid).toBe(true);
    expect(validateSocialUrl('just-a-username').valid).toBe(false);
  });

  it('5. ensures no fabricated degrees or corporate claims are in the default profile', () => {
    const profile = DEFAULT_FOUNDER_PROFILE;
    expect(profile.bio).not.toContain('PhD');
    expect(profile.bio).not.toContain('Google Brain');
    expect(profile.bio).not.toContain('Stanford');
    expect(profile.bio).not.toContain('Forbes');
    expect(profile.bio).toContain('founder of AIDetector.cx');
  });

  it('6. verifies social links filtering logic keeps only enabled links with valid URLs', () => {
    const profile: FounderProfile = {
      ...DEFAULT_FOUNDER_PROFILE,
      socialLinks: [
        { id: '1', platform: 'linkedin', label: 'LinkedIn', url: 'https://linkedin.com/in/test', enabled: true, displayOrder: 2 },
        { id: '2', platform: 'x', label: 'X', url: 'https://x.com/test', enabled: false, displayOrder: 1 },
        { id: '3', platform: 'github', label: 'GitHub', url: '', enabled: true, displayOrder: 3 },
        { id: '4', platform: 'website', label: 'Website', url: 'https://anike.me', enabled: true, displayOrder: 1 },
      ],
    };

    const active = profile.socialLinks
      .filter(l => l.enabled && l.url && l.url.trim() !== '')
      .sort((a, b) => a.displayOrder - b.displayOrder);

    expect(active.length).toBe(2);
    expect(active[0].platform).toBe('website');
    expect(active[1].platform).toBe('linkedin');
  });
});
