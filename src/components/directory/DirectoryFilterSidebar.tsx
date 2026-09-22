import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RotateCcw, Filter, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { DirectoryFilterState, PricingModel, PlatformType } from '@/types/directory';
import { getDirectoryCategories, getDirectoryPlatforms, getDirectoryUseCases } from '@/data/aiDirectoryData';

interface DirectoryFilterSidebarProps {
  filters: DirectoryFilterState;
  onFilterChange: (newFilters: DirectoryFilterState) => void;
  onResetFilters: () => void;
  activeFilterCount: number;
}

const PRICING_MODELS: PricingModel[] = [
  'Free',
  'Freemium',
  'Paid',
  'Free Trial',
  'Enterprise / Contact Sales',
];

export const DirectoryFilterSidebar: React.FC<DirectoryFilterSidebarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  activeFilterCount,
}) => {
  const allCategories = getDirectoryCategories();
  const allPlatforms = getDirectoryPlatforms() as PlatformType[];
  const allUseCases = getDirectoryUseCases();

  const handlePricingToggle = (model: PricingModel) => {
    const updated = filters.pricingModels.includes(model)
      ? filters.pricingModels.filter(m => m !== model)
      : [...filters.pricingModels, model];
    onFilterChange({ ...filters, pricingModels: updated });
  };

  const handlePlatformToggle = (platform: PlatformType) => {
    const updated = filters.platforms.includes(platform)
      ? filters.platforms.filter(p => p !== platform)
      : [...filters.platforms, platform];
    onFilterChange({ ...filters, platforms: updated });
  };

  const handleUseCaseToggle = (uc: string) => {
    const updated = filters.useCases.includes(uc)
      ? filters.useCases.filter(u => u !== uc)
      : [...filters.useCases, uc];
    onFilterChange({ ...filters, useCases: updated });
  };

  const handleCategoryToggle = (cat: string) => {
    const updated = filters.categories.includes(cat)
      ? filters.categories.filter(c => c !== cat)
      : [...filters.categories, cat];
    onFilterChange({ ...filters, categories: updated });
  };

  return (
    <div className="w-full space-y-6">
      {/* Header with clear button */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Filters</h2>
          {activeFilterCount > 0 && (
            <Badge variant="default" className="text-xs px-1.5 py-0 h-5 bg-primary text-primary-foreground">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
        )}
      </div>

      {/* Quick Toggles */}
      <div className="space-y-3 pt-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Availability & Access</h3>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="free-plan-switch" className="text-xs font-medium cursor-pointer">
              Free Plan Available
            </Label>
            <Switch
              id="free-plan-switch"
              checked={filters.hasFreePlan === true}
              onCheckedChange={checked =>
                onFilterChange({ ...filters, hasFreePlan: checked ? true : undefined })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="free-trial-switch" className="text-xs font-medium cursor-pointer">
              Free Trial Available
            </Label>
            <Switch
              id="free-trial-switch"
              checked={filters.hasFreeTrial === true}
              onCheckedChange={checked =>
                onFilterChange({ ...filters, hasFreeTrial: checked ? true : undefined })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="api-switch" className="text-xs font-medium cursor-pointer">
              Developer API
            </Label>
            <Switch
              id="api-switch"
              checked={filters.apiAvailable === true}
              onCheckedChange={checked =>
                onFilterChange({ ...filters, apiAvailable: checked ? true : undefined })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="browser-ext-switch" className="text-xs font-medium cursor-pointer">
              Browser Extension
            </Label>
            <Switch
              id="browser-ext-switch"
              checked={filters.browserExtension === true}
              onCheckedChange={checked =>
                onFilterChange({ ...filters, browserExtension: checked ? true : undefined })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="mobile-app-switch" className="text-xs font-medium cursor-pointer">
              Mobile App (iOS / Android)
            </Label>
            <Switch
              id="mobile-app-switch"
              checked={filters.mobileApp === true}
              onCheckedChange={checked =>
                onFilterChange({ ...filters, mobileApp: checked ? true : undefined })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="open-source-switch" className="text-xs font-medium cursor-pointer">
              Open-Source Status
            </Label>
            <Switch
              id="open-source-switch"
              checked={filters.openSource === true}
              onCheckedChange={checked =>
                onFilterChange({ ...filters, openSource: checked ? true : undefined })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="open-weight-switch" className="text-xs font-medium cursor-pointer text-foreground font-semibold">
              Open-Weights Models Only
            </Label>
            <Switch
              id="open-weight-switch"
              checked={filters.isOpenWeight === true}
              onCheckedChange={checked =>
                onFilterChange({ ...filters, isOpenWeight: checked ? true : undefined })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="offline-hosting-switch" className="text-xs font-medium cursor-pointer text-foreground font-semibold">
              Supports Offline / Local Hosting
            </Label>
            <Switch
              id="offline-hosting-switch"
              checked={filters.supportsOfflineHosting === true}
              onCheckedChange={checked =>
                onFilterChange({ ...filters, supportsOfflineHosting: checked ? true : undefined })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="business-team-switch" className="text-xs font-medium cursor-pointer">
              Team / Business Plans
            </Label>
            <Switch
              id="business-team-switch"
              checked={filters.businessAvailability === true}
              onCheckedChange={checked =>
                onFilterChange({ ...filters, businessAvailability: checked ? true : undefined })
              }
            />
          </div>
        </div>
      </div>

      {/* Pricing Models */}
      <div className="space-y-2.5 pt-3 border-t border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pricing Model</h3>
        <div className="space-y-2">
          {PRICING_MODELS.map(model => (
            <div key={model} className="flex items-center space-x-2">
              <Checkbox
                id={`pricing-${model}`}
                checked={filters.pricingModels.includes(model)}
                onCheckedChange={() => handlePricingToggle(model)}
              />
              <Label
                htmlFor={`pricing-${model}`}
                className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {model}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Platforms */}
      <div className="space-y-2.5 pt-3 border-t border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Platforms</h3>
        <div className="space-y-2">
          {allPlatforms.map(platform => (
            <div key={platform} className="flex items-center space-x-2">
              <Checkbox
                id={`platform-${platform}`}
                checked={filters.platforms.includes(platform)}
                onCheckedChange={() => handlePlatformToggle(platform)}
              />
              <Label
                htmlFor={`platform-${platform}`}
                className="text-xs font-medium leading-none cursor-pointer"
              >
                {platform}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Primary Use Cases */}
      <div className="space-y-2.5 pt-3 border-t border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Primary Use Case</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {allUseCases.map(uc => (
            <div key={uc} className="flex items-center space-x-2">
              <Checkbox
                id={`usecase-${uc}`}
                checked={filters.useCases.includes(uc)}
                onCheckedChange={() => handleUseCaseToggle(uc)}
              />
              <Label
                htmlFor={`usecase-${uc}`}
                className="text-xs font-medium leading-none cursor-pointer truncate"
              >
                {uc}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2.5 pt-3 border-t border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categories</h3>
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {allCategories.map(cat => (
            <div key={cat} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${cat}`}
                checked={filters.categories.includes(cat)}
                onCheckedChange={() => handleCategoryToggle(cat)}
              />
              <Label
                htmlFor={`cat-${cat}`}
                className="text-xs font-medium leading-none cursor-pointer"
              >
                {cat}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
