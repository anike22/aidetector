import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import PressPage, {
  VERIFIED_PRESS_COVERAGE,
  PRODUCTS_OVERVIEW,
  BRAND_ASSETS,
  FACT_SHEET,
} from '../pages/company/PressPage';

// Mock MainLayout to isolate PressPage component testing
vi.mock('@/components/layouts/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="main-layout">{children}</div>,
}));

const renderPressPage = () => {
  return renderToStaticMarkup(
    <HelmetProvider>
      <MemoryRouter>
        <PressPage />
      </MemoryRouter>
    </HelmetProvider>
  );
};

describe('PressPage Component and Integrity Verification', () => {
  it('renders without error and outputs the hero heading and official media subtitle', () => {
    const html = renderPressPage();

    expect(html).toContain('AIDetector.cx Press &amp; Media');
    expect(html).toContain('Official information, product resources and media assets');
    expect(html).toContain('Press &amp; Media Desk');
  });

  it('contains zero fabricated press headlines, fake funding, or invented accuracy claims', () => {
    const html = renderPressPage();

    // Assert that unverified claims are completely absent from the rendered page
    expect(html).not.toContain('$12M');
    expect(html).not.toContain('Series A');
    expect(html).not.toContain('$2.5M');
    expect(html).not.toContain('98% accuracy');
    expect(html).not.toContain('91% accuracy');
    expect(html).not.toContain('500 Fortune 1000s');
    expect(html).not.toContain('gold standard');
    expect(html).not.toContain('Aria Chen');
    expect(html).not.toContain('Marcus Webb');
    expect(html).not.toContain('10,000 developers integrate');
  });

  it('provides genuine media assets referencing verified static files', () => {
    expect(BRAND_ASSETS.length).toBeGreaterThanOrEqual(3);
    for (const asset of BRAND_ASSETS) {
      expect(asset.downloadUrl).toMatch(/^\/(images|brand|favicon)/);
      expect(asset.filename).toBeTruthy();
      expect(asset.title).toBeTruthy();
    }

    const html = renderPressPage();

    expect(html).toContain('Official Media &amp; Brand Assets');
    expect(html).toContain('AIDetector.cx Primary Logo (SVG)');
    expect(html).toContain('AIDetector.cx Brand Icon (PNG)');
    expect(html).toContain('AIDetector.cx Favicon &amp; Symbol');
  });

  it('displays the legitimate press contact email press@aidetector.cx and inquiry details', () => {
    const html = renderPressPage();

    expect(html).toContain('href="mailto:press@aidetector.cx"');
    expect(html).toContain('Media &amp; Press Inquiries');
    expect(html).toContain('href="/contact"');
  });

  it('displays the graceful empty state when no verified third-party coverage is registered', () => {
    expect(VERIFIED_PRESS_COVERAGE).toHaveLength(0);

    const html = renderPressPage();

    expect(html).toContain('Press coverage will be added as it becomes available.');
    expect(html).toContain('Submit Coverage Link');
  });

  it('links to genuine platform products and capabilities', () => {
    expect(PRODUCTS_OVERVIEW.length).toBe(7);

    const paths = PRODUCTS_OVERVIEW.map((p) => p.href);
    expect(paths).toContain('/detector');
    expect(paths).toContain('/plagiarism-checker');
    expect(paths).toContain('/ai-checker-for-bloggers');
    expect(paths).toContain('/humanizer');
    expect(paths).toContain('/ai-image-detector');
    expect(paths).toContain('/verified-authorship');
    expect(paths).toContain('/api-platform');

    const html = renderPressPage();

    expect(html).toContain('Multi-Engine AI Text Detection');
    expect(html).toContain('Multilingual Academic Plagiarism Checker');
    expect(html).toContain('AI Checker for Bloggers &amp; SEO Assistant');
  });

  it('contains comprehensive factual data in the media fact sheet', () => {
    const labels = FACT_SHEET.map((f) => f.label);
    expect(labels).toContain('Platform Name');
    expect(labels).toContain('Core Category');
    expect(labels).toContain('Primary Domain');
    expect(labels).toContain('Media Contact');

    const domain = FACT_SHEET.find((f) => f.label === 'Primary Domain');
    expect(domain?.value).toBe('aidetector.cx');
  });
});
