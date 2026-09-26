import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getOrganization, updateOrganization } from '@/lib/teamApi';
import type { Organization, OrganizationType } from '@/types/team';

export default function OrganizationSettingsTab({ organizationId }: { organizationId: string }) {
  const [org, setOrg] = useState<Organization | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getOrganization(organizationId).then(setOrg).catch(() => {});
  }, [organizationId]);

  const handleSave = async () => {
    if (!org) return;
    setSaving(true);
    try {
      await updateOrganization(org.id, {
        name: org.name,
        type: org.type,
        domain: org.domain,
        logo_url: org.logo_url,
        industry: org.industry,
        country: org.country,
        timezone: org.timezone,
        language: org.language,
        max_members: org.max_members,
      });
      toast.success('Settings saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!org) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Organization settings</CardTitle>
        <CardDescription>Update organization details and preferences.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} />
        </div>
        <div>
          <Label>Workspace type</Label>
          <Select value={org.type} onValueChange={(v) => setOrg({ ...org, type: v as OrganizationType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
              <SelectItem value="school">School</SelectItem>
              <SelectItem value="university">University</SelectItem>
              <SelectItem value="agency">Agency</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="domain">Domain</Label>
          <Input id="domain" value={org.domain || ''} onChange={(e) => setOrg({ ...org, domain: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="logo">Logo URL</Label>
          <Input id="logo" value={org.logo_url || ''} onChange={(e) => setOrg({ ...org, logo_url: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input id="industry" value={org.industry || ''} onChange={(e) => setOrg({ ...org, industry: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input id="country" value={org.country || ''} onChange={(e) => setOrg({ ...org, country: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" value={org.timezone || 'UTC'} onChange={(e) => setOrg({ ...org, timezone: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="language">Default language</Label>
            <Input id="language" value={org.language || 'en'} onChange={(e) => setOrg({ ...org, language: e.target.value })} />
          </div>
        </div>
        <div>
          <Label htmlFor="max-members">Max members</Label>
          <Input id="max-members" type="number" value={org.max_members ?? ''} onChange={(e) => setOrg({ ...org, max_members: e.target.value ? parseInt(e.target.value) : undefined })} />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
