import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus, Loader2, Package, Edit2, Trash2, Eye, EyeOff,
  TrendingUp, DollarSign, Star, ArrowRight, CheckCircle2, ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import type { SellerProduct } from '@/types/types';

const CATEGORIES = [
  'AI Prompts', 'Templates', 'Automation', 'Business Plans',
  'Notion Systems', 'AI Agents', 'Courses', 'Other',
];

const PERKS = [
  'Keep 85% of every sale',
  'Instant digital delivery to buyers',
  'Global audience of 85K+ founders',
  'Real-time sales analytics',
  'No monthly fees — pay only on sales',
];

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  published: 'Live',
  archived: 'Archived',
};
const STATUS_COLORS: Record<string, string> = {
  draft: 'border-border text-muted-foreground',
  published: 'border-success/30 text-success bg-success/5',
  archived: 'border-border text-muted-foreground bg-muted/40',
};

interface FormState {
  name: string;
  description: string;
  category: string;
  price: string;
  image_url: string;
  demo_url: string;
  tags: string;
  status: 'draft' | 'published';
}

const EMPTY_FORM: FormState = {
  name: '', description: '', category: '', price: '',
  image_url: '', demo_url: '', tags: '', status: 'draft',
};

export default function SellPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SellerProduct | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  const fetchProducts = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('seller_products')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setProducts(data as SellerProduct[]);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [user]);

  const openCreate = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (p: SellerProduct) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      description: p.description,
      category: p.category,
      price: String(p.price),
      image_url: p.image_url || '',
      demo_url: p.demo_url || '',
      tags: p.tags.join(', '),
      status: p.status === 'archived' ? 'draft' : p.status,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.name.trim()) { toast.error('Product name is required.'); return; }
    if (!form.description.trim()) { toast.error('Description is required.'); return; }
    if (!form.category) { toast.error('Please select a category.'); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) { toast.error('Enter a valid price (0 for free).'); return; }

    setSubmitting(true);
    const payload = {
      seller_id: user.id,
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      price,
      image_url: form.image_url.trim() || null,
      demo_url: form.demo_url.trim() || null,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      status: form.status,
    };

    if (editingProduct) {
      const { error } = await supabase
        .from('seller_products')
        .update(payload)
        .eq('id', editingProduct.id);
      setSubmitting(false);
      if (error) { toast.error('Failed to update product.'); return; }
      toast.success('Product updated!');
    } else {
      const { error } = await supabase
        .from('seller_products')
        .insert(payload);
      setSubmitting(false);
      if (error) { toast.error('Failed to create product.'); return; }
      toast.success('Product created!');
    }

    setDialogOpen(false);
    fetchProducts();
  };

  const handleToggleStatus = async (p: SellerProduct) => {
    const next = p.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase
      .from('seller_products')
      .update({ status: next })
      .eq('id', p.id);
    if (error) { toast.error('Failed to update status.'); return; }
    toast.success(next === 'published' ? 'Product is now live!' : 'Product set to draft.');
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('seller_products')
      .delete()
      .eq('id', id);
    if (error) { toast.error('Failed to delete product.'); return; }
    toast.success('Product deleted.');
    setDeleteTarget(null);
    fetchProducts();
  };

  const totalRevenue = products
    .filter((p) => p.status === 'published')
    .reduce((sum, p) => sum + p.price * p.sales_count, 0);
  const publishedCount = products.filter((p) => p.status === 'published').length;
  const totalSales = products.reduce((sum, p) => sum + p.sales_count, 0);

  if (!user) return null;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">

        {/* ─── Hero: no products yet ─── */}
        {!loading && products.length === 0 && (
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-10">
              <div>
                <Badge variant="outline" className="mb-3 text-success border-success/30 bg-success/5">Become a Seller</Badge>
                <h1 className="text-3xl md:text-4xl font-bold text-navy text-balance mb-3">
                  Turn Your AI Expertise<br />Into Income
                </h1>
                <p className="text-muted-foreground text-sm text-pretty mb-6">
                  Sell your AI prompts, templates, workflows, and digital products to 85K+ founders and creators on our marketplace. Set your price, keep 85%.
                </p>
                <div className="flex flex-col gap-2.5 mb-6">
                  {PERKS.map((p) => (
                    <div key={p} className="flex items-center gap-2.5 text-sm text-foreground/80">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" /> {p}
                    </div>
                  ))}
                </div>
                <Button className="bg-primary text-primary-foreground gap-2 h-11" onClick={openCreate}>
                  <Plus className="w-4 h-4" /> List Your First Product
                </Button>
              </div>
              <div className="hidden md:grid grid-cols-2 gap-4">
                {[
                  { icon: DollarSign, label: 'Avg. monthly earnings', value: '$1,240' },
                  { icon: TrendingUp, label: 'Products on platform', value: '500+' },
                  { icon: Star, label: 'Avg. seller rating', value: '4.8 / 5' },
                  { icon: Package, label: 'Active buyers', value: '85K+' },
                ].map(({ icon: Icon, label, value }) => (
                  <Card key={label} className="border-border shadow-card h-full">
                    <CardContent className="p-4">
                      <Icon className="w-5 h-5 text-primary mb-2" />
                      <div className="text-xl font-bold text-navy">{value}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Seller dashboard (has products) ─── */}
        {products.length > 0 && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-navy">My Products</h1>
                <p className="text-sm text-muted-foreground">Manage your listings on the marketplace.</p>
              </div>
              <Button className="bg-primary text-primary-foreground gap-2 h-9" onClick={openCreate}>
                <Plus className="w-4 h-4" /> New Product
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Total Products', value: products.length, icon: Package },
                { label: 'Live Products', value: publishedCount, icon: Eye },
                { label: 'Total Sales', value: totalSales, icon: TrendingUp },
              ].map(({ label, value, icon: Icon }) => (
                <Card key={label} className="border-border shadow-card">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-navy">{value}</div>
                      <div className="text-xs text-muted-foreground">{label}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Estimated Revenue */}
            <Card className="border-primary/20 bg-primary/5 shadow-card mb-8">
              <CardContent className="p-4 flex items-center gap-4">
                <DollarSign className="w-6 h-6 text-primary shrink-0" />
                <div>
                  <div className="text-sm text-muted-foreground">Estimated Earnings (85% of sales)</div>
                  <div className="text-2xl font-bold text-navy">${(totalRevenue * 0.85).toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ─── Product list ─── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : products.length > 0 ? (
          <div className="flex flex-col gap-4">
            {products.map((p) => (
              <Card key={p.id} className="border-border shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    {p.image_url ? (
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-border">
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border">
                        <Package className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-navy text-sm truncate">{p.name}</h3>
                        <Badge variant="outline" className={`text-xs shrink-0 ${STATUS_COLORS[p.status]}`}>
                          {STATUS_LABELS[p.status]}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground text-pretty mb-2 line-clamp-2">{p.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-semibold text-navy">${p.price.toFixed(2)}</span>
                        <span>{p.category}</span>
                        <span>{p.sales_count} sales</span>
                        {p.demo_url && (
                          <a href={p.demo_url} target="_blank" rel="noopener noreferrer"
                             className="flex items-center gap-1 text-primary hover:underline">
                            Demo <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-border"
                        title={p.status === 'published' ? 'Unpublish' : 'Publish'}
                        onClick={() => handleToggleStatus(p)}
                      >
                        {p.status === 'published'
                          ? <EyeOff className="w-3.5 h-3.5" />
                          : <Eye className="w-3.5 h-3.5" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-border"
                        title="Edit"
                        onClick={() => openEdit(p)}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-destructive/30 text-destructive hover:bg-destructive/5"
                        title="Delete"
                        onClick={() => setDeleteTarget(p.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* View marketplace link */}
            <div className="text-center mt-4">
              <Link to="/marketplace">
                <Button variant="outline" className="gap-2 border-border h-9" onClick={() => {}}>
                  View Marketplace <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        ) : null}

        {/* ─── Create / Edit Dialog ─── */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'List a New Product'}</DialogTitle>
            </DialogHeader>

            <div className="flex flex-col gap-4 pt-2">
              {/* Name */}
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Product Name <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="e.g. Ultimate ChatGPT Prompt Pack"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="h-10 border-border"
                />
              </div>

              {/* Description */}
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Description <span className="text-destructive">*</span></Label>
                <Textarea
                  placeholder="Describe what buyers will get, what problems it solves, and why it's valuable…"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="min-h-[100px] border-border resize-none text-sm"
                />
              </div>

              {/* Category + Price row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Category <span className="text-destructive">*</span></Label>
                  <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                    <SelectTrigger className="h-10 border-border"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-normal mb-1.5 block">Price (USD) <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="29.00"
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                      className="h-10 border-border pl-7"
                    />
                  </div>
                </div>
              </div>

              {/* Image URL */}
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Product Image URL</Label>
                <Input
                  placeholder="https://example.com/product-preview.jpg"
                  value={form.image_url}
                  onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                  className="h-10 border-border"
                />
                <p className="text-xs text-muted-foreground mt-1">Paste a public image URL for the product thumbnail.</p>
              </div>

              {/* Demo URL */}
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Demo / Preview URL (optional)</Label>
                <Input
                  placeholder="https://notion.so/preview or YouTube link"
                  value={form.demo_url}
                  onChange={(e) => setForm((f) => ({ ...f, demo_url: e.target.value }))}
                  className="h-10 border-border"
                />
              </div>

              {/* Tags */}
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Tags (comma-separated)</Label>
                <Input
                  placeholder="ChatGPT, productivity, writing"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  className="h-10 border-border"
                />
              </div>

              {/* Status */}
              <div>
                <Label className="text-sm font-normal mb-1.5 block">Listing Status</Label>
                <Select value={form.status} onValueChange={(v: 'draft' | 'published') => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-10 border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft — save privately, not visible in marketplace</SelectItem>
                    <SelectItem value="published">Published — live in marketplace</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" className="border-border h-9" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-primary text-primary-foreground gap-2 h-9"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingProduct ? 'Save Changes' : 'Create Listing'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ─── Delete Confirm ─── */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
          <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this product?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the listing from the marketplace. This action cannot be undone.
              </AlertDialogDescription>
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
    </MainLayout>
  );
}
