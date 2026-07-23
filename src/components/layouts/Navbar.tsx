import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Menu, X, Bot, ChevronDown, Zap, BookOpen, Users, ShoppingBag, BarChart2,
  LogOut, User, LayoutDashboard, PenSquare, FileSearch, Shield, FileText, CheckCircle2, Link as LinkIcon, Briefcase, Mail, Search, Target, Globe, Code
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from '@/db/supabase';

// Redesigned structured navigation
const navStructure = [
  {
    title: 'Products',
    items: [
      { label: 'AI Detector', href: '/detector', icon: BarChart2, desc: 'Enterprise-grade AI detection' },
      { label: 'AI Humanizer', href: '/humanizer', icon: User, desc: 'Bypass detection seamlessly' },
      { label: 'Plagiarism Checker', href: '/plagiarism-checker', icon: FileSearch, desc: 'Originality verification' },
      { label: 'SEO Assistant', href: '/seo-assistant', icon: FileText, desc: 'Optimize content for search' },
      { label: 'Content Studio', href: '/content-studio', icon: PenSquare, desc: 'All-in-one creation suite' },
    ]
  },
  {
    title: 'Extensions',
    items: [
      { label: 'Chrome Extension', href: '/chrome-extension', icon: Globe, desc: 'Detect AI anywhere' },
      { label: 'WordPress Plugin', href: '/wordpress-plugin', icon: LinkIcon, desc: 'Integrate into your CMS' },
      { label: 'Developer API', href: '/api', icon: Code, desc: 'Build with our detection models' },
    ]
  },
  {
    title: 'Solutions',
    items: [
      { label: 'SEO Intelligence', href: '/seo-dashboard', icon: Search, desc: 'Data-driven rankings' },
      { label: 'Technical SEO', href: '/technical-seo', icon: Zap, desc: 'Site structure auditing' },
      { label: 'Keyword Research', href: '/keyword-research', icon: Target, desc: 'Find winning terms' },
      { label: 'Link Building', href: '/link-building', icon: LinkIcon, desc: 'Earn quality backlinks' },
    ]
  },
  {
    title: 'Services',
    items: [
      { label: 'All Services', href: '/services', icon: Briefcase, desc: 'Overview of our agency services' },
      { label: 'SEO Consulting', href: '/services/seo-consulting', icon: Search, desc: 'Data-driven rankings strategy' },
      { label: 'AI Consulting', href: '/services/ai-consulting', icon: Bot, desc: 'Enterprise AI implementation' },
      { label: 'Website Development', href: '/services/website-development', icon: Code, desc: 'High-converting custom sites' },
      { label: 'Growth Marketing', href: '/services/growth-marketing', icon: BarChart2, desc: 'Scalable acquisition channels' },
    ]
  },
  {
    title: 'Resources',
    items: [
      { label: 'AI Tools Directory', href: '/tools', icon: Zap, desc: 'Curated list of top AI' },
      { label: 'Community', href: '/community', icon: Users, desc: 'Join 85K+ creators' },
      { label: 'Marketplace', href: '/marketplace', icon: ShoppingBag, desc: 'Buy and sell AI prompts' },
      { label: 'Blog', href: '/blog', icon: BookOpen, desc: 'Guides and insights' },
    ]
  }
];

const directLinks = [
  { label: 'Pricing', href: '/pricing' }
];

interface FeatureFlag {
  feature_slug: string;
  status: string;
  show_in_navigation: boolean;
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [features, setFeatures] = useState<FeatureFlag[]>([]);

