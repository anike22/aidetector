import { useEditor, EditorContent, Editor } from '@tiptap/react';
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
export interface RichTextEditorRef {
  setContent: (content: string) => void;
  getContent: () => string;
}

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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      Image.configure({ allowBase64: false, inline: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: placeholder || 'Start writing your article…' }),
    ],
    content: markdownToHTML(initialValue || ''),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] px-4 md:px-6 py-4 text-foreground leading-relaxed',
      },
    },
    onUpdate({ editor: ed }) {
      if (isExternalUpdate.current) return;
      const html = ed.getHTML();
      const plain = htmlToPlainText(html);
      onChange(plain);
      onHTMLChange?.(html);
    },
  });

  React.useImperativeHandle(ref, () => ({
    setContent: (content: string) => {
      if (!editor) return;
      isExternalUpdate.current = true;
      const html = markdownToHTML(content);
      editor.commands.setContent(html, { emitUpdate: false } as any);
      editor.commands.focus('end');
      setTimeout(() => { isExternalUpdate.current = false; }, 0);
    },
    getContent: () => {
      if (!editor) return '';
      return htmlToPlainText(editor.getHTML());
    }
  }), [editor]);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Toolbar editor={editor} />
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
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
