import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Webhook } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function EmailInboxTab() {
  const webhookUrl = "https://hzjnrmxwzkeaodvusszx.supabase.co/functions/v1/resend-inbound";

  return (
    <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Inbound Emails</CardTitle>
            <CardDescription>Configure Resend Webhooks to receive replies directly in the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Setup Instructions</AlertTitle>
              <AlertDescription className="space-y-4 mt-2">
                <p>To receive user replies to your emails, you need to configure an inbound webhook in Resend.</p>
                <ol className="list-decimal list-inside space-y-2">
                    <li>Log in to your <strong>Resend dashboard</strong>.</li>
                    <li>Navigate to the <strong>Domains</strong> section and click on your verified sending domain.</li>
                    <li>Go to the <strong>Inbound</strong> tab.</li>
                    <li>Add an inbound email domain (example: <code>replies.yourdomain.com</code>).</li>
                    <li>Add the MX records provided by Resend to your DNS provider.</li>
                    <li>Navigate to <strong>Webhooks</strong> in Resend and add a new webhook.</li>
                    <li>Select the <strong>email.received</strong> event.</li>
                    <li>Paste the Webhook URL below into the Resend Endpoint URL field.</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Webhook URL for Resend</Label>
              <div className="flex gap-2">
                  <Input readOnly value={webhookUrl} />
                  <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success("Copied"); }}>Copy</Button>
              </div>
            </div>

            <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Once configured, inbound messages will appear in a table here.</p>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
