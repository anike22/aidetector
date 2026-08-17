// EssaySourcesPage — research sources panel: add, edit, delete, track support status
import { useState, useEffect, useCallback } from 'react';
import { useEssayStudio } from '@/contexts/EssayStudioContext';
import { essayService } from '@/lib/essay/essayService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Plus, Trash2, Edit2, Link2, FileText, BookMarked, Info, ChevronRight } from 'lucide-react';
import type { EssaySource, SourceStatus } from '@/types/essay';

const SOURCE_TYPES = [
  { value: 'academic_paper', label: 'Academic Paper' },
  { value: 'book', label: 'Book / Textbook' },
  { value: 'pdf', label: 'PDF Document' },
  { value: 'lecture_notes', label: 'Lecture Notes' },
  { value: 'website', label: 'Website' },
  { value: 'journal', label: 'Journal Article' },
  { value: 'personal_notes', label: 'Personal Research Notes' },
  { value: 'other', label: 'Other' },
];

const STATUS_CONFIG: Record<SourceStatus, { label: string; color: string }> = {
  supported: { label: 'Supported', color: 'text-success bg-success/10' },
  partially_supported: { label: 'Partially Supported', color: 'text-warning bg-warning/10' },
  unsupported: { label: 'Unsupported', color: 'text-destructive bg-destructive/10' },
  contradicted: { label: 'Contradicted', color: 'text-destructive bg-destructive/10' },
  citation_required: { label: 'Citation Required', color: 'text-warning bg-warning/10' },
  unanalyzed: { label: 'Not Analyzed', color: 'text-muted-foreground bg-muted' },
};

const SOURCE_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  academic_paper: FileText,
  book: BookMarked,
  pdf: FileText,
  lecture_notes: FileText,
  website: Link2,
  journal: FileText,
  personal_notes: FileText,
  other: FileText,
};

const EMPTY_FORM = {
  title: '',
  authors: '',
  publication_date: '',
  publisher: '',
  url: '',
  doi: '',
  source_type: 'academic_paper',
  notes: '',
  status: 'unanalyzed' as SourceStatus,
};

