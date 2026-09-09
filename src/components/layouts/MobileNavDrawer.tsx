import { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { useLifecycle } from '@/contexts/LifecycleContext';
import { useTeam } from '@/contexts/TeamContext';
import { navStructure, directLinks, mobileAuthGroups, NavGroup, findParentGroupIdByPath, matchRoute, getFilteredNavStructure } from '@/components/layouts/navData';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import type { Organization } from '@/types/team';
import {
  Menu, X, LogOut, Search, FileSearch, FileEdit, DollarSign,
  Key, Zap, Check, ChevronDown, Code, ArrowRight,
} from 'lucide-react';

interface MobileNavDrawerProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  handleSignOut: () => void;
}

const quickActions = [
  { label: 'Detect AI', href: '/detector', icon: Search },
  { label: 'SEO Assistant', href: '/seo-assistant', icon: FileSearch },
  { label: 'SEO Content Studio', href: '/content-studio', icon: FileEdit },
  { label: 'Pricing', href: '/pricing', icon: DollarSign },
  { label: 'Generate API Key', href: '/api', icon: Key },
];

export function MobileNavDrawer({ mobileOpen, setMobileOpen, handleSignOut }: MobileNavDrawerProps) {
  const { user, profile } = useAuth();
  const { usageStats, unreadNotifications } = useLifecycle();
  const { organizations, currentOrganization, setCurrentOrganization, refreshTeams, organizationMembers } = useTeam();
  const location = useLocation();
  const navigate = useNavigate();
  const { isFeatureVisible: checkFeatureVisible } = useFeatureFlags();

  const filteredNavStructure = useMemo(() => {
    return getFilteredNavStructure((href, surface) => checkFeatureVisible(href, surface));
  }, [checkFeatureVisible]);

  const activeParentId = useMemo(() => findParentGroupIdByPath(location.pathname), [location.pathname]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    () => (activeParentId ? new Set([activeParentId]) : new Set())
  );

  useEffect(() => {
    if (activeParentId) {
      setExpandedSections((prev) => {
        if (prev.has(activeParentId)) return prev;
        return new Set(prev).add(activeParentId);
      });
    }
  }, [activeParentId]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [mobileOpen]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const plan = (profile?.subscription_plan || 'free').toLowerCase();
  const isPaid = plan !== 'free';
  const isEnterprise = plan === 'enterprise';
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Account';
  const initials = displayName.slice(0, 2).toUpperCase();

  const scansUsed = usageStats?.ai_scans ?? 0;
  const apiUsed = usageStats?.api_requests ?? 0;
  const isRouteActive = (href: string) => matchRoute(href, location.pathname);

  const handleOrganizationClick = async (org: Organization) => {
    setMobileOpen(false);
    await setCurrentOrganization(org);
    await refreshTeams();
    navigate(`/organizations/${org.id}`);
  };

  const orgSwitcher = useMemo(() => {
    if (organizations.length === 0) return null;
    return (
      <div className="px-2">
        <p className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Organization</p>
        <div className="space-y-1">
          {organizations.map((org) => (
            <button
              key={org.id}
              type="button"
              onClick={() => handleOrganizationClick(org)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                {org.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="min-w-0 flex-1 truncate text-left">{org.name}</span>
              {currentOrganization?.id === org.id && <Check className="h-4 w-4 text-accent" />}
            </button>
          ))}
        </div>
      </div>
    );
  }, [organizations, currentOrganization, handleOrganizationClick]);

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="xl:hidden h-8 w-8 sm:h-9 sm:w-9 shrink-0" aria-label="Open navigation menu">
          <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-[20rem] bg-background/95 backdrop-blur-xl border-l border-border p-0 sm:max-w-[22rem]">
        <div className="flex h-full flex-col" role="navigation" aria-label="Mobile navigation">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 p-4">
            <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
              <img
                src="/brand/aidetector-icon.png"
                alt="AIDetector.cx logo"
                className="h-7 w-7 rounded-lg"
              />
              <span className="text-lg font-bold text-foreground">AIDetector<span className="text-primary">.cx</span></span>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close navigation menu">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Profile card */}
            {user && (
              <div className="border-b border-border/50 p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {plan} Plan
                  </Badge>
                  {isPaid && (
                    <Badge variant="outline" className="border-success/30 bg-success/10 text-success text-xs">
                      Active
                    </Badge>
                  )}
                </div>
                {isEnterprise && currentOrganization && (
                  <p className="mt-2 truncate text-xs text-muted-foreground">
                    {currentOrganization.name} · {organizationMembers.length} seats used
                  </p>
                )}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>AI scans used</span>
                    <span>{scansUsed}</span>
                  </div>
                  {isPaid && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>API requests</span>
                      <span>{apiUsed}</span>
                    </div>
                  )}
                </div>
                <Button
                  className="mt-3 w-full"
                  variant={isPaid ? 'outline' : 'default'}
                  size="sm"
                  asChild
                  onClick={() => setMobileOpen(false)}
                >
                  <Link to="/pricing">
                    {isPaid ? 'Manage Subscription' : 'Upgrade to Pro'}
                  </Link>
                </Button>
              </div>
            )}

            {/* Main navigation groups */}
            <div className="border-b border-border/50 p-2">
              {filteredNavStructure.map((group) => (
                <CollapsibleNavGroup
                  key={group.id}
                  group={group}
                  items={group.items}
                  expanded={expandedSections}
                  toggle={toggleSection}
                  active={isRouteActive}
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
              <div className="mt-1 space-y-1 px-2">
                {directLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isRouteActive(link.href)
                        ? 'bg-accent/10 text-accent'
                        : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {link.icon && <link.icon className="h-4 w-4 shrink-0" />}
                    <span className="min-w-0 flex-1 truncate">{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            {user && (
              <div className="border-b border-border/50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => (
                    <Link
                      key={action.label}
                      to={action.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex flex-col items-start gap-2 rounded-lg border border-border bg-card p-3 text-sm font-medium text-foreground transition-colors hover:border-accent hover:bg-accent/5"
                    >
                      <action.icon className="h-4 w-4 text-accent" />
                      <span className="leading-tight">{action.label}</span>
                    </Link>
                  ))}
                  {!isPaid && (
                    <Link
                      to="/pricing"
                      onClick={() => setMobileOpen(false)}
                      className="flex flex-col items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
                    >
                      <Zap className="h-4 w-4" />
                      <span className="leading-tight">Upgrade</span>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Upgrade card for free users */}
            {user && !isPaid && (
              <div className="border-y border-border/50 p-4">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-foreground">Upgrade to Pro</p>
                  <ul className="mt-2 space-y-1.5">
                    <UpgradeFeature text="AI Humanizer" />
                    <UpgradeFeature text="AI Image Detector" />
                    <UpgradeFeature text="Plagiarism Checker" />
                    <UpgradeFeature text="Hallucination Detector" />
                    <UpgradeFeature text="Citation Verifier" />
                    <UpgradeFeature text="Unlimited AI Detector" />
                    <UpgradeFeature text="Developer API" />
                  </ul>
                  <Button className="mt-3 w-full" size="sm" asChild onClick={() => setMobileOpen(false)}>
                    <Link to="/pricing">Upgrade Now</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Authenticated group navigation */}
            {user && (
              <div className="space-y-2 p-2 pb-4">
                {mobileAuthGroups.map((group) => (
                  <CollapsibleNavGroup
                    key={group.id}
                    group={group}
                    items={group.items}
                    expanded={expandedSections}
                    toggle={toggleSection}
                    active={isRouteActive}
                    onNavigate={() => setMobileOpen(false)}
                    badgeCount={group.id === 'workspace' ? unreadNotifications : undefined}
                  />
                ))}
                {orgSwitcher}
              </div>
            )}
          </div>

          {/* Footer / session */}
          <div className="border-t border-border/50 p-4">
            {user ? (
              <Button
                variant="outline"
                className="w-full justify-start gap-2 font-medium"
                onClick={() => { setMobileOpen(false); handleSignOut(); }}
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full font-medium">Sign In</Button>
                </Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full font-medium">Get Started Free</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function UpgradeFeature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-xs text-muted-foreground">
      <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
      <span>{text}</span>
    </li>
  );
}

function CollapsibleNavGroup({
  group,
  items,
  expanded,
  toggle,
  active,
  onNavigate,
  badgeCount,
}: {
  group: NavGroup;
  items: { label: string; href: string; icon: typeof Code; desc?: string }[];
  expanded: Set<string>;
  toggle: (id: string) => void;
  active: (href: string) => boolean;
  onNavigate: () => void;
  badgeCount?: number;
}) {
  const isExpanded = expanded.has(group.id);
  const Icon = group.icon;
  const panelId = `mobile-nav-${group.id}`;

  // Parent route is active if any child is active.
  const isActive = items.some((i) => active(i.href));

  return (
    <Collapsible open={isExpanded} onOpenChange={() => toggle(group.id)}>
      <CollapsibleTrigger
        id={`mobile-nav-trigger-${group.id}`}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        data-active={isActive}
        className={`flex w-full min-h-[2.75rem] items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-colors ${
          isActive
            ? 'bg-accent/10 text-accent'
            : 'text-foreground hover:bg-muted'
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left">{group.title}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </CollapsibleTrigger>
      <CollapsibleContent id={panelId}>
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-1 pb-2 pl-2 pr-2">
                {group.subcategories && group.subcategories.length > 0 ? (
                  group.subcategories.map((sub) => (
                    <div key={sub.title} className="pt-2 first:pt-0">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {sub.title}
                      </div>
                      {sub.items.map((item) => {
                        const isItemActive = active(item.href);
                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={onNavigate}
                            aria-current={isItemActive ? 'page' : undefined}
                            className={`flex min-h-[2.75rem] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                              isItemActive
                                ? 'bg-accent text-accent-foreground font-semibold'
                                : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                            }`}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ))
                ) : (
                  items.map((item) => {
                    const isItemActive = active(item.href);
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={onNavigate}
                        aria-current={isItemActive ? 'page' : undefined}
                        className={`flex min-h-[2.75rem] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          isItemActive
                            ? 'bg-accent text-accent-foreground font-semibold'
                            : 'text-foreground/80 hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {group.id === 'workspace' && item.label === 'Notifications' && badgeCount ? (
                          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground">
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })
                )}
                {group.viewAllLink && (
                  <div className="pt-2 border-t border-border/40 mt-1">
                    <Link
                      to={group.viewAllLink.href}
                      onClick={onNavigate}
                      className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>{group.viewAllLink.label}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CollapsibleContent>
    </Collapsible>
  );
}
