import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Search, Loader2, RefreshCw, User as UserIcon, Shield, CreditCard, Activity, AlertCircle, Trash2, Edit2, Lock, Unlock, Zap } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

export default function UsersSection() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error && data) setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter((u) => {
    const matchSearch = !search || 
      (u.full_name || '').toLowerCase().includes(search.toLowerCase()) || 
      (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openUserDetails = (user: any) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-navy">User Intelligence</h2>
          <p className="text-sm text-muted-foreground">{users.length} total registered users.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 border-border h-9" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 border-border text-sm" />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
          <SelectTrigger className="w-32 h-9 border-border text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : (
        <div className="overflow-x-auto w-full max-w-full bg-card rounded-md border border-border">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">User</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">Plan</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">Status</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">Joined</th>
                <th className="px-4 py-3 font-semibold text-right text-muted-foreground whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => {
                const initials = (u.full_name || u.email || 'U').slice(0, 2).toUpperCase();
                return (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => openUserDetails(u)}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="font-medium text-navy">{u.full_name || 'No Name'}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant="outline" className="capitalize">{u.subscription_plan || 'Free'}</Badge>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant={u.account_status === 'Suspended' ? 'destructive' : 'secondary'}>{u.account_status || 'Active'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openUserDetails(u); }}>Manage</Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <UserDetailsDialog user={selectedUser} isOpen={isDetailsOpen} onClose={() => { setIsDetailsOpen(false); load(); }} />
      )}
    </div>
  );
}

function UserDetailsDialog({ user, isOpen, onClose }: { user: any, isOpen: boolean, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState(user);
  const [saving, setSaving] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    setProfileData(user);
    if (isOpen) fetchActivities();
  }, [user, isOpen]);

  const fetchActivities = async () => {
    const { data } = await supabase.from('user_activities').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
    if (data) setActivities(data);
  };

  const handleUpdate = async (updates: any, actionDesc: string) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (error) throw error;
      setProfileData({ ...profileData, ...updates });
      
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.from('admin_audit_logs').insert({
         admin_id: session?.user?.id,
         user_id: user.id,
         action: actionDesc,
         new_value: JSON.stringify(updates)
      });
      
      toast.success(actionDesc + ' successful');
    } catch (err: any) {
      toast.error('Failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-3xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-primary" /> User Intelligence: {profileData.email}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-4 md:inline-flex md:w-auto overflow-x-auto whitespace-nowrap h-auto p-1 bg-muted">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="plan">Plan & Limits</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={profileData.full_name || ''} onChange={e => setProfileData({...profileData, full_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={profileData.role} onValueChange={v => setProfileData({...profileData, role: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Account Status</Label>
                <Select value={profileData.account_status || 'Active'} onValueChange={v => setProfileData({...profileData, account_status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Suspended">Suspended</SelectItem>
                    <SelectItem value="Banned">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={() => handleUpdate({ full_name: profileData.full_name, role: profileData.role, account_status: profileData.account_status }, 'Updated Profile')} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Edit2 className="w-4 h-4 mr-2" />} Save Changes
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="plan" className="space-y-4 pt-4">
            <Card className="border-border shadow-none bg-muted/20">
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subscription Plan</Label>
                  <Select value={profileData.subscription_plan || 'free'} onValueChange={v => setProfileData({...profileData, subscription_plan: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subscription Status</Label>
                  <Select value={profileData.subscription_status || 'Active'} onValueChange={v => setProfileData({...profileData, subscription_status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Paused">Paused</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-2">
                  <Button onClick={() => handleUpdate({ subscription_plan: profileData.subscription_plan, subscription_status: profileData.subscription_status }, 'Updated Plan')} disabled={saving} className="w-full">Update Plan</Button>
                </div>
                <div className="pt-2">
                   <Button variant="outline" onClick={() => handleUpdate({ subscription_plan: 'free', subscription_status: 'Cancelled' }, 'Downgraded to Free')} disabled={saving} className="w-full text-destructive">Downgrade to Free</Button>
                </div>
              </CardContent>
            </Card>
            
            <div>
               <h3 className="font-semibold text-sm text-navy mb-2">Custom Limits</h3>
               <p className="text-xs text-muted-foreground mb-4">Set specific limits for this user overriding their plan limits.</p>
               <Button variant="outline" className="w-full" onClick={() => toast.info('Custom limits coming in Feature Control module')}>Manage Custom Limits</Button>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 pt-4">
             <div className="overflow-x-auto w-full max-w-full">
               <table className="w-full text-sm text-left">
                 <thead className="bg-muted/40 border-b border-border">
                   <tr>
                     <th className="px-4 py-2 font-semibold">Date</th>
                     <th className="px-4 py-2 font-semibold">Tool Used</th>
                     <th className="px-4 py-2 font-semibold">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-border">
                    {activities.map((a, i) => (
                      <tr key={i}>
                        <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{new Date(a.created_at).toLocaleString()}</td>
                        <td className="px-4 py-2 capitalize whitespace-nowrap">{a.tool_used}</td>
                        <td className="px-4 py-2 whitespace-nowrap"><Badge variant="outline">{a.status}</Badge></td>
                      </tr>
                    ))}
                    {activities.length === 0 && <tr><td colSpan={3} className="px-4 py-4 text-center text-muted-foreground">No recent activity found.</td></tr>}
                 </tbody>
               </table>
             </div>
          </TabsContent>
          
          <TabsContent value="errors" className="space-y-4 pt-4">
             <div className="text-center text-muted-foreground py-8">
               <AlertCircle className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
               No errors logged for this user recently.
             </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
