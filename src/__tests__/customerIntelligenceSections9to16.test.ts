import { describe, it, expect } from 'vitest';
import { computeGeographicIntelligence } from '@/lib/customerIntelligence/geographicIntelligence';
import { calculateConversionIntent } from '@/lib/customerIntelligence/intentScoring';
import {
  DYNAMIC_SEGMENTS_DEFINITIONS,
  evaluateCustomerDynamicSegments,
  computeAutomaticSegments,
} from '@/lib/customerIntelligence/automaticSegments';
import {
  checkAndRecordIdempotency,
  isBotTraffic,
  mergeAnonymousVisitorWithAccount,
} from '@/lib/customerIntelligence/identityMergeAndDeduplication';
import { generateSeedCustomers } from '@/lib/customerIntelligence/mockData';
import { Customer360Profile } from '@/types/customerIntelligence';

describe('Customer Intelligence - Sections 9 to 16 Test Suite', () => {
  // ── 9. GEOGRAPHIC INTELLIGENCE ──
  it('computes top countries, regions, and cities with complete metrics', () => {
    const geo = computeGeographicIntelligence();
    expect(geo.countries.length).toBeGreaterThanOrEqual(5);
    expect(geo.regions.length).toBeGreaterThanOrEqual(4);
    expect(geo.cities.length).toBeGreaterThanOrEqual(4);

    const us = geo.countries.find((c) => c.name === 'United States');
    expect(us).toBeDefined();
    expect(us?.visitors).toBeGreaterThan(0);
    expect(us?.registrations).toBeGreaterThan(0);
    expect(us?.paidUsers).toBeGreaterThan(0);
    expect(us?.conversionRatePct).toBeGreaterThan(0);
    expect(us?.totalToolUses).toBeGreaterThan(0);
    expect(us?.revenue).toBeGreaterThan(0);
  });

  // ── 10. AUTOMATIC DYNAMIC SEGMENTS ──
  it('defines and evaluates all 15 dynamic automatic segments', () => {
    expect(DYNAMIC_SEGMENTS_DEFINITIONS.length).toBe(15);

    const sampleCustomer: Customer360Profile = {
      identity: {
        visitorId: 'v_test_123',
        isRegistered: true,
        email: 'prospect@enterprise.com',
        subscriptionPlan: 'free',
        firstSeen: '2026-01-01',
        lastSeen: '2026-03-20',
        status: 'Active',
      },
      location: {
        country: 'United States',
        timezone: 'America/New_York',
        ipAuthorizedMasked: '198.51.100.***',
      },
      acquisition: {
        firstSource: 'Google Search',
        firstChannel: 'organic',
        latestSource: 'Direct',
        latestChannel: 'direct',
        landingPage: '/ai-detector',
        utm: {},
      },
      device: {
        category: 'desktop',
        browser: 'Chrome',
        os: 'macOS',
        language: 'en',
        screenResolution: '1920x1080',
      },
      engagement: {
        totalSessions: 5,
        totalPageViews: 24,
        totalEngagedTimeSeconds: 600,
        avgSessionDurationSeconds: 120,
        lastActivity: '2026-03-20',
        toolsUsed: [
          { tool: 'SEO Assistant', count: 8 },
          { tool: 'Plagiarism Checker', count: 4 },
        ],
        totalScansPerformed: 16,
        engagementScore: 88,
      },
      conversion: {
        registrationStatus: 'verified',
        pricingPageViews: 3,
        checkoutAttempts: 1,
        selectedPlan: 'Pro',
        subscriptionStatus: 'none',
        lifetimeRevenue: 0,
        conversionStatus: 'lead',
      },
      timeline: [],
      segments: [],
      tags: [],
    };

    const evaluated = evaluateCustomerDynamicSegments(sampleCustomer);
    expect(evaluated).toContain('Returning Visitors');
    expect(evaluated).toContain('Highly Engaged Visitors');
    expect(evaluated).toContain('Registered Free Users');
    expect(evaluated).toContain('Pricing Viewers');
    expect(evaluated).toContain('Pricing Viewers Who Did Not Purchase');
    expect(evaluated).toContain('Checkout Abandoners');
    expect(evaluated).toContain('Power Users');
    expect(evaluated).toContain('SEO Assistant Users');
    expect(evaluated).toContain('Plagiarism Checker Users');

    const seed = generateSeedCustomers();
    const autoSegs = computeAutomaticSegments(seed);
    expect(autoSegs.length).toBe(15);
    autoSegs.forEach((seg) => {
      expect(seg.matchedCount).toBeGreaterThan(0);
    });
  });

  // ── 11. CONVERSION INTENT & TRANSPARENT SCORING ──
  it('calculates transparent conversion intent score with explainable factors', () => {
    const highIntentCustomer: Partial<Customer360Profile> = {
      identity: {
        visitorId: 'v_high',
        isRegistered: true,
        email: 'sarah@agency.com',
        subscriptionPlan: 'pro',
        firstSeen: '2026-01-01',
        lastSeen: new Date().toISOString(),
        status: 'Active',
      },
      engagement: {
        totalSessions: 6,
        totalPageViews: 30,
        totalEngagedTimeSeconds: 800,
        avgSessionDurationSeconds: 133,
        lastActivity: new Date().toISOString(),
        toolsUsed: [{ tool: 'SEO Assistant', count: 12 }],
        totalScansPerformed: 15,
        engagementScore: 92,
      },
      conversion: {
        registrationStatus: 'verified',
        pricingPageViews: 2,
        checkoutAttempts: 1,
        selectedPlan: 'Pro',
        subscriptionStatus: 'active',
        lifetimeRevenue: 240,
        conversionStatus: 'paid_customer',
      },
    };

    const intent = calculateConversionIntent(highIntentCustomer);
    expect(intent.score).toBeGreaterThanOrEqual(75);
    expect(intent.level).toBe('very_high');
    expect(intent.factors.length).toBeGreaterThanOrEqual(4);

    // Verify explainability factors have names, positive points, and reasons
    intent.factors.forEach((f) => {
      expect(f.name).toBeDefined();
      expect(f.points).toBeGreaterThan(0);
      expect(f.reason.length).toBeGreaterThan(5);
    });

    const factorNames = intent.factors.map((f) => f.name);
    expect(factorNames).toContain('Repeat Visits');
    expect(factorNames).toContain('Heavy Tool Usage');
    expect(factorNames).toContain('Multiple Pricing Page Views');
    expect(factorNames).toContain('Checkout Initiation');
  });

  // ── 14. DATA QUALITY, DEDUPLICATION & IDENTITY MERGE ──
  it('guards against duplicate conversion events with idempotency', () => {
    const key = 'tx_unique_998877';
    expect(checkAndRecordIdempotency(key)).toBe(true);
    expect(checkAndRecordIdempotency(key)).toBe(false); // second call is rejected as duplicate
  });

  it('accurately identifies bot and crawler traffic', () => {
    expect(isBotTraffic('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(true);
    expect(isBotTraffic('Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)')).toBe(true);
    expect(isBotTraffic('python-requests/2.28.1')).toBe(true);
    expect(isBotTraffic('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36')).toBe(false);
  });

  it('merges anonymous visitor touchpoints with registered user account', async () => {
    const mergeResult = await mergeAnonymousVisitorWithAccount('v_anon_12345', 'usr_auth_67890', 'user@example.com');
    expect(mergeResult.success).toBe(true);
  });
});
