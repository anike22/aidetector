import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getOrganizationCompliance, updateComplianceRecord } from '@/lib/teamApi';
import type { ComplianceRecord, ComplianceStatus } from '@/types/team';

const STANDARDS = ['GDPR', 'CCPA', 'FERPA', 'SOC 2', 'ISO 27001'];

export default function OrganizationComplianceTab({ organizationId }: { organizationId: string }) {
  const [records, setRecords] = useState<ComplianceRecord[]>([]);

  const load = async () => {
    const data = await getOrganizationCompliance(organizationId);
    setRecords(data);
  };

  useEffect(() => { load(); }, [organizationId]);

  const setStatus = async (id: string, status: ComplianceStatus) => {
    try {
      await updateComplianceRecord(id, { status });
      load();
      toast.success('Compliance status updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Compliance center</CardTitle>
        <CardDescription>Track status for enterprise standards.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {STANDARDS.map((std) => {
          const rec = records.find((r) => r.compliance_type === std.toLowerCase().replace(' ', ''));
          const status = rec?.status || 'in_progress';
          return (
            <div key={std} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg">
              <div>
                <p className="font-medium">{std}</p>
                <p className="text-xs text-muted-foreground">Status: <Badge variant="outline" className="capitalize">{status}</Badge></p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant={status === 'compliant' ? 'default' : 'outline'} onClick={() => rec && setStatus(rec.id, 'compliant')}>Compliant</Button>
                <Button size="sm" variant={status === 'in_progress' ? 'default' : 'outline'} onClick={() => rec && setStatus(rec.id, 'in_progress')}>In progress</Button>
                <Button size="sm" variant={status === 'non_compliant' ? 'destructive' : 'outline'} onClick={() => rec && setStatus(rec.id, 'non_compliant')}>Non-compliant</Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
