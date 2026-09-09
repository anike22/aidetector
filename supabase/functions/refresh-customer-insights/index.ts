import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SegmentRule {
  operator?: 'AND' | 'OR';
  field?: string;
  operator_value?: string;
  value?: unknown;
  tool?: string;
  page?: string;
  days?: number;
  conditions?: SegmentRule[];
}

interface CustomerSegment {
  id: string;
  rules_json: SegmentRule;
}

interface ProfileMetrics {
  id: string;
  user_id?: string;
  visitor_id?: string;
  email?: string;
  full_name?: string;
  username?: string;
  company?: string;
  role?: string;
  country?: string;
  language?: string;
  subscription_plan?: string;
  subscription_status?: string;
  account_status?: string;
  signup_at?: string;
  last_login_at?: string;
  engagement_score: number;
  page_views: number;
  session_count: number;
  cta_clicks: number;
  popup_conversions: number;
  api_requests: number;
  tools_used_count: number;
  gdpr_opt_out_tracking: boolean;
}

interface EventAgg {
  event_type: string;
  page?: string;
  tool?: string;
  cnt: number;
  last_at?: string;
}

interface TagRow {
  id: string;
  name: string;
  is_system: boolean;
}

interface InterestRow {
  id: string;
  interest: string;
  score: number;
}

const INTEREST_RULES: Record<string, (p: ProfileMetrics, evs: EventAgg[]) => number> = {
  'AI Detection': (p, evs) => toolCount(evs, 'detector') >= 10 ? Math.min(100, toolCount(evs, 'detector') * 5) : 0,
  'Humanization': (p, evs) => toolCount(evs, 'humanizer') >= 10 ? Math.min(100, toolCount(evs, 'humanizer') * 5) : 0,
  'Plagiarism': (p, evs) => toolCount(evs, 'plagiarism') >= 5 ? Math.min(100, toolCount(evs, 'plagiarism') * 8) : 0,
  'API': (p, evs) => toolCount(evs, 'api') >= 1 || p.api_requests > 0 ? Math.min(100, 30 + toolCount(evs, 'api') * 15) : 0,
  'Extension': (p, evs) => toolCount(evs, 'extension') >= 1 ? 80 : 0,
  'Plugin': (p, evs) => toolCount(evs, 'plugin') >= 1 ? 80 : 0,
  'Academic Writing': (p) => ['student', 'teacher', 'researcher'].includes((p.role || '').toLowerCase()) ? 80 : 0,
  'SEO': (p) => (p.role || '').toLowerCase() === 'seo_professional' ? 80 : 0,
  'Publishing': (p, evs) => (p.role || '').toLowerCase() === 'publisher' || totalToolUsage(evs) > 20 ? 60 : 0,
  'Marketing': (p) => (p.role || '').toLowerCase() === 'marketer' ? 70 : 0,
  'Enterprise': (p) => (p.company || '').length > 0 || (p.subscription_plan || '').toLowerCase() === 'enterprise' ? 70 : 0,
};

function toolCount(events: EventAgg[], tool: string) {
  return events.filter((e) => e.tool === tool).reduce((sum, e) => sum + e.cnt, 0);
}
function totalToolUsage(events: EventAgg[]) {
  return events.filter((e) => e.event_type === 'tool_used').reduce((sum, e) => sum + e.cnt, 0);
}
function visitedPage(events: EventAgg[], page: string) {
  return events.some((e) => e.event_type === 'page_view' && e.page === page);
}
function pageViewCount(events: EventAgg[], page: string) {
  return events.filter((e) => e.event_type === 'page_view' && e.page === page).reduce((s, e) => s + e.cnt, 0);
}
function daysSince(date?: string) {
  if (!date) return 9999;
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}
function coerceArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

