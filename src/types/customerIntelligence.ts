import { CustomerProfile, CustomerSegment, CustomerTag } from '@/types/cdp';

export type DeviceCategory = 'desktop' | 'mobile' | 'tablet';
export type TrafficChannel = 'organic' | 'direct' | 'referral' | 'social' | 'paid' | 'email' | 'affiliate' | 'other';
export type DateRangePreset = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'custom';

export type JourneyEventType =
  | 'page_view'
  | 'session_start'
  | 'session_end'
  | 'tool_opened'
  | 'scan_started'
  | 'scan_completed'
  | 'scan_failed'
  | 'result_viewed'
  | 'credit_consumed'
  | 'registration_prompt_viewed'
  | 'registration_started'
  | 'registration_completed'
  | 'login'
  | 'pricing_viewed'
  | 'plan_selected'
  | 'checkout_started'
  | 'checkout_completed'
  | 'checkout_abandoned'
  | 'subscription_started'
  | 'subscription_upgraded'
  | 'subscription_cancelled';

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export interface VisitorSession {
  sessionId: string;
  visitorId: string;
  userId?: string | null;
  isRegistered: boolean;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  engagedTimeSeconds: number;
  pageViewsCount: number;
  landingPage: string;
  exitPage: string;
  referrer: string;
  referringDomain: string;
  channel: TrafficChannel;
  utm: UTMParams;
  country: string;
  region: string;
  city: string;
  timezone: string;
  ipMasked: string; // Truncated or hashed for admin security & GDPR compliance
  deviceCategory: DeviceCategory;
  browser: string;
  os: string;
  screenClass: string;
  language: string;
  toolsUsed: string[];
  events: JourneyEvent[];
}

