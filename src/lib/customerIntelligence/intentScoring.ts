import { Customer360Profile, IntentFactor, IntentScoreBreakdown, IntentLevel } from '@/types/customerIntelligence';

/**
 * Transparent conversion intent and lead scoring engine.
 * Computes explainable score based on observable behavioral touchpoints without sensitive personal inferences.
 */
export function calculateConversionIntent(customer: Partial<Customer360Profile>): IntentScoreBreakdown {
  const factors: IntentFactor[] = [];
  let score = 0;

  const sessions = customer.engagement?.totalSessions || 0;
  const scans = customer.engagement?.totalScansPerformed || 0;
  const pricingViews = customer.conversion?.pricingPageViews || 0;
  const checkoutAttempts = customer.conversion?.checkoutAttempts || 0;
  const isRegistered = customer.identity?.isRegistered || !!customer.identity?.email;
  const isPaid = customer.conversion?.conversionStatus === 'paid_customer' || (customer.identity?.subscriptionPlan && customer.identity?.subscriptionPlan !== 'free');
  const toolsUsed = customer.engagement?.toolsUsed || [];
  const hasBusinessOrAPI = toolsUsed.some(t => t.tool.toLowerCase().includes('seo') || t.tool.toLowerCase().includes('api'));

  // 1. Repeat Visits
  if (sessions > 1) {
    const pts = Math.min(25, 10 + (sessions - 1) * 3);
    factors.push({
      name: 'Repeat Visits',
      points: pts,
      reason: `Returned for ${sessions} distinct sessions across timeframes`,
    });
    score += pts;
  } else {
    factors.push({
      name: 'First-Time Visitor',
      points: 5,
      reason: 'Initial single session recorded',
    });
    score += 5;
  }

  // 2. Active Tool Usage
  if (scans >= 10) {
    factors.push({
      name: 'Heavy Tool Usage',
      points: 25,
      reason: `Executed ${scans} checks/scans across product suite`,
    });
    score += 25;
  } else if (scans >= 3) {
    factors.push({
      name: 'Moderate Tool Usage',
      points: 15,
      reason: `Executed ${scans} checks/scans`,
    });
    score += 15;
  } else if (scans > 0) {
    factors.push({
      name: 'Initial Tool Trial',
      points: 8,
      reason: `Completed ${scans} scan/check operation`,
    });
    score += 8;
  }

  // 3. Pricing Page Engagement
  if (pricingViews >= 2) {
    factors.push({
      name: 'Multiple Pricing Page Views',
      points: 20,
      reason: `Inspected /pricing tiers ${pricingViews} times`,
    });
    score += 20;
  } else if (pricingViews === 1) {
    factors.push({
      name: 'Pricing Tier Inspection',
      points: 10,
      reason: 'Visited plans and pricing page',
    });
    score += 10;
  }

  // 4. Checkout Initiation / Plan Selection
  if (checkoutAttempts > 0) {
    factors.push({
      name: 'Checkout Initiation',
      points: 25,
      reason: `Initiated checkout flow for ${customer.conversion?.selectedPlan || 'Pro'} plan`,
    });
    score += 25;
  }

  // 5. Registration / Account Creation
  if (isRegistered) {
    factors.push({
      name: 'Verified User Account',
      points: 20,
      reason: 'Created authenticated user profile',
    });
    score += 20;
  }

  // 6. Business, Team or SEO Tool Interest
  if (hasBusinessOrAPI) {
    factors.push({
      name: 'High-Value Product Exploration',
      points: 15,
      reason: 'Utilized commercial / SEO / Batch verification capabilities',
    });
    score += 15;
  }

  // 7. Recent Activity
  if (customer.identity?.lastSeen) {
    const hoursSinceLastSeen = (Date.now() - new Date(customer.identity.lastSeen).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastSeen <= 24) {
      factors.push({
        name: 'Recent Recency (< 24h)',
        points: 10,
        reason: 'Active on platform within the past 24 hours',
      });
      score += 10;
    }
  }

  // Existing paid customer booster
  if (isPaid) {
    factors.push({
      name: 'Active Paid Customer',
      points: 15,
      reason: `Currently subscribed to ${customer.identity?.subscriptionPlan || 'Pro'} tier`,
    });
    score += 15;
  }

  // Normalize score between 0 and 100
  const normalizedScore = Math.min(100, Math.max(0, score));

  let level: IntentLevel = 'low';
  if (normalizedScore >= 75) level = 'very_high';
  else if (normalizedScore >= 50) level = 'high';
  else if (normalizedScore >= 25) level = 'medium';

  return {
    score: normalizedScore,
    level,
    maxScore: 100,
    factors,
  };
}
