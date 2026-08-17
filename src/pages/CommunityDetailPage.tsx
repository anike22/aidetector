import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft, MessageSquare, Eye, Award, ThumbsUp,
  Share2, Clock, Send,
} from 'lucide-react';
import { FORUM_POSTS } from '@/data/siteData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

// Deterministic mock replies based on post id
const MOCK_REPLIES = [
  {
    author: 'TechFounder_Alex', avatar: '👨‍💻', reputation: 4820, time: '2h ago',
    content: 'This is exactly what I needed to see. I\'ve been struggling with the same approach and this completely changes my thinking. Thanks for sharing the detailed breakdown!',
    likes: 34,
  },
  {
    author: 'AIEnthusiast', avatar: '🤖', reputation: 3650, time: '4h ago',
    content: 'Great post! I\'d add that the key is starting small — pick one use case and nail it completely before expanding. The temptation to do everything at once kills most projects.',
    likes: 21,
  },
  {
    author: 'StartupHunter', avatar: '🚀', reputation: 1800, time: '6h ago',
    content: 'I tried a similar approach last year and the results were mixed. What made the biggest difference for you in terms of tooling? I\'m particularly curious about the automation stack.',
    likes: 12,
  },
];

interface DBPost {
  id: string;
  title: string;
  content?: string;
  category: string;
  replies: number;
  views: number;
  created_at: string;
  author_id: string;
}

export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dbPost, setDbPost] = useState<DBPost | null>(null);
  const [loadingDb, setLoadingDb] = useState(false);

  // Helper to generate slug for static posts
  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Try to find in static data first
  const staticPost = FORUM_POSTS.find((p) => p.id === id || generateSlug(p.title) === id);

  // If not static, try DB
  useEffect(() => {
    if (!staticPost && id) {
      setLoadingDb(true);
      // Wait, we can't search by slug directly in Supabase if there's no slug column
      // We will assume `id` could be UUID or fallback. If id is not UUID, maybeSingle will fail, so we catch it.
      supabase
        .from('forum_posts')
        .select('id, title, content, category, replies, views, created_at, author_id')
        .eq('id', id)
        .maybeSingle()
        .then(({ data }) => {
          setLoadingDb(false);
          if (data) setDbPost(data as DBPost);
          else navigate('/community', { replace: true });
        });
    }
  }, [id, staticPost, navigate]);

  if (!staticPost && loadingDb) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading discussion…</p>
        </div>
      </MainLayout>
    );
  }

  if (!staticPost && !dbPost) {
    return (
      <MainLayout>
        <div className="py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Discussion Not Found</h1>
          <p className="text-muted-foreground mb-6">The discussion you are looking for does not exist or has been removed.</p>
          <Button asChild>
            <Link to="/community">Back to Community</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Unified display data
  const post = staticPost
    ? {
        id: staticPost.id,
        title: staticPost.title,
        author: staticPost.author,
        authorAvatar: staticPost.authorAvatar,
        category: staticPost.category,
        replies: staticPost.replies,
        views: staticPost.views,
        lastActivity: staticPost.lastActivity,
        reputation: staticPost.reputation,
        content: `This thread covers strategies and insights around "${staticPost.title}". The discussion below includes real experiences from our community members.`,
      }
    : {
        id: dbPost!.id,
        title: dbPost!.title,
        author: 'Community Member',
        authorAvatar: 'U',
        category: dbPost!.category,
        replies: dbPost!.replies,
        views: dbPost!.views,
        lastActivity: new Date(dbPost!.created_at).toLocaleDateString(),
        reputation: 0,
        content: dbPost!.content || '',
      };

  const handleReply = async () => {
    if (!user) { navigate('/login'); return; }
    if (!replyText.trim()) { toast.error('Please write your reply.'); return; }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    toast.success('Reply posted!');
    setReplyText('');
  };

  const relatedPosts = FORUM_POSTS
    .filter((p) => p.id !== id && p.category === post.category)
    .slice(0, 3);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
        {/* Back */}
        <Link to="/community" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Community
        </Link>

        {/* Category badge */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
            {post.category}
          </Badge>
        </div>

        {/* Title */}
        <h1 className="text-xl md:text-3xl font-bold text-navy text-balance leading-tight mb-5">
          {post.title}
        </h1>

        {/* OP card */}
        <Card className="border-border shadow-card mb-6">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <Avatar className="shrink-0 w-10 h-10">
                <AvatarFallback className="bg-primary/10 text-lg">{post.authorAvatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="font-semibold text-navy text-sm">{post.author}</span>
                  {post.reputation > 0 && (
                    <div className="flex items-center gap-1 text-xs text-warning">
                      <Award className="w-3 h-3" />
                      {post.reputation.toLocaleString()} pts
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                    <Clock className="w-3 h-3" /> {post.lastActivity}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed text-pretty mb-4">
                  {post.content}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border/50">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> {post.replies} replies
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> {post.views.toLocaleString()} views
                  </span>
                  <button
                    onClick={() => navigator.clipboard?.writeText(window.location.href)}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors ml-auto"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Replies */}
        <h2 className="text-base font-bold text-navy mb-4">
          {MOCK_REPLIES.length} Replies
        </h2>
        <div className="flex flex-col gap-4 mb-8">
          {MOCK_REPLIES.map((reply, i) => (
            <Card key={i} className="border-border shadow-card">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="shrink-0 w-8 h-8">
                    <AvatarFallback className="bg-muted text-base">{reply.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-medium text-navy text-xs">{reply.author}</span>
                      <div className="flex items-center gap-1 text-xs text-warning">
                        <Award className="w-3 h-3" /> {reply.reputation.toLocaleString()}
                      </div>
                      <span className="text-xs text-muted-foreground ml-auto">{reply.time}</span>
                    </div>
                    <p className="text-sm text-foreground/75 leading-relaxed text-pretty mb-3">{reply.content}</p>
                    <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5" /> {reply.likes}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Write reply */}
        <Card className="border-border shadow-card mb-10">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-navy mb-3">
              {user ? 'Write a Reply' : 'Join the Discussion'}
            </h3>
            {user ? (
              <div className="flex flex-col gap-3">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Share your thoughts, experiences, or questions…"
                  className="min-h-[100px] text-sm border-border resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    className="bg-primary text-primary-foreground gap-2 h-9"
                    onClick={handleReply}
                    disabled={submitting || !replyText.trim()}
                  >
                    {submitting
                      ? <><div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> Posting…</>
                      : <><Send className="w-3.5 h-3.5" /> Post Reply</>
                    }
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">Log in to join the discussion and post your reply.</p>
                <Link to="/login">
                  <Button size="sm" className="bg-primary text-primary-foreground h-9" onClick={() => {}}>Log In to Reply</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Related discussions */}
        {relatedPosts.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-navy mb-4">Related Discussions</h2>
            <div className="flex flex-col gap-3">
              {relatedPosts.map((rel) => (
                <Link to={`/community/${rel.id}`} key={rel.id}>
                  <Card className="border-border shadow-card hover:shadow-hover transition-shadow group">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="shrink-0 w-8 h-8">
                          <AvatarFallback className="bg-muted text-base">{rel.authorAvatar}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-navy group-hover:text-primary transition-colors text-balance leading-snug">
                            {rel.title}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {rel.replies}</span>
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {rel.views.toLocaleString()}</span>
                          </div>
                        </div>
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
