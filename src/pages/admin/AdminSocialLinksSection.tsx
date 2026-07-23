import React, { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSocialLinksSection() {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<any[]>([]);
  const [editingLink, setEditingLink] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('social_links').select('*').order('display_order', { ascending: true });
      if (error) throw error;
      setLinks(data || []);
    } catch (err: any) {
      toast.error(`Error loading social links: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isUpdate = !!editingLink.id;

      const linkData = {
        platform: editingLink.platform,
        url: editingLink.url,
        display_order: editingLink.display_order || (links.length > 0 ? Math.max(...links.map(l => l.display_order)) + 1 : 1),
        enabled: editingLink.enabled !== undefined ? editingLink.enabled : true,
      };

      let error;
      if (isUpdate) {
        const res = await supabase.from('social_links').update({ ...linkData, updated_at: new Date() }).eq('id', editingLink.id);
        error = res.error;
      } else {
        const res = await supabase.from('social_links').insert(linkData);
        error = res.error;
      }

      if (error) throw error;
      
      toast.success(`Social link ${isUpdate ? 'updated' : 'created'} successfully!`);
      setEditingLink(null);
      fetchLinks();
    } catch (err: any) {
      toast.error(`Error saving social link: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this social link?')) return;
    try {
      const { error } = await supabase.from('social_links').delete().eq('id', id);
      if (error) throw error;
      toast.success('Social link deleted successfully');
      fetchLinks();
    } catch (err: any) {
      toast.error(`Error deleting social link: ${err.message}`);
    }
  };

  const handleToggleEnabled = async (link: any, enabled: boolean) => {
    try {
      const { error } = await supabase.from('social_links').update({ enabled, updated_at: new Date() }).eq('id', link.id);
      if (error) throw error;
      toast.success(`Social link ${enabled ? 'enabled' : 'disabled'}`);
      fetchLinks();
    } catch (err: any) {
      toast.error(`Error updating link: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-navy">Social Links Management</h2>
        <Button variant="outline" size="sm" onClick={fetchLinks} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {editingLink ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingLink.id ? 'Edit Social Link' : 'Add New Social Link'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <label className="text-sm font-medium">Platform</label>
                <Select value={editingLink.platform || ''} onValueChange={val => setEditingLink({...editingLink, platform: val})}>
                  <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="x">X (Twitter)</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="discord">Discord</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">URL</label>
                <Input 
                  type="url"
                  value={editingLink.url || ''} 
                  onChange={e => setEditingLink({...editingLink, url: e.target.value})} 
                  placeholder="https://..."
                  required 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Display Order</label>
                <Input 
                  type="number"
                  value={editingLink.display_order || ''} 
                  onChange={e => setEditingLink({...editingLink, display_order: parseInt(e.target.value)})} 
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch 
                  checked={editingLink.enabled !== false} 
                  onCheckedChange={val => setEditingLink({...editingLink, enabled: val})} 
                />
                <label className="text-sm font-medium">Enabled</label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingLink(null)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Link
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>Manage social media links displayed in the footer</CardDescription>
            </div>
            <Button onClick={() => setEditingLink({ enabled: true })}>
              <Plus className="w-4 h-4 mr-2" /> Add Link
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : links.length === 0 ? (
              <div className="text-center p-8 border rounded-lg bg-muted/10">
                <p className="text-muted-foreground mb-4">No social links found.</p>
                <Button variant="outline" onClick={() => setEditingLink({ enabled: true })}>Add Your First Link</Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Platform</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {links.map(link => (
                      <TableRow key={link.id}>
                        <TableCell className="font-medium capitalize">{link.platform}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {link.url}
                          </a>
                        </TableCell>
                        <TableCell>{link.display_order}</TableCell>
                        <TableCell>
                          <Switch 
                            checked={link.enabled} 
                            onCheckedChange={val => handleToggleEnabled(link, val)} 
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setEditingLink(link)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(link.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
