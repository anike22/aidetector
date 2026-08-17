import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { upsertCommunicationPreferences } from '@/lib/automationApi';
import { useAuth } from '@/contexts/AuthContext';
import { useAutomation } from '@/contexts/AutomationContext';
import type { UserCommunicationPreferences } from '@/types/automation';
import { Bell, Save, AlertCircle, Loader2, RotateCcw } from 'lucide-react';

const DEFAULT_MAX_MESSAGES = 5;
const MAX_MESSAGES_MIN = 1;
const MAX_MESSAGES_MAX = 100;

function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

function getTimezones(): string[] {
  try {
    return (Intl as any).supportedValuesOf('timeZone') as string[];
  } catch {
    return [
      'UTC',
      'Africa/Lagos',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Toronto',
      'America/Sao_Paulo',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Moscow',
      'Asia/Dubai',
      'Asia/Kolkata',
      'Asia/Singapore',
      'Asia/Shanghai',
      'Asia/Tokyo',
      'Asia/Seoul',
      'Australia/Sydney',
      'Pacific/Auckland',
    ];
  }
}

function defaultPreferences(userId: string): UserCommunicationPreferences {
  return {
    user_id: userId,
    product_tips: true,
    feature_updates: true,
    security_notifications: true,
    billing_notifications: true,
    marketing_communications: true,
    weekly_summaries: true,
    email_enabled: true,
    in_app_enabled: true,
    dashboard_announcements_enabled: true,
    max_messages_per_day: DEFAULT_MAX_MESSAGES,
    timezone: getBrowserTimezone(),
    quiet_hours_start: null,
    quiet_hours_end: null,
    updated_at: new Date().toISOString(),
  };
}

interface PreferenceToggle {
  key: keyof UserCommunicationPreferences;
  label: string;
  description: string;
  mandatory?: boolean;
}

