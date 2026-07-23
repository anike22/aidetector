import React, { useState, useEffect } from 'react';
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
import { Loader2, Plus, Edit, Trash2, Eye, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

import { BLOG_POSTS } from '@/data/siteData';

export default function AdminContentSection() {
  const [activeTab, setActiveTab] = useState('blog');
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [editingGuide, setEditingGuide] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [activeTab]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      if (activeTab === 'blog') {
        const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        
        // Merge with hardcoded posts
        const dbSlugs = new Set((data || []).map(p => p.slug));
        const unmigratedPosts = BLOG_POSTS.filter(p => !dbSlugs.has(p.id)).map((p: any) => ({
          id: `hc-${p.id}`,
          slug: p.id,
          title: p.title,
          category: p.category,
          status: 'published',
          source: 'hardcoded',
          created_at: p.date ? new Date(p.date).toISOString() : new Date().toISOString(),
          content: p.content || '',
          excerpt: p.excerpt || '',
          featured_image_url: p.image || '',
        }));

        setPosts([...(data || []), ...unmigratedPosts]);
      } else if (activeTab === 'guides') {
        const { data, error } = await supabase.from('guides').select('*').order('created_at', { ascending: false });
        if (error && error.code !== '42P01') throw error; // Ignore if table doesn't exist yet
        setGuides(data || []);
      }
    } catch (err: any) {
      toast.error(`Error loading content: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isUpdate = !!editingPost.id && !editingPost.id.startsWith('hc-');

      const postData = {
        title: editingPost.title,
        slug: editingPost.slug || editingPost.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        content: editingPost.content,
        excerpt: editingPost.excerpt,
        category: editingPost.category,
        author: editingPost.author || 'Admin',
        featured_image_url: editingPost.featured_image_url,
        status: editingPost.status || 'draft',
      };

      let error;
      if (isUpdate) {
        const res = await supabase.from('blog_posts').update({ ...postData, updated_at: new Date() }).eq('id', editingPost.id);
        error = res.error;
      } else {
        const res = await supabase.from('blog_posts').insert(postData);
        error = res.error;
      }

      if (error) throw error;
      
      toast.success(`Post ${isUpdate ? 'updated' : 'created'} successfully!`);
      setEditingPost(null);
      fetchContent();
    } catch (err: any) {
      toast.error(`Error saving post: ${err.message}`);
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

  const handleSaveGuide = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isUpdate = !!editingGuide.id && !editingGuide.id.startsWith('hc-');

      const guideData = {
        title: editingGuide.title,
        slug: editingGuide.slug || editingGuide.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
        category: editingGuide.category,
        content: editingGuide.content,
        featured_image_url: editingGuide.featured_image_url,
        status: editingGuide.status || 'draft',
      };

      let error;
      if (isUpdate) {
        const res = await supabase.from('guides').update({ ...guideData, updated_at: new Date() }).eq('id', editingGuide.id);
        error = res.error;
      } else {
        const res = await supabase.from('guides').insert(guideData);
        error = res.error;
      }

      if (error) throw error;
      
      toast.success(`Guide ${isUpdate ? 'updated' : 'created'} successfully!`);
      setEditingGuide(null);
      fetchContent();
    } catch (err: any) {
      toast.error(`Error saving guide: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGuide = async (id: string) => {
    if (!confirm('Are you sure you want to delete this guide?')) return;
    try {
      const { error } = await supabase.from('guides').delete().eq('id', id);
      if (error) throw error;
      toast.success('Guide deleted successfully');
      fetchContent();
    } catch (err: any) {
      toast.error(`Error deleting guide: ${err.message}`);
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
            value="guides" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-6"
          >
            Guides
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

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Input 
                        value={editingPost.category || ''} 
                        onChange={e => setEditingPost({...editingPost, category: e.target.value})} 
                      />
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Excerpt</label>
                    <Textarea 
                      value={editingPost.excerpt || ''} 
                      onChange={e => setEditingPost({...editingPost, excerpt: e.target.value})} 
                      rows={2} 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Content (HTML/Markdown)</label>
                    {editingPost.id && editingPost.id.toString().startsWith('hc-') && !editingPost.content && (
                      <div className="bg-blue-50 text-blue-800 p-3 rounded-md text-sm mb-2">
                        <strong>Note:</strong> This is a hardcoded pillar article. Its content is managed via a dedicated React component and cannot be loaded here. You can enter HTML/Markdown below to <strong>override</strong> the React component, or leave it blank to keep using the component.
                      </div>
                    )}
                    <Textarea 
                      value={editingPost.content || ''} 
                      onChange={e => setEditingPost({...editingPost, content: e.target.value})} 
                      rows={15} 
                      required={!editingPost.id || !editingPost.id.toString().startsWith('hc-')}
                      placeholder={editingPost.id && editingPost.id.toString().startsWith('hc-') ? "Enter content to override the React component, or leave blank to keep original..." : ""}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setEditingPost(null)}>Cancel</Button>
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save Post
                    </Button>
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
                <Button onClick={() => setEditingPost({})}>
                  <Plus className="w-4 h-4 mr-2" /> New Post
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : posts.length === 0 ? (
                  <div className="text-center p-8 border rounded-lg bg-muted/10">
                    <p className="text-muted-foreground mb-4">No blog posts found.</p>
                    <Button variant="outline" onClick={() => setEditingPost({})}>Create Your First Post</Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {posts.map(post => (
                          <TableRow key={post.id}>
                            <TableCell className="font-medium">{post.title}</TableCell>
                            <TableCell>{post.category}</TableCell>
                            <TableCell>
                              <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                                {post.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {post.id.toString().startsWith('hc-') ? 'Hardcoded' : 'Database'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(post.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => setEditingPost(post)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive" 
                                onClick={() => handleDeletePost(post.id)}
                                disabled={post.id.toString().startsWith('hc-')}
                              >
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

        <TabsContent value="guides" className="pt-6">
          {editingGuide ? (
            <Card>
              <CardHeader>
                <CardTitle>{editingGuide.id ? 'Edit Guide' : 'Create New Guide'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveGuide} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input 
                        value={editingGuide.title || ''} 
                        onChange={e => setEditingGuide({...editingGuide, title: e.target.value})} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Slug</label>
                      <Input 
                        value={editingGuide.slug || ''} 
                        onChange={e => setEditingGuide({...editingGuide, slug: e.target.value})} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Input 
                        value={editingGuide.category || ''} 
                        onChange={e => setEditingGuide({...editingGuide, category: e.target.value})} 
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select value={editingGuide.status || 'draft'} onValueChange={val => setEditingGuide({...editingGuide, status: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Featured Image</label>
                    <ImageUpload 
                      value={editingGuide.featured_image_url || ''} 
                      onChange={(url) => setEditingGuide({...editingGuide, featured_image_url: url})} 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Content (HTML/Markdown)</label>
                    <Textarea 
                      value={editingGuide.content || ''} 
                      onChange={e => setEditingGuide({...editingGuide, content: e.target.value})} 
                      rows={15} 
                      required 
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setEditingGuide(null)}>Cancel</Button>
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save Guide
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Guides</CardTitle>
                  <CardDescription>Manage structured guides and tutorials</CardDescription>
                </div>
                <Button onClick={() => setEditingGuide({})}>
                  <Plus className="w-4 h-4 mr-2" /> New Guide
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : guides.length === 0 ? (
                  <div className="text-center p-8 border rounded-lg bg-muted/10">
                    <p className="text-muted-foreground mb-4">No guides found.</p>
                    <Button variant="outline" onClick={() => setEditingGuide({})}>Create Your First Guide</Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {guides.map(guide => (
                          <TableRow key={guide.id}>
                            <TableCell className="font-medium">{guide.title}</TableCell>
                            <TableCell>{guide.category}</TableCell>
                            <TableCell>
                              <Badge variant={guide.status === 'published' ? 'default' : 'secondary'}>
                                {guide.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(guide.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => setEditingGuide(guide)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteGuide(guide.id)}>
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