  useEffect(() => {
    supabase.from('feature_flags').select('feature_slug, status, show_in_navigation').then(({ data }) => {
      if (data) setFeatures(data);
    });
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string) => location.pathname === href;

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully.');
    navigate('/');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Account';
  const initials = displayName.slice(0, 2).toUpperCase();

  const isVisible = (href: string) => {
    const slug = href.split('/')[1];
    const f = features.find(f => f.feature_slug === slug);
    if (!f) return true;
    if (f.status === 'hidden' || !f.show_in_navigation) return false;
    return true;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-md border-b border-border shadow-sm py-2'
          : 'bg-transparent border-b border-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-all"></div>
              <img 
                src="https://miaoda-site-img.s3cdn.medo.dev/app-icons/app_icon_128c0c18-8557-4863-9f08-5ec933ee3619.png" 
                alt="Logo" 
                className="relative w-9 h-9 object-contain rounded-xl shadow-sm border border-border bg-background"
              />
            </div>
            <span className="font-extrabold text-xl tracking-tight hidden sm:block text-foreground">
              AIDetector<span className="text-primary">.cx</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-2">
            {navStructure.map((group) => {
              const visibleItems = group.items.filter(i => isVisible(i.href));
              if (visibleItems.length === 0) return null;
              
              return (
                <DropdownMenu key={group.title}>
                  <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors text-foreground/80 hover:text-foreground hover:bg-muted/50 outline-none data-[state=open]:bg-muted/50 data-[state=open]:text-foreground">
                    {group.title} <ChevronDown className="w-3 h-3 opacity-50" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-[340px] p-2 rounded-xl shadow-premium border-border/50">
                    <div className="grid grid-cols-1 gap-1">
                      {visibleItems.map(link => (
                        <DropdownMenuItem key={link.href} asChild className="cursor-pointer focus:bg-muted/50 rounded-lg">
                          <Link to={link.href} className="flex items-start gap-3 p-3">
                            <div className="mt-0.5 p-2 bg-primary/10 rounded-lg text-primary"><link.icon className="w-4 h-4" /></div>
                            <div>
                              <div className="font-semibold text-sm text-foreground">{link.label}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{link.desc}</div>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })}
            
            {directLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(link.href)
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground/80 hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 text-foreground/80 hover:text-foreground rounded-full pl-2 pr-4 h-10 border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
                    <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {initials}
                    </div>
                    <span className="max-w-[120px] truncate font-medium text-sm">{displayName}</span>
                    <ChevronDown className="w-3 h-3 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-premium border-border/50 p-2">
                  <div className="px-2 py-2 mb-1 border-b border-border/50">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4 text-muted-foreground" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {profile?.role === 'admin' && (
                    <>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin" className="flex items-center gap-2 text-primary focus:text-primary">
                          <Shield className="w-4 h-4" /> Admin Panel
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin/email" className="flex items-center gap-2 text-primary focus:text-primary">
                          <Mail className="w-4 h-4" /> Email Settings
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg flex items-center gap-2 cursor-pointer"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="font-medium text-foreground/80 hover:text-foreground">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="font-semibold shadow-hover bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6">
                    Start Free
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-80 bg-background/95 backdrop-blur-xl border-l-0 p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                  <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                    <img 
                      src="https://miaoda-site-img.s3cdn.medo.dev/app-icons/app_icon_128c0c18-8557-4863-9f08-5ec933ee3619.png" 
                      alt="Logo" 
                      className="w-7 h-7 rounded-lg"
                    />
                    <span className="font-bold text-lg text-foreground">AIDetector<span className="text-primary">.cx</span></span>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {navStructure.map((group) => {
                    const visibleItems = group.items.filter(i => isVisible(i.href));
                    if (visibleItems.length === 0) return null;
                    return (
                      <Collapsible key={group.title} className="bg-muted/30 rounded-xl p-2 border border-border/50">
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 font-semibold text-foreground">
                          {group.title}
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-2 pb-2 space-y-1">
                          {visibleItems.map(link => (
                            <Link
                              key={link.href}
                              to={link.href}
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted text-sm text-foreground/80 hover:text-foreground font-medium transition-colors"
                            >
                              <link.icon className="w-4 h-4 text-primary" />
                              {link.label}
                            </Link>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                  
                  <div className="bg-muted/30 rounded-xl p-2 border border-border/50">
                    {directLinks.map(link => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="block p-3 rounded-lg hover:bg-muted text-sm text-foreground/80 hover:text-foreground font-semibold"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-background border-t border-border/50">
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm truncate">{displayName}</div>
                          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                        </div>
                      </div>
                      <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                        <Button className="w-full font-semibold rounded-xl bg-primary text-white">Dashboard</Button>
                      </Link>
                      <Button variant="outline" className="w-full font-semibold rounded-xl" onClick={() => { setMobileOpen(false); handleSignOut(); }}>
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link to="/login" onClick={() => setMobileOpen(false)}>
                        <Button variant="outline" className="w-full font-semibold rounded-xl">Sign In</Button>
                      </Link>
                      <Link to="/signup" onClick={() => setMobileOpen(false)}>
                        <Button className="w-full font-semibold rounded-xl bg-primary text-white shadow-hover">Get Started Free</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
