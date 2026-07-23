import React, { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ProspectingCrmLead } from '@/types/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Search, Plus, Filter, Download, MoreHorizontal, MessageSquare, Calendar, Mail } from 'lucide-react';

const STAGES = ['New Lead', 'Contacted', 'Meeting Scheduled', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

export default function AiCrmPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<ProspectingCrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) fetchLeads();
  }, [user]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prospecting_crm_leads')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      setLeads(data || []);
    } catch (err: any) {
      toast.error('Failed to load CRM leads');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('leadId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('leadId');
    if (!id) return;

    try {
      const { error } = await supabase
        .from('prospecting_crm_leads')
        .update({ stage, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      setLeads(leads.map(l => l.id === id ? { ...l, stage } : l));
      toast.success(`Lead moved to ${stage}`);
    } catch(err) {
      toast.error('Failed to update stage');
    }
  };

  const filteredLeads = leads.filter(l => 
    l.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.decision_maker_name && l.decision_maker_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="container mx-auto py-8 max-w-[1600px] h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-navy mb-2">AI CRM Pipeline</h1>
          <p className="text-muted-foreground">Manage your generated leads and track deal progress.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.success('Export initiated')} type="button"><Download className="mr-2 h-4 w-4" /> Export</Button>
          <Button onClick={() => toast.success('Add Lead dialog opened')} type="button"><Plus className="mr-2 h-4 w-4" /> Add Lead</Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search company or contact..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => toast.success('Filters dialog opened')} type="button"><Filter className="mr-2 h-4 w-4" /> Filters</Button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">Loading pipeline...</div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 h-full min-w-max">
            {STAGES.map(stage => {
              const stageLeads = filteredLeads.filter(l => l.stage === stage);
              return (
                <div 
                  key={stage} 
                  className="w-80 flex flex-col bg-muted/30 rounded-lg border border-border overflow-hidden"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage)}
                >
                  <div className="p-3 border-b border-border bg-muted/50 flex justify-between items-center font-medium">
                    <div className="flex items-center gap-2">
                      <span>{stage}</span>
                      <span className="bg-background text-muted-foreground text-xs px-2 py-0.5 rounded-full border border-border">
                        {stageLeads.length}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-3 flex-1 overflow-y-auto space-y-3">
                    {stageLeads.map(lead => (
                      <div 
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className="bg-card border border-border rounded-md p-3 shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium truncate pr-2">{lead.company_name}</div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 shrink-0" onClick={() => toast.success('Actions menu opened')} type="button">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                        {lead.decision_maker_name && (
                          <div className="text-sm text-muted-foreground mb-3 flex items-center">
                            <Target className="h-3 w-3 mr-1 shrink-0" />
                            <span className="truncate">{lead.decision_maker_name}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center mt-4">
                          <div className={`text-xs font-semibold px-2 py-1 rounded-md ${
                            (lead.lead_score || 0) >= 80 ? 'bg-green-100 text-green-800' :
                            (lead.lead_score || 0) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            Score: {lead.lead_score || 'N/A'}
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toast.success('Open Email panel')} type="button"><Mail className="h-3 w-3 text-muted-foreground" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toast.success('Open Calendar')} type="button"><Calendar className="h-3 w-3 text-muted-foreground" /></Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Dummy target icon missing from import above
function Target(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
}