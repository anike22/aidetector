import { useState } from 'react';
import {
  Clock, RotateCcw, Copy, Trash2, Check, X, FileText, ChevronRight, Layers, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { SummaryHistoryItem } from '@/utils/summarizerHistory';

interface SummarizerHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: SummaryHistoryItem[];
  onRestore: (item: SummaryHistoryItem) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

function formatTimeAgo(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function SummarizerHistoryDrawer({
  open,
  onOpenChange,
  history,
  onRestore,
  onRemove,
  onClear,
}: SummarizerHistoryDrawerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedItem = history.find((h) => h.id === selectedId) || null;

  const handleCopy = async (item: SummaryHistoryItem) => {
    const plain =
      item.result.summary.format === 'paragraphs'
        ? item.result.summary.items.join('\n\n')
        : item.result.summary.items.map((i) => `• ${i}`).join('\n');
    try {
      await navigator.clipboard.writeText(plain);
      setCopied(true);
      toast.success('Summary copied to clipboard.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not access the clipboard.');
    }
  };

  const handleRestore = (item: SummaryHistoryItem) => {
    onRestore(item);
    onOpenChange(false);
    toast.success('Summary and source restored to editor.');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col bg-background">
        <SheetHeader className="p-4 sm:p-6 border-b border-border/60 shrink-0">
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="min-w-0">
              <SheetTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary shrink-0" />
                Session History
                {history.length > 0 && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {history.length}
                  </Badge>
                )}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                Saved locally during this browser session
              </SheetDescription>
            </div>
            {history.length > 0 && !selectedItem && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:text-destructive shrink-0 gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> Clear
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear session history?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove all {history.length} recent summary drafts saved in this browser session. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onClear}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Clear History
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0">
          {history.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center gap-3 text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center">
                <Clock className="w-6 h-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-medium text-foreground">No recent summaries yet</p>
              <p className="text-xs max-w-xs text-pretty">
                Summaries you generate will automatically be retained here during your session so you can easily review and restore them.
              </p>
            </div>
          ) : selectedItem ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs -ml-2 gap-1.5 text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedId(null)}
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to history list
              </Button>

              <div className="space-y-3 p-4 rounded-lg border border-border/80 bg-card">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold">{selectedItem.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatTimeAgo(selectedItem.timestamp)} · {selectedItem.inputWords.toLocaleString('en-US')} source words
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleCopy(selectedItem)}
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => handleRestore(selectedItem)}
                    >
                      <RotateCcw className="w-3 h-3" /> Restore
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant="outline" className="text-[10px]">
                    {selectedItem.settings.length} · {selectedItem.settings.format}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">{selectedItem.settings.language}</Badge>
                  {selectedItem.settings.focus && (
                    <Badge variant="outline" className="text-[10px]">Focus: {selectedItem.settings.focus}</Badge>
                  )}
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedItem.result.stats.reduction_pct}% shorter
                  </Badge>
                </div>
              </div>

              {/* Summary text display */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">Summary</label>
                <div className="p-3.5 rounded-md border border-border/60 bg-muted/30 text-xs sm:text-sm leading-relaxed space-y-2.5">
                  {selectedItem.result.summary.format === 'paragraphs' ? (
                    selectedItem.result.summary.items.map((p, i) => <p key={i}>{p}</p>)
                  ) : (
                    <ul className="space-y-1.5 list-disc pl-4">
                      {selectedItem.result.summary.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Original source preview */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Source Excerpt</label>
                <div className="p-3 rounded-md border border-border/40 bg-card text-xs text-muted-foreground leading-relaxed max-h-36 overflow-y-auto">
                  {selectedItem.inputText.slice(0, 500)}
                  {selectedItem.inputText.length > 500 && '…'}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex flex-col p-3.5 rounded-lg border border-border/70 bg-card hover:border-primary/40 hover:bg-accent/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatTimeAgo(item.timestamp)} · {item.inputWords.toLocaleString('en-US')} words · {item.result.stats.reduction_pct}% reduction
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                    {item.result.summary.items[0]}
                  </p>

                  <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-border/40">
                    <div className="flex gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[9px] py-0 px-1.5">
                        {item.settings.length}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] py-0 px-1.5">
                        {item.settings.format}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-destructive"
                        onClick={() => onRemove(item.id)}
                        title="Delete from history"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-6 px-2 text-[11px] gap-1"
                        onClick={() => handleRestore(item)}
                      >
                        <RotateCcw className="w-3 h-3" /> Restore
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 border-t border-border/60 bg-muted/20 text-[11px] text-muted-foreground text-center shrink-0">
          History is saved locally on this device and cleared when your browser session closes.
        </div>
      </SheetContent>
    </Sheet>
  );
}
