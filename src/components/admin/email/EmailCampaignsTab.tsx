import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/db/supabase';
import { Loader2, Send } from 'lucide-react';

export function EmailCampaignsTab() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setCampaigns(data);
        setLoading(false);
      });
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>Manage and track your email broadcasts</CardDescription>
        </div>
        <Button onClick={() => {
            const tabsList = document.querySelector('[role="tablist"]') as HTMLElement;
            const tab = tabsList?.querySelector(`[value="compose"]`) as HTMLElement;
            tab?.click();
        }}>
          <Send className="w-4 h-4 mr-2" /> New Campaign
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent / Scheduled Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">No campaigns found</TableCell></TableRow>
                ) : (
                  campaigns.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{c.type}</Badge></TableCell>
                      <TableCell>{c.recipients_count || 0}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === 'sent' ? 'default' : 'secondary'}>{c.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(c.sent_at || c.scheduled_at || c.created_at).toLocaleString()}
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
