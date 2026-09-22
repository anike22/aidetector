import React, { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ArrowLeft,
  ExternalLink,
  Check,
  X,
  ShieldCheck,
  Layers,
  Sparkles,
  Calendar,
  Globe,
  Building,
  DollarSign,
  Cpu,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  ArrowRightLeft,
  Star,
  MessageSquare,
  Server,
  FileText,
  Clock,
  ThumbsUp,
} from 'lucide-react';
import {
  AI_DIRECTORY_PRODUCTS,
  getDirectoryProductByIdOrSlug,
} from '@/data/aiDirectoryData';
import { useDirectoryCompare } from '@/context/DirectoryCompareContext';
import { generateProductDetailSchema, generateBreadcrumbSchema } from '@/lib/directorySeo';
import { ProductStickyNav } from '@/components/directory/ProductStickyNav';
import { ProductAlternativesSection } from '@/components/directory/ProductAlternativesSection';
import { ProductEvolutionTimeline } from '@/components/directory/ProductEvolutionTimeline';
import { ProductFeatureMatrix } from '@/components/directory/ProductFeatureMatrix';
import { ProductUserReviewsSection } from '@/components/directory/ProductUserReviewsSection';
import { ProductAudienceUseCases } from '@/components/directory/ProductAudienceUseCases';
import { ProductFaqSection } from '@/components/directory/ProductFaqSection';
import { ProductFreshnessIndicators } from '@/components/directory/ProductFreshnessIndicators';
import { ProductSourcesSection } from '@/components/directory/ProductSourcesSection';
import { toast } from 'sonner';

