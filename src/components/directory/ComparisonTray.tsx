import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight, Layers, Trash2 } from 'lucide-react';
import { useDirectoryCompare } from '@/context/DirectoryCompareContext';

export const ComparisonTray: React.FC = () => {
  const { selectedProducts, removeFromCompare, clearCompare, canCompare } = useDirectoryCompare();

  if (selectedProducts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-2xl py-3 px-4 sm:px-6 transition-all duration-300 animate-in slide-in-from-bottom-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Indicator & selected chips */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-2 mr-1">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground block">
                Compare Products
              </span>
              <span className="text-[11px] text-muted-foreground">
                {selectedProducts.length} of 4 selected
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedProducts.map(product => (
              <div
                key={product.id}
                className="inline-flex items-center gap-1.5 bg-muted border border-border px-2.5 py-1 rounded-lg text-xs font-medium text-foreground shadow-sm"
              >
                <span className="text-sm">{product.logo}</span>
                <span className="max-w-[110px] truncate">{product.name}</span>
                <button
                  type="button"
                  onClick={() => removeFromCompare(product.id)}
                  className="p-0.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-background/80 transition-colors ml-0.5"
                  aria-label={`Remove ${product.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCompare}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </Button>

          {canCompare ? (
            <Link to={`/tools/compare?ids=${selectedProducts.map(p => p.id).join(',')}`}>
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shadow-sm"
              >
                <span>Compare Now ({selectedProducts.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled
              onClick={() => {}}
              className="h-8 text-xs font-semibold opacity-60"
            >
              Select at least 2 to compare
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
