import { seoApi } from '@/lib/api/seo';

/**
 * Retrieves the saved website/domain for the user's SEO project.
 * Checks local storage cache first, then queries the user's SEO projects in Supabase.
 */
export function getStoredSEOProjectDomain(): string {
  try {
    // 1. Direct explicit domain storage
    const directDomain = localStorage.getItem('seo_project_domain') || localStorage.getItem('user_website_domain');
    if (directDomain && typeof directDomain === 'string' && directDomain.trim()) {
      return directDomain.trim();
    }

    // 2. Active project object in localStorage
    const activeProjectKeys = ['seo_active_project', 'current_seo_project', 'selected_seo_project'];
    for (const key of activeProjectKeys) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.domain && typeof parsed.domain === 'string' && parsed.domain.trim()) {
            return parsed.domain.trim();
          }
        } catch {}
      }
    }

    // 3. Check blogger session
    const sessionRaw = localStorage.getItem('aidetector_blogger_session');
    if (sessionRaw) {
      try {
        const parsed = JSON.parse(sessionRaw);
        const domain = parsed?.domain || parsed?.internalLinkDomain || parsed?.website;
        if (domain && typeof domain === 'string' && domain.trim()) {
          return domain.trim();
        }
      } catch {}
    }

    // 4. Check drafts
    const draftKeys = ['aidetector_blogger_draft', 'seo_assistant_draft'];
    for (const key of draftKeys) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const domain = parsed?.internalLinkDomain || parsed?.domain || parsed?.website;
          if (domain && typeof domain === 'string' && domain.trim()) {
            return domain.trim();
          }
        } catch {}
      }
    }
  } catch (e) {
    console.warn('Error reading stored SEO project domain:', e);
  }
  return '';
}

/**
 * Resolves the saved SEO project domain asynchronously.
 * Falls back to checking Supabase seo_projects table if not found in local storage.
 */
export async function resolveSavedSEOProjectDomain(): Promise<string> {
  const local = getStoredSEOProjectDomain();
  if (local) return local;

  try {
    const projects = await seoApi.getProjects();
    if (projects && projects.length > 0) {
      const active = projects.find(p => p.status === 'Active') || projects[0];
      if (active?.domain && typeof active.domain === 'string' && active.domain.trim()) {
        const trimmed = active.domain.trim();
        // Cache for faster subsequent access
        try {
          localStorage.setItem('seo_project_domain', trimmed);
        } catch {}
        return trimmed;
      }
    }
  } catch {
    // Network/auth failure or guest mode: silently continue
  }

  return '';
}

/**
 * Saves or updates the user's SEO project domain in local storage.
 */
export function persistSEOProjectDomain(domain: string): void {
  if (!domain || typeof domain !== 'string') return;
  const cleaned = domain.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase();
  if (!cleaned) return;
  try {
    localStorage.setItem('seo_project_domain', cleaned);
  } catch {}
}

export interface SaveDomainProjectResult {
  success: boolean;
  projectName: string;
  projectId?: string;
  domain: string;
  message: string;
  createdNew?: boolean;
}

/**
 * Saves the given domain directly into the user's active SEO project settings in Supabase.
 * If no project exists yet, it creates a default active SEO project for the user.
 */
export async function saveDomainToActiveSEOProject(rawDomain: string): Promise<SaveDomainProjectResult> {
  const domain = (rawDomain || '').trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase();
  if (!domain) {
    return {
      success: false,
      projectName: '',
      domain: '',
      message: 'Please enter a valid website domain.',
    };
  }

  // 1. Immediately persist locally
  persistSEOProjectDomain(domain);

  try {
    const projects = await seoApi.getProjects();
    if (projects && projects.length > 0) {
      // Find active project or use most recently updated project
      const active = projects.find(p => p.status === 'Active') || projects[0];
      const activeId = active.project_id || (active as any).id;
      const updated = await seoApi.updateProject(activeId, {
        domain,
        updated_at: new Date().toISOString(),
      });

      const pName = updated?.project_name || (updated as any)?.name || active.project_name || (active as any).name || 'Active Project';
      const pId = updated?.project_id || (updated as any)?.id || activeId;
      const updatedProj = updated || { ...active, domain, project_name: pName, project_id: pId };

      try {
        localStorage.setItem('seo_active_project', JSON.stringify(updatedProj));
      } catch {}

      return {
        success: true,
        projectName: pName,
        projectId: pId,
        domain,
        message: `Saved domain "${domain}" to active SEO project "${pName}".`,
      };
    } else {
      // Create new project with this domain
      const newProj = await seoApi.createProject({
        project_name: domain.charAt(0).toUpperCase() + domain.slice(1),
        domain,
        status: 'Active',
        competitors: [],
      });

      const pName = newProj.project_name || (newProj as any).name || 'Active Project';
      const pId = newProj.project_id || (newProj as any).id;

      try {
        localStorage.setItem('seo_active_project', JSON.stringify(newProj));
      } catch {}

      return {
        success: true,
        projectName: pName,
        projectId: pId,
        domain,
        createdNew: true,
        message: `Created active SEO project "${pName}" with domain "${domain}".`,
      };
    }
  } catch (err: any) {
    // If user is guest/offline or DB permission error, still keep locally stored
    try {
      const activeCachedRaw = localStorage.getItem('seo_active_project');
      if (activeCachedRaw) {
        const parsed = JSON.parse(activeCachedRaw);
        parsed.domain = domain;
        localStorage.setItem('seo_active_project', JSON.stringify(parsed));
      } else {
        localStorage.setItem('seo_active_project', JSON.stringify({
          project_name: 'Local Website Project',
          domain,
          status: 'Active',
        }));
      }
    } catch {}

    return {
      success: true,
      projectName: 'Local SEO Project',
      domain,
      message: `Saved domain "${domain}" into your active project settings.`,
    };
  }
}

/**
 * Gets the active SEO project details if available.
 */
export async function getActiveSEOProjectSummary(): Promise<{ projectName: string; domain: string; projectId?: string } | null> {
  try {
    const raw = localStorage.getItem('seo_active_project');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.domain) {
        return {
          projectName: parsed.project_name || parsed.name || 'Active Project',
          domain: parsed.domain,
          projectId: parsed.project_id || parsed.id,
        };
      }
    }

    const projects = await seoApi.getProjects();
    if (projects && projects.length > 0) {
      const active = projects.find(p => p.status === 'Active') || projects[0];
      return {
        projectName: active.project_name || (active as any).name || 'Active Project',
        domain: active.domain,
        projectId: active.project_id || (active as any).id,
      };
    }
  } catch {}

  const domain = getStoredSEOProjectDomain();
  if (domain) {
    return {
      projectName: 'Active Project',
      domain,
    };
  }

  return null;
}
