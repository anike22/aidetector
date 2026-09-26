import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Minus,
  Code,
  Table as TableIcon,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Undo2,
  Redo2,
  RemoveFormatting,
  Eye,
  Code2,
  Sparkles,
  Upload,
  ExternalLink,
  Plus,
  Trash2,
  AlertCircle,
  HelpCircle,
  Columns,
  Rows,
} from 'lucide-react';
import { toast } from 'sonner';
import { sanitizeHtml, isValidSafeUrl } from '@/utils/sanitize';
import { uploadInlineImage } from '@/utils/imageUploadService';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
  placeholder?: string;
  className?: string;
}

// Custom configured TipTap Image extension with alignment and sizing attributes
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      dataAlign: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-align') || element.dataset.align || 'center',
        renderHTML: (attributes) => {
          return {
            'data-align': attributes.dataAlign,
          };
        },
      },
      dataSize: {
        default: 'full',
        parseHTML: (element) => element.getAttribute('data-size') || element.dataset.size || 'full',
        renderHTML: (attributes) => {
          return {
            'data-size': attributes.dataSize,
          };
        },
      },
      dataCaption: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-caption') || element.dataset.caption || null,
        renderHTML: (attributes) => {
          if (!attributes.dataCaption) return {};
          return {
            'data-caption': attributes.dataCaption,
          };
        },
      },
    };
  },
});

function isMarkdownFormat(content: string): boolean {
  if (!content) return false;
  const trimmed = content.trim();
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) return false;
  // Markdown indicators
  const hasMdHeadings = /^#{1,6}\s+/m.test(trimmed);
  const hasMdLists = /^[-*]\s+/m.test(trimmed) || /^\d+\.\s+/m.test(trimmed);
  const hasMdLinks = /\[([^\]]+)\]\(([^)]+)\)/.test(trimmed);
  const hasMdImages = /!\[([^\]]*)\]\(([^)]+)\)/.test(trimmed);
  const hasMdTables = /\|.+?\|.+?\|/m.test(trimmed);
  const hasMdBold = /\*\*[^*]+\*\*/.test(trimmed) || /__[^_]+__/.test(trimmed);

  return hasMdHeadings || hasMdLists || hasMdLinks || hasMdImages || hasMdTables || hasMdBold;
}

function convertMarkdownToHtmlForEditor(md: string): string {
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // fenced code blocks
  html = html.replace(/```(?:\w+)?\n([\s\S]*?)\n```/g, '<pre><code>$1</code></pre>');

  // inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // headings (only h2-h4 inside editor)
  html = html.replace(/^(#{1,6})\s+(.+)$/gm, (_, hashes, text) => {
    const rawLevel = hashes.length;
    // Map H1 to H2 to reserve H1 for title
    const level = rawLevel === 1 ? 2 : Math.min(rawLevel, 4);
    return `<h${level}>${text.trim()}</h${level}>`;
  });

  // markdown tables
  html = html.replace(/((?:\|[^\n]+\|\r?\n)+)/g, (tableBlock) => {
    const lines = tableBlock.trim().split('\n').filter(l => l.includes('|'));
    if (lines.length < 2) return tableBlock;

    let tableHtml = '<table class="border-collapse border border-border my-4 w-full"><tbody>';
    let isHeader = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Separator line: |---|---|
      const isSeparator = new RegExp('^\\|[\\-\\:\\s\\|]+\\|$').test(line);
      if (isSeparator) {
        isHeader = false;
        continue;
      }
      const cells = line
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map(c => c.trim());

      tableHtml += '<tr>';
      cells.forEach(cell => {
        if (isHeader && i === 0) {
          tableHtml += `<th class="border border-border p-2 bg-muted font-bold text-left">${cell}</th>`;
        } else {
          tableHtml += `<td class="border border-border p-2 text-left">${cell}</td>`;
        }
      });
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table>';
    return tableHtml;
  });

  // images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" data-align="center" data-size="full" />');

  // links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // bold / italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
  html = html.replace(/_(.+?)_/g, '<em>$1</em>');

  // horizontal rules
  html = html.replace(/^---$/gm, '<hr/>');

  // blockquotes
  html = html.replace(/^>(.+)$/gm, '<blockquote><p>$1</p></blockquote>');

  // unordered lists
  html = html.replace(/^(?:[-*])\s+(.+)$/gm, '<li>$1</li>');
  // ordered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

  // wrap lists
  html = html.replace(/(<li>[\s\S]*?<\/li>\n*)+/g, (match) => {
    return `<ul>${match.replace(/\n/g, '')}</ul>`;
  });

  // paragraphs
  html = html.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>');

  return `<p>${html}</p>`;
}