export default function EssaySourcesPage() {
  const { essay, goToPhase } = useEssayStudio();
  const [sources, setSources] = useState<EssaySource[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<EssaySource | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!essay) return;
    setLoading(true);
    try {
      const s = await essayService.listSources(essay.id);
      setSources(s);
    } catch {
      toast.error('Failed to load sources');
    } finally {
      setLoading(false);
    }
  }, [essay]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => {
    setEditingSource(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (s: EssaySource) => {
    setEditingSource(s);
    setForm({
      title: s.title,
      authors: s.authors,
      publication_date: s.publication_date,
      publisher: s.publisher,
      url: s.url,
      doi: s.doi,
      source_type: s.source_type,
      notes: s.notes,
      status: s.status,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!essay) return;
    if (!form.title.trim()) { toast.error('Source title is required'); return; }
    setSaving(true);
    try {
      if (editingSource) {
        await essayService.updateSource(editingSource.id, form);
        setSources(prev => prev.map(s => s.id === editingSource.id ? { ...s, ...form } : s));
        toast.success('Source updated');
      } else {
        const added = await essayService.addSource(essay.id, form);
        setSources(prev => [...prev, added]);
        await essayService.logEvent(essay.id, 'source_added', `Source added: ${form.title}`, {}, 0);
        toast.success('Source added');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Failed to save source');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await essayService.deleteSource(deleteId);
      setSources(prev => prev.filter(s => s.id !== deleteId));
      toast.success('Source removed');
    } catch {
      toast.error('Failed to remove source');
    } finally {
      setDeleteId(null);
    }
  };

  const handleStatusChange = async (id: string, status: SourceStatus) => {
    try {
      await essayService.updateSource(id, { status });
      setSources(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    } catch {
      toast.error('Failed to update status');
    }
  };

  const required = essay?.required_sources || 0;
  const met = sources.length >= required;

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-primary" /> Sources Panel
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track research papers, books, websites, and other materials you used or plan to cite.
          </p>
        </div>
        <Button onClick={openNew} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Add Source
        </Button>
      </div>

      {/* Requirements progress */}
      {required > 0 && (
        <div className={`flex items-center gap-3 p-3 rounded-lg border mb-6 ${met ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5'}`}>
          <span className={`text-sm font-medium ${met ? 'text-success' : 'text-warning'}`}>
            {sources.length} / {required} required sources
          </span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${met ? 'bg-success' : 'bg-warning'}`}
              style={{ width: `${Math.min(100, (sources.length / required) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <Alert className="mb-6 border-warning/30 bg-warning/5">
        <Info className="h-4 w-4 text-warning" />
        <AlertDescription className="text-sm">
          <strong>Source integrity:</strong> Status labels (Supported, Contradicted, etc.) reflect your manual assessment or actual analysis. Never claim a source supports your argument unless you have read and verified the source material.
        </AlertDescription>
      </Alert>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : sources.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <BookMarked className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No sources yet. Add the materials you're using for this essay.</p>
            <Button onClick={openNew} className="mt-4">
              <Plus className="h-4 w-4 mr-2" /> Add First Source
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sources.map(source => {
            const Icon = SOURCE_TYPE_ICONS[source.source_type] ?? FileText;
            const statusCfg = STATUS_CONFIG[source.status];
            return (
              <Card key={source.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-sm truncate">{source.title}</h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(source)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(source.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {source.authors && <span className="text-xs text-muted-foreground">{source.authors}</span>}
                        {source.publication_date && <span className="text-xs text-muted-foreground">· {source.publication_date}</span>}
                        {source.publisher && <span className="text-xs text-muted-foreground">· {source.publisher}</span>}
                      </div>
                      {source.doi && (
                        <p className="text-xs text-muted-foreground font-mono truncate">DOI: {source.doi}</p>
                      )}
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 truncate"
                        >
                          <Link2 className="h-3 w-3 shrink-0" />
                          {source.url.slice(0, 60)}{source.url.length > 60 ? '…' : ''}
                        </a>
                      )}
                      {source.notes && (
                        <p className="text-xs text-muted-foreground italic">{source.notes}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Support status:</span>
                        <Select
                          value={source.status}
                          onValueChange={(v) => handleStatusChange(source.id, v as SourceStatus)}
                        >
                          <SelectTrigger className={`h-6 text-xs px-2 w-auto border-0 ${statusCfg.color}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.entries(STATUS_CONFIG) as [SourceStatus, { label: string; color: string }][]).map(([v, cfg]) => (
                              <SelectItem key={v} value={v} className="text-xs">{cfg.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Badge variant="secondary" className="text-xs">
                          {SOURCE_TYPES.find(t => t.value === source.source_type)?.label ?? source.source_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Separator className="my-6" />
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => goToPhase('cite')}>Back to Citations</Button>
        <Button onClick={() => goToPhase('history')}>
          Writing History <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSource ? 'Edit Source' : 'Add Source'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div>
              <Label htmlFor="src-title">Title *</Label>
              <Input
                id="src-title"
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Source title"
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="src-authors">Authors</Label>
                <Input
                  id="src-authors"
                  value={form.authors}
                  onChange={(e) => setForm(f => ({ ...f, authors: e.target.value }))}
                  placeholder="Author names"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="src-date">Publication Date</Label>
                <Input
                  id="src-date"
                  value={form.publication_date}
                  onChange={(e) => setForm(f => ({ ...f, publication_date: e.target.value }))}
                  placeholder="e.g., 2023, March 2023"
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="src-publisher">Publisher / Journal</Label>
                <Input
                  id="src-publisher"
                  value={form.publisher}
                  onChange={(e) => setForm(f => ({ ...f, publisher: e.target.value }))}
                  placeholder="Publisher or journal name"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="src-type">Source Type</Label>
                <Select value={form.source_type} onValueChange={(v) => setForm(f => ({ ...f, source_type: v }))}>
                  <SelectTrigger id="src-type" className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="src-url">URL (optional)</Label>
              <Input
                id="src-url"
                value={form.url}
                onChange={(e) => setForm(f => ({ ...f, url: e.target.value }))}
                placeholder="https://…"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="src-doi">DOI (optional)</Label>
              <Input
                id="src-doi"
                value={form.doi}
                onChange={(e) => setForm(f => ({ ...f, doi: e.target.value }))}
                placeholder="10.xxxx/xxxxx"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="src-notes">Personal Notes</Label>
              <Textarea
                id="src-notes"
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Your notes, key quotes, or relevance to your essay…"
                className="mt-1.5 min-h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editingSource ? 'Update Source' : 'Add Source'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Source</AlertDialogTitle>
            <AlertDialogDescription>Remove this source from your essay? Linked citations will remain but will lose their source connection.</AlertDialogDescription>
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
