import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { BLOG_POSTS } from '@/data/siteData';
import { supabase } from '@/db/supabase';

const categories = ['All', 'AI Detection', 'SEO', 'AI Business', 'Startups', 'Marketing', 'Productivity', 'Monetization', 'Automation'];

const categoryColors: Record<string, string> = {
  'AI Detection': 'bg-primary/10 text-primary border-primary/20',
  'AI Business': 'bg-primary/10 text-primary border-primary/20',
  'Automation': 'bg-success/10 text-success border-success/20',
  'Marketing': 'bg-info/10 text-info border-info/20',
  'SEO': 'bg-warning/10 text-warning border-warning/20',
  'Startups': 'bg-destructive/10 text-destructive border-destructive/20',
  'Monetization': 'bg-success/10 text-success border-success/20',
  'Productivity': 'bg-primary/10 text-primary border-primary/20',
};

export default function BlogPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [dbPosts, setDbPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      try {
        const { data } = await supabase.from('blog_posts').select('*').eq('status', 'published').order('created_at', { ascending: false });
        if (data) setDbPosts(data);
      } catch (err) {
        console.error('Error loading db posts', err);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  // Merge dbPosts over hardcoded BLOG_POSTS based on slug/id
  const mergedPosts = [...BLOG_POSTS];
  for (const dbp of dbPosts) {
    const idx = mergedPosts.findIndex(p => p.id === dbp.slug);
    const postObj = {
      id: dbp.slug,
      title: dbp.title,
      excerpt: dbp.excerpt || '',
      category: dbp.category || 'SEO',
      author: dbp.author || 'Admin',
      authorAvatar: dbp.author_avatar || '🧑‍💻',
      date: new Date(dbp.published_at || dbp.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      readTime: '10 min read',
      image: dbp.featured_image_url || 'https://miaoda-site-img.s3cdn.medo.dev/app-icons/app_icon_128c0c18-8557-4863-9f08-5ec933ee3619.png',
      featured: false,
      content: dbp.content,
    };
    if (idx !== -1) {
      mergedPosts[idx] = { ...mergedPosts[idx], ...postObj };
    } else {
      mergedPosts.push(postObj);
    }
  }

  const filtered = mergedPosts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPost = mergedPosts.find((p) => p.featured) || filtered[0];
  const regularPosts = filtered.filter((p) => p.id !== featuredPost?.id || activeCategory !== 'All');

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="outline" className="mb-3 text-primary border-primary/30 bg-primary/5">Business Guides</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-navy text-balance mb-3">AI Business Blog</h1>
          <p className="text-muted-foreground text-pretty">Expert guides, strategies, and insights on building profitable AI-powered businesses.</p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 border-border"
            />
          </div>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-white text-foreground/60 border-border hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Featured Post */}
        {activeCategory === 'All' && featuredPost && (
          <Link to={`/blog/${featuredPost.id}`} className="block mb-12">
            <Card className="border-border shadow-card hover:shadow-hover transition-shadow overflow-hidden group">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="aspect-[4/3] md:aspect-auto overflow-hidden">
                  <img
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6 md:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className={`text-xs ${categoryColors[featuredPost.category] || 'bg-muted text-muted-foreground border-border'}`}>
                      {featuredPost.category}
                    </Badge>
                    <Badge className="bg-primary text-primary-foreground text-xs">Featured</Badge>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-navy text-balance mb-3 group-hover:text-primary transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-muted-foreground text-pretty mb-5">{featuredPost.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="text-lg">{featuredPost.authorAvatar}</span>
                      <span>{featuredPost.author}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {featuredPost.readTime}
                      </span>
                    </div>
                    <Link to={`/blog/${featuredPost.id}`}>
                      <Button variant="ghost" size="sm" className="text-primary hover:text-primary gap-1">
                        Read <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </div>
            </Card>
          </Link>
        )}

        {/* Article grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📝</div>
            <p className="font-semibold text-navy mb-1">No articles found</p>
            <p className="text-sm text-muted-foreground">Try a different search term or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(activeCategory === 'All' ? regularPosts : filtered).map((post) => (
              <Link to={`/blog/${post.id}`} key={post.id}>
                <Card className="h-full flex flex-col border-border shadow-card hover:shadow-hover transition-shadow overflow-hidden group">
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-5 flex flex-col flex-1">
                    <Badge
                      variant="outline"
                      className={`self-start text-xs mb-3 ${categoryColors[post.category] || 'text-muted-foreground border-border'}`}
                    >
                      {post.category}
                    </Badge>
                    <h3 className="font-bold text-navy text-base leading-snug text-balance mb-2 group-hover:text-primary transition-colors flex-1">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground text-pretty mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="text-base">{post.authorAvatar}</span>
                        <span>{post.author}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readTime}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{post.date}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Newsletter CTA */}
        <div className="mt-16 bg-secondary/60 rounded-2xl border border-border p-8 text-center">
          <h2 className="text-2xl font-bold text-navy mb-2 text-balance">Never miss a guide</h2>
          <p className="text-muted-foreground text-sm mb-6 text-pretty max-w-md mx-auto">
            Get our best AI business articles delivered to your inbox every week.
          </p>
          <Link to="/newsletter">
            <Button className="bg-primary text-primary-foreground gap-2" onClick={() => {}}>
              Subscribe to Newsletter <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
