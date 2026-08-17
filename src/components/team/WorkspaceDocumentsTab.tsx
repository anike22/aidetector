import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  getWorkspaceFolders,
  createWorkspaceFolder,
  deleteWorkspaceFolder,
  getWorkspaceDocuments,
  createWorkspaceDocument,
  updateWorkspaceDocument,
  deleteWorkspaceDocument,
  getDocumentVersions,
  createDocumentVersion,
  restoreDocumentVersion,
  getDocumentComments,
  createDocumentComment,
  getDocumentTasks,
  createDocumentTask,
  updateDocumentTask,
  getWorkspaceMembers,
} from '@/lib/enterpriseApi';
import type { WorkspaceFolder, WorkspaceDocument, DocumentVersion, DocumentComment, DocumentTask } from '@/types/enterprise';
import type { WorkspaceMember } from '@/types/team';
import { Folder, FileText, Save, History, MessageSquare, CheckSquare, Trash2, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function WorkspaceDocumentsTab({ workspaceId }: { workspaceId: string }) {
  const [folders, setFolders] = useState<WorkspaceFolder[]>([]);
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [activeDoc, setActiveDoc] = useState<WorkspaceDocument | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);

  const load = async () => {
    const [f, d, m] = await Promise.all([getWorkspaceFolders(workspaceId), getWorkspaceDocuments(workspaceId), getWorkspaceMembers(workspaceId)]);
    setFolders(f);
    setDocuments(d);
    setMembers(m);
  };

  useEffect(() => { load(); }, [workspaceId]);

  const filteredDocs = documents.filter((d) => (selectedFolder ? d.folder_id === selectedFolder : !d.folder_id));

  return (
    <div className="space-y-4">
      {!activeDoc ? (
        <DocumentListView
          workspaceId={workspaceId}
          folders={folders}
          documents={filteredDocs}
          members={members}
          selectedFolder={selectedFolder}
          onFolderChange={setSelectedFolder}
          onRefresh={load}
          onOpenDoc={setActiveDoc}
        />
      ) : (
        <DocumentEditor
          document={activeDoc}
          members={members}
          folders={folders}
          onBack={() => setActiveDoc(null)}
          onRefresh={load}
        />
      )}
    </div>
  );
}

