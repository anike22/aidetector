import React, { useRef } from 'react';
import {
  Clipboard,
  Undo2,
  Redo2,
  CaseSensitive,
  SpellCheck,
  Copy,
  Trash2,
  Download,
  Upload,
  Search,
  BookOpen,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

interface Props {
  text: string;
  selectedText: string;
  historyIndex: number;
  historyLength: number;
  isGrammarScanEnabled: boolean;
  activeGrammarCount: number;
  onPaste: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCaseTransform: (type: 'upper' | 'lower' | 'sentence' | 'title') => void;
  onToggleGrammar: () => void;
  onCopy: () => void;
  onClear: () => void;
  onExport: (format: 'txt' | 'md' | 'html' | 'doc') => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenFindReplace: () => void;
  onOpenAdvancedTab: (tab: 'grammar' | 'thesaurus' | 'activity' | 'goals') => void;
  onInsertSample: () => void;
}

export function WordCounterToolbar({
  text,
  selectedText,
  historyIndex,
  historyLength,
  isGrammarScanEnabled,
  activeGrammarCount,
  onPaste,
  onUndo,
  onRedo,
  onCaseTransform,
  onToggleGrammar,
  onCopy,
  onClear,
  onExport,
  onFileUpload,
  onOpenFindReplace,
  onOpenAdvancedTab,
  onInsertSample,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyLength - 1;
  const hasText = !!text.trim();

  return (
    <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 bg-muted/40 border-b border-border/60">
      
      {/* ── Left Control Group: Primary Edit Actions ──────────────────────── */}
      <div className="flex flex-wrap items-center gap-1">
        
        {/* 1. Paste Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onPaste}
          className="h-8 px-2.5 text-xs gap-1.5 text-foreground hover:bg-muted"
          title="Paste from clipboard"
        >
          <Clipboard className="w-3.5 h-3.5" />
          <span>Paste</span>
        </Button>

        {/* 2. Undo Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          className="h-8 w-8 p-0 text-foreground hover:bg-muted disabled:opacity-40"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span className="sr-only">Undo</span>
        </Button>

        {/* 3. Redo Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          className="h-8 w-8 p-0 text-foreground hover:bg-muted disabled:opacity-40"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
          <span className="sr-only">Redo</span>
        </Button>

        <div className="h-4 w-px bg-border/60 mx-0.5 hidden sm:block" />

        {/* 4. Case Conversion Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={!hasText}
              className="h-8 px-2 text-xs gap-1 text-foreground hover:bg-muted"
            >
              <CaseSensitive className="w-4 h-4" />
              <span>Case</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {selectedText ? 'Transform Selection' : 'Transform Document'}
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onCaseTransform('sentence')} className="text-xs cursor-pointer">
              Sentence case
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCaseTransform('title')} className="text-xs cursor-pointer">
              Title Case (APA standard)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCaseTransform('upper')} className="text-xs cursor-pointer">
              UPPERCASE
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCaseTransform('lower')} className="text-xs cursor-pointer">
              lowercase
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 5. Grammar Button */}
        <Button
          variant={isGrammarScanEnabled ? 'secondary' : 'ghost'}
          size="sm"
          onClick={onToggleGrammar}
          className="h-8 px-2.5 text-xs gap-1.5 text-foreground hover:bg-muted"
          title="Open Grammar & Writing Assistant"
        >
          <SpellCheck className={`w-3.5 h-3.5 ${activeGrammarCount > 0 ? 'text-primary' : ''}`} />
          <span>Grammar</span>
          {activeGrammarCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
              {activeGrammarCount}
            </span>
          )}
        </Button>

        {/* 6. Copy Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          disabled={!hasText}
          className="h-8 w-8 p-0 text-foreground hover:bg-muted"
          title="Copy to clipboard"
        >
          <Copy className="w-3.5 h-3.5" />
          <span className="sr-only">Copy</span>
        </Button>

        {/* 7. Clear Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={!hasText}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Clear text (Undo available)"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="sr-only">Clear</span>
        </Button>
      </div>

      {/* ── Right Control Group: Export & Advanced Utilities ──────────────── */}
      <div className="flex items-center gap-1">
        
        {/* Hidden File Input for loading docs */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.text"
          onChange={onFileUpload}
          className="hidden"
        />

        {/* 8. Save / Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasText}
              className="h-8 px-2.5 text-xs gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save / Export</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onExport('txt')} className="text-xs cursor-pointer">
              Export as Plain Text (.txt)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('md')} className="text-xs cursor-pointer">
              Export as Markdown (.md)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('html')} className="text-xs cursor-pointer">
              Export as HTML (.html)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('doc')} className="text-xs cursor-pointer">
              Export as Word Doc (.doc)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="text-xs cursor-pointer">
              <Upload className="w-3.5 h-3.5 mr-2" />
              Import Text File...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 9. More Tools Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs gap-1"
            >
              <span>More Tools</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={onOpenFindReplace} className="text-xs cursor-pointer">
              <Search className="w-3.5 h-3.5 mr-2" />
              Find &amp; Replace (Ctrl+F)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenAdvancedTab('thesaurus')} className="text-xs cursor-pointer">
              <BookOpen className="w-3.5 h-3.5 mr-2" />
              Thesaurus &amp; Synonyms
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenAdvancedTab('goals')} className="text-xs cursor-pointer">
              <Sparkles className="w-3.5 h-3.5 mr-2" />
              Writing Goals &amp; Limits
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onInsertSample} className="text-xs cursor-pointer">
              Load Sample Text (152 words)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </div>
  );
}
