import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useParams, Link, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Layers,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  HelpCircle,
  ArrowRightLeft,
  Filter,
} from 'lucide-react';
import {
  AI_DIRECTORY_PRODUCTS,
  getDirectoryProductByIdOrSlug,
  getPopularComparisons,
  parseVsPairSlug,
} from '@/data/aiDirectoryData';
import type { DirectoryProduct } from '@/types/directory';
import { useDirectoryCompare } from '@/context/DirectoryCompareContext';
import { generateBreadcrumbSchema } from '@/lib/directorySeo';

export default function ToolComparePage() {
  const [searchParams] = useSearchParams();
  const { vsPair } = useParams<{ vsPair?: string }>();
  const navigate = useNavigate();
  const { selectedProducts, removeFromCompare, addToCompare, clearCompare } = useDirectoryCompare();

  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);

  // Load tools from vsPair route or query params or context
  const [comparedProducts, setComparedProducts] = useState<DirectoryProduct[]>(() => {
    if (vsPair) {
      const { product1, product2 } = parseVsPairSlug(vsPair);
      if (product1 && product2) return [product1, product2];
    }
    const idsFromUrl = searchParams.get('ids')?.split(',').filter(Boolean) || [];
    if (idsFromUrl.length > 0) {
      const fromUrl = idsFromUrl
        .map(id => getDirectoryProductByIdOrSlug(id))
        .filter((p): p is DirectoryProduct => Boolean(p));
      if (fromUrl.length > 0) return fromUrl;
    }
    return selectedProducts.length > 0 ? selectedProducts : AI_DIRECTORY_PRODUCTS.slice(0, 3);
  });

  useEffect(() => {
    if (vsPair) {
      const { product1, product2 } = parseVsPairSlug(vsPair);
      if (product1 && product2) {
        setComparedProducts([product1, product2]);
        return;
      }
    }
    const idsFromUrl = searchParams.get('ids')?.split(',').filter(Boolean) || [];
    if (idsFromUrl.length > 0) {
      const fromUrl = idsFromUrl
        .map(id => getDirectoryProductByIdOrSlug(id))
        .filter((p): p is DirectoryProduct => Boolean(p));
      if (fromUrl.length > 0) {
        setComparedProducts(fromUrl);
        return;
      }
    }
    if (selectedProducts.length > 0) {
      setComparedProducts(selectedProducts);
    }
  }, [vsPair, searchParams, selectedProducts]);

  const handleRemove = (id: string) => {
    const updated = comparedProducts.filter(p => p.id !== id);
    setComparedProducts(updated);
    removeFromCompare(id);
  };

  const handleAddProduct = (id: string) => {
    if (comparedProducts.length >= 4) return;
    const prod = getDirectoryProductByIdOrSlug(id);
    if (prod && !comparedProducts.some(p => p.id === prod.id)) {
      const updated = [...comparedProducts, prod];
      setComparedProducts(updated);
      addToCompare(prod.id);
    }
  };

  const handleSwap = (idx: number, newId: string) => {
    const newProd = getDirectoryProductByIdOrSlug(newId);
    if (!newProd) return;
    const updated = [...comparedProducts];
    updated[idx] = newProd;
    setComparedProducts(updated);
  };

  const availableToAdd = AI_DIRECTORY_PRODUCTS.filter(
    p => !comparedProducts.some(cp => cp.id === p.id)
  );

  const popularComparisons = getPopularComparisons();

  // Helper to determine if an attribute differs across compared products
  const isDifferent = (getter: (p: DirectoryProduct) => any) => {
    if (comparedProducts.length <= 1) return false;
    const firstVal = JSON.stringify(getter(comparedProducts[0]));
    return comparedProducts.some(p => JSON.stringify(getter(p)) !== firstVal);
  };

  const rows = [
    {
      id: 'summary',
      label: 'Summary / Purpose',
      isDiff: isDifferent(p => p.summary || p.description),
      render: (product: DirectoryProduct) => (
        <span className="text-muted-foreground leading-relaxed">{product.summary || product.description}</span>
      ),
    },
    {
      id: 'category',
      label: 'Primary Category',
      isDiff: isDifferent(p => p.primaryCategory),
      render: (product: DirectoryProduct) => (
        <Badge variant="secondary" className="text-xs">{product.primaryCategory}</Badge>
      ),
    },
    {
      id: 'pricingModel',
      label: 'Pricing Model',
      isDiff: isDifferent(p => p.pricingModel),
      render: (product: DirectoryProduct) => (
        <div>
          <div className="font-semibold text-foreground text-xs">{product.pricingModel}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{product.pricingSummary}</div>
        </div>
      ),
    },
    {
      id: 'freePlan',
      label: 'Free Tier Available',
      isDiff: isDifferent(p => p.hasFreePlan),
      render: (product: DirectoryProduct) => (
        <div className="flex items-center gap-1.5 font-medium text-xs">
          {product.hasFreePlan ? (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Yes (Free tier)
            </span>
          ) : (
            <span className="text-muted-foreground flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> No permanent free tier
            </span>
          )}
        </div>
      ),
    },
    {
      id: 'freeTrial',
      label: 'Free Trial',
      isDiff: isDifferent(p => p.hasFreeTrial),
      render: (product: DirectoryProduct) => (
        <div className="flex items-center gap-1.5 text-xs">
          {product.hasFreeTrial ? (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Free trial available
            </span>
          ) : (
            <span className="text-muted-foreground">None</span>
          )}
        </div>
      ),
    },
    {
      id: 'modalities',
      label: 'Supported Modalities',
      isDiff: isDifferent(p => p.supportedModalities?.sort().join(',')),
      render: (product: DirectoryProduct) => (
        <div className="flex flex-wrap gap-1">
          {product.supportedModalities?.map(m => (
            <Badge key={m} variant="outline" className="text-[10px] py-0 h-4">
              {m}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: 'platforms',
      label: 'Platform Availability',
      isDiff: isDifferent(p => p.platforms.sort().join(',')),
      render: (product: DirectoryProduct) => (
        <div className="space-y-1">
          <div className="text-foreground font-medium text-xs">{product.platforms.join(', ')}</div>
          <div className="flex flex-wrap gap-1 pt-0.5">
            {product.apiAvailable && <Badge variant="secondary" className="text-[10px] py-0 h-4">API</Badge>}
            {product.browserExtension && <Badge variant="secondary" className="text-[10px] py-0 h-4">Extension</Badge>}
            {product.mobileApp && <Badge variant="secondary" className="text-[10px] py-0 h-4">Mobile App</Badge>}
            {product.openSource && <Badge variant="outline" className="text-[10px] py-0 h-4 text-emerald-600 border-emerald-500/30">Open Source</Badge>}
          </div>
        </div>
      ),
    },
    {
      id: 'openWeightLicense',
      label: 'Open Weights & Licensing',
      isDiff: isDifferent(p => `${p.isOpenWeight}-${p.licenseType}`),
      render: (product: DirectoryProduct) => (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-foreground">
            {product.isOpenWeight ? (
              <span className="text-primary flex items-center gap-1 font-semibold">
                <Check className="w-3.5 h-3.5 text-primary" /> Open Weights
              </span>
            ) : (
              <span className="text-muted-foreground">Proprietary / Closed</span>
            )}
          </div>
          {product.licenseType && (
            <Badge variant="outline" className="text-[10px] py-0 h-4 border-border/70">
              License: {product.licenseType}
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: 'offlineHosting',
      label: 'Offline & Air-Gapped Hosting',
      isDiff: isDifferent(p => `${p.supportsOfflineHosting}-${p.deploymentOptions?.join(',')}`),
      render: (product: DirectoryProduct) => (
        <div className="space-y-1">
          <div className="text-xs font-semibold">
            {product.supportsOfflineHosting ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                <Check className="w-3.5 h-3.5 text-emerald-500" /> Supports Local / Offline
              </span>
            ) : (
              <span className="text-muted-foreground">Cloud SaaS Only</span>
            )}
          </div>
          {product.deploymentOptions && product.deploymentOptions.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {product.deploymentOptions.map(opt => (
                <Badge key={opt} variant="secondary" className="text-[9px] py-0 h-3.5">
                  {opt}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'apiAvailable',
      label: 'Developer API',
      isDiff: isDifferent(p => p.apiAvailable),
      render: (product: DirectoryProduct) => (
        <div className="text-xs font-medium">
          {product.apiAvailable ? (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Documented REST API
            </span>
          ) : (
            <span className="text-muted-foreground">No public API</span>
          )}
        </div>
      ),
    },
    {
      id: 'businessAvailability',
      label: 'Team / Enterprise Workspace',
      isDiff: isDifferent(p => p.businessAvailability),
      render: (product: DirectoryProduct) => (
        <div className="text-xs font-medium">
          {product.businessAvailability ? (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Team workspaces & central billing
            </span>
          ) : (
            <span className="text-muted-foreground">Individual accounts only</span>
          )}
        </div>
      ),
    },
    {
      id: 'useCases',
      label: 'Primary Use Cases',
      isDiff: isDifferent(p => p.useCases.join(',')),
      render: (product: DirectoryProduct) => (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {product.useCases.map(uc => (
            <li key={uc} className="flex items-start gap-1">
              <span className="text-primary font-bold">•</span>
              <span>{uc}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: 'strengths',
      label: 'Verified Strengths',
      isDiff: true,
      render: (product: DirectoryProduct) => (
        <ul className="space-y-1 text-xs text-emerald-700 dark:text-emerald-400">
          {(product.editorialAssessment?.pros || product.features.slice(0, 3)).map((pro, i) => (
            <li key={i} className="flex items-start gap-1">
              <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
              <span>{pro}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: 'limitations',
      label: 'Known Limitations / Cons',
      isDiff: true,
      render: (product: DirectoryProduct) => (
        <ul className="space-y-1 text-xs text-amber-700 dark:text-amber-400">
          {(product.editorialAssessment?.cons || product.limitations || []).map((con, i) => (
            <li key={i} className="flex items-start gap-1">
              <span className="text-amber-500 font-bold shrink-0">•</span>
              <span>{con}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: 'verification',
      label: 'Data Provenance & Verification',
      isDiff: false,
      render: (product: DirectoryProduct) => (
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>Verified: {product.lastVerified}</span>
          </div>
          {product.sourceReferences && product.sourceReferences.length > 0 && (
            <div className="text-[11px] text-muted-foreground pt-0.5">
              Source: <span className="font-medium text-foreground">{product.sourceReferences[0].title}</span>
            </div>
          )}
        </div>
      ),
    },
  ];

  const visibleRows = showOnlyDifferences ? rows.filter(r => r.isDiff) : rows;

  return (
    <MainLayout>
      <div className="min-h-screen bg-background pb-20">
        {/* Top Header */}
        <div className="border-b border-border bg-muted/30 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <Link
                  to="/tools"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-2 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Directory</span>
                </Link>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                    {comparedProducts.length === 2
                      ? `${comparedProducts[0].name} vs ${comparedProducts[1].name} Comparison`
                      : 'Side-by-Side AI Tool Comparison'}
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 text-pretty">
                  Objective, factual breakdown of capabilities, pricing tiers, platform support, and technical limits.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                {/* Differences Only Toggle */}
                <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-xl text-xs">
                  <Switch
                    id="diff-toggle"
                    checked={showOnlyDifferences}
                    onCheckedChange={setShowOnlyDifferences}
                  />
                  <Label htmlFor="diff-toggle" className="text-xs font-semibold cursor-pointer text-foreground">
                    Show only differences
                  </Label>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCompare}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {comparedProducts.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border rounded-2xl shadow-sm">
              <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h2 className="text-base font-bold text-foreground mb-1">No Tools Selected for Comparison</h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-5 text-pretty">
                Select 2 to 4 AI tools from the directory to inspect their technical capabilities and pricing side by side.
              </p>
              <Link to="/tools">
                <Button size="sm" className="h-9 text-xs bg-primary text-primary-foreground font-semibold">
                  Go to AI Directory
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Add product quick selector if < 4 */}
              {comparedProducts.length < 4 && availableToAdd.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/40 rounded-xl border border-border/60 text-xs">
                  <span className="font-semibold text-foreground">Add to comparison ({comparedProducts.length}/4):</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {availableToAdd.slice(0, 6).map(prod => (
                      <Button
                        key={prod.id}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddProduct(prod.id)}
                        className="h-7 px-2 text-xs bg-card hover:bg-muted gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{prod.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Comparison Table */}
              <div className="overflow-x-auto pb-4">
                <table className="w-full border-collapse text-left text-xs bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 divide-x divide-border">
                      <th className="p-4 w-44 min-w-[170px] font-bold text-foreground text-xs uppercase tracking-wider sticky left-0 bg-muted/90 backdrop-blur z-10">
                        Feature / Metric
                      </th>
                      {comparedProducts.map((product, idx) => (
                        <th key={product.id} className="p-4 min-w-[240px] max-w-[320px] align-top relative">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-xl shrink-0 shadow-sm">
                              {product.logo}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemove(product.id)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive rounded-full"
                              title="Remove from comparison"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="font-bold text-foreground text-sm mb-0.5">{product.name}</div>
                          <div className="text-[11px] text-muted-foreground font-medium mb-2">by {product.company}</div>
                          <div className="flex flex-wrap gap-1 mb-3">
                            <Badge variant="secondary" className="text-[10px] py-0 h-4">
                              {product.primaryCategory}
                            </Badge>
                            {product.isOwnerProduct && (
                              <Badge variant="outline" className="text-[10px] py-0 h-4 border-primary/30 text-primary bg-primary/10">
                                Platform
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Link to={`/tools/${product.id}`} className="flex-1">
                              <Button size="sm" className="w-full h-7 text-xs bg-primary text-primary-foreground font-semibold">
                                Read Review
                              </Button>
                            </Link>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {visibleRows.map(row => (
                      <tr key={row.id} className="divide-x divide-border hover:bg-muted/30 transition-colors">
                        <td className="p-3.5 font-semibold text-foreground bg-muted/20 sticky left-0 backdrop-blur z-10">
                          <div className="flex items-center justify-between gap-1">
                            <span>{row.label}</span>
                            {row.isDiff && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" title="Values differ" />
                            )}
                          </div>
                        </td>
                        {comparedProducts.map(product => (
                          <td key={product.id} className="p-3.5 align-top">
                            {row.render(product)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Popular Comparisons Quick Links */}
              <div className="pt-8 border-t border-border">
                <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">
                  Compare Other Popular Alternatives
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {popularComparisons.map(pair => (
                    <Link
                      key={`${pair.id1}-${pair.id2}`}
                      to={`/compare/${pair.id1}-vs-${pair.id2}`}
                      className="p-3 rounded-xl bg-card border border-border/80 hover:border-primary/40 hover:bg-muted/30 transition-all flex items-center justify-between text-xs group"
                    >
                      <div>
                        <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {pair.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{pair.category}</div>
                      </div>
                      <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
