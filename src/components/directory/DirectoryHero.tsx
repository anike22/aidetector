import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ArrowRight, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { DirectoryProduct } from '@/types/directory';
import { AI_DIRECTORY_PRODUCTS } from '@/data/aiDirectoryData';

interface DirectoryHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectProduct?: (product: DirectoryProduct) => void;
  totalProductsCount: number;
}

export const DirectoryHero: React.FC<DirectoryHeroProps> = ({
  searchQuery,
  onSearchChange,
  onSelectProduct,
  totalProductsCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Suggestions based on search
  const suggestions = searchQuery.trim().length >= 2
    ? AI_DIRECTORY_PRODUCTS.filter(p => {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.company.toLowerCase().includes(q) ||
          p.primaryCategory.toLowerCase().includes(q) ||
          p.tags.some(t => t.toLowerCase().includes(q)) ||
          p.useCases.some(u => u.toLowerCase().includes(q)) ||
          p.features.some(f => f.toLowerCase().includes(q)) ||
          p.description.toLowerCase().includes(q)
        );
      }).slice(0, 5)
    : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative border-b border-border bg-gradient-to-b from-muted/40 via-background to-background py-8 md:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Independent AI Software & Platform Research</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-2">
            AI Tools Directory
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6 max-w-2xl text-pretty">
            Discover, research and compare AI tools for writing, productivity, development, design, research, marketing and more.
          </p>

          {/* Search bar container */}
          <div ref={containerRef} className="relative w-full max-w-2xl">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                value={searchQuery}
                onChange={e => {
                  onSearchChange(e.target.value);
                  setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder="Search AI tools, categories or use cases..."
                className="pl-10 pr-10 h-11 text-sm bg-card border-border shadow-sm focus-visible:ring-primary focus-visible:border-primary rounded-xl"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange('');
                    setIsOpen(false);
                  }}
                  className="absolute right-3 p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Live Autocomplete Dropdown */}
            {isOpen && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-border/60 animate-in fade-in-50 duration-150">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/30 flex justify-between items-center">
                  <span>Matching Tools</span>
                  <span>{suggestions.length} results</span>
                </div>
                {suggestions.map(tool => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => {
                      if (onSelectProduct) {
                        onSelectProduct(tool);
                      }
                      setIsOpen(false);
                    }}
                    className="w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-muted/60 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{tool.logo}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {tool.name}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            by {tool.company}
                          </span>
                          {tool.isOwnerProduct && (
                            <Badge variant="outline" className="text-[10px] py-0 h-4 border-primary/30 text-primary bg-primary/5">
                              Platform
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-md">
                          {tool.summary || tool.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Badge variant="secondary" className="text-xs py-0 h-5">
                        {tool.primaryCategory}
                      </Badge>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Trending searches:</span>
            {['AI Detection', 'Coding', 'Research', 'Video Generation', 'Claude', 'Open Source'].map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => onSearchChange(tag)}
                className="hover:text-primary hover:underline transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
