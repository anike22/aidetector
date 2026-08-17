import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getRolePermissions } from '@/lib/enterpriseApi';
import type { RolePermissions, PermissionCategory, PermissionLevel } from '@/types/enterprise';

const PERMISSIONS: PermissionCategory[] = [
  'user_management', 'workspace_settings', 'billing', 'ai_tools', 'reports', 'api', 'security', 'audit_logs', 'integrations', 'automation', 'analytics', 'content',
];

const LEVEL_COLORS: Record<PermissionLevel, string> = {
  none: 'bg-muted text-muted-foreground',
  view: 'bg-secondary text-secondary-foreground',
  edit: 'bg-primary/20 text-primary',
  full: 'bg-primary text-primary-foreground',
};

export default function OrganizationRolesTab() {
  const [roles, setRoles] = useState<RolePermissions[]>([]);

  useEffect(() => {
    getRolePermissions().then(setRoles);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Roles & permissions</CardTitle>
        <CardDescription>Default organization roles and their permission levels.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left font-medium whitespace-nowrap">Role</th>
                {PERMISSIONS.map((p) => <th key={p} className="px-4 py-2 text-center font-medium whitespace-nowrap capitalize">{p.replace(/_/g, ' ')}</th>)}
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3 whitespace-nowrap font-medium capitalize">
                    {r.role_name.replace(/_/g, ' ')}
                    {r.is_default && <Badge variant="outline" className="ml-2 text-xs">Default</Badge>}
                  </td>
                  {PERMISSIONS.map((p) => {
                    const level = r.permissions[p] as PermissionLevel || 'none';
                    return (
                      <td key={p} className="px-4 py-3 text-center whitespace-nowrap">
                        <Badge className={`capitalize ${LEVEL_COLORS[level]}`}>{level}</Badge>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
