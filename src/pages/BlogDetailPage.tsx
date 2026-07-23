import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Clock, Calendar, Share2, BookOpen, ArrowRight } from 'lucide-react';
import { BLOG_POSTS } from '@/data/siteData';
import { supabase } from '@/db/supabase';
import { useState } from 'react';

// Full-article pillar components
import BestAIDetectorPage from './blog/BestAIDetectorPage';
import ChatGPTDetectorPage from './blog/ChatGPTDetectorPage';
import GPT5VsGeminiPage from './blog/GPT5VsGeminiPage';
import TurnitinVsAIDetectorPage from './blog/TurnitinVsAIDetectorPage';
import HowAIDetectionWorksPage from './blog/HowAIDetectionWorksPage';
import AIDetectionAccuracyTestsPage from './blog/AIDetectionAccuracyTestsPage';

const FULL_ARTICLE_COMPONENTS: Record<string, React.ComponentType> = {
  'best-ai-detector': BestAIDetectorPage,
  'chatgpt-detector-comparison': ChatGPTDetectorPage,
  'gpt-5-vs-gemini-detection': GPT5VsGeminiPage,
  'turnitin-vs-aidetector-cx': TurnitinVsAIDetectorPage,
  'how-ai-detection-works': HowAIDetectionWorksPage,
  'ai-detection-accuracy-tests': AIDetectionAccuracyTestsPage,
};

const categoryColors: Record<string, string> = {
  'AI Business': 'bg-primary/10 text-primary border-primary/20',
  'Automation': 'bg-success/10 text-success border-success/20',
  'Marketing': 'bg-info/10 text-info border-info/20',
  'SEO': 'bg-warning/10 text-warning border-warning/20',
  'Startups': 'bg-destructive/10 text-destructive border-destructive/20',
  'Monetization': 'bg-success/10 text-success border-success/20',
  'Productivity': 'bg-primary/10 text-primary border-primary/20',
};

