import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
  LogOut, User, LayoutDashboard, PenSquare, FileSearch, Shield, FileText, CheckCircle2, Link as LinkIcon, Briefcase, Mail, Search, Target, Globe, Code, Lock, Settings, Sparkles, Building2, FolderOpen, Bell, Activity, Gift, Award, TrendingUp, UserPlus, Percent, Puzzle, Store, Webhook, Handshake, GraduationCap, ClipboardList
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { NotificationBell } from '@/components/lifecycle/NotificationBell';
import { navStructure, directLinks, matchRoute } from '@/components/layouts/navData';
import { MobileNavDrawer } from '@/components/layouts/MobileNavDrawer';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string) => matchRoute(href, location.pathname);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully.');
    navigate('/');
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Account';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header
      className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-md border-b border-border shadow-sm py-2'
          : 'bg-background border-b border-transparent py-4'
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
            {navStructure.map((group) => (
              <DropdownMenu key={group.title}>
                <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors text-foreground/80 hover:text-foreground hover:bg-muted/50 outline-none data-[state=open]:bg-muted/50 data-[state=open]:text-foreground">
                  {group.title} <ChevronDown className="w-3 h-3 opacity-50" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-[340px] p-2 rounded-xl shadow-premium border-border/50">
                  <div className="grid grid-cols-1 gap-1">
                    {group.items.map(link => (
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
            ))}
            
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
            {user && <NotificationBell />}
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
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/essay-studio" className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-primary" /> Essay Studio
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/essay-studio/teacher/assignments" className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-muted-foreground" /> Teacher Mode
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/organizations" className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" /> Organizations
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/reports/shared" className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-muted-foreground" /> Shared Reports
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/notifications" className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-muted-foreground" /> Notifications
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/activity" className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-muted-foreground" /> Activity Feed
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/referrals" className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-muted-foreground" /> Referrals
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/affiliates/dashboard" className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-muted-foreground" /> Affiliate Program
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/partner" className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" /> Partner Portal
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/rewards" className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-muted-foreground" /> Rewards
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/security" className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-muted-foreground" /> Security Center
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/partner/apply" className="flex items-center gap-2">
                      <Handshake className="w-4 h-4 text-muted-foreground" /> Partner Application
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/webhooks" className="flex items-center gap-2">
                      <Webhook className="w-4 h-4 text-muted-foreground" /> Webhooks
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
                        <Link to="/admin/enterprise" className="flex items-center gap-2 text-primary focus:text-primary">
                          <Building2 className="w-4 h-4" /> Enterprise Admin
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin/email" className="flex items-center gap-2 text-primary focus:text-primary">
                          <Mail className="w-4 h-4" /> Email Settings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin/customer-intelligence" className="flex items-center gap-2 text-primary focus:text-primary">
                          <Users className="w-4 h-4" /> Customer Intelligence
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin/automation" className="flex items-center gap-2 text-primary focus:text-primary">
                          <Bot className="w-4 h-4" /> Automation Center
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin/automation/logs" className="flex items-center gap-2 text-primary focus:text-primary">
                          <FileText className="w-4 h-4" /> Automation Logs
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin/automation/analytics" className="flex items-center gap-2 text-primary focus:text-primary">
                          <BarChart2 className="w-4 h-4" /> Automation Analytics
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin/personalization" className="flex items-center gap-2 text-primary focus:text-primary">
                          <Sparkles className="w-4 h-4" /> AI Personalization
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin/referrals" className="flex items-center gap-2 text-primary focus:text-primary">
                          <LinkIcon className="w-4 h-4" /> Referrals
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin/affiliates" className="flex items-center gap-2 text-primary focus:text-primary">
                          <UserPlus className="w-4 h-4" /> Affiliates
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin/commissions" className="flex items-center gap-2 text-primary focus:text-primary">
                          <Percent className="w-4 h-4" /> Commissions
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin/rewards" className="flex items-center gap-2 text-primary focus:text-primary">
                          <Gift className="w-4 h-4" /> Rewards
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin/fraud" className="flex items-center gap-2 text-primary focus:text-primary">
                          <Shield className="w-4 h-4" /> Fraud Review
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin/payouts" className="flex items-center gap-2 text-primary focus:text-primary">
                          <TrendingUp className="w-4 h-4" /> Payouts
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin/referral-analytics" className="flex items-center gap-2 text-primary focus:text-primary">
                          <BarChart2 className="w-4 h-4" /> Referral Analytics
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin/marketing-assets" className="flex items-center gap-2 text-primary focus:text-primary">
                          <FileText className="w-4 h-4" /> Marketing Assets
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin/security" className="flex items-center gap-2 text-primary focus:text-primary">
                          <Shield className="w-4 h-4" /> Security Center
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin/incidents" className="flex items-center gap-2 text-primary focus:text-primary">
                          <Shield className="w-4 h-4" /> Incidents
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin/compliance" className="flex items-center gap-2 text-primary focus:text-primary">
                          <CheckCircle2 className="w-4 h-4" /> Compliance
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin/privacy-requests" className="flex items-center gap-2 text-primary focus:text-primary">
                          <Lock className="w-4 h-4" /> Privacy Requests
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin/marketplace" className="flex items-center gap-2 text-primary focus:text-primary">
                          <Store className="w-4 h-4" /> Marketplace
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin/integrations" className="flex items-center gap-2 text-primary focus:text-primary">
                          <Puzzle className="w-4 h-4" /> Integrations
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin/webhooks" className="flex items-center gap-2 text-primary focus:text-primary">
                          <Webhook className="w-4 h-4" /> Webhooks
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                        <Link to="/admin/partner-applications" className="flex items-center gap-2 text-primary focus:text-primary">
                          <Handshake className="w-4 h-4" /> Partner Apps
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/settings/preferences" className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-muted-foreground" /> Communication Preferences
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/account/privacy" className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-muted-foreground" /> Privacy Controls
                    </Link>
                  </DropdownMenuItem>
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
          <MobileNavDrawer
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
            handleSignOut={handleSignOut}
          />
        </div>
      </div>
    </header>
  );
}
