import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePersonalization } from '@/contexts/PersonalizationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bot, Wand2, FileSearch, BarChart3, Zap, ArrowRight, Sparkles,
  GraduationCap, Code2, Briefcase, Building2, User
} from 'lucide-react';

export function PersonalizedHome() {
  const { user, profile: authProfile } = useAuth();
  const { profile, recommendations, loading } = usePersonalization();

  if (!user) return null;

  const displayName = authProfile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'there';
  const plan = authProfile?.subscription_plan || 'free';
  const org = profile?.organization_type || 'individual';
  const topRec = recommendations.filter((r) => !r.dismissed && !r.accepted).slice(0, 2);

  const planCta = plan === 'free'
    ? { label: 'Upgrade to Pro', to: '/pricing', icon: Zap }
    : plan === 'pro'
    ? { label: 'Explore API', to: '/api', icon: Code2 }
    : { label: 'Go to Dashboard', to: '/dashboard', icon: BarChart3 };

  const orgIcon: Record<string, React.ElementType> = {
    student: GraduationCap,
    teacher: GraduationCap,
    university: GraduationCap,
    developer: Code2,
    api_developer: Code2,
    business: Briefcase,
    enterprise: Building2,
    agency: Briefcase,
    content_creator: User,
    seo_professional: User,
    writer: User,
    journalist: User,
    individual: User,
  };
  const OrgIcon = orgIcon[org] || User;

  return (
    <section className="py-8 md:py-12 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Welcome back, {displayName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Here is everything tailored for your {org.replace('_', ' ')} workflow today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize">
              <OrgIcon className="h-3 w-3 mr-1" /> {org.replace('_', ' ')}
            </Badge>
            <Badge variant="outline" className="capitalize">{plan} plan</Badge>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Top recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topRec.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Keep using the tools to unlock personalized recommendations.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topRec.map((rec) => (
                      <div
                        key={rec.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium">{rec.title}</p>
                          <p className="text-xs text-muted-foreground">{rec.reason}</p>
                        </div>
                        {rec.context_path ? (
                          <Button size="sm" asChild>
                            <Link to={rec.context_path}>{rec.title} <ArrowRight className="h-3 w-3 ml-1" /></Link>
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <planCta.icon className="h-4 w-4 text-primary" /> Next step
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {plan === 'free'
                    ? 'Unlock unlimited scans and advanced reports.'
                    : plan === 'pro'
                    ? 'Integrate detection directly into your product.'
                    : 'Manage your team and usage from the dashboard.'}
                </p>
                <Button asChild className="w-full">
                  <Link to={planCta.to}>{planCta.label}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <QuickAction to="/detector" icon={Bot} label="AI Detector" />
          <QuickAction to="/humanizer" icon={Wand2} label="Humanizer" />
          <QuickAction to="/plagiarism-checker" icon={FileSearch} label="Plagiarism" />
          <QuickAction to="/insights" icon={BarChart3} label="Insights" />
        </div>
      </div>
    </section>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/40 transition-colors"
    >
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
