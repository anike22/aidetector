import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, DollarSign, Link as LinkIcon, Award, ArrowRight, CheckCircle2, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AffiliateHubPage() {
  const [email, setEmail] = useState('');
  
  return (
    <div className="container mx-auto py-16 space-y-16">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto space-y-6">
        <Badge variant="outline" className="px-4 py-1 text-sm border-primary/30 text-primary bg-primary/5">
          Partner Program
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-navy">
          Promote AI & Growth Tools.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Earn 30% Recurring Commission.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Join our affiliate program and earn passive income by referring clients to our SaaS tools, consulting services, and premium resources.
        </p>
        
        <form className="max-w-md mx-auto flex gap-2 pt-4" onSubmit={e => { e.preventDefault(); /* submit */ }}>
          <Input 
            placeholder="Enter your email to join" 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 text-base"
          />
          <Button size="lg" type="submit" className="h-12 px-8">Join Now</Button>
        </form>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
        <Card className="border-none shadow-md bg-card/50">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <DollarSign className="w-6 h-6" />
            </div>
            <CardTitle>30% Recurring Commission</CardTitle>
            <CardDescription>
              Earn 30% on every subscription payment for the lifetime of the customer.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-none shadow-md bg-card/50">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <Award className="w-6 h-6" />
            </div>
            <CardTitle>High Conversion Rates</CardTitle>
            <CardDescription>
              Our optimized funnels and premium AI tools ensure your traffic converts at industry-leading rates.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-none shadow-md bg-card/50">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
              <Users className="w-6 h-6" />
            </div>
            <CardTitle>Dedicated Support</CardTitle>
            <CardDescription>
              Get access to affiliate managers, custom promo materials, and dedicated support to help you scale.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* How it works */}
      <section className="space-y-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-navy mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Start earning in three simple steps.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
          {/* Connector Line */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 -z-10" />
          
          {[
            { step: '01', title: 'Sign Up', desc: 'Join the program for free and get your unique tracking links.' },
            { step: '02', title: 'Promote', desc: 'Share your links via blog, social media, email, or video.' },
            { step: '03', title: 'Earn', desc: 'Get paid 30% monthly via PayPal or Stripe for every active user.' }
          ].map((item, i) => (
            <div key={i} className="bg-background rounded-xl p-6 text-center border border-border shadow-sm relative">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold absolute -top-5 left-1/2 -translate-x-1/2 border-4 border-background">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold mt-4 mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What to promote */}
      <section className="bg-muted/30 rounded-3xl p-8 md:p-12 space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-navy mb-4">What You Can Promote</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" /> AI SaaS Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-success mt-0.5 mr-2 shrink-0" /> <span className="text-sm">AI Content Detector & Humanizer</span></li>
                <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-success mt-0.5 mr-2 shrink-0" /> <span className="text-sm">Document Intelligence Suite</span></li>
                <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-success mt-0.5 mr-2 shrink-0" /> <span className="text-sm">Sales Prospecting Intelligence</span></li>
              </ul>
              <Button variant="link" className="px-0 mt-4 h-auto" asChild>
                <Link to="/pricing">View Pricing <ArrowRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> Services & Consulting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-success mt-0.5 mr-2 shrink-0" /> <span className="text-sm">Enterprise SEO Services</span></li>
                <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-success mt-0.5 mr-2 shrink-0" /> <span className="text-sm">AI Implementation Consulting</span></li>
                <li className="flex items-start"><CheckCircle2 className="w-4 h-4 text-success mt-0.5 mr-2 shrink-0" /> <span className="text-sm">Growth Marketing Packages</span></li>
              </ul>
              <Button variant="link" className="px-0 mt-4 h-auto" asChild>
                <Link to="/services">View Services <ArrowRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}