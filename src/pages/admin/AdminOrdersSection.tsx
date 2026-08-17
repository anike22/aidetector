import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/db/supabase';

interface ServiceOrder {
  id: string;
  client_id: string;
  expert_id: string;
  service_type: string;
  package: string;
  amount: number;
  status: string;
  payment_status: string;
  created_at: string;
}

export function AdminOrdersSection() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('service_orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setOrders(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Service Orders</h2>
          <p className="text-muted-foreground text-sm">Manage client service orders and expert fulfillment.</p>
        </div>
        <Button onClick={() => load()} variant="outline" size="icon">
          <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <Card className="border-border">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium">Order ID</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Package</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No service orders found.
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs">{order.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-medium">{order.service_type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{order.package}</td>
                    <td className="px-4 py-3 font-semibold">${order.amount}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={order.status === 'Completed' ? 'default' : order.status === 'In Progress' ? 'secondary' : 'outline'}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={order.payment_status === 'Paid' ? 'default' : 'outline'} className={order.payment_status === 'Paid' ? 'bg-success/10 text-success border-success/20' : ''}>
                        {order.payment_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" className="h-8" onClick={() => {}}>
                        View <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}