import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Search, Plus, MessageSquare, Eye, TrendingUp, Award, Users, ChevronRight, Loader2 } from 'lucide-react';
import { FORUM_POSTS } from '@/data/siteData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

const categories = [
  { name: 'All', icon: '🌐', count: 1240 },
  { name: 'AI Tools', icon: '🤖', count: 340 },
  { name: 'Business Ideas', icon: '💡', count: 218 },
  { name: 'Startups', icon: '🚀', count: 195 },
  { name: 'Make Money Online', icon: '💰', count: 287 },
  { name: 'SEO', icon: '🌊', count: 164 },
  { name: 'Automation', icon: '⚡', count: 143 },
  { name: 'Content Marketing', icon: '✍️', count: 198 },
  { name: 'Success Stories', icon: '🏆', count: 96 },
];

const sortOptions = ['Trending', 'Latest', 'Most Replied', 'Unanswered'];

const topContributors = [
  { name: 'TechFounder_Alex', reputation: 4820, avatar: '👨‍💻', badge: 'Expert' },
  { name: 'AIEnthusiast', reputation: 3650, avatar: '🤖', badge: 'Pro' },
  { name: 'AutomationGuru', reputation: 2940, avatar: '⚡', badge: 'Pro' },
  { name: 'ContentCreator', reputation: 2100, avatar: '✍️', badge: 'Member' },
  { name: 'StartupHunter', reputation: 1800, avatar: '🚀', badge: 'Member' },
];

interface UserPost {
  id: string;
  title: string;
  category: string;
  replies: number;
  views: number;
  created_at: string;
  author_id: string;
}

