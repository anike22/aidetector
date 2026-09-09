import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Puzzle, Key, Users, Wand2, BookOpen, Shield, Webhook, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLifecycle } from '@/contexts/LifecycleContext';
import { useTeam } from '@/contexts/TeamContext';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  primary?: boolean;
}

export function SmartRecommendations({ embedded = false }: { embedded?: boolean }) {
  const { profile: authProfile } = useAuth();
  const { usageStats } = useLifecycle();
  const { organizationMembers } = useTeam();

  const plan = (authProfile?.subscription_plan || 'free').toLowerCase();

  const recommendations = useMemo<Recommendation[]>(() => {
    const usedTools = new Set<string>();
    if ((usageStats?.ai_scans ?? 0) > 0) usedTools.add('detector');
    if ((usageStats?.words_humanized ?? 0) > 0) usedTools.add('humanizer');
    if ((usageStats?.api_requests ?? 0) > 0) usedTools.add('api');
    if ((usageStats?.extension_usage ?? 0) > 0) usedTools.add('extension');

    const base: Recommendation[] = [];

    if (plan === 'free') {
      base.push({
        id: 'upgrade-to-pro',
        title: 'Upgrade to Pro',
        description: 'Unlock AI Humanizer, unlimited scans, and API access.',
        href: '/pricing',
        icon: Zap,
        primary: true,
      });
    }

    if (!usedTools.has('extension')) {
      base.push({
        id: 'install-extension',
        title: 'Install Chrome Extension',
        description: 'Analyze content directly in your browser.',
        href: '/chrome-extension',
        icon: Puzzle,
      });
    }

    if (usedTools.has('api')) {
      base.push({
        id: 'explore-api',
        title: 'Explore the API',
        description: 'Build integrations with our detection models.',
        href: '/developer',
        icon: Key,
      });
    } else if (plan !== 'free') {
      base.push({
        id: 'generate-api-key',
        title: 'Generate an API Key',
        description: 'Start building with the developer API.',
        href: '/api',
        icon: Key,
      });
    }

    if (['business', 'enterprise'].includes(plan) || organizationMembers.length > 1) {
      base.push({
        id: 'invite-teammates',
        title: 'Invite teammates',
        description: organizationMembers.length > 1 ? 'Grow your team to get more done.' : 'Collaborate on reports and workspaces.',
        href: '/organizations',
        icon: Users,
      });
    }

    if (plan === 'pro' || plan === 'business' || plan === 'enterprise') {
      if (usedTools.has('humanizer')) {
        base.push({
          id: 'advanced-humanizer',
          title: 'Try advanced Humanizer modes',
          description: 'Fine-tune tone, readability, and style.',
          href: '/humanizer',
          icon: Wand2,
        });
      }
    }

    if (plan === 'enterprise') {
      base.push({
        id: 'setup-sso',
        title: 'Set up SSO',
        description: 'Secure authentication for your organization.',
        href: '/security',
        icon: Shield,
      });
      base.push({
        id: 'configure-webhooks',
        title: 'Configure webhooks',
        description: 'Receive real-time events in your systems.',
        href: '/webhooks',
        icon: Webhook,
      });
    }

    base.push({
      id: 'read-guides',
      title: 'Read getting started guides',
      description: 'Learn best practices and advanced tips.',
      href: '/blog',
      icon: BookOpen,
    });

    return base.slice(0, 5);
  }, [plan, usageStats, organizationMembers.length]);

  return (
    <Card className={embedded ? 'border-0 shadow-none' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <CardTitle className="text-base md:text-lg">Recommended next steps</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          Personalized suggestions based on your plan and activity.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {recommendations.map((rec, idx) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.2 }}
          >
            <Link
              to={rec.href}
              className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-accent hover:bg-accent/5"
            >
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${rec.primary ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                <rec.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground group-hover:text-accent">
                  {rec.title}
                </p>
                <p className="text-xs text-muted-foreground">{rec.description}</p>
              </div>
              <Button size="sm" variant={rec.primary ? 'default' : 'outline'} className="h-8 shrink-0 text-xs">
                {rec.primary ? 'Upgrade' : 'Open'}
              </Button>
            </Link>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
