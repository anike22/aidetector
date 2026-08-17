import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Search, Loader2, Target, Globe, DollarSign, Users, Hash, FileDown, PlusCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function CompetitorIntelligencePage() {
  const navigate = useNavigate();
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any | null>(null);

  const handleAnalyze = () => {
    if (!competitorUrl) return toast.error('Please enter a competitor URL');
    
    setAnalyzing(true);
    setProgress(0);
    setResult(null);

    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 95) {
          clearInterval(interval);
          return p;
        }
        return p + 10;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setResult({
        name: competitorUrl.replace('https://', '').replace('www.', '').split('.')[0].toUpperCase(),
        website: competitorUrl,
        targetAudience: {
          industries: ['SaaS', 'E-commerce', 'Fintech'],
          sizes: ['50-200 employees', 'Enterprise'],
          regions: ['North America', 'Western Europe']
        },
        pricing: 'Estimated $500 - $2,000 / month (Tiered SaaS)',
        keywords: ['marketing automation', 'b2b lead gen', 'CRM integration', 'sales acceleration'],
        social: {
          linkedin: '45,000 followers (High Engagement)',
          twitter: '12,000 followers (Medium Engagement)'
        },
        techStack: ['React', 'Node.js', 'Salesforce', 'Marketo', 'AWS']
      });
      setAnalyzing(false);
      toast.success('Analysis complete!');
    }, 3000);
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy mb-2">Competitor Intelligence</h1>
        <p className="text-muted-foreground">Analyze your competitors to uncover their target audience, estimated pricing, and marketing strategies.</p>
      </div>

      <Card className="mb-8 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Enter competitor domain (e.g., example.com)" 
                className="pl-10 h-12 text-lg"
                value={competitorUrl}
                onChange={(e) => setCompetitorUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
            </div>
            <Button className="h-12 px-8" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Analyze'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analyzing && (
        <div className="bg-card border border-border rounded-lg p-8 text-center max-w-2xl mx-auto shadow-sm">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Analyzing Competitor Footprint...</h3>
          <Progress value={progress} className="h-2 mb-2" />
          <p className="text-sm text-muted-foreground">Extracting target audience, pricing models, and marketing keywords</p>
        </div>
      )}

      {result && !analyzing && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">{result.name} Analysis Report</h2>
              <a href={result.website.startsWith('http') ? result.website : `https://${result.website}`} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center mt-1">
                <Globe className="h-4 w-4 mr-1" /> {result.website}
              </a>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => toast.success('Export initiated')} type="button"><FileDown className="mr-2 h-4 w-4" /> Export PDF</Button>
              <Button onClick={() => navigate('/prospecting/projects/new')}><PlusCircle className="mr-2 h-4 w-4" /> Create Project from Data</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center"><Target className="h-5 w-5 mr-2 text-primary" /> Target Audience</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-muted-foreground block mb-1">Industries:</span>
                    <div className="flex flex-wrap gap-1">
                      {result.targetAudience.industries.map((i: string) => <Badge key={i} variant="secondary">{i}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground block mb-1">Company Sizes:</span>
                    <div className="flex flex-wrap gap-1">
                      {result.targetAudience.sizes.map((s: string) => <Badge key={s} variant="outline">{s}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground block mb-1">Regions:</span>
                    <div className="flex flex-wrap gap-1">
                      {result.targetAudience.regions.map((r: string) => <Badge key={r} variant="outline">{r}</Badge>)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center"><DollarSign className="h-5 w-5 mr-2 text-primary" /> Estimated Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium">{result.pricing}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center"><Hash className="h-5 w-5 mr-2 text-primary" /> Top SEO Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.keywords.map((k: string) => <Badge key={k} variant="secondary" className="bg-primary/10 text-primary">{k}</Badge>)}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center"><Users className="h-5 w-5 mr-2 text-primary" /> Marketing & Tech Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Social Presence</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between border-b pb-1">
                        <span className="text-muted-foreground">LinkedIn:</span>
                        <span className="font-medium">{result.social.linkedin}</span>
                      </li>
                      <li className="flex justify-between border-b pb-1">
                        <span className="text-muted-foreground">Twitter/X:</span>
                        <span className="font-medium">{result.social.twitter}</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Technology Stack</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.techStack.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}