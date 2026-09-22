export interface SocialProfileLink {
  id: string;
  platform: 'linkedin' | 'x' | 'github' | 'website';
  label: string;
  url: string;
  enabled: boolean;
  displayOrder: number;
}

export interface FounderProfile {
  name: string;
  title: string;
  bio: string;
  photoUrl: string;
  socialLinks: SocialProfileLink[];
  lastUpdated?: string;
}

export const DEFAULT_FOUNDER_PROFILE: FounderProfile = {
  name: 'Anike Tobechukwu',
  title: 'Founder, AIDetector.cx',
  bio: 'Anike Tobechukwu is the founder of AIDetector.cx and leads the development and direction of the platform, with a focus on practical tools for AI-content analysis, content integrity and transparent digital-content workflows.',
  photoUrl: '', // Tasteful neutral monogram placeholder used until real photo uploaded
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
      url: 'https://github.com/aniketobechukwu',
      enabled: true,
      displayOrder: 3,
    },
    {
      id: 'link_website',
      platform: 'website',
      label: 'Website',
      url: 'https://aidetector.cx',
      enabled: true,
      displayOrder: 4,
    },
  ],
  lastUpdated: '2025-01-01T00:00:00.000Z',
};

const STORAGE_KEY = 'aidetector_founder_profile';

export function getFounderProfile(): FounderProfile {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          name: parsed.name || DEFAULT_FOUNDER_PROFILE.name,
          title: parsed.title || DEFAULT_FOUNDER_PROFILE.title,
          bio: parsed.bio || DEFAULT_FOUNDER_PROFILE.bio,
          photoUrl: parsed.photoUrl || '',
          socialLinks: Array.isArray(parsed.socialLinks) && parsed.socialLinks.length > 0
            ? parsed.socialLinks
            : DEFAULT_FOUNDER_PROFILE.socialLinks,
          lastUpdated: parsed.lastUpdated,
        };
      }
    }
  } catch (err) {
    console.error('Failed to load founder profile from local storage:', err);
  }
  return DEFAULT_FOUNDER_PROFILE;
}

export function saveFounderProfile(profile: FounderProfile): void {
  try {
    const sanitized: FounderProfile = {
      name: profile.name.trim() || DEFAULT_FOUNDER_PROFILE.name,
      title: profile.title.trim() || DEFAULT_FOUNDER_PROFILE.title,
      bio: profile.bio.trim() || DEFAULT_FOUNDER_PROFILE.bio,
      photoUrl: profile.photoUrl || '',
      socialLinks: (profile.socialLinks || []).map(link => ({
        ...link,
        url: link.url.trim(),
      })),
      lastUpdated: new Date().toISOString(),
    };
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    }
  } catch (err) {
    console.error('Failed to save founder profile:', err);
  }
}

export function validateImageUrl(urlOrData: string): { valid: boolean; error?: string } {
  if (!urlOrData) return { valid: true };
  if (urlOrData.startsWith('data:image/')) {
    return { valid: true };
  }
  try {
    const parsed = new URL(urlOrData);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return { valid: true };
    }
    return { valid: false, error: 'URL must use http:// or https://' };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export function validateSocialUrl(url: string): { valid: boolean; error?: string } {
  if (!url || url.trim() === '') return { valid: true };
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return { valid: true };
    }
    return { valid: false, error: 'URL must begin with http:// or https://' };
  } catch {
    return { valid: false, error: 'Please enter a valid website URL (e.g. https://linkedin.com/...)' };
  }
}

/**
 * Generate Person & Organization JSON-LD Structured Data for /about page
 */
export function generateAboutStructuredData(profile: FounderProfile) {
  const activeSameAs = (profile.socialLinks || [])
    .filter(link => link.enabled && link.url && link.url.trim() !== '')
    .map(link => link.url.trim());

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://aidetector.cx/#organization',
        'name': 'AIDetector.cx',
        'url': 'https://aidetector.cx',
        'logo': 'https://aidetector.cx/brand/aidetector-logo.svg',
        'description': 'Building practical tools for understanding AI-generated and human-created digital content.',
        'founder': {
          '@type': 'Person',
          '@id': 'https://aidetector.cx/#founder',
          'name': profile.name || 'Anike Tobechukwu',
          'jobTitle': profile.title || 'Founder, AIDetector.cx',
          'description': profile.bio,
          ...(profile.photoUrl ? { 'image': profile.photoUrl } : {}),
          ...(activeSameAs.length > 0 ? { 'sameAs': activeSameAs } : {})
        }
      },
      {
        '@type': 'WebPage',
        '@id': 'https://aidetector.cx/about/#webpage',
        'url': 'https://aidetector.cx/about',
        'name': 'About AIDetector.cx | AI Content Detection & Integrity',
        'description': 'Learn about AIDetector.cx, our purpose, approach to probabilistic AI content analysis, responsible use principles, and founder Anike Tobechukwu.',
        'isPartOf': {
          '@id': 'https://aidetector.cx/#website'
        },
        'about': {
          '@id': 'https://aidetector.cx/#organization'
        }
      }
    ]
  };
}