function evaluateRule(profile: ProfileMetrics, events: EventAgg[], rule: SegmentRule): boolean {
  if (rule.conditions && rule.conditions.length > 0) {
    const results = rule.conditions.map((c) => evaluateRule(profile, events, c));
    return rule.operator === 'OR' ? results.some(Boolean) : results.every(Boolean);
  }

  const op = rule.operator_value || 'eq';
  const field = rule.field || '';
  const rawValue = rule.value;
  const values = coerceArray(rawValue);

  const pageViewsForField = (page: string) => pageViewCount(events, page);
  const toolUsageForField = (tool: string) => toolCount(events, tool);

  const getFieldValue = (): unknown => {
    switch (field) {
      case 'is_anonymous':
        return !profile.user_id;
      case 'subscription_plan':
        return profile.subscription_plan || 'free';
      case 'subscription_status':
        return profile.subscription_status || 'active';
      case 'role':
        return profile.role || 'user';
      case 'country':
        return profile.country;
      case 'language':
        return profile.language;
      case 'engagement_score':
        return profile.engagement_score;
      case 'page_views':
        return profile.page_views;
      case 'session_count':
        return profile.session_count;
      case 'cta_clicks':
        return profile.cta_clicks;
      case 'popup_conversions':
        return profile.popup_conversions;
      case 'api_requests':
        return profile.api_requests;
      case 'tools_used_count':
        return profile.tools_used_count;
      case 'days_since_login':
        return daysSince(profile.last_login_at);
      case 'days_since_signup':
        return daysSince(profile.signup_at);
      case 'visited_page':
        return pageViewsForField(String(rule.page || rawValue));
      case 'used_tool':
        return toolUsageForField(String(rule.tool || rawValue));
      case 'has_tag':
        return false; // evaluated separately
      default:
        return undefined;
    }
  };

  const actual = getFieldValue();

  switch (op) {
    case 'eq':
      return String(actual).toLowerCase() === String(values[0]).toLowerCase();
    case 'neq':
      return String(actual).toLowerCase() !== String(values[0]).toLowerCase();
    case 'gt':
      return Number(actual) > Number(values[0]);
    case 'gte':
      return Number(actual) >= Number(values[0]);
    case 'lt':
      return Number(actual) < Number(values[0]);
    case 'lte':
      return Number(actual) <= Number(values[0]);
    case 'in':
      return values.map((v) => String(v).toLowerCase()).includes(String(actual).toLowerCase());
    case 'contains':
      return String(actual).toLowerCase().includes(String(values[0]).toLowerCase());
    default:
      return false;
  }
}

function computeEngagementScore(profile: ProfileMetrics, events: EventAgg[]): number {
  const now = Date.now();
  const daysActive = new Set(events.map((e) => new Date(e.last_at || e.last_at || Date.now()).toDateString())).size;
  const score = Math.min(
    100,
    Math.max(
      0,
      daysActive * 3 +
        profile.page_views * 0.5 +
        totalToolUsage(events) * 2 +
        profile.cta_clicks * 1.5 +
        profile.popup_conversions * 3 +
        (profile.last_login_at ? 10 : 0)
    )
  );
  return Math.round(score);
}

function deriveLeadStatus(profile: ProfileMetrics, events: EventAgg[]): string {
  if (profile.subscription_status?.toLowerCase() === 'cancelled') return 'cancelled';
  if (['pro', 'business', 'enterprise'].includes(profile.subscription_plan?.toLowerCase() || '')) {
    return 'customer';
  }
  if (pageViewCount(events, '/pricing') >= 3 && totalToolUsage(events) >= 10) return 'sales_ready';
  if (totalToolUsage(events) >= 5 || pageViewCount(events, '/pricing') >= 1) return 'qualified';
  if (totalToolUsage(events) >= 1) return 'engaged';
  if (daysSince(profile.signup_at) <= 7) return 'new';
  return 'new';
}

