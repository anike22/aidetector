import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  History, Trash2, Calendar, FileText, ArrowRight, ShieldCheck, Sparkles, AlertCircle
} from 'lucide-react';
import {
  getSEOAssistantHistory,
  deleteSEOAssistantHistoryItem,
  clearSEOAssistantHistory,
  type SEOAnalysisHistoryItem
} from '@/lib/seoAssistantHistory';
import { toast } from 'sonner';

interface SEOAssistantHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: (item: SEOAnalysisHistoryItem) => void;
  onHistoryChange?: () => void;
}

export function SEOAssistantHistoryDialog({
  open,
  onOpenChange,
  onRestore,
  onHistoryChange,
}: SEOAssistantHistoryDialogProps) {
  const [items, setItems] = useState<SEOAnalysisHistoryItem[]>([]);

  const loadHistory = () => {
    setItems(getSEOAssistantHistory());
  };

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteSEOAssistantHistoryItem(id);
    setItems(updated);
    toast.success('History entry removed.');
    onHistoryChange?.();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear your entire analysis history? This action cannot be undone.')) {
      clearSEOAssistantHistory();
      setItems([]);
      toast.success('All history cleared.');
      onHistoryChange?.();
    }
  };

  const handleSelect = (item: SEOAnalysisHistoryItem) => {
    onRestore(item);
    onOpenChange(false);
    toast.success(`Restored "${item.title}". No credits deducted.`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[85dvh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 md:p-6 pb-3 border-b border-border bg-card shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">Analysis History</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Restoring previously analyzed articles is always 100% free and consumes 0 credits.
                </DialogDescription>
              </div>
            </div>
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 min-h-[240px]">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-xl bg-muted/20">
              <History className="w-10 h-10 text-muted-foreground/40 mb-2" />
              <h4 className="text-sm font-semibold text-foreground">No analysis history yet</h4>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 text-pretty">
                When you run full SEO & AI analyses on your articles, they will automatically be preserved here so you can revisit them anytime without paying again.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {items.map((item) => {
                const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const scoreColor = item.scores.overall >= 80 
                  ? 'bg-success/10 text-success border-success/30' 
                  : item.scores.overall >= 50 
                  ? 'bg-warning/10 text-warning border-warning/30' 
                  : 'bg-destructive/10 text-destructive border-destructive/30';

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="group border border-border rounded-xl p-3.5 bg-card hover:bg-accent/40 hover:border-primary/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                        <Badge variant="outline" className={`text-[10px] font-bold px-1.5 py-0 ${scoreColor}`}>
                          {item.scores.overall}/100 SEO
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5 flex-wrap">
                        {item.keyword && (
                          <span className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-medium text-foreground">
                            KW: {item.keyword}
                          </span>
                        )}
                        <span>{item.wordCount} words</span>
                        <span>·</span>
                        <span>{item.creditCost} credits paid</span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3" />
                          {dateStr}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleDelete(item.id, e)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete from history"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSelect(item)}
                        className="h-8 text-xs font-semibold bg-primary text-primary-foreground gap-1"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
