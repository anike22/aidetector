import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from '@/components/ui/image-upload';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { Loader2, Plus, Edit, Trash2, Eye, RefreshCw, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { BLOG_POSTS } from '@/data/siteData';
import type { ContentHub } from '@/data/siteData';

export default function AdminContentSection() {
  const [activeTab, setActiveTab] = useState('blog');
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [redirects, setRedirects] = useState<any[]>([]);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [editingRedirect, setEditingRedirect] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [isEditorUploading, setIsEditorUploading] = useState(false);
  const initialPostStateRef = useRef<string>('');

  useEffect(() => {
    fetchContent();
  }, [activeTab]);

  const handleStartEditPost = (post: any) => {
    setEditingPost(post);
    initialPostStateRef.current = JSON.stringify(post || {});
  };

  const handleCancelEditPost = () => {
    if (!editingPost) return;
    const currentState = JSON.stringify(editingPost || {});
    if (currentState !== initialPostStateRef.current) {
      if (!confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        return;
      }
    }
    setEditingPost(null);
  };

  useEffect(() => {
    fetchContent();
  }, [activeTab]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      if (activeTab === 'blog') {
        const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
        if (error) throw error;

        const dbSlugs = new Set((data || []).map(p => p.slug));
        const unmigratedPosts = BLOG_POSTS.filter(p => !dbSlugs.has(p.id)).map((p: any) => ({
          id: `hc-${p.id}`,
          slug: p.id,
          hub: p.hub || 'blog',
          title: p.title,
          category: p.category,
          status: 'published',
          source: 'hardcoded',
          created_at: p.date ? new Date(p.date).toISOString() : new Date().toISOString(),
          content: p.content || '',
          excerpt: p.excerpt || '',
          featured_image_url: p.image || '',
          is_featured: p.featured || false,
        }));

        setPosts([...(data || []), ...unmigratedPosts]);
      } else if (activeTab === 'redirects') {
        const { data, error } = await supabase.from('redirects').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setRedirects(data || []);
      }
    } catch (err: any) {
      toast.error(`Error loading content: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditorUploading) {
      toast.error('Please wait for inline image uploads to complete before saving.');
      return;
    }

    setSaving(true);
    try {
      const isUpdate = !!editingPost.id && !editingPost.id.toString().startsWith('hc-');

      const postData = {
        title: editingPost.title,
        slug: editingPost.slug || editingPost.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        hub: editingPost.hub || 'blog',
        content: editingPost.content || '',
        excerpt: editingPost.excerpt || '',
        category: editingPost.category || 'General',
        author: editingPost.author || 'AIDetector.cx Team',
        featured_image_url: editingPost.featured_image_url || '',
        status: editingPost.status || 'draft',
        is_featured: !!editingPost.is_featured,
      };

      let error;
      if (isUpdate) {
        const res = await supabase.from('blog_posts').update({ ...postData, updated_at: new Date().toISOString() }).eq('id', editingPost.id);
        error = res.error;
      } else {
        const res = await supabase.from('blog_posts').insert(postData);
        error = res.error;
      }

      if (error) throw error;
      
      toast.success(`Post ${isUpdate ? 'updated' : 'created'} successfully!`);
      initialPostStateRef.current = '';
      setEditingPost(null);
      fetchContent();
    } catch (err: any) {
      toast.error(`Error saving post: ${err.message}`);
      // Keep editingPost intact so no drafted work is lost on error
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
      toast.success('Post deleted successfully');
      fetchContent();
    } catch (err: any) {
      toast.error(`Error deleting post: ${err.message}`);
    }
  };

  const handleSaveRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isUpdate = !!editingRedirect.id;
      const redirectData = {
        old_url: editingRedirect.old_url,
        new_url: editingRedirect.new_url,
        redirect_type: editingRedirect.redirect_type || '301',
        is_active: !!editingRedirect.is_active,
      };

      let error;
      if (isUpdate) {
        const res = await supabase.from('redirects').update({ ...redirectData, updated_at: new Date() }).eq('id', editingRedirect.id);
        error = res.error;
      } else {
        const res = await supabase.from('redirects').insert(redirectData);
        error = res.error;
      }

      if (error) throw error;
      toast.success(`Redirect ${isUpdate ? 'updated' : 'created'} successfully!`);
      setEditingRedirect(null);
      fetchContent();
    } catch (err: any) {
      toast.error(`Error saving redirect: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRedirect = async (id: string) => {
    if (!confirm('Are you sure you want to delete this redirect?')) return;
    try {
      const { error } = await supabase.from('redirects').delete().eq('id', id);
      if (error) throw error;
      toast.success('Redirect deleted successfully');
      fetchContent();
    } catch (err: any) {
      toast.error(`Error deleting redirect: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-navy">Content Management</h2>
        <Button variant="outline" size="sm" onClick={fetchContent} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger 
            value="blog" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-6"
          >
            Blog Posts
          </TabsTrigger>
          <TabsTrigger
            value="redirects"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-6"
          >
            Redirects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blog" className="pt-6">
          {editingPost ? (
            <Card>
              <CardHeader>
                <CardTitle>{editingPost.id ? 'Edit Blog Post' : 'Create New Blog Post'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSavePost} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input 
                        value={editingPost.title || ''} 
                        onChange={e => setEditingPost({...editingPost, title: e.target.value})} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Slug (Auto-generated if empty)</label>
                      <Input 
                        value={editingPost.slug || ''} 
                        onChange={e => setEditingPost({...editingPost, slug: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Input
                        value={editingPost.category || ''}
                        onChange={e => setEditingPost({...editingPost, category: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Hub</label>
                      <Select value={editingPost.hub || 'blog'} onValueChange={(val: ContentHub) => setEditingPost({...editingPost, hub: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="guides">Guides</SelectItem>
                          <SelectItem value="research">Research</SelectItem>
                          <SelectItem value="comparisons">Comparisons</SelectItem>
                          <SelectItem value="blog">Blog</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select value={editingPost.status || 'draft'} onValueChange={val => setEditingPost({...editingPost, status: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Featured Image</label>
                      <ImageUpload
                        value={editingPost.featured_image_url || ''}
                        onChange={(url) => setEditingPost({...editingPost, featured_image_url: url})}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      id="is_featured"
                      type="checkbox"
                      checked={!!editingPost.is_featured}
                      onChange={(e) => setEditingPost({...editingPost, is_featured: e.target.checked})}
                    />
                    <label htmlFor="is_featured" className="text-sm font-medium">Featured article</label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Excerpt</label>
                    <Textarea 
                      value={editingPost.excerpt || ''} 
                      onChange={e => setEditingPost({...editingPost, excerpt: e.target.value})} 
                      rows={2} 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">Content (HTML / Markdown / Rich-Text)</label>
                      <span className="text-xs text-muted-foreground">Visual editing, HTML/Markdown source &amp; live preview</span>
                    </div>

                    {editingPost.id && editingPost.id.toString().startsWith('hc-') && !editingPost.content && (
                      <div className="bg-primary/5 border border-primary/20 text-foreground/85 p-3.5 rounded-lg text-xs mb-3 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <strong>Hardcoded Pillar Article:</strong> This article content is managed via a dedicated React component. Entering content here will <strong>override</strong> the component.
                        </div>
                      </div>
                    )}

                    <RichTextEditor
                      value={editingPost.content || ''}
                      onChange={(val) => setEditingPost((prev: any) => ({ ...prev, content: val }))}
                      onUploadingChange={setIsEditorUploading}
                      placeholder="Start typing your article, insert headings, formatted lists, tables, links, or inline images..."
                    />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <Button type="button" variant="outline" onClick={handleCancelEditPost}>
                      Cancel
                    </Button>
                    <div className="flex items-center gap-2">
                      {isEditorUploading && (
                        <span className="text-xs text-amber-500 font-medium animate-pulse">
                          Image upload in progress...
                        </span>
                      )}
                      <Button type="submit" disabled={saving || isEditorUploading}>
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editingPost.id && !editingPost.id.toString().startsWith('hc-') ? 'Update Post' : 'Save Post'}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Blog Posts</CardTitle>
                  <CardDescription>Manage all blog articles</CardDescription>
                </div>
                <Button onClick={() => handleStartEditPost({})}>
                  <Plus className="w-4 h-4 mr-2" /> New Post
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : posts.length === 0 ? (
                  <div className="text-center p-8 border rounded-lg bg-muted/10">
                    <p className="text-muted-foreground mb-4">No blog posts found.</p>
                    <Button variant="outline" onClick={() => handleStartEditPost({})}>Create Your First Post</Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Hub</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Featured</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {posts.map(post => (
                          <TableRow key={post.id}>
                            <TableCell className="font-medium">{post.title}</TableCell>
                            <TableCell><Badge variant="outline" className="capitalize">{post.hub || 'blog'}</Badge></TableCell>
                            <TableCell>{post.category}</TableCell>
                            <TableCell>
                              <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                                {post.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{post.is_featured ? 'Yes' : 'No'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {post.id.toString().startsWith('hc-') ? 'Hardcoded' : 'Database'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(post.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleStartEditPost(post)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {(!post.id || !post.id.toString().startsWith('hc-')) && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-destructive"
                                    onClick={() => handleDeletePost(post.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="redirects" className="pt-6">
          {editingRedirect ? (
            <Card>
              <CardHeader>
                <CardTitle>{editingRedirect.id ? 'Edit Redirect' : 'Create New Redirect'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveRedirect} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Old URL</label>
                      <Input
                        value={editingRedirect.old_url || ''}
                        onChange={e => setEditingRedirect({...editingRedirect, old_url: e.target.value})}
                        placeholder="/blog/3"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">New URL</label>
                      <Input
                        value={editingRedirect.new_url || ''}
                        onChange={e => setEditingRedirect({...editingRedirect, new_url: e.target.value})}
                        placeholder="/guides/ai-detection-guide"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Redirect Type</label>
                      <Select value={editingRedirect.redirect_type || '301'} onValueChange={val => setEditingRedirect({...editingRedirect, redirect_type: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="301">301 Permanent</SelectItem>
                          <SelectItem value="302">302 Temporary</SelectItem>
                          <SelectItem value="410">410 Gone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Active</label>
                      <Select value={editingRedirect.is_active ? 'true' : 'false'} onValueChange={val => setEditingRedirect({...editingRedirect, is_active: val === 'true'})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setEditingRedirect(null)}>Cancel</Button>
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save Redirect
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Redirects</CardTitle>
                  <CardDescription>Manage URL redirects and 410 Gone rules</CardDescription>
                </div>
                <Button onClick={() => setEditingRedirect({ redirect_type: '301', is_active: true })}>
                  <Plus className="w-4 h-4 mr-2" /> New Redirect
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : redirects.length === 0 ? (
                  <div className="text-center p-8 border rounded-lg bg-muted/10">
                    <p className="text-muted-foreground mb-4">No redirects found.</p>
                    <Button variant="outline" onClick={() => setEditingRedirect({ redirect_type: '301', is_active: true })}>Create Your First Redirect</Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Old URL</TableHead>
                          <TableHead>New URL</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Active</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {redirects.map(redirect => (
                          <TableRow key={redirect.id}>
                            <TableCell className="font-medium max-w-xs truncate" title={redirect.old_url}>{redirect.old_url}</TableCell>
                            <TableCell className="max-w-xs truncate" title={redirect.new_url}>{redirect.new_url}</TableCell>
                            <TableCell><Badge variant="outline">{redirect.redirect_type}</Badge></TableCell>
                            <TableCell>
                              <Badge variant={redirect.is_active ? 'default' : 'secondary'}>
                                {redirect.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => setEditingRedirect(redirect)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteRedirect(redirect.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
