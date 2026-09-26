import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';
import { getInvitationByToken, acceptInvitation, declineInvitation, InvitationError } from '@/lib/enterpriseApi';
import type { OrganizationInvitation } from '@/types/enterprise';
import { Mail, Building2, CalendarClock, CheckCircle2, XCircle, Loader2, LogOut, UserCircle, ArrowLeft, UserPlus } from 'lucide-react';
import { format } from 'date-fns';

function normalizeEmail(email?: string | null): string {
  return (email || '').replace(/[\u200B-\u200D\uFEFF\u0000-\u001F\u007F]/g, '').trim().toLowerCase();
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const maskedLocal = local.length > 2 ? `${local.slice(0, 2)}***` : '***';
  return `${maskedLocal}@${domain}`;
}

export default function AcceptInvitationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { refreshTeams } = useTeam();

  const token = searchParams.get('token') || '';
  const action = searchParams.get('action') || '';

  const [invitation, setInvitation] = useState<OrganizationInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [loadError, setLoadError] = useState<{ message: string; code?: string } | null>(null);

  const currentUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.pathname}${window.location.search}`;
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    getInvitationByToken(token)
      .then((inv) => {
        setInvitation(inv);
        setLoadError(null);
      })
      .catch((err: unknown) => {
        const invitationErr = err instanceof InvitationError ? err : null;
        const message = invitationErr?.message || (err instanceof Error ? err.message : 'Invalid invitation');
        const code = invitationErr?.code;
        setLoadError({ message, code });
        console.error('[accept invitation] load error', { token, code, message });
      })
      .finally(() => setLoading(false));
  }, [token]);

  const invitedEmail = normalizeEmail(invitation?.email);
  const currentEmail = normalizeEmail(user?.email);
  const isSignedOut = !user;
  const isEmailMismatch = !!user && !!invitedEmail && currentEmail !== invitedEmail;
  const canAccept = !!user && !!invitedEmail && currentEmail === invitedEmail && invitation?.status !== 'accepted';
  const alreadyJoined = invitation?.status === 'accepted';

  const handleAccept = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const result = await acceptInvitation(token);
      toast.success(result.already_joined ? 'You have already joined this organization' : 'You have joined the organization');
      await refreshTeams();
      if (result.organization_id) {
        navigate(`/organizations/${result.organization_id}`);
      } else {
        navigate('/organizations');
      }
    } catch (err: unknown) {
      const invitationErr = err instanceof InvitationError ? err : null;
      const code = invitationErr?.code;
      if (code === 'email_mismatch') {
        const details = invitationErr?.details;
        toast.error(
          `This invitation was sent to ${maskEmail(String(details?.invitation_email || invitation?.email || ''))}, but you are signed in as ${maskEmail(String(details?.authenticated_email || user?.email || ''))}.`
        );
      } else {
        const message = invitationErr?.message || (err instanceof Error ? err.message : 'Failed to accept invitation');
        toast.error(message);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    setProcessing(true);
    try {
      await declineInvitation(token);
      toast.success('Invitation declined');
      setSearchParams({ token, action: 'declined' });
      setInvitation((prev) => (prev ? { ...prev, status: 'declined' } : prev));
    } catch (err: any) {
      toast.error(err.message || 'Failed to decline invitation');
    } finally {
      setProcessing(false);
    }
  };

  const goToLogin = () => {
    navigate(`/login?returnTo=${encodeURIComponent(currentUrl)}`);
  };

  const goToSignup = () => {
    navigate(`/signup?invitation_token=${encodeURIComponent(token)}&returnTo=${encodeURIComponent(currentUrl)}`);
  };

  const switchAccount = async () => {
    await signOut();
    goToLogin();
  };

  const returnToDashboard = () => {
    navigate('/');
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <CardTitle>Invitation missing</CardTitle>
            <CardDescription>The invitation link is invalid or has expired.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md p-6 space-y-4">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-10 w-full" />
        </Card>
      </div>
    );
  }

  if (action === 'declined') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <CardTitle>Invitation declined</CardTitle>
            <CardDescription>You have declined this invitation.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={returnToDashboard}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadError) {
    const title =
      loadError.code === 'invitation_revoked'
        ? 'Invitation revoked'
        : loadError.code === 'invitation_expired'
        ? 'Invitation expired'
        : loadError.code === 'invitation_declined'
        ? 'Invitation declined'
        : 'Invitation no longer valid';
    const description =
      loadError.code === 'invitation_revoked'
        ? 'This invitation has been revoked by the organization.'
        : loadError.code === 'invitation_expired'
        ? 'This invitation has expired. Ask the organization admin for a new invitation.'
        : loadError.code === 'invitation_declined'
        ? 'This invitation has already been declined.'
        : loadError.message || 'This invitation is invalid, revoked, expired, or has already been accepted.';
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={returnToDashboard}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <CardTitle>Invitation no longer valid</CardTitle>
            <CardDescription>This invitation has been revoked, expired, or is invalid.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            {invitation.org_logo_url ? (
              <img src={invitation.org_logo_url} alt={invitation.org_name} className="h-10 w-10 object-contain rounded" />
            ) : (
              <Building2 className="h-6 w-6 text-primary" />
            )}
            <div>
              <CardTitle className="text-xl">Join {invitation.org_name}</CardTitle>
              <CardDescription>Invitation from {invitation.inviter_name || invitation.inviter_email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{invitation.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">{invitation.role.replace(/_/g, ' ')}</Badge>
              {invitation.department_name && <Badge variant="outline">{invitation.department_name}</Badge>}
              {invitation.team_name && <Badge variant="outline">{invitation.team_name}</Badge>}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              <span>Expires {format(new Date(invitation.expires_at), 'PPP')}</span>
            </div>
          </div>

          {invitation.message && (
            <div className="p-3 bg-muted rounded-md text-sm italic">&ldquo;{invitation.message}&rdquo;</div>
          )}

          {alreadyJoined && (
            <div className="p-4 rounded-lg bg-muted text-sm">
              <p className="font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                You have already joined this organization.
              </p>
            </div>
          )}

          {isSignedOut && (
            <div className="p-4 rounded-lg bg-muted text-sm space-y-2">
              <p className="font-medium">This invitation was sent to {maskEmail(invitation.email)}</p>
              <p className="text-muted-foreground">Sign in with that account to accept, or create a new account using the same email.</p>
            </div>
          )}

          {isEmailMismatch && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-sm space-y-3">
              <p className="font-medium">Account mismatch</p>
              <p className="text-muted-foreground">
                This invitation was sent to <strong>{maskEmail(invitation.email)}</strong>, but you are signed in as{' '}
                <strong>{maskEmail(user?.email || '')}</strong>.
              </p>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" onClick={switchAccount} className="justify-start">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out and use the invited account
                </Button>
                <Button variant="ghost" size="sm" onClick={returnToDashboard} className="justify-start">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return to dashboard
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {canAccept && (
              <Button onClick={handleAccept} disabled={processing}>
                {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Accept and join organization
              </Button>
            )}

            {alreadyJoined && (
              <Button onClick={returnToDashboard} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to dashboard
              </Button>
            )}

            {isSignedOut && (
              <>
                <Button onClick={goToLogin} variant="outline" disabled={processing}>
                  <UserCircle className="h-4 w-4 mr-2" />
                  Sign in to accept
                </Button>
                <Button onClick={goToSignup} variant="outline" disabled={processing}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create an account
                </Button>
              </>
            )}

            {!alreadyJoined && (
              <Button variant="outline" onClick={handleDecline} disabled={processing}>
                <XCircle className="h-4 w-4 mr-2" />
                Decline invitation
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
