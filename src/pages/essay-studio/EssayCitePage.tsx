// EssayCitePage — citation manager: add, edit, verify, bibliography
import { useState, useEffect, useCallback } from 'react';
import { useEssayStudio } from '@/contexts/EssayStudioContext';
import { essayService } from '@/lib/essay/essayService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Trash2, CheckCircle, AlertTriangle, Edit2, BookOpen, Info, ChevronRight } from 'lucide-react';
import type { EssayCitation, CitationStyle } from '@/types/essay';
import { CITATION_STYLE_LABELS } from '@/types/essay';

const EMPTY_FORM = {
  citation_key: '',
  in_text_format: '',
  bibliography_format: '',
  citation_style: 'apa' as CitationStyle,
  position_hint: '',
  needs_verification: true,
  is_verified: false,
};

export default function EssayCitePage() {
  const { essay, goToPhase } = useEssayStudio();
  const [citations, setCitations] = useState<EssayCitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCitation, setEditingCitation] = useState<EssayCitation | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!essay) return;
    setLoading(true);
    try {
      const c = await essayService.listCitations(essay.id);
      setCitations(c);
    } catch {
      toast.error('Failed to load citations');
    } finally {
      setLoading(false);
    }
  }, [essay]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditingCitation(null);
    setForm({ ...EMPTY_FORM, citation_style: essay?.citation_style || 'apa' });
    setDialogOpen(true);
  };

  const openEdit = (c: EssayCitation) => {
    setEditingCitation(c);
    setForm({
      citation_key: c.citation_key,
      in_text_format: c.in_text_format,
      bibliography_format: c.bibliography_format,
      citation_style: c.citation_style,
      position_hint: c.position_hint,
      needs_verification: c.needs_verification,
      is_verified: c.is_verified,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!essay) return;
    if (!form.citation_key.trim()) { toast.error('Citation key is required'); return; }
    if (!form.bibliography_format.trim()) { toast.error('Bibliography format is required'); return; }
    setSaving(true);
    try {
      if (editingCitation) {
        await essayService.updateCitation(editingCitation.id, form);
        setCitations(prev => prev.map(c => c.id === editingCitation.id ? { ...c, ...form } : c));
        toast.success('Citation updated');
      } else {
        const added = await essayService.addCitation(essay.id, form);
        setCitations(prev => [...prev, added]);
        await essayService.logEvent(essay.id, 'citation_added', `Citation added: ${form.citation_key}`, {}, 0);
        toast.success('Citation added');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Failed to save citation');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await essayService.deleteCitation(deleteId);
      setCitations(prev => prev.filter(c => c.id !== deleteId));
      toast.success('Citation removed');
    } catch {
      toast.error('Failed to remove citation');
    } finally {
      setDeleteId(null);
    }
  };

  const toggleVerified = async (c: EssayCitation) => {
    try {
      await essayService.updateCitation(c.id, { is_verified: !c.is_verified, needs_verification: c.is_verified });
      setCitations(prev => prev.map(ci => ci.id === c.id ? { ...ci, is_verified: !c.is_verified, needs_verification: c.is_verified } : ci));
    } catch {
      toast.error('Failed to update verification status');
    }
  };

  const unverified = citations.filter(c => c.needs_verification && !c.is_verified);
  const citationStyleForEssay = essay?.citation_style || 'apa';

  const IN_TEXT_PLACEHOLDER: Record<CitationStyle, string> = {
    apa: '(Author, Year)',
    mla: '(Author Page)',
    chicago: '(Author Year, Page)',
    harvard: '(Author Year)',
    ieee: '[1]',
  };

  const BIB_PLACEHOLDER: Record<CitationStyle, string> = {
    apa: 'Author, A. A. (Year). Title of work. Publisher.',
    mla: 'Author Last, First. "Title." Journal, vol. #, no. #, Year, pp. #–#.',
    chicago: 'Author Last, First. Year. "Title." Journal #, no. # (Month): pages.',
    harvard: 'Author Last, First (Year) Title, Publisher, City.',
    ieee: '[1] A. Author, "Title," Journal, vol. #, no. #, pp. #–#, Year.',
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Citation Manager
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage in-text citations and your bibliography in {CITATION_STYLE_LABELS[citationStyleForEssay]} format.
          </p>
        </div>
        <Button onClick={openNew} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Add Citation
        </Button>
      </div>

      <Alert className="mb-6 border-warning/30 bg-warning/5">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertDescription className="text-sm">
          <strong>Citation Integrity:</strong> Never fabricate sources, authors, DOIs, or publication dates. If a source cannot be verified, mark it as <strong>Unverified</strong>. Essay Studio does not generate citations automatically — all citations must be entered by you.
        </AlertDescription>
      </Alert>

      {unverified.length > 0 && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {unverified.length} citation{unverified.length > 1 ? 's' : ''} still need{unverified.length === 1 ? 's' : ''} verification. Review before submitting.
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : citations.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No citations yet.</p>
            <Button onClick={openNew} className="mt-4">
              <Plus className="h-4 w-4 mr-2" /> Add First Citation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {citations.map(c => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-sm">{c.citation_key}</span>
                      <Badge variant="secondary" className="text-xs uppercase">{c.citation_style}</Badge>
                      {c.is_verified
                        ? <Badge variant="secondary" className="text-xs text-success gap-1"><CheckCircle className="h-3 w-3" />Verified</Badge>
                        : c.needs_verification
                        ? <Badge variant="secondary" className="text-xs text-warning gap-1"><AlertTriangle className="h-3 w-3" />Unverified</Badge>
                        : null
                      }
                    </div>
                    {c.in_text_format && (
                      <p className="text-xs text-muted-foreground mb-1">
                        In-text: <span className="font-mono">{c.in_text_format}</span>
                      </p>
                    )}
                    <p className="text-xs text-foreground break-words">{c.bibliography_format}</p>
                    {c.position_hint && (
                      <p className="text-xs text-muted-foreground mt-1">Position: {c.position_hint}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleVerified(c)}>
                      <CheckCircle className={`h-3.5 w-3.5 ${c.is_verified ? 'text-success' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(c.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bibliography section */}
      {citations.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Bibliography Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4 space-y-2">
              {citations.map((c, i) => (
                <p key={c.id} className="text-xs font-mono leading-relaxed">
                  {CITATION_STYLE_LABELS[c.citation_style] === 'IEEE' ? `[${i + 1}] ` : ''}
                  {c.bibliography_format}
                  {c.needs_verification && !c.is_verified && (
                    <span className="ml-2 text-warning">[Unverified]</span>
                  )}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator className="my-6" />
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => goToPhase('improve')}>Back to Improve</Button>
        <Button onClick={() => goToPhase('sources')}>
          Manage Sources <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCitation ? 'Edit Citation' : 'Add Citation'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cit-key">Citation Key *</Label>
                <Input
                  id="cit-key"
                  value={form.citation_key}
                  onChange={(e) => setForm(f => ({ ...f, citation_key: e.target.value }))}
                  placeholder="e.g., Smith2023 or [1]"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="cit-style">Citation Style</Label>
                <Select value={form.citation_style} onValueChange={(v) => setForm(f => ({ ...f, citation_style: v as CitationStyle }))}>
                  <SelectTrigger id="cit-style" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(CITATION_STYLE_LABELS) as [CitationStyle, string][]).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="in-text">In-Text Citation Format</Label>
              <Input
                id="in-text"
                value={form.in_text_format}
                onChange={(e) => setForm(f => ({ ...f, in_text_format: e.target.value }))}
                placeholder={IN_TEXT_PLACEHOLDER[form.citation_style]}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="bib-format">Bibliography Entry * <span className="text-muted-foreground font-normal">(required)</span></Label>
              <Textarea
                id="bib-format"
                value={form.bibliography_format}
                onChange={(e) => setForm(f => ({ ...f, bibliography_format: e.target.value }))}
                placeholder={BIB_PLACEHOLDER[form.citation_style]}
                className="mt-1.5 min-h-24"
              />
            </div>
            <div>
              <Label htmlFor="position">Used In (optional)</Label>
              <Input
                id="position"
                value={form.position_hint}
                onChange={(e) => setForm(f => ({ ...f, position_hint: e.target.value }))}
                placeholder="e.g., Introduction paragraph, page 2"
                className="mt-1.5"
              />
            </div>
            <div className="flex items-center gap-3 bg-warning/5 border border-warning/20 rounded-lg p-3">
              <input
                type="checkbox"
                id="verified"
                checked={form.is_verified}
                onChange={(e) => setForm(f => ({ ...f, is_verified: e.target.checked, needs_verification: !e.target.checked }))}
                className="h-4 w-4"
              />
              <label htmlFor="verified" className="text-sm cursor-pointer">
                I have verified this source exists and the details are accurate
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editingCitation ? 'Update' : 'Add Citation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Citation</AlertDialogTitle>
            <AlertDialogDescription>
              Remove this citation from your essay? This does not affect your essay text.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
