import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Key, Copy, Check, Trash2, Plus, Eye, EyeOff, AlertCircle,
  Activity, Zap, Calendar, TrendingUp, Lock, ArrowRight,
  RefreshCw, ChevronRight, Shield
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ── Pro Gate ──────────────────────────────────────────────────────────────────
function ProGate() {
  const { user } = useAuth();
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-20">
      <Card className="max-w-md w-full border-primary/30 shadow-lg bg-gradient-to-br from-card to-primary/5">
        <CardContent className="p-8 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <Badge className="bg-primary/10 text-primary border-0">Pro Feature</Badge>
          <h2 className="text-xl font-bold text-navy">API Dashboard requires Pro</h2>
          <p className="text-sm text-muted-foreground text-pretty">
            Generate API keys, monitor usage, and manage your integrations — all available on the Pro plan and above.
          </p>
          {user ? (
            <Button className="w-full bg-primary text-primary-foreground font-semibold gap-2" asChild>
              <Link to="/pricing">Upgrade to Pro <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          ) : (
            <div className="flex flex-col gap-2 w-full">
              <Button className="w-full bg-primary text-primary-foreground font-semibold gap-2" asChild>
                <Link to="/signup">Sign Up & Get Pro <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Masked key display ────────────────────────────────────────────────────────
function MaskedKey({ value }: { value: string }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const display = visible ? value : value.slice(0, 8) + '•'.repeat(24) + value.slice(-4);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('API key copied to clipboard');
  };

  return (
    <div className="flex items-center gap-2 min-w-0">
      <code className="font-mono text-xs text-navy bg-muted px-2 py-1 rounded truncate max-w-[220px]">
        {display}
      </code>
      <button onClick={() => setVisible(v => !v)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0" aria-label={visible ? 'Hide key' : 'Show key'}>
        {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
      <button onClick={copy} className="text-muted-foreground hover:text-foreground transition-colors shrink-0" aria-label="Copy key">
        {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'text-primary' }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <Card className="border-border shadow-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
        </div>
        <p className="text-3xl font-extrabold text-navy">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function ApiDashboardPage() {
  const { user, profile } = useAuth();
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [usageStats, setUsageStats] = useState({
    monthly: 0, daily: 0, limit: 100, successRate: 100, lastRequest: null as string | null
  });

  // Plan check
  const plan = profile?.subscription_plan || 'free';
  const isAdmin = profile?.role === 'admin';
  const planLevels: Record<string, number> = { free: 0, pro: 1, business: 2, enterprise: 3 };
  const hasPro = isAdmin || planLevels[plan] >= 1;
  const planLimit = plan === 'pro' ? 10000 : plan === 'business' || plan === 'enterprise' ? 999999 : 100;
  const planLabel = plan === 'pro' ? 'Pro' : plan === 'business' ? 'Business' : plan === 'enterprise' ? 'Enterprise' : 'Free';

  const fetchKeys = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from('api_keys').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setKeys(data || []);
    setLoading(false);
  }, [user]);

  const fetchUsage = useCallback(async () => {
    if (!user) return;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const [{ count: monthly }, { count: daily }] = await Promise.all([
      supabase.from('api_usage_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', monthStart),
      supabase.from('api_usage_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', dayStart),
    ]);

    const { data: last } = await supabase.from('api_usage_logs').select('created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();

    setUsageStats({
      monthly: monthly || 0,
      daily: daily || 0,
      limit: planLimit,
      successRate: 100,
      lastRequest: last?.created_at || null,
    });
  }, [user, planLimit]);

  useEffect(() => {
    fetchKeys();
    fetchUsage();
  }, [fetchKeys, fetchUsage]);

  const generateKey = async () => {
    if (!user) { toast.error('Please sign in first.'); return; }
    if (!hasPro) { toast.error('Pro plan required to generate API keys.'); return; }
    setCreating(true);
    const arr = new Uint8Array(24);
    window.crypto.getRandomValues(arr);
    const keyValue = 'aid_' + Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
    const { data, error } = await supabase.from('api_keys').insert({
      user_id: user.id,
      name: newKeyName.trim() || 'Default Key',
      key_value: keyValue,
    }).select().single();
    if (error) { toast.error('Failed to generate key: ' + error.message); }
    else { setKeys([data, ...keys]); setNewKeyName(''); setShowCreate(false); toast.success('API key generated successfully!'); }
    setCreating(false);
  };

  const revokeKey = async (id: string) => {
    const { error } = await supabase.from('api_keys').delete().eq('id', id);
    if (error) { toast.error('Failed to revoke key.'); }
    else { setKeys(keys.filter(k => k.id !== id)); toast.success('API key revoked.'); }
  };

  const quotaPercent = usageStats.limit > 0 ? Math.min((usageStats.monthly / usageStats.limit) * 100, 100) : 0;

  // If not authed or not pro → gate
  if (!loading && (!user || !hasPro)) return <MainLayout><ProGate /></MainLayout>;

  return (
    <MainLayout>
      <PageMeta
        title="API Dashboard — Manage API Keys & Usage | AIDetector.cx"
        description="Manage your AIDetector.cx API keys, monitor request usage, and track your quota from your personal API Dashboard."
        canonicalUrl="https://aidetector.cx/api/dashboard"
        noindex
      />

      {/* Header */}
      <div className="bg-navy py-10 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-white/50 text-sm mb-1">
                <Link to="/api" className="hover:text-white transition-colors">API</Link>
                <ChevronRight className="w-3 h-3" />
                <span className="text-white/80">Dashboard</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">API Dashboard</h1>
              <p className="text-white/60 text-sm mt-1">
                Plan: <Badge className="bg-primary/20 text-primary border-0 ml-1">{planLabel}</Badge>
              </p>
            </div>
            <div className="flex gap-3">
              <Button size="sm" variant="ghost" className="border border-white/30 text-white hover:bg-white/10 gap-2" onClick={() => { fetchKeys(); fetchUsage(); }}>
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
              <Button size="sm" className="bg-primary text-primary-foreground font-semibold gap-2" asChild>
                <Link to="/api/docs"><Activity className="w-3.5 h-3.5" /> API Docs</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 space-y-8">

        {/* Usage Stats */}
        <div>
          <h2 className="text-lg font-bold text-navy mb-4">Usage Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Activity}   label="Monthly Requests" value={usageStats.monthly.toLocaleString()} sub={`of ${usageStats.limit === 999999 ? 'Unlimited' : usageStats.limit.toLocaleString()} this month`} />
            <StatCard icon={Calendar}   label="Today's Requests"  value={usageStats.daily.toLocaleString()} sub="reset at midnight UTC" />
            <StatCard icon={TrendingUp} label="Success Rate"      value={`${usageStats.successRate}%`} sub="last 30 days" color="text-success" />
            <StatCard icon={Zap}        label="Remaining Quota"   value={usageStats.limit === 999999 ? '∞' : Math.max(0, usageStats.limit - usageStats.monthly).toLocaleString()} sub="resets next month" />
          </div>

          {/* Quota bar */}
          {usageStats.limit !== 999999 && (
            <Card className="border-border shadow-card mt-4">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-navy">Monthly Quota Usage</span>
                  <span className="text-sm text-muted-foreground">{usageStats.monthly.toLocaleString()} / {usageStats.limit.toLocaleString()}</span>
                </div>
                <Progress value={quotaPercent} className="h-2.5" />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">{quotaPercent.toFixed(1)}% used</span>
                  {quotaPercent >= 80 && (
                    <span className="flex items-center gap-1 text-xs text-warning">
                      <AlertCircle className="w-3 h-3" /> Approaching limit —{' '}
                      <Link to="/pricing" className="underline hover:text-warning/80">Upgrade plan</Link>
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* API Keys */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-navy">API Keys</h2>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground font-semibold gap-2"
              onClick={() => setShowCreate(v => !v)}
            >
              <Plus className="w-3.5 h-3.5" /> Generate New Key
            </Button>
          </div>

          {/* Create form */}
          {showCreate && (
            <Card className="border-primary/20 bg-primary/5 mb-4">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-navy mb-3">New API Key</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Key name (e.g., WordPress Plugin, My App)"
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && generateKey()}
                    className="flex-1"
                  />
                  <Button onClick={generateKey} disabled={creating} className="bg-primary text-primary-foreground font-semibold gap-2 shrink-0">
                    {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                    {creating ? 'Generating…' : 'Generate'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreate(false)} className="shrink-0">Cancel</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1.5">
                  <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  The key will only be shown once. Copy it immediately after creation.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Key list */}
          <Card className="border-border shadow-card">
            <CardHeader className="pb-2 pt-4 px-5 border-b border-border">
              <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" /> Your API Keys
              </CardTitle>
              <CardDescription className="text-xs">Never share API keys publicly. Rotate regularly.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Loading keys…</div>
              ) : keys.length === 0 ? (
                <div className="p-10 flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                    <Key className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="font-semibold text-navy text-sm">No API keys yet</p>
                  <p className="text-xs text-muted-foreground max-w-xs text-pretty">
                    Click "Generate New Key" above to create your first API key.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {keys.map(k => (
                    <div key={k.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-muted/20 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-navy">{k.name}</p>
                        <MaskedKey value={k.key_value} />
                        <p className="text-xs text-muted-foreground mt-1">
                          Created {new Date(k.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeKey(k.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Subscription status */}
        <Card className="border-border shadow-card">
          <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-navy text-sm">Subscription Status</p>
                <p className="text-xs text-muted-foreground">
                  Current plan: <span className="font-medium text-navy capitalize">{planLabel}</span>
                  {usageStats.limit !== 999999 && ` · ${usageStats.limit.toLocaleString()} requests/month`}
                </p>
              </div>
            </div>
            {planLabel === 'Free' ? (
              <Button className="bg-primary text-primary-foreground font-semibold gap-2 shrink-0" asChild>
                <Link to="/pricing">Upgrade to Pro <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            ) : (
              <Badge className="bg-success/10 text-success border-success/20 shrink-0">Active</Badge>
            )}
          </CardContent>
        </Card>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'API Documentation', desc: 'Full reference & code examples', href: '/api/docs', icon: Activity },
            { label: 'API Landing Page',  desc: 'Features, pricing, use cases',  href: '/api',       icon: Zap },
            { label: 'Upgrade Plan',      desc: 'More requests & features',      href: '/pricing',   icon: TrendingUp },
          ].map(({ label, desc, href, icon: Icon }) => (
            <Card key={href} className="border-border shadow-card hover:shadow-md transition-shadow group cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3" onClick={() => {}}>
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link to={href} className="block text-sm font-semibold text-navy hover:text-primary transition-colors truncate">{label}</Link>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </MainLayout>
  );
}
