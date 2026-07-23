import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Star, ShoppingCart, Check, Shield, Download,
  Users, Zap, ArrowRight, Loader2
} from 'lucide-react';
import { MARKETPLACE_PRODUCTS } from '@/data/siteData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

const REVIEWS = [
  { author: 'Sarah K.', avatar: '👩‍💼', rating: 5, date: 'May 28, 2026', text: 'Absolutely worth every dollar. Saved me hours of work and the quality is top notch.' },
  { author: 'James T.', avatar: '👨‍💻', rating: 5, date: 'May 21, 2026', text: 'Exactly what I was looking for. Well organized, ready to use right away.' },
  { author: 'Priya M.', avatar: '👩‍🚀', rating: 4, date: 'May 15, 2026', text: 'Very comprehensive. A few tweaks needed for my specific niche but overall excellent.' },
];

const FEATURES_MAP: Record<string, string[]> = {
  'AI Prompts': [
    'Instant copy & paste into any AI tool',
    'Categorized by use case and industry',
    'Optimized for ChatGPT, Claude & Gemini',
    'Lifetime updates included',
  ],
  'Business Plans': [
    'Complete Notion-based workspace',
    'Financial modeling templates',
    'Investor pitch deck framework',
    'KPI dashboard included',
  ],
  'Automation': [
    'Ready-to-import workflow files',
    'Step-by-step setup guide',
    'Works with n8n, Zapier & Make',
    '1-hour setup time',
  ],
  'Notion Systems': [
    'Pre-built Notion database templates',
    'Client & project management views',
    'Invoice tracking system',
    'Mobile-friendly layouts',
  ],
};

function getFeatures(category: string): string[] {
  return FEATURES_MAP[category] || [
    'Instant download after purchase',
    'Lifetime access and updates',
    'Step-by-step documentation',
    '30-day satisfaction guarantee',
  ];
}

