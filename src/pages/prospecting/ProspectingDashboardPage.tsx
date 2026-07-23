import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ProspectingProject } from '@/types/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, Plus, Building2, Target, Calendar, BarChart3, Pause, Play, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';

export default function ProspectingDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProspectingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prospecting_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this project? All associated companies and decision makers will be removed.')) return;
    
    try {
      const { error } = await supabase.from('prospecting_projects').delete().eq('id', id);
      if (error) throw error;
      toast.success('Project deleted');
      setProjects(projects.filter(p => p.id !== id));
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete project');
    }
  };

  const handleToggleStatus = async (e: React.MouseEvent, project: ProspectingProject) => {
    e.preventDefault();
    e.stopPropagation();
    const newStatus = project.status === 'Active' ? 'Paused' : 'Active';
    try {
      const { error } = await supabase
        .from('prospecting_projects')
        .update({ status: newStatus })
        .eq('id', project.id);
      if (error) throw error;
      setProjects(projects.map(p => p.id === project.id ? { ...p, status: newStatus } : p));
      toast.success(`Project ${newStatus.toLowerCase()}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy mb-2">AI Business Growth Intelligence</h1>
          <p className="text-muted-foreground">Find high-quality leads, identify decision makers, and grow your business with AI-powered prospecting.</p>
        </div>
        <Button asChild>
          <Link to="/prospecting/projects/new">
            <Plus className="mr-2 h-4 w-4" /> Create New Project
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search projects..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-64 bg-muted/20"></Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-lg border border-border">
          <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {searchQuery ? "Try adjusting your search query." : "You haven't created any prospecting projects yet. Start finding your ideal customers today."}
          </p>
          {!searchQuery && (
            <Button asChild>
              <Link to="/prospecting/projects/new">Create Your First Project</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <Card 
              key={project.id} 
              className="cursor-pointer hover:border-primary/50 transition-colors flex flex-col h-full"
              onClick={() => navigate(`/prospecting/projects/${project.id}/companies`)}
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <Badge variant={project.status === 'Active' ? 'default' : 'secondary'} className="mb-2">
                    {project.status}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => handleToggleStatus(e, project)}>
                      {project.status === 'Active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => handleDelete(e, project.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-xl line-clamp-1">{project.name}</CardTitle>
                <CardDescription className="line-clamp-2 mt-1">{project.goal}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Target className="h-4 w-4 mr-2" />
                    <span className="truncate">{project.business_type} • {project.target_country}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Building2 className="h-4 w-4 mr-2" />
                    <span className="truncate">{project.company_size}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="truncate">Created {format(new Date(project.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-border mt-auto shrink-0 bg-muted/10 flex justify-between text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 mr-1" />
                  <span>---</span> {/* Would be total companies */}
                </div>
                <div className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  <span>--- Avg Score</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}