import React, { useEffect, useState } from 'react';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { RefreshCw, Save, Plus, Trash2, Search, Filter } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface FeatureFlag {
  id: string;
  feature_name: string;
  feature_slug: string;
  status: string;
  public_message: string | null;
  requires_login: boolean;
  show_in_navigation: boolean;
  is_enabled: boolean;
  show_on_homepage: boolean;
  show_in_footer: boolean;
  allow_direct_access: boolean;
  is_indexable: boolean;
  updated_at: string;
}

interface FeatureRequest {
  id: string;
  feature_slug: string;
  user_name: string;
  user_email: string;
  created_at: string;
}

export default function FeatureControlsPage() {
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newFeature, setNewFeature] = useState({
    feature_name: '',
    feature_slug: '',
    status: 'coming_soon',
    public_message: 'This feature is coming soon. Request early access.',
    requires_login: false,
    show_in_navigation: true,
    is_enabled: true,
    show_on_homepage: true,
    show_in_footer: true,
    allow_direct_access: true,
    is_indexable: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [featuresRes, requestsRes] = await Promise.all([
        supabase.from('feature_flags').select('*').order('feature_name'),
        supabase.from('feature_requests').select('*').order('created_at', { ascending: false }).limit(50)
      ]);

      if (featuresRes.error) throw featuresRes.error;
      if (requestsRes.error) throw requestsRes.error;

      setFeatures(featuresRes.data || []);
      setRequests(requestsRes.data || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load features: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, field: keyof FeatureFlag, value: any) => {
    setSaving(id);
    try {
      const originalFeature = features.find(f => f.id === id);

      const { error } = await supabase
        .from('feature_flags')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      // Admin audit log
      if (originalFeature) {
        const { data: { session } } = await supabase.auth.getSession();
        await supabase.from('admin_audit_logs').insert({
          admin_id: session?.user?.id,
          action: `updated_feature_${field}`,
          feature_changed: originalFeature.feature_slug,
          old_value: { [field]: originalFeature[field] },
          new_value: { [field]: value }
        });
      }

      setFeatures(features.map(f => f.id === id ? { ...f, [field]: value } : f));
      toast.success('Updated successfully');
    } catch (err: any) {
      toast.error('Failed to update: ' + err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feature flag?')) return;
    
    try {
      const { error } = await supabase.from('feature_flags').delete().eq('id', id);
      if (error) throw error;
      setFeatures(features.filter(f => f.id !== id));
      toast.success('Feature deleted');
    } catch (err: any) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  const handleAddFeature = async () => {
    if (!newFeature.feature_name || !newFeature.feature_slug) {
      toast.error('Name and slug are required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .insert([newFeature])
        .select()
        .single();

      if (error) throw error;

      setFeatures([...features, data]);
      setIsAddOpen(false);
      setNewFeature({
        feature_name: '',
        feature_slug: '',
        status: 'coming_soon',
        public_message: 'This feature is coming soon. Request early access.',
        requires_login: false,
        show_in_navigation: true,
        is_enabled: true,
        show_on_homepage: true,
        show_in_footer: true,
        allow_direct_access: true,
        is_indexable: true
      });
      toast.success('Feature added successfully');
    } catch (err: any) {
      toast.error('Failed to add feature: ' + err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'coming_soon': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'maintenance': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'hidden': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Feature Controls</h2>
          <p className="text-muted-foreground">Manage which tools are live, hidden, or coming soon.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={async () => {
            try {
              const res = await fetch('https://rsvvryebpabjpxhsqmch.supabase.co/functions/v1/run-humanizer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
                body: JSON.stringify({ action: 'test-connection' })
              });
              if (!res.ok) throw new Error(await res.text());
              toast.success('Gemini API Connection OK!');
            } catch (err: any) {
              toast.error('Gemini API Connection Failed: ' + err.message);
            }
          }} variant="outline" size="sm" className="border-primary/20 text-primary bg-primary/10">
            <RefreshCw className="w-4 h-4 mr-2" /> Test Gemini Connection
          </Button>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" /> Add Feature
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Feature</DialogTitle>
                <DialogDescription>Define a new feature flag for routing and navigation.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Feature Name</Label>
                  <Input 
                    value={newFeature.feature_name} 
                    onChange={e => setNewFeature({...newFeature, feature_name: e.target.value})}
                    placeholder="e.g., Backlink Checker"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Feature Slug (must match route path)</Label>
                  <Input 
                    value={newFeature.feature_slug} 
                    onChange={e => setNewFeature({...newFeature, feature_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                    placeholder="e.g., backlink-checker"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={newFeature.status} onValueChange={v => setNewFeature({...newFeature, status: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active (Live)</SelectItem>
                      <SelectItem value="coming_soon">Coming Soon</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Public Message (for non-active status)</Label>
                  <Input 
                    value={newFeature.public_message} 
                    onChange={e => setNewFeature({...newFeature, public_message: e.target.value})}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="new-nav" 
                    checked={newFeature.show_in_navigation} 
                    onCheckedChange={c => setNewFeature({...newFeature, show_in_navigation: c})} 
                  />
                  <Label htmlFor="new-nav">Show in Navigation</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="new-login" 
                    checked={newFeature.requires_login} 
                    onCheckedChange={c => setNewFeature({...newFeature, requires_login: c})} 
                  />
                  <Label htmlFor="new-login">Requires Login</Label>
                </div>
                <Button className="w-full mt-4" onClick={handleAddFeature}>Save Feature</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>All Features</CardTitle>
            <CardDescription>Changes apply immediately to frontend navigation and routing.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full max-w-full overflow-x-auto bg-card">
              <Table className="[&>div]:max-w-full min-w-max">
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Feature</TableHead>
                    <TableHead className="whitespace-nowrap">Slug</TableHead>
                    <TableHead className="whitespace-nowrap">Status</TableHead>
                    <TableHead className="whitespace-nowrap">Enabled</TableHead>
                    <TableHead className="whitespace-nowrap">Nav</TableHead>
                    <TableHead className="whitespace-nowrap">Home</TableHead>
                    <TableHead className="whitespace-nowrap">Footer</TableHead>
                    <TableHead className="whitespace-nowrap">Access</TableHead>
                    <TableHead className="whitespace-nowrap">Login</TableHead>
                    <TableHead className="whitespace-nowrap">Index</TableHead>
                    <TableHead className="whitespace-nowrap">Message</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {features.map((feature) => (
                    <TableRow key={feature.id}>
                      <TableCell className="font-medium whitespace-nowrap">{feature.feature_name}</TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{feature.feature_slug}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Select 
                          value={feature.status} 
                          onValueChange={(val) => handleUpdate(feature.id, 'status', val)}
                          disabled={saving === feature.id}
                        >
                          <SelectTrigger className={`w-36 h-8 text-xs ${getStatusColor(feature.status)} border-none shadow-none font-semibold`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="coming_soon">Coming Soon</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="hidden">Hidden</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Switch 
                          checked={feature.is_enabled} 
                          onCheckedChange={(val) => handleUpdate(feature.id, 'is_enabled', val)}
                          disabled={saving === feature.id}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Switch 
                          checked={feature.show_in_navigation} 
                          onCheckedChange={(val) => handleUpdate(feature.id, 'show_in_navigation', val)}
                          disabled={saving === feature.id}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Switch 
                          checked={feature.show_on_homepage} 
                          onCheckedChange={(val) => handleUpdate(feature.id, 'show_on_homepage', val)}
                          disabled={saving === feature.id}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Switch 
                          checked={feature.show_in_footer} 
                          onCheckedChange={(val) => handleUpdate(feature.id, 'show_in_footer', val)}
                          disabled={saving === feature.id}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Switch 
                          checked={feature.allow_direct_access} 
                          onCheckedChange={(val) => handleUpdate(feature.id, 'allow_direct_access', val)}
                          disabled={saving === feature.id}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Switch 
                          checked={feature.requires_login} 
                          onCheckedChange={(val) => handleUpdate(feature.id, 'requires_login', val)}
                          disabled={saving === feature.id}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Switch 
                          checked={feature.is_indexable} 
                          onCheckedChange={(val) => handleUpdate(feature.id, 'is_indexable', val)}
                          disabled={saving === feature.id}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Input 
                          value={feature.public_message || ''} 
                          onChange={(e) => {
                            // Local state only, save on blur or debounced ideally.
                            // For simplicity in UI, we update state locally and save on blur
                            setFeatures(features.map(f => f.id === feature.id ? { ...f, public_message: e.target.value } : f));
                          }}
                          onBlur={(e) => handleUpdate(feature.id, 'public_message', e.target.value)}
                          disabled={saving === feature.id}
                          className="h-8 text-xs w-48"
                          placeholder="Public message..."
                        />
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(feature.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {features.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground whitespace-nowrap">
                        No features found. Add one above.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {requests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Feature Requests</CardTitle>
              <CardDescription>Users requesting access to coming soon features.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full max-w-full overflow-x-auto bg-card">
                <Table className="[&>div]:max-w-full min-w-max">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Date</TableHead>
                      <TableHead className="whitespace-nowrap">Feature</TableHead>
                      <TableHead className="whitespace-nowrap">User</TableHead>
                      <TableHead className="whitespace-nowrap">Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="whitespace-nowrap">{new Date(req.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{req.feature_slug}</TableCell>
                        <TableCell className="whitespace-nowrap">{req.user_name}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">{req.user_email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}