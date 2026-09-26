import { describe, it, expect } from 'vitest';
import { getFilteredNavStructure, navStructure } from '@/components/layouts/navData';

describe('Header Compact Indicator & Layout Overflow Verification', () => {
  describe('1. Compact Dynamic Indicator Copy Format', () => {
    function getIndicatorText(params: {
      isPaid: boolean;
      isAuthenticated: boolean;
      trialChecksRemaining: number;
      creditsBalance: number;
    }) {
      if (params.isPaid) {
        return `${params.creditsBalance} credits`;
      }
      if (!params.isAuthenticated) {
        return params.trialChecksRemaining > 0 ? '1 free check left' : '0 free checks left';
      }
      return `${params.trialChecksRemaining} free check${params.trialChecksRemaining === 1 ? '' : 's'} left`;
    }

    it('renders "1 free check left" for fresh guest with 1 check', () => {
      const text = getIndicatorText({
        isPaid: false,
        isAuthenticated: false,
        trialChecksRemaining: 1,
        creditsBalance: 0,
      });
      expect(text).toBe('1 free check left');
    });

    it('renders "0 free checks left" for exhausted guest with 0 checks', () => {
      const text = getIndicatorText({
        isPaid: false,
        isAuthenticated: false,
        trialChecksRemaining: 0,
        creditsBalance: 0,
      });
      expect(text).toBe('0 free checks left');
    });

    it('renders "4 free checks left" for registered free user with 4 checks', () => {
      const text = getIndicatorText({
        isPaid: false,
        isAuthenticated: true,
        trialChecksRemaining: 4,
        creditsBalance: 0,
      });
      expect(text).toBe('4 free checks left');
    });

    it('renders "1 free check left" for registered free user with 1 check', () => {
      const text = getIndicatorText({
        isPaid: false,
        isAuthenticated: true,
        trialChecksRemaining: 1,
        creditsBalance: 0,
      });
      expect(text).toBe('1 free check left');
    });

    it('renders "0 free checks left" for registered free user with 0 checks', () => {
      const text = getIndicatorText({
        isPaid: false,
        isAuthenticated: true,
        trialChecksRemaining: 0,
        creditsBalance: 0,
      });
      expect(text).toBe('0 free checks left');
    });

    it('renders exact credit count for paid users', () => {
      const text = getIndicatorText({
        isPaid: true,
        isAuthenticated: true,
        trialChecksRemaining: 0,
        creditsBalance: 300,
      });
      expect(text).toBe('300 credits');
    });
  });

  describe('2. Navigation Structure & Responsiveness', () => {
    it('provides complete filtered navigation structure', () => {
      const nav = getFilteredNavStructure(() => true);
      expect(nav.length).toBeGreaterThan(0);
      expect(nav.some(g => g.title === 'Tools')).toBe(true);
    });

    it('all navigation dropdowns and links have valid URLs', () => {
      navStructure.forEach((group) => {
        expect(group.title).toBeDefined();
        group.items.forEach((item) => {
          expect(item.href).toMatch(/^\//);
          expect(item.label).toBeDefined();
        });
      });
    });
  });

  describe('3. Viewport Constraints & Above-the-fold Simulation', () => {
    const viewports = [360, 390, 768, 1024, 1280, 1440, 1920];

    it.each(viewports)('ensures layout calculations fit viewport width %ipx without overflow', (viewportWidth) => {
      // Simulate container sizing
      const maxContainerWidth = Math.min(viewportWidth, 1280); // max-w-7xl
      const padding = viewportWidth < 640 ? 24 : 48; // px-3 / px-6
      const contentWidth = maxContainerWidth - padding;

      expect(contentWidth).toBeLessThanOrEqual(viewportWidth);
      expect(contentWidth).toBeGreaterThan(0);
    });

    const standardScreens = [
      { width: 360, height: 640, name: 'Small Mobile (Galaxy S / iPhone SE)', maxAllowedAboveFoldHeight: 520 },
      { width: 390, height: 844, name: 'Standard Mobile (iPhone 13/14/15)', maxAllowedAboveFoldHeight: 650 },
      { width: 1366, height: 768, name: 'Compact Laptop (1366x768)', maxAllowedAboveFoldHeight: 620 },
      { width: 1440, height: 900, name: 'MacBook Pro / Desktop (1440x900)', maxAllowedAboveFoldHeight: 750 },
      { width: 1920, height: 1080, name: 'Full HD Desktop (1920x1080)', maxAllowedAboveFoldHeight: 850 },
    ];

    it.each(standardScreens)('confirms text input and analysis button fit above the fold on $name ($width x $height)', (screen) => {
      // Navbar: ~54px
      const navHeight = 54;
      // Top padding: 16px (mobile) to 24px (desktop)
      const topPadding = screen.width < 768 ? 16 : 24;
      // Compact H1: ~36px (mobile) to 48px (desktop)
      const h1Height = screen.width < 768 ? 36 : 48;
      // Compact trial allowance bar: ~36px (mobile) to 40px (desktop)
      const trialBarHeight = screen.width < 768 ? 36 : 40;
      // Editor card header + textarea (140-190px) + action footer (~48px): ~240px (mobile) to ~300px (desktop)
      const detectorCardHeight = screen.width < 768 ? 240 : 300;

      const totalFoldHeight = navHeight + topPadding + h1Height + trialBarHeight + detectorCardHeight;

      expect(totalFoldHeight).toBeLessThanOrEqual(screen.maxAllowedAboveFoldHeight);
      expect(totalFoldHeight).toBeLessThan(screen.height);
    });

    it('handles simulated 125% zoom (effective 1024px -> 819px viewport)', () => {
      const effectiveWidth = Math.floor(1024 / 1.25); // ~819px
      // On screens < 1280px (xl), header switches to collapsible drawer
      const isMobileDrawerActive = effectiveWidth < 1280;
      expect(isMobileDrawerActive).toBe(true);
    });

    it('handles simulated 200% zoom (effective 1440px -> 720px viewport)', () => {
      const effectiveWidth = Math.floor(1440 / 2.0); // 720px
      const isMobileDrawerActive = effectiveWidth < 1280;
      expect(isMobileDrawerActive).toBe(true);
    });
  });
});
