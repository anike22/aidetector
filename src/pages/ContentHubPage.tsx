import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Clock, ArrowRight, ChevronRight, Loader2 } from 'lucide-react';
import ArticleImage from '@/components/blog/ArticleImage';
import PageMeta from '@/components/common/PageMeta';
import { BLOG_POSTS, type BlogPost, type ContentHub } from '@/data/siteData';
import { supabase } from '@/db/supabase';

const HUB_META: Record<
  ContentHub,
  { title: string; headline: string; description: string; cta: string }
> = {
  guides: {
    title: 'Guides · AIDetector.cx',
    headline: 'Guides',
    description:
      'Practical, in-depth guides on AI detection, content verification, AI humanizers, plagiarism checking, and responsible AI writing.',
    cta: 'Explore practical guides that help you detect, verify, and improve AI-generated content.',
  },
  research: {
    title: 'Research · AIDetector.cx',
    headline: 'Research',
    description:
      'Independent benchmarks, original studies, and data-driven reports on AI detection accuracy, model behavior, and industry trends.',
    cta: 'Read the latest original research and transparent benchmarks from the AIDetector.cx team.',
  },
  comparisons: {
    title: 'Comparisons · AIDetector.cx',
    headline: 'Comparisons',
    description:
      'Side-by-side comparisons of AI detection tools including Turnitin, GPTZero, Copyleaks, Originality.ai, Winston AI, and AIDetector.cx.',
    cta: 'Compare leading AI detectors and choose the right solution for your workflow.',
  },
  blog: {
    title: 'Blog · AIDetector.cx',
    headline: 'Blog',
    description:
      'AI industry news, product updates, model releases, AI regulations, company announcements, and feature launches.',
    cta: 'Stay current with the latest news and updates from the world of AI detection.',
  },
};

const categoryColors: Record<string, string> = {
  'AI Detection': 'bg-primary/10 text-primary border-primary/20',
  SEO: 'bg-warning/10 text-warning border-warning/20',
  'AI Business': 'bg-primary/10 text-primary border-primary/20',
  Automation: 'bg-success/10 text-success border-success/20',
  Marketing: 'bg-info/10 text-info border-info/20',
  Startups: 'bg-destructive/10 text-destructive border-destructive/20',
  Monetization: 'bg-success/10 text-success border-success/20',
  Productivity: 'bg-primary/10 text-primary border-primary/20',
};

const PAGE_SIZE = 9;

export default function ContentHubPage({ hub }: { hub: ContentHub }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dbPosts, setDbPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('status', 'published')
          .eq('hub', hub)
          .order('published_at', { ascending: false });
        if (data) setDbPosts(data);
      } catch (err) {
        console.error('Error loading db posts', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [hub]);

  const mergedPosts = useMemo(() => {
    const list = [...BLOG_POSTS.filter((p) => p.hub === hub)];
    for (const dbp of dbPosts) {
      const idx = list.findIndex((p) => p.id === dbp.slug);
      const post: BlogPost = {
        id: dbp.slug,
        slug: dbp.slug,
        hub: (dbp.hub as ContentHub) || hub,
        title: dbp.title,
        excerpt: dbp.excerpt || '',
        category: dbp.category || 'AI Detection',
        author: dbp.author || 'Admin',
        authorAvatar: dbp.author_avatar || '🧑‍💻',
        date: new Date(dbp.published_at || dbp.created_at).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        readTime: dbp.reading_time ? `${dbp.reading_time} min read` : '10 min read',
        image: dbp.featured_image_url || null,
        featured: !!dbp.is_featured,
        content: dbp.content,
      };
      if (idx !== -1) list[idx] = { ...list[idx], ...post };
      else list.push(post);
    }
    return list;
  }, [dbPosts, hub]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return mergedPosts.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.excerpt.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );
  }, [mergedPosts, search]);

  const featured = useMemo(
    () => filtered.find((p) => p.featured) || filtered[0],
    [filtered]
  );
  const rest = useMemo(
    () => filtered.filter((p) => p.id !== featured?.id),
    [filtered, featured]
  );

  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const paginated = rest.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const meta = HUB_META[hub];

  const schema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: meta.headline,
      description: meta.description,
      url: typeof window !== 'undefined' ? window.location.href : `https://aidetector.cx/${hub}`,
      hasPart: filtered.map((p) => ({
        '@type': 'Article',
        headline: p.title,
        url: `https://aidetector.cx/${p.hub}/${p.id}`,
      })),
    }),
    [meta, hub, filtered]
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageMeta
        title={meta.title}
        description={meta.description}
        canonicalUrl={`https://aidetector.cx/${hub}`}
        ogTitle={meta.headline}
        ogDescription={meta.description}
        ogType="website"
        schemas={[schema]}
      />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground capitalize">{meta.headline}</span>
        </nav>

        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="outline" className="mb-3 text-primary border-primary/30 bg-primary/5">
            {meta.headline}
          </Badge>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-navy text-balance mb-4">
            {meta.headline}
          </h1>
          <p className="text-muted-foreground text-pretty text-base md:text-lg">{meta.description}</p>
        </div>

        <div className="max-w-md mx-auto mb-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={`Search ${meta.headline.toLowerCase()}...`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-11 border-border"
            />
          </div>
        </div>

        {featured && (
          <Link to={`/${featured.hub}/${featured.id}`} className="block mb-12">
            <Card className="border-border shadow-card hover:shadow-hover transition-shadow overflow-hidden group">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="aspect-[4/3] md:aspect-auto">
                  <ArticleImage
                    src={featured.image}
                    alt={featured.title}
                    containerClassName="w-full h-full"
                    loading="eager"
                    fetchPriority="high"
                    className="group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6 md:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className={`text-xs ${categoryColors[featured.category] || 'bg-muted text-muted-foreground border-border'}`}>
                      {featured.category}
                    </Badge>
                    <Badge className="text-xs bg-primary text-primary-foreground">Featured</Badge>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-navy text-balance mb-3 group-hover:text-primary transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-muted-foreground text-pretty mb-5">{featured.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="text-lg">{featured.authorAvatar}</span>
                      <span>{featured.author}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {featured.readTime}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary gap-1">
                      Read <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          </Link>
        )}

        {paginated.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-semibold text-navy mb-1">No articles found</p>
            <p className="text-sm text-muted-foreground">Try a different search term.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map((post) => (
                <Link to={`/${post.hub}/${post.id}`} key={post.id}>
                  <Card className="h-full flex flex-col border-border shadow-card hover:shadow-hover transition-shadow overflow-hidden group">
                    <div className="aspect-[16/9]">
                      <ArticleImage src={post.image} alt={post.title} containerClassName="w-full h-full" loading="lazy" />
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
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/50 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readTime}
                        </span>
                        <span className="shrink-0">{post.date}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-3">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        <div className="mt-16 bg-secondary/60 rounded-2xl border border-border p-8 text-center">
          <h2 className="text-2xl font-bold text-navy mb-2 text-balance">Never miss an update</h2>
          <p className="text-muted-foreground text-sm mb-6 text-pretty max-w-md mx-auto">{meta.cta}</p>
          <Link to="/newsletter">
            <Button className="bg-primary text-primary-foreground gap-2">
              Subscribe to Newsletter <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
