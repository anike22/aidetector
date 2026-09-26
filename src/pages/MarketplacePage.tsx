import { useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Star, ArrowRight, Eye, ShoppingCart } from 'lucide-react';
import { MARKETPLACE_PRODUCTS } from '@/data/siteData';

const categories = ['All', 'AI Prompts', 'Templates', 'Automation', 'Business Plans', 'Notion Systems', 'AI Agents'];

export default function MarketplacePage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('popular');

  const filtered = MARKETPLACE_PRODUCTS.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return b.reviewCount - a.reviewCount;
  });

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <Badge variant="outline" className="mb-3 text-success border-success/30 bg-success/5">Marketplace</Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-navy text-balance">Digital Products Marketplace</h1>
            <p className="text-muted-foreground mt-2 text-pretty">Premium AI prompts, templates, workflows, and business systems built by top creators.</p>
          </div>
        </div>

        {/* Hero banner */}
        <div className="bg-navy rounded-2xl p-6 md:p-10 mb-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(221_83%_53%/0.3)_0%,transparent_60%)] pointer-events-none" />
          <div className="relative max-w-lg">
            <Badge className="bg-warning/20 text-warning border-warning/30 mb-3">🔥 Trending This Week</Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 text-balance">Ultimate ChatGPT Prompt Pack</h2>
            <p className="text-white/70 text-sm mb-5 text-pretty">500+ battle-tested prompts for business, marketing, and content creation. Used by 1,000+ founders.</p>
            <div className="flex items-center gap-4">
              <Button className="bg-white text-navy hover:bg-white/90 h-10 gap-2" type="button" onClick={() => {}}>
                <ShoppingCart className="w-4 h-4" /> Get for $29
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-warning text-warning" />
                ))}
                <span className="text-white/70 text-sm ml-1">4.8 (342)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 border-border"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 h-10 border-border shrink-0">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-white text-foreground/60 border-border hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🛒</div>
            <p className="font-semibold text-navy mb-1">No products found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filtered.map((product) => (
              <Link to={`/marketplace/${product.id}`} key={product.id} className="flex">
                <Card className="h-full flex flex-col border-border shadow-card hover:shadow-hover transition-shadow group w-full">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.badge && (
                      <div className="absolute top-2 left-2">
                        <Badge className="text-xs bg-primary text-primary-foreground shadow-sm">{product.badge}</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 flex flex-col flex-1">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-lg shrink-0">{product.creatorAvatar}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-navy text-sm leading-snug text-balance group-hover:text-primary transition-colors">{product.name}</h3>
                        <div className="text-xs text-muted-foreground">by {product.creator}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="self-start text-xs text-muted-foreground border-border mb-2">{product.category}</Badge>
                    <p className="text-xs text-muted-foreground flex-1 text-pretty mb-3">{product.description}</p>
                    <div className="flex items-center gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating) ? 'fill-warning text-warning' : 'text-muted'}`} />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">({product.reviewCount})</span>
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                      <span className="font-bold text-navy text-base">${product.price}</span>
                      <Button
                        size="sm"
                        className="h-8 text-xs gap-1 bg-primary text-primary-foreground pointer-events-none"
                        tabIndex={-1}
                       onClick={() => {}}>
                        <Eye className="w-3 h-3" /> View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Bottom CTA — become a seller */}
        <div className="mt-16 border border-border rounded-2xl p-8 text-center bg-secondary/40">
          <div className="text-4xl mb-4">💰</div>
          <h2 className="text-2xl font-bold text-navy mb-2 text-balance">Sell Your AI Products Here</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6 text-pretty">
            Join 500+ creators earning from their AI prompts, templates, and workflows. Keep 85% of every sale.
          </p>
          <Link to="/sell">
            <Button className="bg-primary text-primary-foreground gap-2 h-10" onClick={() => {}}>
              Start Selling <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
