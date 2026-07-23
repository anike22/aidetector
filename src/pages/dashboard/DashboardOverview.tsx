import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { loadReports } from '@/pages/detector/detectionEngine';
import { 
  Bot, Wand2, Search, FileText, LayoutTemplate, Monitor,
  Video, Image as ImageIcon, Mic, Edit3, Chrome, Settings,
  BarChart, Target, Link as LinkIcon, MapPin, SearchCheck,
  CheckCircle2, Circle, ArrowRight, TrendingUp, Users, HelpCircle,
  MessageSquare, Share2, Zap, MonitorPlay
} from 'lucide-react';

export default function DashboardOverview({ handleNavigate }: { handleNavigate: (section: any) => void }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    humanizations: 0,
    detectorChecks: 0,
    documents: 0,
    seoReports: 0
  });
  
  const [activities, setActivities] = useState<any[]>([]);
  const reports = loadReports();
  
  useEffect(() => {
    if (!user) return;
    
    // Load Activities
    supabase.from('user_activities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }: { data: any }) => {
        if (data) setActivities(data);
      });
      
    // Load Usage Stats
    supabase.from('humanizer_usage').select('used_count').eq('user_id', user.id).maybeSingle().then(({data}) => {
      if (data) setStats(s => ({ ...s, humanizations: data.used_count }));
    });
    
  }, [user]);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const firstName = displayName.split(' ')[0];
  const currentPlanId = profile?.subscription_plan || 'free';
  const isPaid = currentPlanId === 'pro' || currentPlanId === 'business' || currentPlanId === 'enterprise';
  const isAdmin = profile?.role === 'admin';

  // Calculate checklist progress
  const checksComplete = activities.some(a => a.tool_used === 'detector');
  const humanizeComplete = activities.some(a => a.tool_used === 'humanizer');
  const seoComplete = activities.some(a => a.tool_used === 'seo');
  const reportComplete = reports.length > 0;
  const profileComplete = !!profile?.full_name;
  
  const checklist = [
    { id: 'check', label: 'First AI check', done: checksComplete, link: '/detector' },
    { id: 'humanize', label: 'Humanize text', done: humanizeComplete, link: '/humanizer' },
    { id: 'seo', label: 'Use SEO Assistant', done: seoComplete, link: '/seo-assistant' },
    { id: 'report', label: 'Save report', done: reportComplete, link: '/detector' },
    { id: 'profile', label: 'Complete profile', done: profileComplete, onClick: () => handleNavigate('settings') },
  ];
  const completedCount = checklist.filter(c => c.done).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* HERO SECTION */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border p-6 rounded-xl shadow-premium">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-navy">Welcome, {firstName} 👋</h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 uppercase tracking-wider text-xs">
              {currentPlanId} Plan
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl text-pretty">
            Detect AI content, humanize text, optimize SEO, and grow your business.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Button variant="outline" onClick={() => handleNavigate('subscription')}>Manage Subscription</Button>
          {!isPaid && <Button className="bg-primary text-primary-foreground" onClick={() => navigate('/pricing')}>Upgrade Plan</Button>}
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section>
        <h2 className="text-lg font-bold text-navy mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer shadow-premium border-border/50 rounded-2xl bg-card" onClick={() => navigate('/detector')}>
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-navy">AI Detector</h3>
                <p className="text-xs text-muted-foreground mt-1">Scan text for AI generation</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:border-primary/50 transition-colors cursor-pointer shadow-premium border-border/50 rounded-2xl bg-card" onClick={() => navigate('/humanizer')}>
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center shrink-0">
                <Wand2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-navy">Humanizer</h3>
                <p className="text-xs text-muted-foreground mt-1">Bypass AI detectors</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer shadow-premium border-border/50 rounded-2xl bg-card" onClick={() => navigate('/seo-assistant')}>
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-info" />
              </div>
              <div>
                <h3 className="font-semibold text-navy">SEO Assistant</h3>
                <p className="text-xs text-muted-foreground mt-1">Optimize your content</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer shadow-premium border-border/50 rounded-2xl bg-card" onClick={() => navigate('/plagiarism')}>
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-navy">Plagiarism Checker</h3>
                <p className="text-xs text-muted-foreground mt-1">Check for originality</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer shadow-premium border-border/50 rounded-2xl bg-card" onClick={() => handleNavigate('content-studio')}>
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center shrink-0">
                <Edit3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-navy">Content Studio</h3>
                <p className="text-xs text-muted-foreground mt-1">Draft and create</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/50 transition-colors cursor-pointer shadow-premium border-border/50 rounded-2xl bg-card" onClick={() => navigate('/services/website-development')}>
            <CardContent className="p-5 flex items-start gap-4">
              <div className="w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center shrink-0">
                <MonitorPlay className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-navy">Website Development</h3>
                <p className="text-xs text-muted-foreground mt-1">Build a high-converting site</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* EXPLORE MORE TOOLS */}
      <section>
        <h2 className="text-lg font-bold text-navy mb-4">Explore Premium Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'AI Video Detector', icon: Video, desc: 'Detect deepfakes and AI video content', locked: !isPaid && !isAdmin, link: '/detector' },
            { name: 'Deepfake Image', icon: ImageIcon, desc: 'Analyze images for AI manipulation', locked: !isPaid && !isAdmin, link: '/detector' },
            { name: 'AI Voice Detector', icon: Mic, desc: 'Scan audio for synthetic voices', locked: !isPaid && !isAdmin, link: '/detector' },
            { name: 'Writing Monitor', icon: Monitor, desc: 'Real-time writing analysis', locked: !isPaid && !isAdmin, link: '/detector' },
            { name: 'Chrome Extension', icon: Chrome, desc: 'Detect AI anywhere on the web', locked: false, link: '/chrome-extension' },
            { name: 'WordPress Plugin', icon: LayoutTemplate, desc: 'Integrate tools into your blog', locked: false, link: '/wordpress-plugin' },
          ].map((tool, i) => {
            const Icon = tool.icon;
            return (
              <Card key={i} className="flex flex-col h-full">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="w-8 h-8 bg-muted rounded-md flex items-center justify-center">
                      <Icon className="w-4 h-4 text-foreground/70" />
                    </div>
                    {tool.locked && <Badge variant="outline" className="text-[10px] uppercase text-muted-foreground">Pro</Badge>}
                  </div>
                  <CardTitle className="text-base mt-3">{tool.name}</CardTitle>
                  <CardDescription className="text-xs">{tool.desc}</CardDescription>
                </CardHeader>
                <div className="flex-1" />
                <CardFooter className="p-4 pt-0">
                  {tool.locked ? (
                    <Button variant="outline" className="w-full h-8 text-xs" onClick={() => navigate('/pricing')}>Unlock Pro</Button>
                  ) : (
                    <Button variant="ghost" className="w-full h-8 text-xs text-primary hover:bg-primary/10" onClick={() => navigate(tool.link)}>Launch Tool <ArrowRight className="w-3 h-3 ml-2" /></Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {/* DASHBOARD 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COL: Stats & Activity */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* USAGE OVERVIEW */}
          <Card className="shadow-premium border-border/50 rounded-2xl bg-card">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold">Usage Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col p-3 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground mb-1">AI Checks</span>
                <span className="text-2xl font-bold text-navy">{stats.detectorChecks}</span>
              </div>
              <div className="flex flex-col p-3 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground mb-1">Humanizations</span>
                <span className="text-2xl font-bold text-navy">{stats.humanizations}</span>
              </div>
              <div className="flex flex-col p-3 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground mb-1">SEO Reports</span>
                <span className="text-2xl font-bold text-navy">{stats.seoReports}</span>
              </div>
              <div className="flex flex-col p-3 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground mb-1">Saved Reports</span>
                <span className="text-2xl font-bold text-navy">{reports.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* RECENT ACTIVITY */}
          <Card className="flex-1">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">No activity yet</h3>
                  <p className="text-xs text-muted-foreground mb-4">Start using our tools to see your history here.</p>
                  <Button size="sm" onClick={() => navigate('/detector')}>Run First AI Detection</Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {activities.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Zap className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 border-b pb-4">
                        <p className="text-sm font-medium capitalize text-navy">{item.tool_used} Tool Used</p>
                        <p className="text-xs text-muted-foreground">Status: {item.status} &bull; {new Date(item.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* REFERRAL SYSTEM */}
          <Card className="shadow-premium border-border/50 rounded-2xl bg-card">
            <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="font-bold text-navy mb-1">Invite Friends & Earn Rewards</h3>
                <p className="text-sm text-muted-foreground mb-3 text-pretty">Share your referral link and get 50 free AI checks for every friend who signs up.</p>
                <div className="flex gap-2 max-w-sm mx-auto md:mx-0">
                  <div className="flex-1 bg-muted rounded-md px-3 py-2 text-xs font-mono truncate border border-border">
                    https://aidetector.cx/ref/{user?.id?.substring(0,8) || 'user'}
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText(`https://aidetector.cx/ref/${user?.id?.substring(0,8) || 'user'}`)}>Copy Link</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COL: Checklist, Upgrade, CTAs */}
        <div className="flex flex-col gap-6">
          
          {/* GETTING STARTED CHECKLIST */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Getting Started</CardTitle>
              <div className="flex items-center gap-3 mt-2">
                <Progress value={progressPercent} className="h-2 flex-1" />
                <span className="text-xs font-bold text-primary">{progressPercent}%</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 flex flex-col gap-3">
              {checklist.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  {item.done ? (
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                  {item.link ? (
                    <Link to={item.link} className={`text-sm hover:underline ${item.done ? 'text-muted-foreground line-through' : 'text-navy font-medium'}`}>
                      {item.label}
                    </Link>
                  ) : (
                    <button onClick={item.onClick} className={`text-sm hover:underline text-left ${item.done ? 'text-muted-foreground line-through' : 'text-navy font-medium'}`}>
                      {item.label}
                    </button>
                  )}
                </div>
              ))}
              {progressPercent === 100 && (
                <div className="mt-2 p-3 bg-success/10 text-success rounded-lg text-sm text-center font-medium border border-success/20">
                  🎉 You're all set up!
                </div>
              )}
            </CardContent>
          </Card>

          {/* UPGRADE AREA */}
          {!isPaid && (
            <Card className="border-primary shadow-premium bg-gradient-to-br from-card to-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-primary">Unlock Premium Features</CardTitle>
                <CardDescription>Upgrade to get unlimited access.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <ul className="space-y-2 mb-4">
                  {['Unlimited Humanizations', 'AI Video & Voice Detector', 'Full SEO Suite', 'Chrome Extension & Plugin'].map((b, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" /> {b}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-2">
                  <Button className="w-full bg-primary" onClick={() => navigate('/pricing')}>Upgrade to Pro</Button>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/pricing')}>View Business Plan</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SERVICES CTA */}
          <Card className="bg-navy text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <MonitorPlay className="w-24 h-24" />
            </div>
            <CardContent className="p-6 relative z-10">
              <Badge className="bg-card/20 hover:bg-card/30 text-white mb-3 border-none">Expert Services</Badge>
              <h3 className="font-bold text-lg mb-2">Need a High-Converting Website?</h3>
              <p className="text-white/80 text-sm mb-4 text-pretty">
                Our expert team builds SEO-optimized, fast, and beautiful websites tailored for your business.
              </p>
              <Button className="w-full bg-card text-navy hover:bg-card/90" onClick={() => navigate('/services/website-development')}>
                Request Website
              </Button>
            </CardContent>
          </Card>

          {/* INTEGRATIONS */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer shadow-premium border-border/50 rounded-2xl bg-card" onClick={() => navigate('/chrome-extension')}>
              <CardContent className="p-4 text-center">
                <Chrome className="w-8 h-8 text-primary mx-auto mb-2" />
                <h4 className="text-sm font-semibold">Chrome Extension</h4>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer shadow-premium border-border/50 rounded-2xl bg-card" onClick={() => navigate('/wordpress-plugin')}>
              <CardContent className="p-4 text-center">
                <LayoutTemplate className="w-8 h-8 text-primary mx-auto mb-2" />
                <h4 className="text-sm font-semibold">WP Plugin</h4>
              </CardContent>
            </Card>
          </div>

          {/* SUPPORT */}
          <Card className="shadow-premium border-border/50 rounded-2xl bg-card">
            <CardContent className="p-4">
              <h4 className="text-sm font-bold text-navy mb-3">Support Center</h4>
              <div className="flex flex-col gap-2">
                <Button variant="ghost" className="justify-start h-8 px-2 text-sm text-muted-foreground hover:text-navy" onClick={() => navigate('/help')}>
                  <HelpCircle className="w-4 h-4 mr-2" /> Documentation
                </Button>
                <Button variant="ghost" className="justify-start h-8 px-2 text-sm text-muted-foreground hover:text-navy" onClick={() => navigate('/services/website-development/book-meeting')}>
                  <MessageSquare className="w-4 h-4 mr-2" /> Book a Meeting
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}