export interface JourneyEvent {
  id: string;
  visitorId: string;
  userId?: string | null;
  sessionId: string;
  eventType: JourneyEventType;
  page?: string;
  toolName?: string;
  planName?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface Customer360Profile {
  identity: {
    visitorId: string;
    userId?: string | null;
    email?: string | null;
    fullName?: string | null;
    isRegistered: boolean;
    subscriptionPlan: string;
    customerSince?: string | null;
    firstSeen: string;
    lastSeen: string;
    status: string;
  };
  location: {
    country: string;
    region: string;
    city: string;
    timezone: string;
    ipAuthorizedMasked: string;
  };
  acquisition: {
    firstSource: string;
    firstChannel: TrafficChannel;
    latestSource: string;
    latestChannel: TrafficChannel;
    firstReferrer: string;
    landingPage: string;
    utm: UTMParams;
  };
  device: {
    category: DeviceCategory;
    browser: string;
    os: string;
    language: string;
    screenResolution: string;
  };
  engagement: {
    totalSessions: number;
    totalPageViews: number;
    totalEngagedTimeSeconds: number;
    avgSessionDurationSeconds: number;
    lastActivity: string;
    toolsUsed: { tool: string; count: number }[];
    totalScansPerformed: number;
    engagementScore: number;
  };
  conversion: {
    registrationStatus: 'anonymous' | 'registered' | 'verified';
    pricingPageViews: number;
    checkoutAttempts: number;
    selectedPlan: string;
    subscriptionStatus: string;
    lifetimeRevenue: number;
    conversionStatus: 'visitor' | 'lead' | 'paid_customer' | 'churned';
  };
  timeline: JourneyEvent[];
  segments: CustomerSegment[];
  tags: CustomerTag[];
}

export interface OverviewMetricsSummary {
  uniqueVisitors: number;
  uniqueVisitorsDeltaPct: number;
  newVisitors: number;
  newVisitorsDeltaPct: number;
  returningVisitors: number;
  returningVisitorsDeltaPct: number;
  registeredUsers: number;
  registeredUsersDeltaPct: number;
  paidUsers: number;
  paidUsersDeltaPct: number;
  visitorToRegistrationRate: number;
  visitorToRegistrationRateDeltaPct: number;
  pricingPageVisitors: number;
  pricingPageVisitorsDeltaPct: number;
  checkoutStarts: number;
  checkoutStartsDeltaPct: number;
  checkoutAbandonmentRate: number;
  checkoutAbandonmentRateDeltaPct: number;
  paidConversions: number;
  paidConversionsDeltaPct: number;
  registrationToPaidRate: number;
  registrationToPaidRateDeltaPct: number;
  visitorToPaidRate: number;
  visitorToPaidRateDeltaPct: number;
  avgSessionDurationSeconds: number;
  avgSessionDurationDeltaPct: number;
  engagedSessions: number;
  engagedSessionsDeltaPct: number;
  totalToolUses: number;
  totalToolUsesDeltaPct: number;
  totalRevenue: number;
  totalRevenueDeltaPct: number;
  revenuePerVisitor: number;
  revenuePerVisitorDeltaPct: number;
}

export interface FunnelStageData {
  stageId: string;
  label: string;
  count: number;
  conversionRate: number; // Conversion from previous stage
  overallConversionRate: number; // Conversion from stage 1
  dropoffRate: number;
  deltaPct: number;
}

export interface PageAnalyticsItem {
  path: string;
  title: string;
  pageViews: number;
  uniqueVisitors: number;
  avgTimeSeconds: number;
  bounceRatePct: number;
  exitCount: number;
  exitRatePct: number;
  scrollDepthAvgPct: number;
  ctaClicks: number;
  conversionRatePct: number;
}

export interface NavigationPathItem {
  fromPath: string;
  toPath: string;
  frequency: number;
  conversionRatePct: number;
}

export interface ToolIntelligenceItem {
  toolId: string;
  name: string;
  icon: string;
  uniqueUsers: number;
  totalUses: number;
  successfulCompletions: number;
  failedOperations: number;
  anonymousUsers: number;
  registeredUsers: number;
  paidUsers: number;
  avgUsagePerUser: number;
  registrationConversionRate: number;
  paidConversionRate: number;
}

export interface AcquisitionReportItem {
  channel: TrafficChannel;
  label: string;
  visitors: number;
  registeredUsers: number;
  paidCustomers: number;
  registrationConversionRate: number;
  paidConversionRate: number;
  revenue: number;
  avgSessionDurationSeconds: number;
  pageViewsPerSession: number;
}

export interface GeographicIntelligenceItem {
  type: 'country' | 'region' | 'city';
  name: string;
  countryCode?: string;
  countryName?: string;
  visitors: number;
  registrations: number;
  paidUsers: number;
  conversionRatePct: number;
  totalToolUses: number;
  revenue: number;
}

export type IntentLevel = 'low' | 'medium' | 'high' | 'very_high';

export interface IntentFactor {
  name: string;
  points: number;
  reason: string;
}

export interface IntentScoreBreakdown {
  score: number;
  level: IntentLevel;
  maxScore: number;
  factors: IntentFactor[];
}

export interface AutomaticSegment {
  id: string;
  name: string;
  description: string;
  category: 'lifecycle' | 'monetization' | 'product_usage' | 'churn_risk';
  matchedCount: number;
  isSystem: boolean;
}

export interface AdvancedCustomerFilters {
  searchQuery?: string;
  visitorId?: string;
  email?: string;
  name?: string;
  company?: string;
  country?: string;
  region?: string;
  plan?: string;
  leadStatus?: string;
  authStatus?: 'all' | 'anonymous' | 'registered';
  monetizationStatus?: 'all' | 'free' | 'paid';
  trafficSource?: TrafficChannel | 'all';
  landingPage?: string;
  toolUsed?: string;
  device?: DeviceCategory | 'all';
  browser?: string;
  visitorType?: 'all' | 'new' | 'returning';
  conversionStatus?: string;
  intentLevel?: IntentLevel | 'all';
  minSessions?: number;
  firstSeenAfter?: string;
  lastSeenAfter?: string;
}

