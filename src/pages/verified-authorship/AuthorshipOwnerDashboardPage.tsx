import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  ShieldCheck, Plus, Search, Eye, Share2, History, AlertTriangle,
  FileText, ExternalLink, CheckCircle2, Lock, Sparkles, Copy,
  CreditCard, ArrowUpRight, BarChart3, RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchOwnerRegistrations } from '@/lib/verifiedAuthorship/authorshipService';
import type { AuthorshipRegistration } from '@/lib/verifiedAuthorship/types';
import AuthorshipExportModal from '@/components/verified-authorship/AuthorshipExportModal';
import MainLayout from '@/components/layouts/MainLayout';
import PageMeta from '@/components/common/PageMeta';

export default function AuthorshipOwnerDashboardPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AuthorshipRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecordForExport, setSelectedRecordForExport] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchOwnerRegistrations();
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRecords = records.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.trackingCode.toLowerCase().includes(q) ||
      (r.category && r.category.toLowerCase().includes(q))
    );
  });

  const totalWorks = records.length;
  const activeCount = records.filter((r) => r.status === 'active').length;
  const disputedCount = records.filter((r) => r.status === 'pending_conflict_review').length;
  const suspendedCount = records.filter((r) => r.status === 'suspended').length;
  const revokedCount = records.filter((r) => r.status === 'revoked').length;
  const totalViews = records.reduce((acc, r) => acc + (r.viewCount || 0), 0);
  const totalLookups = records.reduce((acc, r) => acc + (r.lookupCount || 0), 0);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Tracking code copied to clipboard');
  };

  return (
    <MainLayout>
      <PageMeta
        title="Verified Authorship Dashboard | AIDetector.cx"
        description="Manage your registered manuscripts, cryptographic certificates, version histories, and verification analytics."
      />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Verified Authorship Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your registered manuscripts, public certificates, version trees, and export badges.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
              <Link to="/authorship/profile">
                <Lock className="w-3.5 h-3.5" /> Author Profile & Attestation
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-1.5 text-xs">
              <Link to="/verified-authorship/register">
                <Plus className="w-4 h-4" /> Register New Work
              </Link>
            </Button>
          </div>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          <Card className="bg-card">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Total Works</CardDescription>
              <CardTitle className="text-2xl font-bold">{totalWorks}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <span className="text-[11px] text-muted-foreground">All time registered</span>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Active Certificates</CardDescription>
              <CardTitle className="text-2xl font-bold text-emerald-600">{activeCount}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <span className="text-[11px] text-muted-foreground">Publicly verifiable</span>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Disputed / In Review</CardDescription>
              <CardTitle className="text-2xl font-bold text-amber-600">{disputedCount}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <span className="text-[11px] text-muted-foreground">Under arbitration</span>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Certificate Views</CardDescription>
              <CardTitle className="text-2xl font-bold">{totalViews}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <span className="text-[11px] text-muted-foreground">Public visits</span>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Hash Comparisons</CardDescription>
              <CardTitle className="text-2xl font-bold">{totalLookups}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <span className="text-[11px] text-muted-foreground">Zero-leakage checks</span>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs">Plan Entitlement</CardDescription>
              <CardTitle className="text-lg font-bold text-primary flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> Pro Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <span className="text-[11px] text-muted-foreground">Unlimited active</span>
            </CardContent>
          </Card>
        </div>

        {/* Records Management Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Registered Manuscripts & Claims</CardTitle>
                <CardDescription className="text-xs">
                  Every work is cryptographically anchored with independent version trees, integrity gate reports, and digital signatures.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Search titles, tracking codes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 text-xs h-9"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={loadData} className="h-9 px-2.5">
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-muted-foreground text-sm">Loading registered works...</div>
            ) : filteredRecords.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">No registered authorship records found.</p>
                <Button asChild size="sm">
                  <Link to="/verified-authorship/register">Register Your First Manuscript</Link>
                </Button>
              </div>
            ) : (
              <div className="w-full max-w-full overflow-x-auto bg-card">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b text-muted-foreground uppercase font-semibold">
                    <tr>
                      <th className="p-3 whitespace-nowrap">Title & Details</th>
                      <th className="p-3 whitespace-nowrap">Tracking Code</th>
                      <th className="p-3 whitespace-nowrap">Status</th>
                      <th className="p-3 whitespace-nowrap">Gate Scores</th>
                      <th className="p-3 whitespace-nowrap">Version</th>
                      <th className="p-3 whitespace-nowrap">Registered</th>
                      <th className="p-3 whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 whitespace-nowrap font-medium">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-foreground block">{r.title}</span>
                            <span className="text-[11px] text-muted-foreground">
                              {r.category || 'Article'} • {r.wordCount?.toLocaleString() || 0} words
                            </span>
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap font-mono">
                          <div className="flex items-center gap-1">
                            <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">{r.trackingCode}</code>
                            <Button variant="ghost" size="icon" onClick={() => handleCopy(r.trackingCode)} className="h-6 w-6">
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <Badge
                            variant={r.status === 'active' ? 'default' : r.status === 'suspended' ? 'destructive' : 'outline'}
                            className="capitalize text-[10px]"
                          >
                            {r.status.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <div className="text-[11px] space-y-0.5">
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium block">
                              AI: {r.balancedAiScore || 0}%
                            </span>
                            <span className="text-muted-foreground block">
                              Originality: {r.plagiarismOriginalityScore || 100}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap font-mono">
                          v{r.currentVersionNumber || 1}.0
                        </td>
                        <td className="p-3 whitespace-nowrap text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 whitespace-nowrap text-right space-x-1">
                          <Button asChild variant="outline" size="sm" className="h-7 text-[11px] gap-1">
                            <Link to={`/authorship/records/${r.id}`}>
                              <Eye className="w-3 h-3" /> Manage
                            </Link>
                          </Button>
                          <Button asChild variant="ghost" size="sm" className="h-7 text-[11px] gap-1">
                            <Link to={`/verify/${r.trackingCode}`} target="_blank">
                              <ExternalLink className="w-3 h-3" /> Public Cert
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedRecordForExport && (
        <AuthorshipExportModal
          open={!!selectedRecordForExport}
          onOpenChange={(open) => !open && setSelectedRecordForExport(null)}
          certificate={selectedRecordForExport}
        />
      )}
    </MainLayout>
  );
}
