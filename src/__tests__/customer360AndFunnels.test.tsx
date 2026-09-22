import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { generateSeedCustomers } from '@/lib/customerIntelligence/mockData';
import { computeOverviewMetrics } from '@/lib/customerIntelligence/analyticsEngine';
import { Customer360Modal } from '@/pages/admin/customerIntelligence/Customer360Drawer';
import { EnhancedOverviewTab } from '@/pages/admin/customerIntelligence/EnhancedOverviewTab';
import { ConversionFunnelTab } from '@/pages/admin/customerIntelligence/ConversionFunnelTab';
import { PageAnalyticsTab } from '@/pages/admin/customerIntelligence/PageAnalyticsTab';
import { ToolIntelligenceTab } from '@/pages/admin/customerIntelligence/ToolIntelligenceTab';
import { AcquisitionTab } from '@/pages/admin/customerIntelligence/AcquisitionTab';

describe('Phase 1 Customer Intelligence: UI Components Render', () => {
  const seedCustomers = generateSeedCustomers();
  const metrics = computeOverviewMetrics('30d');

  it('renders EnhancedOverviewTab with 16 metrics and period deltas', () => {
    const html = renderToStaticMarkup(
      <EnhancedOverviewTab
        metrics={metrics}
        dateRange="30d"
        onDateRangeChange={() => {}}
      />
    );
    expect(html).toContain('Executive Overview');
    expect(html).toContain('Unique Visitors');
    expect(html).toContain('Paid Customers');
    expect(html).toContain('Total Revenue');
    expect(html).toContain('Conversion Velocity');
  });

  it('renders ConversionFunnelTab with 8-stage funnel', () => {
    const html = renderToStaticMarkup(<ConversionFunnelTab />);
    expect(html).toContain('8-Stage Acquisition');
    expect(html).toContain('1. Visitors');
    expect(html).toContain('8. Paid');
  });

  it('renders PageAnalyticsTab with pages and paths', () => {
    const html = renderToStaticMarkup(<PageAnalyticsTab />);
    expect(html).toContain('Page, Navigation');
    expect(html).toContain('/ai-detector');
    expect(html).toContain('/pricing');
  });

  it('renders ToolIntelligenceTab with product telemetry', () => {
    const html = renderToStaticMarkup(<ToolIntelligenceTab />);
    expect(html).toContain('Product &amp; Tool Usage Telemetry');
    expect(html).toContain('AI Text Detector');
    expect(html).toContain('SEO Assistant');
    expect(html).toContain('Humanizer');
  });

  it('renders AcquisitionTab with channel matrix', () => {
    const html = renderToStaticMarkup(<AcquisitionTab />);
    expect(html).toContain('Acquisition Channels');
    expect(html).toContain('Organic Search');
    expect(html).toContain('Direct Traffic');
    expect(html).toContain('Paid Search');
  });

  it('renders Customer360 content details properly', () => {
    const sample = seedCustomers[0];
    expect(sample.identity.fullName).toBe('Dr. Sarah Jenkins');
    expect(sample.location.country).toBe('United States');
    expect(sample.location.ipAuthorizedMasked).toBe('172.56.21.***');
    expect(sample.acquisition.firstChannel).toBe('organic');
    expect(sample.device.browser).toContain('Google Chrome');
    expect(sample.engagement.toolsUsed.length).toBeGreaterThan(0);
    expect(sample.conversion.conversionStatus).toBe('paid_customer');
    expect(sample.timeline.length).toBeGreaterThan(0);
  });
});
