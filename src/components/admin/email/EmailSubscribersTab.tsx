import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/db/supabase';
import { Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function EmailSubscribersTab() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    supabase
      .from('user_email_preferences')
      .select('user_id, marketing_enabled, updated_at, profiles!inner(email, full_name, subscription_plan)')
      .then(({ data }) => {
        if (data) {
          const formatted = data.map(d => ({
            id: d.user_id,
            email: (d.profiles as any)?.email || (d.profiles as any)?.[0]?.email,
            name: (d.profiles as any)?.full_name || (d.profiles as any)?.[0]?.full_name,
            plan: (d.profiles as any)?.subscription_plan || (d.profiles as any)?.[0]?.subscription_plan,
            status: d.marketing_enabled ? 'Active' : 'Unsubscribed',
            date: d.updated_at
          }));
          setSubscribers(formatted);
        }
        setLoading(false);
      });
  }, []);

  const filtered = subscribers.filter(s => 
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Subscribers</CardTitle>
          <CardDescription>Manage your email marketing audience</CardDescription>
        </div>
        <div className="flex gap-2">
           <Input 
             placeholder="Search subscribers..." 
             className="w-64" 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
           <Button variant="outline" type="button" onClick={() => {}}><Download className="w-4 h-4 mr-2" /> Export</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">No subscribers found</TableCell></TableRow>
                ) : (
                  filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.email}</TableCell>
                      <TableCell>{s.name || '-'}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{s.plan || 'Free'}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={s.status === 'Active' ? 'default' : 'secondary'}>{s.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(s.date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
