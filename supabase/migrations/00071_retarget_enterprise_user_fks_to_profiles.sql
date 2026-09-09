-- Retarget remaining Enterprise user FKs from auth.users to public.profiles for consistent relationship inference

-- organizations
ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_owner_id_fkey;
ALTER TABLE public.organizations ADD CONSTRAINT organizations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- organization_members
ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_invited_by_fkey;
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_suspended_by_fkey;
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_suspended_by_fkey FOREIGN KEY (suspended_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_removed_by_fkey;
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_removed_by_fkey FOREIGN KEY (removed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_transferred_from_fkey;
ALTER TABLE public.organization_members ADD CONSTRAINT organization_members_transferred_from_fkey FOREIGN KEY (transferred_from) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- workspace_members
ALTER TABLE public.workspace_members DROP CONSTRAINT IF EXISTS workspace_members_added_by_fkey;
ALTER TABLE public.workspace_members ADD CONSTRAINT workspace_members_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- departments
ALTER TABLE public.departments DROP CONSTRAINT IF EXISTS departments_manager_user_id_fkey;
ALTER TABLE public.departments ADD CONSTRAINT departments_manager_user_id_fkey FOREIGN KEY (manager_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- teams
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_lead_user_id_fkey;
ALTER TABLE public.teams ADD CONSTRAINT teams_lead_user_id_fkey FOREIGN KEY (lead_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- api_keys
ALTER TABLE public.api_keys DROP CONSTRAINT IF EXISTS api_keys_owner_user_id_fkey;
ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.api_keys DROP CONSTRAINT IF EXISTS api_keys_user_id_fkey;
ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- workspace_projects
ALTER TABLE public.workspace_projects DROP CONSTRAINT IF EXISTS workspace_projects_created_by_fkey;
ALTER TABLE public.workspace_projects ADD CONSTRAINT workspace_projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- workspace_documents
ALTER TABLE public.workspace_documents DROP CONSTRAINT IF EXISTS workspace_documents_created_by_fkey;
ALTER TABLE public.workspace_documents ADD CONSTRAINT workspace_documents_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.workspace_documents DROP CONSTRAINT IF EXISTS workspace_documents_updated_by_fkey;
ALTER TABLE public.workspace_documents ADD CONSTRAINT workspace_documents_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- workspace_folders
ALTER TABLE public.workspace_folders DROP CONSTRAINT IF EXISTS workspace_folders_created_by_fkey;
ALTER TABLE public.workspace_folders ADD CONSTRAINT workspace_folders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- collaboration_reports
ALTER TABLE public.collaboration_reports DROP CONSTRAINT IF EXISTS collaboration_reports_created_by_fkey;
ALTER TABLE public.collaboration_reports ADD CONSTRAINT collaboration_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;