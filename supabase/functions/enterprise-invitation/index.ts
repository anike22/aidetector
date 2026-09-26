import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { createSystemNotification } from "../_shared/notifications.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const INVITATION_SECRET = Deno.env.get("INVITATION_JWT_SECRET") || SUPABASE_SERVICE_ROLE_KEY;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JwtPayload {
  org_id: string;
  email: string;
  role: string;
  department_id?: string;
  team_id?: string;
  workspace_id?: string;
  jti: string;
  iat: number;
  exp: number;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function stringToBuffer(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

async function signJwt(payload: Omit<JwtPayload, "iat" | "jti">, expiresInSeconds = 7 * 24 * 60 * 60): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const jti = crypto.randomUUID();
  const body: JwtPayload = { ...payload, jti, iat: now, exp: now + expiresInSeconds };
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(stringToBuffer(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(stringToBuffer(JSON.stringify(body)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    stringToBuffer(INVITATION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, stringToBuffer(signingInput));
  return `${signingInput}.${base64UrlEncode(signature)}`;
}

async function verifyJwt(token: string): Promise<JwtPayload> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");
  const key = await crypto.subtle.importKey(
    "raw",
    stringToBuffer(INVITATION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const signingInput = `${parts[0]}.${parts[1]}`;
  const signature = Uint8Array.from(atob(padBase64(parts[2]).replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    stringToBuffer(signingInput)
  );
  if (!valid) throw new Error("Invalid token signature");
  const payload: JwtPayload = JSON.parse(new TextDecoder().decode(stringToBuffer(atob(padBase64(parts[1]).replace(/-/g, "+").replace(/_/g, "/")))));
  if (payload.exp * 1000 < Date.now()) throw new Error("Token expired");
  return payload;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeEmail(email?: string | null): string {
  return (email || "")
    .replace(/[\u200B-\u200D\uFEFF\u0000-\u001F\u007F]/g, "")
    .trim()
    .toLowerCase();
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const maskedLocal = local.length > 2 ? local.slice(0, 2) + "***" : "***";
  return `${maskedLocal}@${domain}`;
}

function requestId(req: Request): string {
  return req.headers.get("x-request-id") || crypto.randomUUID();
}

function formatExpiration(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function invitationEmailHtml(opts: {
  orgName: string;
  orgLogoUrl?: string;
  inviterName: string;
  inviteeEmail: string;
  role: string;
  department?: string;
  team?: string;
  workspace?: string;
  message?: string;
  expirationDate: string;
  acceptUrl: string;
  declineUrl: string;
}): string {
  const { orgName, orgLogoUrl, inviterName, role, department, team, workspace, message, expirationDate, acceptUrl, declineUrl } = opts;
  const logo = orgLogoUrl
    ? `<img src="${orgLogoUrl}" alt="${orgName}" style="max-height:48px;margin-bottom:16px;" />`
    : `<div style="font-size:24px;font-weight:700;color:#0f172a;margin-bottom:16px;">${orgName}</div>`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're invited to join ${orgName}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding:32px 32px 24px;">
              ${logo}
              <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 16px;">You're invited to join ${orgName}</h1>
              <p style="font-size:16px;line-height:1.6;color:#334155;margin:0 0 16px;">
                <strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> as a <strong>${role.replace(/_/g, " ")}</strong>.
              </p>
              ${department ? `<p style="font-size:14px;line-height:1.5;color:#475569;margin:0 0 8px;"><strong>Department:</strong> ${department}</p>` : ""}
              ${team ? `<p style="font-size:14px;line-height:1.5;color:#475569;margin:0 0 8px;"><strong>Team:</strong> ${team}</p>` : ""}
              ${workspace ? `<p style="font-size:14px;line-height:1.5;color:#475569;margin:0 0 8px;"><strong>Workspace:</strong> ${workspace}</p>` : ""}
              ${message ? `<div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:16px 0;font-size:14px;color:#334155;">${message.replace(/\n/g, "<br/>")}</div>` : ""}
              <p style="font-size:14px;color:#64748b;margin:16px 0 24px;">This invitation expires on <strong>${expirationDate}</strong>.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-radius:8px;overflow:hidden;background:#4f46e5;">
                    <a href="${acceptUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:8px;">Accept Invitation</a>
                  </td>
                </tr>
              </table>
              <p style="font-size:13px;color:#64748b;margin:24px 0 0;">
                If you do not wish to join, <a href="${declineUrl}" style="color:#64748b;text-decoration:underline;">decline this invitation</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
              Sent to ${opts.inviteeEmail}. If you believe this was sent in error, you can safely ignore it.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function getUser(supabase: any, authHeader: string) {
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

function createAuthClient(authHeader: string) {
  return createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || "", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authHeader } },
  });
}

async function isOrgAdmin(supabase: any, orgId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_org_admin", { p_org_id: orgId, p_user_id: userId });
  if (error) return false;
  return !!data;
}

async function getEmailSettings(supabase: any) {
  const { data, error } = await supabase.from("email_settings").select("*").limit(1).maybeSingle();
  if (error || !data || !data.resend_api_key) return null;
  return data as { resend_api_key: string; default_from_email: string; default_from_name: string };
}

function padBase64(s: string): string {
  const pad = s.length % 4;
  return pad === 0 ? s : s + "=".repeat(4 - pad);
}

async function sendInvitationEmail(
  req: Request,
  supabase: any,
  invitation: any,
  token: string
): Promise<{ success: boolean; providerMessageId?: string; error?: string }> {
  const settings = await getEmailSettings(supabase);
  if (!settings) return { success: false, error: "Resend not configured" };

  const publicAppUrl = Deno.env.get("PUBLIC_APP_URL") || "https://www.aidetector.cx";
  const baseUrl = new URL(publicAppUrl);
  const allowedHostnames = new Set(["aidetector.cx", "www.aidetector.cx"]);
  if (!allowedHostnames.has(baseUrl.hostname)) {
    console.error("[enterprise-invitation] invalid PUBLIC_APP_URL hostname", baseUrl.hostname);
    return { success: false, error: "Invalid production invitation URL" };
  }

  const acceptUrl = `${baseUrl.origin}/accept-invitation?token=${encodeURIComponent(token)}`;
  const declineUrl = `${baseUrl.origin}/accept-invitation?token=${encodeURIComponent(token)}&action=decline`;

  const orgName = invitation.org_name || invitation.organization?.name || "an organization";
  const orgLogoUrl = invitation.org_logo_url || invitation.organization?.logo_url;
  const inviterName = invitation.inviter_name || invitation.inviter_email || invitation.invited_by_profile?.full_name || invitation.invited_by_profile?.display_name || "Someone";
  const role = invitation.role || "member";

  const html = invitationEmailHtml({
    orgName,
    orgLogoUrl,
    inviterName,
    inviteeEmail: invitation.email,
    role,
    department: invitation.department_name,
    team: invitation.team_name,
    workspace: invitation.workspace_name,
    message: invitation.message,
    expirationDate: formatExpiration(invitation.expires_at),
    acceptUrl,
    declineUrl,
  });

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.resend_api_key}`,
      },
      body: JSON.stringify({
        from: `${settings.default_from_name || "AIDetector.cx"} <${settings.default_from_email || settings.support_email || "noreply@aidetector.cx"}>`,
        to: [invitation.email],
        subject: `You're invited to join ${orgName}`,
        html,
      }),
    });
    const body = await res.json().catch(async () => await res.text());
    if (!res.ok) {
      return { success: false, error: typeof body === "string" ? body : body?.message || `Resend error ${res.status}` };
    }
    return { success: true, providerMessageId: body.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

async function logAudit(supabase: any, orgId: string, userId: string | null, action: string, resourceType: string, resourceId: string, details: any) {
  try {
    await supabase.rpc("log_audit_event", {
      p_organization_id: orgId,
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_details: details,
    });
  } catch {
    // best-effort
  }
}

async function recordEvent(supabase: any, orgId: string, userId: string | null, action: string, resourceType: string, resourceId: string, metadata: any) {
  try {
    await supabase.rpc("record_enterprise_event", {
      p_organization_id: orgId,
      p_user_id: userId,
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_metadata: metadata,
    });
  } catch {
    // best-effort
  }
}

async function notifyInviter(supabase: any, inviterUserId: string, type: string, content: string, orgId: string, resourceId?: string) {
  await createSystemNotification(supabase, {
    userId: inviterUserId,
    organizationId: orgId,
    type: "system",
    content,
    resourceType: "organization_invitation",
    resourceId,
  });
}

async function createInvitation(req: Request, supabase: any, body: any, inviter: any) {
  const {
    organization_id,
    invitee_email,
    role = "member",
    department_id,
    team_id,
    workspace_id,
    message,
  } = body;

  if (!organization_id || !invitee_email) {
    return errorResponse("organization_id and invitee_email are required", 400);
  }

  const email = normalizeEmail(invitee_email);
  if (!isValidEmail(email)) {
    return errorResponse("Invalid email address", 400);
  }

  const isAdmin = await isOrgAdmin(supabase, organization_id, inviter.id);
  if (!isAdmin) {
    return errorResponse("Forbidden", 403);
  }

  // Load org settings
  const { data: org, error: orgError } = await supabase.from("organizations").select("*,invitation_settings").eq("id", organization_id).maybeSingle();
  if (orgError || !org) return errorResponse("Organization not found", 404);

  const settings = org.invitation_settings || {};
  const maxPending = typeof settings.max_pending_invitations === "number" ? settings.max_pending_invitations : 100;
  const expirationDays = typeof settings.default_expiration_days === "number" ? settings.default_expiration_days : 7;

  // Duplicate checks
  const { data: matchingProfiles } = await supabase.from("profiles").select("id").eq("email", email);
  const matchingUserIds = (matchingProfiles || []).map((p: any) => p.id);

  if (matchingUserIds.length > 0) {
    const { data: existingMembers } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", organization_id)
      .in("user_id", matchingUserIds)
      .not("status", "eq", "removed");

    if (existingMembers && existingMembers.length > 0) {
      return errorResponse("A member with this email already belongs to the organization", 409);
    }
  }

  const { data: existingPending } = await supabase
    .from("organization_invitations")
    .select("id,status")
    .eq("organization_id", organization_id)
    .eq("email", email)
    .in("status", ["pending", "delivered", "opened", "resent"]);

  if (existingPending && existingPending.length > 0) {
    return errorResponse("A pending invitation already exists for this email. Resend it instead.", 409);
  }

  const { count: pendingCount } = await supabase
    .from("organization_invitations")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organization_id)
    .in("status", ["pending", "delivered", "opened", "resent"]);

  if (pendingCount && pendingCount >= maxPending) {
    return errorResponse(`Maximum pending invitations (${maxPending}) reached`, 429);
  }

  // Rate limit: 100 sends per hour per org
  const { count: sendsLastHour } = await supabase
    .from("organization_invitations")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organization_id)
    .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

  if (sendsLastHour && sendsLastHour >= 100) {
    return errorResponse("Invitation send rate limit exceeded. Try again later.", 429);
  }

  const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString();
  const ipAddress = req.headers.get("x-forwarded-for") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  const token = await signJwt({ org_id: organization_id, email, role, department_id, team_id, workspace_id }, expirationDays * 24 * 60 * 60);

  const { data: invitation, error: insertError } = await supabase
    .from("organization_invitations")
    .insert({
      organization_id,
      email,
      role,
      department_id: department_id || null,
      team_id: team_id || null,
      workspace_id: workspace_id || null,
      message: message || null,
      token,
      invited_by: inviter.id,
      invited_at: new Date().toISOString(),
      expires_at: expiresAt,
      status: "pending",
      delivery_history: [],
      audit_info: { ip_address: ipAddress, user_agent: userAgent },
    })
    .select()
    .single();

  if (insertError || !invitation) {
    return errorResponse(insertError?.message || "Failed to create invitation", 500);
  }

  const { data: enriched } = await supabase.rpc("get_organization_invitation_by_token", { p_token: token }).maybeSingle();
  const invitationDetails = {
    ...enriched,
    ...invitation,
    org_name: enriched?.org_name || org?.name || invitation?.org_name,
    inviter_name: enriched?.inviter_name || enriched?.inviter_email || inviter?.email,
  };

  const emailResult = await sendInvitationEmail(req, supabase, invitationDetails, token);

  const now = new Date().toISOString();
  const deliveryEvent = emailResult.success
    ? { status: "delivered", timestamp: now, provider_message_id: emailResult.providerMessageId }
    : { status: "failed", timestamp: now, error: emailResult.error };

  const { data: updated } = await supabase
    .from("organization_invitations")
    .update({
      status: emailResult.success ? "delivered" : "failed",
      failed_at: emailResult.success ? null : now,
      delivery_history: [...(invitation.delivery_history || []), deliveryEvent],
    })
    .eq("id", invitation.id)
    .select()
    .single();

  await logAudit(supabase, organization_id, inviter.id, "invitation_sent", "organization_invitation", invitation.id, {
    email,
    role,
    department_id,
    team_id,
    workspace_id,
    delivered: emailResult.success,
  });

  await recordEvent(supabase, organization_id, inviter.id, "user_invited", "organization_invitation", invitation.id, {
    email,
    role,
    department_id,
    team_id,
    workspace_id,
  });

  // In-app notification for inviter
  await notifyInviter(supabase, inviter.id, "system", `Invitation sent to ${email} for ${org.name}`, organization_id, invitation.id);

  return jsonResponse({
    success: true,
    invitation_id: invitation.id,
    status: updated?.status || (emailResult.success ? "delivered" : "failed"),
    email: emailResult.success ? "delivered" : "failed",
    error: emailResult.error,
  });
}

async function resendInvitation(req: Request, supabase: any, body: any, inviter: any) {
  const { organization_id, invitation_id } = body;
  if (!organization_id || !invitation_id) return errorResponse("organization_id and invitation_id are required", 400);
  const isAdmin = await isOrgAdmin(supabase, organization_id, inviter.id);
  if (!isAdmin) return errorResponse("Forbidden", 403);

  const { data: invite, error } = await supabase
    .from("organization_invitations")
    .select("*")
    .eq("id", invitation_id)
    .eq("organization_id", organization_id)
    .maybeSingle();

  if (error || !invite) return errorResponse("Invitation not found", 404);
  if (["accepted", "revoked", "expired", "declined"].includes(invite.status)) {
    return errorResponse(`Cannot resend invitation with status ${invite.status}`, 400);
  }

  const { data: org } = await supabase.from("organizations").select("name, invitation_settings").eq("id", organization_id).maybeSingle();
  const expirationDays = org?.invitation_settings?.default_expiration_days || 7;
  const newToken = await signJwt(
    { org_id: organization_id, email: invite.email, role: invite.role, department_id: invite.department_id, team_id: invite.team_id, workspace_id: invite.workspace_id },
    expirationDays * 24 * 60 * 60
  );
  const newExpiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: enriched } = await supabase.rpc("get_organization_invitation_by_token", { p_token: newToken }).maybeSingle();
  const invitationDetails = {
    ...enriched,
    ...invite,
    org_name: enriched?.org_name || org?.name || invite?.org_name,
    inviter_name: enriched?.inviter_name || enriched?.inviter_email || invite?.inviter_name,
  };
  const emailResult = await sendInvitationEmail(req, supabase, invitationDetails, newToken);

  const now = new Date().toISOString();
  const deliveryEvent = emailResult.success
    ? { status: "resent", timestamp: now, provider_message_id: emailResult.providerMessageId }
    : { status: "failed", timestamp: now, error: emailResult.error };

  const { data: updated } = await supabase
    .from("organization_invitations")
    .update({
      token: newToken,
      expires_at: newExpiresAt,
      status: emailResult.success ? "resent" : "failed",
      resent_at: now,
      failed_at: emailResult.success ? null : now,
      delivery_history: [...(invite.delivery_history || []), deliveryEvent],
    })
    .eq("id", invitation_id)
    .select()
    .single();

  await logAudit(supabase, organization_id, inviter.id, "invitation_resent", "organization_invitation", invitation_id, { email: invite.email, delivered: emailResult.success });

  return jsonResponse({
    success: emailResult.success,
    status: updated?.status,
    error: emailResult.error,
  });
}

