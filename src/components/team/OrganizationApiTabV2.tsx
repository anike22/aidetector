import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { getOrganizationMembers } from '@/lib/teamApi';
import { getOrganizationApiKeys, createOrganizationApiKey, revokeOrganizationApiKey } from '@/lib/enterpriseApi';
import type { OrganizationApiKey, ApiKeyEnvironment } from '@/types/enterprise';
import type { OrganizationMember } from '@/types/team';
import { Key, KeyRound } from 'lucide-react';
import EmptyState from './EmptyState';

export default function OrganizationApiTab({ organizationId }: { organizationId: string }) {
  const [keys, setKeys] = useState<OrganizationApiKey[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [env, setEnv] = useState<ApiKeyEnvironment>('production');
  const [quota, setQuota] = useState('');
  const [owner, setOwner] = useState('');

  const load = async () => {
    const [k, m] = await Promise.all([getOrganizationApiKeys(organizationId), getOrganizationMembers(organizationId)]);
    setKeys(k);
    setMembers(m);
  };

  useEffect(() => { load(); }, [organizationId]);

  useEffect(() => {
    const channel = supabase
      .channel(`org-apikeys-${organizationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'api_keys', filter: `organization_id=eq.${organizationId}` },
        () => load()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organizationId]);

  const create = async () => {
    try {
      await createOrganizationApiKey(organizationId, { name, environment: env, quota: quota ? parseInt(quota) : undefined, owner_user_id: owner || undefined });
      toast.success('API key created');
      setOpen(false);
      setName('');
      setQuota('');
      setOwner('');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create API key');
    }
  };

  const revoke = async (id: string) => {
    try {
      await revokeOrganizationApiKey(id);
      toast.success('API key revoked');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Organization API keys</CardTitle>
            <CardDescription>Create, restrict, and rotate API keys for your organization.</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Key className="h-4 w-4 mr-2" />Create key</Button></DialogTrigger>
            <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
              <DialogHeader><DialogTitle>New API key</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Environment</Label>
                  <Select value={env} onValueChange={(v) => setEnv(v as ApiKeyEnvironment)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Monthly quota</Label><Input value={quota} onChange={(e) => setQuota(e.target.value)} type="number" /></div>
                <div className="space-y-2"><Label>Owner</Label>
                  <Select value={owner || 'all'} onValueChange={(v) => setOwner(v === 'all' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Unassigned</SelectItem>
                      {members.map((m) => <SelectItem key={m.user_id} value={m.user_id}>{m.user?.display_name || m.user?.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={create} disabled={!name.trim()}>Create key</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead className="bg-muted"><tr><th className="px-4 py-2 text-left font-medium whitespace-nowrap">Name</th><th className="px-4 py-2 text-left font-medium whitespace-nowrap">Environment</th><th className="px-4 py-2 text-left font-medium whitespace-nowrap">Quota</th><th className="px-4 py-2 text-left font-medium whitespace-nowrap">Owner</th><th className="px-4 py-2 text-left font-medium whitespace-nowrap">Status</th><th className="px-4 py-2 text-right font-medium whitespace-nowrap">Actions</th></tr></thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-t">
                  <td className="px-4 py-3 whitespace-nowrap font-medium">{k.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap capitalize">{k.environment}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{k.quota || 'Unlimited'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{k.owner?.display_name || k.owner?.email || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{!k.is_active || k.revoked_at ? <Badge variant="secondary">Revoked</Badge> : <Badge>Active</Badge>}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {(k.is_active && !k.revoked_at) && <Button variant="outline" size="sm" onClick={() => revoke(k.id)}>Revoke</Button>}
                  </td>
                </tr>
              ))}
              {keys.length === 0 && (
                <tr><td colSpan={6}>
                  <EmptyState
                    icon={KeyRound}
                    title="No API keys yet"
                    description="Create your first API key to authenticate organization-level integrations."
                    actionLabel="Create API key"
                    onAction={() => setOpen(true)}
                  />
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
