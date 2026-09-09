import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getMyOrganizations,
  getOrganization,
  getOrganizationWorkspaces,
  getWorkspace,
  getWorkspaceMembers,
  getOrganizationMembers,
  getOrganizationMembership,
  updateUserActiveOrganization,
  getUserActiveOrganization,
} from '@/lib/teamApi';
import type {
  Organization, Workspace, WorkspaceMember, OrganizationMember, OrganizationRole,
} from '@/types/team';

interface TeamContextValue {
  organizations: Organization[];
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization | null) => Promise<void>;
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (ws: Workspace | null) => Promise<void>;
  workspaceMembers: WorkspaceMember[];
  organizationMembers: OrganizationMember[];
  currentMembership: OrganizationMember | null;
  currentRole: OrganizationRole | null;
  currentPermissions: string[];
  refreshTeams: () => Promise<void>;
  loading: boolean;
}

const TeamContext = createContext<TeamContextValue | undefined>(undefined);

const ROLE_PERMISSIONS: Partial<Record<OrganizationRole, string[]>> = {
  owner: ['*'],
  super_admin: ['*'],
  admin: ['manage_organization', 'manage_members', 'manage_workspaces', 'manage_departments', 'manage_teams', 'manage_billing', 'manage_api', 'manage_security', 'view_audit', 'manage_settings'],
  manager: ['manage_members', 'manage_workspaces', 'manage_departments', 'manage_teams', 'view_billing'],
  team_lead: ['manage_team', 'view_workspace'],
  editor: ['edit_content', 'view_workspace'],
  reviewer: ['review_content', 'view_workspace'],
  analyst: ['view_analytics', 'view_workspace'],
  billing_manager: ['manage_billing', 'view_organization'],
  api_manager: ['manage_api', 'view_organization'],
  support: ['view_members', 'view_organization'],
  member: ['view_organization'],
  viewer: ['view_organization'],
  guest: ['view_assigned'],
};

export function TeamProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganizationState] = useState<Organization | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMember[]>([]);
  const [currentMembership, setCurrentMembership] = useState<OrganizationMember | null>(null);
  const [loading, setLoading] = useState(true);

  const setCurrentOrganization = useCallback(async (org: Organization | null) => {
    setCurrentOrganizationState(org);
    if (org) {
      const [wss, members, membership] = await Promise.all([
        getOrganizationWorkspaces(org.id),
        getOrganizationMembers(org.id),
        user ? getOrganizationMembership(org.id, user.id) : null,
      ]);
      setWorkspaces(wss);
      setOrganizationMembers(members);
      setCurrentMembership(membership);
      const ws = wss[0] || null;
      setCurrentWorkspaceState(ws);
      setWorkspaceMembers(ws ? await getWorkspaceMembers(ws.id) : []);
      await updateUserActiveOrganization(org.id, ws?.id ?? null);
    } else {
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
      setWorkspaceMembers([]);
      setOrganizationMembers([]);
      setCurrentMembership(null);
      await updateUserActiveOrganization(null, null);
    }
  }, [user]);

  const setCurrentWorkspace = useCallback(async (ws: Workspace | null) => {
    setCurrentWorkspaceState(ws);
    if (currentOrganization && ws) {
      await updateUserActiveOrganization(currentOrganization.id, ws.id);
    } else if (!currentOrganization && ws?.organization_id) {
      await updateUserActiveOrganization(ws.organization_id, ws.id);
    }
  }, [currentOrganization]);

  const refreshTeams = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrganizationState(null);
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
      setWorkspaceMembers([]);
      setOrganizationMembers([]);
      setCurrentMembership(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const orgs = await getMyOrganizations();
      setOrganizations(orgs);

      let activeOrgId: string | null = null;
      let activeWsId: string | null = null;
      const active = await getUserActiveOrganization(user.id);
      if (active) {
        activeOrgId = active.active_organization_id ?? null;
        activeWsId = active.active_workspace_id ?? null;
      }

      let org = orgs.find((o) => o.id === activeOrgId) || orgs[0] || null;
      if (org) {
        const full = await getOrganization(org.id);
        org = full || org;
      }
      setCurrentOrganizationState(org);

      if (org) {
        const [wss, orgMembers, membership] = await Promise.all([
          getOrganizationWorkspaces(org.id),
          getOrganizationMembers(org.id),
          getOrganizationMembership(org.id, user.id),
        ]);
        setWorkspaces(wss);
        setOrganizationMembers(orgMembers);
        setCurrentMembership(membership);

        const validWs = wss.find((w) => w.id === activeWsId);
        let ws = validWs || wss[0] || null;
        if (ws) {
          const fullWs = await getWorkspace(ws.id);
          ws = fullWs || ws;
          const members = await getWorkspaceMembers(ws.id);
          setWorkspaceMembers(members);
        } else {
          setWorkspaceMembers([]);
        }
        setCurrentWorkspaceState(ws);
      } else {
        setWorkspaces([]);
        setCurrentWorkspaceState(null);
        setWorkspaceMembers([]);
        setOrganizationMembers([]);
        setCurrentMembership(null);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshTeams();
  }, [refreshTeams]);

  useEffect(() => {
    if (currentWorkspace) {
      getWorkspaceMembers(currentWorkspace.id).then(setWorkspaceMembers).catch(() => {});
    }
  }, [currentWorkspace]);

  const currentRole = currentMembership?.role ?? null;
  const currentPermissions = currentRole ? (ROLE_PERMISSIONS[currentRole] ?? ['view_organization']) : [];

  return (
    <TeamContext.Provider
      value={{
        organizations,
        currentOrganization,
        setCurrentOrganization,
        workspaces,
        currentWorkspace,
        setCurrentWorkspace,
        workspaceMembers,
        organizationMembers,
        currentMembership,
        currentRole,
        currentPermissions,
        refreshTeams,
        loading,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within TeamProvider');
  return ctx;
}
