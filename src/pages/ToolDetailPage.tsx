import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, ArrowRight, ExternalLink, CheckCircle2, XCircle, Bookmark, Share2, ThumbsUp } from 'lucide-react';
import { AI_TOOLS } from '@/data/siteData';

const toolDetails = {
  overview: `This powerful AI tool revolutionizes how professionals handle their daily workflows. With state-of-the-art machine learning capabilities and an intuitive interface, it helps teams and individuals achieve more in less time. Trusted by over 1 million users worldwide, it has become an essential part of the modern professional's toolkit.`,
  features: [
    'Advanced natural language understanding',
    'Multi-modal capabilities (text, image, code)',
    'API integration for developers',
    'Team collaboration features',
    'Real-time suggestions and corrections',
    'Custom model fine-tuning',
    'SOC 2 Type II certified',
    '99.9% uptime SLA',
  ],
  pros: [
    'Best-in-class accuracy and performance',
    'Intuitive and beginner-friendly interface',
    'Extensive API and integration options',
    'Regular feature updates and improvements',
    'Strong community and documentation',
  ],
  cons: [
    'Can be expensive for high-volume usage',
    'Occasional slowdowns during peak hours',
    'Some advanced features require learning curve',
    'No offline mode available',
  ],
  useCases: [
    { title: 'Content Creation', desc: 'Generate blog posts, social media content, and marketing copy at scale.' },
    { title: 'Code Assistance', desc: 'Debug code, generate boilerplate, and get code review suggestions.' },
    { title: 'Data Analysis', desc: 'Analyze datasets, generate insights, and create data visualizations.' },
    { title: 'Customer Support', desc: 'Power chatbots and automated response systems for customer inquiries.' },
  ],
  reviews: [
    {
      id: 1,
      author: 'Sarah M.',
      role: 'Content Manager',
      rating: 5,
      date: 'May 15, 2026',
      comment: 'This tool completely transformed our content workflow. We now produce 3x more content in half the time. Absolutely essential for any content team.',
      helpful: 42,
    },
    {
      id: 2,
      author: 'James R.',
      role: 'Software Developer',
      rating: 4,
      date: 'May 8, 2026',
      comment: 'Great for code completion and debugging. Sometimes the suggestions miss context but overall it saves me 2+ hours daily.',
      helpful: 28,
    },
    {
      id: 3,
      author: 'Lisa K.',
      role: 'Marketing Director',
      rating: 5,
      date: 'April 29, 2026',
      comment: 'ROI has been incredible. Paid for itself in the first week. The API is clean and well-documented too.',
      helpful: 35,
    },
  ],
};

export default function ToolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const tool = AI_TOOLS.find((t) => t.id === id) || AI_TOOLS[0];
  const [activeTab, setActiveTab] = useState('overview');
  const [saved, setSaved] = useState(false);

  const relatedTools = AI_TOOLS.filter((t) => t.id !== tool.id && t.category === tool.category).slice(0, 3);

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Tool header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-3xl shrink-0 border border-border">
                {tool.logo}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-navy">{tool.name}</h1>
                  {tool.featured && (
                    <Badge className="bg-primary/10 text-primary border-primary/20">Featured</Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.floor(tool.rating) ? 'fill-warning text-warning' : 'text-muted'}`}
                      />
                    ))}
                    <span className="font-medium text-foreground ml-1">{tool.rating}</span>
                  </div>
                  <span>({tool.reviewCount.toLocaleString()} reviews)</span>
                  <Badge variant="outline" className="border-border">{tool.category}</Badge>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    tool.pricingType === 'free'
                      ? 'bg-success/10 text-success'
                      : tool.pricingType === 'freemium'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {tool.pricing}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted border border-border mb-6 flex-wrap h-auto">
                {['overview', 'features', 'pros-cons', 'use-cases', 'reviews'].map((tab) => (
                  <TabsTrigger key={tab} value={tab} className="text-xs capitalize">
                    {tab === 'pros-cons' ? 'Pros & Cons' : tab === 'use-cases' ? 'Use Cases' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="overview">
                <Card className="border-border shadow-card">
                  <CardContent className="p-6">
                    <p className="text-foreground/80 leading-relaxed text-pretty">{toolDetails.overview}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="features">
                <Card className="border-border shadow-card">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {toolDetails.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-3">
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                          <span className="text-sm text-foreground/80">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pros-cons">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Card className="border-success/20 bg-success/5 shadow-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-success">Pros</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 flex flex-col gap-2.5">
                      {toolDetails.pros.map((pro) => (
                        <div key={pro} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground/80 text-pretty">{pro}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card className="border-destructive/20 bg-destructive/5 shadow-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-destructive">Cons</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 flex flex-col gap-2.5">
                      {toolDetails.cons.map((con) => (
                        <div key={con} className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground/80 text-pretty">{con}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="use-cases">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {toolDetails.useCases.map((uc, i) => (
                    <Card key={uc.title} className="border-border shadow-card h-full">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <h3 className="font-semibold text-navy text-sm">{uc.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground text-pretty">{uc.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reviews">
                <div className="flex flex-col gap-4">
                  {toolDetails.reviews.map((review) => (
                    <Card key={review.id} className="border-border shadow-card">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="font-semibold text-navy text-sm">{review.author}</div>
                            <div className="text-xs text-muted-foreground">{review.role} · {review.date}</div>
                          </div>
                          <div className="flex gap-0.5 shrink-0">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-warning text-warning' : 'text-muted'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-foreground/80 text-pretty mb-3">{review.comment}</p>
                        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({review.helpful})
                        </button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sticky sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 flex flex-col gap-4">
              {/* CTA Card */}
              <Card className="border-border shadow-card">
                <CardContent className="p-5">
                  <div className="text-center mb-5">
                    <div className="text-3xl mb-2">{tool.logo}</div>
                    <h3 className="font-bold text-navy">{tool.name}</h3>
                    <p className="text-sm text-muted-foreground">{tool.pricing}</p>
                  </div>
                  <a href={tool.url} target="_blank" rel="noopener noreferrer">
                    <Button className="w-full h-10 bg-primary text-primary-foreground gap-2 mb-3" onClick={() => {}}>
                      <ExternalLink className="w-4 h-4" /> Visit Tool
                    </Button>
                  </a>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className={`flex-1 h-9 text-xs gap-1.5 border-border ${saved ? 'text-primary border-primary/40 bg-primary/5' : 'text-foreground/70 hover:text-foreground'}`}
                      onClick={() => setSaved(!saved)}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
                      {saved ? 'Saved' : 'Save'}
                    </Button>
                    <Button variant="outline" className="flex-1 h-9 text-xs gap-1.5 border-border text-foreground/70 hover:text-foreground" type="button" onClick={() => {}}>
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Alternatives */}
              {relatedTools.length > 0 && (
                <Card className="border-border shadow-card">
                  <CardHeader className="pb-3 border-b border-border">
                    <CardTitle className="text-sm font-semibold text-navy">Alternatives</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 flex flex-col gap-3">
                    {relatedTools.map((t) => (
                      <Link to={`/tools/${t.id}`} key={t.id} className="flex items-center gap-3 hover:bg-muted rounded-lg p-2 -mx-2 transition-colors">
                        <span className="text-xl shrink-0">{t.logo}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-navy truncate">{t.name}</div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-warning text-warning" />
                            <span className="text-xs text-muted-foreground">{t.rating}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      </Link>
                    ))}
                    <Link to="/tools">
                      <Button variant="ghost" size="sm" className="w-full h-8 text-xs text-primary hover:text-primary gap-1" onClick={() => {}}>
                        See all {tool.category} tools <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
