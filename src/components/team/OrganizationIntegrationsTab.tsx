import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { getIntegrations, upsertIntegration } from '@/lib/enterpriseApi';
import type { IntegrationConfig, IntegrationProvider } from '@/types/enterprise';
import { Cloud, MessageSquare, FileText, BookOpen, GraduationCap } from 'lucide-react';

const PROVIDERS: { key: IntegrationProvider; label: string; icon: React.ElementType }[] = [
  { key: 'microsoft_365', label: 'Microsoft 365', icon: Cloud },
  { key: 'google_workspace', label: 'Google Workspace', icon: Cloud },
  { key: 'slack', label: 'Slack', icon: MessageSquare },
  { key: 'teams', label: 'Microsoft Teams', icon: MessageSquare },
  { key: 'discord', label: 'Discord', icon: MessageSquare },
  { key: 'notion', label: 'Notion', icon: FileText },
  { key: 'jira', label: 'Jira', icon: FileText },
  { key: 'confluence', label: 'Confluence', icon: FileText },
  { key: 'canvas', label: 'Canvas LMS', icon: GraduationCap },
  { key: 'moodle', label: 'Moodle', icon: GraduationCap },
  { key: 'blackboard', label: 'Blackboard', icon: BookOpen },
];

export default function OrganizationIntegrationsTab({ organizationId }: { organizationId: string }) {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);

  const load = async () => {
    const data = await getIntegrations(organizationId);
    setIntegrations(data);
  };

  useEffect(() => { load(); }, [organizationId]);

  const toggle = async (provider: IntegrationProvider) => {
    try {
      const existing = integrations.find((i) => i.provider === provider);
      await upsertIntegration({
        organization_id: organizationId,
        provider,
        enabled: !existing?.enabled,
        settings: existing?.settings || {},
        id: existing?.id,
      });
      toast.success('Integration updated');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update integration');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Integrations</CardTitle>
        <CardDescription>Enable enterprise tool integrations. Connectors can be configured later.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {PROVIDERS.map((p) => {
            const integration = integrations.find((i) => i.provider === p.key);
            const Icon = p.icon;
            return (
              <div key={p.key} className="flex items-center justify-between border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{p.label}</div>
                    <div className="text-xs text-muted-foreground">{integration?.enabled ? 'Enabled' : 'Disabled'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor={p.key} className="sr-only">{p.label}</Label>
                  <Switch id={p.key} checked={!!integration?.enabled} onCheckedChange={() => toggle(p.key)} />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