export default function CommunicationPreferencesPage() {
  const { user } = useAuth();
  const { preferences: loadedPrefs, loading, loadError, refresh } = useAutomation();
  const [prefs, setPrefs] = useState<UserCommunicationPreferences | null>(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [lastRequestId, setLastRequestId] = useState<string | null>(null);
  const timezones = useMemo(() => getTimezones(), []);

  const preferences: PreferenceToggle[] = useMemo(
    () => [
      { key: 'product_tips', label: 'Product tips', description: 'Receive tips on how to get more from AIDetector.cx.' },
      { key: 'feature_updates', label: 'Feature updates', description: 'Be the first to know about new features and improvements.' },
      { key: 'security_notifications', label: 'Security notifications', description: 'Alerts about account security and suspicious activity. Required for account safety.', mandatory: true },
      { key: 'billing_notifications', label: 'Billing notifications', description: 'Payment receipts, invoices, and renewal reminders. Required for billing.', mandatory: true },
      { key: 'marketing_communications', label: 'Marketing communications', description: 'Promotional offers, partner updates, and news.' },
      { key: 'weekly_summaries', label: 'Weekly summaries', description: 'A weekly digest of your activity and achievements.' },
      { key: 'email_enabled', label: 'Email', description: 'Allow email as a communication channel.' },
      { key: 'in_app_enabled', label: 'In-app notifications', description: 'Show notifications inside the application.' },
      { key: 'dashboard_announcements_enabled', label: 'Dashboard announcements', description: 'Display feature announcements on the dashboard.' },
    ],
    []
  );

  useEffect(() => {
    if (!loading) {
      setPrefs(loadedPrefs ?? (user ? defaultPreferences(user.id) : null));
    }
  }, [loadedPrefs, loading, user]);

  const update = (patch: Partial<UserCommunicationPreferences>) => {
    setPrefs((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const toggle = (key: keyof UserCommunicationPreferences) => {
    if (!prefs) return;
    update({ [key]: !prefs[key] } as Partial<UserCommunicationPreferences>);
  };

  const validate = (values: UserCommunicationPreferences): boolean => {
    const errors: Record<string, string> = {};
    const { max_messages_per_day, timezone, quiet_hours_start, quiet_hours_end } = values;

    if (typeof max_messages_per_day !== 'number' || Number.isNaN(max_messages_per_day)) {
      errors.max_messages_per_day = 'Maximum messages must be a number.';
    } else if (max_messages_per_day < MAX_MESSAGES_MIN || max_messages_per_day > MAX_MESSAGES_MAX) {
      errors.max_messages_per_day = `Maximum messages must be between ${MAX_MESSAGES_MIN} and ${MAX_MESSAGES_MAX}.`;
    }

    if (!timezone || !timezones.includes(timezone)) {
      errors.timezone = 'Please select a valid timezone.';
    }

    if (quiet_hours_start && quiet_hours_end) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(quiet_hours_start)) {
        errors.quiet_hours_start = 'Enter a valid time (HH:MM).';
      }
      if (!timeRegex.test(quiet_hours_end)) {
        errors.quiet_hours_end = 'Enter a valid time (HH:MM).';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleMaxMessagesChange = (value: string) => {
    const parsed = value === '' ? 0 : parseInt(value, 10);
    update({ max_messages_per_day: Number.isNaN(parsed) ? 0 : parsed });
  };

  const handleQuietHoursChange = (key: 'quiet_hours_start' | 'quiet_hours_end', value: string) => {
    update({ [key]: value || null });
  };

  const handleSave = async () => {
    if (!user || !prefs) return;
    if (!validate(prefs)) {
      toast.error('Please fix the validation errors before saving.');
      return;
    }
    const requestId = crypto.randomUUID();
    setLastRequestId(requestId);
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        product_tips: Boolean(prefs.product_tips),
        feature_updates: Boolean(prefs.feature_updates),
        security_notifications: true,
        billing_notifications: true,
        marketing_communications: Boolean(prefs.marketing_communications),
        weekly_summaries: Boolean(prefs.weekly_summaries),
        email_enabled: Boolean(prefs.email_enabled),
        in_app_enabled: Boolean(prefs.in_app_enabled),
        dashboard_announcements_enabled: Boolean(prefs.dashboard_announcements_enabled),
        max_messages_per_day: Number(prefs.max_messages_per_day),
        timezone: prefs.timezone || 'UTC',
        quiet_hours_start: prefs.quiet_hours_start || null,
        quiet_hours_end: prefs.quiet_hours_end || null,
        updated_at: new Date().toISOString(),
      };

      const saved = await upsertCommunicationPreferences(payload.user_id, {
        product_tips: payload.product_tips,
        feature_updates: payload.feature_updates,
        security_notifications: payload.security_notifications,
        billing_notifications: payload.billing_notifications,
        marketing_communications: payload.marketing_communications,
        weekly_summaries: payload.weekly_summaries,
        email_enabled: payload.email_enabled,
        in_app_enabled: payload.in_app_enabled,
        dashboard_announcements_enabled: payload.dashboard_announcements_enabled,
        max_messages_per_day: payload.max_messages_per_day,
        timezone: payload.timezone,
        quiet_hours_start: payload.quiet_hours_start,
        quiet_hours_end: payload.quiet_hours_end,
      });
      setPrefs(saved);
      await refresh();
      toast.success('Preferences saved');
    } catch (e: any) {
      console.error('[communication prefs] save error', {
        requestId,
        userId: user.id,
        errorCode: e?.code,
        message: e?.message,
        details: e?.details,
        hint: e?.hint,
      });
      toast.error('We could not save your preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout showFooter={false}>
      <div className="max-w-2xl mx-auto px-4 py-8 md:px-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Communication Preferences</h1>
            <p className="text-sm text-muted-foreground">Control how and when AIDetector.cx reaches out to you.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading preferences…
          </div>
        ) : loadError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Could not load preferences</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>{loadError}</p>
              <Button variant="outline" size="sm" onClick={refresh} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : !prefs ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Could not load preferences</AlertTitle>
            <AlertDescription>Your preferences could not be loaded. Please try again.</AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base font-medium">Channels & topics</CardTitle>
              <CardDescription>Toggle the messages you want to receive.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {preferences.map((p) => (
                <div key={String(p.key)} className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                    {p.mandatory && <p className="text-xs text-muted-foreground mt-1">This setting is required and cannot be disabled.</p>}
                  </div>
                  <Switch
                    checked={Boolean(prefs[p.key])}
                    onCheckedChange={() => toggle(p.key)}
                    disabled={p.mandatory}
                    aria-label={p.label}
                  />
                </div>
              ))}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="space-y-1">
                  <Label htmlFor="max-messages">Max messages per day</Label>
                  <Input
                    id="max-messages"
                    type="number"
                    min={MAX_MESSAGES_MIN}
                    max={MAX_MESSAGES_MAX}
                    value={prefs.max_messages_per_day}
                    onChange={(e) => handleMaxMessagesChange(e.target.value)}
                    aria-invalid={!!fieldErrors.max_messages_per_day}
                  />
                  {fieldErrors.max_messages_per_day && (
                    <p className="text-xs text-destructive">{fieldErrors.max_messages_per_day}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={prefs.timezone} onValueChange={(value) => update({ timezone: value })}>
                    <SelectTrigger id="timezone" aria-invalid={!!fieldErrors.timezone}>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.timezone && <p className="text-xs text-destructive">{fieldErrors.timezone}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="quiet-start">Quiet hours start</Label>
                  <Input
                    id="quiet-start"
                    type="time"
                    value={prefs.quiet_hours_start ?? ''}
                    onChange={(e) => handleQuietHoursChange('quiet_hours_start', e.target.value)}
                    aria-invalid={!!fieldErrors.quiet_hours_start}
                  />
                  {fieldErrors.quiet_hours_start && <p className="text-xs text-destructive">{fieldErrors.quiet_hours_start}</p>}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="quiet-end">Quiet hours end</Label>
                  <Input
                    id="quiet-end"
                    type="time"
                    value={prefs.quiet_hours_end ?? ''}
                    onChange={(e) => handleQuietHoursChange('quiet_hours_end', e.target.value)}
                    aria-invalid={!!fieldErrors.quiet_hours_end}
                  />
                  {fieldErrors.quiet_hours_end && <p className="text-xs text-destructive">{fieldErrors.quiet_hours_end}</p>}
                </div>
              </div>

              {lastRequestId && (
                <p className="text-xs text-muted-foreground">Last request ID: {lastRequestId}</p>
              )}

              <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {saving ? 'Saving…' : 'Save preferences'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
