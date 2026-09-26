import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import AboutPage from '@/pages/company/AboutPage';
import { DEFAULT_FOUNDER_PROFILE, generateAboutStructuredData } from '@/lib/founderSettings';

// Mock MainLayout to isolate AboutPage component testing
vi.mock('@/components/layouts/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="main-layout">{children}</div>,
}));

const renderAboutPage = () => {
  return renderToStaticMarkup(
    <HelmetProvider>
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>
    </HelmetProvider>
  );
};

describe('AboutPage Component Rendering and Transparency Verification', () => {
  it('1. renders Hero section with exact H1, supporting message, and concise intro', () => {
    const html = renderAboutPage();

    // H1 check
    expect(html).toContain('About AIDetector.cx');
    expect(html).toContain('Building practical tools for understanding AI-generated and human-created digital content.');
    expect(html).toContain('AIDetector.cx develops tools for analyzing AI-generated content and supporting content-integrity workflows.');
  });

  it('2. contains zero absolute accuracy claims, fake statistics, or claims of definitive proof', () => {
    const html = renderAboutPage();

    // Assert that exaggerated claims, fake stats, and unverified personas are absent
    expect(html).not.toContain('98% accuracy');
    expect(html).not.toContain('100% accurate');
    expect(html).not.toContain('2M+ Analyses');
    expect(html).not.toContain('150K+ Active users');
    expect(html).not.toContain('Aria Chen');
    expect(html).not.toContain('Marcus Webb');
    expect(html).not.toContain('provides definitive proof');
    expect(html).toContain('We do not present an automated detector score as definitive proof of authorship');
  });

  it('3. renders Our Purpose section with contextual interpretation principle', () => {
    const html = renderAboutPage();

    expect(html).toContain('Our Purpose');
    expect(html).toContain('AIDetector.cx is being developed to make these analyses more understandable, accessible, and useful');
    expect(html).toContain('Contextual Interpretation Principle');
    expect(html).toContain('We do not present an automated detector score as definitive proof of authorship or AI usage.');
  });

  it('4. renders What We Build section with the 4 capability groups and accurate links', () => {
    const html = renderAboutPage();

    expect(html).toContain('What We Build');
    expect(html).toContain('Text &amp; Content Integrity');
    expect(html).toContain('Multimodal Analysis');
    expect(html).toContain('Writing &amp; Content Workflows');
    expect(html).toContain('Developer &amp; Directory Ecosystem');

    // Verify key internal links exist
    expect(html).toContain('href="/ai-detector"');
    expect(html).toContain('href="/plagiarism-checker"');
    expect(html).toContain('href="/verified-authorship"');
    expect(html).toContain('href="/ai-image-detector"');
    expect(html).toContain('href="/ai-video-detector"');
    expect(html).toContain('href="/seo-assistant"');
    expect(html).toContain('href="/humanizer"');
    expect(html).toContain('href="/api-docs"');
    expect(html).toContain('href="/directory"');
  });

  it('5. renders Company Principles section (Transparency, Responsible Interpretation, Continuous Improvement, Privacy)', () => {
    const html = renderAboutPage();

    expect(html).toContain('Company Principles');
    expect(html).toContain('Transparency');
    expect(html).toContain('Responsible Interpretation');
    expect(html).toContain('Continuous Improvement');
    expect(html).toContain('Data Privacy');
    expect(html).toContain('We explain what detection results represent and disclose score confidence');
  });

  it('6. renders How We Think About AI Detection section with probabilistic transparency', () => {
    const html = renderAboutPage();

    expect(html).toContain('How We Think About AI Detection');
    expect(html).toContain('Detection Is Probabilistic');
    expect(html).toContain('Detectors Vary by Model &amp; Tuning');
    expect(html).toContain('False Positives &amp; Negatives Occur');
    expect(html).toContain('Sentence-Level Explanatory Context');
  });

  it('7. renders Responsible Use section with ethical guidance', () => {
    const html = renderAboutPage();

    expect(html).toContain('Responsible Use &amp; Human Oversight');
    expect(html).toContain('avoid making significant academic, disciplinary, or employment decisions solely from an automated AI detection score');
    expect(html).toContain('Always pair automated scores with holistic contextual review');
    expect(html).toContain('Seek supporting evidence such as draft revision histories');
  });

  it('8. renders Founder section for Anike Tobechukwu with neutral placeholder fallback or photo', () => {
    const html = renderAboutPage();

    expect(html).toContain('Founder');
    expect(html).toContain('Anike Tobechukwu');
    expect(html).toContain('Founder, AIDetector.cx');
    expect(html).toContain('Anike Tobechukwu is the founder of AIDetector.cx and leads the development and direction of the platform');
  });

  it('9. generates valid JSON-LD Person and Organization Schema without fabricated credentials', () => {
    const schema = generateAboutStructuredData(DEFAULT_FOUNDER_PROFILE);
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@graph'].length).toBe(2);

    const org = schema['@graph'].find(item => item['@type'] === 'Organization') as any;
    expect(org).toBeDefined();
    expect(org?.name).toBe('AIDetector.cx');
    expect(org?.founder?.name).toBe('Anike Tobechukwu');
    expect(org?.founder?.jobTitle).toBe('Founder, AIDetector.cx');
    expect(org?.founder?.sameAs?.length).toBeGreaterThanOrEqual(1);
  });

  it('10. renders single restrained CTA linking to AI Detector route', () => {
    const html = renderAboutPage();

    expect(html).toContain('Understand Your Content');
    expect(html).toContain('Analyze content with AIDetector.cx and review the signals behind the result.');
    expect(html).toContain('Try AI Detector');
    expect(html).toContain('href="/ai-detector"');
  });

  it('11. renders Trust & Transparency links', () => {
    const html = renderAboutPage();

    expect(html).toContain('Trust &amp; Transparency Resources');
    expect(html).toContain('href="/directory"');
    expect(html).toContain('href="/api-docs"');
    expect(html).toContain('href="/community"');
    expect(html).toContain('href="/contact"');
  });
});
