import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { getOrganizationBilling, getOrganizationMembers } from '@/lib/teamApi';
import EmptyState from './EmptyState';
import { FileText, Wallet } from 'lucide-react';
import { getBillingContracts, createBillingContract, getCostCenters, createCostCenter, getDepartments } from '@/lib/enterpriseApi';
import type { OrganizationBilling as OB, OrganizationMember } from '@/types/team';
import type { BillingContract, CostCenter, Department } from '@/types/enterprise';

export default function OrganizationBillingTab({ organizationId }: { organizationId: string }) {
  const navigate = useNavigate();
  const [billing, setBilling] = useState<OB | null>(null);
  const [contracts, setContracts] = useState<BillingContract[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [active, setActive] = useState<'overview' | 'contracts' | 'cost_centers'>('overview');

  const load = async () => {
    const [b, c, cc, d, m] = await Promise.all([
      getOrganizationBilling(organizationId).catch(() => null),
      getBillingContracts(organizationId),
      getCostCenters(organizationId),
      getDepartments(organizationId),
      getOrganizationMembers(organizationId),
    ]);
    setBilling(b);
    setContracts(c);
    setCostCenters(cc);
    setDepartments(d);
    setMembers(m);
  };

  useEffect(() => { load(); }, [organizationId]);

  useEffect(() => {
    const channel = supabase
      .channel(`org-billing-${organizationId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'organization_billing', filter: `organization_id=eq.${organizationId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'billing_contracts', filter: `organization_id=eq.${organizationId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cost_centers', filter: `organization_id=eq.${organizationId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'organization_members', filter: `organization_id=eq.${organizationId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organizationId]);

  const [contractOpen, setContractOpen] = useState(false);
  const [costCenterOpen, setCostCenterOpen] = useState(false);
  const [ct, setCt] = useState<BillingContract['contract_type']>('seat_based');
  const [cycle, setCycle] = useState<BillingContract['billing_cycle']>('monthly');
  const [seats, setSeats] = useState('');
  const [price, setPrice] = useState('');
  const [po, setPo] = useState('');
  const [ccName, setCcName] = useState('');
  const [ccBudget, setCcBudget] = useState('');
  const [ccDept, setCcDept] = useState('');

  const saveContract = async () => {
    try {
      await createBillingContract(organizationId, {
        contract_type: ct,
        billing_cycle: cycle,
        seats_purchased: seats ? parseInt(seats) : undefined,
        price_per_seat: price ? parseFloat(price) : undefined,
        purchase_order_number: po || undefined,
      });
      toast.success('Contract created');
      setContractOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create contract');
    }
  };

  const saveCostCenter = async () => {
    try {
      await createCostCenter(organizationId, {
        name: ccName,
        budget: ccBudget ? parseFloat(ccBudget) : undefined,
        department_id: ccDept || undefined,
      });
      toast.success('Cost center created');
      setCostCenterOpen(false);
      setCcName('');
      setCcBudget('');
      setCcDept('');
      load();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create cost center');
    }
  };

  const usedSeats = members.length;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b pb-2">
        <Button variant={active === 'overview' ? 'default' : 'ghost'} onClick={() => setActive('overview')}>Overview</Button>
        <Button variant={active === 'contracts' ? 'default' : 'ghost'} onClick={() => setActive('contracts')}>Contracts</Button>
        <Button variant={active === 'cost_centers' ? 'default' : 'ghost'} onClick={() => setActive('cost_centers')}>Cost centers</Button>
      </div>

      {active === 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Billing overview</CardTitle>
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
                <p className="text-sm text-muted-foreground">Seats used</p>
                <p className="text-xl font-semibold">{usedSeats}</p>
              </div>
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Next billing date</p>
                <p className="text-xl font-semibold">{billing?.next_billing_date || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {active === 'contracts' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium">Contracts</CardTitle>
                <CardDescription>Seat-based, usage-based, or hybrid contracts.</CardDescription>
              </div>
              <Dialog open={contractOpen} onOpenChange={setContractOpen}>
                <DialogTrigger asChild><Button>Add contract</Button></DialogTrigger>
                <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                  <DialogHeader><DialogTitle>New contract</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2"><Label>Contract type</Label>
                      <Select value={ct} onValueChange={(v) => setCt(v as BillingContract['contract_type'])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="seat_based">Seat based</SelectItem>
                          <SelectItem value="usage_based">Usage based</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Billing cycle</Label>
                      <Select value={cycle} onValueChange={(v) => setCycle(v as BillingContract['billing_cycle'])}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="annual">Annual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Seats purchased</Label><Input value={seats} onChange={(e) => setSeats(e.target.value)} type="number" /></div>
                    <div className="space-y-2"><Label>Price per seat</Label><Input value={price} onChange={(e) => setPrice(e.target.value)} type="number" /></div>
                    <div className="space-y-2"><Label>Purchase order</Label><Input value={po} onChange={(e) => setPo(e.target.value)} /></div>
                    <Button onClick={saveContract}>Create contract</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead className="bg-muted"><tr><th className="px-4 py-2 text-left font-medium whitespace-nowrap">Type</th><th className="px-4 py-2 text-left font-medium whitespace-nowrap">Cycle</th><th className="px-4 py-2 text-left font-medium whitespace-nowrap">Seats</th><th className="px-4 py-2 text-left font-medium whitespace-nowrap">PO</th></tr></thead>
                <tbody>
                  {contracts.map((c) => <tr key={c.id} className="border-t"><td className="px-4 py-3 whitespace-nowrap capitalize">{c.contract_type.replace(/_/g, ' ')}</td><td className="px-4 py-3 whitespace-nowrap capitalize">{c.billing_cycle}</td><td className="px-4 py-3 whitespace-nowrap">{c.seats_purchased || '—'}</td><td className="px-4 py-3 whitespace-nowrap">{c.purchase_order_number || '—'}</td></tr>)}
                  {contracts.length === 0 && (
                    <tr><td colSpan={4}>
                      <EmptyState
                        icon={FileText}
                        title="No contracts yet"
                        description="Add a seat-based, usage-based, or hybrid contract for this organization."
                        actionLabel="Add contract"
                        onAction={() => setContractOpen(true)}
                      />
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {active === 'cost_centers' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium">Cost centers</CardTitle>
                <CardDescription>Track departmental budgets.</CardDescription>
              </div>
              <Dialog open={costCenterOpen} onOpenChange={setCostCenterOpen}>
                <DialogTrigger asChild><Button>Add cost center</Button></DialogTrigger>
                <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                  <DialogHeader><DialogTitle>New cost center</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2"><Label>Name</Label><Input value={ccName} onChange={(e) => setCcName(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Budget</Label><Input value={ccBudget} onChange={(e) => setCcBudget(e.target.value)} type="number" /></div>
                    <div className="space-y-2"><Label>Department</Label>
                      <Select value={ccDept || 'all'} onValueChange={(v) => setCcDept(v === 'all' ? '' : v)}>
                        <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">None</SelectItem>
                          {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={saveCostCenter}>Create cost center</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead className="bg-muted"><tr><th className="px-4 py-2 text-left font-medium whitespace-nowrap">Name</th><th className="px-4 py-2 text-left font-medium whitespace-nowrap">Department</th><th className="px-4 py-2 text-left font-medium whitespace-nowrap">Budget</th></tr></thead>
                <tbody>
                  {costCenters.map((cc) => <tr key={cc.id} className="border-t"><td className="px-4 py-3 whitespace-nowrap font-medium">{cc.name}</td><td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{cc.department?.name || '—'}</td><td className="px-4 py-3 whitespace-nowrap">{cc.budget != null ? `$${cc.budget.toLocaleString()}` : '—'}</td></tr>)}
                  {costCenters.length === 0 && (
                    <tr><td colSpan={3}>
                      <EmptyState
                        icon={Wallet}
                        title="No cost centers yet"
                        description="Create cost centers to track departmental budgets against contracts."
                        actionLabel="Add cost center"
                        onAction={() => setCostCenterOpen(true)}
                      />
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
