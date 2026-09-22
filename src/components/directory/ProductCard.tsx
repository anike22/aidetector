import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Sparkles,
  Layers,
  Globe,
  Code2,
  Smartphone,
  ShieldCheck,
  Check,
} from 'lucide-react';
import type { DirectoryProduct } from '@/types/directory';
import { useDirectoryCompare } from '@/context/DirectoryCompareContext';

interface ProductCardProps {
  product: DirectoryProduct;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { isInCompare, toggleCompare } = useDirectoryCompare();
  const isCompared = isInCompare(product.id);

  const getPricingBadgeVariant = () => {
    switch (product.pricingModel) {
      case 'Free':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'Freemium':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'Free Trial':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'Paid':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <Card className="h-full flex flex-col border border-border/80 shadow-sm hover:shadow-md transition-all duration-200 bg-card rounded-2xl overflow-hidden group">
      <CardContent className="p-5 flex flex-col h-full">
        {/* Top bar: Logo, Title, Owner Badge & Compare Checkbox */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-muted/80 border border-border/60 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
              {product.logo}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <Link
                  to={`/tools/${product.id}`}
                  className="font-bold text-foreground text-base hover:text-primary transition-colors truncate block"
                >
                  {product.name}
                </Link>
                {product.isOwnerProduct && (
                  <Badge variant="outline" className="text-[10px] py-0 h-4 border-primary/30 text-primary bg-primary/10 font-semibold">
                    AIDetector.cx Platform
                  </Badge>
                )}
                {product.featured && !product.isOwnerProduct && (
                  <Badge className="text-[10px] py-0 h-4 bg-muted text-muted-foreground border-border font-medium">
                    Featured
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground font-medium mt-0.5 truncate">
                by {product.company}
              </div>
            </div>
          </div>

          {/* Compare toggle in top-right */}
          <div className="flex items-center space-x-1.5 shrink-0 bg-muted/50 hover:bg-muted p-1.5 rounded-lg border border-border/40 transition-colors">
            <Checkbox
              id={`compare-${product.id}`}
              checked={isCompared}
              onCheckedChange={() => toggleCompare(product.id)}
              className="h-4 w-4"
            />
            <Label
              htmlFor={`compare-${product.id}`}
              className="text-[11px] font-medium text-muted-foreground cursor-pointer select-none"
            >
              Compare
            </Label>
          </div>
        </div>

        {/* Categories & tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="secondary" className="text-[11px] py-0 h-5 font-semibold bg-secondary text-secondary-foreground">
            {product.primaryCategory}
          </Badge>
          {product.isOpenWeight && (
            <Badge variant="outline" className="text-[10px] py-0 h-5 font-semibold text-primary border-primary/30 bg-primary/5">
              Open Weights
            </Badge>
          )}
          {product.supportsOfflineHosting && (
            <Badge variant="outline" className="text-[10px] py-0 h-5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5">
              Offline Hosting
            </Badge>
          )}
          {product.licenseType && product.licenseType !== 'Proprietary' && (
            <Badge variant="outline" className="text-[10px] py-0 h-5 text-muted-foreground border-border/60">
              {product.licenseType}
            </Badge>
          )}
          {product.tags.slice(0, 1).map(tag => (
            <Badge key={tag} variant="outline" className="text-[10px] py-0 h-5 text-muted-foreground border-border/60">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Factual description */}
        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-4 flex-1">
          {product.summary || product.description}
        </p>

        {/* Capabilities icons and pricing metadata */}
        <div className="space-y-2 mb-4 pt-2 border-t border-border/40 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-medium text-[11px]">Pricing Model:</span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getPricingBadgeVariant()}`}>
              {product.pricingModel}
            </span>
          </div>

          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-medium text-[11px]">Supported Platforms:</span>
            <span className="text-[11px] text-foreground font-medium truncate max-w-[170px] text-right">
              {product.platforms.slice(0, 3).join(', ')}
              {product.platforms.length > 3 ? ` +${product.platforms.length - 3}` : ''}
            </span>
          </div>

          <div className="flex items-center justify-between text-muted-foreground text-[10px] pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Verified: {product.lastVerified}
            </span>
            {product.hasFreePlan && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Free plan available
              </span>
            )}
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-border/60">
          <Link to={`/tools/${product.id}`} className="flex-1">
            <Button
              size="sm"
              className="w-full h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-sm"
            >
              <span>Read Review</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>

          {product.websiteUrl && (
            <a
              href={product.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
              title="Visit official website"
            >
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