async function revokeInvitation(supabase: any, body: any, inviter: any) {
  const { organization_id, invitation_id } = body;
  if (!organization_id || !invitation_id) return errorResponse("organization_id and invitation_id are required", 400);
  const isAdmin = await isOrgAdmin(supabase, organization_id, inviter.id);
  if (!isAdmin) return errorResponse("Forbidden", 403);

  const { data: invite } = await supabase
    .from("organization_invitations")
    .select("id,email,status")
    .eq("id", invitation_id)
    .eq("organization_id", organization_id)
    .maybeSingle();
  if (!invite) return errorResponse("Invitation not found", 404);
  if (["accepted", "revoked", "declined"].includes(invite.status)) {
    return errorResponse(`Cannot revoke invitation with status ${invite.status}`, 400);
  }

  const now = new Date().toISOString();
  await supabase
    .from("organization_invitations")
    .update({ status: "revoked", revoked_at: now })
    .eq("id", invitation_id);

  await logAudit(supabase, organization_id, inviter.id, "invitation_revoked", "organization_invitation", invitation_id, { email: invite.email });
  return jsonResponse({ success: true, status: "revoked" });
}

async function extendInvitation(supabase: any, body: any, inviter: any) {
  const { organization_id, invitation_id, days = 7 } = body;
  if (!organization_id || !invitation_id) return errorResponse("organization_id and invitation_id are required", 400);
  const isAdmin = await isOrgAdmin(supabase, organization_id, inviter.id);
  if (!isAdmin) return errorResponse("Forbidden", 403);

  const newExpiresAt = new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("organization_invitations")
    .update({ expires_at: newExpiresAt, status: "pending" })
    .eq("id", invitation_id)
    .eq("organization_id", organization_id)
    .not("status", "in", "('accepted','revoked','declined')");
  if (error) return errorResponse(error.message, 400);

  await logAudit(supabase, organization_id, inviter.id, "invitation_extended", "organization_invitation", invitation_id, { days, expires_at: newExpiresAt });
  return jsonResponse({ success: true, expires_at: newExpiresAt });
}

