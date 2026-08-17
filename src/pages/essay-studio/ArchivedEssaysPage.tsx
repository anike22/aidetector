// Archived essays page
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { essayService } from '@/lib/essay/essayService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Archive, Trash2, RotateCcw } from 'lucide-react';
import type { Essay } from '@/types/essay';
import { ESSAY_TYPE_LABELS } from '@/types/essay';
import MainLayout from '@/components/layouts/MainLayout';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ArchivedEssaysPage() {
  const navigate = useNavigate();
  const [essays, setEssays] = useState<Essay[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    essayService.listArchivedEssays()
      .then(setEssays)
      .catch(() => toast.error('Failed to load archived essays'))
      .finally(() => setLoading(false));
  }, []);

  const handleRestore = async (id: string) => {
    try {
      await essayService.updateEssay(id, { status: 'draft' });
      setEssays(prev => prev.filter(e => e.id !== id));
      toast.success('Essay restored');
    } catch {
      toast.error('Failed to restore essay');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await essayService.deleteEssay(deleteId);
      setEssays(prev => prev.filter(e => e.id !== deleteId));
      toast.success('Essay permanently deleted');
    } catch {
      toast.error('Failed to delete essay');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/essay-studio')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Archive className="h-6 w-6 text-muted-foreground" /> Archived Essays
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Restore or permanently delete archived essays.</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : essays.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Archive className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No archived essays.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {essays.map(essay => (
              <Card key={essay.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{essay.title}</h3>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs">{ESSAY_TYPE_LABELS[essay.essay_type as keyof typeof ESSAY_TYPE_LABELS]}</Badge>
                      <span className="text-xs text-muted-foreground">{essay.word_count} words</span>
                      <span className="text-xs text-muted-foreground">
                        Archived {new Date(essay.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleRestore(essay.id)} className="h-8 text-xs">
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Restore
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(essay.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Permanently Delete Essay</AlertDialogTitle>
              <AlertDialogDescription>This cannot be undone. All data — outline, sources, citations, and history — will be lost.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete Permanently</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
