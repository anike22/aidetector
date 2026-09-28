import { GeographicIntelligenceItem } from '@/types/customerIntelligence';
import { CustomerProfile, LeadEvent } from '@/types/cdp';

export interface ResolvedLocation {
  country: string;
  region: string;
  city: string;
  timezone: string;
  ipMasked: string;
}

const COUNTRY_CODES: Record<string, string> = {
  'United States': 'US', 'United Kingdom': 'GB', Canada: 'CA', Germany: 'DE',
  Australia: 'AU', France: 'FR', Japan: 'JP', India: 'IN',
  'United Arab Emirates': 'AE', Nigeria: 'NG',
};

/**
 * Return only location values actually stored on the customer profile.
 * Region, city and IP are not currently persisted by the CustomerProfile schema,
 * so they must remain Unknown rather than being inferred from timezone or visitor ID.
 */
export function resolveLocationFromProfile(p: Partial<CustomerProfile>): ResolvedLocation {
  const country = p.country?.trim();
  const timezone = p.timezone?.trim();
  return {
    country: country && country !== 'Global' ? country : 'Unknown',
    region: 'Unknown',
    city: 'Unknown',
    timezone: timezone || 'Unknown',
    ipMasked: 'Unavailable',
  };
}

/**
 * Geographic intelligence computed only from persisted production telemetry.
 * No synthetic country shares, regions, cities, conversion rates or revenue are generated.
 */
export function computeGeographicIntelligence(profiles: CustomerProfile[] = [], events: LeadEvent[] = []): {
  countries: GeographicIntelligenceItem[];
  regions: GeographicIntelligenceItem[];
  cities: GeographicIntelligenceItem[];
} {
  const countryMap = new Map<string, { visitors: number; registered: number; paid: number; toolUses: number; revenue: number }>();

  const verifiedCountryByVisitor = new Map<string, string>();
  events.forEach((event) => {
    if (event.event_type !== 'geo_verified' || !event.visitor_id) return;
    const metadata = (event.metadata || {}) as Record<string, unknown>;
    const country = typeof metadata.country === 'string' ? metadata.country.trim() : '';
    const source = metadata.source;
    if (country && source === 'supabase_gateway_cf_ipcountry' && !verifiedCountryByVisitor.has(event.visitor_id)) {
      verifiedCountryByVisitor.set(event.visitor_id, country);
    }
  });

  profiles.forEach((p) => {
    // Do not trust the legacy profile.country column by itself. Only aggregate
    // profiles with a server-generated verification event.
    const country = p.visitor_id ? verifiedCountryByVisitor.get(p.visitor_id) : undefined;
    if (!country) return;

    const item = countryMap.get(country) || { visitors: 0, registered: 0, paid: 0, toolUses: 0, revenue: 0 };
    item.visitors += 1;
    if (p.user_id || p.email) item.registered += 1;
    if (p.subscription_plan && p.subscription_plan.toLowerCase() !== 'free' && p.subscription_status?.toLowerCase() === 'active') {
      item.paid += 1;
      item.revenue += Number(p.total_spend || 0);
    }
    item.toolUses += p.tools_used_count || 0;
    countryMap.set(country, item);
  });

  const countries: GeographicIntelligenceItem[] = Array.from(countryMap.entries())
    .map(([name, data]) => ({
      type: 'country' as const,
      name,
      countryCode: COUNTRY_CODES[name] || undefined,
      visitors: data.visitors,
      registrations: data.registered,
      paidUsers: data.paid,
      conversionRatePct: data.visitors > 0 ? Number(((data.paid / data.visitors) * 100).toFixed(2)) : 0,
      totalToolUses: data.toolUses,
      revenue: Number(data.revenue.toFixed(2)),
    }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 10);

  // CustomerProfile currently has no persisted region/city fields.
  // Keep these datasets empty until server-side geo capture supplies authoritative values.
  return { countries, regions: [], cities: [] };
}
