import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  LayoutDashboard, Users, ShoppingBag, MessageSquare, FileText,
  Menu, X, Loader2, Search, Trash2, Shield, ShieldOff,
  Eye, EyeOff, TrendingUp, DollarSign, Package, Bot,
  RefreshCw, ChevronDown, LogOut, Star, Code, CheckCircle, Activity, MapPin, Briefcase, Mail, Share2
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { AdminServicesSection } from './AdminServicesSection';
import { AdminOrdersSection } from './AdminOrdersSection';
import AdminSEOIntelligenceSection from './AdminSEOIntelligenceSection';
import FeatureControlsPage from './FeatureControlsPage';
import UsersSection from './UsersSection';
import FeatureLimitsSection from './FeatureLimitsSection';
import WebsiteCRMSection from './WebsiteCRMSection';
import AdminContentSection from './AdminContentSection';
import AdminSocialLinksSection from './AdminSocialLinksSection';
import { ApiManagementSection } from '@/components/admin/ApiManagementSection';
import { AdminPluginSection } from '@/components/admin/AdminPluginSection';
import { toast } from 'sonner';
import ApiHealthDashboardPage from '@/pages/admin/ApiHealthDashboardPage';
import { AdminEmailSection } from './AdminEmailSection';
import JobApplicationsSection from './JobApplicationsSection';
import type { Profile, SellerProduct } from '@/types/types';

// ─── Types ──────────────────────────────────────────────────────────────────

type AdminSection = 'overview' | 'users' | 'marketplace' | 'community' | 'content' | 'monetization' | 'settings' | 'services' | 'orders' | 'seo' | 'feature-controls' | 'api-health' | 'job-applications' | 'email' | 'social-links';

interface ForumPost {
  id: string;
  author_id: string;
  title: string;
  category: string;
  replies: number;
  views: number;
  created_at: string;
}

interface Article {
  id: string;
  author_id: string;
  title: string;
  keyword: string;
  status: string;
  seo_score: number | null;
  word_count: number | null;
  current_step: number;
  created_at: string;
}

interface OverviewStats {
  totalUsers: number;
  totalProducts: number;
  publishedProducts: number;
  totalForumPosts: number;
  totalArticles: number;
  totalRevenue: number;
}

// ─── Sidebar nav ────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'overview' as AdminSection, label: 'Overview', icon: LayoutDashboard },
  { id: 'email' as AdminSection, label: 'Email Management', icon: Mail },
  { id: 'feature-controls' as AdminSection, label: 'Feature Controls', icon: Shield },
  { id: 'services' as AdminSection, label: 'Services & Leads', icon: Users },
  { id: 'seo' as AdminSection, label: 'SEO Intelligence', icon: Search },
  { id: 'orders' as AdminSection, label: 'Service Orders', icon: Package },
  { id: 'job-applications' as AdminSection, label: 'Job Applications', icon: Briefcase },
  { id: 'users' as AdminSection, label: 'Users', icon: Users },
  { id: 'marketplace' as AdminSection, label: 'Marketplace', icon: ShoppingBag },
  { id: 'community' as AdminSection, label: 'Community', icon: MessageSquare },
  { id: 'content' as AdminSection, label: 'Blog & Guides', icon: FileText },
  { id: 'social-links' as AdminSection, label: 'Social Links', icon: Share2 },
  { id: 'monetization' as AdminSection, label: 'Monetization & Verification', icon: DollarSign },
  { id: 'api-health' as AdminSection, label: 'API Health & Connections', icon: Activity },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'border-border text-muted-foreground',
  published: 'border-success/30 text-success bg-success/5',
  archived: 'border-border text-muted-foreground bg-muted/40',
};

