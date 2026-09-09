import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { humanizerApi } from '@/lib/humanizerApi';
import { HumanizationJob } from '@/types/humanizer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search, History, ChevronRight, FileText, Calendar, Star } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function HumanizerHistoryPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<HumanizationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
                        <div className="text-xs font-medium text-muted-foreground mb-1">HUMANIZED</div>
                        <p className="text-sm truncate">{job.humanized_text.substring(0, 100)}...</p>
                      </div>
                    )}
                  </div>
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
