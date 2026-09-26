import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  ShieldCheck,
  Search,
  ExternalLink,
  Edit,
  Sparkles,
  Plus,
  Check,
  Calendar,
  Layers,
  FileText,
  Server,
  Inbox,
  CheckCircle2,
  XCircle,
  Eye,
  Lock,
  MessageSquare,
  ThumbsUp,
  Star,
  FileCheck,
  AlertTriangle,
  Flag,
  Building2,
} from 'lucide-react';
import { AI_DIRECTORY_PRODUCTS } from '@/data/aiDirectoryData';
import type {
  DirectoryProduct,
  ToolSubmissionPayload,
  ProductUserReview,
  ReviewReport,
  ProductCorrectionReport,
} from '@/types/directory';
import { toast } from 'sonner';

interface StoredSubmission extends ToolSubmissionPayload {
  id: string;
  submittedAt: string;
  status: 'pending_editorial_review' | 'approved' | 'rejected';
}

export function AdminAIDirectorySection() {
  const [products, setProducts] = useState<DirectoryProduct[]>(AI_DIRECTORY_PRODUCTS);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<DirectoryProduct | null>(null);
  const [submissions, setSubmissions] = useState<StoredSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<StoredSubmission | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'open_weight' | 'offline_hosting'>('all');

  // User Reviews & Moderation State
  const [adminReviews, setAdminReviews] = useState<ProductUserReview[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('aidetector_directory_user_reviews') || '[]');
      // Collect all built-in product reviews
      const builtInReviews: ProductUserReview[] = [];
      AI_DIRECTORY_PRODUCTS.forEach(p => {
        if (p.userReviews) builtInReviews.push(...p.userReviews);
      });
      const ids = new Set(stored.map((r: any) => r.id));
      return [...stored, ...builtInReviews.filter(r => !ids.has(r.id))];
    } catch {
      return [];
    }
  });
  const [selectedReview, setSelectedReview] = useState<ProductUserReview | null>(null);
  const [moderatorNotesInput, setModeratorNotesInput] = useState('');
  const [vendorResponseInput, setVendorResponseInput] = useState('');
  const [reports, setReports] = useState<ReviewReport[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('aidetector_directory_review_reports') || '[]');
    } catch {
      return [];
    }
  });

  // Outdated Info Corrections State
  const [corrections, setCorrections] = useState<ProductCorrectionReport[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('aidetector_directory_corrections') || '[]');
      if (stored.length > 0) return stored;
      return [
        {
          id: 'cor_seed_1',
          productId: 'chatgpt',
          field: 'pricing_summary',
          fieldLabel: 'Pricing Summary / Monthly Cost',
          currentValue: 'Free tier available; Plus plan $20/month, Team $25/user/month',
          proposedCorrection: 'OpenAI expanded Plus with higher context reasoning limits and enterprise SOC2 compliance.',
          sourceUrl: 'https://openai.com/enterprise',
          notes: 'Verified against OpenAI business portal.',
          submitterEmail: 'contributor@techresearch.io',
          status: 'pending',
          submittedAt: '2026-09-19',
        },
      ];
    } catch {
      return [];
    }
  });
  const [selectedCorrection, setSelectedCorrection] = useState<ProductCorrectionReport | null>(null);
  const [correctionFilter, setCorrectionFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [editingProduct, setEditingProduct] = useState<DirectoryProduct | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('ai_tools_submissions') || '[]');
      if (Array.isArray(stored) && stored.length > 0) {
        setSubmissions(stored);
      } else {
        // Seed initial sample submission for demonstration if empty
        const initialSubmissions: StoredSubmission[] = [
          {
            id: 'sub_seed_1',
            name: 'vLLM High-Throughput Engine',
            company: 'vLLM Project',
            websiteUrl: 'https://vllm.ai',
            repositoryUrl: 'https://github.com/vllm-project/vllm',
            docsUrl: 'https://docs.vllm.ai',
            summary: 'High-throughput and memory-efficient LLM serving engine with PagedAttention for private clusters and air-gapped deployments.',
            description: 'vLLM provides state-of-the-art serving throughput for open-weight models including Llama, Mistral, and DeepSeek, with continuous batching and PagedAttention.',
            primaryCategory: 'Local & Open Weights',
            categories: ['Local & Open Weights', 'AI Coding'],
            tags: ['Inference Engine', 'PagedAttention', 'Open Source', 'Air-Gapped'],
            supportedModalities: ['Text', 'Code'],
            pricingModel: 'Free',
            pricingSummary: '100% Free and Open-Source (Apache 2.0)',
            hasFreePlan: true,
            hasFreeTrial: false,
            platforms: ['Linux', 'CLI / API'],
            apiAvailable: true,
            openSource: true,
            isOpenWeight: true,
            licenseType: 'Apache 2.0',
            supportsOfflineHosting: true,
            deploymentOptions: ['Local / Self-Hosted', 'Air-Gapped / On-Premise', 'Hybrid'],
            contactEmail: 'maintainers@vllm.ai',
            submittedAt: new Date().toISOString(),
            status: 'pending_editorial_review',
          },
        ];
        setSubmissions(initialSubmissions);
        localStorage.setItem('ai_tools_submissions', JSON.stringify(initialSubmissions));
      }
    } catch {
      // ignore parse error
    }
  }, []);

  const filtered = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.company.toLowerCase().includes(search.toLowerCase()) ||
      p.primaryCategory.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterMode === 'open_weight' && !p.isOpenWeight) return false;
    if (filterMode === 'offline_hosting' && !p.supportsOfflineHosting) return false;
    return true;
  });

  const handleToggleFeatured = (id: string) => {
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, featured: !p.featured } : p))
    );
    toast.success('Featured status updated');
  };

  const handleVerify = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, lastVerified: today, lastChecked: today } : p))
    );
    toast.success('Product verification date updated to today');
  };

  const handleApproveSubmission = (sub: StoredSubmission) => {
    const updated = submissions.map(s =>
      s.id === sub.id ? { ...s, status: 'approved' as const } : s
    );
    setSubmissions(updated);
    localStorage.setItem('ai_tools_submissions', JSON.stringify(updated));

    // Also add to active products list if not existing
    const newProduct: DirectoryProduct = {
      id: sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      slug: sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: sub.name,
      company: sub.company,
      description: sub.description || sub.summary,
      summary: sub.summary,
      logo: '🚀',
      primaryCategory: sub.primaryCategory,
      categories: sub.categories,
      tags: sub.tags,
      useCases: ['Developer Workflow', 'Private Inference', 'Offline AI'],
      features: [sub.summary, 'Self-hosted execution', 'Open-weights architecture'],
      limitations: ['Requires dedicated hardware for high throughput'],
      supportedModalities: sub.supportedModalities,
      pricingModel: sub.pricingModel,
      pricingSummary: sub.pricingSummary,
      hasFreePlan: sub.hasFreePlan,
      hasFreeTrial: sub.hasFreeTrial,
      platforms: sub.platforms,
      apiAvailable: sub.apiAvailable,
      browserExtension: false,
      mobileApp: false,
      openSource: sub.openSource,
      isOpenWeight: sub.isOpenWeight,
      licenseType: sub.licenseType,
      supportsOfflineHosting: sub.supportsOfflineHosting,
      deploymentOptions: sub.deploymentOptions,
      businessAvailability: true,
      websiteUrl: sub.websiteUrl,
      lastVerified: new Date().toISOString().split('T')[0],
      lastChecked: new Date().toISOString().split('T')[0],
      lastUpdatedAt: new Date().toISOString().split('T')[0],
      featured: false,
      reviewStatus: 'published',
      editorialStatus: 'editorial_reviewed',
      pricingTiers: [
        {
          name: sub.pricingModel,
          price: sub.pricingSummary,
          features: ['Self-hosted execution', 'Open-source code / weights'],
        },
      ],
    };

    setProducts(prev => [newProduct, ...prev]);
    setSelectedSubmission(null);
    toast.success(`Submission "${sub.name}" approved and indexed into directory!`);
  };

  const handleRejectSubmission = (sub: StoredSubmission) => {
    const updated = submissions.map(s =>
      s.id === sub.id ? { ...s, status: 'rejected' as const } : s
    );
    setSubmissions(updated);
    localStorage.setItem('ai_tools_submissions', JSON.stringify(updated));
    setSelectedSubmission(null);
    toast.info(`Submission "${sub.name}" marked as rejected.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">AI Tools Directory Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage authentic catalog listings, provenance timestamps, open-weight licensing badges, and developer submissions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search directory tools..."
              className="pl-9 h-8 text-xs bg-card"
            />
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="bg-card">
          <CardContent className="p-3.5">
            <div className="text-xs text-muted-foreground">Total Indexed Tools</div>
            <div className="text-xl font-bold text-foreground mt-1">{products.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-3.5">
            <div className="text-xs text-muted-foreground">Open-Weight Models</div>
            <div className="text-xl font-bold text-primary mt-1">
              {products.filter(p => p.isOpenWeight).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-3.5">
            <div className="text-xs text-muted-foreground">Offline / Self-Hosted</div>
            <div className="text-xl font-bold text-emerald-500 mt-1">
              {products.filter(p => p.supportsOfflineHosting).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-3.5">
            <div className="text-xs text-muted-foreground">Featured Tools</div>
            <div className="text-xl font-bold text-foreground mt-1">
              {products.filter(p => p.featured).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-3.5">
            <div className="text-xs text-muted-foreground">Submissions Queue</div>
            <div className="text-xl font-bold text-amber-500 mt-1">
              {submissions.filter(s => s.status === 'pending_editorial_review').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Catalog vs Submissions Queue */}
      <Tabs defaultValue="catalog" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-2">
          <TabsList className="bg-muted">
            <TabsTrigger value="catalog" className="text-xs gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Catalog Management ({products.length})</span>
            </TabsTrigger>
            <TabsTrigger value="submissions" className="text-xs gap-1.5">
              <Inbox className="w-3.5 h-3.5" />
              <span>Developer Submissions ({submissions.length})</span>
              {submissions.filter(s => s.status === 'pending_editorial_review').length > 0 && (
                <Badge className="text-[10px] py-0 h-4 bg-amber-500 text-black font-bold ml-1">
                  {submissions.filter(s => s.status === 'pending_editorial_review').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>User Reviews Moderation ({adminReviews.length})</span>
              {reports.filter(r => r.status === 'pending').length > 0 && (
                <Badge className="text-[10px] py-0 h-4 bg-destructive text-destructive-foreground font-bold ml-1">
                  {reports.filter(r => r.status === 'pending').length} Reports
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="corrections" className="text-xs gap-1.5">
              <Flag className="w-3.5 h-3.5 text-amber-500" />
              <span>Corrections & Outdated Reports ({corrections.length})</span>
              {corrections.filter(c => c.status === 'pending').length > 0 && (
                <Badge className="text-[10px] py-0 h-4 bg-amber-500 text-black font-bold ml-1">
                  {corrections.filter(c => c.status === 'pending').length} New
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-1.5">
            <Button
              variant={filterMode === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilterMode('all')}
              className="text-xs h-7 px-2.5"
            >
              All Tools
            </Button>
            <Button
              variant={filterMode === 'open_weight' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilterMode('open_weight')}
              className="text-xs h-7 px-2.5 gap-1 text-primary"
            >
              <Sparkles className="w-3 h-3" /> Open Weights
            </Button>
            <Button
              variant={filterMode === 'offline_hosting' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilterMode('offline_hosting')}
              className="text-xs h-7 px-2.5 gap-1 text-emerald-500"
            >
              <Server className="w-3 h-3" /> Offline Hosting
            </Button>
          </div>
        </div>

        {/* Tab 1: Catalog */}
        <TabsContent value="catalog" className="m-0">
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground">Indexed Software Catalog</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Strict editorial integrity: facts are separated from editorial notes. No fabricated user reviews.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-xs">Product</TableHead>
                      <TableHead className="text-xs">Provider</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs">Architecture</TableHead>
                      <TableHead className="text-xs">Hosting</TableHead>
                      <TableHead className="text-xs">Pricing</TableHead>
                      <TableHead className="text-xs">Last Verified</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(product => (
                      <TableRow key={product.id} className="border-border hover:bg-muted/30">
                        <TableCell className="font-semibold text-xs text-foreground">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{product.logo}</span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span>{product.name}</span>
                                {product.isOwnerProduct && (
                                  <Badge className="text-[10px] py-0 h-4 bg-primary/10 text-primary border-primary/20">
                                    Platform
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground block font-normal truncate max-w-[180px]">
                                {product.summary}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{product.company}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px] py-0 h-4">
                            {product.primaryCategory}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {product.isOpenWeight ? (
                            <Badge variant="outline" className="text-[10px] py-0 h-4 text-primary border-primary/30">
                              Open ({product.licenseType || 'Open'})
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Proprietary</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.supportsOfflineHosting ? (
                            <Badge variant="outline" className="text-[10px] py-0 h-4 text-emerald-600 border-emerald-500/30">
                              Offline / Local
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Cloud Only</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-medium text-foreground">{product.pricingModel}</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{product.lastVerified}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingProduct({ ...product })}
                              className="h-7 px-2 text-xs text-primary gap-1"
                              title="Edit product pricing, features, timeline, sources & freshness"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleVerify(product.id)}
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                              title="Verify data today"
                            >
                              Verify
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleFeatured(product.id)}
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                              {product.featured ? 'Unfeature' : 'Feature'}
                            </Button>
                            <a
                              href={`/tools/${product.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </a>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Developer Submissions Queue */}
        <TabsContent value="submissions" className="m-0">
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-foreground">Developer Submissions Review Queue</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Review submitted models and developer tools. Verify licensing proofs and benchmark claims before publishing.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-xs">Submitted Product</TableHead>
                      <TableHead className="text-xs">Company / Creator</TableHead>
                      <TableHead className="text-xs">License / Weights</TableHead>
                      <TableHead className="text-xs">Offline Support</TableHead>
                      <TableHead className="text-xs">Contact Email</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Review Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                          No developer submissions in the review queue.
                        </TableCell>
                      </TableRow>
                    ) : (
                      submissions.map(sub => (
                        <TableRow key={sub.id} className="border-border hover:bg-muted/30">
                          <TableCell className="font-semibold text-xs text-foreground">
                            <div>
                              <span>{sub.name}</span>
                              <span className="text-[10px] text-muted-foreground block font-normal truncate max-w-[180px]">
                                {sub.summary}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{sub.company}</TableCell>
                          <TableCell>
                            {sub.isOpenWeight ? (
                              <Badge variant="outline" className="text-[10px] py-0 h-4 text-primary border-primary/30">
                                Open ({sub.licenseType})
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Proprietary</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {sub.supportsOfflineHosting ? (
                              <Badge variant="outline" className="text-[10px] py-0 h-4 text-emerald-600 border-emerald-500/30">
                                Yes
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">No</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">{sub.contactEmail}</TableCell>
                          <TableCell>
                            {sub.status === 'pending_editorial_review' && (
                              <Badge variant="secondary" className="text-[10px] py-0 h-4 bg-amber-500/10 text-amber-500">
                                Pending Review
                              </Badge>
                            )}
                            {sub.status === 'approved' && (
                              <Badge variant="secondary" className="text-[10px] py-0 h-4 bg-emerald-500/10 text-emerald-500">
                                Approved
                              </Badge>
                            )}
                            {sub.status === 'rejected' && (
                              <Badge variant="secondary" className="text-[10px] py-0 h-4 bg-destructive/10 text-destructive">
                                Rejected
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedSubmission(sub)}
                                    className="h-7 px-2 text-xs gap-1"
                                  >
                                    <Eye className="w-3 h-3" /> Inspect
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle className="text-base font-bold">
                                      Editorial Review: {sub.name}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs">
                                      Submitted by {sub.company} ({sub.contactEmail}) on {sub.submittedAt.split('T')[0]}
                                    </DialogDescription>
                                  </DialogHeader>

                                  <div className="space-y-4 text-xs pt-2">
                                    <div className="p-3 rounded-lg bg-muted/40 space-y-1.5">
                                      <div className="font-semibold text-foreground">Summary & Mission</div>
                                      <p className="text-muted-foreground">{sub.summary}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="p-2.5 rounded-lg border border-border">
                                        <span className="text-muted-foreground block text-[10px]">Website URL</span>
                                        <a
                                          href={sub.websiteUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-primary hover:underline font-medium break-all"
                                        >
                                          {sub.websiteUrl}
                                        </a>
                                      </div>
                                      <div className="p-2.5 rounded-lg border border-border">
                                        <span className="text-muted-foreground block text-[10px]">Repository URL</span>
                                        <a
                                          href={sub.repositoryUrl || '#'}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-primary hover:underline font-medium break-all"
                                        >
                                          {sub.repositoryUrl || 'None provided'}
                                        </a>
                                      </div>
                                    </div>

                                    <div className="p-3 rounded-lg border border-border space-y-2">
                                      <div className="font-semibold text-foreground">Architecture & Licensing Claims</div>
                                      <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                                        <div>Open-Weights: <strong className="text-foreground">{sub.isOpenWeight ? 'Yes' : 'No'}</strong></div>
                                        <div>License Type: <strong className="text-foreground">{sub.licenseType}</strong></div>
                                        <div>Offline Self-Hosting: <strong className="text-foreground">{sub.supportsOfflineHosting ? 'Yes' : 'No'}</strong></div>
                                        <div>Pricing Model: <strong className="text-foreground">{sub.pricingModel}</strong></div>
                                      </div>
                                    </div>

                                    {sub.notesForEditorial && (
                                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
                                        <div className="font-semibold text-primary">Submitter Notes for Editors</div>
                                        <p className="text-muted-foreground">{sub.notesForEditorial}</p>
                                      </div>
                                    )}

                                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRejectSubmission(sub)}
                                        className="text-xs text-destructive hover:bg-destructive/10"
                                      >
                                        <XCircle className="w-3.5 h-3.5 mr-1" /> Reject Submission
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => handleApproveSubmission(sub)}
                                        className="text-xs bg-primary text-primary-foreground gap-1"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve & Index
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: User Reviews Moderation */}
        <TabsContent value="reviews" className="m-0 space-y-4">
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Community Reviews & Evidence Moderation Queue
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Inspect user reviews, audit attached proof of usage, verify conflict disclosures, and moderate vendor responses.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-xs">Product</TableHead>
                      <TableHead className="text-xs">Reviewer & Role</TableHead>
                      <TableHead className="text-xs">Score</TableHead>
                      <TableHead className="text-xs">Evidence Status</TableHead>
                      <TableHead className="text-xs">Conflict Notice</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Moderation Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminReviews.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                          No community reviews currently logged in the moderation system.
                        </TableCell>
                      </TableRow>
                    ) : (
                      adminReviews.map(rev => (
                        <TableRow key={rev.id} className="border-border hover:bg-muted/30">
                          <TableCell className="font-semibold text-xs text-foreground">
                            {rev.productId}
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="font-medium text-foreground">{rev.authorName}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {rev.roleOrProfession} {rev.companyOrSchool && `(${rev.companyOrSchool})`}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="flex items-center gap-1 font-bold text-amber-500">
                              <Star className="w-3.5 h-3.5 fill-amber-500" />
                              <span>{rev.rating}.0</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {rev.evidenceAttachment ? (
                              <Badge
                                variant="outline"
                                className={`text-[10px] py-0 h-4 ${
                                  rev.evidenceAttachment.verificationStatus === 'reviewed'
                                    ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10'
                                    : 'border-primary/40 text-primary bg-primary/5'
                                }`}
                              >
                                {rev.evidenceAttachment.verificationStatus === 'reviewed'
                                  ? 'Reviewed'
                                  : rev.evidenceAttachment.verificationStatus}
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">None</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {rev.conflictDisclosure && rev.conflictDisclosure.hasConflict ? (
                              <Badge variant="outline" className="text-[10px] py-0 h-4 border-amber-500/40 text-amber-600">
                                {rev.conflictDisclosure.relationshipType.replace('_', ' ')}
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">None</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] py-0 h-4 ${
                                rev.moderationStatus === 'approved'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : rev.moderationStatus === 'flagged'
                                  ? 'bg-destructive/10 text-destructive'
                                  : 'bg-amber-500/10 text-amber-600'
                              }`}
                            >
                              {rev.moderationStatus || 'approved'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedReview(rev);
                                      setModeratorNotesInput(rev.moderatorNotes || '');
                                    }}
                                    className="h-7 px-2 text-xs gap-1"
                                  >
                                    <Eye className="w-3 h-3" /> Moderate
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle className="text-base font-bold">
                                      Review Moderation: {rev.title}
                                    </DialogTitle>
                                    <DialogDescription className="text-xs">
                                      Product: {rev.productId} • Author: {rev.authorName} ({rev.roleOrProfession}) • Date: {rev.date}
                                    </DialogDescription>
                                  </DialogHeader>

                                  <div className="space-y-4 text-xs pt-2">
                                    <div className="p-3 rounded-lg bg-muted/40 space-y-1.5">
                                      <div className="flex items-center justify-between font-semibold text-foreground">
                                        <span>Review Body</span>
                                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                                          <span>{rev.rating}.0 / 5.0</span>
                                        </div>
                                      </div>
                                      <p className="text-muted-foreground leading-relaxed">{rev.reviewText}</p>
                                    </div>

                                    {/* Evidence Attachment Audit */}
                                    {rev.evidenceAttachment ? (
                                      <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold text-foreground flex items-center gap-1.5">
                                            <FileCheck className="w-4 h-4 text-emerald-500" />
                                            Attached Usage Evidence
                                          </span>
                                          <Badge variant="outline" className="text-[10px]">
                                            Privacy: {rev.evidenceAttachment.privacy}
                                          </Badge>
                                        </div>
                                        <div className="text-[11px] text-muted-foreground space-y-1">
                                          <div>File Name: <strong className="text-foreground">{rev.evidenceAttachment.fileName}</strong></div>
                                          <div>Type: {rev.evidenceAttachment.evidenceType} ({rev.evidenceAttachment.fileType})</div>
                                          <div>Size: {(rev.evidenceAttachment.fileSize / 1024).toFixed(1)} KB</div>
                                          <div>Current Verification Status: <Badge variant="secondary" className="text-[10px] ml-1">{rev.evidenceAttachment.verificationStatus}</Badge></div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-1">
                                          <Button
                                            size="sm"
                                            onClick={() => {
                                              const updated = adminReviews.map(r =>
                                                r.id === rev.id
                                                  ? {
                                                      ...r,
                                                      evidenceAttachment: {
                                                        ...r.evidenceAttachment!,
                                                        verificationStatus: 'reviewed' as const,
                                                      },
                                                    }
                                                  : r
                                              );
                                              setAdminReviews(updated);
                                              localStorage.setItem('aidetector_directory_user_reviews', JSON.stringify(updated));
                                              toast.success('Evidence verified and marked as Reviewed!');
                                            }}
                                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                          >
                                            <Check className="w-3 h-3" /> Mark Evidence Reviewed
                                          </Button>

                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const updated = adminReviews.map(r =>
                                                r.id === rev.id
                                                  ? {
                                                      ...r,
                                                      evidenceAttachment: {
                                                        ...r.evidenceAttachment!,
                                                        verificationStatus: 'insufficient' as const,
                                                      },
                                                    }
                                                  : r
                                              );
                                              setAdminReviews(updated);
                                              localStorage.setItem('aidetector_directory_user_reviews', JSON.stringify(updated));
                                              toast.info('Evidence marked as Insufficient.');
                                            }}
                                            className="h-7 text-xs text-muted-foreground"
                                          >
                                            Mark Insufficient
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="p-2.5 rounded-lg border border-border text-muted-foreground text-xs">
                                        No evidence attachment was submitted with this review.
                                      </div>
                                    )}

                                    {/* Moderator Internal Notes */}
                                    <div className="space-y-1.5">
                                      <label className="font-bold text-foreground block">
                                        Internal Moderation Notes (Private)
                                      </label>
                                      <Input
                                        value={moderatorNotesInput}
                                        onChange={e => setModeratorNotesInput(e.target.value)}
                                        placeholder="e.g., Verified against GitHub profile and enterprise billing..."
                                        className="h-8 text-xs bg-card"
                                      />
                                    </div>

                                    {/* Status Change Controls */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border">
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const updated = adminReviews.map(r =>
                                              r.id === rev.id
                                                ? {
                                                    ...r,
                                                    moderationStatus: 'flagged' as const,
                                                    moderatorNotes: moderatorNotesInput,
                                                  }
                                                : r
                                            );
                                            setAdminReviews(updated);
                                            localStorage.setItem('aidetector_directory_user_reviews', JSON.stringify(updated));
                                            toast.warning(`Review flagged for inspection.`);
                                          }}
                                          className="text-xs text-amber-600 hover:bg-amber-500/10 h-7"
                                        >
                                          Flag Review
                                        </Button>

                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const updated = adminReviews.map(r =>
                                              r.id === rev.id
                                                ? {
                                                    ...r,
                                                    moderationStatus: 'rejected' as const,
                                                    moderatorNotes: moderatorNotesInput,
                                                  }
                                                : r
                                            );
                                            setAdminReviews(updated);
                                            localStorage.setItem('aidetector_directory_user_reviews', JSON.stringify(updated));
                                            toast.error(`Review rejected and unlisted.`);
                                          }}
                                          className="text-xs text-destructive hover:bg-destructive/10 h-7"
                                        >
                                          Reject / Hide
                                        </Button>
                                      </div>

                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          const updated = adminReviews.map(r =>
                                            r.id === rev.id
                                              ? {
                                                  ...r,
                                                  moderationStatus: 'approved' as const,
                                                  moderatorNotes: moderatorNotesInput,
                                                }
                                              : r
                                          );
                                          setAdminReviews(updated);
                                          localStorage.setItem('aidetector_directory_user_reviews', JSON.stringify(updated));
                                          toast.success(`Review approved and published!`);
                                        }}
                                        className="text-xs bg-primary text-primary-foreground h-7 gap-1"
                                      >
                                        <Check className="w-3 h-3" /> Approve & Publish
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* User Abuse Reports Queue */}
          {reports.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Flag className="w-4 h-4 text-destructive" />
                  User Abuse & Integrity Reports ({reports.length})
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  User-reported reviews requiring moderation assessment.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-xs">Report ID</TableHead>
                        <TableHead className="text-xs">Target Review</TableHead>
                        <TableHead className="text-xs">Reason</TableHead>
                        <TableHead className="text-xs">Explanation</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map(rep => (
                        <TableRow key={rep.id} className="border-border hover:bg-muted/30">
                          <TableCell className="text-xs font-mono">{rep.id.slice(0, 10)}</TableCell>
                          <TableCell className="text-xs font-semibold">{rep.reviewId}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                              {rep.reason.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                            {rep.details}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{rep.reportedAt}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const next = reports.filter(r => r.id !== rep.id);
                                setReports(next);
                                localStorage.setItem('aidetector_directory_review_reports', JSON.stringify(next));
                                toast.success('Report resolved and cleared.');
                              }}
                              className="h-6 text-[11px] text-primary"
                            >
                              Dismiss Report
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 4: Factual Corrections & Outdated Reports Queue */}
        <TabsContent value="corrections" className="m-0 space-y-4">
          <Card className="bg-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Flag className="w-4 h-4 text-amber-500" />
                  Product Outdated Information & Corrections Queue
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Factual correction reports submitted by the community. Verify with official documentation before approving.
                </CardDescription>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant={correctionFilter === 'all' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCorrectionFilter('all')}
                  className="h-7 text-xs px-2"
                >
                  All ({corrections.length})
                </Button>
                <Button
                  variant={correctionFilter === 'pending' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCorrectionFilter('pending')}
                  className="h-7 text-xs px-2"
                >
                  Pending ({corrections.filter(c => c.status === 'pending').length})
                </Button>
                <Button
                  variant={correctionFilter === 'approved' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCorrectionFilter('approved')}
                  className="h-7 text-xs px-2"
                >
                  Approved ({corrections.filter(c => c.status === 'approved').length})
                </Button>
                <Button
                  variant={correctionFilter === 'rejected' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setCorrectionFilter('rejected')}
                  className="h-7 text-xs px-2"
                >
                  Rejected ({corrections.filter(c => c.status === 'rejected').length})
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-xs">Product</TableHead>
                      <TableHead className="text-xs">Field Reported</TableHead>
                      <TableHead className="text-xs">Current Value</TableHead>
                      <TableHead className="text-xs">Proposed Correction</TableHead>
                      <TableHead className="text-xs">Source Link</TableHead>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {corrections.filter(c => correctionFilter === 'all' || c.status === correctionFilter).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                          No correction reports matching this filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      corrections
                        .filter(c => correctionFilter === 'all' || c.status === correctionFilter)
                        .map(cor => (
                          <TableRow key={cor.id} className="border-border hover:bg-muted/30">
                            <TableCell className="font-semibold text-xs text-foreground uppercase">
                              {cor.productId}
                            </TableCell>
                            <TableCell className="text-xs">
                              <Badge variant="outline" className="text-[10px] py-0 h-4">
                                {cor.fieldLabel || cor.field}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                              {cor.currentValue}
                            </TableCell>
                            <TableCell className="text-xs font-medium text-foreground max-w-[200px] truncate">
                              {cor.proposedCorrection}
                            </TableCell>
                            <TableCell className="text-xs">
                              {cor.sourceUrl ? (
                                <a
                                  href={cor.sourceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1 text-[11px]"
                                >
                                  <span>Verify</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">None</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{cor.submittedAt}</TableCell>
                            <TableCell>
                              {cor.status === 'pending' && (
                                <Badge className="text-[10px] py-0 h-4 bg-amber-500/10 text-amber-500 border-amber-500/20">
                                  Pending
                                </Badge>
                              )}
                              {cor.status === 'approved' && (
                                <Badge className="text-[10px] py-0 h-4 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                  Approved
                                </Badge>
                              )}
                              {cor.status === 'rejected' && (
                                <Badge className="text-[10px] py-0 h-4 bg-destructive/10 text-destructive border-destructive/20">
                                  Rejected
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedCorrection(cor)}
                                      className="h-7 px-2 text-xs gap-1"
                                    >
                                      <Eye className="w-3 h-3" /> Audit
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle className="text-base font-bold">
                                        Audit Correction Report
                                      </DialogTitle>
                                      <DialogDescription className="text-xs">
                                        Product: {cor.productId.toUpperCase()} • Submitted: {cor.submittedAt}
                                      </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-3.5 text-xs pt-2">
                                      <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                                        <div className="text-[10px] uppercase font-bold text-muted-foreground">
                                          Currently Listed Value:
                                        </div>
                                        <p className="text-xs text-foreground font-medium">{cor.currentValue}</p>
                                      </div>

                                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
                                        <div className="text-[10px] uppercase font-bold text-primary">
                                          User Proposed Correction:
                                        </div>
                                        <p className="text-xs text-foreground font-medium">{cor.proposedCorrection}</p>
                                      </div>

                                      {cor.sourceUrl && (
                                        <div className="p-2.5 rounded-lg border border-border flex items-center justify-between">
                                          <span className="text-muted-foreground">Official Source Reference:</span>
                                          <a
                                            href={cor.sourceUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-primary hover:underline flex items-center gap-1 font-mono text-[11px]"
                                          >
                                            <span>Open Official URL</span>
                                            <ExternalLink className="w-3 h-3" />
                                          </a>
                                        </div>
                                      )}

                                      {cor.notes && (
                                        <div className="text-muted-foreground text-xs">
                                          <strong>Submitter Notes:</strong> {cor.notes}
                                        </div>
                                      )}

                                      {cor.submitterEmail && (
                                        <div className="text-muted-foreground text-[11px]">
                                          Submitter Contact: <code className="text-foreground">{cor.submitterEmail}</code>
                                        </div>
                                      )}

                                      <div className="flex items-center justify-between pt-3 border-t border-border">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const updated = corrections.map(c =>
                                              c.id === cor.id
                                                ? {
                                                    ...c,
                                                    status: 'rejected' as const,
                                                    resolvedAt: new Date().toISOString().split('T')[0],
                                                    resolutionNotes: 'Rejected: Unable to substantiate against official vendor documentation.',
                                                  }
                                                : c
                                            );
                                            setCorrections(updated);
                                            localStorage.setItem('aidetector_directory_corrections', JSON.stringify(updated));
                                            toast.info('Correction rejected.');
                                          }}
                                          className="text-xs text-destructive hover:bg-destructive/10 h-7"
                                        >
                                          Reject Correction
                                        </Button>

                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            const today = new Date().toISOString().split('T')[0];
                                            const updated = corrections.map(c =>
                                              c.id === cor.id
                                                ? {
                                                    ...c,
                                                    status: 'approved' as const,
                                                    resolvedAt: today,
                                                    resolutionNotes: 'Approved and patched into catalog.',
                                                  }
                                                : c
                                            );
                                            setCorrections(updated);
                                            localStorage.setItem('aidetector_directory_corrections', JSON.stringify(updated));

                                            // Also update product lastVerified date in state
                                            const updatedProducts = products.map(p =>
                                              p.id === cor.productId
                                                ? {
                                                    ...p,
                                                    lastVerified: today,
                                                    lastChecked: today,
                                                    freshness: {
                                                      lastVerifiedProductInfo: today,
                                                      lastVerifiedPricing: today,
                                                      lastUpdatedTimeline: today,
                                                    },
                                                  }
                                                : p
                                            );
                                            setProducts(updatedProducts);
                                            toast.success('Correction approved and freshness timestamp updated!');
                                          }}
                                          className="text-xs bg-primary text-primary-foreground h-7 gap-1"
                                        >
                                          <Check className="w-3 h-3" /> Approve & Update Freshness
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Catalog Quick Editor Modal */}
      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={open => !open && setEditingProduct(null)}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Edit className="w-4 h-4 text-primary" />
                Edit Catalog Specifications: {editingProduct.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update verified pricing, capabilities, research freshness dates, and source citations.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2 text-xs">
              {/* Basic Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Product Name</label>
                  <Input
                    value={editingProduct.name}
                    onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="h-8 text-xs bg-card"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Company / Vendor</label>
                  <Input
                    value={editingProduct.company}
                    onChange={e => setEditingProduct({ ...editingProduct, company: e.target.value })}
                    className="h-8 text-xs bg-card"
                  />
                </div>
              </div>

              {/* Pricing Specification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Pricing Model</label>
                  <Input
                    value={editingProduct.pricingModel}
                    onChange={e => setEditingProduct({ ...editingProduct, pricingModel: e.target.value as any })}
                    className="h-8 text-xs bg-card"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Pricing Summary</label>
                  <Input
                    value={editingProduct.pricingSummary}
                    onChange={e => setEditingProduct({ ...editingProduct, pricingSummary: e.target.value })}
                    className="h-8 text-xs bg-card"
                  />
                </div>
              </div>

              {/* Freshness Timestamps */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2.5">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Research Freshness Timestamps
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">Product Info Verified</label>
                    <Input
                      type="date"
                      value={editingProduct.freshness?.lastVerifiedProductInfo || editingProduct.lastVerified}
                      onChange={e =>
                        setEditingProduct({
                          ...editingProduct,
                          lastVerified: e.target.value,
                          freshness: {
                            ...(editingProduct.freshness || {
                              lastVerifiedProductInfo: e.target.value,
                              lastVerifiedPricing: editingProduct.lastVerified,
                              lastUpdatedTimeline: editingProduct.lastVerified,
                            }),
                            lastVerifiedProductInfo: e.target.value,
                          },
                        })
                      }
                      className="h-8 text-xs bg-card"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">Pricing Verified</label>
                    <Input
                      type="date"
                      value={editingProduct.freshness?.lastVerifiedPricing || editingProduct.lastVerified}
                      onChange={e =>
                        setEditingProduct({
                          ...editingProduct,
                          freshness: {
                            ...(editingProduct.freshness || {
                              lastVerifiedProductInfo: editingProduct.lastVerified,
                              lastVerifiedPricing: e.target.value,
                              lastUpdatedTimeline: editingProduct.lastVerified,
                            }),
                            lastVerifiedPricing: e.target.value,
                          },
                        })
                      }
                      className="h-8 text-xs bg-card"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">Timeline Updated</label>
                    <Input
                      type="date"
                      value={editingProduct.freshness?.lastUpdatedTimeline || editingProduct.lastUpdatedAt || editingProduct.lastVerified}
                      onChange={e =>
                        setEditingProduct({
                          ...editingProduct,
                          lastUpdatedAt: e.target.value,
                          freshness: {
                            ...(editingProduct.freshness || {
                              lastVerifiedProductInfo: editingProduct.lastVerified,
                              lastVerifiedPricing: editingProduct.lastVerified,
                              lastUpdatedTimeline: e.target.value,
                            }),
                            lastUpdatedTimeline: e.target.value,
                          },
                        })
                      }
                      className="h-8 text-xs bg-card"
                    />
                  </div>
                </div>
              </div>

              {/* Website URL */}
              <div className="space-y-1">
                <label className="font-bold text-foreground">Official Website URL</label>
                <Input
                  value={editingProduct.websiteUrl}
                  onChange={e => setEditingProduct({ ...editingProduct, websiteUrl: e.target.value })}
                  className="h-8 text-xs bg-card"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingProduct(null)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const updated = products.map(p =>
                      p.id === editingProduct.id ? editingProduct : p
                    );
                    setProducts(updated);
                    setEditingProduct(null);
                    toast.success(`Product "${editingProduct.name}" updated successfully!`);
                  }}
                  className="text-xs h-8 bg-primary text-primary-foreground gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Specifications</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

