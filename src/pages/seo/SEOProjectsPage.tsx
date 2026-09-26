import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Search, LayoutDashboard, Globe, Activity, TrendingUp, MoreHorizontal, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { seoApi } from '@/lib/api/seo';
import { SEOProject } from '@/types/seo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SEOProjectsPage() {
  const [projects, setProjects] = useState<SEOProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await seoApi.getProjects();
      setProjects(data);
    } catch (error: any) {
      toast.error('Failed to load projects: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await seoApi.deleteProject(id);
      toast.success('Project deleted');
      loadProjects();
    } catch (error: any) {
      toast.error('Failed to delete: ' + error.message);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.project_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">SEO Projects</h2>
          <p className="text-muted-foreground">Manage and track your domain portfolios.</p>
        </div>
        <Button asChild>
          <Link to="/seo-projects/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading projects...</div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center">
              <LayoutDashboard className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-1">No projects found</h3>
              <p className="text-muted-foreground mb-4">You haven't created any SEO projects yet.</p>
              <Button asChild>
                <Link to="/seo-projects/new">Create your first project</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <Card key={project.project_id} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-lg">
                        <Link to={`/seo-projects/${project.project_id}`} className="hover:underline">
                          {project.project_name}
                        </Link>
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Globe className="h-3 w-3 mr-1" />
                        {project.domain}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2 -mt-2">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to={`/seo-projects/${project.project_id}/edit`}>Edit Project</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/seo-dashboard?domain=${project.domain}`}>Quick Analyze</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-rose-600" onClick={() => handleDelete(project.project_id)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.status === 'Active' ? (
                        <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Archived</Badge>
                      )}
                      <Badge variant="outline">{project.competitors?.length || 0} Competitors</Badge>
                      {project.country && <Badge variant="outline">{project.country}</Badge>}
                    </div>
                    <div className="pt-4 border-t flex justify-between items-center text-sm text-muted-foreground">
                      <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
                      <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                        <Link to={`/seo-projects/${project.project_id}`}>
                          View Details <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}