// Generate rich placeholder body content from the blog post
function generateBody(post: (typeof BLOG_POSTS)[number]): string[] {
  return [
    `${post.excerpt} In this comprehensive guide, we'll walk you through every step of the process, with real-world examples and actionable strategies you can implement today.`,
    `Whether you're a seasoned entrepreneur or just starting out, the landscape has changed dramatically. AI tools have leveled the playing field, giving solo founders and small teams the capabilities once reserved for large enterprises with big budgets.`,
    `The key is not just adopting AI tools — it's knowing which ones to use, how to stack them, and how to build systems that scale. We've interviewed over 50 successful founders to bring you the most battle-tested approaches.`,
    `Here are the core principles that separate those who succeed from those who struggle: consistency, iteration speed, and an unwillingness to over-engineer early on. Start with one workflow, validate it, then expand.`,
    `Looking ahead, the opportunity is immense. The businesses that establish strong AI-integrated workflows today will have a compounding advantage over the next 3–5 years. Now is the time to act.`,
  ];
}

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dbPost, setDbPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPost() {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await supabase.from('blog_posts').select('*').eq('slug', id).single();
        if (data) setDbPost(data);
      } catch (err) {
        console.error('Error fetching db post', err);
      } finally {
        setLoading(false);
      }
    }
    loadPost();
  }, [id]);

  const hardcodedPost = BLOG_POSTS.find((p) => p.id === id);

  useEffect(() => {
    if (!loading && !hardcodedPost && !dbPost) {
      navigate('/blog', { replace: true });
    }
  }, [loading, hardcodedPost, dbPost, navigate]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      </MainLayout>
    );
  }

  if (!hardcodedPost && !dbPost) return null;

  const post: any = dbPost ? {
    id: dbPost.slug,
    title: dbPost.title,
    excerpt: dbPost.excerpt || '',
    category: dbPost.category || 'SEO',
    author: dbPost.author || 'Admin',
    authorAvatar: dbPost.author_avatar || '🧑‍💻',
    date: new Date(dbPost.published_at || dbPost.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    readTime: '10 min read',
    image: dbPost.featured_image_url || 'https://miaoda-site-img.s3cdn.medo.dev/app-icons/app_icon_128c0c18-8557-4863-9f08-5ec933ee3619.png',
    featured: false,
    content: dbPost.content,
  } : hardcodedPost;

  // If a full pillar article exists for this id AND there is no custom DB content override, render it directly.
  const FullArticle = id ? FULL_ARTICLE_COMPONENTS[id] : null;
  if (FullArticle && !dbPost?.content) {
    return <FullArticle />;
  }

  if (!post) return null;

  const relatedPosts = BLOG_POSTS.filter((p) => p.id !== post.id && p.category === post.category).slice(0, 3);
  const fallbackRelated = BLOG_POSTS.filter((p) => p.id !== post.id).slice(0, 3);
  const related = relatedPosts.length > 0 ? relatedPosts : fallbackRelated;

  const sections = [
    { heading: 'Why This Matters Now', body: generateBody(post)[0] },
    { heading: 'The Strategic Foundation', body: generateBody(post)[1] },
    { heading: 'Step-by-Step Breakdown', body: generateBody(post)[2] },
    { heading: 'Key Principles to Remember', body: generateBody(post)[3] },
    { heading: 'Taking the Next Step', body: generateBody(post)[4] },
  ];

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
        {/* Back */}
        <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        {/* Category + badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant="outline" className={`text-xs ${categoryColors[post.category] || 'text-muted-foreground border-border'}`}>
            {post.category}
          </Badge>
          {post.featured && (
            <Badge className="text-xs bg-primary text-primary-foreground">Featured</Badge>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-4xl font-bold text-navy text-balance leading-tight mb-4">
          {post.title}
        </h1>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
          <div className="flex items-center gap-2">
            <span className="text-xl">{post.authorAvatar}</span>
            <span className="font-medium text-foreground/80">{post.author}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            <span>{post.date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{post.readTime}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span>5 sections</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-border gap-1.5 ml-auto"
            onClick={() => { navigator.clipboard?.writeText(window.location.href); }}
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </Button>
        </div>

        {/* Hero image */}
        <div className="aspect-[16/9] overflow-hidden rounded-2xl mb-10 shadow-card">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article body */}
        <article className="prose-container max-w-none">
          {/* Intro */}
          <p className="text-base md:text-lg text-foreground/80 leading-relaxed mb-8 font-medium text-pretty border-l-4 border-primary/40 pl-5">
            {post.excerpt}
          </p>

          {sections.map((section, i) => (
            <div key={i} className="mb-8">
              <h2 className="text-xl font-bold text-navy mb-3">{section.heading}</h2>
              <p className="text-sm md:text-base text-foreground/75 leading-relaxed text-pretty">{section.body}</p>
            </div>
          ))}

          {/* Key takeaways */}
          <Card className="border-primary/20 bg-primary/5 shadow-card my-10">
            <CardContent className="p-6">
              <h3 className="text-base font-bold text-navy mb-3">🎯 Key Takeaways</h3>
              <ul className="flex flex-col gap-2">
                {[
                  'Start with one AI-integrated workflow before expanding to multiple tools.',
                  'Consistency and iteration speed matter more than perfection in early stages.',
                  'AI tools are force multipliers — they amplify the quality of your input.',
                  'Build systems that can run without you as quickly as possible.',
                  'The compounding advantage of early AI adoption is real and significant.',
                ].map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="text-primary font-bold shrink-0 mt-0.5">✓</span>
                    <span className="text-pretty">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </article>

        {/* Author bio */}
        <div className="flex items-center gap-4 p-5 bg-secondary/40 rounded-2xl border border-border mt-8 mb-12">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-2xl shrink-0">
            {post.authorAvatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-navy text-sm">{post.author}</div>
            <div className="text-xs text-muted-foreground mt-0.5 text-pretty">
              Contributor at AIDetector.cx · Expert in {post.category}. Helping founders build sustainable AI-powered businesses.
            </div>
          </div>
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-navy mb-5">More Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map((rel) => (
                <Link to={`/blog/${rel.id}`} key={rel.id}>
                  <Card className="h-full flex flex-col border-border shadow-card hover:shadow-hover transition-shadow group overflow-hidden">
                    <div className="aspect-[16/9] overflow-hidden">
                      <img src={rel.image} alt={rel.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <CardContent className="p-4 flex flex-col flex-1">
                      <Badge variant="outline" className={`self-start text-xs mb-2 ${categoryColors[rel.category] || 'text-muted-foreground border-border'}`}>
                        {rel.category}
                      </Badge>
                      <h3 className="font-semibold text-navy text-sm leading-snug text-balance group-hover:text-primary transition-colors flex-1">
                        {rel.title}
                      </h3>
                      <div className="flex items-center gap-1 mt-3 text-xs text-primary font-medium">
                        Read article <ArrowRight className="w-3 h-3" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