async function processBatch(
  supabase: ReturnType<typeof createClient>,
  profiles: ProfileMetrics[],
  segments: CustomerSegment[],
  tags: TagRow[],
  interests: InterestRow[]
) {
  const profileIds = profiles.map((p) => p.id);

  const { data: eventRows } = await supabase
    .from('lead_events')
    .select('customer_profile_id, event_type, page, metadata, created_at')
    .in('customer_profile_id', profileIds)
    .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  const { data: membershipRows } = await supabase
    .from('customer_segment_memberships')
    .select('customer_profile_id, segment_id')
    .in('customer_profile_id', profileIds);

  const { data: tagAssignmentRows } = await supabase
    .from('customer_tag_assignments')
    .select('customer_profile_id, tag_id')
    .in('customer_profile_id', profileIds);

  const { data: interestRows } = await supabase
    .from('customer_interests')
    .select('customer_profile_id, interest, score')
    .in('customer_profile_id', profileIds);

  const eventsByProfile: Record<string, EventAgg[]> = {};
  (eventRows || []).forEach((row: Record<string, unknown>) => {
    const pid = String(row.customer_profile_id);
    if (!eventsByProfile[pid]) eventsByProfile[pid] = [];
    const metadata = (row.metadata as Record<string, unknown>) || {};
    const tool = String(metadata?.tool || metadata?.tool_name || row.event_type);
    const existing = eventsByProfile[pid].find(
      (e) => e.event_type === row.event_type && e.page === row.page && e.tool === tool
    );
    if (existing) {
      existing.cnt += 1;
      if (row.created_at && (!existing.last_at || new Date(String(row.created_at)) > new Date(existing.last_at))) {
        existing.last_at = String(row.created_at);
      }
    } else {
      eventsByProfile[pid].push({
        event_type: String(row.event_type),
        page: row.page ? String(row.page) : undefined,
        tool,
        cnt: 1,
        last_at: row.created_at ? String(row.created_at) : undefined,
      });
    }
  });

  const membershipsByProfile = new Map<string, Set<string>>();
  (membershipRows || []).forEach((m) => {
    const set = membershipsByProfile.get(String(m.customer_profile_id)) || new Set();
    set.add(String(m.segment_id));
    membershipsByProfile.set(String(m.customer_profile_id), set);
  });

  const tagsByProfile = new Map<string, Set<string>>();
  (tagAssignmentRows || []).forEach((t) => {
    const set = tagsByProfile.get(String(t.customer_profile_id)) || new Set();
    set.add(String(t.tag_id));
    tagsByProfile.set(String(t.customer_profile_id), set);
  });

  const interestsByProfile = new Map<string, Map<string, number>>();
  (interestRows || []).forEach((i) => {
    const map = interestsByProfile.get(String(i.customer_profile_id)) || new Map();
    map.set(String(i.interest), Number(i.score));
    interestsByProfile.set(String(i.customer_profile_id), map);
  });

  const tagNameToId = new Map(tags.map((t) => [t.name, t.id]));

  for (const profile of profiles) {
    if (profile.gdpr_opt_out_tracking) continue;
    const events = eventsByProfile[profile.id] || [];

    const score = computeEngagementScore(profile, events);
    const level = score >= 61 ? 'high' : score >= 31 ? 'medium' : 'low';
    const leadStatus = deriveLeadStatus(profile, events);

    await supabase
      .from('customer_profiles')
      .update({ engagement_score: score, engagement_level: level, lead_status: leadStatus, updated_at: new Date().toISOString() })
      .eq('id', profile.id);

    // Segments
    const currentSegments = membershipsByProfile.get(profile.id) || new Set();
    const desiredSegments = new Set<string>();
    for (const segment of segments) {
      if (evaluateRule(profile, events, segment.rules_json)) {
        desiredSegments.add(segment.id);
      }
    }
    const toAdd = Array.from(desiredSegments).filter((id) => !currentSegments.has(id));
    const toRemove = Array.from(currentSegments).filter((id) => !desiredSegments.has(id));

    if (toAdd.length) {
      await supabase.from('customer_segment_memberships').insert(
        toAdd.map((segment_id) => ({ customer_profile_id: profile.id, segment_id }))
      );
    }
    if (toRemove.length) {
      await supabase.from('customer_segment_memberships').delete().eq('customer_profile_id', profile.id).in('segment_id', toRemove);
    }

    // System tags
    const currentTags = tagsByProfile.get(profile.id) || new Set();
    const desiredTagIds = new Set<string>();
    const addIf = (name: string, cond: boolean) => {
      const id = tagNameToId.get(name);
      if (id && cond) desiredTagIds.add(id);
    };
    addIf('High Intent', pageViewCount(events, '/pricing') >= 3 && totalToolUsage(events) >= 10 && !['pro', 'business', 'enterprise'].includes(profile.subscription_plan || ''));
    addIf('Power User', score >= 60);
    addIf('Inactive', daysSince(profile.last_login_at) >= 30 && daysSince(profile.signup_at) < 365);
    addIf('Returning', profile.session_count >= 2);
    addIf('Churn Risk', ['pro', 'business', 'enterprise'].includes(profile.subscription_plan || '') && daysSince(profile.last_login_at) >= 14);
    addIf('Academic', ['student', 'teacher', 'researcher'].includes((profile.role || '').toLowerCase()));
    addIf('Developer', (profile.role || '').toLowerCase() === 'developer');
    addIf('SEO', (profile.role || '').toLowerCase() === 'seo_professional');
    addIf('Publisher', (profile.role || '').toLowerCase() === 'publisher');

    const tagAdd = Array.from(desiredTagIds).filter((id) => !currentTags.has(id));
    const tagRemove = Array.from(currentTags).filter((id) => !desiredTagIds.has(id));

    if (tagAdd.length) {
      await supabase.from('customer_tag_assignments').insert(
        tagAdd.map((tag_id) => ({ customer_profile_id: profile.id, tag_id, assigned_by: 'system' }))
      );
    }
    if (tagRemove.length) {
      await supabase.from('customer_tag_assignments').delete().eq('customer_profile_id', profile.id).in('tag_id', tagRemove);
    }

    // Interests
    const currentInterests = interestsByProfile.get(profile.id) || new Map();
    const interestUpserts: { customer_profile_id: string; interest: string; score: number }[] = [];
    for (const [interest, scorer] of Object.entries(INTEREST_RULES)) {
      const newScore = scorer(profile, events);
      const existing = currentInterests.get(interest);
      if (newScore > 0 && (existing === undefined || existing !== newScore)) {
        interestUpserts.push({ customer_profile_id: profile.id, interest, score: newScore });
      }
    }
    if (interestUpserts.length) {
      await supabase.from('customer_interests').upsert(interestUpserts, { onConflict: 'customer_profile_id,interest' });
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing Supabase env vars');

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let body: { segmentId?: string; profileId?: string } = {};
    try {
      body = (await req.json()) || {};
    } catch {
      body = {};
    }

    const { data: segmentsData } = await supabase
      .from('customer_segments')
      .select('id, rules_json')
      .eq('is_dynamic', true)
      .order('created_at', { ascending: true });
    const segments: CustomerSegment[] = Array.isArray(segmentsData)
      ? segmentsData.map((s: Record<string, unknown>) => ({ id: String(s.id), rules_json: s.rules_json as SegmentRule }))
      : [];

    const { data: tagsData } = await supabase.from('customer_tags').select('id, name, is_system');
    const tags: TagRow[] = Array.isArray(tagsData)
      ? tagsData.map((t: Record<string, unknown>) => ({ id: String(t.id), name: String(t.name), is_system: Boolean(t.is_system) }))
      : [];

    const { data: interestsData } = await supabase.from('customer_interests').select('id, interest, score');
    const interests: InterestRow[] = Array.isArray(interestsData)
      ? interestsData.map((i: Record<string, unknown>) => ({ id: String(i.id), interest: String(i.interest), score: Number(i.score) }))
      : [];

    const batchSize = 100;
    let processed = 0;
    let from = 0;
    let query = supabase
      .from('customer_profiles')
      .select('*')
      .eq('is_anonymized', false)
      .order('created_at', { ascending: true });

    if (body.profileId) {
      query = query.eq('id', body.profileId);
    }

    while (true) {
      const { data: profiles, error } = await query.range(from, from + batchSize - 1);
      if (error) throw error;
      if (!profiles || profiles.length === 0) break;

      await processBatch(supabase, profiles as ProfileMetrics[], segments, tags, interests);
      processed += profiles.length;
      from += batchSize;

      if (body.profileId || profiles.length < batchSize) break;
    }

    // Phase 3 lifecycle automation: update stages, activation/health/upgrade scores
    try {
      await supabase.rpc('refresh_lifecycle_metrics');
    } catch (lifecycleErr) {
      console.error('refresh_lifecycle_metrics failed:', lifecycleErr);
    }

    return new Response(JSON.stringify({ success: true, processed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
