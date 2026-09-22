import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { DirectoryProduct } from '@/types/directory';
import { AI_DIRECTORY_PRODUCTS, getDirectoryProductByIdOrSlug } from '@/data/aiDirectoryData';

interface DirectoryCompareContextType {
  selectedIds: string[];
  selectedProducts: DirectoryProduct[];
  toggleCompare: (id: string) => void;
  addToCompare: (id: string) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
  isInCompare: (id: string) => boolean;
  canCompare: boolean;
}

const STORAGE_KEY = 'aidetector_directory_compare';
const MAX_COMPARE = 4;

const DirectoryCompareContext = createContext<DirectoryCompareContextType | undefined>(undefined);

export const DirectoryCompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(id => typeof id === 'string' && getDirectoryProductByIdOrSlug(id));
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds));
    } catch {
      // ignore
    }
  }, [selectedIds]);

  const selectedProducts = selectedIds
    .map(id => getDirectoryProductByIdOrSlug(id))
    .filter((p): p is DirectoryProduct => Boolean(p));

  const toggleCompare = (id: string) => {
    const product = getDirectoryProductByIdOrSlug(id);
    if (!product) return;

    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(item => item !== id));
      toast.info(`Removed ${product.name} from comparison.`);
    } else {
      if (selectedIds.length >= MAX_COMPARE) {
        toast.error(`Maximum ${MAX_COMPARE} products can be compared at once. Please remove a product first.`);
        return;
      }
      setSelectedIds(prev => [...prev, id]);
      toast.success(`Added ${product.name} to comparison (${selectedIds.length + 1}/${MAX_COMPARE}).`);
    }
  };

  const addToCompare = (id: string) => {
    const product = getDirectoryProductByIdOrSlug(id);
    if (!product) return;

    if (selectedIds.includes(id)) return;
    if (selectedIds.length >= MAX_COMPARE) {
      toast.error(`Maximum ${MAX_COMPARE} products can be compared at once. Please remove a product first.`);
      return;
    }
    setSelectedIds(prev => [...prev, id]);
    toast.success(`Added ${product.name} to comparison.`);
  };

  const removeFromCompare = (id: string) => {
    const product = getDirectoryProductByIdOrSlug(id);
    setSelectedIds(prev => prev.filter(item => item !== id));
    if (product) {
      toast.info(`Removed ${product.name} from comparison.`);
    }
  };

  const clearCompare = () => {
    setSelectedIds([]);
    toast.info('Comparison selection cleared.');
  };

  const isInCompare = (id: string) => selectedIds.includes(id);

  const canCompare = selectedIds.length >= 2;

  return (
    <DirectoryCompareContext.Provider
      value={{
        selectedIds,
        selectedProducts,
        toggleCompare,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        canCompare,
      }}
    >
      {children}
    </DirectoryCompareContext.Provider>
  );
};

export function useDirectoryCompare() {
  const context = useContext(DirectoryCompareContext);
  if (!context) {
    throw new Error('useDirectoryCompare must be used within a DirectoryCompareProvider');
  }
  return context;
}
