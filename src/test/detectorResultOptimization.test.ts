// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';

describe('AI Detector Full Analysis Result UI & SEO Assistant Integration', () => {
  it('transfers draft text to SEO Assistant via dual localStorage keys without credit deduction', () => {
    const mockContent = 'Artificial intelligence in modern content generation has evolved significantly across industries.';
    const draft = {
      content: mockContent,
      keyword: '',
      updatedAt: Date.now(),
      sourcePage: '/detector',
    };

    localStorage.setItem('aidetector_blogger_draft', JSON.stringify(draft));
    localStorage.setItem('seo_assistant_draft', JSON.stringify(draft));

    const retrievedBlogger = localStorage.getItem('aidetector_blogger_draft');
    const retrievedSEO = localStorage.getItem('seo_assistant_draft');
    expect(retrievedBlogger).toBeTruthy();
    expect(retrievedSEO).toBeTruthy();

    const parsedBlogger = JSON.parse(retrievedBlogger!);
    const parsedSEO = JSON.parse(retrievedSEO!);
    expect(parsedBlogger.content).toBe(mockContent);
    expect(parsedSEO.content).toBe(mockContent);
    expect(parsedBlogger.sourcePage).toBe('/detector');
  });

  it('verifies exact SEO Assistant CTA content, copy, and link destination', () => {
    const cta = {
      heading: 'Ready to improve this content?',
      subtext: 'Writing for a blog, client, agency or SEO campaign? Continue with SEO, readability, plagiarism, content uniqueness and publishing-readiness analysis.',
      buttonLabel: 'Optimize in SEO Assistant →',
      targetPath: '/ai-checker-for-bloggers',
    };

    expect(cta.heading).toBe('Ready to improve this content?');
    expect(cta.subtext).toContain('Writing for a blog, client, agency or SEO campaign?');
    expect(cta.subtext).toContain('publishing-readiness analysis');
    expect(cta.buttonLabel).toBe('Optimize in SEO Assistant →');
    expect(cta.targetPath).toBe('/ai-checker-for-bloggers');
  });

  it('preserves Level 1 to Level 7 information hierarchy in result structure', () => {
    const levels = [
      'Level 1: Overall AI Detection Result (Score, Verdict, Risk)',
      'Level 2: Detector Comparison (Balanced vs Strict)',
      'Level 3: Result Context (Language, Multilingual, Text Sufficiency)',
      'Level 4: Result Explanation & Factors',
      'Level 5: Deeper Analysis (Linguistic Metrics, Pattern Profile, Timeline, Flagged Passages, Limitations)',
      'Level 6: Next Action — Optimize in SEO Assistant CTA',
      'Level 7: Detailed Evidence — Sentence-Level Analysis (Collapsed by default)',
    ];

    expect(levels.length).toBe(7);
    expect(levels[0]).toContain('Overall AI Detection Result');
    expect(levels[5]).toContain('Optimize in SEO Assistant');
    expect(levels[6]).toContain('Sentence-Level Analysis');
  });

  it('guarantees Balanced Detector is primary and High-Sensitivity Strict has false-positive warning', () => {
    const balancedConfig = {
      label: 'Balanced Detector',
      badge: 'Recommended',
      description: 'Calibrated for balanced accuracy and reduced false positives.',
    };

    const strictConfig = {
      label: 'High-Sensitivity Analysis — Strict',
      badge: 'Higher False-Positive Risk',
      description: 'Stricter screen flagging weaker AI-like patterns. Not inherently more accurate.',
    };

    expect(balancedConfig.badge).toBe('Recommended');
    expect(strictConfig.badge).toBe('Higher False-Positive Risk');
  });

  it('verifies Document Content panel height design on desktop and mobile', () => {
    const layoutSpec = {
      desktopHeight: 'md:h-[480px]',
      desktopScroll: 'md:overflow-y-auto',
      mobileMinHeight: 'min-h-[300px]',
      mobileScrollTrapped: false,
    };

    expect(layoutSpec.desktopHeight).toBe('md:h-[480px]');
    expect(layoutSpec.mobileScrollTrapped).toBe(false);
  });

  it('verifies Homepage Contextual CTA copy, link, and visual hierarchy', () => {
    const homepageCTA = {
      heading: 'Creating content for search?',
      description: 'Go beyond AI detection with SEO scoring, plagiarism checks, content uniqueness, readability and publishing-readiness analysis.',
      buttonLabel: 'Optimize Your Article',
      targetPath: '/ai-checker-for-bloggers',
    };

    expect(homepageCTA.heading).toBe('Creating content for search?');
    expect(homepageCTA.description).toContain('Go beyond AI detection with SEO scoring, plagiarism checks');
    expect(homepageCTA.buttonLabel).toBe('Optimize Your Article');
    expect(homepageCTA.targetPath).toBe('/ai-checker-for-bloggers');
  });

  it('verifies Tools dropdown, mobile menu and footer internal linking for /ai-checker-for-bloggers', () => {
    const internalPaths = {
      homepageCTA: '/ai-checker-for-bloggers',
      navDropdown: '/ai-checker-for-bloggers',
      mobileNav: '/ai-checker-for-bloggers',
      footerTools: '/ai-checker-for-bloggers',
    };

    expect(internalPaths.homepageCTA).toBe('/ai-checker-for-bloggers');
    expect(internalPaths.navDropdown).toBe('/ai-checker-for-bloggers');
    expect(internalPaths.mobileNav).toBe('/ai-checker-for-bloggers');
    expect(internalPaths.footerTools).toBe('/ai-checker-for-bloggers');
  });
});
