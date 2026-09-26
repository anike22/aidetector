import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { humanizerApi } from '@/lib/humanizerApi';
import { HumanizationJob } from '@/types/humanizer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search, History, ChevronRight, FileText, Calendar, Star, Copy, Check, BookmarkCheck } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function HumanizerHistoryPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<HumanizationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (text: string, label: string, key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success(`Copied ${label} to clipboard!`);
      setTimeout(() => {
        setCopiedKey(prev => (prev === key ? null : prev));
      }, 2000);
    } catch (err) {
      console.error(err);
      toast.error('Failed to copy text.');
    }
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const fetchedJobs = await humanizerApi.getJobs();
        setJobs(fetchedJobs);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredJobs = jobs.filter(job => 
    job.original_text.toLowerCase().includes(search.toLowerCase()) || 
    (job.humanized_text && job.humanized_text.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return <div className="flex items-center justify-center h-[50vh]"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto py-10 max-w-6xl">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
            <History className="h-8 w-8" />
            Humanization History
          </h1>
          <p className="text-muted-foreground">View and manage your past humanization jobs.</p>
        </div>
        <Button onClick={() => navigate('/humanizer')}>New Humanization</Button>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search original or humanized text..." 
          className="pl-10 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredJobs.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No history found</h3>
            <p className="text-muted-foreground mb-6">You haven't run any humanization jobs yet or none match your search.</p>
            <Button onClick={() => navigate('/humanizer')}>Start Humanizing</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredJobs.map(job => (
            <Card key={job.job_id} className="hover:bg-muted/5 transition-colors cursor-pointer group" onClick={() => navigate(`/humanizer/result/${job.job_id}`)}>
              <CardContent className="p-5 flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>{job.status}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(job.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                    {job.saved && <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Star className="h-3 w-3 mr-1 fill-yellow-500" /> Saved</Badge>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">ORIGINAL</div>
                      <p className="text-sm truncate opacity-80">{job.original_text.substring(0, 100)}...</p>
                    </div>
                    {job.humanized_text && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center justify-between">
                          <span>HUMANIZED</span>
                          <button
                            type="button"
                            className="text-[11px] text-primary hover:underline flex items-center gap-1"
                            onClick={(e) => handleCopy(job.humanized_text!, 'Humanized text', `${job.job_id}-main`, e)}
                          >
                            {copiedKey === `${job.job_id}-main` ? (
                              <>
                                <Check className="h-3 w-3 text-green-600" />
                                <span className="text-green-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-sm truncate">{job.humanized_text.substring(0, 100)}...</p>
                      </div>
                    )}
                  </div>

                  {job.alternatives && job.alternatives.some(a => a.status === 'Completed' && a.text) && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <BookmarkCheck className="h-3.5 w-3.5 text-emerald-600" />
                          Auto-Saved Versions
                        </span>
                        <span className="text-[10px] text-muted-foreground normal-case">Copy any version anytime</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {job.alternatives
                          .filter(a => a.status === 'Completed' && a.text)
                          .map(alt => {
                            const key = `${job.job_id}-${alt.alternative_type}`;
                            const isCopied = copiedKey === key;
                            return (
                              <Button
                                key={alt.alternative_type}
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs flex items-center gap-1.5 bg-background hover:bg-primary/10 hover:border-primary/50"
                                onClick={(e) => handleCopy(alt.text!, alt.alternative_type, key, e)}
                                title={`Copy ${alt.alternative_type} text to clipboard`}
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-green-600" />
                                    <span className="text-green-600 font-medium">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3 text-muted-foreground" />
                                    <span>Copy {alt.alternative_type}</span>
                                  </>
                                )}
                              </Button>
                            );
                          })}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/humanizer/alternatives/${job.job_id}`);
                          }}
                        >
                          View Alternatives &rarr;
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="shrink-0 flex items-center gap-6 w-full md:w-auto">
                  {job.scores && (job.scores as any).humanization_score && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{(job.scores as any).humanization_score}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</div>
                    </div>
                  )}
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex" onClick={(e) => { e.stopPropagation(); navigate(`/humanizer/result/${job.job_id}`); }}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
