import React, { useState, useRef } from 'react';
import type { SelfSimilarityMatch, PrivateCorpusDocument } from '@/lib/plagiarism/privateCorpusEngine';
import { createCorpusDocument } from '@/lib/plagiarism/privateCorpusEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FolderLock, Calendar, FileText, CheckCircle2,
  Shield, Upload, Plus, Trash2, User, Building, Info, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  matches: SelfSimilarityMatch[];
  corpusDocuments?: PrivateCorpusDocument[];
  onAddDocument?: (doc: PrivateCorpusDocument) => void;
  onRemoveDocument?: (id: string) => void;
}

export function PrivateCorpusView({
  matches,
  corpusDocuments = [],
  onAddDocument,
  onRemoveDocument,
}: Props) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [department, setDepartment] = useState('');
  const [content, setContent] = useState('');
  const [isOwnWork, setIsOwnWork] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) || '';
      if (!text.trim()) {
        toast.error('The uploaded file was empty.');
        return;
      }
      const doc = createCorpusDocument(
        file.name.replace(/\.[^/.]+$/, ''),
        text,
        authorName.trim() || 'Uploaded Student Essay',
        isOwnWork,
        department.trim() || 'Classroom Archive'
      );
      if (onAddDocument) {
        onAddDocument(doc);
        toast.success(`Uploaded "${doc.title}" to private student corpus.`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !title.trim()) {
      toast.error('Please provide both a title and essay content.');
      return;
    }
    const doc = createCorpusDocument(
      title,
      content,
      authorName.trim() || 'Student / Author',
      isOwnWork,
      department.trim() || 'Classroom Archive'
    );
    if (onAddDocument) {
      onAddDocument(doc);
      toast.success(`Added "${doc.title}" to private corpus.`);
    }
    setTitle('');
    setContent('');
    setAuthorName('');
    setShowUploadForm(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Overview & Upload Action Bar */}
      <div className="bg-muted/40 p-3.5 rounded-xl border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
            <FolderLock className="w-4 h-4 text-primary" />
            <span>Private Student Corpus & Institutional Archive</span>
            <Badge variant="secondary" className="text-xs">
              {corpusDocuments.length} essay{corpusDocuments.length !== 1 ? 's' : ''} indexed
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Uploaded student essays and previous term papers are matched to isolate self-reuse and draft iterations from external plagiarism.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.doc,.docx,.pdf,.md"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-3.5 h-3.5" /> Upload Essay File
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground"
            onClick={() => setShowUploadForm(!showUploadForm)}
          >
            <Plus className="w-3.5 h-3.5" /> Paste Essay Text
          </Button>
        </div>
      </div>

      {/* Manual Paste / Upload Form */}
      {showUploadForm && (
        <Card className="border-primary/30 bg-primary/5 shadow-sm">
          <CardHeader className="py-3 px-4 border-b border-border/50">
            <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Add Student Essay to Private Corpus
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">Essay Title / Assignment</label>
                  <Input
                    placeholder="e.g., Term Paper: NLP Attention Models"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-8 text-xs mt-1 bg-background"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">Student / Author Name</label>
                  <Input
                    placeholder="e.g., Alex Morgan (Student ID 1042)"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="h-8 text-xs mt-1 bg-background"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground">Class / Department</label>
                  <Input
                    placeholder="e.g., CS-402 Advanced AI"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="h-8 text-xs mt-1 bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">Essay Content / Text</label>
                <Textarea
                  placeholder="Paste the student's previous essay text here to include in the private reference corpus..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[100px] text-xs mt-1 bg-background"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOwnWork}
                    onChange={(e) => setIsOwnWork(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span>Mark as same student's prior work / draft (Permitted self-reuse)</span>
                </label>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowUploadForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="h-7 text-xs bg-primary text-primary-foreground"
                  >
                    Save to Corpus
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active Similarity Matches against current check */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Corpus Similarity Audit Results
        </h3>

        {matches && matches.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5">
            {matches.map((m) => (
              <Card key={m.id} className="border-border shadow-sm text-xs">
                <CardContent className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5 sm:mt-0" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-foreground text-sm">{m.documentTitle}</span>
                      <span className="text-muted-foreground flex items-center gap-2 flex-wrap">
                        {m.authorName && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {m.authorName}</span>}
                        <span>·</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {m.creationDate}</span>
                        <span>·</span>
                        <span>{m.matchedPassagesCount} matched passage sections</span>
                      </span>
                      <span className="text-muted-foreground mt-0.5">{m.explanation}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={m.isPermittedSelfReuse ? 'border-primary/40 text-primary' : 'border-warning/40 text-warning'}>
                      {m.matchType === 'self_reuse' ? 'Prior Own Work' : m.matchType === 'draft_version' ? 'Draft Version' : 'Institutional Archive'}
                    </Badge>
                    <Badge variant="secondary" className="text-success font-bold">
                      {m.similarityScore}% Overlap
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border shadow-sm">
            <CardContent className="p-6 text-center text-muted-foreground text-xs">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-1.5 text-success/70" />
              No overlap detected with indexed private student essays or internal repository drafts.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Indexed Corpus Document List */}
      <div className="space-y-2 pt-2 border-t border-border">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
          <span>Active Private Corpus Repository ({corpusDocuments.length})</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {corpusDocuments.map((doc) => (
            <div
              key={doc.id}
              className="p-2.5 rounded-lg border border-border bg-card/60 flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                <div className="truncate">
                  <p className="font-medium text-foreground truncate">{doc.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {doc.authorName ?? 'Student'} · {doc.wordCount ?? (doc.content.match(/\S+/g) || []).length} words · {doc.departmentOrFolder ?? 'General'}
                  </p>
                </div>
              </div>

              {onRemoveDocument && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                  title="Remove from private corpus"
                  onClick={() => {
                    onRemoveDocument(doc.id);
                    toast.info(`Removed "${doc.title}" from corpus.`);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
