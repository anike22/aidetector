import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Download, Copy, CheckCircle2, Code, Share2, FileText,
  Printer, Sparkles, ExternalLink, Globe
} from 'lucide-react';
import { generateExportSnippets, generateSvgBadge } from '@/lib/verifiedAuthorship/exportUtils';
import type { AuthorshipPublicCertificate } from '@/lib/verifiedAuthorship/types';

interface AuthorshipExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificate: AuthorshipPublicCertificate;
}

export default function AuthorshipExportModal({
  open,
  onOpenChange,
  certificate,
}: AuthorshipExportModalProps) {
  const snippets = generateExportSnippets(certificate);
  const svgBadge = generateSvgBadge(certificate);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(snippets.jsonManifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manifest-${certificate.trackingCode}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON verification manifest downloaded');
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([svgBadge], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `badge-${certificate.trackingCode}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('SVG badge downloaded');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Export & Embed Authorship Certificate
          </DialogTitle>
          <DialogDescription className="text-xs">
            Generate printable certificates, dynamic status badges, CMS embeds, and cryptographic manifests for <strong>{certificate.title}</strong>.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="embeds" className="space-y-4 pt-2">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="embeds" className="text-xs gap-1.5"><Code className="w-3.5 h-3.5" />CMS Embeds</TabsTrigger>
            <TabsTrigger value="badges" className="text-xs gap-1.5"><Sparkles className="w-3.5 h-3.5" />Badges</TabsTrigger>
            <TabsTrigger value="print" className="text-xs gap-1.5"><Printer className="w-3.5 h-3.5" />Print / PDF</TabsTrigger>
            <TabsTrigger value="manifest" className="text-xs gap-1.5"><FileText className="w-3.5 h-3.5" />JSON Manifest</TabsTrigger>
          </TabsList>

          {/* 1. CMS Embeds Tab */}
          <TabsContent value="embeds" className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">HTML Responsive Badge</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => copyToClipboard(snippets.htmlEmbed, 'html')}
                  >
                    {copiedKey === 'html' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy HTML
                  </Button>
                </div>
                <Textarea readOnly value={snippets.htmlEmbed} rows={3} className="font-mono text-xs bg-muted" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">WordPress Shortcode</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => copyToClipboard(snippets.wordpressShortcode, 'wp')}
                  >
                    {copiedKey === 'wp' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy Shortcode
                  </Button>
                </div>
                <Input readOnly value={snippets.wordpressShortcode} className="font-mono text-xs bg-muted" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Webflow Embed</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px]"
                      onClick={() => copyToClipboard(snippets.webflowEmbed, 'webflow')}
                    >
                      Copy
                    </Button>
                  </div>
                  <Textarea readOnly value={snippets.webflowEmbed} rows={2} className="font-mono text-[11px] bg-muted" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Ghost CMS Embed</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[11px]"
                      onClick={() => copyToClipboard(snippets.ghostEmbed, 'ghost')}
                    >
                      Copy
                    </Button>
                  </div>
                  <Textarea readOnly value={snippets.ghostEmbed} rows={2} className="font-mono text-[11px] bg-muted" />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 2. Badges Tab */}
          <TabsContent value="badges" className="space-y-4">
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-card border space-y-2">
                <span className="text-xs font-semibold text-muted-foreground block">Dynamic SVG Preview:</span>
                <div dangerouslySetInnerHTML={{ __html: svgBadge }} className="overflow-hidden" />
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={handleDownloadSvg} size="sm" variant="default" className="gap-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" /> Download SVG Badge
                </Button>
                <Button
                  onClick={() => copyToClipboard(snippets.markdownBadge, 'mdBadge')}
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Markdown Badge
                </Button>
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-semibold">Markdown Link</span>
                <Input readOnly value={snippets.markdownLink} className="font-mono text-xs bg-muted" />
              </div>
            </div>
          </TabsContent>

          {/* 3. Print / PDF Tab */}
          <TabsContent value="print" className="space-y-4">
            <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
              <h4 className="text-sm font-semibold">Printable Authorship Certificate</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Render an official printable version formatted for standard Letter and A4 archiving, complete with QR code and cryptographic hash details.
              </p>
              <div className="flex gap-2 pt-2">
                <Button onClick={() => window.print()} className="gap-1.5 text-xs">
                  <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
                </Button>
                <Button asChild variant="outline" className="gap-1.5 text-xs">
                  <a href={snippets.verificationUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5" /> Open Public Page
                  </a>
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* 4. JSON Manifest Tab */}
          <TabsContent value="manifest" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Cryptographic JSON Manifest</span>
                <Button onClick={handleDownloadJson} size="sm" variant="outline" className="gap-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" /> Download JSON
                </Button>
              </div>
              <Textarea
                readOnly
                value={JSON.stringify(snippets.jsonManifest, null, 2)}
                rows={8}
                className="font-mono text-[11px] bg-muted"
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
