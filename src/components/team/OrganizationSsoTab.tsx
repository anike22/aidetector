import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { getOrganizationSso, upsertSsoConfig } from '@/lib/teamApi';
import type { SsoConfiguration, SsoProvider } from '@/types/team';

const PROVIDERS: SsoProvider[] = ['google_workspace', 'microsoft_entra_id', 'okta', 'onelogin', 'saml', 'oidc'];

export default function OrganizationSsoTab({ organizationId }: { organizationId: string }) {
  const [configs, setConfigs] = useState<SsoConfiguration[]>([]);
  const [provider, setProvider] = useState<SsoProvider>('google_workspace');
  const [domain, setDomain] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const data = await getOrganizationSso(organizationId);
    setConfigs(data);
  };

  useEffect(() => { load(); }, [organizationId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertSsoConfig({
        organization_id: organizationId,
        provider,
        domain: domain || undefined,
        enabled,
        settings: {},
      });
      toast.success('SSO configuration saved');
      setDomain('');
      setEnabled(false);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save SSO config');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Single sign-on</CardTitle>
        <CardDescription>Configure SSO providers for your organization.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          {configs.map((c) => (
            <div key={c.id} className="p-3 border rounded-lg flex items-center justify-between">
              <div>
                <p className="font-medium capitalize">{c.provider.replace(/_/g, ' ')}</p>
                <p className="text-xs text-muted-foreground">{c.domain || 'No domain'}</p>
              </div>
              <Switch checked={c.enabled} disabled />
            </div>
          ))}
          {configs.length === 0 && <p className="text-sm text-muted-foreground">No SSO providers configured.</p>}
        </div>

        <div className="border-t pt-4 space-y-4">
          <p className="text-sm font-medium">Add provider</p>
          <div>
            <Label>Provider</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as SsoProvider)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p.replace(/_/g, ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="sso-domain">Domain</Label>
            <Input id="sso-domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="sso-enabled" checked={enabled} onCheckedChange={setEnabled} />
            <Label htmlFor="sso-enabled">Enabled</Label>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save provider'}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
