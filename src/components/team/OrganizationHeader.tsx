import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatBytes } from '@/lib/utils';
import type { OrganizationDashboardSummary } from '@/types/enterprise';
import {
  Building2,
  ChevronDown,
  CreditCard,
  Key,
  LayoutGrid,
  Plus,
  Settings,
  Shield,
  Users,
} from 'lucide-react';

interface OrganizationHeaderProps {
  organizationId: string;
  summary: OrganizationDashboardSummary | null;
  loading?: boolean;
}

export default function OrganizationHeader({ organizationId, summary, loading }: OrganizationHeaderProps) {
  const navigate = useNavigate();
  const org = summary?.organization;
  const owner = summary?.owner;

  const go = (tab: string) => {
    navigate(`/organizations/${organizationId}?tab=${tab}`);
  };

  if (loading || !summary) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-9 w-28" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 rounded-xl border">
              <AvatarImage src={org?.logo_url || undefined} alt={org?.name || 'Organization'} className="object-cover" />
              <AvatarFallback className="rounded-xl bg-primary text-primary-foreground text-lg">
                {org?.name?.charAt(0).toUpperCase() || <Building2 className="h-6 w-6" />}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight truncate">{org?.name}</h1>
                <Badge variant="secondary" className="capitalize">{org?.plan}</Badge>
                <Badge variant="outline" className="capitalize">{org?.status}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>Created {org?.created_at ? formatDate(org.created_at) : '—'}</span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  Owner:
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={owner?.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px]">{owner?.display_name?.charAt(0) || owner?.email?.charAt(0) || 'O'}</AvatarFallback>
                  </Avatar>
                  {owner?.display_name || owner?.email || '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 lg:justify-end">
            <div className="grid grid-cols-3 gap-4 min-w-[220px]">
              <Stat label="Members" value={`${summary.seats_used}/${summary.seats_total}`} icon={Users} />
              <Stat label="Storage" value={formatBytes(summary.storage_bytes)} icon={LayoutGrid} />
              <Stat label="Security" value={`${summary.security_score}/100`} icon={Shield} />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Quick actions
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => go('members')}>Invite member</DropdownMenuItem>
                <DropdownMenuItem onClick={() => go('workspaces')}>Create workspace</DropdownMenuItem>
                <DropdownMenuItem onClick={() => go('departments')}>Create department</DropdownMenuItem>
                <DropdownMenuItem onClick={() => go('teams')}>Create team</DropdownMenuItem>
                <DropdownMenuItem onClick={() => go('members')}>Assign roles</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => go('billing')}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Manage billing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go('audit')}>
                  <Shield className="h-4 w-4 mr-2" />
                  View audit logs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => go('api')}>
                  <Key className="h-4 w-4 mr-2" />
                  Generate API key
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => go('settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Organization settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}
