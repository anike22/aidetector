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
  LogOut, User, LayoutDashboard, PenSquare, FileSearch, Shield, FileText, CheckCircle2, Link as LinkIcon, Briefcase, Mail, Search, Target, Globe, Code, Lock, Settings, Sparkles, Building2, FolderOpen, Bell, Activity, Gift, Award, TrendingUp, UserPlus, Percent, Puzzle, Store, Webhook, Handshake, GraduationCap, ClipboardList, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { NotificationBell } from '@/components/lifecycle/NotificationBell';
import { navStructure, directLinks, matchRoute, getFilteredNavStructure } from '@/components/layouts/navData';
import { MobileNavDrawer } from '@/components/layouts/MobileNavDrawer';
import { LiveUsagePanel } from '@/components/common/LiveUsagePanel';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { isFeatureVisible: checkFeatureVisible } = useFeatureFlags();

  const filteredNavStructure = getFilteredNavStructure((href, surface) => checkFeatureVisible(href, surface));

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
      className={`sticky top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-md border-b border-border shadow-sm py-2'
          : 'bg-background border-b border-transparent py-3 sm:py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 w-full">
        <div className="flex items-center justify-between gap-2 md:gap-4 min-w-0">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-all"></div>
              <img 
                src="/brand/aidetector-icon.png" 
                alt="Logo" 
                className="relative w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-xl shadow-sm border border-border bg-background"
              />
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight hidden sm:block text-foreground">
              AIDetector<span className="text-primary">.cx</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-1">
            {filteredNavStructure.map((group) => {
              const isGroupActive = group.items.some(item => isActive(item.href));
              const hasSubcategories = group.subcategories && group.subcategories.length > 0;

              return (
                <DropdownMenu key={group.title}>
                  <DropdownMenuTrigger
                    className={`flex items-center gap-1 px-2.5 py-2 text-sm font-medium rounded-md transition-colors outline-none data-[state=open]:bg-muted/60 data-[state=open]:text-foreground ${
                      isGroupActive
                        ? 'text-primary bg-primary/10 font-semibold'
                        : 'text-foreground/80 hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {group.title} <ChevronDown className="w-3.5 h-3.5 opacity-60 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent
                    align="center"
                    sideOffset={8}
                    className={`${
                      hasSubcategories ? 'w-[640px] max-w-[calc(100vw-2rem)] p-4' : 'w-[360px] max-w-[calc(100vw-2rem)] p-2'
                    } rounded-2xl shadow-xl border-border/60 bg-background/95 backdrop-blur-md`}
                  >
                    {hasSubcategories ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {group.subcategories!.map((sub) => (
                            <div key={sub.title} className="space-y-1">
                              <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                {sub.title}
                              </div>
                              <div className="space-y-0.5">
                                {sub.items.map((link) => {
                                  const IconComponent = link.icon;
                                  const itemActive = isActive(link.href);
                                  return (
                                    <DropdownMenuItem key={link.href} asChild className="cursor-pointer focus:bg-muted/60 rounded-xl p-0">
                                      <Link
                                        to={link.href}
                                        className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                                          itemActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                                        }`}
                                      >
                                        <div className={`mt-0.5 p-2 rounded-lg shrink-0 ${
                                          itemActive ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                                        }`}>
                                          <IconComponent className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                          <div className={`font-semibold text-sm ${itemActive ? 'text-primary' : 'text-foreground'}`}>
                                            {link.label}
                                          </div>
                                          <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                            {link.desc}
                                          </div>
                                        </div>
                                      </Link>
                                    </DropdownMenuItem>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>

                        {group.viewAllLink && (
                          <div className="pt-2 border-t border-border/50 flex items-center justify-between px-2">
                            <span className="text-xs text-muted-foreground">Explore the complete collection</span>
                            <Link
                              to={group.viewAllLink.href}
                              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                            >
                              {group.viewAllLink.label} <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-1">
                        {group.items.map((link) => {
                          const IconComponent = link.icon;
                          const itemActive = isActive(link.href);
                          return (
                            <DropdownMenuItem key={link.href} asChild className="cursor-pointer focus:bg-muted/60 rounded-xl">
                              <Link
                                to={link.href}
                                className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                                  itemActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                                }`}
                              >
                                <div className="mt-0.5 p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                                  <IconComponent className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-sm text-foreground">{link.label}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">{link.desc}</div>
                                </div>
                              </Link>
                            </DropdownMenuItem>
                          );
                        })}
                        {group.viewAllLink && (
                          <div className="pt-2 border-t border-border/50 flex items-center justify-between px-2 mt-1">
                            <Link
                              to={group.viewAllLink.href}
                              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 ml-auto"
                            >
                              {group.viewAllLink.label} <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })}
            
            {directLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-2.5 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive(link.href)
                    ? 'text-primary bg-primary/10 font-semibold'
                    : 'text-foreground/80 hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions & Dynamic Indicator */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <LiveUsagePanel compact={true} />
            {user && <NotificationBell />}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-1.5 text-foreground/80 hover:text-foreground rounded-full pl-1.5 pr-3 h-8 sm:h-9 border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all text-xs sm:text-sm">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-primary flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {initials}
                    </div>
                    <span className="max-w-[90px] sm:max-w-[120px] truncate font-medium text-xs sm:text-sm">{displayName}</span>
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
                    <Link to="/verified-authorship/profile" className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" /> Author Profile & Attestation
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer">
                    <Link to="/authorship/dashboard" className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-500" /> Authorship Dashboard
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
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="font-medium text-foreground/80 hover:text-foreground text-xs sm:text-sm px-2.5 sm:px-3 h-8 sm:h-9">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="font-semibold shadow-hover bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9">
                    Start Free
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile / Tablet Collapsible Menu Toggle */}
            <MobileNavDrawer
              mobileOpen={mobileOpen}
              setMobileOpen={setMobileOpen}
              handleSignOut={handleSignOut}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
