import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/db/supabase';
import { BLOG_POSTS, type BlogPost, type ContentHub } from '@/data/siteData';
import MainLayout from '@/components/layouts/MainLayout';
import { Loader2 } from 'lucide-react';
import NotFound from './NotFound';
import GonePage from './GonePage';
import BestAIDetectorPage from './blog/BestAIDetectorPage';
import ChatGPTDetectorPage from './blog/ChatGPTDetectorPage';
import GPT5VsGeminiPage from './blog/GPT5VsGeminiPage';
import TurnitinVsAIDetectorPage from './blog/TurnitinVsAIDetectorPage';
import HowAIDetectionWorksPage from './blog/HowAIDetectionWorksPage';
import AIDetectionAccuracyTestsPage from './blog/AIDetectionAccuracyTestsPage';
import WordsThatTriggerAIDetectionPage from './blog/WordsThatTriggerAIDetectionPage';
import WhyWasMyEssayFlaggedPage from './blog/why-was-my-essay-flagged-as-ai';
import { WhyTikTokFlaggedMyRealVideoPage } from './blog/WhyTikTokFlaggedMyRealVideoPage';
import { WhatsAppCompressionAIDetectionPage } from './blog/WhatsAppCompressionAIDetectionPage';
import { AuthenticVideoFalsePositiveGuidePage } from './blog/AuthenticVideoFalsePositiveGuidePage';
import GenericArticleDetail from '@/components/blog/GenericArticleDetail';

const HUBS: ContentHub[] = ['guides', 'research', 'comparisons', 'blog'];

const FULL_ARTICLE_COMPONENTS: Record<string, React.ComponentType> = {
  'best-ai-detector': BestAIDetectorPage,
  'chatgpt-detector-comparison': ChatGPTDetectorPage,
  'gpt-5-vs-gemini-detection': GPT5VsGeminiPage,
  'turnitin-vs-aidetector-cx': TurnitinVsAIDetectorPage,
  'how-ai-detection-works': HowAIDetectionWorksPage,
  'ai-detection-accuracy-tests': AIDetectionAccuracyTestsPage,
  'words-that-trigger-ai-detection': WordsThatTriggerAIDetectionPage,
  'why-was-my-essay-flagged-as-ai': WhyWasMyEssayFlaggedPage,
  'why-tiktok-flagged-my-real-video': WhyTikTokFlaggedMyRealVideoPage,
  'whatsapp-compression-ai-video': WhatsAppCompressionAIDetectionPage,
  'authentic-video-false-positives': AuthenticVideoFalsePositiveGuidePage,
};

function isNumericSlug(value: string) {
  return /^\d+$/.test(value);
}

function dbToPost(dbPost: any): BlogPost {
  return {
    id: dbPost.slug,
    slug: dbPost.slug,
    hub: (dbPost.hub as ContentHub) || 'blog',
    title: dbPost.title,
    excerpt: dbPost.excerpt || '',
    category: dbPost.category || 'AI Detection',
    author: dbPost.author || 'Admin',
    authorAvatar: dbPost.author_avatar || '🧑‍💻',
    date: new Date(dbPost.published_at || dbPost.created_at).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
    readTime: dbPost.reading_time ? `${dbPost.reading_time} min read` : '10 min read',
    image: dbPost.featured_image_url || null,
    featured: !!dbPost.is_featured,
    content: dbPost.content,
  };
}

export default function ArticlePage() {
  const { hub, slug } = useParams<{ hub?: string; slug?: string }>();
  const navigate = useNavigate();
  const [dbPost, setDbPost] = useState<any>(null);
  const [redirect, setRedirect] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const resolvedHub = (hub || 'blog') as ContentHub;
  const resolvedSlug = slug || '';

  // Redirect legacy or alternate slugs
  useEffect(() => {
    if (resolvedSlug === 'understanding-ai-detection-scores') {
      navigate('/guides/how-ai-detection-works', { replace: true });
    }
  }, [resolvedSlug, navigate]);

  useEffect(() => {
    async function load() {
      if (!resolvedSlug || !HUBS.includes(resolvedHub)) {
        setLoading(false);
        return;
      }

      if (resolvedHub === 'blog' && isNumericSlug(resolvedSlug)) {
        try {
          const { data } = await supabase
            .from('redirects')
            .select('*')
            .eq('old_url', `/blog/${resolvedSlug}`)
            .single();
          setRedirect(data);
        } catch {
          setRedirect(null);
        }
      }

      try {
        const { data } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', resolvedSlug)
          .eq('hub', resolvedHub)
          .eq('status', 'published')
          .single();
        if (data) setDbPost(data);
      } catch (err) {
        console.error('Error fetching article', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [resolvedHub, resolvedSlug]);

  useEffect(() => {
    if (redirect?.is_active && redirect?.redirect_type !== '410' && redirect?.new_url) {
      navigate(redirect.new_url, { replace: true });
    }
  }, [redirect, navigate]);

  const post: BlogPost | null = useMemo(() => {
    if (dbPost) return dbToPost(dbPost);
    const hardcoded = BLOG_POSTS.find((p) => p.id === resolvedSlug);
    if (!hardcoded) return null;
    // Legacy /blog/:slug or hub-specific slug must match hub.
    if (!hub || hardcoded.hub === resolvedHub) return hardcoded;
    return null;
  }, [dbPost, resolvedHub, resolvedSlug, hub]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!HUBS.includes(resolvedHub)) {
    return <NotFound />;
  }

  // Legacy numeric /blog/:id URLs -> 410 Gone unless an active non-410 redirect exists.
  if (resolvedHub === 'blog' && isNumericSlug(resolvedSlug)) {
    if (redirect?.is_active && redirect?.redirect_type !== '410') {
      return null; // navigate effect will redirect
    }
    return <GonePage />;
  }

  if (!post) {
    return <NotFound />;
  }

  const FullArticle = FULL_ARTICLE_COMPONENTS[resolvedSlug];
  if (FullArticle) {
    return <FullArticle />;
  }

  return (
    <MainLayout>
      <GenericArticleDetail post={post} />
    </MainLayout>
  );
}
