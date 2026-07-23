import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const ROLES = [
  'CEO', 'Founder', 'Owner', 'Marketing Director', 'Head of Growth', 
  'Procurement Manager', 'CTO', 'COO', 'CFO', 'Sales Director'
];

export default function CreateProspectingProjectPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    target_country: 'United States',
    business_type: '',
    company_size: '11-50 employees',
    goal: ''
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.name || !formData.business_type || selectedRoles.length === 0) {
      toast.error('Please fill in all required fields (Name, Business Type, and at least one Role).');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prospecting_projects')
        .insert({
          user_id: user.id,
          name: formData.name,
          target_country: formData.target_country,
          business_type: formData.business_type,
          company_size: formData.company_size,
          decision_maker_role: selectedRoles,
          goal: formData.goal,
          status: 'Active'
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Project created successfully! Starting AI search...');
      // Simulate small delay for "AI" starting
      setTimeout(() => {
        navigate(`/prospecting/projects/${data.id}/companies?simulate=true`);
      }, 1000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create project');
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create Prospecting Project</CardTitle>
          <CardDescription>Define your target audience and let our AI build your lead database.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name <span className="text-destructive">*</span></Label>
              <Input 
                id="name" 
                placeholder="e.g., SEO Services for US Law Firms" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Target Country</Label>
                <Select value={formData.target_country} onValueChange={v => setFormData({ ...formData, target_country: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="United States">United States</SelectItem>
                    <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="Australia">Australia</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                    <SelectItem value="France">France</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_type">Business Type / Industry <span className="text-destructive">*</span></Label>
                <Input 
                  id="business_type" 
                  placeholder="e.g., Law Firms, SaaS, Healthcare" 
                  value={formData.business_type}
                  onChange={e => setFormData({ ...formData, business_type: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Company Size</Label>
                <Select value={formData.company_size} onValueChange={v => setFormData({ ...formData, company_size: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10 employees">1-10 employees</SelectItem>
                    <SelectItem value="11-50 employees">11-50 employees</SelectItem>
                    <SelectItem value="51-200 employees">51-200 employees</SelectItem>
                    <SelectItem value="201-500 employees">201-500 employees</SelectItem>
                    <SelectItem value="501-1000 employees">501-1000 employees</SelectItem>
                    <SelectItem value="1000+ employees">1000+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Target Decision Makers <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 border border-border rounded-md bg-muted/20">
                {ROLES.map(role => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`role-${role}`} 
                      checked={selectedRoles.includes(role)}
                      onCheckedChange={() => handleRoleToggle(role)}
                    />
                    <Label htmlFor={`role-${role}`} className="text-sm font-normal cursor-pointer">{role}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Outreach Goal</Label>
              <Textarea 
                id="goal" 
                placeholder="e.g., Sell SEO Services, Pitch marketing automation software..." 
                className="min-h-[100px]"
                value={formData.goal}
                onChange={e => setFormData({ ...formData, goal: e.target.value })}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-border pt-6">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Start Finding Companies'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}