async function declineInvitation(supabase: any, body: any) {
  const { token } = body;
  if (!token) return errorResponse("token is required", 400);
  let payload: JwtPayload;
  try {
    payload = await verifyJwt(token);
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }

  const { data: invite } = await supabase
    .from("organization_invitations")
    .select("id,organization_id,email,status")
    .eq("token", token)
    .maybeSingle();
  if (!invite) return errorResponse("Invitation not found", 404);
  if (["accepted", "revoked", "expired", "declined"].includes(invite.status)) {
    return errorResponse("Invitation is no longer valid", 400);
  }

  const now = new Date().toISOString();
  await supabase.from("organization_invitations").update({ status: "declined", declined_at: now }).eq("id", invite.id);
  await recordEvent(supabase, invite.organization_id, null, "invitation_declined", "organization_invitation", invite.id, { email: invite.email });
  await logAudit(supabase, invite.organization_id, null, "invitation_declined", "organization_invitation", invite.id, { email: invite.email });

  return jsonResponse({ success: true, status: "declined" });
}

async function getInvitation(supabase: any, body: any) {
  const { token } = body;
  if (!token) return errorResponse("token is required", 400);
  try {
    await verifyJwt(token);
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }

  const { data: invite, error } = await supabase.rpc("get_organization_invitation_by_token", { p_token: token }).maybeSingle();
  if (error || !invite) return errorResponse("Invitation not found", 404);

  if (["revoked", "expired", "declined"].includes(invite.status)) {
    return jsonResponse({ success: false, error_code: `invitation_${invite.status}`, error: `Invitation is ${invite.status}` }, 400);
  }

  // Mark opened if pending/delivered/resent
  if (["pending", "delivered", "resent"].includes(invite.status)) {
    await supabase.from("organization_invitations").update({ status: "opened", opened_at: new Date().toISOString() }).eq("id", invite.id);
  }

  return jsonResponse({ success: true, invitation: invite });
}

