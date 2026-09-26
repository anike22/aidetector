import { supabase } from '@/db/supabase';

export type LifecycleEvent =
  | 'user_registered'
  | 'email_verified'
  | 'verification_email_resent'
  | 'profile_completed'
  | 'first_scan'
  | 'first_humanize'
  | 'first_plagiarism'
  | 'extension_installed'
  | 'plugin_installed'
  | 'first_api_key'
  | 'report_saved'
  | 'upgrade_to_pro'
  | 'pricing_page_visit'
  | 'detector_use'
  | 'humanizer_use'
  | 'plagiarism_use'
  | 'api_request'
  | 'extension_use'
  | 'plugin_use'
  | 'login'
  | 'account_settings_visit';

export async function trackLifecycleEvent(
  event: LifecycleEvent,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const { data: profile } = await supabase
      .from('customer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile?.id) {
      await supabase.from('lead_events').insert({
        customer_profile_id: profile.id,
        event_type: event,
        event_category: 'lifecycle',
        event_data: metadata,
      });

      await supabase.rpc('record_journey_stage', {
        p_profile_id: profile.id,
        p_stage_key: event,
        p_completed: true,
      });
    }

    await supabase.from('automation_events').insert({
      event_type: event,
      user_id: user.id,
      customer_profile_id: profile?.id || null,
      event_data: metadata,
      processed: false,
    });

    await supabase.rpc('record_behavior_event', {
      p_user_id: user.id,
      p_event_type: event,
      p_event_category: 'lifecycle',
      p_event_data: metadata || {},
      p_session_id: null,
      p_device_info: {},
    });
  } catch (e) {
    console.error('Lifecycle event tracking failed:', e);
  }
}
