import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { DirectoryHero } from '@/components/directory/DirectoryHero';
import { CategoryPills } from '@/components/directory/CategoryPills';
import { DirectoryFilterSidebar } from '@/components/directory/DirectoryFilterSidebar';
import { DirectoryMobileFilterSheet } from '@/components/directory/DirectoryMobileFilterSheet';
import { ProductCard } from '@/components/directory/ProductCard';
import { ComparisonTray } from '@/components/directory/ComparisonTray';
import { DiscoveryWizard } from '@/components/directory/DiscoveryWizard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, X, Sparkles, SlidersHorizontal, SearchX, ArrowRightLeft, ShieldCheck, Check } from 'lucide-react';
import { AI_DIRECTORY_PRODUCTS, getPopularComparisons } from '@/data/aiDirectoryData';
import type { DirectoryProduct, DirectoryFilterState, DirectorySortOption } from '@/types/directory';
import { generateDirectoryItemListSchema } from '@/lib/directorySeo';

export default function ToolsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search and Active Category from URL or State
  const initialSearch = searchParams.get('q') || searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';
  const initialSort = (searchParams.get('sort') as DirectorySortOption) || 'featured';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [sortOption, setSortOption] = useState<DirectorySortOption>(initialSort);

  const [filters, setFilters] = useState<DirectoryFilterState>({
    categories: initialCategory !== 'All' ? [initialCategory] : [],
    pricingModels: [],
    platforms: [],
    useCases: [],
    tags: [],
  });

  // Keep URL in sync
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (activeCategory !== 'All') params.set('category', activeCategory);
    if (sortOption !== 'featured') params.set('sort', sortOption);
    setSearchParams(params, { replace: true });
  }, [searchQuery, activeCategory, sortOption, setSearchParams]);

  // Handle category pill click
  const handleSelectCategory = (cat: string) => {
    setActiveCategory(cat);
    if (cat === 'All') {
      setFilters(prev => ({ ...prev, categories: [] }));
    } else {
      setFilters(prev => ({ ...prev, categories: [cat] }));
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveCategory('All');
    setSortOption('featured');
    setFilters({
      categories: [],
      pricingModels: [],
      platforms: [],
      useCases: [],
      tags: [],
      hasFreePlan: undefined,
      hasFreeTrial: undefined,
      apiAvailable: undefined,
      browserExtension: undefined,
      mobileApp: undefined,
      openSource: undefined,
      isOpenWeight: undefined,
      supportsOfflineHosting: undefined,
      licenseTypes: [],
      deploymentOptions: [],
      businessAvailability: undefined,
    });
  };

  // Compute active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.pricingModels.length > 0) count += filters.pricingModels.length;
    if (filters.platforms.length > 0) count += filters.platforms.length;
    if (filters.useCases.length > 0) count += filters.useCases.length;
    if (filters.categories.length > 0 && activeCategory === 'All') count += filters.categories.length;
    if (filters.hasFreePlan) count += 1;
    if (filters.hasFreeTrial) count += 1;
    if (filters.apiAvailable) count += 1;
    if (filters.browserExtension) count += 1;
    if (filters.mobileApp) count += 1;
    if (filters.openSource) count += 1;
    if (filters.isOpenWeight) count += 1;
    if (filters.supportsOfflineHosting) count += 1;
    if (filters.businessAvailability) count += 1;
    return count;
  }, [filters, activeCategory]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return AI_DIRECTORY_PRODUCTS.filter(product => {
      // Search matching across all factual fields
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesCompany = product.company.toLowerCase().includes(q);
        const matchesCategory = product.primaryCategory.toLowerCase().includes(q) || product.categories.some(c => c.toLowerCase().includes(q));
        const matchesDesc = product.description.toLowerCase().includes(q) || (product.summary && product.summary.toLowerCase().includes(q));
        const matchesTags = product.tags.some(t => t.toLowerCase().includes(q));
        const matchesUseCases = product.useCases.some(u => u.toLowerCase().includes(q));
        const matchesFeatures = product.features.some(f => f.toLowerCase().includes(q));

        if (!matchesName && !matchesCompany && !matchesCategory && !matchesDesc && !matchesTags && !matchesUseCases && !matchesFeatures) {
          return false;
        }
      }

      // Category Pill filtering
      if (activeCategory !== 'All') {
        const matchesPill = product.primaryCategory.toLowerCase() === activeCategory.toLowerCase() ||
          product.categories.some(c => c.toLowerCase() === activeCategory.toLowerCase());
        if (!matchesPill) return false;
      }

      // Sidebar Category Multi-select (if different from pill)
      if (filters.categories.length > 0 && activeCategory === 'All') {
        const matchesCat = filters.categories.some(cat =>
          product.primaryCategory.toLowerCase() === cat.toLowerCase() ||
          product.categories.some(c => c.toLowerCase() === cat.toLowerCase())
        );
        if (!matchesCat) return false;
      }

      // Pricing Models
      if (filters.pricingModels.length > 0) {
        if (!filters.pricingModels.includes(product.pricingModel)) return false;
      }

      // Free Plan
      if (filters.hasFreePlan && !product.hasFreePlan) return false;

      // Free Trial
      if (filters.hasFreeTrial && !product.hasFreeTrial) return false;

      // Platforms
      if (filters.platforms.length > 0) {
        const hasPlatform = filters.platforms.some(p => product.platforms.includes(p));
        if (!hasPlatform) return false;
      }

      // Use cases
      if (filters.useCases.length > 0) {
        const hasUseCase = filters.useCases.some(uc => product.useCases.includes(uc));
        if (!hasUseCase) return false;
      }

      // API Availability
      if (filters.apiAvailable && !product.apiAvailable) return false;

      // Browser Extension
      if (filters.browserExtension && !product.browserExtension) return false;

      // Mobile App
      if (filters.mobileApp && !product.mobileApp) return false;

      // Open Source
      if (filters.openSource && !product.openSource) return false;

      // Open Weight Model
      if (filters.isOpenWeight && !product.isOpenWeight) return false;

      // Offline / Local Hosting
      if (filters.supportsOfflineHosting && !product.supportsOfflineHosting) return false;

      // Business / Team
      if (filters.businessAvailability && !product.businessAvailability) return false;

      return true;
    });
  }, [searchQuery, activeCategory, filters]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (sortOption) {
      case 'name_asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'name_desc':
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case 'recently_updated':
        return list.sort((a, b) => b.lastVerified.localeCompare(a.lastVerified));
      case 'highest_rated':
        return list.sort((a, b) => {
          const ratingA = a.editorialAssessment?.rating ?? 0;
          const ratingB = b.editorialAssessment?.rating ?? 0;
          return ratingB - ratingA;
        });
      case 'featured':
      default:
        return list.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return a.name.localeCompare(b.name);
        });
    }
  }, [filteredProducts, sortOption]);

  // Data-driven category pills with counts
  const categoryPillsList = useMemo(() => {
    const allCount = AI_DIRECTORY_PRODUCTS.length;
    const catCounts: Record<string, number> = {};
    AI_DIRECTORY_PRODUCTS.forEach(p => {
      catCounts[p.primaryCategory] = (catCounts[p.primaryCategory] || 0) + 1;
    });

    const items = [{ name: 'All', count: allCount }];
    Object.keys(catCounts).sort().forEach(cat => {
      items.push({ name: cat, count: catCounts[cat] });
    });
    return items;
  }, []);

  const popularComparisons = getPopularComparisons();

  // Inject JSON-LD structured schema
  const itemListSchema = useMemo(() => {
    return generateDirectoryItemListSchema(AI_DIRECTORY_PRODUCTS);
  }, []);

  return (
    <MainLayout>
      {/* Structured SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <div className="min-h-screen bg-background pb-24">
        {/* Compact Hero with Search */}
        <DirectoryHero
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectProduct={prod => navigate(`/tools/${prod.id}`)}
          totalProductsCount={AI_DIRECTORY_PRODUCTS.length}
        />

        {/* Data-Driven Category Navigation */}
        <CategoryPills
          categories={categoryPillsList}
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
        />

        {/* Main Directory Workspace */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 lg:gap-8 items-start">
            {/* Desktop Filter Sidebar */}
            <aside className="hidden md:block md:col-span-1 bg-card border border-border/70 rounded-2xl p-5 sticky top-28 shadow-sm">
              <DirectoryFilterSidebar
                filters={filters}
                onFilterChange={setFilters}
                onResetFilters={handleResetFilters}
                activeFilterCount={activeFilterCount}
              />
            </aside>

            {/* Results Column */}
            <div className="col-span-full md:col-span-3 space-y-5">
              {/* Toolbar: Results Count, Discovery Wizard, Mobile Filter Drawer, Sort Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/40 p-3 sm:p-4 rounded-xl border border-border/60">
                <div className="flex items-center gap-2">
                  {/* Mobile Filter Drawer Trigger */}
                  <DirectoryMobileFilterSheet
                    filters={filters}
                    onFilterChange={setFilters}
                    onResetFilters={handleResetFilters}
                    activeFilterCount={activeFilterCount}
                    totalResultsCount={sortedProducts.length}
                  />

                  {/* Discovery Wizard */}
                  <DiscoveryWizard />

                  <Link to="/tools/submit">
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-dashed border-border hover:border-primary">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>Submit Tool</span>
                    </Button>
                  </Link>

                  <div className="text-xs sm:text-sm font-semibold text-foreground hidden sm:block">
                    <span>Showing </span>
                    <span className="text-primary font-bold">{sortedProducts.length}</span>
                    <span> {sortedProducts.length === 1 ? 'AI tool' : 'AI tools'}</span>
                    {activeCategory !== 'All' && (
                      <span className="text-muted-foreground"> in <span className="text-foreground font-medium">{activeCategory}</span></span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden sm:inline">Sort:</span>
                  <Select
                    value={sortOption}
                    onValueChange={(val: string) => setSortOption(val as DirectorySortOption)}
                  >
                    <SelectTrigger className="h-8 text-xs w-[160px] bg-card border-border">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="recently_updated">Recently Verified</SelectItem>
                      <SelectItem value="name_asc">Alphabetical (A–Z)</SelectItem>
                      <SelectItem value="name_desc">Alphabetical (Z–A)</SelectItem>
                      <SelectItem value="highest_rated">Editorial Rating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filter Chips */}
              {(activeFilterCount > 0 || searchQuery) && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground font-medium">Active filters:</span>
                  {searchQuery && (
                    <Badge variant="secondary" className="text-xs py-0.5 gap-1">
                      <span>Search: "{searchQuery}"</span>
                      <button type="button" onClick={() => setSearchQuery('')}>
                        <X className="w-3 h-3 hover:text-foreground" />
                      </button>
                    </Badge>
                  )}
                  {filters.pricingModels.map(model => (
                    <Badge key={model} variant="secondary" className="text-xs py-0.5 gap-1">
                      <span>{model}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFilters(prev => ({
                            ...prev,
                            pricingModels: prev.pricingModels.filter(m => m !== model),
                          }))
                        }
                      >
                        <X className="w-3 h-3 hover:text-foreground" />
                      </button>
                    </Badge>
                  ))}
                  {filters.platforms.map(p => (
                    <Badge key={p} variant="secondary" className="text-xs py-0.5 gap-1">
                      <span>{p}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFilters(prev => ({
                            ...prev,
                            platforms: prev.platforms.filter(item => item !== p),
                          }))
                        }
                      >
                        <X className="w-3 h-3 hover:text-foreground" />
                      </button>
                    </Badge>
                  ))}
                  {filters.hasFreePlan && (
                    <Badge variant="secondary" className="text-xs py-0.5 gap-1">
                      <span>Free Plan</span>
                      <button type="button" onClick={() => setFilters(prev => ({ ...prev, hasFreePlan: undefined }))}>
                        <X className="w-3 h-3 hover:text-foreground" />
                      </button>
                    </Badge>
                  )}
                  {filters.hasFreeTrial && (
                    <Badge variant="secondary" className="text-xs py-0.5 gap-1">
                      <span>Free Trial</span>
                      <button type="button" onClick={() => setFilters(prev => ({ ...prev, hasFreeTrial: undefined }))}>
                        <X className="w-3 h-3 hover:text-foreground" />
                      </button>
                    </Badge>
                  )}
                  {filters.apiAvailable && (
                    <Badge variant="secondary" className="text-xs py-0.5 gap-1">
                      <span>API Available</span>
                      <button type="button" onClick={() => setFilters(prev => ({ ...prev, apiAvailable: undefined }))}>
                        <X className="w-3 h-3 hover:text-foreground" />
                      </button>
                    </Badge>
                  )}
                  {filters.openSource && (
                    <Badge variant="secondary" className="text-xs py-0.5 gap-1">
                      <span>Open Source</span>
                      <button type="button" onClick={() => setFilters(prev => ({ ...prev, openSource: undefined }))}>
                        <X className="w-3 h-3 hover:text-foreground" />
                      </button>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="h-6 px-2 text-xs text-primary hover:text-primary/80"
                  >
                    Clear all
                  </Button>
                </div>
              )}

              {/* Product Grid */}
              {sortedProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {sortedProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                /* Empty state */
                <div className="text-center py-16 px-4 bg-card border border-border/80 rounded-2xl shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                    <SearchX className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1">No AI Tools Found</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4 text-pretty">
                    We couldn't find any tools matching your current search and filter combination. Try adjusting your query or resetting filters.
                  </p>
                  <Button
                    size="sm"
                    onClick={handleResetFilters}
                    className="h-8 text-xs bg-primary text-primary-foreground font-semibold"
                  >
                    Reset All Filters
                  </Button>
                </div>
              )}

              {/* Editorial / Compare Alternatives Section */}
              <div className="pt-10 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-foreground">
                      Editor's Selection: Popular Side-by-Side Comparisons
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Factual comparisons between leading alternatives across coding, assistants, and search.
                    </p>
                  </div>
                  <Link to="/tools/compare">
                    <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary/80 gap-1 hidden sm:flex">
                      <span>Custom Compare</span>
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {popularComparisons.map(pair => (
                    <Link
                      key={`${pair.id1}-${pair.id2}`}
                      to={`/compare/${pair.id1}-vs-${pair.id2}`}
                      className="p-3.5 rounded-xl bg-card border border-border/80 hover:border-primary/40 hover:bg-muted/30 transition-all flex items-center justify-between group shadow-sm"
                    >
                      <div>
                        <div className="font-semibold text-foreground text-xs group-hover:text-primary transition-colors">
                          {pair.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{pair.category}</div>
                      </div>
                      <Badge variant="outline" className="text-[10px] py-0 h-4 group-hover:border-primary/40 group-hover:text-primary transition-colors">
                        Compare
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Persistent Bottom Comparison Tray */}
        <ComparisonTray />
      </div>
    </MainLayout>
  );
}
