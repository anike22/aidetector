import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';
import { DirectoryFilterSidebar } from './DirectoryFilterSidebar';
import type { DirectoryFilterState } from '@/types/directory';

interface DirectoryMobileFilterSheetProps {
  filters: DirectoryFilterState;
  onFilterChange: (newFilters: DirectoryFilterState) => void;
  onResetFilters: () => void;
  activeFilterCount: number;
  totalResultsCount: number;
}

export const DirectoryMobileFilterSheet: React.FC<DirectoryMobileFilterSheetProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  activeFilterCount,
  totalResultsCount,
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-medium md:hidden">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-primary text-primary-foreground ml-0.5">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-md p-0 flex flex-col bg-background">
        <SheetHeader className="px-5 py-4 border-b border-border text-left flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <SheetTitle className="text-base font-bold">Filter AI Software</SheetTitle>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <DirectoryFilterSidebar
            filters={filters}
            onFilterChange={onFilterChange}
            onResetFilters={onResetFilters}
            activeFilterCount={activeFilterCount}
          />
        </div>
        <div className="p-4 border-t border-border bg-card flex items-center gap-3">
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="flex-1 h-10 text-xs"
            >
              Reset All
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setOpen(false)}
            className="flex-1 h-10 text-xs bg-primary text-primary-foreground font-semibold"
          >
            Show {totalResultsCount} Results
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
