import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Search, Store, FileText, PiggyBank, Handshake, Landmark, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PremiumFindersPage() {
  const [activeTab, setActiveTab] = useState('local');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = () => {
    setLoading(true);
    setResults([]);
    setTimeout(() => {
      if (activeTab === 'local') {
        setResults([
          { name: 'Joe\'s Pizza', location: 'New York, NY', rating: 4.8, category: 'Restaurant', phone: '(555) 123-4567' },
          { name: 'Downtown Dental', location: 'New York, NY', rating: 4.5, category: 'Clinic', phone: '(555) 987-6543' }
        ]);
      } else if (activeTab === 'tender') {
        setResults([
          { title: 'IT Infrastructure Upgrade', org: 'Dept of Education', value: '$250k-$500k', deadline: '2026-08-15' },
          { title: 'Cloud Migration Services', org: 'City Council', value: '$100k-$200k', deadline: '2026-07-30' }
        ]);
      } else if (activeTab === 'grant') {
        setResults([
          { title: 'Tech Innovation Grant', funder: 'National Science Foundation', amount: '$50,000', deadline: '2026-09-01' },
          { title: 'Small Business Relief', funder: 'State Commerce Dept', amount: '$15,000', deadline: '2026-10-15' }
        ]);
      } else if (activeTab === 'partnership') {
        setResults([
          { company: 'TechSolutions Inc', industry: 'SaaS', size: '51-200', score: 92 },
          { company: 'Marketing Pros', industry: 'Agency', size: '11-50', score: 85 }
        ]);
      } else {
        setResults([
          { name: 'Sequoia Capital', focus: 'SaaS, AI', stage: 'Series A, Series B', location: 'Menlo Park, CA' },
          { name: 'Y Combinator', focus: 'Agnostic', stage: 'Seed', location: 'Mountain View, CA' }
        ]);
      }
      setLoading(false);
      toast.success('Search complete');
    }, 1500);
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy mb-2 flex items-center"><Store className="mr-3 h-8 w-8 text-primary" /> Premium Finders</h1>
        <p className="text-muted-foreground">Discover hyper-specific opportunities across local businesses, government tenders, grants, partnerships, and investors.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto md:h-12 mb-8">
          <TabsTrigger value="local" className="py-2.5"><Store className="mr-2 h-4 w-4 hidden md:block" /> Local</TabsTrigger>
          <TabsTrigger value="tender" className="py-2.5"><FileText className="mr-2 h-4 w-4 hidden md:block" /> Tenders</TabsTrigger>
          <TabsTrigger value="grant" className="py-2.5"><PiggyBank className="mr-2 h-4 w-4 hidden md:block" /> Grants</TabsTrigger>
          <TabsTrigger value="partnership" className="py-2.5"><Handshake className="mr-2 h-4 w-4 hidden md:block" /> Partners</TabsTrigger>
          <TabsTrigger value="investor" className="py-2.5"><Landmark className="mr-2 h-4 w-4 hidden md:block" /> Investors</TabsTrigger>
        </TabsList>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === 'local' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input placeholder="Business Type (e.g. Restaurants)" />
                <Input placeholder="Location (City, Zip)" />
                <Select><SelectTrigger><SelectValue placeholder="Radius" /></SelectTrigger><SelectContent><SelectItem value="5">5 miles</SelectItem><SelectItem value="10">10 miles</SelectItem></SelectContent></Select>
              </div>
            )}
            {activeTab === 'tender' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select><SelectTrigger><SelectValue placeholder="Industry" /></SelectTrigger><SelectContent><SelectItem value="it">Information Technology</SelectItem><SelectItem value="construction">Construction</SelectItem></SelectContent></Select>
                <Select><SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger><SelectContent><SelectItem value="us">United States</SelectItem><SelectItem value="uk">United Kingdom</SelectItem></SelectContent></Select>
                <Input placeholder="Max Value ($)" />
              </div>
            )}
            {activeTab === 'grant' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select><SelectTrigger><SelectValue placeholder="Grant Type" /></SelectTrigger><SelectContent><SelectItem value="startup">Startup</SelectItem><SelectItem value="research">Research</SelectItem></SelectContent></Select>
                <Select><SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger><SelectContent><SelectItem value="us">United States</SelectItem><SelectItem value="uk">United Kingdom</SelectItem></SelectContent></Select>
                <Input placeholder="Funding Amount" />
              </div>
            )}
            {activeTab === 'partnership' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select><SelectTrigger><SelectValue placeholder="Partnership Type" /></SelectTrigger><SelectContent><SelectItem value="strategic">Strategic</SelectItem><SelectItem value="distribution">Distribution</SelectItem></SelectContent></Select>
                <Select><SelectTrigger><SelectValue placeholder="Industry" /></SelectTrigger><SelectContent><SelectItem value="saas">SaaS</SelectItem><SelectItem value="agency">Agency</SelectItem></SelectContent></Select>
                <Select><SelectTrigger><SelectValue placeholder="Company Size" /></SelectTrigger><SelectContent><SelectItem value="small">1-50 employees</SelectItem><SelectItem value="medium">51-200 employees</SelectItem></SelectContent></Select>
              </div>
            )}
            {activeTab === 'investor' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select><SelectTrigger><SelectValue placeholder="Investor Type" /></SelectTrigger><SelectContent><SelectItem value="vc">Venture Capital</SelectItem><SelectItem value="angel">Angel Investor</SelectItem></SelectContent></Select>
                <Input placeholder="Industry Focus" />
                <Select><SelectTrigger><SelectValue placeholder="Stage" /></SelectTrigger><SelectContent><SelectItem value="seed">Seed</SelectItem><SelectItem value="series-a">Series A</SelectItem></SelectContent></Select>
                <Select><SelectTrigger><SelectValue placeholder="Geography" /></SelectTrigger><SelectContent><SelectItem value="us">United States</SelectItem><SelectItem value="global">Global</SelectItem></SelectContent></Select>
              </div>
            )}
            <Button onClick={handleSearch} disabled={loading} className="mt-6 w-full md:w-auto">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />} Search
            </Button>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>Found {results.length} opportunities.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full max-w-full overflow-x-auto">
                <Table className="[&>div]:max-w-full">
                  <TableHeader>
                    <TableRow>
                      {activeTab === 'local' && <><TableHead>Business Name</TableHead><TableHead>Location</TableHead><TableHead>Category</TableHead><TableHead>Phone</TableHead></>}
                      {activeTab === 'tender' && <><TableHead>Title</TableHead><TableHead>Organization</TableHead><TableHead>Value</TableHead><TableHead>Deadline</TableHead></>}
                      {activeTab === 'grant' && <><TableHead>Grant Title</TableHead><TableHead>Funder</TableHead><TableHead>Amount</TableHead><TableHead>Deadline</TableHead></>}
                      {activeTab === 'partnership' && <><TableHead>Company</TableHead><TableHead>Industry</TableHead><TableHead>Size</TableHead><TableHead>Potential Score</TableHead></>}
                      {activeTab === 'investor' && <><TableHead>Investor Name</TableHead><TableHead>Focus</TableHead><TableHead>Stage</TableHead><TableHead>Location</TableHead></>}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((r, i) => (
                      <TableRow key={i}>
                        {activeTab === 'local' && <><TableCell className="font-medium">{r.name}</TableCell><TableCell>{r.location}</TableCell><TableCell>{r.category}</TableCell><TableCell>{r.phone}</TableCell></>}
                        {activeTab === 'tender' && <><TableCell className="font-medium">{r.title}</TableCell><TableCell>{r.org}</TableCell><TableCell>{r.value}</TableCell><TableCell>{r.deadline}</TableCell></>}
                        {activeTab === 'grant' && <><TableCell className="font-medium">{r.title}</TableCell><TableCell>{r.funder}</TableCell><TableCell>{r.amount}</TableCell><TableCell>{r.deadline}</TableCell></>}
                        {activeTab === 'partnership' && <><TableCell className="font-medium">{r.company}</TableCell><TableCell>{r.industry}</TableCell><TableCell>{r.size}</TableCell><TableCell><Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">{r.score}</Badge></TableCell></>}
                        {activeTab === 'investor' && <><TableCell className="font-medium">{r.name}</TableCell><TableCell>{r.focus}</TableCell><TableCell>{r.stage}</TableCell><TableCell>{r.location}</TableCell></>}
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10" onClick={() => toast.success('Added to CRM')} type="button">Add to CRM</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </Tabs>
    </div>
  );
}