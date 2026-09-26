import { describe, it, expect } from 'vitest';
import {
  parseUTMParams,
  detectDeviceCategory,
  detectBrowser,
  detectOS,
  detectChannel,
  maskIpAddress,
  getCurrentSessionId,
} from '@/lib/customerIntelligence/visitorTracking';
import { recordJourneyEvent, getLocalJourneyEvents } from '@/lib/customerIntelligence/journeyTracker';
import {
  computeOverviewMetrics,
  computeConversionFunnel,
  computePageAnalytics,
  computeToolIntelligence,
  computeAcquisitionReport,
} from '@/lib/customerIntelligence/analyticsEngine';
import { generateSeedCustomers } from '@/lib/customerIntelligence/mockData';

describe('Phase 1 Customer Intelligence: Behavioral & Session Analytics', () => {
  it('correctly parses UTM query parameters', () => {
    const url = 'https://aidetector.cx/ai-detector?utm_source=google_ads&utm_medium=cpc&utm_campaign=academic_2025&utm_content=v1&utm_term=ai+detector';
    const utm = parseUTMParams(url);
    expect(utm.utm_source).toBe('google_ads');
    expect(utm.utm_medium).toBe('cpc');
    expect(utm.utm_campaign).toBe('academic_2025');
    expect(utm.utm_content).toBe('v1');
    expect(utm.utm_term).toBe('ai detector');
  });

  it('detects traffic channels accurately based on referrer and UTM', () => {
    expect(detectChannel('https://www.google.com/search?q=ai+checker', {})).toBe('organic');
    expect(detectChannel('https://www.reddit.com/r/openai', {})).toBe('social');
    expect(detectChannel('', { utm_medium: 'cpc', utm_source: 'google' })).toBe('paid');
    expect(detectChannel('', { utm_medium: 'email' })).toBe('email');
    expect(detectChannel('', { utm_medium: 'affiliate' })).toBe('affiliate');
    expect(detectChannel('', {})).toBe('direct');
  });

  it('masks IP addresses for authorized admin security and privacy compliance', () => {
    const maskedIPv4 = maskIpAddress('198.51.100.42');
    expect(maskedIPv4).toBe('198.51.100.***');
    expect(maskedIPv4).not.toContain('42');

    const maskedIPv6 = maskIpAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    expect(maskedIPv6).toContain('::****');
  });

  it('detects device categories, browser, and OS without invasive fingerprinting', () => {
    expect(detectDeviceCategory('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe('mobile');
    expect(detectDeviceCategory('Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)')).toBe('tablet');
    expect(detectDeviceCategory('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('desktop');

    expect(detectBrowser('Mozilla/5.0 Chrome/124.0.0.0 Safari/537.36')).toBe('Google Chrome');
    expect(detectOS('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe('macOS');
  });

  it('records chronological visitor journey events', () => {
    const ev1 = recordJourneyEvent('page_view', { page: '/ai-detector' });
    expect(ev1.id).toBeDefined();
    expect(ev1.eventType).toBe('page_view');
    expect(ev1.page).toBe('/ai-detector');

    const ev2 = recordJourneyEvent('scan_started', { toolName: 'AI Detector' });
    expect(ev2.toolName).toBe('AI Detector');

    const ev3 = recordJourneyEvent('checkout_started', { planName: 'Pro' });
    expect(ev3.planName).toBe('Pro');

    const events = getLocalJourneyEvents(ev1.visitorId);
    expect(events.length).toBeGreaterThanOrEqual(1);
  });

  it('computes executive overview metrics with period deltas', () => {
    const metrics30d = computeOverviewMetrics('30d');
    expect(metrics30d.uniqueVisitors).toBeGreaterThan(0);
    expect(metrics30d.registeredUsers).toBeGreaterThan(0);
    expect(metrics30d.paidUsers).toBeGreaterThan(0);
    expect(metrics30d.visitorToRegistrationRate).toBeGreaterThan(0);
    expect(metrics30d.checkoutAbandonmentRate).toBeGreaterThan(0);
    expect(metrics30d.totalRevenue).toBeGreaterThan(0);
    expect(metrics30d.revenuePerVisitor).toBeGreaterThan(0);

    const metrics7d = computeOverviewMetrics('7d');
    expect(metrics7d.uniqueVisitors).toBeLessThan(metrics30d.uniqueVisitors);
  });

  it('calculates 8-stage interactive conversion funnel and stage drop-offs', () => {
    const funnel = computeConversionFunnel();
    expect(funnel.length).toBe(8);
    expect(funnel[0].stageId).toBe('visitors');
    expect(funnel[7].stageId).toBe('paid');

    // Stage counts should monotonically decrease or remain bounded
    for (let i = 1; i < funnel.length; i++) {
      expect(funnel[i].overallConversionRate).toBeLessThanOrEqual(funnel[i - 1].overallConversionRate + 5);
      expect(funnel[i].dropoffRate).toBeGreaterThanOrEqual(0);
    }
  });

  it('computes page telemetry and common navigation paths', () => {
    const { pages, paths } = computePageAnalytics();
    expect(pages.length).toBeGreaterThanOrEqual(5);
    expect(pages.some((p) => p.path === '/ai-detector')).toBe(true);
    expect(pages.some((p) => p.path === '/pricing')).toBe(true);
    expect(paths.length).toBeGreaterThanOrEqual(3);
  });

  it('computes tool and product intelligence metrics', () => {
    const tools = computeToolIntelligence();
    expect(tools.length).toBeGreaterThanOrEqual(6);
    expect(tools.some((t) => t.toolId === 'ai_detector')).toBe(true);
    expect(tools.some((t) => t.toolId === 'seo_assistant')).toBe(true);
    expect(tools.some((t) => t.toolId === 'humanizer')).toBe(true);

    tools.forEach((t) => {
      expect(t.uniqueUsers).toBeGreaterThan(0);
      expect(t.totalUses).toBeGreaterThanOrEqual(t.successfulCompletions);
      expect(t.registrationConversionRate).toBeGreaterThanOrEqual(0);
      expect(t.paidConversionRate).toBeGreaterThanOrEqual(0);
    });
  });

  it('computes acquisition channels with first-touch and last-touch attribution', () => {
    const acq = computeAcquisitionReport();
    expect(acq.length).toBeGreaterThanOrEqual(5);
    expect(acq.some((a) => a.channel === 'organic')).toBe(true);
    expect(acq.some((a) => a.channel === 'direct')).toBe(true);
    expect(acq.some((a) => a.channel === 'paid')).toBe(true);
  });

  it('generates rich Customer 360 seed profiles with 6 sections', () => {
    const customers = generateSeedCustomers();
    expect(customers.length).toBeGreaterThanOrEqual(3);

    const first = customers[0];
    expect(first.identity.visitorId).toBeDefined();
    expect(first.location.country).toBeDefined();
    expect(first.location.ipAuthorizedMasked).toContain('***');
    expect(first.acquisition.firstChannel).toBeDefined();
    expect(first.device.browser).toBeDefined();
    expect(first.engagement.toolsUsed.length).toBeGreaterThan(0);
    expect(first.conversion.conversionStatus).toBeDefined();
    expect(first.timeline.length).toBeGreaterThanOrEqual(5);
  });
});
