import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getOrganizationBilling } from '@/lib/teamApi';
import type { OrganizationBilling as OB } from '@/types/team';

export default function OrganizationBillingTab({ organizationId }: { organizationId: string }) {
  const navigate = useNavigate();
  const [billing, setBilling] = useState<OB | null>(null);

  useEffect(() => {
    getOrganizationBilling(organizationId).then(setBilling).catch(() => {});
  }, [organizationId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Billing</CardTitle>
        <CardDescription>Plan, seats, and payment status.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium capitalize">{billing?.plan || 'team'} plan</p>
            <p className="text-sm text-muted-foreground">Status: <Badge variant="outline" className="capitalize">{billing?.status || 'active'}</Badge></p>
          </div>
          <Button variant="outline" onClick={() => navigate('/pricing')}>Upgrade plan</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Next billing date</p>
            <p className="text-xl font-semibold">{billing?.next_billing_date || '—'}</p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Payment status</p>
            <p className="text-xl font-semibold capitalize">{billing?.status || 'active'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
