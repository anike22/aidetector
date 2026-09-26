import { createServiceClient, corsHeaders } from '../_shared/automation.ts';

interface TimeEventRule {
  eventType: string;
  hoursBack: number;
  source: 'communication_preferences' | 'customer_profiles';
  filterSql?: string;
}

const RULES: TimeEventRule[] = [
  {
    eventType: 'weekly_digest',
    hoursBack: 24 * 7,
    source: 'communication_preferences',
    filterSql: 'weekly_summaries = true',
  },
  {
    eventType: 'days_inactive_7',
    hoursBack: 24,
    source: 'customer_profiles',
    filterSql: "COALESCE(last_login_at, signup_at) < now() - interval '7 days' AND COALESCE(last_login_at, signup_at) >= now() - interval '8 days'",
  },
  {
    eventType: 'days_inactive_30',
    hoursBack: 24,
    source: 'customer_profiles',
    filterSql: "COALESCE(last_login_at, signup_at) < now() - interval '30 days' AND COALESCE(last_login_at, signup_at) >= now() - interval '31 days'",
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createServiceClient();
    let generated = 0;

    for (const rule of RULES) {
      try {
        const since = new Date(Date.now() - rule.hoursBack * 60 * 60 * 1000).toISOString();

        const { data: recent, error: recentError } = await supabase
          .from('automation_events')
          .select('user_id')
          .eq('event_type', rule.eventType)
          .gte('created_at', since);
        if (recentError) throw recentError;

        const recentUserIds = new Set((recent ?? []).map((r: { user_id: string }) => r.user_id));

        let candidates: { user_id: string }[] = [];
        if (rule.source === 'communication_preferences') {
          const { data, error } = await supabase
            .from('communication_preferences')
            .select('user_id')
            .eq('weekly_summaries', true);
          if (error) throw error;
          candidates = (data ?? []) as { user_id: string }[];
        } else if (rule.source === 'customer_profiles') {
          const { data, error } = await supabase.rpc('run_sql', {
            query: `SELECT user_id FROM public.customer_profiles WHERE user_id IS NOT NULL AND ${rule.filterSql}`,
          });
          if (error) {
            // Fallback simple query if run_sql not available
            const { data: fallback, error: fallbackError } = await supabase
              .from('customer_profiles')
              .select('user_id')
              .not('user_id', 'is', null)
              .lt('last_login_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
            if (fallbackError) throw fallbackError;
            candidates = (fallback ?? []) as { user_id: string }[];
          } else {
            candidates = (data ?? []) as { user_id: string }[];
          }
        }

        const inserts = candidates
          .filter((c) => !recentUserIds.has(c.user_id))
          .map((c) => ({
            event_type: rule.eventType,
            user_id: c.user_id,
            event_data: { generated: true },
            processed: false,
          }));

        if (inserts.length) {
          const { error: insertError } = await supabase.from('automation_events').insert(inserts);
          if (insertError) throw insertError;
          generated += inserts.length;
        }
      } catch (e) {
        console.error(`Failed to generate ${rule.eventType}:`, e);
      }
    }

    return new Response(JSON.stringify({ success: true, generated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('automation-time-event-generator error:', message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
