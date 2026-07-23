import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Star, MessageSquare, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function HireExpertPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selectedExpert, setSelectedExpert] = useState<any>(null);

  // Mock data for immediate render. In production this comes from `experts` table.
  const experts = [
    { id: 1, name: 'Sarah Jenkins', title: 'SEO Strategist', category: 'SEO', rate: 120, rating: 4.9, reviews: 45, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', skills: ['Technical SEO', 'Content Strategy', 'Link Building'] },
    { id: 2, name: 'Michael Chen', title: 'AI Implementation Lead', category: 'AI', rate: 150, rating: 5.0, reviews: 32, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael', skills: ['Machine Learning', 'Workflow Automation', 'Prompt Engineering'] },
    { id: 3, name: 'Elena Rodriguez', title: 'Growth Marketer', category: 'Growth', rate: 100, rating: 4.8, reviews: 67, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena', skills: ['Performance Marketing', 'CRO', 'Email Automation'] },
    { id: 4, name: 'David Smith', title: 'Enterprise SEO Consultant', category: 'SEO', rate: 180, rating: 4.9, reviews: 89, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David', skills: ['Programmatic SEO', 'E-E-A-T', 'International SEO'] },
  ];

  const filteredExperts = experts.filter(exp => {
    const matchesSearch = exp.name.toLowerCase().includes(search.toLowerCase()) || exp.skills.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = category === 'All' || exp.category === category;
    return matchesSearch && matchesCat;
  });

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Consultation booked successfully!');
    setSelectedExpert(null);
  };

  return (
    <div className="container mx-auto py-16 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-navy">
          Hire an Expert
        </h1>
        <p className="text-xl text-muted-foreground">
          Connect with verified experts for your AI, SEO, marketing, and business growth needs.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or skill..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            <SelectItem value="SEO">SEO</SelectItem>
            <SelectItem value="AI">AI Consulting</SelectItem>
            <SelectItem value="Growth">Growth Marketing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredExperts.map(expert => (
          <Card key={expert.id} className="flex flex-col">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full overflow-hidden mb-4 border border-border">
                <img src={expert.image} alt={expert.name} className="w-full h-full object-cover" />
              </div>
              <CardTitle className="text-lg">{expert.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{expert.title}</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center">
              <div className="flex items-center space-x-1 mb-4">
                <Star className="w-4 h-4 fill-primary text-primary" />
                <span className="font-medium text-sm">{expert.rating}</span>
                <span className="text-muted-foreground text-sm">({expert.reviews} reviews)</span>
              </div>
              <div className="flex flex-wrap justify-center gap-1 mb-6">
                {expert.skills.slice(0, 3).map(skill => (
                  <Badge key={skill} variant="secondary" className="text-xs font-normal">{skill}</Badge>
                ))}
              </div>
              <div className="mt-auto w-full space-y-3">
                <div className="text-center">
                  <span className="font-bold text-lg">${expert.rate}</span>
                  <span className="text-muted-foreground text-sm">/hr</span>
                </div>
                
                <Dialog open={selectedExpert?.id === expert.id} onOpenChange={(open) => !open && setSelectedExpert(null)}>
                  <DialogTrigger asChild>
                    <Button className="w-full" onClick={() => setSelectedExpert(expert)}>Book Consultation</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Book Consultation with {expert.name}</DialogTitle>
                      <DialogDescription>
                        Fill out the details below to schedule your strategy session.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBooking} className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date</Label>
                          <Input type="date" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Time</Label>
                          <Input type="time" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Project Details</Label>
                        <Textarea placeholder="Briefly describe what you need help with..." required className="min-h-[100px]" />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setSelectedExpert(null)}>Cancel</Button>
                        <Button type="submit">Confirm Booking</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredExperts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No experts found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}