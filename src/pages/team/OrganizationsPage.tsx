import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { useTeam } from '@/contexts/TeamContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Users, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { createOrganization } from '@/lib/teamApi';
import type { OrganizationPlan, OrganizationType } from '@/types/team';

export default function OrganizationsPage() {
  const { user } = useAuth();
  const { organizations, refreshTeams } = useTeam();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<OrganizationType>('business');
  const [plan, setPlan] = useState<OrganizationPlan>('team');
  const [domain, setDomain] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [language, setLanguage] = useState('en');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) refreshTeams();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await createOrganization({
        name: name.trim(),
        type,
        plan,
        domain: domain || undefined,
        industry: industry || undefined,
        country: country || undefined,
        timezone,
        language,
      });
      toast.success('Organization created');
      setName('');
      setDomain('');
      setIndustry('');
      setCountry('');
      setTimezone('UTC');
      setLanguage('en');
      setOpen(false);
      refreshTeams();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create organization');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Organizations</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your organizations, teams, and workspaces.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Create organization</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
              <DialogHeader><DialogTitle>Create organization</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="org-name">Organization name</Label>
                  <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme University" />
                </div>
                <div>
                  <Label>Workspace type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as OrganizationType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="school">School</SelectItem>
                      <SelectItem value="university">University</SelectItem>
                      <SelectItem value="agency">Agency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Plan</Label>
                  <Select value={plan} onValueChange={(v) => setPlan(v as OrganizationPlan)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="team">Team</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="org-domain">Domain</Label>
                  <Input id="org-domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="example.com" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label htmlFor="org-industry">Industry</Label><Input id="org-industry" value={industry} onChange={(e) => setIndustry(e.target.value)} /></div>
                  <div><Label htmlFor="org-country">Country</Label><Input id="org-country" value={country} onChange={(e) => setCountry(e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label htmlFor="org-timezone">Time zone</Label><Input id="org-timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} /></div>
                  <div><Label htmlFor="org-language">Default language</Label><Input id="org-language" value={language} onChange={(e) => setLanguage(e.target.value)} /></div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {organizations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No organizations yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Create your first organization to start collaborating.</p>
              <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Create organization</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.map((org) => (
              <Link to={`/organizations/${org.id}`} key={org.id}>
                <Card className="h-full hover:border-primary transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium truncate">{org.name}</CardTitle>
                      <Badge variant="secondary" className="capitalize">{org.plan}</Badge>
                    </div>
                    <CardDescription className="truncate">{org.slug}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Members</span>
                      <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> Workspaces</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
