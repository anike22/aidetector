import { useEditor, EditorContent, Editor, Extension } from '@tiptap/react';
import { TextSelection, Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Minus, Link2, Link2Off, ImageIcon,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo, Redo,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── helpers ── */
function htmlToPlainText(html: string): string {
  // Convert headings to markdown-style for analysis engine
  const tmp = document.createElement('div');
  tmp.innerHTML = html;

  // walk nodes to extract text with heading markers
  function walkNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    const inner = Array.from(node.childNodes).map(walkNode).join('');
    if (tag === 'h1') return `# ${inner}\n\n`;
    if (tag === 'h2') return `## ${inner}\n\n`;
    if (tag === 'h3') return `### ${inner}\n\n`;
    if (tag === 'h4') return `#### ${inner}\n\n`;
    if (tag === 'p') return `${inner}\n\n`;
    if (tag === 'li') return `- ${inner}\n`;
    if (tag === 'ul' || tag === 'ol') return `${inner}\n`;
    if (tag === 'blockquote') return `> ${inner}\n\n`;
    if (tag === 'br') return '\n';
    if (tag === 'strong' || tag === 'b') return `**${inner}**`;
    if (tag === 'em' || tag === 'i') return `*${inner}*`;
    if (tag === 'code') return `\`${inner}\``;
    if (tag === 'a') return inner;
    return inner;
  }

  return walkNode(tmp).replace(/\n{3,}/g, '\n\n').trim();
}

/* ── Toolbar button ── */
interface ToolbarBtnProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}
function ToolbarBtn({ onClick, active, disabled, tooltip, children }: ToolbarBtnProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            disabled={disabled}
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded text-sm transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              disabled && 'opacity-40 pointer-events-none',
            )}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* ── Link dialog ── */
function LinkDialog({
  open, onClose, onConfirm, initial,
}: { open: boolean; onClose: () => void; onConfirm: (url: string, text?: string) => void; initial?: string }) {
  const [url, setUrl] = useState(initial || 'https://');
  const [linkText, setLinkText] = useState('');

  useEffect(() => { if (open) { setUrl(initial || 'https://'); setLinkText(''); } }, [open, initial]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold text-navy flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" /> Insert Link
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-1">
          <div>
            <Label className="text-xs font-normal mb-1 block">URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className="h-8 text-sm border-border" />
          </div>
          <div>
            <Label className="text-xs font-normal mb-1 block">Link text (optional — uses selection if empty)</Label>
            <Input value={linkText} onChange={(e) => setLinkText(e.target.value)} placeholder="Click here" className="h-8 text-sm border-border" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" className="h-8 border-border" onClick={onClose}>Cancel</Button>
            <Button size="sm" className="h-8 bg-primary text-primary-foreground" onClick={() => { onConfirm(url, linkText || undefined); onClose(); }} disabled={!url.trim()}>Insert</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Image dialog ── */
function ImageDialog({
  open, onClose, onConfirm,
}: { open: boolean; onClose: () => void; onConfirm: (src: string, alt: string) => void }) {
  const [src, setSrc] = useState('');
  const [alt, setAlt] = useState('');

  useEffect(() => { if (open) { setSrc(''); setAlt(''); } }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold text-navy flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary" /> Insert Image
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-1">
          <div>
            <Label className="text-xs font-normal mb-1 block">Image URL</Label>
            <Input value={src} onChange={(e) => setSrc(e.target.value)} placeholder="https://example.com/image.jpg" className="h-8 text-sm border-border" />
          </div>
          <div>
            <Label className="text-xs font-normal mb-1 block">Alt text (for SEO)</Label>
            <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the image" className="h-8 text-sm border-border" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" className="h-8 border-border" onClick={onClose}>Cancel</Button>
            <Button size="sm" className="h-8 bg-primary text-primary-foreground" onClick={() => { onConfirm(src, alt); onClose(); }} disabled={!src.trim()}>Insert</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Toolbar ── */
function Toolbar({ editor }: { editor: Editor | null }) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  if (!editor) return null;

  const currentLinkUrl = editor.getAttributes('link').href as string | undefined;

  const handleInsertLink = useCallback((url: string, text?: string) => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;
    if (text && !hasSelection) {
      editor.chain().focus().insertContent(`<a href="${url}">${text}</a>`).run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
    }
  }, [editor]);

  const handleInsertImage = useCallback((src: string, alt: string) => {
    if (!editor) return;
    editor.chain().focus().setImage({ src, alt, title: alt }).run();
  }, [editor]);

  return (
    <>
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-b border-border bg-muted/30 shrink-0">
        {/* Undo / Redo */}
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} tooltip="Undo (Ctrl+Z)">
          <Undo className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} tooltip="Redo (Ctrl+Y)">
          <Redo className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Headings */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} tooltip="Heading 1">
          <Heading1 className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} tooltip="Heading 2">
          <Heading2 className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} tooltip="Heading 3">
          <Heading3 className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Inline formatting */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} tooltip="Bold (Ctrl+B)">
          <Bold className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} tooltip="Italic (Ctrl+I)">
          <Italic className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} tooltip="Underline (Ctrl+U)">
          <UnderlineIcon className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} tooltip="Strikethrough">
          <Strikethrough className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} tooltip="Inline Code">
          <Code className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Lists */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} tooltip="Bullet List">
          <List className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} tooltip="Numbered List">
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} tooltip="Blockquote">
          <Quote className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} tooltip="Horizontal Rule">
          <Minus className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Alignment */}
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} tooltip="Align Left">
          <AlignLeft className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} tooltip="Align Center">
          <AlignCenter className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} tooltip="Align Right">
          <AlignRight className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} tooltip="Justify">
          <AlignJustify className="w-3.5 h-3.5" />
        </ToolbarBtn>

        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Link & Image */}
        <ToolbarBtn onClick={() => setLinkDialogOpen(true)} active={editor.isActive('link')} tooltip={currentLinkUrl ? `Edit link: ${currentLinkUrl}` : 'Insert Link'}>
          <Link2 className="w-3.5 h-3.5" />
        </ToolbarBtn>
        {editor.isActive('link') && (
          <ToolbarBtn onClick={() => editor.chain().focus().unsetLink().run()} tooltip="Remove Link">
            <Link2Off className="w-3.5 h-3.5" />
          </ToolbarBtn>
        )}
        <ToolbarBtn onClick={() => setImageDialogOpen(true)} tooltip="Insert Image">
          <ImageIcon className="w-3.5 h-3.5" />
        </ToolbarBtn>
      </div>

      <LinkDialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        onConfirm={handleInsertLink}
        initial={currentLinkUrl}
      />
      <ImageDialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        onConfirm={handleInsertImage}
      />
    </>
  );
}