export default function ToolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCompare, isInCompare } = useDirectoryCompare();

  const product = useMemo(() => {
    if (!id) return undefined;
    return getDirectoryProductByIdOrSlug(id);
  }, [id]);

  if (!product) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
          <div className="text-center max-w-md bg-card border border-border p-8 rounded-2xl shadow-sm">
            <Info className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h1 className="text-lg font-bold text-foreground mb-1">AI Tool Not Found</h1>
            <p className="text-xs text-muted-foreground mb-6 text-pretty">
              The AI tool you are looking for is either unlisted or has been moved. Browse our directory for verified alternatives.
            </p>
            <Link to="/tools">
              <Button size="sm" className="h-9 text-xs bg-primary text-primary-foreground font-semibold">
                Back to AI Directory
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Related products from same primary category
  const relatedTools = useMemo(() => {
    return AI_DIRECTORY_PRODUCTS.filter(
      p =>
        p.id !== product.id &&
        (p.primaryCategory === product.primaryCategory ||
          p.categories.some(c => product.categories.includes(c)))
    ).slice(0, 4);
  }, [product]);

  // Authentic user reviews calculation
  const totalUserReviews = product.userReviews?.length || 0;
  const averageUserRating =
    totalUserReviews > 0
      ? (product.userReviews!.reduce((acc, r) => acc + r.rating, 0) / totalUserReviews).toFixed(1)
      : null;

  // Sticky nav sections
  const navSections = useMemo(() => {
    const list = [
      { id: 'overview', label: 'Overview' },
      { id: 'at-a-glance', label: 'At a Glance' },
      { id: 'features', label: 'Features Analysis' },
    ];
    if (product.evolutionMilestones && product.evolutionMilestones.length > 0) {
      list.push({ id: 'evolution', label: 'Evolution Timeline' });
    }
    list.push({ id: 'pricing', label: 'Pricing & Plans' });
    if (product.audienceUseCases && product.audienceUseCases.length > 0) {
      list.push({ id: 'use-cases', label: 'Use Cases' });
    }
    list.push({ id: 'pros-cons', label: 'Pros & Cons' });
    list.push({ id: 'alternatives', label: 'Alternatives' });
    list.push({ id: 'compare', label: 'Compare' });
    list.push({ id: 'reviews', label: `Reviews (${totalUserReviews})` });
    if (product.faqs && product.faqs.length > 0) {
      list.push({ id: 'faq', label: 'FAQ' });
    }
    list.push({ id: 'sources', label: 'Sources & Provenance' });
    return list;
  }, [product, totalUserReviews]);

  // Structured schemas
  const productSchema = useMemo(() => generateProductDetailSchema(product), [product]);
  const breadcrumbSchema = useMemo(
    () =>
      generateBreadcrumbSchema([
        { name: 'Home', url: 'https://www.aidetector.cx/' },
        { name: 'AI Directory', url: 'https://www.aidetector.cx/tools' },
        { name: `${product.name} Review`, url: `https://www.aidetector.cx/tools/${product.id}` },
      ]),
    [product]
  );

  React.useEffect(() => {
    document.title = `${product.name} Review: Features, Pricing, Pros & Cons | AIDetector.cx`;
  }, [product.name]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <MainLayout>
      {/* Structured SEO Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="min-h-screen bg-background pb-20">
        {/* Breadcrumb Navigation */}
        <div className="border-b border-border bg-muted/30 py-3.5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Link to="/tools" className="hover:text-foreground transition-colors">AI Directory</Link>
              <span>/</span>
              <span className="text-foreground font-medium">{product.primaryCategory}</span>
              <span>/</span>
              <span className="text-foreground font-bold truncate max-w-[200px]">
                {product.name} Review
              </span>
            </nav>
          </div>
        </div>

        {/* Above-the-Fold Review Hero */}
        <div className="border-b border-border bg-card py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-muted border border-border flex items-center justify-center text-3xl sm:text-4xl shrink-0 shadow-sm">
                  {product.logo}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                      {product.name} Review
                    </h1>
                    {product.isOwnerProduct && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs py-0.5 font-semibold">
                        {product.ownerBadgeLabel || 'AIDetector.cx Platform'}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs py-0.5">
                      {product.primaryCategory}
                    </Badge>
                    {product.isOpenWeight && (
                      <Badge variant="outline" className="text-xs py-0.5 border-primary/40 text-primary">
                        Open Weights
                      </Badge>
                    )}
                    {product.supportsOfflineHosting && (
                      <Badge variant="outline" className="text-xs py-0.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                        Offline Hosting
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="font-semibold text-foreground">By {product.company}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Audited & Verified: {product.lastVerified}
                    </span>
                    <span>•</span>
                    {averageUserRating ? (
                      <span className="flex items-center gap-1 text-foreground font-medium">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <strong>{averageUserRating} / 5.0</strong> ({totalUserReviews} user reviews)
                      </span>
                    ) : (
                      <span className="text-muted-foreground">No user reviews yet</span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl text-pretty">
                    {product.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {product.tags.map(t => (
                      <Badge key={t} variant="outline" className="text-[10px] py-0 h-4 border-border">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action CTAs */}
              <div className="flex flex-wrap md:flex-col items-center gap-2.5 shrink-0 self-start w-full md:w-auto">
                <a
                  href={product.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button size="sm" className="w-full h-9 text-xs bg-primary text-primary-foreground font-semibold gap-1.5 shadow-sm">
                    <span>Visit Official Website</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </a>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addToCompare(product.id)}
                  className={`w-full sm:w-auto h-9 text-xs gap-1.5 ${
                    isInCompare(product.id) ? 'border-primary text-primary bg-primary/10' : ''
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isInCompare(product.id) ? 'Added to Compare' : 'Add to Compare'}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToSection('reviews')}
                  className="w-full sm:w-auto h-9 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Write a Review</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Sub-Navigation */}
        <ProductStickyNav sections={navSections} />

        {/* Main Content Layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Granular Freshness & Last Verified System Indicator */}
          <ProductFreshnessIndicators product={product} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Columns: Main Structured Review Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Section 1: Quick Decision Support ("At a Glance") */}
              <div id="at-a-glance" className="scroll-mt-24">
                <Card className="bg-card border-border rounded-2xl overflow-hidden shadow-sm">
                  <CardHeader className="p-4 sm:p-5 bg-muted/20 border-b border-border">
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      {product.name} at a Glance
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Key decision-support metrics and verified architecture specifications.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 rounded-xl bg-background border border-border space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                          Best Suited For
                        </span>
                        <p className="font-semibold text-foreground leading-relaxed">
                          {product.editorialAssessment?.bestFor || product.useCases.join(', ')}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-background border border-border space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                          Pricing Model & Free Tier
                        </span>
                        <p className="font-semibold text-foreground">
                          {product.pricingModel} • {product.hasFreePlan ? 'Permanent Free Plan Available' : 'No Free Tier'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-background border border-border space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                          Licensing & Deployment
                        </span>
                        <p className="font-semibold text-foreground">
                          {product.licenseType || 'Proprietary'} • {product.supportsOfflineHosting ? 'Offline / Local Capable' : 'Cloud SaaS Only'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-background border border-border space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                          Developer API & Workspaces
                        </span>
                        <p className="font-semibold text-foreground">
                          {product.apiAvailable ? 'Documented REST API' : 'No public API'} • {product.businessAvailability ? 'Team Workspaces' : 'Individual Accounts'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] block">
                          Verified Key Strengths
                        </span>
                        <ul className="space-y-0.5 text-muted-foreground">
                          {(product.editorialAssessment?.pros || product.features.slice(0, 3)).map((p, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                        <span className="font-bold text-amber-600 dark:text-amber-400 text-[11px] block">
                          Important Operational Boundaries
                        </span>
                        <ul className="space-y-0.5 text-muted-foreground">
                          {(product.editorialAssessment?.cons || product.limitations || ['High volume usage requires paid credits']).map((c, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Section 2: Overview & Editorial Assessment */}
              <div id="overview" className="space-y-6 scroll-mt-24">
                {product.editorialAssessment && (
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          ED
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-foreground">
                            {product.editorialAssessment.title}
                          </h2>
                          <span className="text-[11px] text-muted-foreground">
                            by {product.editorialAssessment.author}
                          </span>
                        </div>
                      </div>
                      {product.editorialAssessment.rating && (
                        <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">
                          <span className="text-xs font-bold text-primary">
                            {product.editorialAssessment.rating.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">/ 5.0 Editorial</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      <p>{product.editorialAssessment.summary}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Structured Feature Analysis & Capability Matrix */}
              <ProductFeatureMatrix
                productName={product.name}
                featureGroups={product.structuredFeatureGroups}
                availabilityMatrix={product.featureAvailabilityMatrix}
              />

              {/* Section 4: Product Evolution Timeline & Version Comparator */}
              {product.evolutionMilestones && product.evolutionMilestones.length > 0 && (
                <ProductEvolutionTimeline
                  productName={product.name}
                  milestones={product.evolutionMilestones}
                />
              )}

              {/* Section 5: Verified Pricing & Historical Changes */}
              <div id="pricing" className="space-y-6 scroll-mt-24">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-foreground">
                      Verified Pricing Tiers & Subscription Plans
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Audited against official vendor terms on {product.lastVerified}. No affiliate bias.
                  </p>
                </div>

                {product.pricingTiers && product.pricingTiers.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {product.pricingTiers.map(tier => (
                      <div
                        key={tier.name}
                        className={`p-4 rounded-2xl border flex flex-col justify-between ${
                          tier.highlight
                            ? 'bg-primary/5 border-primary ring-1 ring-primary/20 shadow-sm'
                            : 'bg-card border-border'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-foreground text-xs">{tier.name}</span>
                            {tier.highlight && (
                              <Badge className="text-[10px] py-0 h-4 bg-primary text-primary-foreground font-semibold">
                                Popular
                              </Badge>
                            )}
                          </div>
                          <div className="text-lg font-bold text-foreground mb-3">{tier.price}</div>
                          <ul className="space-y-1.5 text-xs text-muted-foreground">
                            {tier.features.map((f, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pricing History Sub-section */}
                {product.pricingHistory && product.pricingHistory.length > 0 && (
                  <Card className="bg-card border-border rounded-2xl p-5 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary" />
                      Documented Pricing History & Tier Shifts
                    </h3>
                    <div className="space-y-2.5 text-xs">
                      {product.pricingHistory.map((hist, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-muted/30 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] font-mono">
                                {hist.date}
                              </Badge>
                              <span className="font-bold text-foreground">{hist.event}</span>
                            </div>
                            <p className="text-muted-foreground text-xs mt-1">{hist.description}</p>
                          </div>
                          {hist.sourceUrl && (
                            <a
                              href={hist.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline text-xs flex items-center gap-0.5 shrink-0"
                            >
                              <span>Audit Source</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              {/* Section 6: Audience-Specific Use Cases */}
              <ProductAudienceUseCases
                productName={product.name}
                useCases={product.audienceUseCases}
              />

              {/* Section 7: Editorial Pros & Cons */}
              <div id="pros-cons" className="space-y-6 scroll-mt-24">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-foreground">
                      AIDetector.cx Editorial Pros & Cons Analysis
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Grounded evaluation derived from real performance testing and architectural verification.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-card border border-emerald-500/20 space-y-3 shadow-sm">
                    <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      Verified Advantages
                    </h3>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      {(product.editorialAssessment?.pros || product.features.slice(0, 4)).map((pro, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-foreground/90">{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-5 rounded-2xl bg-card border border-amber-500/20 space-y-3 shadow-sm">
                    <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      Known Operational Caveats
                    </h3>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      {(product.editorialAssessment?.cons || product.limitations || ['Usage caps apply during peak hours']).map((con, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span className="text-foreground/90">{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 8: Alternatives to Product */}
              <ProductAlternativesSection currentProduct={product} />

              {/* Section 8: Compare with Alternatives */}
              <div id="compare" className="space-y-6 scroll-mt-24">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <ArrowRightLeft className="w-4 h-4" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-foreground">
                      Compare {product.name} with Direct Alternatives
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Side-by-side feature comparisons, capability matrices, and pricing differentials.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {relatedTools.map(alt => (
                    <Link
                      key={alt.id}
                      to={`/compare/${product.id}-vs-${alt.id}`}
                      className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 hover:bg-muted/30 transition-all flex items-center justify-between group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{alt.logo}</span>
                        <div>
                          <div className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                            {product.name} vs {alt.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {alt.primaryCategory} • {alt.pricingModel}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary group-hover:translate-x-0.5 transition-transform">
                        <span>Compare</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Section 9: Verified User Reviews & Review Submission */}
              <ProductUserReviewsSection
                productId={product.id}
                productName={product.name}
                initialReviews={product.userReviews}
              />

              {/* Section 10: Frequently Asked Questions */}
              <ProductFaqSection
                productName={product.name}
                faqs={product.faqs}
              />

              {/* Section 11: Sources & Research Transparency */}
              <ProductSourcesSection product={product} />

              {/* Neutral User Review CTA Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-background to-muted border border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-sm">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">
                    Used {product.name}? Share your experience.
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Help other users understand where this product works well and where it doesn't.
                  </p>
                </div>
                <Button
                  onClick={() => scrollToSection('reviews')}
                  size="sm"
                  className="bg-primary text-primary-foreground font-semibold text-xs h-9 px-4 shrink-0 gap-1.5 shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Write a Review</span>
                </Button>
              </div>
            </div>

            {/* Right Column: Sticky Quick Specs & Direct Comparison Actions */}
            <div className="space-y-6">
              {/* Quick Specs Card */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Technical Specifications
                </h3>

                <div className="divide-y divide-border text-xs">
                  <div className="py-2 flex justify-between items-center">
                    <span className="text-muted-foreground">Provider / Company</span>
                    <span className="font-semibold text-foreground">{product.company}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center">
                    <span className="text-muted-foreground">Pricing Model</span>
                    <span className="font-semibold text-foreground">{product.pricingModel}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center">
                    <span className="text-muted-foreground">Free Tier</span>
                    <span className="font-semibold text-foreground">
                      {product.hasFreePlan ? 'Yes' : 'No permanent free plan'}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between items-center">
                    <span className="text-muted-foreground">Free Trial</span>
                    <span className="font-semibold text-foreground">{product.hasFreeTrial ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center">
                    <span className="text-muted-foreground">Platforms</span>
                    <span className="font-semibold text-foreground">{product.platforms.join(', ')}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center">
                    <span className="text-muted-foreground">Developer API</span>
                    <span className="font-semibold text-foreground">{product.apiAvailable ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center">
                    <span className="text-muted-foreground">Mobile App</span>
                    <span className="font-semibold text-foreground">{product.mobileApp ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center">
                    <span className="text-muted-foreground">Open Weights</span>
                    <span className="font-semibold text-foreground">{product.isOpenWeight ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center">
                    <span className="text-muted-foreground">License Architecture</span>
                    <span className="font-semibold text-foreground">{product.licenseType || 'Proprietary'}</span>
                  </div>
                  <div className="py-2 flex justify-between items-center">
                    <span className="text-muted-foreground">Offline / Local Hosting</span>
                    <span className="font-semibold text-foreground">
                      {product.supportsOfflineHosting ? 'Yes' : 'Cloud Only'}
                    </span>
                  </div>
                  <div className="py-2 flex justify-between items-center">
                    <span className="text-muted-foreground">Team Workspace</span>
                    <span className="font-semibold text-foreground">{product.businessAvailability ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Modalities
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {product.supportedModalities?.map(m => (
                      <Badge key={m} variant="secondary" className="text-[10px] py-0 h-4">
                        {m}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Compare Alternatives Quick Links */}
              {relatedTools.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Pairwise Comparisons
                  </h3>
                  <div className="space-y-2.5">
                    {relatedTools.map(alt => (
                      <Link
                        key={alt.id}
                        to={`/compare/${product.id}-vs-${alt.id}`}
                        className="p-3 rounded-xl bg-muted/30 border border-border/60 hover:border-primary/40 hover:bg-muted/50 transition-all flex items-center justify-between text-xs group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{alt.logo}</span>
                          <div>
                            <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {product.name} vs {alt.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground">{alt.pricingModel}</div>
                          </div>
                        </div>
                        <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
