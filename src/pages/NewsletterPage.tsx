import { useState } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CheckCircle2, BookOpen, Users, Mail, ArrowRight, Clock, Sparkles } from 'lucide-react';

const editions = [
  {
    id: 1,
    title: 'AI Monetization Playbook: 7 Strategies That Work in 2026',
    date: 'May 26, 2026',
    readTime: '6 min read',
    preview: 'This week we dive into 7 proven ways founders are turning AI skills into sustainable income streams — from prompt marketplaces to AI consulting retainers.',
    tags: ['Monetization', 'AI Business'],
    opens: '48%',
  },
  {
    id: 2,
    title: 'The Automation Stack: Tools to Run Your Business on Autopilot',
    date: 'May 19, 2026',
    readTime: '7 min read',
    preview: 'We break down the exact automation stack used by 6-figure solopreneurs. Including n8n workflows, AI scheduling, and hands-off customer support.',
    tags: ['Automation', 'Tools'],
    opens: '52%',
  },
  {
    id: 3,
    title: 'SEO After AI: How to Rank When Everyone Uses ChatGPT',
    date: 'May 12, 2026',
    readTime: '8 min read',
    preview: 'With AI-generated content flooding search engines, traditional SEO strategies are shifting. Here is what actually works to rank in 2026.',
    tags: ['SEO', 'Marketing'],
    opens: '44%',
  },
  {
    id: 4,
    title: 'Building a $50K/Year AI Agency: The Complete Blueprint',
    date: 'May 5, 2026',
    readTime: '10 min read',
    preview: 'From finding your niche to closing enterprise clients — this is the exact roadmap used by our community members to build profitable AI agencies.',
    tags: ['Business', 'Startups'],
    opens: '61%',
  },
];

const benefits = [
  { icon: Sparkles, text: 'Curated AI tool recommendations every week' },
  { icon: BookOpen, text: 'In-depth business strategies and case studies' },
  { icon: TrendingUpIcon, text: 'Revenue-generating tactics you can apply immediately' },
  { icon: Users, text: 'Community highlights and success stories' },
];

function TrendingUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

export default function NewsletterPage() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Mail className="w-8 h-8 text-primary-foreground" />
          </div>
          <Badge variant="outline" className="mb-4 text-primary border-primary/30 bg-primary/5">Newsletter</Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-navy text-balance mb-4">
            The Weekly AI Business Brief
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl text-pretty max-w-xl mx-auto mb-3">
            The sharpest AI business insights delivered to your inbox every Monday morning.
          </p>
          <p className="text-muted-foreground text-sm mb-8">
            Join <span className="font-bold text-navy">28,400+</span> founders, creators, and marketers.
          </p>

          {/* Social proof */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-10">
            {[
              { value: '28,400+', label: 'Subscribers' },
              { value: '48%', label: 'Open Rate' },
              { value: '52', label: 'Editions Published' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-extrabold text-navy">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Signup form */}
          {subscribed ? (
            <div className="max-w-md mx-auto bg-success/10 border border-success/20 rounded-2xl p-6 text-center">
              <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
              <h3 className="font-bold text-navy text-lg mb-2">You're in! 🎉</h3>
              <p className="text-muted-foreground text-sm text-pretty">
                Welcome to the community. Check your inbox for a confirmation email and your free AI business toolkit.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 h-12 border-border text-base"
                />
                <Button type="submit" className="bg-primary text-primary-foreground h-12 px-6 shrink-0 font-semibold gap-2">
                  Subscribe <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                No spam ever. Unsubscribe anytime. Read our{' '}
                <span className="underline cursor-pointer hover:text-foreground">Privacy Policy</span>.
              </p>
            </form>
          )}
        </div>

        {/* What you'll get */}
        <div className="bg-secondary/50 rounded-2xl border border-border p-8 mb-14">
          <h2 className="text-xl font-bold text-navy text-center mb-6 text-balance">What's inside every edition</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.text} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-foreground/80 text-pretty">{benefit.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Latest Editions */}
        <div>
          <h2 className="text-2xl font-bold text-navy mb-6 text-balance">Recent Editions</h2>
          <div className="flex flex-col gap-4">
            {editions.map((edition) => (
              <Card key={edition.id} className="border-border shadow-card hover:shadow-hover transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {edition.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs text-muted-foreground border-border">{tag}</Badge>
                    ))}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                      <Clock className="w-3 h-3" />
                      {edition.readTime}
                    </div>
                  </div>
                  <h3 className="font-bold text-navy text-base text-balance mb-2">{edition.title}</h3>
                  <p className="text-sm text-muted-foreground text-pretty mb-3">{edition.preview}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{edition.date}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-success font-medium">{edition.opens} open rate</span>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-primary hover:text-primary gap-1" type="button" onClick={() => {}}>
                        Read <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
