import React, { useState, useMemo } from 'react';
import { Monitor, Smartphone, Globe, CheckCircle2, AlertTriangle, ExternalLink, Sparkles, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface GoogleSERPPreviewProps {
  title: string;
  keyword: string;
  content: string;
  customSlug?: string;
  domain?: string;
  className?: string;
}

/**
 * Extracts plain text clean excerpt from Markdown content.
 */
export function extractSnippetDescription(content: string, maxLength: number = 160): string {
  if (!content.trim()) {
    return 'Comprehensive article optimizing for search visibility, reader engagement, and Google rankings.';
  }

  // Remove markdown headers, links, images, blockquotes, and multiple newlines
  const clean = content
    .replace(/^#+\s+.+$/gm, '') // remove headings
    .replace(/!\[.*?\]\(.*?\)/g, '') // remove images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // unwrap links
    .replace(/[*_`~>#]/g, '') // remove markdown symbols
    .replace(/\s+/g, ' ') // collapse whitespaces
    .trim();

  if (!clean) {
    return 'Comprehensive article optimizing for search visibility, reader engagement, and Google rankings.';
  }

  if (clean.length <= maxLength) return clean;
  // Cut at last space before maxLength
  const cut = clean.substring(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return lastSpace > 100 ? `${cut.substring(0, lastSpace)}...` : `${cut}...`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50) || 'article';
}

export const GoogleSERPPreview: React.FC<GoogleSERPPreviewProps> = ({
  title,
  keyword,
  content,
  customSlug,
  domain = 'yourblog.com',
  className,
}) => {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [customMetaDesc, setCustomMetaDesc] = useState<string>('');
  const [isEditingDesc, setIsEditingDesc] = useState<boolean>(false);

  const cleanTitle = title.trim() || 'Untitled Blog Post';
  const autoMetaDesc = useMemo(() => extractSnippetDescription(content, 160), [content]);
  const metaDescription = customMetaDesc.trim() || autoMetaDesc;
  const slug = customSlug || slugify(keyword || title);

  // SERP Metrics Calculations
  const titleCharCount = cleanTitle.length;
  // Desktop typical cut-off is ~580-600px or ~60 characters
  // Mobile typical cut-off is ~500px or ~55-60 characters
  const maxTitleChars = device === 'desktop' ? 60 : 58;
  const isTitleOver = titleCharCount > maxTitleChars;
  const titlePixelEstimate = Math.round(titleCharCount * 9.5); // avg char pixel width

  const descCharCount = metaDescription.length;
  const maxDescChars = 160;
  const isDescOptimal = descCharCount >= 120 && descCharCount <= 160;
  const isDescOver = descCharCount > maxDescChars;

  // Keyword presence checks
  const cleanKeyword = keyword.trim().toLowerCase();
  const keywordInTitle = cleanKeyword ? cleanTitle.toLowerCase().includes(cleanKeyword) : false;
  const keywordInDesc = cleanKeyword ? metaDescription.toLowerCase().includes(cleanKeyword) : false;

  // Simulated truncated title for preview
  const displayTitle = isTitleOver 
    ? `${cleanTitle.substring(0, maxTitleChars)}...`
    : cleanTitle;

  const todayDateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={cn("bg-card border border-border rounded-xl overflow-hidden shadow-sm", className)}>
      {/* ── Top Header Controls ── */}
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            G
          </div>
          <div>
            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>Google SERP Snippet Preview</span>
              <Badge variant="outline" className="text-[10px] font-semibold py-0 h-4 border-primary/30 text-primary bg-primary/5">
                Live Simulation
              </Badge>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Simulates how your locked title and article appear in Google search results
            </div>
          </div>
        </div>

        {/* Viewport switch: Desktop vs Mobile */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border/60">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
              device === 'desktop'
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all",
              device === 'mobile'
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>
        </div>
      </div>

      {/* ── Google Search Snippet Simulation Box ── */}
      <div className="p-4 md:p-5 bg-background border-b border-border/60">
        <div
          className={cn(
            "transition-all mx-auto",
            device === 'mobile'
              ? "max-w-md p-4 rounded-xl border border-border/80 bg-card/60 shadow-xs"
              : "max-w-2xl"
          )}
        >
          {/* Breadcrumbs & URL */}
          <div className="flex items-center gap-2 mb-1.5 text-[12px] md:text-[13px] text-[#4d5156] dark:text-[#bdc1c6] overflow-hidden">
            <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Globe className="w-2.5 h-2.5" />
            </div>
            <div className="flex items-center gap-1 truncate font-normal">
              <span className="font-semibold text-foreground/80">{domain}</span>
              <span className="text-muted-foreground">›</span>
              <span className="text-muted-foreground">blog</span>
              <span className="text-muted-foreground">›</span>
              <span className="text-muted-foreground truncate">{slug}</span>
            </div>
          </div>

          {/* Title tag display (Authentic Google Blue) */}
          <h3 
            className={cn(
              "text-[#1a0dab] dark:text-[#8ab4f8] font-normal leading-snug hover:underline cursor-pointer transition-colors mb-1.5",
              device === 'desktop' ? "text-[18px] md:text-[20px]" : "text-[16px] font-medium"
            )}
            title={cleanTitle}
          >
            {displayTitle}
          </h3>

          {/* Meta Description snippet */}
          <p className="text-[13px] md:text-[14px] text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed">
            <span className="text-muted-foreground text-[12px] mr-1.5 font-medium">{todayDateStr} —</span>
            <span>{metaDescription}</span>
          </p>
        </div>
      </div>

      {/* ── Metric Gauges & Optimization Diagnostics ── */}
      <div className="px-4 py-3 bg-card/70 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {/* Title Length Diagnostic */}
        <div className="p-2.5 rounded-lg border border-border bg-background/50 flex flex-col justify-between">
          <div className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
            <span>Title Length</span>
            <span className={cn(
              "font-bold",
              isTitleOver ? "text-warning" : titleCharCount >= 40 ? "text-success" : "text-muted-foreground"
            )}>
              {titleCharCount}/{maxTitleChars} chars
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isTitleOver ? "bg-warning" : titleCharCount >= 40 ? "bg-success" : "bg-primary"
              )}
              style={{ width: `${Math.min(100, (titleCharCount / maxTitleChars) * 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1.5">
            {isTitleOver 
              ? `⚠ Exceeds limit by ${titleCharCount - maxTitleChars} chars (truncated in SERP)`
              : titleCharCount >= 40 
              ? '✓ Optimal title length (no truncation)'
              : 'Tip: 40–60 characters performs best'}
          </div>
        </div>

        {/* Pixel Width Estimate */}
        <div className="p-2.5 rounded-lg border border-border bg-background/50 flex flex-col justify-between">
          <div className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
            <span>Pixel Width</span>
            <span className={cn(
              "font-bold",
              titlePixelEstimate > 580 ? "text-warning" : "text-success"
            )}>
              ~{titlePixelEstimate}px / 580px
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                titlePixelEstimate > 580 ? "bg-warning" : "bg-success"
              )}
              style={{ width: `${Math.min(100, (titlePixelEstimate / 580) * 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1.5">
            {titlePixelEstimate > 580
              ? 'Warning: Google may truncate with "..."'
              : '✓ Fits within desktop 580px view container'}
          </div>
        </div>

        {/* Keyword Presence Diagnostic */}
        <div className="p-2.5 rounded-lg border border-border bg-background/50 flex flex-col justify-between">
          <div className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
            <span>Keyword Placement</span>
            {keywordInTitle ? (
              <Badge variant="outline" className="text-[10px] text-success border-success/30 bg-success/10 py-0 h-4">
                Found
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30 bg-destructive/10 py-0 h-4">
                Missing
              </Badge>
            )}
          </div>
          <div className="text-[11px] font-semibold text-foreground mt-1 truncate" title={keyword}>
            "{keyword || 'None'}"
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {keywordInTitle
              ? '✓ Primary keyword is prominently placed'
              : 'Primary keyword should appear in your title'}
          </div>
        </div>

        {/* Description Length & Extraction */}
        <div className="p-2.5 rounded-lg border border-border bg-background/50 flex flex-col justify-between">
          <div className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
            <span>Meta Snippet</span>
            <span className={cn(
              "font-bold",
              isDescOver ? "text-warning" : isDescOptimal ? "text-success" : "text-muted-foreground"
            )}>
              {descCharCount}/160 chars
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isDescOver ? "bg-warning" : isDescOptimal ? "bg-success" : "bg-primary"
              )}
              style={{ width: `${Math.min(100, (descCharCount / maxDescChars) * 100)}%` }}
            />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1.5 flex items-center justify-between">
            <span>{isDescOptimal ? '✓ Ideal snippet range' : isDescOver ? 'Snippet is trimmed' : 'Extracted from intro'}</span>
            <button
              type="button"
              onClick={() => setIsEditingDesc(!isEditingDesc)}
              className="text-primary hover:underline font-semibold"
            >
              {isEditingDesc ? 'Close' : 'Customize'}
            </button>
          </div>
        </div>
      </div>

      {/* Optional Custom Meta Description Input Drawer */}
      {isEditingDesc && (
        <div className="px-4 py-3 bg-muted/20 border-t border-border flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Custom Meta Description</span>
            <button
              type="button"
              onClick={() => {
                setCustomMetaDesc('');
                setIsEditingDesc(false);
              }}
              className="text-muted-foreground hover:text-foreground text-[11px]"
            >
              Reset to auto-extracted
            </button>
          </div>
          <textarea
            value={customMetaDesc}
            onChange={(e) => setCustomMetaDesc(e.target.value)}
            placeholder={autoMetaDesc}
            rows={2}
            className="w-full text-xs p-2 rounded-md bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}
    </div>
  );
};