export default function CommunityPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSort, setActiveSort] = useState('Trending');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);

  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Load user's recent posts to merge with static feed
  useEffect(() => {
    supabase
      .from('forum_posts')
      .select('id, title, category, replies, views, created_at, author_id')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { if (data) setUserPosts(data as UserPost[]); });
  }, []);

  const handleCreatePost = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setCreateOpen(true);
  };

  const handleSubmitPost = async () => {
    if (!postTitle.trim() || !postCategory || !postContent.trim()) {
      toast.error('Please fill in all fields.');
      return;
    }
    if (!user) { navigate('/login'); return; }
    setSubmitting(true);
    const { data, error } = await supabase
      .from('forum_posts')
      .insert({ title: postTitle.trim(), content: postContent.trim(), category: postCategory, author_id: user.id })
      .select('id, title, category, replies, views, created_at, author_id')
      .maybeSingle();
    setSubmitting(false);
    if (error) {
      toast.error('Failed to create post. Please try again.');
      return;
    }
    if (data) setUserPosts((prev) => [data as UserPost, ...prev]);
    toast.success('Post created successfully!');
    setCreateOpen(false);
    setPostTitle('');
    setPostContent('');
    setPostCategory('');
  };

  // Merge static + DB posts into unified display list
  const dbDisplayPosts = userPosts.map((p) => ({
    id: p.id,
    title: p.title,
    author: profile?.full_name || 'Community Member',
    authorAvatar: (profile?.full_name || 'U').slice(0, 1).toUpperCase(),
    category: p.category,
    replies: p.replies,
    views: p.views,
    lastActivity: new Date(p.created_at).toLocaleDateString(),
    reputation: 0,
    isDb: true,
  }));

  const staticPosts = FORUM_POSTS.map((p) => ({ ...p, isDb: false }));
  const allPosts = [...dbDisplayPosts, ...staticPosts];

  const filteredPosts = allPosts.filter((post) => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <Badge variant="outline" className="mb-3 text-info border-info/30 bg-info/5">Community</Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-navy text-balance">Community Forum</h1>
            <p className="text-muted-foreground mt-1 text-pretty">Join 85,000+ founders, creators, and entrepreneurs sharing real strategies.</p>
          </div>
          <Button className="bg-primary text-primary-foreground gap-2 shrink-0 self-start md:self-auto" type="button" onClick={handleCreatePost}>
            <Plus className="w-4 h-4" /> Create Post
          </Button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Users, label: 'Members', value: '85K+' },
            { icon: MessageSquare, label: 'Discussions', value: '12K+' },
            { icon: TrendingUp, label: 'Posts Today', value: '340' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border-border shadow-card">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-navy text-lg leading-none">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main feed */}
          <div className="flex-1 min-w-0">
            {/* Search + Sort */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search discussions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 border-border"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-1 sm:pb-0">
                {sortOptions.map((sort) => (
                  <button
                    key={sort}
                    onClick={() => setActiveSort(sort)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors shrink-0 ${
                      activeSort === sort
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground/60 border border-border hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {sort}
                  </button>
                ))}
              </div>
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-2 mb-5">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    activeCategory === cat.name
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-white text-foreground/60 border-border hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                  <span className="opacity-60">({cat.count})</span>
                </button>
              ))}
            </div>

            {/* Posts */}
            <div className="flex flex-col gap-3">
              {filteredPosts.length === 0 ? (
                <Card className="border-border shadow-card">
                  <CardContent className="p-12 text-center">
                    <div className="text-4xl mb-3">💬</div>
                    <p className="font-semibold text-navy mb-1">No discussions found</p>
                    <p className="text-sm text-muted-foreground">Try a different category or search term</p>
                  </CardContent>
                </Card>
              ) : (
                filteredPosts.map((post) => {
                  const slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                  return (
                  <Link to={`/community/discussions/${slug}`} key={post.id}>
                    <Card className="border-border shadow-card hover:shadow-hover transition-all group">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="shrink-0">
                            <AvatarFallback className="bg-muted text-lg">{post.authorAvatar}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-navy text-sm group-hover:text-primary transition-colors text-balance leading-snug mb-2">
                              {post.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-medium text-foreground/70">{post.author}</span>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/40"></span>
                                <Award className="w-3 h-3 text-warning" />
                                {post.reputation.toLocaleString()} pts
                              </div>
                              <Badge variant="outline" className="text-xs border-border text-muted-foreground py-0 h-5">
                                {post.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground ml-auto shrink-0">{post.lastActivity}</span>
                            </div>
                          </div>
                          <div className="hidden md:flex items-center gap-5 shrink-0 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5" />
                              {post.replies}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5" />
                              {post.views.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0 flex flex-col gap-5">
            {/* Top Contributors */}
            <Card className="border-border shadow-card">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
                  <Award className="w-4 h-4 text-warning" /> Top Contributors
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-col gap-3">
                {topContributors.map((user, i) => (
                  <div key={user.name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                    <Avatar className="w-7 h-7 shrink-0">
                      <AvatarFallback className="bg-muted text-sm">{user.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-navy truncate">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.reputation.toLocaleString()} pts</div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${
                        user.badge === 'Expert' ? 'border-warning/40 text-warning bg-warning/5' : 'border-border text-muted-foreground'
                      }`}
                    >
                      {user.badge}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Popular Topics */}
            <Card className="border-border shadow-card">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold text-navy flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-success" /> Popular Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-col gap-2">
                {FORUM_POSTS.slice(0, 5).map((post) => {
                  const slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                  return (
                  <Link to={`/community/discussions/${slug}`} key={post.id}>
                    <div className="flex items-start gap-2 hover:bg-muted rounded-md p-2 -mx-2 transition-colors group">
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0 group-hover:text-primary" />
                      <span className="text-xs text-foreground/70 group-hover:text-navy transition-colors leading-relaxed text-pretty">
                        {post.title}
                      </span>
                    </div>
                  </Link>
                  );
                })}
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="border-primary/20 bg-primary/5 shadow-card">
              <CardContent className="p-5 text-center">
                <div className="text-3xl mb-3">🚀</div>
                <h3 className="font-bold text-navy text-sm mb-2">Join the community</h3>
                <p className="text-xs text-muted-foreground mb-4 text-pretty">Share your journey and learn from 85K+ founders</p>
                <Link to="/signup">
                  <Button className="w-full h-9 text-sm bg-primary text-primary-foreground" onClick={() => {}}>
                    Create Account
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </MainLayout>

    {/* Create Post Dialog */}
    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-navy">Create a New Post</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div>
            <Label htmlFor="post-title" className="text-sm font-normal mb-1.5 block">Title</Label>
            <Input
              id="post-title"
              placeholder="Share your question, idea, or insight..."
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              className="h-10 border-border"
              maxLength={200}
            />
          </div>
          <div>
            <Label htmlFor="post-category" className="text-sm font-normal mb-1.5 block">Category</Label>
            <Select value={postCategory} onValueChange={setPostCategory}>
              <SelectTrigger id="post-category" className="h-10 border-border">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.slice(1).map((c) => (
                  <SelectItem key={c.name} value={c.name}>{c.icon} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="post-content" className="text-sm font-normal mb-1.5 block">Content</Label>
            <Textarea
              id="post-content"
              placeholder="Write your post here. Share details, context, or questions..."
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="min-h-32 border-border resize-none"
              rows={5}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" type="button" onClick={() => setCreateOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-primary text-primary-foreground gap-2"
            onClick={handleSubmitPost}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {submitting ? 'Posting...' : 'Post'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}