/* ── Main export ── */
export interface IssueLocation {
  start?: number;
  end?: number;
  text?: string;
  contextSnippet?: string;
  type?: string;
  sentenceIndex?: number;
  paragraphIndex?: number;
  severity?: 'warning' | 'error' | 'info';
}

export interface RichTextEditorRef {
  setContent: (content: string) => void;
  getContent: () => string;
  locateAndHighlight: (searchText: string) => void;
  focusRange: (start: number, end: number, severity?: 'warning' | 'error' | 'info') => void;
  locateIssue: (location: IssueLocation | string) => void;
  insertTextAtLocation: (text: string, target?: 'intro' | 'after_h1' | 'end' | 'cursor') => void;
  applyHyperlink: (anchorText: string, url: string, location?: IssueLocation) => boolean;
  clearHighlights: () => void;
}

interface HighlightMeta {
  from: number;
  to: number;
  severity: 'warning' | 'error' | 'info';
  isSpacing: boolean;
}

const issueHighlightPluginKey = new PluginKey<HighlightMeta | null>('issueHighlight');

const IssueHighlightExtension = Extension.create({
  name: 'issueHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin<HighlightMeta | null>({
        key: issueHighlightPluginKey,
        state: {
          init() {
            return null;
          },
          apply(tr, prev) {
            const meta = tr.getMeta(issueHighlightPluginKey);
            if (meta !== undefined) {
              return meta;
            }
            if (tr.docChanged && prev) {
              const mappedFrom = tr.mapping.map(prev.from);
              const mappedTo = tr.mapping.map(prev.to);
              if (mappedFrom < mappedTo) {
                return { ...prev, from: mappedFrom, to: mappedTo };
              }
              return null;
            }
            return prev;
          },
        },
        props: {
          decorations(state) {
            const highlight = issueHighlightPluginKey.getState(state);
            if (!highlight) return DecorationSet.empty;

            const { from, to, severity, isSpacing } = highlight;
            const validFrom = Math.max(0, Math.min(from, state.doc.content.size));
            const validTo = Math.max(validFrom, Math.min(to, state.doc.content.size));

            if (validFrom >= validTo) return DecorationSet.empty;

            let className = '';
            let style = '';

            if (isSpacing) {
              className = 'issue-highlight-spacing bg-amber-400/35 text-amber-950 dark:text-amber-100 ring-2 ring-amber-500 rounded px-1 relative inline-block mx-0.5 select-none font-bold animate-pulse';
              style = 'background-color: rgba(245, 158, 11, 0.35); box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.75); border-radius: 3px; min-width: 14px; min-height: 1.1em; display: inline-block; vertical-align: middle;';
            } else if (severity === 'error') {
              className = 'issue-highlight-exact bg-destructive/25 text-destructive-foreground ring-2 ring-destructive/60 rounded px-0.5 shadow-sm font-medium transition-all duration-300';
            } else if (severity === 'info') {
              className = 'issue-highlight-exact bg-primary/25 text-primary-foreground ring-2 ring-primary/60 rounded px-0.5 shadow-sm font-medium transition-all duration-300';
            } else {
              className = 'issue-highlight-exact bg-warning/35 text-foreground ring-2 ring-warning/60 rounded px-0.5 shadow-sm font-medium transition-all duration-300';
            }

            const dec = Decoration.inline(validFrom, validTo, {
              class: className,
              style: style || undefined,
            });

            return DecorationSet.create(state.doc, [dec]);
          },
        },
      }),
    ];
  },
});

