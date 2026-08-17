export interface SystemNotificationInput {
  userId: string;
  organizationId?: string;
  type: string;
  content: string;
  resourceType?: string;
  resourceId?: string;
}

export async function getCommunicationPreferences(supabase: any, userId: string): Promise<Record<string, any> | null> {
  try {
    const { data, error } = await supabase
      .from('communication_preferences')
      .select('email_enabled, in_app_enabled, dashboard_announcements_enabled, max_messages_per_day, timezone, quiet_hours_start, quiet_hours_end')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      console.error('[notifications] preferences lookup error', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('[notifications] preferences lookup error', err);
    return null;
  }
}

export async function createSystemNotification(supabase: any, input: SystemNotificationInput): Promise<void> {
  try {
    const prefs = await getCommunicationPreferences(supabase, input.userId);
    if (prefs && prefs.in_app_enabled === false) {
      console.log('[notifications] skipped in-app notification for user', input.userId, 'preference disabled');
      return;
    }
    await supabase.from('notifications').insert({
      user_id: input.userId,
      organization_id: input.organizationId || null,
      type: input.type,
      content: input.content,
      resource_type: input.resourceType || null,
      resource_id: input.resourceId || null,
      is_read: false,
    });
  } catch (err) {
    console.error('[notifications] create notification error', err);
  }
}

export async function shouldSendEmail(
  supabase: any,
  userId: string | undefined,
  category: 'transactional' | 'security' | 'billing' | 'marketing' | 'notification' | 'invitation' = 'transactional'
): Promise<boolean> {
  if (!userId) return true;
  if (category === 'transactional' || category === 'security' || category === 'billing' || category === 'invitation') {
    return true;
  }
  const prefs = await getCommunicationPreferences(supabase, userId);
  if (!prefs) return true;
  if (prefs.email_enabled === false) {
    console.log('[notifications] skipped email for user', userId, 'preference disabled');
    return false;
  }
  return true;
}
