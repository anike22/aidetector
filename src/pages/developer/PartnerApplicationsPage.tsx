import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Handshake, Loader2 } from 'lucide-react';
import { createPartnerApplication, getPartnerApplications } from '@/lib/marketplaceApi';
import type { PartnerApplication } from '@/types/marketplace';

export default function PartnerApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgName, setOrgName] = useState('');
  const [website, setWebsite] = useState('');
  const [appType, setAppType] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!user) return;
    loadApplications();
  }, [user]);

  async function loadApplications() {
    setLoading(true);
    try {
      const data = await getPartnerApplications();
      setApplications(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!orgName || !appType) return;
    try {
      await createPartnerApplication({ organization_name: orgName, website, application_type: appType, description });
      toast.success('Partner application submitted.');
      setOrgName('');
      setWebsite('');
      setAppType('');
      setDescription('');
      await loadApplications();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit application.');
    }
  }

  return (
    <MainLayout>
      <div className="container max-w-5xl py-8 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Handshake className="h-8 w-8" />
            Partner Application
          </h1>
          <p className="text-muted-foreground">Apply to become a verified AIDetector.cx partner.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Apply</CardTitle>
              <CardDescription>Tell us about your organization and planned integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Organization name" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              <Input placeholder="Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
              <Input placeholder="Application type (e.g., Zapier integration, plugin, AI model)" value={appType} onChange={(e) => setAppType(e.target.value)} />
              <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
              <Button onClick={handleSubmit} disabled={!orgName || !appType}>Submit Application</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Applications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading && <Loader2 className="h-6 w-6 animate-spin" />}
              {applications.length === 0 && !loading && <p className="text-sm text-muted-foreground">No applications yet.</p>}
              {applications.map((app) => (
                <div key={app.id} className="p-3 border rounded-md">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{app.organization_name}</p>
                    <Badge variant={app.status === 'approved' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'}>{app.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{app.application_type}</p>
                  <p className="text-xs text-muted-foreground mt-1">{app.admin_notes || app.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