function DocumentListView({
  workspaceId,
  folders,
  documents,
  members,
  selectedFolder,
  onFolderChange,
  onRefresh,
  onOpenDoc,
}: {
  workspaceId: string;
  folders: WorkspaceFolder[];
  documents: WorkspaceDocument[];
  members: WorkspaceMember[];
  selectedFolder: string | null;
  onFolderChange: (id: string | null) => void;
  onRefresh: () => void;
  onOpenDoc: (doc: WorkspaceDocument) => void;
}) {
  const [folderName, setFolderName] = useState('');
  const [docName, setDocName] = useState('');
  const [docContent, setDocContent] = useState('');

  const createFolder = async () => {
    if (!folderName.trim()) return;
    try {
      await createWorkspaceFolder(workspaceId, { name: folderName, parent_folder_id: selectedFolder || undefined });
      toast.success('Folder created');
      setFolderName('');
      onRefresh();
    } catch (err: any) { toast.error(err.message || 'Failed to create folder'); }
  };

  const createDoc = async () => {
    if (!docName.trim()) return;
    try {
      await createWorkspaceDocument(workspaceId, { name: docName, content: docContent, folder_id: selectedFolder || undefined });
      toast.success('Document created');
      setDocName('');
      setDocContent('');
      onRefresh();
    } catch (err: any) { toast.error(err.message || 'Failed to create document'); }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-medium">Documents</CardTitle>
            <CardDescription>Shared workspace documents with version history.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild><Button variant="outline" size="sm"><Folder className="h-4 w-4 mr-2" />New folder</Button></DialogTrigger>
              <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                <DialogHeader><DialogTitle>Create folder</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <Input value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="Folder name" />
                  <Button onClick={createFolder}>Create</Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild><Button size="sm"><FileText className="h-4 w-4 mr-2" />New document</Button></DialogTrigger>
              <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                <DialogHeader><DialogTitle>New document</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Document name" />
                  <Textarea value={docContent} onChange={(e) => setDocContent(e.target.value)} placeholder="Initial content" rows={6} />
                  <Button onClick={createDoc}>Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {selectedFolder && (
          <Button variant="ghost" size="sm" onClick={() => onFolderChange(null)} className="mt-2 -ml-2"><ArrowLeft className="h-4 w-4 mr-1" /> Back to root</Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {folders.filter((f) => (selectedFolder ? f.parent_folder_id === selectedFolder : !f.parent_folder_id)).map((f) => (
            <button key={f.id} onClick={() => onFolderChange(f.id)} className="text-left border rounded-lg p-4 hover:border-primary transition-colors">
              <Folder className="h-6 w-6 text-primary mb-2" />
              <div className="font-medium">{f.name}</div>
            </button>
          ))}
        </div>
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead className="bg-muted"><tr><th className="px-4 py-2 text-left font-medium whitespace-nowrap">Name</th><th className="px-4 py-2 text-left font-medium whitespace-nowrap">Updated</th><th className="px-4 py-2 text-right font-medium whitespace-nowrap">Actions</th></tr></thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => onOpenDoc(d)}>
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-medium">{d.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDistanceToNow(new Date(d.updated_at), { addSuffix: true })}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button variant="ghost" size="icon" onClick={async () => { try { await deleteWorkspaceDocument(d.id); toast.success('Deleted'); onRefresh(); } catch (err: any) { toast.error(err.message); } }}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
              {documents.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">No documents in this folder.</td></tr>}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentEditor({ document, members, folders, onBack, onRefresh }: { document: WorkspaceDocument; members: WorkspaceMember[]; folders: WorkspaceFolder[]; onBack: () => void; onRefresh: () => void }) {
  const [content, setContent] = useState(document.content || '');
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [tasks, setTasks] = useState<DocumentTask[]>([]);
  const [commentText, setCommentText] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [assignee, setAssignee] = useState('');

  const load = async () => {
    const [v, c, t] = await Promise.all([getDocumentVersions(document.id), getDocumentComments(document.id), getDocumentTasks(document.id)]);
    setVersions(v);
    setComments(c);
    setTasks(t);
  };

  useEffect(() => { load(); }, [document.id]);

  const saveDoc = async () => {
    try {
      await createDocumentVersion(document.id, { content, version_number: (document.current_version || 0) + 1, change_summary: 'Manual save' });
      await updateWorkspaceDocument(document.id, { content, current_version: (document.current_version || 0) + 1 });
      toast.success('Document saved');
      onRefresh();
      load();
    } catch (err: any) { toast.error(err.message || 'Failed to save'); }
  };

  const restore = async (versionId: string, versionNumber: number) => {
    try {
      await restoreDocumentVersion(document.id, versionId);
      await createDocumentVersion(document.id, { content: document.content, version_number: versionNumber + 1, change_summary: `Restored version ${versionNumber}` });
      toast.success('Version restored');
      onRefresh();
      load();
    } catch (err: any) { toast.error(err.message || 'Failed to restore'); }
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    try {
      await createDocumentComment(document.id, { content: commentText });
      setCommentText('');
      load();
    } catch (err: any) { toast.error(err.message || 'Failed to comment'); }
  };

  const addTask = async () => {
    if (!taskTitle.trim() || !assignee) return;
    try {
      await createDocumentTask(document.id, { title: taskTitle, assigned_to: assignee });
      setTaskTitle('');
      setAssignee('');
      load();
    } catch (err: any) { toast.error(err.message || 'Failed to create task'); }
  };

  const toggleTask = async (task: DocumentTask) => {
    try {
      await updateDocumentTask(task.id, { status: task.status === 'completed' ? 'pending' : 'completed' });
      load();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
            <CardTitle className="text-base font-medium">{document.name}</CardTitle>
          </div>
          <Button onClick={saveDoc}><Save className="h-4 w-4 mr-2" />Save version</Button>
        </div>
        <CardDescription>Version {document.current_version || 1}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="editor">
          <TabsList className="mb-4">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="versions"><History className="h-4 w-4 mr-1" />Versions</TabsTrigger>
            <TabsTrigger value="comments"><MessageSquare className="h-4 w-4 mr-1" />Comments</TabsTrigger>
            <TabsTrigger value="tasks"><CheckSquare className="h-4 w-4 mr-1" />Tasks</TabsTrigger>
          </TabsList>
          <TabsContent value="editor">
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={20} className="font-mono" />
          </TabsContent>
          <TabsContent value="versions">
            <div className="space-y-2">
              {versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <div className="font-medium">Version {v.version_number}</div>
                    <div className="text-xs text-muted-foreground">{v.change_summary} • {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => restore(v.id, v.version_number)}>Restore</Button>
                </div>
              ))}
              {versions.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No versions yet.</p>}
            </div>
          </TabsContent>
          <TabsContent value="comments">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment or mention @user" rows={3} className="flex-1" />
                <Button onClick={addComment}>Post</Button>
              </div>
              {comments.map((c) => (
                <div key={c.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{c.user?.display_name || c.user?.email}</span>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                  </div>
                  <p className="text-sm mt-1">{c.content}</p>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="tasks">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task title" className="flex-1" />
                <Select value={assignee} onValueChange={setAssignee}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Assignee" /></SelectTrigger>
                  <SelectContent>
                    {members.map((m) => <SelectItem key={m.user_id} value={m.user_id}>{m.user?.display_name || m.user?.email}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button onClick={addTask}>Add</Button>
              </div>
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <div className="font-medium text-sm">{t.title}</div>
                    <div className="text-xs text-muted-foreground">{t.assignee?.display_name || t.assignee?.email || 'Unassigned'}</div>
                  </div>
                  <Button variant={t.status === 'completed' ? 'secondary' : 'outline'} size="sm" onClick={() => toggleTask(t)}>{t.status === 'completed' ? 'Done' : 'Mark done'}</Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