export default function MarketplaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [buying, setBuying] = useState(false);

  const product = MARKETPLACE_PRODUCTS.find((p) => p.id === id);

  useEffect(() => {
    if (!product) navigate('/marketplace', { replace: true });
  }, [product, navigate]);

  const handlePurchase = async () => {
    if (!user) {
      navigate(`/signup?redirect=/marketplace/${id}`);
      return;
    }
    
    setBuying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('paystack-checkout', {
        body: {
          email: user.email,
          amount: product?.price || 0,
          metadata: {
            type: 'marketplace_purchase',
            product_id: product?.id,
          }
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (res.error) throw res.error;
      if (res.data?.data?.url) {
        window.open(res.data.data.url, '_blank');
      } else if (res.data?.error?.message) {
        throw new Error(res.data.error.message);
      } else if (res.data?.message) {
        throw new Error(res.data.message);
      }
    } catch (err: any) {
      console.error('Purchase error', err);
      const errorMsg = await err?.context?.text?.() || err.message;
      toast.error('Failed to initiate checkout: ' + errorMsg);
    } finally {
      setBuying(false);
    }
  };

  if (!product) return null;

  const related = MARKETPLACE_PRODUCTS.filter((p) => p.id !== product.id).slice(0, 3);
  const features = getFeatures(product.category);

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        {/* Back */}
        <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Left: image */}
          <div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-card">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.badge && (
                <div className="absolute top-3 left-3">
                  <Badge className="text-xs bg-primary text-primary-foreground shadow">{product.badge}</Badge>
                </div>
              )}
            </div>

            {/* Social proof */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { icon: Users, label: `${(product.reviewCount * 3).toLocaleString()}+ customers` },
                { icon: Download, label: 'Instant access' },
                { icon: Shield, label: '30-day guarantee' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 p-3 bg-secondary/40 rounded-xl border border-border text-center">
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: details */}
          <div className="flex flex-col">
            <Badge variant="outline" className="self-start text-xs text-muted-foreground border-border mb-3">
              {product.category}
            </Badge>
            <h1 className="text-2xl md:text-3xl font-bold text-navy text-balance leading-tight mb-3">
              {product.name}
            </h1>

            {/* Creator */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">{product.creatorAvatar}</span>
              <span className="text-sm text-muted-foreground">by <span className="font-medium text-foreground/80">{product.creator}</span></span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-warning text-warning' : 'text-muted'}`} />
                ))}
              </div>
              <span className="text-sm font-semibold text-navy">{product.rating}</span>
              <span className="text-sm text-muted-foreground">({product.reviewCount.toLocaleString()} reviews)</span>
            </div>

            <p className="text-sm text-foreground/75 leading-relaxed text-pretty mb-6">
              {product.description} Whether you're a solo founder, content creator, or agency — this is built to save you serious time and help you produce better results faster.
            </p>

            {/* Features */}
            <div className="flex flex-col gap-2 mb-6">
              {features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                  <div className="w-4 h-4 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-success" />
                  </div>
                  {f}
                </div>
              ))}
            </div>

            <Separator className="mb-5" />

            {/* Price + CTA */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-3xl font-bold text-navy">${product.price}</span>
                <span className="text-sm text-muted-foreground ml-1">one-time</span>
              </div>
              <Badge variant="outline" className="border-success/30 text-success bg-success/5 text-xs">
                Instant Download
              </Badge>
            </div>

            <Button
              className="w-full bg-primary text-primary-foreground h-11 text-base gap-2 mb-3"
              onClick={handlePurchase}
              disabled={buying}
            >
              {buying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />} 
              {buying ? 'Processing...' : `Buy Now — $${product.price}`}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Secure checkout · Instant access · 30-day money-back guarantee
            </p>
          </div>
        </div>

        {/* Reviews */}
        <div className="mb-12">
          <h2 className="text-lg font-bold text-navy mb-5">Customer Reviews</h2>

          {/* Rating summary */}
          <Card className="border-border shadow-card mb-5">
            <CardContent className="p-5 flex items-center gap-6">
              <div className="text-center shrink-0">
                <div className="text-4xl font-bold text-navy leading-none">{product.rating}</div>
                <div className="flex items-center gap-0.5 mt-1 justify-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'fill-warning text-warning' : 'text-muted'}`} />
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{product.reviewCount.toLocaleString()} reviews</div>
              </div>
              <Separator orientation="vertical" className="h-16" />
              <div className="flex-1 flex flex-col gap-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const pct = star === 5 ? 74 : star === 4 ? 18 : star === 3 ? 5 : star === 2 ? 2 : 1;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-4 text-right text-muted-foreground shrink-0">{star}</span>
                      <Star className="w-3 h-3 fill-warning text-warning shrink-0" />
                      <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                        <div className="bg-warning h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-7 text-muted-foreground shrink-0">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            {REVIEWS.map((r, i) => (
              <Card key={i} className="border-border shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center text-lg shrink-0">{r.avatar}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium text-navy text-sm">{r.author}</span>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: r.rating }).map((_, j) => (
                            <Star key={j} className="w-3 h-3 fill-warning text-warning" />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground ml-auto">{r.date}</span>
                      </div>
                      <p className="text-sm text-foreground/75 text-pretty">{r.text}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-navy">Related Products</h2>
              <Link to="/marketplace" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map((rel) => (
                <Link to={`/marketplace/${rel.id}`} key={rel.id}>
                  <Card className="h-full flex flex-col border-border shadow-card hover:shadow-hover transition-shadow group overflow-hidden">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={rel.image} alt={rel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <CardContent className="p-4 flex flex-col flex-1">
                      <h3 className="font-semibold text-navy text-sm text-balance group-hover:text-primary transition-colors mb-1">{rel.name}</h3>
                      <div className="flex items-center gap-1 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < Math.floor(rel.rating) ? 'fill-warning text-warning' : 'text-muted'}`} />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">({rel.reviewCount})</span>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                        <span className="font-bold text-navy">${rel.price}</span>
                        <div className="flex items-center gap-1 text-xs text-primary font-medium">
                          <Zap className="w-3 h-3" /> View Details
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