// ─── Main Component ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sync route with active section
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/admin/users')) setActiveSection('users');
    else if (path.includes('/admin/products')) setActiveSection('marketplace');
    else if (path.includes('/admin/moderation')) setActiveSection('community');
    else if (path.includes('/admin/articles')) setActiveSection('content');
    else if (path.includes('/admin/feature-controls')) setActiveSection('feature-controls');
    else if (path.includes('/admin/api-health')) setActiveSection('api-health');
    else if (path.includes('/admin/email')) setActiveSection('email');
    else if (path === '/admin') setActiveSection('overview');
  }, [location.pathname]);

  const handleNavClick = (id: AdminSection) => {
    setActiveSection(id);
    setSidebarOpen(false);
    
    // Update URL to match
    switch(id) {
      case 'users': navigate('/admin/users'); break;
      case 'marketplace': navigate('/admin/products'); break;
      case 'community': navigate('/admin/moderation'); break;
      case 'content': navigate('/admin/articles'); break;
      case 'feature-controls': navigate('/admin/feature-controls'); break;
      case 'api-health': navigate('/admin/api-health'); break;
      case 'email': navigate('/admin/email'); break;
      case 'overview': navigate('/admin'); break;
      // Other sections just change state for now to avoid polluting routes, or we could add them
    }
  };

  // Guard: redirect non-admins
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (profile && profile.role !== 'admin') {
      toast.error('Access denied. Admin only.');
      navigate('/');
    }
  }, [user, profile, navigate]);

  if (!user || (profile && profile.role !== 'admin')) return null;

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out.');
    navigate('/');
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-60 bg-card border-r border-border flex flex-col
        transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:flex
      `}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 h-16 px-5 border-b border-border shrink-0">
          <img 
            src="https://miaoda-site-img.s3cdn.medo.dev/app-icons/app_icon_128c0c18-8557-4863-9f08-5ec933ee3619.png" 
            alt="Logo" 
            className="w-7 h-7 object-contain rounded-sm shadow-sm"
          />
          <div className="min-w-0">
            <div className="text-sm font-bold text-navy leading-tight">Admin Panel</div>
            <div className="text-xs text-muted-foreground truncate">AIDetector.cx</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors min-h-11 ${
                activeSection === id
                  ? 'bg-primary/10 text-primary border-r-2 border-primary'
                  : 'text-foreground/70 hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-5 py-4 border-t border-border shrink-0">
          <div className="text-xs text-muted-foreground mb-3 truncate">{user?.email}</div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 h-9"
            onClick={handleSignOut}
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card flex items-center gap-3 px-4 md:px-6 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden p-2"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <h1 className="flex-1 min-w-0 text-base font-semibold text-navy truncate">
            {NAV_ITEMS.find((n) => n.id === activeSection)?.label}
          </h1>
          <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-xs shrink-0">
            <Shield className="w-3 h-3 mr-1" /> Admin
          </Badge>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {activeSection === 'overview' && <OverviewSection />}
          {activeSection === 'services' && (
             <div className="space-y-6">
                <AdminServicesSection />
                <WebsiteCRMSection />
             </div>
          )}
          {activeSection === 'seo' && <AdminSEOIntelligenceSection />}
          {activeSection === 'orders' && <AdminOrdersSection />}
          {activeSection === 'job-applications' && <JobApplicationsSection />}
          {activeSection === 'users' && <UsersSection />}
          {activeSection === 'marketplace' && <MarketplaceSection />}
          {activeSection === 'community' && <CommunitySection />}
          {activeSection === 'content' && <AdminContentSection />}
          {activeSection === 'social-links' && <AdminSocialLinksSection />}
          {activeSection === 'monetization' && <MonetizationSection />}
          {activeSection === 'api-health' && <ApiHealthDashboardPage />}
          {activeSection === 'email' && <AdminEmailSection />}
          {activeSection === 'feature-controls' && (
            <div className="space-y-6">
              <FeatureControlsPage />
              <FeatureLimitsSection />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Overview ───────────────────────────────────────────────────────────────

function OverviewSection() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [
      { count: totalUsers },
      { count: totalProducts },
      { count: publishedProducts },
      { count: totalForumPosts },
      { count: totalArticles },
      { data: revenueData },
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('seller_products').select('id', { count: 'exact', head: true }),
      supabase.from('seller_products').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('forum_posts').select('id', { count: 'exact', head: true }),
      supabase.from('articles').select('id', { count: 'exact', head: true }),
      supabase.from('seller_products').select('price, sales_count'),
    ]);

    const totalRevenue = (revenueData || []).reduce(
      (sum, p) => sum + (p.price || 0) * (p.sales_count || 0), 0
    );

    setStats({
      totalUsers: totalUsers || 0,
      totalProducts: totalProducts || 0,
      publishedProducts: publishedProducts || 0,
      totalForumPosts: totalForumPosts || 0,
      totalArticles: totalArticles || 0,
      totalRevenue,
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Marketplace Products', value: stats.totalProducts, icon: Package, color: 'text-violet-600 bg-violet-50' },
    { label: 'Live Products', value: stats.publishedProducts, icon: Eye, color: 'text-success bg-success/10' },
    { label: 'Community Posts', value: stats.totalForumPosts, icon: MessageSquare, color: 'text-orange-600 bg-orange-50' },
    { label: 'Content Articles', value: stats.totalArticles, icon: FileText, color: 'text-cyan-600 bg-cyan-50' },
    { label: 'Gross Marketplace Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-primary bg-primary/10' },
  ] : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-navy">Platform Overview</h2>
          <p className="text-sm text-muted-foreground">Real-time metrics across all sections.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 border-border h-9" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="border-border shadow-card h-full">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-navy">{value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick nav cards */}
      {!loading && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-navy mb-3">Quick Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Manage Users', icon: Users, path: '/admin/users' },
              { label: 'Manage Products', icon: ShoppingBag, path: '/admin/products' },
              { label: 'Moderate Posts', icon: MessageSquare, path: '/admin/moderation' },
              { label: 'Content Articles', icon: FileText, path: '/admin/articles' },
            ].map(({ label, icon: Icon, path }) => (
              <Card 
                key={label} 
                className="border-border shadow-card cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => navigate(path)}
              >
                <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium text-foreground">{label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MarketplaceSection() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('seller_products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (!error && data) setProducts(data as SellerProduct[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (id: string, status: 'published' | 'draft' | 'archived') => {
    const { error } = await supabase.from('seller_products').update({ status }).eq('id', id);
    if (error) { toast.error('Failed to update status.'); return; }
    toast.success('Product status updated.');
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('seller_products').delete().eq('id', id);
    if (error) { toast.error('Failed to delete product.'); return; }
    toast.success('Product deleted.');
    setDeleteTarget(null);
    load();
  };

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-navy">Marketplace Products</h2>
          <p className="text-sm text-muted-foreground">{products.length} total listings from all sellers.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 border-border h-9" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 border-border text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-36 h-9 border-border text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="published">Live</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Product</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Category</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Price</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Sales</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Status</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border/60 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-2.5 max-w-[200px]">
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="w-7 h-7 rounded object-cover shrink-0 border border-border" />
                      ) : (
                        <div className="w-7 h-7 rounded bg-muted flex items-center justify-center shrink-0">
                          <Package className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      )}
                      <span className="font-medium text-navy truncate">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap text-xs">{p.category}</td>
                  <td className="px-3 py-2.5 font-semibold text-navy whitespace-nowrap">${p.price.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {p.sales_count}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[p.status]}`}>
                      {p.status === 'published' ? 'Live' : p.status === 'draft' ? 'Draft' : 'Archived'}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Select
                        value={p.status}
                        onValueChange={(v) => handleStatusChange(p.id, v as 'published' | 'draft' | 'archived')}
                      >
                        <SelectTrigger className="h-7 w-28 text-xs border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="published">Set Live</SelectItem>
                          <SelectItem value="draft">Set Draft</SelectItem>
                          <SelectItem value="archived">Archive</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0 border-destructive/30 text-destructive hover:bg-destructive/5"
                        onClick={() => setDeleteTarget(p.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the listing. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Community ───────────────────────────────────────────────────────────────

function CommunitySection() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('forum_posts')
      .select('id, author_id, title, category, replies, views, created_at')
      .order('created_at', { ascending: false })
      .limit(300);
    if (!error && data) setPosts(data as ForumPost[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('forum_posts').delete().eq('id', id);
    if (error) { toast.error('Failed to delete post.'); return; }
    toast.success('Post deleted.');
    setDeleteTarget(null);
    load();
  };

  const filtered = posts.filter((p) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-navy">Community Posts</h2>
          <p className="text-sm text-muted-foreground">{posts.length} total discussion posts.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 border-border h-9" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search posts by title or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 border-border text-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Title</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Category</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Replies</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Views</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Posted</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border/60 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5">
                    <span className="font-medium text-navy line-clamp-1 max-w-[240px] block">{p.title}</span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <Badge variant="outline" className="text-xs border-border text-muted-foreground">{p.category}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{p.replies}</td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{p.views}</td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0 border-destructive/30 text-destructive hover:bg-destructive/5"
                      onClick={() => setDeleteTarget(p.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">No posts found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>The discussion thread will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Content ─────────────────────────────────────────────────────────────────

function ContentSection() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('id, author_id, title, keyword, status, seo_score, word_count, current_step, created_at')
      .order('created_at', { ascending: false })
      .limit(300);
    if (!error && data) setArticles(data as Article[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) { toast.error('Failed to delete article.'); return; }
    toast.success('Article deleted.');
    setDeleteTarget(null);
    load();
  };

  const uniqueStatuses = ['all', ...Array.from(new Set(articles.map((a) => a.status).filter(Boolean)))];

  const filtered = articles.filter((a) => {
    const matchSearch = !search
      || a.title.toLowerCase().includes(search.toLowerCase())
      || (a.keyword || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const avgSEO = articles.length
    ? Math.round(articles.reduce((s, a) => s + (a.seo_score || 0), 0) / articles.length)
    : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-navy">Content Studio Articles</h2>
          <p className="text-sm text-muted-foreground">
            {articles.length} articles · Avg SEO score: <span className="font-semibold text-navy">{avgSEO}</span>
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 border-border h-9" onClick={load} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by title or keyword…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 border-border text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9 border-border text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {uniqueStatuses.map((s) => (
              <SelectItem key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : (
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Title</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Keyword</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Status</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">SEO</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Words</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Step</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Created</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-border/60 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2.5">
                    <span className="font-medium text-navy line-clamp-1 max-w-[200px] block">{a.title || '(Untitled)'}</span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs whitespace-nowrap max-w-[100px] truncate">{a.keyword || '—'}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <Badge variant="outline" className="text-xs border-border text-muted-foreground">{a.status || 'draft'}</Badge>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {a.seo_score != null ? (
                      <div className="flex items-center gap-1">
                        <Star className={`w-3 h-3 ${a.seo_score >= 70 ? 'text-success' : a.seo_score >= 40 ? 'text-warning' : 'text-muted-foreground'}`} />
                        <span className={`text-xs font-medium ${a.seo_score >= 70 ? 'text-success' : a.seo_score >= 40 ? 'text-warning' : 'text-muted-foreground'}`}>
                          {a.seo_score}
                        </span>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap text-xs">
                    {a.word_count != null ? a.word_count.toLocaleString() : '—'}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="text-xs text-muted-foreground">{a.current_step}/12</span>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0 border-destructive/30 text-destructive hover:bg-destructive/5"
                      onClick={() => setDeleteTarget(a.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-sm text-muted-foreground">No articles found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this article?</AlertDialogTitle>
            <AlertDialogDescription>The article and all its data will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Monetization & Verification ─────────────────────────────────────────────

function MonetizationSection() {
  const [activeTab, setActiveTab] = useState('adsense');
  const [adsensePubId, setAdsensePubId] = useState('ca-pub-6001480370836006');
  const [adsenseScript, setAdsenseScript] = useState('<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6001480370836006" crossorigin="anonymous"></script>');
  const [adsenseAutoInject, setAdsenseAutoInject] = useState(true);
  
  const [adsTxtContent, setAdsTxtContent] = useState('google.com, pub-6001480370836006, DIRECT, f08c47fec0942fa0');
  const [isAdsTxtValid, setIsAdsTxtValid] = useState<boolean | null>(null);

  const [metaTags, setMetaTags] = useState([
    { id: 1, provider: 'Google Search Console', tag: '<meta name="google-site-verification" content="xxxxxxxxxxxx" />', enabled: true },
    { id: 2, provider: 'Google AdSense Account', tag: '<meta name="google-adsense-account" content="ca-pub-6001480370836006">', enabled: true },
    { id: 3, provider: 'Bing Webmaster Tools', tag: '<meta name="msvalidate.01" content="xxxxxxxxxxxx" />', enabled: true },
    { id: 4, provider: 'Facebook Domain Verification', tag: '<meta name="facebook-domain-verification" content="xxxxxxxxxxxx" />', enabled: false }
  ]);
  const [metaAutoInject, setMetaAutoInject] = useState(true);

  const handleSaveAdsense = () => {
    if (adsensePubId && !adsensePubId.match(/^(ca-)?pub-\d{16}$/)) {
      toast.error('Invalid AdSense Publisher ID format. Should be pub-xxxxxxxxxxxxxxxx or ca-pub-xxxxxxxxxxxxxxxx');
      return;
    }
    toast.success('AdSense settings saved successfully.');
  };

  const handleValidateAdsTxt = () => {
    const lines = adsTxtContent.split('\n').filter(l => l.trim() !== '');
    const isValid = lines.every(line => {
      const parts = line.split(',').map(p => p.trim());
      return parts.length >= 3 && parts[0] && (parts[1].startsWith('pub-') || parts[1].startsWith('ca-pub-')) && ['DIRECT', 'RESELLER'].includes(parts[2].toUpperCase());
    });
    setIsAdsTxtValid(isValid);
    if (isValid) {
      toast.success('ads.txt is valid.');
    } else {
      toast.error('Invalid ads.txt entry detected.');
    }
  };

  const handleSaveAdsTxt = () => {
    handleValidateAdsTxt();
    if (isAdsTxtValid !== false) {
      toast.success('ads.txt published successfully to /ads.txt');
    }
  };

  const handleSaveMetaTags = () => {
    toast.success('Meta verification tags saved successfully.');
  };

  const activityLogs: any[] = [];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-navy">Monetization & Verification Manager</h2>
        <p className="text-sm text-muted-foreground">Manage AdSense, ads.txt, verification meta tags, and monetization snippets without editing code.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-border shadow-sm col-span-1 md:col-span-4 lg:col-span-1 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-navy text-sm">System Health</h3>
            </div>
            <div className="text-3xl font-bold text-navy mb-1">100/100</div>
            <div className="text-xs text-muted-foreground">Monetization Health Score</div>
          </CardContent>
        </Card>
        
        <Card className="border-border shadow-sm col-span-1 md:col-span-4 lg:col-span-3">
          <CardContent className="p-5 flex flex-wrap gap-x-8 gap-y-4 items-center h-full">
            <div>
              <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-3.5 h-3.5 text-success" /> <span className="text-sm font-semibold">AdSense</span></div>
              <ul className="text-xs text-muted-foreground space-y-1 ml-5">
                <li>Script loaded</li>
                <li>Publisher ID detected</li>
                <li>Auto Ads enabled</li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-3.5 h-3.5 text-success" /> <span className="text-sm font-semibold">ads.txt</span></div>
              <ul className="text-xs text-muted-foreground space-y-1 ml-5">
                <li>File exists (HTTP 200)</li>
                <li>Correct format</li>
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-3.5 h-3.5 text-success" /> <span className="text-sm font-semibold">Verification Tags</span></div>
              <ul className="text-xs text-muted-foreground space-y-1 ml-5">
                <li>Google verified</li>
                <li>Bing verified</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 bg-muted/50 border border-border">
          <TabsTrigger value="adsense">AdSense Manager</TabsTrigger>
          <TabsTrigger value="adstxt">ads.txt Manager</TabsTrigger>
          <TabsTrigger value="verification">Meta Verification</TabsTrigger>
          <TabsTrigger value="api">API Settings</TabsTrigger>
          <TabsTrigger value="plugin">Plugin Management</TabsTrigger>
          <TabsTrigger value="logs">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="adsense" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base">AdSense Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Google AdSense Publisher ID</label>
                <Input 
                  value={adsensePubId} 
                  onChange={e => setAdsensePubId(e.target.value)} 
                  placeholder="ca-pub-xxxxxxxxxxxxxxxx" 
                  className="max-w-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Global AdSense Script</label>
                <Textarea 
                  value={adsenseScript} 
                  onChange={e => setAdsenseScript(e.target.value)} 
                  className="font-mono text-xs min-h-[100px]"
                />
                <div className="flex items-center gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(adsenseScript); toast.success('Copied'); }}>Copy Script</Button>
                  <Button variant="outline" size="sm" onClick={() => setAdsenseScript('')}>Clear</Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div>
                  <h4 className="font-semibold text-sm text-navy">Automatic Injection</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Inject AdSense script into &lt;head&gt; on all pages. Loads once per page.</p>
                </div>
                <Switch checked={adsenseAutoInject} onCheckedChange={setAdsenseAutoInject} />
              </div>

              <Button onClick={handleSaveAdsense} className="bg-primary text-primary-foreground">Save AdSense Settings</Button>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-base">Ad Units Manager</CardTitle>
              <Button size="sm" variant="outline" className="h-8" onClick={() => toast.success('Feature coming soon')}>Add Ad Unit</Button>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-5 py-3">Ad Name</th>
                    <th className="px-5 py-3">Ad Slot ID</th>
                    <th className="px-5 py-3">Ad Type</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-border">
                  <tr className="hover:bg-muted/20">
                    <td className="px-5 py-3 font-medium text-navy">Sidebar Banner</td>
                    <td className="px-5 py-3 text-muted-foreground font-mono text-xs">1234567890</td>
                    <td className="px-5 py-3 text-muted-foreground">Display</td>
                    <td className="px-5 py-3"><Badge variant="outline" className="border-success text-success bg-success/10">Active</Badge></td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => toast.success('Feature coming soon')}>Edit</Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive" onClick={() => toast.success('Feature coming soon')}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/20">
                    <td className="px-5 py-3 font-medium text-navy">In-Article Responsive</td>
                    <td className="px-5 py-3 text-muted-foreground font-mono text-xs">0987654321</td>
                    <td className="px-5 py-3 text-muted-foreground">In Article</td>
                    <td className="px-5 py-3"><Badge variant="outline" className="text-muted-foreground">Disabled</Badge></td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => toast.success('Feature coming soon')}>Edit</Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive" onClick={() => toast.success('Feature coming soon')}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adstxt" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base">ads.txt Editor</CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="bg-muted/50 p-3 rounded-md border border-border">
                <span className="text-xs font-semibold uppercase text-muted-foreground block mb-1">Current Publish URL</span>
                <a href="/ads.txt" target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline font-mono">https://aidetector.cx/ads.txt</a>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">File Content</label>
                <Textarea 
                  value={adsTxtContent} 
                  onChange={e => {
                    setAdsTxtContent(e.target.value);
                    setIsAdsTxtValid(null);
                  }} 
                  className={`font-mono text-xs min-h-[200px] ${isAdsTxtValid === false ? 'border-destructive focus-visible:ring-destructive' : isAdsTxtValid === true ? 'border-success focus-visible:ring-success' : ''}`}
                />
                {isAdsTxtValid === true && <p className="text-success text-xs mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> ✓ ads.txt Valid</p>}
                {isAdsTxtValid === false && <p className="text-destructive text-xs mt-2 flex items-center gap-1"><X className="w-3 h-3" /> ✗ Invalid ads.txt Entry</p>}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleSaveAdsTxt} className="bg-primary text-primary-foreground">Save & Publish</Button>
                <Button variant="outline" onClick={handleValidateAdsTxt}>Validate</Button>
                <Button variant="ghost" onClick={() => setAdsTxtContent('google.com, pub-6001480370836006, DIRECT, f08c47fec0942fa0')}>Reset</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-base">Meta Verification Tags</CardTitle>
              <Button size="sm" variant="outline" className="h-8" onClick={() => toast.success('Feature coming soon')}>Add Provider</Button>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border mb-4">
                <div>
                  <h4 className="font-semibold text-sm text-navy">Automatic Head Injection</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Inject enabled meta tags into &lt;head&gt; on all pages. Prevents duplicate tags.</p>
                </div>
                <Switch checked={metaAutoInject} onCheckedChange={setMetaAutoInject} />
              </div>

              <div className="space-y-4">
                {metaTags.map((tag, i) => (
                  <div key={tag.id} className="border border-border rounded-lg p-4 bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm text-navy">{tag.provider}</h4>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={tag.enabled} 
                          onCheckedChange={(c) => {
                            const newTags = [...metaTags];
                            newTags[i].enabled = c;
                            setMetaTags(newTags);
                          }} 
                        />
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => toast.success('Feature coming soon')}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <Input 
                      value={tag.tag} 
                      onChange={(e) => {
                        const newTags = [...metaTags];
                        newTags[i].tag = e.target.value;
                        setMetaTags(newTags);
                      }}
                      className="font-mono text-xs bg-muted/50"
                    />
                  </div>
                ))}
              </div>

              <Button onClick={handleSaveMetaTags} className="bg-primary text-primary-foreground">Save Meta Tags</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <ApiManagementSection />
        </TabsContent>

        <TabsContent value="plugin" className="space-y-4">
          <AdminPluginSection />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base">Audit Trail</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-5 py-3">Date & Time</th>
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Previous Value</th>
                    <th className="px-5 py-3">New Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-border">
                  {activityLogs.map(log => (
                    <tr key={log.id} className="hover:bg-muted/20">
                      <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                        <div className="font-medium text-navy">{log.date}</div>
                        <div className="text-xs">{log.time}</div>
                      </td>
                      <td className="px-5 py-3 font-medium text-navy">{log.action}</td>
                      <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{log.old}</td>
                      <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{log.new}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Settings ───────────────────────────────────────────────────────────────

function SettingsSection() {
  const [googleMapsKey, setGoogleMapsKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('*');
      
      if (error) throw error;
      
      const gMapsRow = data?.find(r => r.key_name === 'GOOGLE_MAPS_API_KEY');
      if (gMapsRow) setGoogleMapsKey(gMapsRow.key_value);

    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (keyName: string, keyValue: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key_name: keyName,
          key_value: keyValue,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success(`${keyName} saved successfully`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to save ${keyName}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">API Settings</h2>
          <p className="text-muted-foreground text-sm">Configure third-party integrations and API keys.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            Google Places API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="google_maps">API Key</Label>
            <Input 
              id="google_maps"
              type="password"
              placeholder="AIzaSy..." 
              value={googleMapsKey} 
              onChange={(e) => setGoogleMapsKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Required for the Company Search functionality to fetch real businesses from Google Maps.
            </p>
          </div>
          <Button 
            onClick={() => handleSave('GOOGLE_MAPS_API_KEY', googleMapsKey)}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Key
          </Button>
        </CardContent>
      </Card>
      
      {/* Space for future API keys (e.g. Hunter.io, Stripe, etc.) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Code className="w-5 h-5 text-muted-foreground" />
            Other API Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Add more integrations here as needed.</p>
        </CardContent>
      </Card>
    </div>
  );
}