interface RichTextEditorProps {
  initialValue: string;            // plain text (markdown-flavored) fed to analysis engine
  onChange: (plain: string) => void;
  onHTMLChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor = React.forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ initialValue, onChange, onHTMLChange, placeholder, className }, ref) => {
  // Track whether we're programmatically setting content to avoid loops
  const isExternalUpdate = useRef(false);
  const activeHighlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Helper to safely reset editor scroll position to top
  const resetScrollToTop = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      }, 30);
    });
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      Image.configure({ allowBase64: false, inline: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: placeholder || 'Start writing your article…' }),
      IssueHighlightExtension,
    ],
    content: markdownToHTML(initialValue || ''),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] px-4 md:px-6 py-4 text-foreground leading-relaxed',
      },
      handlePaste(view, event) {
        // Allow default ProseMirror paste behavior to process and insert content/formatting faithfully
        const pastedText = (event as ClipboardEvent)?.clipboardData?.getData('text/plain') || '';
        const isSubstantialPaste = pastedText.length > 150 || pastedText.split(/\s+/).filter(Boolean).length > 25;

        // Reset the editor's scroll container to top only for substantial/full article pastes
        if (isSubstantialPaste) {
          requestAnimationFrame(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = 0;
            }
            if (view && !view.isDestroyed) {
              try {
                // Position cursor at top so viewport remains at top without jumping to the end
                const tr = view.state.tr.setSelection(
                  TextSelection.create(view.state.doc, 0)
                );
                view.dispatch(tr);
              } catch {}
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = 0;
              }
            }
            setTimeout(() => {
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = 0;
              }
            }, 30);
          });
        }
        return false;
      },
    },
    onUpdate({ editor: ed }) {
      if (isExternalUpdate.current) return;
      clearExistingHighlights();
      const html = ed.getHTML();
      const plain = htmlToPlainText(html);
      onChange(plain);
      onHTMLChange?.(html);
    },
  });

  const clearExistingHighlights = () => {
    if (activeHighlightTimeoutRef.current) {
      clearTimeout(activeHighlightTimeoutRef.current);
      activeHighlightTimeoutRef.current = null;
    }
    if (!editor || editor.isDestroyed) return;
    try {
      const clearTr = editor.state.tr.setMeta(issueHighlightPluginKey, null);
      editor.view.dispatch(clearTr);
    } catch {}
  };

  const scrollToElement = (el: HTMLElement) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cRect = container.getBoundingClientRect();
      const eRect = el.getBoundingClientRect();
      const relTop = eRect.top - cRect.top + container.scrollTop;
      const targetTop = relTop - (container.clientHeight / 2) + (eRect.height / 2);
      container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Authoritative ProseMirror-based exact location and highlighting
  const locateAndHighlightRange = useCallback((
    targetText?: string,
    startOffset?: number,
    endOffset?: number,
    sentenceIndex?: number,
    paragraphIndex?: number,
    contextSnippet?: string,
    severity: 'warning' | 'error' | 'info' = 'warning'
  ) => {
    if (!editor || editor.isDestroyed) return;
    clearExistingHighlights();

    const doc = editor.state.doc;
    const docSize = doc.content.size;
    let pmFrom: number | null = null;
    let pmTo: number | null = null;

    // Clean search text
    let cleanText = (targetText || '').replace(/^["']|["']$/g, '');
    const isWhitespaceOnly = cleanText.length > 0 && /^\s+$/.test(cleanText);

    if (!isWhitespaceOnly) {
      cleanText = cleanText.trim();
      if (cleanText.endsWith('...') || cleanText.endsWith('…')) {
        cleanText = cleanText.replace(/(\.\.\.|…)$/, '').trim();
      }
    }

    // Build comprehensive plain text offset to ProseMirror position mapping
    interface BlockMapping {
      nodePos: number;
      plainStart: number;
      plainEnd: number;
      prefixLen: number;
      blockIndex: number;
      charToPmMap: number[];
    }

    const blockMappings: BlockMapping[] = [];
    const plainCharToPmPos: (number | null)[] = [];
    let currentPlainOffset = 0;
    let currentBlockIdx = 0;

    doc.descendants((node, pos) => {
      if (node.isBlock && !node.isText) {
        let prefix = '';
        if (node.type.name === 'heading') {
          const level = node.attrs.level || 1;
          prefix = '#'.repeat(level) + ' ';
        } else if (node.type.name === 'blockquote') {
          prefix = '> ';
        } else if (node.type.name === 'listItem') {
          prefix = '- ';
        }

        for (let p = 0; p < prefix.length; p++) {
          plainCharToPmPos.push(pos + 1);
        }

        const blockText = node.textBetween(0, node.content.size, '\n', '\n');
        const charToPmMap: number[] = new Array(blockText.length).fill(null);

        let currentOffsetInBlock = 0;
        node.descendants((childNode, childPos) => {
          if (childNode.isText && childNode.text) {
            const childLen = childNode.text.length;
            for (let i = 0; i < childLen; i++) {
              const bIdx = currentOffsetInBlock + i;
              const actualPmPos = pos + 1 + childPos + i;
              charToPmMap[bIdx] = actualPmPos;
            }
            currentOffsetInBlock += childLen;
          }
          return true;
        });

        for (let i = 0; i < blockText.length; i++) {
          const actualPmPos = charToPmMap[i] ?? (pos + 1 + i);
          plainCharToPmPos.push(actualPmPos);
        }

        const plainStart = currentPlainOffset;
        const plainEnd = plainStart + prefix.length + blockText.length;

        blockMappings.push({
          nodePos: pos,
          plainStart,
          plainEnd,
          prefixLen: prefix.length,
          blockIndex: currentBlockIdx++,
          charToPmMap,
        });

        currentPlainOffset = plainEnd + 2;
        plainCharToPmPos.push(null);
        plainCharToPmPos.push(null);
      }
      return true;
    });

    // Strategy 1: Direct Verified Plain Text Offset Mapping
    if (typeof startOffset === 'number' && startOffset >= 0 && startOffset < plainCharToPmPos.length) {
      const candidateFrom = plainCharToPmPos[startOffset];
      const targetLen = (typeof endOffset === 'number' && endOffset > startOffset)
        ? (endOffset - startOffset)
        : (cleanText.length || 1);
      const targetEndOffset = startOffset + targetLen;
      const candidateTo = (targetEndOffset < plainCharToPmPos.length && plainCharToPmPos[targetEndOffset] !== null)
        ? plainCharToPmPos[targetEndOffset]
        : (candidateFrom !== null ? candidateFrom + targetLen : null);

      if (candidateFrom !== null && candidateTo !== null && candidateFrom < candidateTo) {
        const textAtRange = doc.textBetween(candidateFrom, candidateTo);
        const matchExact = cleanText.length > 0 && (textAtRange.toLowerCase() === cleanText.toLowerCase() || (isWhitespaceOnly && /^\s+$/.test(textAtRange)));
        
        if (matchExact || !cleanText) {
          pmFrom = candidateFrom;
          pmTo = candidateTo;
        }
      }
    }

    // Strategy 2: ContextSnippet exact matching within block text
    if (pmFrom === null && contextSnippet && contextSnippet.trim().length > 0) {
      const normalizedSnippet = contextSnippet.toLowerCase().trim();
      let bestDist = Infinity;

      for (const bm of blockMappings) {
        const node = doc.nodeAt(bm.nodePos);
        if (!node) continue;
        const blockText = node.textBetween(0, node.content.size, '\n', '\n');
        const normalizedBlock = blockText.toLowerCase();
        let searchIdx = 0;

        while (searchIdx < normalizedBlock.length) {
          const matchIdx = normalizedBlock.indexOf(normalizedSnippet, searchIdx);
          if (matchIdx === -1) break;

          let relOffset = 0;
          let targetLen = 0;

          if (cleanText) {
            const idxInSnippet = normalizedSnippet.indexOf(cleanText.toLowerCase());
            if (idxInSnippet !== -1) {
              relOffset = idxInSnippet;
              targetLen = cleanText.length;
            } else {
              targetLen = normalizedSnippet.length;
            }
          } else if (typeof startOffset === 'number' && typeof endOffset === 'number') {
            targetLen = Math.max(1, endOffset - startOffset);
          } else {
            targetLen = normalizedSnippet.length;
          }

          const targetFromInBlock = matchIdx + relOffset;
          const targetToInBlock = targetFromInBlock + targetLen;
          const fromPm = bm.charToPmMap[targetFromInBlock] ?? (bm.nodePos + 1 + targetFromInBlock);
          const toPm = bm.charToPmMap[targetToInBlock] ?? (fromPm + targetLen);

          const plainPos = bm.plainStart + bm.prefixLen + targetFromInBlock;
          const dist = typeof startOffset === 'number' ? Math.abs(plainPos - startOffset) : 0;

          if (dist < bestDist) {
            bestDist = dist;
            pmFrom = fromPm;
            pmTo = toPm;
          }

          searchIdx = matchIdx + Math.max(1, normalizedSnippet.length);
        }
      }
    }

    // Strategy 3: TargetText search with closest plain-text offset disambiguation
    if (pmFrom === null && cleanText.length > 0) {
      const normalizedTarget = cleanText.toLowerCase();
      interface Candidate {
        from: number;
        to: number;
        plainOffset: number;
        blockIndex: number;
        distance: number;
      }
      const candidates: Candidate[] = [];

      for (const bm of blockMappings) {
        const node = doc.nodeAt(bm.nodePos);
        if (!node) continue;
        const blockText = node.textBetween(0, node.content.size, '\n', '\n');
        const normalizedBlock = blockText.toLowerCase();
        let searchIdx = 0;

        while (searchIdx < normalizedBlock.length) {
          const foundIdx = normalizedBlock.indexOf(normalizedTarget, searchIdx);
          if (foundIdx === -1) break;

          const endIdx = foundIdx + cleanText.length;
          const fromPm = bm.charToPmMap[foundIdx] ?? (bm.nodePos + 1 + foundIdx);
          const toPm = bm.charToPmMap[endIdx] ?? (fromPm + cleanText.length);
          const plainPos = bm.plainStart + bm.prefixLen + foundIdx;
          const dist = typeof startOffset === 'number' ? Math.abs(plainPos - startOffset) : 0;

          candidates.push({
            from: fromPm,
            to: toPm,
            plainOffset: plainPos,
            blockIndex: bm.blockIndex,
            distance: dist,
          });

          searchIdx = foundIdx + Math.max(1, cleanText.length);
        }
      }

      if (candidates.length > 0) {
        if (typeof paragraphIndex === 'number' && candidates.some(c => c.blockIndex === paragraphIndex)) {
          const match = candidates.find(c => c.blockIndex === paragraphIndex);
          if (match) {
            pmFrom = match.from;
            pmTo = match.to;
          }
        } else if (typeof sentenceIndex === 'number' && candidates[sentenceIndex]) {
          pmFrom = candidates[sentenceIndex].from;
          pmTo = candidates[sentenceIndex].to;
        } else if (typeof startOffset === 'number') {
          candidates.sort((a, b) => a.distance - b.distance);
          pmFrom = candidates[0].from;
          pmTo = candidates[0].to;
        } else {
          pmFrom = candidates[0].from;
          pmTo = candidates[0].to;
        }
      }
    }

    // Strategy 4: Fallback Plain Text Offset Mapping
    if (pmFrom === null && typeof startOffset === 'number' && startOffset >= 0) {
      if (startOffset < plainCharToPmPos.length && plainCharToPmPos[startOffset] !== null) {
        pmFrom = plainCharToPmPos[startOffset];
        const targetLen = (typeof endOffset === 'number' && endOffset > startOffset)
          ? (endOffset - startOffset)
          : (cleanText.length || 1);
        const endPos = startOffset + targetLen;
        pmTo = (endPos < plainCharToPmPos.length && plainCharToPmPos[endPos] !== null)
          ? plainCharToPmPos[endPos]
          : (pmFrom! + targetLen);
      }
    }

    // Step 5: Apply highlight decoration and scroll isolated editor container
    if (pmFrom !== null) {
      const validFrom = Math.max(0, Math.min(pmFrom, docSize));
      const validTo = pmTo !== null ? Math.max(validFrom, Math.min(pmTo, docSize)) : Math.min(validFrom + 1, docSize);

      if (validFrom < validTo) {
        const textInRange = doc.textBetween(validFrom, validTo);
        const isSpacing = /^\s+$/.test(textInRange) || isWhitespaceOnly;

        try {
          // 1. Dispatch ProseMirror decoration
          const tr = editor.state.tr.setMeta(issueHighlightPluginKey, {
            from: validFrom,
            to: validTo,
            severity,
            isSpacing,
          });

          // Also set selection without focusing browser to prevent viewport shifts
          tr.setSelection(TextSelection.create(editor.state.doc, validFrom, validTo));
          editor.view.dispatch(tr);

          // 2. Scope scrolling strictly to the editor's dedicated scroll container
          const container = scrollContainerRef.current || (editor.view.dom.closest('.editor-scroll-region') as HTMLElement | null);
          if (container) {
            const coords = editor.view.coordsAtPos(validFrom);
            const cRect = container.getBoundingClientRect();
            const relTop = coords.top - cRect.top + container.scrollTop;
            const targetTop = relTop - (container.clientHeight / 2);
            container.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
          }

          // 3. Auto-clear decoration after 3.5 seconds
          activeHighlightTimeoutRef.current = setTimeout(() => {
            if (editor && !editor.isDestroyed) {
              const clearTr = editor.state.tr.setMeta(issueHighlightPluginKey, null);
              editor.view.dispatch(clearTr);
            }
          }, 3500);
        } catch (err) {
          console.error('Failed to apply ProseMirror decoration highlight:', err);
        }
      }
    }
  }, [editor]);

  React.useImperativeHandle(ref, () => ({
    clearHighlights: () => {
      clearExistingHighlights();
    },
    setContent: (content: string) => {
      if (!editor) return;
      isExternalUpdate.current = true;
      const html = markdownToHTML(content);
      editor.commands.setContent(html, { emitUpdate: false } as any);
      editor.commands.setTextSelection(0);
      resetScrollToTop();
      setTimeout(() => { 
        isExternalUpdate.current = false; 
        resetScrollToTop();
      }, 0);
    },
    getContent: () => {
      if (!editor) return '';
      return htmlToPlainText(editor.getHTML());
    },
    focusRange: (start: number, end: number, severity: 'warning' | 'error' | 'info' = 'warning') => {
      locateAndHighlightRange(undefined, start, end, undefined, undefined, undefined, severity);
    },
    locateIssue: (location: IssueLocation | string) => {
      if (!editor || !location) return;

      if (typeof location === 'string') {
        locateAndHighlightRange(location, undefined, undefined, undefined, undefined, undefined, 'warning');
        return;
      }

      const severity = location.severity || (location.type?.includes('very_long') || location.type?.includes('error') ? 'error' : 'warning');
      locateAndHighlightRange(
        location.text,
        location.start,
        location.end,
        location.sentenceIndex,
        location.paragraphIndex,
        location.contextSnippet,
        severity
      );
    },
    locateAndHighlight: (searchText: string) => {
      if (!editor || !searchText?.trim()) return;
      locateAndHighlightRange(searchText, undefined, undefined, undefined, undefined, undefined, 'warning');
    },
    insertTextAtLocation: (textToInsert: string, target: 'intro' | 'after_h1' | 'end' | 'cursor' = 'cursor') => {
      if (!editor || !textToInsert) return;

      if (target === 'cursor') {
        editor.chain().focus().insertContent(`\n\n${textToInsert}\n\n`).run();
        return;
      }

      if (target === 'end') {
        editor.chain().focus('end').insertContent(`\n\n${textToInsert}\n\n`).run();
        return;
      }

      if (target === 'intro' || target === 'after_h1') {
        const doc = editor.state.doc;
        let h1EndPos: number | null = null;
        doc.descendants((node, pos) => {
          if (node.type.name === 'heading' && node.attrs.level === 1 && h1EndPos === null) {
            h1EndPos = pos + node.nodeSize;
          }
        });

        if (h1EndPos !== null) {
          editor.chain().focus().setTextSelection(h1EndPos).insertContent(`\n\n${textToInsert}\n\n`).run();
        } else {
          editor.chain().focus('start').insertContent(`${textToInsert}\n\n`).run();
        }
      }
    },
    applyHyperlink: (anchorText: string, url: string, location?: IssueLocation): boolean => {
      if (!editor || !url) return false;
      const cleanAnchor = anchorText?.trim() || '';
      const doc = editor.state.doc;
      const docSize = doc.content.size;

      let matchFrom: number | null = null;
      let matchTo: number | null = null;

      // Strategy 1: Match within contextSnippet if available
      if (location?.contextSnippet && cleanAnchor) {
        const snippetText = location.contextSnippet.trim().toLowerCase();
        const targetText = cleanAnchor.toLowerCase();

        doc.descendants((node, pos) => {
          if (node.isBlock && !node.isText) {
            const blockText = node.textBetween(0, node.content.size, '\n', '\n');
            const normBlock = blockText.toLowerCase();
            const snippetIdx = normBlock.indexOf(snippetText);

            if (snippetIdx !== -1 && matchFrom === null) {
              const relAnchorIdx = snippetText.indexOf(targetText);
              const targetFromInBlock = relAnchorIdx !== -1 ? snippetIdx + relAnchorIdx : snippetIdx;
              const targetToInBlock = targetFromInBlock + cleanAnchor.length;

              let currentOffsetInBlock = 0;
              node.descendants((childNode, childPos) => {
                if (childNode.isText && childNode.text) {
                  const childLen = childNode.text.length;
                  const nodeStartOffset = currentOffsetInBlock;
                  const nodeEndOffset = currentOffsetInBlock + childLen;

                  if (matchFrom === null && targetFromInBlock >= nodeStartOffset && targetFromInBlock < nodeEndOffset) {
                    matchFrom = pos + 1 + childPos + (targetFromInBlock - nodeStartOffset);
                  }
                  if (matchTo === null && targetToInBlock > nodeStartOffset && targetToInBlock <= nodeEndOffset) {
                    matchTo = pos + 1 + childPos + (targetToInBlock - nodeStartOffset);
                  }
                  currentOffsetInBlock += childLen;
                }
                return true;
              });
            }
          }
          return true;
        });
      }

      // Strategy 2: If start & end offsets are provided or snippet didn't match, find exact occurrence candidate
      if (matchFrom === null && cleanAnchor) {
        const normalizedTarget = cleanAnchor.toLowerCase();
        interface Candidate { from: number; to: number; dist: number }
        const candidates: Candidate[] = [];

        doc.descendants((node, pos) => {
          if (node.isBlock && !node.isText) {
            const blockText = node.textBetween(0, node.content.size, '\n', '\n');
            const normalizedBlock = blockText.toLowerCase();
            let searchIdx = 0;

            while (searchIdx < normalizedBlock.length) {
              const foundIdx = normalizedBlock.indexOf(normalizedTarget, searchIdx);
              if (foundIdx === -1) break;

              let currentOffsetInBlock = 0;
              let cFrom: number | null = null;
              let cTo: number | null = null;
              const matchEndInBlock = foundIdx + cleanAnchor.length;

              node.descendants((childNode, childPos) => {
                if (childNode.isText && childNode.text) {
                  const childLen = childNode.text.length;
                  const nodeStartOffset = currentOffsetInBlock;
                  const nodeEndOffset = currentOffsetInBlock + childLen;

                  if (cFrom === null && foundIdx >= nodeStartOffset && foundIdx < nodeEndOffset) {
                    cFrom = pos + 1 + childPos + (foundIdx - nodeStartOffset);
                  }
                  if (cTo === null && matchEndInBlock > nodeStartOffset && matchEndInBlock <= nodeEndOffset) {
                    cTo = pos + 1 + childPos + (matchEndInBlock - nodeStartOffset);
                  }
                  currentOffsetInBlock += childLen;
                }
                return true;
              });

              if (cFrom !== null) {
                const finalTo = cTo !== null ? cTo : (cFrom + cleanAnchor.length);
                const dist = typeof location?.start === 'number' ? Math.abs(pos - location.start) : 0;
                candidates.push({ from: cFrom, to: Math.min(finalTo, docSize), dist });
              }

              searchIdx = foundIdx + Math.max(1, cleanAnchor.length);
            }
          }
          return true;
        });

        if (candidates.length > 0) {
          if (typeof location?.start === 'number') {
            candidates.sort((a, b) => a.dist - b.dist);
          }
          matchFrom = candidates[0].from;
          matchTo = candidates[0].to;
        }
      }

      if (matchFrom !== null) {
        const finalTo = matchTo !== null ? matchTo : (matchFrom + cleanAnchor.length);
        editor.chain().focus().setTextSelection({ from: matchFrom, to: Math.min(finalTo, docSize) }).setLink({ href: url, target: '_blank' }).run();
        locateAndHighlightRange(cleanAnchor, undefined, undefined, undefined, undefined, location?.contextSnippet, 'info');
        return true;
      } else {
        // Fallback: If anchor text does not exist verbatim, insert hyperlinked anchor at cursor position
        editor.chain().focus().insertContent(` <a href="${url}" target="_blank">${cleanAnchor || url}</a> `).run();
        return true;
      }
    }
  }), [editor]);

  return (
    <div className={cn('flex flex-col h-full min-h-0 overflow-hidden', className)}>
      <Toolbar editor={editor} />
      <div 
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain editor-scroll-region"
      >
        <EditorContent editor={editor} className="min-h-full" />
      </div>
    </div>
  );
});
RichTextEditor.displayName = 'RichTextEditor';

