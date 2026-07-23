import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus, FileText, TrendingUp, Clock, Trash2, ArrowRight, Loader2, Pen
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';

interface ArticleRow {
  id: string;
  title: string;
  keyword: string;
  word_count: number;
  seo_score: number | null;
  current_step: number;
  status: 'draft' | 'ready';
  created_at: string;
}

export default function ContentStudioPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchArticles();
  }, [user]);

  const fetchArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, keyword, word_count, seo_score, current_step, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) setArticles(data as ArticleRow[]);
    setLoading(false);
  };

  const handleNewArticle = async () => {
    if (!user) return;
    setCreating(true);
    const { data, error } = await supabase
      .from('articles')
      .insert({ author_id: user.id, title: 'Untitled Article', keyword: '', current_step: 1, status: 'draft' })
      .select('id')
      .maybeSingle();
    setCreating(false);
    if (error || !data) { toast.error('Failed to create article.'); return; }
    navigate(`/content-studio/${data.id}`);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) { toast.error('Failed to delete article.'); return; }
    setArticles((prev) => prev.filter((a) => a.id !== id));
    toast.success('Article deleted.');
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <Badge variant="outline" className="mb-3 text-primary border-primary/30 bg-primary/5">AI + SEO</Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-navy text-balance">Content Studio</h1>
            <p className="text-muted-foreground mt-1 text-pretty">
              Generate SEO-optimized articles with a guided 12-step AI workflow — no one-click publishing.
            </p>
          </div>
          <Button
            className="bg-primary text-primary-foreground gap-2 shrink-0 h-10"
            onClick={handleNewArticle}
            disabled={creating}
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            New Article
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: FileText, label: 'Total Articles', value: articles.length },
            { icon: TrendingUp, label: 'Ready', value: articles.filter((a) => a.status === 'ready').length },
            { icon: Clock, label: 'Drafts', value: articles.filter((a) => a.status === 'draft').length },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} className="border-border shadow-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="font-bold text-navy text-lg leading-none">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Articles list */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : articles.length === 0 ? (
          <Card className="border-border shadow-card">
            <CardContent className="p-16 text-center">
              <Pen className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold text-navy mb-2">No articles yet</h2>
              <p className="text-sm text-muted-foreground mb-6 text-pretty max-w-xs mx-auto">
                Create your first SEO article using our guided 12-step AI workflow.
              </p>
              <Button className="bg-primary text-primary-foreground gap-2" onClick={handleNewArticle} disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create First Article
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {articles.map((article) => (
              <Card key={article.id} className="border-border shadow-card hover:shadow-hover transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-navy text-sm truncate">
                          {article.title || 'Untitled Article'}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-xs shrink-0 ${
                            article.status === 'ready'
                              ? 'border-success/30 text-success bg-success/5'
                              : 'border-warning/30 text-warning bg-warning/5'
                          }`}
                        >
                          {article.status === 'ready' ? 'Ready' : `Step ${article.current_step}/12`}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {article.keyword && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> {article.keyword}
                          </span>
                        )}
                        {article.word_count > 0 && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" /> {article.word_count.toLocaleString()} words
                          </span>
                        )}
                        {article.seo_score !== null && (
                          <span className={`font-medium ${article.seo_score >= 80 ? 'text-success' : article.seo_score >= 60 ? 'text-warning' : 'text-destructive'}`}>
                            SEO {article.seo_score}/100
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(article.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/5"
                        onClick={() => handleDelete(article.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-primary text-primary-foreground gap-1"
                        onClick={() => navigate(`/content-studio/${article.id}`)}
                      >
                        {article.status === 'ready' ? 'View' : 'Continue'}
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