export function RichTextEditor({
  value,
  onChange,
  onUploadingChange,
  placeholder = 'Write or paste your article content here...',
  className = '',
}: RichTextEditorProps) {
  const [mode, setMode] = useState<'visual' | 'source' | 'preview'>('visual');
  const [sourceCode, setSourceCode] = useState(value || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Link Dialog State
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkOpenNewTab, setLinkOpenNewTab] = useState(true);

  // Image Dialog State
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageSourceType, setImageSourceType] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [imageAlign, setImageAlign] = useState<'center' | 'left' | 'right' | 'full'>('center');
  const [imageSize, setImageSize] = useState<'full' | 'medium' | 'small'>('full');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize internal uploading state with parent
  const setUploading = useCallback((uploading: boolean) => {
    setIsUploading(uploading);
    onUploadingChange?.(uploading);
  }, [onUploadingChange]);

  // TipTap editor instance
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Underline,
      Typography,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          class: 'text-primary underline underline-offset-2',
        },
      }),
      CustomImage.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-3',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-border w-full my-4 table-auto',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-border p-2 bg-muted font-bold text-left',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border p-2 text-left',
        },
      }),
    ],
    content: isMarkdownFormat(value) ? convertMarkdownToHtmlForEditor(value) : (value || '<p></p>'),
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const sanitized = sanitizeHtml(html);
      setSourceCode(sanitized);
      onChange(sanitized);
    },
  });

  // Keep source code state synchronized when external value changes
  useEffect(() => {
    setSourceCode(value || '');
  }, [value]);

  // Handle switching to Visual mode
  const handleSwitchToVisual = () => {
    if (!editor) return;
    let newHtml = sourceCode;
    if (isMarkdownFormat(sourceCode)) {
      newHtml = convertMarkdownToHtmlForEditor(sourceCode);
      toast.info('Converted markdown syntax to visual format');
    }
    const sanitized = sanitizeHtml(newHtml);
    editor.commands.setContent(sanitized || '<p></p>');
    setMode('visual');
  };

  // Handle switching to Source mode
  const handleSwitchToSource = () => {
    if (editor && mode === 'visual') {
      const currentHtml = editor.getHTML();
      const sanitized = sanitizeHtml(currentHtml);
      setSourceCode(sanitized);
      onChange(sanitized);
    }
    setMode('source');
  };

  // Handle switching to Preview mode
  const handleSwitchToPreview = () => {
    if (editor && mode === 'visual') {
      const currentHtml = editor.getHTML();
      const sanitized = sanitizeHtml(currentHtml);
      setSourceCode(sanitized);
      onChange(sanitized);
    }
    setMode('preview');
  };

  // Link management
  const openLinkModal = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    const previousUrl = editor.getAttributes('link').href || '';
    const previousTarget = editor.getAttributes('link').target === '_blank';

    setLinkText(selectedText);
    setLinkUrl(previousUrl);
    setLinkOpenNewTab(previousTarget || true);
    setLinkDialogOpen(true);
  };

  const handleApplyLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;

    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setLinkDialogOpen(false);
      return;
    }

    if (!isValidSafeUrl(linkUrl)) {
      toast.error('Invalid URL scheme. Please provide a valid http, https, mailto, or relative link.');
      return;
    }

    const target = linkOpenNewTab ? '_blank' : undefined;

    // If anchor text was changed and selection was empty or different
    if (linkText && editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent(
          `<a href="${linkUrl.trim()}" ${target ? 'target="_blank" rel="noopener noreferrer"' : ''}>${linkText}</a>`
        )
        .run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({
          href: linkUrl.trim(),
          target,
        })
        .run();
    }

    setLinkDialogOpen(false);
    toast.success('Link applied');
  };

  const handleRemoveLink = () => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setLinkDialogOpen(false);
    toast.info('Link removed');
  };

  // Image upload and insertion
  const openImageModal = () => {
    setImageUrl('');
    setImageAlt('');
    setImageCaption('');
    setImageAlign('center');
    setImageSize('full');
    setImageSourceType('upload');
    setImageDialogOpen(true);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(10);

      const result = await uploadInlineImage(file, (progress) => {
        setUploadProgress(progress);
      });

      if (result.error || !result.url) {
        throw new Error(result.error || 'Upload failed');
      }

      setImageUrl(result.url);
      if (!imageAlt) {
        setImageAlt(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
      toast.success('Image uploaded successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Error uploading image');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInsertImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;

    if (!imageUrl.trim()) {
      toast.error('Please upload an image or enter a valid HTTPS URL');
      return;
    }

    if (!isValidSafeUrl(imageUrl)) {
      toast.error('Invalid image URL scheme. Please use an https:// URL.');
      return;
    }

    const alignClass =
      imageAlign === 'left'
        ? 'align-left float-left mr-4 mb-3'
        : imageAlign === 'right'
        ? 'align-right float-right ml-4 mb-3'
        : 'align-center mx-auto block';

    const sizeClass =
      imageSize === 'small'
        ? 'max-w-xs'
        : imageSize === 'medium'
        ? 'max-w-lg'
        : 'w-full';

    // Insert figure structure if caption exists, otherwise standard image with metadata
    if (imageCaption.trim()) {
      const figureHtml = `
        <figure class="article-figure my-6 ${alignClass} ${sizeClass}">
          <img src="${imageUrl.trim()}" alt="${imageAlt.trim() || 'Article image'}" class="rounded-lg shadow-sm w-full h-auto" />
          <figcaption class="text-xs text-muted-foreground text-center mt-2 italic">${imageCaption.trim()}</figcaption>
        </figure>
      `;
      editor.chain().focus().insertContent(figureHtml).run();
    } else {
      editor
        .chain()
        .focus()
        .setImage({
          src: imageUrl.trim(),
          alt: imageAlt.trim() || 'Article illustration',
          title: imageCaption.trim() || undefined,
        })
        .updateAttributes('image', {
          dataAlign: imageAlign,
          dataSize: imageSize,
          class: `rounded-lg my-4 ${alignClass} ${sizeClass}`,
        })
        .run();
    }

    setImageDialogOpen(false);
    toast.success('Image inserted into article');
  };

  // Table operations
  const insertTable = (rows = 3, cols = 3) => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    toast.success(`Inserted ${rows}x${cols} table`);
  };

  return (
    <div className={`border border-border rounded-xl bg-card overflow-hidden ${className}`}>
      {/* Top Header: Mode Switcher & Word Count */}
      <div className="flex flex-wrap items-center justify-between border-b border-border bg-muted/40 px-3 py-2 gap-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant={mode === 'visual' ? 'default' : 'ghost'}
            onClick={handleSwitchToVisual}
            className="h-8 text-xs font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary-foreground" />
            Visual Editor
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'source' ? 'default' : 'ghost'}
            onClick={handleSwitchToSource}
            className="h-8 text-xs font-medium"
          >
            <Code2 className="w-3.5 h-3.5 mr-1.5" />
            HTML / Source
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'preview' ? 'default' : 'ghost'}
            onClick={handleSwitchToPreview}
            className="h-8 text-xs font-medium"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            Live Preview
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isUploading && (
            <Badge variant="outline" className="animate-pulse bg-primary/10 text-primary border-primary/20 text-xs">
              Uploading image...
            </Badge>
          )}
          <span>
            {sourceCode.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).filter(Boolean).length} words
          </span>
        </div>
      </div>

      {/* Visual Mode Active Toolbar */}
      {mode === 'visual' && editor && (
        <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-card overflow-x-auto text-foreground">
          {/* History */}
          <div className="flex items-center gap-0.5 pr-1 border-r border-border/80">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Headings */}
          <div className="flex items-center gap-0.5 px-1 border-r border-border/80">
            <Button
              type="button"
              variant={editor.isActive('paragraph') ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => editor.chain().focus().setParagraph().run()}
              title="Paragraph"
            >
              P
            </Button>
            <Button
              type="button"
              variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              title="Heading 2 (H2)"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              title="Heading 3 (H3)"
            >
              <Heading3 className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('heading', { level: 4 }) ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
              title="Heading 4 (H4)"
            >
              <Heading4 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Inline styles */}
          <div className="flex items-center gap-0.5 px-1 border-r border-border/80">
            <Button
              type="button"
              variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('code') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => editor.chain().focus().toggleCode().run()}
              title="Inline Code"
            >
              <Code className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
              title="Clear Formatting"
            >
              <RemoveFormatting className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Lists & Quotes */}
          <div className="flex items-center gap-0.5 px-1 border-r border-border/80">
            <Button
              type="button"
              variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Bullet List"
            >
              <List className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Numbered List"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              title="Blockquote"
            >
              <Quote className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('codeBlock') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              title="Code Block"
            >
              <Code2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal Divider"
            >
              <Minus className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Links & Images */}
          <div className="flex items-center gap-0.5 px-1 border-r border-border/80">
            <Button
              type="button"
              variant={editor.isActive('link') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 text-primary"
              onClick={openLinkModal}
              title={editor.isActive('link') ? 'Edit Link' : 'Insert Link'}
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </Button>
            {editor.isActive('link') && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={handleRemoveLink}
                title="Remove Link"
              >
                <Unlink className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary"
              onClick={openImageModal}
              title="Insert Inline Image (Upload or URL)"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Table Menu */}
          <div className="flex items-center gap-0.5 pl-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant={editor.isActive('table') ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Table</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => insertTable(3, 3)}>
                  <Plus className="w-4 h-4 mr-2" /> Insert 3x3 Table
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => insertTable(4, 4)}>
                  <Plus className="w-4 h-4 mr-2" /> Insert 4x4 Table
                </DropdownMenuItem>
                {editor.isActive('table') && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>
                      <Rows className="w-4 h-4 mr-2" /> Add Row Below
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}>
                      <Trash2 className="w-4 h-4 mr-2 text-destructive" /> Delete Row
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>
                      <Columns className="w-4 h-4 mr-2" /> Add Column Right
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}>
                      <Trash2 className="w-4 h-4 mr-2 text-destructive" /> Delete Column
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Table
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Upload Progress Indicator */}
      {isUploading && (
        <div className="p-3 bg-primary/5 border-b border-border">
          <div className="flex justify-between text-xs text-primary font-medium mb-1.5">
            <span>Uploading inline asset to Supabase Storage...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-1.5" />
        </div>
      )}

      {/* Editor Content Area */}
      <div className="relative">
        {mode === 'visual' && (
          <div className="p-4 md:p-6 min-h-[350px] max-h-[600px] overflow-y-auto focus-within:ring-1 focus-within:ring-primary/20 bg-background">
            <EditorContent editor={editor} />
          </div>
        )}

        {mode === 'source' && (
          <div className="p-4 bg-background">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span className="font-medium">Raw HTML / Markdown Content</span>
              <span className="text-[11px]">Direct changes are reflected in real time</span>
            </div>
            <Textarea
              value={sourceCode}
              onChange={(e) => {
                setSourceCode(e.target.value);
                onChange(e.target.value);
              }}
              rows={16}
              className="font-mono text-xs leading-relaxed bg-muted/20 border-border resize-y"
              placeholder="Enter HTML tags (<h2>, <p>, <table>) or Markdown (#, **, -)..."
            />
          </div>
        )}

        {mode === 'preview' && (
          <div className="p-6 md:p-8 bg-card min-h-[350px] max-h-[650px] overflow-y-auto">
            <div className="border-b border-border pb-4 mb-6">
              <Badge variant="outline" className="mb-2 text-primary border-primary/20 bg-primary/5">
                Live Article Preview
              </Badge>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-navy">
                Preview of Rendered Output
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Rendered with the exact same typography, table, figure, and styling rules as the public article view.
              </p>
            </div>

            <div
              className="prose-container max-w-none text-foreground/80 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(
                  isMarkdownFormat(sourceCode)
                    ? convertMarkdownToHtmlForEditor(sourceCode)
                    : sourceCode
                ),
              }}
            />
          </div>
        )}
      </div>

      {/* Link Insertion/Editing Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <LinkIcon className="w-4 h-4 text-primary" />
              {linkUrl ? 'Edit Hyperlink' : 'Insert Hyperlink'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleApplyLink} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Anchor Text</label>
              <Input
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Clickable text label"
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Target URL (HTTPS or Relative)</label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com/guide or /pricing"
                className="text-sm"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Unsafe protocols (javascript:, data:) will be rejected for security.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="link-new-tab"
                type="checkbox"
                checked={linkOpenNewTab}
                onChange={(e) => setLinkOpenNewTab(e.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="link-new-tab" className="text-xs text-foreground font-medium cursor-pointer">
                Open in new tab (target=&quot;_blank&quot;, rel=&quot;noopener noreferrer&quot;)
              </label>
            </div>

            <DialogFooter className="flex justify-between items-center sm:justify-between pt-3 border-t border-border">
              {linkUrl && (
                <Button type="button" variant="ghost" size="sm" onClick={handleRemoveLink} className="text-destructive text-xs">
                  Remove Link
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" size="sm" onClick={() => setLinkDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Apply Link
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Inline Image Insertion Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="w-4 h-4 text-primary" />
              Insert Inline Image
            </DialogTitle>
          </DialogHeader>

          <div className="flex border-b border-border mb-4">
            <button
              type="button"
              onClick={() => setImageSourceType('upload')}
              className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${
                imageSourceType === 'upload'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Upload from Device
            </button>
            <button
              type="button"
              onClick={() => setImageSourceType('url')}
              className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors ${
                imageSourceType === 'url'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Image HTTPS URL
            </button>
          </div>

          <form onSubmit={handleInsertImage} className="space-y-4">
            {imageSourceType === 'upload' ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Select File</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  onChange={handleImageFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />

                {imageUrl ? (
                  <div className="relative rounded-lg border border-border p-2 bg-muted/20 flex items-center gap-3">
                    <img src={imageUrl} alt="Uploaded preview" className="w-16 h-16 object-cover rounded-md border" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">Asset uploaded successfully</p>
                      <p className="text-[11px] text-muted-foreground truncate">{imageUrl}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs shrink-0"
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Upload className="w-6 h-6 text-primary" />
                    <div className="text-center">
                      <p className="text-xs font-medium text-foreground">Click or drop image to upload</p>
                      <p className="text-[11px] text-muted-foreground">PNG, JPEG, WebP, GIF (Compressed automatically if &gt;1MB)</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Image URL (HTTPS)</label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="text-sm"
                  required
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Alt Text (Accessibility &amp; SEO)</label>
                <Input
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Descriptive explanation"
                  className="text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Caption (Optional)</label>
                <Input
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="Caption displayed below image"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Alignment</label>
                <select
                  value={imageAlign}
                  onChange={(e: any) => setImageAlign(e.target.value)}
                  className="w-full text-xs h-9 px-2 rounded-md border border-border bg-background"
                >
                  <option value="center">Center</option>
                  <option value="left">Left (Float)</option>
                  <option value="right">Right (Float)</option>
                  <option value="full">Full Width</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Display Size</label>
                <select
                  value={imageSize}
                  onChange={(e: any) => setImageSize(e.target.value)}
                  className="w-full text-xs h-9 px-2 rounded-md border border-border bg-background"
                >
                  <option value="full">Standard (100%)</option>
                  <option value="medium">Medium (75%)</option>
                  <option value="small">Small (50%)</option>
                </select>
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={() => setImageDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isUploading || !imageUrl}>
                Insert into Article
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