/* ── markdown → HTML converter for seeding the editor ── */
function markdownToHTML(md: string): string {
  if (!md.trim()) return '';
  const lines = md.split('\n');
  const output: string[] = [];
  let inList: 'ul' | 'ol' | null = null;
  let inBlockquote = false;

  const closeList = () => {
    if (inList === 'ul') { output.push('</ul>'); inList = null; }
    else if (inList === 'ol') { output.push('</ol>'); inList = null; }
  };
  const closeBlockquote = () => {
    if (inBlockquote) { output.push('</blockquote>'); inBlockquote = false; }
  };

  const inlineFormat = (text: string) =>
    text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
      .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" />');

  for (const rawLine of lines) {
    const line = rawLine;

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      closeList(); closeBlockquote();
      output.push('<hr />');
      continue;
    }
    // Headings
    const h = line.match(/^(#{1,4})\s(.+)/);
    if (h) {
      closeList(); closeBlockquote();
      const lvl = h[1].length;
      output.push(`<h${lvl}>${inlineFormat(h[2])}</h${lvl}>`);
      continue;
    }
    // Blockquote
    if (line.startsWith('> ')) {
      closeList();
      if (!inBlockquote) { output.push('<blockquote>'); inBlockquote = true; }
      output.push(`<p>${inlineFormat(line.slice(2))}</p>`);
      continue;
    }
    closeBlockquote();

    // Unordered list
    const ul = line.match(/^[-*]\s(.+)/);
    if (ul) {
      if (inList !== 'ul') { closeList(); output.push('<ul>'); inList = 'ul'; }
      output.push(`<li>${inlineFormat(ul[1])}</li>`);
      continue;
    }
    // Ordered list
    const ol = line.match(/^\d+\.\s(.+)/);
    if (ol) {
      if (inList !== 'ol') { closeList(); output.push('<ol>'); inList = 'ol'; }
      output.push(`<li>${inlineFormat(ol[1])}</li>`);
      continue;
    }
    closeList();

    // Empty line = paragraph break
    if (!line.trim()) {
      output.push('');
      continue;
    }
    // Regular paragraph
    output.push(`<p>${inlineFormat(line)}</p>`);
  }
  closeList();
  closeBlockquote();
  return output.join('');
}

// Need to export the ref type