async function acceptInvitation(supabase: any, body: any, authHeader: string, req: Request) {
  const { token } = body;
  const rid = requestId(req);
  if (!token) return errorResponse("token is required", 400);

  let payload: JwtPayload;
  try {
    payload = await verifyJwt(token);
  } catch (err: any) {
    return errorResponse(err.message, 400);
  }

  const user = await getUser(supabase, authHeader);
  if (!user) return errorResponse("Authentication required", 401);

  const authEmail = normalizeEmail(user.email);
  const inviteEmail = normalizeEmail(payload.email);

  const { data: invite } = await supabase
    .from("organization_invitations")
    .select("id,status,organization_id,accepted_by,email")
    .eq("token", token)
    .maybeSingle();

  console.log("[enterprise-invitation accept]", {
    request_id: rid,
    invitation_id: invite?.id,
    invitation_status: invite?.status,
    organization_id: invite?.organization_id,
    auth_user_id: user.id,
    normalized_auth_email: authEmail,
    normalized_invite_email: inviteEmail,
    token_valid: true,
  });

  if (!invite) return errorResponse("Invitation not found", 404);

  if (authEmail !== normalizeEmail(invite.email)) {
    return jsonResponse({
      success: false,
      error_code: "email_mismatch",
      error: "Invitation email does not match authenticated account",
      invitation_email: maskEmail(invite.email),
      authenticated_email: maskEmail(user.email || ""),
    }, 400);
  }

  if (invite.status === "accepted") {
    if (invite.accepted_by === user.id) {
      return jsonResponse({
        success: true,
        already_joined: true,
        organization_id: invite.organization_id,
        redirect: "/organizations/" + invite.organization_id,
      });
    }
    return errorResponse("Invitation was already accepted by another account", 400);
  }

  if (invite.status === "revoked") return errorResponse("Invitation has been revoked", 400);
  if (invite.status === "declined") return errorResponse("Invitation has been declined", 400);

  if (invite.status === "expired" || new Date(invite.expires_at || payload.exp * 1000) < new Date()) {
    await supabase.from("organization_invitations").update({ status: "expired" }).eq("id", invite.id);
    return errorResponse("Invitation has expired", 400);
  }

  // Accept even if email delivery previously failed; token is valid.
  if (invite.status === "failed") {
    await supabase.from("organization_invitations").update({ status: "pending" }).eq("id", invite.id);
  }

  const authClient = createAuthClient(authHeader);
  const { data: orgId, error: acceptError } = await authClient.rpc("accept_organization_invitation", { p_token: token });
  if (acceptError || !orgId) {
    return errorResponse(acceptError?.message || "Failed to accept invitation", 400);
  }

  // Notify inviter if available
  const { data: inviterId } = await supabase.from("organization_invitations").select("invited_by").eq("id", invite.id).maybeSingle();
  if (inviterId?.invited_by) {
    await notifyInviter(supabase, inviterId.invited_by, "system", `${user.email} accepted your invitation`, invite.organization_id, invite.id);
  }

  return jsonResponse({ success: true, organization_id: orgId, redirect: "/organizations/" + orgId });
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  try {
    const body = await req.json();
    const action = body.action;
    const authHeader = req.headers.get("Authorization") || "";

    switch (action) {
      case "send": {
        const user = await getUser(supabase, authHeader);
        if (!user) return errorResponse("Unauthorized", 401);
        return await createInvitation(req, supabase, body, user);
      }
      case "resend": {
        const user = await getUser(supabase, authHeader);
        if (!user) return errorResponse("Unauthorized", 401);
        return await resendInvitation(req, supabase, body, user);
      }
      case "revoke": {
        const user = await getUser(supabase, authHeader);
        if (!user) return errorResponse("Unauthorized", 401);
        return await revokeInvitation(supabase, body, user);
      }
      case "extend": {
        const user = await getUser(supabase, authHeader);
        if (!user) return errorResponse("Unauthorized", 401);
        return await extendInvitation(supabase, body, user);
      }
      case "decline":
        return await declineInvitation(supabase, body);
      case "get":
        return await getInvitation(supabase, body);
      case "accept":
      case "complete":
        return await acceptInvitation(supabase, body, authHeader, req);
      default:
        return errorResponse("Unknown action", 400);
    }
  } catch (err: any) {
    console.error("enterprise-invitation error", err);
    return errorResponse(err.message || "Internal error", 500);
  }
});
