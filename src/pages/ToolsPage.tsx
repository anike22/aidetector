import { useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Star, ArrowRight, SlidersHorizontal, X } from 'lucide-react';
import { AI_TOOLS, type AiTool } from '@/data/siteData';

const categories = ['All', 'Writing', 'Marketing', 'Video', 'Design', 'Coding', 'Automation', 'Business', 'Finance'];
const pricingFilters = ['All', 'Free', 'Freemium', 'Paid'];

// Extend sample data with more tools
const EXTENDED_TOOLS: AiTool[] = [
  ...AI_TOOLS,
  {
    id: '10',
    name: 'Notion AI',
    category: 'Business',
    description: 'AI-powered workspace for notes, docs, and databases with smart writing assistance.',
    rating: 4.6,
    reviewCount: 7400,
    pricing: '$10/mo',
    pricingType: 'paid',
    logo: '📓',
    tags: ['Productivity', 'Business'],
    url: '#',
  },
  {
    id: '11',
    name: 'Canva AI',
    category: 'Design',
    description: 'AI design tools for presentations, social media, and marketing materials.',
    rating: 4.7,
    reviewCount: 22000,
    pricing: 'Free / $15/mo',
    pricingType: 'freemium',
    logo: '🎭',
    tags: ['Design', 'Marketing'],
    url: '#',
    featured: true,
  },
  {
    id: '12',
    name: 'HeyGen',
    category: 'Video',
    description: 'Create AI-powered video content with realistic avatars and voice cloning.',
    rating: 4.5,
    reviewCount: 3100,
    pricing: '$29/mo',
    pricingType: 'paid',
    logo: '🎥',
    tags: ['Video', 'Marketing'],
    url: '#',
  },
];

function ToolCard({ tool }: { tool: AiTool }) {
  return (
    <Card className="h-full flex flex-col border-border shadow-card hover:shadow-hover transition-shadow group">
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">
            {tool.logo}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="font-semibold text-navy text-sm">{tool.name}</h3>
              {tool.featured && (
                <Badge className="text-xs bg-primary/10 text-primary border-primary/20 h-5">Featured</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                <span className="text-xs font-medium">{tool.rating}</span>
              </div>
              <span className="text-xs text-muted-foreground">({tool.reviewCount.toLocaleString()})</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="outline" className="text-xs text-muted-foreground border-border py-0">
            {tool.category}
          </Badge>
          {tool.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs text-muted-foreground border-border py-0">{tag}</Badge>
          ))}
        </div>

        <p className="text-sm text-muted-foreground flex-1 text-pretty mb-4 leading-relaxed">{tool.description}</p>

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            tool.pricingType === 'free'
              ? 'bg-success/10 text-success'
              : tool.pricingType === 'freemium'
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground'
          }`}>
            {tool.pricing}
          </span>
          <Link to={`/tools/${tool.id}`}>
            <Button size="sm" className="h-8 text-xs bg-primary text-primary-foreground gap-1 group-hover:bg-primary/90" onClick={() => {}}>
              Visit Tool <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ToolsPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [pricingFilter, setPricingFilter] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = EXTENDED_TOOLS.filter((tool) => {
    const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || tool.category === activeCategory;
    const matchesPricing = pricingFilter === 'All' || tool.pricingType === pricingFilter.toLowerCase();
    return matchesSearch && matchesCategory && matchesPricing;
  }).sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'reviews') return b.reviewCount - a.reviewCount;
    return 0;
  });

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Badge variant="outline" className="mb-3 text-primary border-primary/30 bg-primary/5">AI Tools</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-navy text-balance mb-2">AI Tools Directory</h1>
          <p className="text-muted-foreground text-pretty">Discover and compare the best AI tools for your business. {EXTENDED_TOOLS.length}+ tools reviewed.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <aside className={`lg:w-56 shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-20 flex flex-col gap-5">
              <div>
                <h3 className="font-semibold text-navy text-sm mb-3">Category</h3>
                <div className="flex flex-col gap-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        activeCategory === cat
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-navy text-sm mb-3">Pricing</h3>
                <div className="flex flex-col gap-1">
                  {pricingFilters.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPricingFilter(p)}
                      className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        pricingFilter === p
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {(activeCategory !== 'All' || pricingFilter !== 'All') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setActiveCategory('All'); setPricingFilter('All'); }}
                  className="justify-start text-muted-foreground hover:text-foreground gap-2"
                >
                  <X className="w-3.5 h-3.5" /> Clear Filters
                </Button>
              )}
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Search and Sort bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search tools..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 border-border"
                />
              </div>
              <div className="flex gap-2 shrink-0">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 h-10 border-border">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="reviews">Most Reviews</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-3 border-border lg:hidden text-foreground/70"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{filtered.length}</span> tools found
                {activeCategory !== 'All' && <> in <span className="font-medium text-primary">{activeCategory}</span></>}
              </p>
            </div>

            {/* Tools grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-semibold text-navy mb-1">No tools found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
