import { useState, useEffect } from 'react';
import PageMeta from '@/components/common/PageMeta';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  LayoutDashboard, FileText, Bookmark, MessageSquare, ShoppingBag,
  CreditCard, Settings, BarChart2, Zap, Award, Clock, TrendingUp,
  Bot, Star, ArrowRight, Menu, X, Loader2, Save, User, Mail, PenSquare, FileSearch,
  ImageIcon, Video, ScanFace, Trash2, Eye, Download, Package, Plus, Edit2, EyeOff, Target, Briefcase, Search, Link2
} from 'lucide-react';
import { AI_TOOLS } from '@/data/siteData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import type { SellerProduct } from '@/types/types';
import {
  loadReports, deleteReport, exportAsJSON, exportAsHTML, type SavedReport,
} from './detector/detectionEngine';
import {
  ResultHeader, DetectionBreakdownCard, DetectedSignalsCard,
  ExplanationCard, C2PACard, TimestampsCard, ConfidenceDisclaimer,
  RiskBadge, StatusBadge, ConfidenceBadge,
} from './detector/DetectorShared';

import DashboardOverview from "./dashboard/DashboardOverview";
function APIKeysPanel() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<{ id: string, name: string, api_key: string, created_at: string, last_used_at: string | null }[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newKeyName, setNewKeyName] = useState('My API Key');
  const [loading, setLoading] = useState(true);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user) fetchKeys();
  }, [user]);

  const fetchKeys = async () => {
    try {
      const { data, error } = await supabase.from('api_keys').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setKeys(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newKeyName.trim()) return toast.error('Key name required');
    try {
      const generatedKey = 'aid_live_' + Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2, '0')).join('');
      const { data, error } = await supabase.from('api_keys').insert({
        user_id: user?.id,
        name: newKeyName,
        api_key: generatedKey
      }).select().single();
      if (error) throw error;
      setKeys([data, ...keys]);
      setNewKey(generatedKey);
      setShowNew(true);
      toast.success('API key generated');
    } catch (err: any) {
      toast.error('Failed to create key: ' + err.message);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this key? Any application using it will break.')) return;
    try {
      const { error } = await supabase.from('api_keys').delete().eq('id', id);
      if (error) throw error;
      setKeys(keys.filter(k => k.id !== id));
      toast.success('Key revoked');
    } catch (err: any) {
      toast.error('Failed to revoke key: ' + err.message);
    }
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-navy">API Keys</h2>
          <p className="text-muted-foreground mt-1">Manage your API keys for programmatic access.</p>
        </div>
      </div>

      <Card className="border-border shadow-card bg-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
            <div className="flex-1">
              <Label className="mb-2 block">Key Name</Label>
              <Input 
                value={newKeyName} 
                onChange={e => setNewKeyName(e.target.value)} 
                placeholder="e.g. Production App" 
                className="bg-background"
              />
            </div>
            <Button onClick={handleCreate} className="bg-primary text-primary-foreground gap-2 h-10 w-full sm:w-auto">
              <Plus className="w-4 h-4" /> Generate New Key
            </Button>
          </div>
          
          {showNew && (
            <div className="mt-6 pt-6 border-t border-primary/10">
              <h3 className="font-semibold text-navy mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-success" /> New API Key Generated
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Please copy this key now. For security reasons, you won't be able to see it again after you leave this page.</p>
              <div className="flex gap-2 mb-4">
                <code className="flex-1 bg-card border border-border p-3 rounded-md font-mono text-sm break-all">
                  {newKey}
                </code>
                <Button variant="outline" onClick={() => {
                  navigator.clipboard.writeText(newKey);
                  toast.success('Key copied to clipboard');
                }}>Copy</Button>
              </div>
              <Button onClick={() => setShowNew(false)} variant="secondary">Done</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-border shadow-none bg-muted/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">API Calls This Month</p>
              <p className="text-xl font-bold text-navy">0 <span className="text-sm font-normal text-muted-foreground">/ 5,000</span></p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-card">
        <CardHeader>
          <CardTitle>Active Keys</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto w-full max-w-full bg-card">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/50 uppercase border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold rounded-tl-lg whitespace-nowrap">Name</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Key</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Created</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Last Used</th>
                  <th className="px-4 py-3 font-semibold text-right rounded-tr-lg whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Loading keys...</td></tr>
                ) : keys.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center text-muted-foreground whitespace-nowrap">No API keys found.</td></tr>
                ) : keys.map(k => (
                  <tr key={k.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-navy whitespace-nowrap">{k.name}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap flex items-center gap-2">
                      {visibleKeys[k.id] ? k.api_key : 'aid_live_' + '•'.repeat(16) + k.api_key.slice(-4)}
                      <button onClick={() => toggleVisibility(k.id)} className="text-muted-foreground hover:text-foreground">
                        {visibleKeys[k.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(k.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : 'Never'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" type="button" onClick={() => handleRevoke(k.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">Revoke</Button>
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
const sidebarItems = [
  { label: 'Overview', href: '#overview', icon: LayoutDashboard },
  { label: 'Detector Reports', href: '#reports', icon: FileText, featureSlug: 'detector' },
  { label: 'Doc Library', href: '#documents', icon: FileText, featureSlug: 'document-intelligence' },
  { label: 'Prospecting Projects', href: '#prospecting', icon: Target },
  { label: 'CRM Pipeline', href: '#crm', icon: Briefcase },
  { label: 'Saved Tools', href: '#tools', icon: Bookmark, featureSlug: 'tools' },
  { label: 'Community Activity', href: '#activity', icon: MessageSquare, featureSlug: 'community' },
  { label: 'Content Studio', href: '#content-studio', icon: PenSquare, featureSlug: 'content-studio' },
  { label: 'SEO Assistant', href: '#seo-assistant', icon: FileSearch, featureSlug: 'seo-assistant' },
  { label: 'SEO Intelligence', href: '/seo-dashboard', icon: Search, featureSlug: 'seo-dashboard' },
  { label: 'SEO Audit', href: '/seo-audit', icon: FileText, featureSlug: 'seo-audit' },
  { label: 'Technical SEO', href: '/technical-seo', icon: Zap, featureSlug: 'technical-seo' },
  { label: 'AEO Optimizer', href: '/aeo-optimizer', icon: Target, featureSlug: 'aeo-optimizer' },
  { label: 'Keyword Research', href: '/keyword-research', icon: Search, featureSlug: 'keyword-research' },
  { label: 'Link Building', href: '/link-building', icon: Link2, featureSlug: 'link-building' },
  { label: 'SEO Agent', href: '/seo-agent', icon: Bot, featureSlug: 'seo-agent' },
  { label: 'My Products', href: '#my-products', icon: ShoppingBag },
  { label: 'Bookmarks', href: '#bookmarks', icon: Bookmark },
  { label: 'Marketplace Purchases', href: '#purchases', icon: CreditCard, featureSlug: 'marketplace' },
  { label: 'API Keys', href: '#api-keys', icon: Zap, featureSlug: 'api-platform' },
  { label: 'Subscription', href: '#subscription', icon: CreditCard },
  { label: 'Settings', href: '#settings', icon: Settings },
];

const MODE_ICONS: Record<string, typeof FileText> = { image: ImageIcon, video: Video, deepfake: ScanFace };
const MODE_LABELS: Record<string, string> = { image: 'Image', video: 'Video', deepfake: 'Deepfake' };

type DashboardSection = 'overview' | 'reports' | 'documents' | 'prospecting' | 'crm' | 'tools' | 'activity' | 'content-studio' | 'seo-assistant' | 'bookmarks' | 'purchases' | 'subscription' | 'settings' | 'my-products' | 'api-keys';

function DashboardSidebar({ active, onNavigate, disabledFeatures = [] }: { active: DashboardSection; onNavigate: (section: DashboardSection) => void; disabledFeatures?: string[] }) {
  return (
    <nav className="flex flex-col gap-1 p-4">
      {sidebarItems.map((item) => {
        if (item.featureSlug && disabledFeatures.includes(item.featureSlug)) return null;
        
        const Icon = item.icon;
        const isExternal = item.href.startsWith('/');
        const key = item.href.replace('#', '') as DashboardSection;
        const isActive = active === key || (active === 'overview' && key === 'overview');
        
        if (isExternal) {
          return (
            <Link
              key={item.label}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left min-h-10 text-foreground/80 hover:bg-card-accent hover:text-foreground`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
              <ArrowRight className="w-3 h-3 ml-auto opacity-50 shrink-0" />
            </Link>
          );
        }
        
        return (
          <button
            key={item.label}
            onClick={() => onNavigate(key)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left min-h-10 ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground/80 hover:bg-card-accent hover:text-foreground'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

interface UserPost {
  id: string;
  title: string;
  category: string;
  replies: number;
  views: number;
  created_at: string;
}

const PLAN_DETAILS: Record<string, any> = {
  free: {
    name: 'Free',
    desc: '$0/month · Upgrade anytime',
    features: ['5 AI checks/month', 'Community access', 'AI tools directory', 'Newsletter'],
    icon: '🎁',
  },
  pro: {
    name: 'Pro',
    desc: '$19/month · Cancel anytime',
    features: ['100 AI checks/month', 'Unlimited reports', 'API access', 'PDF Exports', 'Priority support'],
    icon: '⚡',
  },
  business: {
    name: 'Business',
    desc: '$49/month · Billed monthly',
    features: ['Unlimited checks', '5 Team members', 'Advanced analytics', 'Custom integrations', '24/7 Support'],
    icon: '🏢',
  }
};

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auth
  const { user, profile, refreshProfile } = useAuth() as { user: any, profile: any, refreshProfile: any };

  // Settings form state
  const [settingsName, setSettingsName] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Detector reports state
  const [detectorReports, setDetectorReports] = useState<SavedReport[]>([]);
  const [viewingReport, setViewingReport] = useState<SavedReport | null>(null);

  // Features
  const [disabledFeatures, setDisabledFeatures] = useState<string[]>([]);

  // Check URL params for initial tab
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'reports', 'documents', 'prospecting', 'crm', 'tools', 'activity', 'content-studio', 'seo-assistant', 'bookmarks', 'purchases', 'subscription', 'settings', 'my-products', 'api-keys'].includes(tabParam)) {
      setActiveSection(tabParam as DashboardSection);
    }
  }, []);

  useEffect(() => {
    supabase.from('feature_flags').select('feature_slug, is_enabled').then(({ data }) => {
      if (data) {
        setDisabledFeatures(data.filter(f => !f.is_enabled).map(f => f.feature_slug));
      }
    });
  }, []);

  useEffect(() => {
    setDetectorReports(loadReports());
  }, [activeSection]);

  const handleDeleteReport = (id: string) => {
    deleteReport(id);
    setDetectorReports(loadReports());
    toast.success('Report deleted');
  };

  // Community activity
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // My products (seller)
  const [myProducts, setMyProducts] = useState<SellerProduct[]>([]);
  const [loadingMyProducts, setLoadingMyProducts] = useState(false);

  // Sync settings form with profile
  useEffect(() => {
    if (profile) setSettingsName(profile.full_name || '');
  }, [profile]);

  // Load user's posts when activity section opens
  useEffect(() => {
    if (activeSection !== 'activity' || !user) return;
    setLoadingPosts(true);
    supabase
      .from('forum_posts')
      .select('id, title, category, replies, views, created_at')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (!error && data) setUserPosts(data as UserPost[]);
        setLoadingPosts(false);
      });
  }, [activeSection, user]);

  // Load seller products when my-products section opens
  useEffect(() => {
    if (activeSection !== 'my-products' || !user) return;
    setLoadingMyProducts(true);
    supabase
      .from('seller_products')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!error && data) setMyProducts(data as SellerProduct[]);
        setLoadingMyProducts(false);
      });
  }, [activeSection, user]);

  const handleNavigate = (section: DashboardSection) => {
    setActiveSection(section);
    setMobileOpen(false);
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    if (!settingsName.trim()) { toast.error('Name cannot be empty.'); return; }
    setSavingSettings(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: settingsName.trim() })
      .eq('id', user.id);
    setSavingSettings(false);
    if (error) { toast.error('Failed to save settings.'); return; }
    await refreshProfile();
    toast.success('Settings saved successfully!');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  const currentPlanId = profile?.subscription_plan || 'free';
  const planInfo = PLAN_DETAILS[currentPlanId] || PLAN_DETAILS.free;

  return (
    <MainLayout showFooter={false}>
      <div className="flex min-h-[calc(100vh-4rem)] bg-secondary/30">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-card border-r border-border/50">
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-foreground/80 text-sm truncate">{displayName}</div>
                <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                <div className="text-[10px] uppercase font-bold text-primary mt-0.5 tracking-wider">
                  {profile?.subscription_plan === 'pro' ? 'Pro Plan' : profile?.subscription_plan === 'business' ? 'Business Plan' : 'Free Plan'}
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <DashboardSidebar active={activeSection} onNavigate={handleNavigate} disabledFeatures={disabledFeatures} />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 overflow-x-hidden flex flex-col">
          {/* Mobile header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background lg:hidden">
            <h2 className="font-semibold text-navy text-sm capitalize">{activeSection.replace(/-/g, ' ')}</h2>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2" onClick={() => {}}>
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-card p-0">
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{displayName}</div>
                      <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setMobileOpen(false)} className="p-2 shrink-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <DashboardSidebar active={activeSection} onNavigate={handleNavigate} disabledFeatures={disabledFeatures} />
              </SheetContent>
            </Sheet>
          </div>

          {/* Content area */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto overflow-x-hidden min-h-0">

            {/* ─── OVERVIEW ─── */}
            {activeSection === 'overview' && (
              <DashboardOverview handleNavigate={handleNavigate} />
            )}

            {/* ─── REPORTS ─── */}
            {activeSection === 'reports' && (
              <div>
                <div className="mb-6">
                  <h1 className="text-xl font-bold text-navy mb-1">Detector Reports</h1>
                  <p className="text-sm text-muted-foreground">All your saved content analysis reports from this session.</p>
                </div>
                <Card className="border-border shadow-card">
                  <CardContent className="p-0">
                    {detectorReports.length === 0 ? (
                      <div className="text-center py-16 px-4">
                        <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <FileText className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-bold text-navy text-sm mb-2">No saved reports yet</h3>
                        <p className="text-xs text-muted-foreground mb-4 text-pretty max-w-xs mx-auto">
                          Run an image, video, or deepfake analysis and save the result to view it here.
                        </p>
                        <Link to="/detector">
                          <Button size="sm" className="bg-primary text-primary-foreground h-8 text-xs" onClick={() => {}}>Go to Detector</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border bg-muted/30">
                              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">File</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Type</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">AI Score</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Risk</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Date</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detectorReports.map((report) => {
                              const ModeIcon = MODE_ICONS[report.mode] || FileText;
                              return (
                                <tr key={report.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                  <td className="px-4 py-3 text-sm text-foreground/80 max-w-[180px]">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <ModeIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                                      <span className="truncate">{report.fileName}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <Badge variant="outline" className="text-xs capitalize border-border">{MODE_LABELS[report.mode] ?? report.mode}</Badge>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`text-sm font-semibold ${
                                      report.aiProbability >= 70 ? 'text-destructive' :
                                      report.aiProbability >= 45 ? 'text-warning' : 'text-success'
                                    }`}>{report.aiProbability}%</span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <RiskBadge level={report.riskLevel} />
                                  </td>
                                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                    {new Date(report.scanDate).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex gap-1.5">
                                      <Button
                                        size="sm" variant="outline"
                                        className="h-7 w-7 p-0 border-border"
                                        onClick={() => setViewingReport(report)}
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        size="sm" variant="outline"
                                        className="h-7 w-7 p-0 border-border"
                                        onClick={() => exportAsJSON(report)}
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        size="sm" variant="outline"
                                        className="h-7 w-7 p-0 border-border text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDeleteReport(report.id)}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* View report dialog — always mounted, open controlled by state */}
                <Dialog open={!!viewingReport} onOpenChange={(open) => { if (!open) setViewingReport(null); }}>
                  <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-base font-bold text-navy text-balance">
                        Detection Report{viewingReport ? ` — ${viewingReport.fileName}` : ''}
                      </DialogTitle>
                    </DialogHeader>
                    {viewingReport && (
                      <div className="flex flex-col gap-4 mt-2">
                        <ResultHeader result={viewingReport} />
                        {viewingReport.suspiciousTimestamps.length > 0 && <TimestampsCard result={viewingReport} />}
                        <DetectionBreakdownCard result={viewingReport} />
                        <DetectedSignalsCard signals={viewingReport.detectedSignals} />
                        <ExplanationCard explanation={viewingReport.explanation} recommendation={viewingReport.recommendation} />
                        <C2PACard result={viewingReport} />
                        <ConfidenceDisclaimer />
                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button size="sm" variant="outline" className="h-8 text-xs border-border gap-1.5" onClick={() => exportAsHTML(viewingReport)}>
                            Export HTML
                          </Button>
                          <Button size="sm" variant="outline" className="h-8 text-xs border-border gap-1.5" onClick={() => exportAsJSON(viewingReport)}>
                            Export JSON
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* ─── SUBSCRIPTION ─── */}
            {activeSection === 'subscription' && (
                <div>
                  <div className="mb-6">
                    <h1 className="text-xl font-bold text-navy mb-1">Subscription</h1>
                    <p className="text-sm text-muted-foreground">Manage your plan and billing.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl">
                    <Card className="border-primary/30 bg-primary/5 shadow-card col-span-full md:col-span-1">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <Badge className="bg-primary text-primary-foreground mb-2">Current Plan</Badge>
                            <h2 className="text-2xl font-bold text-navy">{planInfo.name}</h2>
                            <p className="text-muted-foreground text-sm">{planInfo.desc}</p>
                          </div>
                          <span className="text-4xl">{planInfo.icon}</span>
                        </div>
                        <div className="flex flex-col gap-2 mb-5">
                          {planInfo.features.map((f: string) => (
                            <div key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                              <BarChart2 className="w-4 h-4 text-primary shrink-0" />
                              {f}
                            </div>
                          ))}
                        </div>
                        {currentPlanId === 'free' ? (
                          <Link to="/pricing">
                            <Button size="sm" className="bg-primary text-primary-foreground text-xs" onClick={() => {}}>Upgrade to Pro</Button>
                          </Link>
                        ) : (
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => {}}>Manage Billing</Button>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-border shadow-card">
                      <CardHeader className="pb-3 border-b border-border">
                        <CardTitle className="text-sm font-semibold text-navy">Usage This Month</CardTitle>
                      </CardHeader>
                      <CardContent className="p-5 flex flex-col gap-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-foreground/70">AI Checks</span>
                            <span className="font-medium">
                              0 / {currentPlanId === 'free' ? '5' : currentPlanId === 'pro' ? '100' : 'Unlimited'}
                            </span>
                          </div>
                          <Progress value={0} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                </div>
              </div>
            )}

            {/* ─── COMMUNITY ACTIVITY ─── */}
            {activeSection === 'activity' && (
              <div>
                <div className="mb-6">
                  <h1 className="text-xl font-bold text-navy mb-1">Community Activity</h1>
                  <p className="text-sm text-muted-foreground">All the posts you've created in the community forum.</p>
                </div>
                {loadingPosts ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : userPosts.length === 0 ? (
                  <Card className="border-border shadow-card">
                    <CardContent className="p-12 text-center">
                      <div className="text-4xl mb-4">💬</div>
                      <h2 className="text-lg font-bold text-navy mb-2">No posts yet</h2>
                      <p className="text-sm text-muted-foreground mb-5 text-pretty max-w-xs mx-auto">
                        You haven't created any community posts yet. Share your knowledge and insights!
                      </p>
                      <Link to="/community">
                        <Button className="bg-primary text-primary-foreground gap-2" onClick={() => {}}>
                          <MessageSquare className="w-4 h-4" /> Go to Community
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex flex-col gap-3">
                    {userPosts.map((post) => (
                      <Card key={post.id} className="border-border shadow-card">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-navy text-sm mb-1.5 text-balance">{post.title}</h3>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="text-xs border-border text-muted-foreground py-0 h-5">
                                  {post.category}
                                </Badge>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MessageSquare className="w-3 h-3" /> {post.replies} replies
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── CONTENT STUDIO ─── */}
            {activeSection === 'content-studio' && (
              <div>
                <div className="mb-6">
                  <h1 className="text-xl font-bold text-navy mb-1">Content Studio</h1>
                  <p className="text-sm text-muted-foreground">AI + SEO article generator with 12-step guided workflow.</p>
                </div>
                <Card className="border-border shadow-card">
                  <CardContent className="p-8 text-center">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <PenSquare className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold text-navy mb-2 text-balance">Create SEO-Optimized Articles</h2>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto text-pretty">
                      Build high-ranking content step by step — keyword analysis, SERP research, EEAT layers, humanization, and a full SEO audit before you publish.
                    </p>
                    <Link to="/content-studio">
                      <Button className="bg-primary text-primary-foreground gap-2 h-10" onClick={() => {}}>
                        <PenSquare className="w-4 h-4" /> Open Content Studio
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ─── SEO ASSISTANT ─── */}
            {activeSection === 'seo-assistant' && (
              <div>
                <div className="mb-6">
                  <h1 className="text-xl font-bold text-navy mb-1">SEO Writing Assistant</h1>
                  <p className="text-sm text-muted-foreground">Real-time SEO, readability, EEAT, and grammar analysis as you write.</p>
                </div>
                <Card className="border-border shadow-card">
                  <CardContent className="p-8 text-center">
                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileSearch className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold text-navy mb-2 text-balance">Analyze &amp; Optimize Any Article</h2>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto text-pretty">
                      Paste or write content and get live scores across 20 modules — keyword usage, readability, EEAT, grammar, snippet potential, AI detection risk, and more.
                    </p>
                    <Link to="/seo-assistant">
                      <Button className="bg-primary text-primary-foreground gap-2 h-10" onClick={() => {}}>
                        <FileSearch className="w-4 h-4" /> Open SEO Assistant
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ─── SETTINGS ─── */}
            {activeSection === 'settings' && (
              <div className="max-w-xl">
                <div className="mb-6">
                  <h1 className="text-xl font-bold text-navy mb-1">Account Settings</h1>
                  <p className="text-sm text-muted-foreground">Manage your profile and account preferences.</p>
                </div>

                <Card className="border-border shadow-card">
                  <CardHeader className="pb-4 border-b border-border">
                    <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" /> Profile Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col gap-5">
                    {/* Avatar initials display */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-navy text-sm">{displayName}</div>
                        <div className="text-xs text-muted-foreground">{user?.email}</div>
                      </div>
                    </div>

                    <Separator />

                    {/* Full Name */}
                    <div>
                      <Label htmlFor="settings-name" className="text-sm font-normal mb-1.5 block">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input
                          id="settings-name"
                          type="text"
                          placeholder="Your full name"
                          value={settingsName}
                          onChange={(e) => setSettingsName(e.target.value)}
                          className="pl-9 h-10 border-border"
                        />
                      </div>
                    </div>

                    {/* Email — read-only */}
                    <div>
                      <Label htmlFor="settings-email" className="text-sm font-normal mb-1.5 block">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Input
                          id="settings-email"
                          type="email"
                          value={user?.email || ''}
                          readOnly
                          className="pl-9 h-10 border-border bg-muted/40 text-muted-foreground cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">Email cannot be changed from here.</p>
                    </div>

                    <div className="pt-1">
                      <Button
                        type="button"
                        className="bg-primary text-primary-foreground gap-2 h-10"
                        onClick={handleSaveSettings}
                        disabled={savingSettings}
                      >
                        {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {savingSettings ? 'Saving…' : 'Save Changes'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ─── MY PRODUCTS (SELLER) ─── */}
            {activeSection === 'my-products' && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-xl font-bold text-navy">My Products</h2>
                    <p className="text-sm text-muted-foreground">Products you're selling on the marketplace.</p>
                  </div>
                  <Link to="/sell">
                    <Button className="bg-primary text-primary-foreground gap-2 h-9" onClick={() => {}}>
                      <Plus className="w-4 h-4" /> Manage Listings
                    </Button>
                  </Link>
                </div>

                {loadingMyProducts ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : myProducts.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-5xl mb-3">🛍️</div>
                    <h3 className="font-semibold text-navy mb-1">No products yet</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto text-pretty mb-5">
                      Start selling your AI prompts, templates, and workflows. Keep 85% of every sale.
                    </p>
                    <Button asChild className="bg-primary text-primary-foreground gap-2 h-9">
                      <Link to="/sell">
                        <Plus className="w-4 h-4" /> List Your First Product
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {myProducts.map((p) => (
                      <Card key={p.id} className="border-border shadow-card">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {p.image_url ? (
                              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-border">
                                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <Package className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                <span className="font-semibold text-navy text-sm truncate">{p.name}</span>
                                <Badge
                                  variant="outline"
                                  className={`text-xs shrink-0 ${p.status === 'published' ? 'border-success/30 text-success bg-success/5' : 'border-border text-muted-foreground'}`}
                                >
                                  {p.status === 'published' ? 'Live' : p.status === 'draft' ? 'Draft' : 'Archived'}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                <span className="font-semibold text-navy">${p.price.toFixed(2)}</span>
                                <span>{p.category}</span>
                                <span>{p.sales_count} sales</span>
                                <span className="text-success">Est. ${(p.price * p.sales_count * 0.85).toFixed(2)} earned</span>
                              </div>
                            </div>
                            <Link to="/sell">
                              <Button variant="outline" size="sm" className="h-8 gap-1.5 border-border text-xs shrink-0" onClick={() => {}}>
                                <Edit2 className="w-3 h-3" /> Edit
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <div className="text-center mt-2">
                      <Button asChild variant="outline" className="gap-2 border-border h-9">
                        <Link to="/sell">
                          View All on Seller Dashboard <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── EMPTY SECTIONS ─── */}
            {(activeSection === 'tools' || activeSection === 'bookmarks' || activeSection === 'purchases') && (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">
                  {activeSection === 'tools' ? '🔖' :
                   activeSection === 'bookmarks' ? '📌' : '🛒'}
                </div>
                <h2 className="text-xl font-bold text-navy mb-2 capitalize">{activeSection.replace(/-/g, ' ')}</h2>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto text-pretty">
                  {activeSection === 'tools' ? 'Your saved AI tools will appear here.' :
                   activeSection === 'bookmarks' ? 'Your bookmarked articles and discussions will appear here.' :
                   'Your marketplace purchases and downloads will appear here.'}
                </p>
                {activeSection === 'tools' && (
                  <Button asChild className="mt-5 bg-primary text-primary-foreground gap-2">
                    <Link to="/tools">
                      <Zap className="w-4 h-4" /> Explore Tools
                    </Link>
                  </Button>
                )}
              </div>
            )}

            {activeSection === 'prospecting' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center bg-card border border-border rounded-lg p-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Access AI Prospecting</h3>
                    <p className="text-sm text-muted-foreground">Go to the dedicated prospecting dashboard to manage leads.</p>
                  </div>
                  <Button asChild>
                    <Link to="/prospecting">Go to Dashboard</Link>
                  </Button>
                </div>
              </div>
            )}
            
            {activeSection === 'crm' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center bg-card border border-border rounded-lg p-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Access CRM</h3>
                    <p className="text-sm text-muted-foreground">Go to the Kanban board to track generated leads.</p>
                  </div>
                  <Button asChild>
                    <Link to="/prospecting/crm">Open CRM</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* ─── DOCUMENT LIBRARY ─── */}
            {activeSection === 'documents' && (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-navy mb-1">Document Library</h1>
                    <p className="text-sm text-muted-foreground">Manage your uploaded and processed documents.</p>
                  </div>
                  <Button asChild className="bg-primary text-primary-foreground gap-2">
                    <Link to="/document-intelligence">
                      <FileText className="w-4 h-4" /> Upload Document
                    </Link>
                  </Button>
                </div>
                
                <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                        <tr>
                          <th className="px-4 py-3 font-medium whitespace-nowrap">Document Name</th>
                          <th className="px-4 py-3 font-medium whitespace-nowrap">File Type</th>
                          <th className="px-4 py-3 font-medium whitespace-nowrap">Size</th>
                          <th className="px-4 py-3 font-medium whitespace-nowrap">Date</th>
                          <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y border-border">
                        {[
                          { id: 1, name: 'Q3_Marketing_Strategy_Final.docx', date: '2 hours ago', type: 'Word Document', size: '2.4 MB' },
                          { id: 2, name: 'Product_Requirements_v2.pdf', date: 'Yesterday', type: 'PDF Document', size: '1.1 MB' },
                        ].map((doc) => (
                          <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-medium text-navy">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary shrink-0" />
                                <span className="truncate max-w-[200px] md:max-w-xs">{doc.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{doc.type}</td>
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{doc.size}</td>
                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{doc.date}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="sm" className="h-8 text-primary" asChild>
                                  <Link to="/document-workspace">Open</Link>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ─── API KEYS PANEL ─── */}
            {activeSection === 'api-keys' && <APIKeysPanel />}

          </div>
        </div>
      </div>
    </MainLayout>
  );
}
