/**
 * Reusable server-side email renderer.
 * Wraps administrator-provided body HTML inside the AIDetector.cx branded layout.
 * Returns complete HTML, plain-text fallback, resolved subject and validation info.
 */

export interface EmailTemplateSettings {
  default_from_name?: string;
  reply_to_email?: string;
  business_email?: string;
  business_phone?: string;
  sender_display_name?: string;
  company_name?: string;
  website_url?: string;
  logo_url?: string;
  business_address?: string;
  primary_color?: string;
  accent_color?: string;
}

export interface CallToAction {
  label?: string;
  url?: string;
}

export interface RenderEmailTemplateInput {
  template?: { body_only?: boolean; html_body?: string; subject?: string; preview_text?: string; cta_label?: string; cta_url?: string } | null;
  subject?: string;
  preheader?: string;
  bodyHtml?: string;
  recipientData?: Record<string, string | undefined>;
  cta?: CallToAction;
  isCampaign?: boolean;
  unsubscribeUrl?: string;
  settings?: EmailTemplateSettings | null;
}

export interface RenderEmailTemplateResult {
  html: string;
  text: string;
  subject: string;
  validation: { ok: boolean; warnings: string[]; errors: string[] };
}

const DEFAULT_SETTINGS: EmailTemplateSettings = {
  company_name: "AIDetector.cx",
  website_url: "https://aidetector.cx",
  logo_url: "https://miaoda-conversation-file.s3cdn.medo.dev/user-c18kzohmrlkw/app-c18l1vf2nz7l/20260831/app_icon_128c0c18-8557-4863-9f08-5ec933ee3619.png",
  primary_color: "#4f46e5",
  accent_color: "#818cf8",
  business_email: "",
  business_phone: "",
  sender_display_name: "Anike Tobechukwu Sunday",
  reply_to_email: "",
  business_address: "",
};

const FALLBACKS: Record<string, string> = {
  first_name: "there",
  email: "",
  company_name: "AIDetector.cx",
  website_url: "https://aidetector.cx",
};

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function decodeHtmlEntities(html: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#039;": "'",
    "&#39;": "'",
    "&nbsp;": " ",
    "&copy;": "©",
  };
  return html.replace(/&[a-zA-Z0-9#]+;/g, (m) => entities[m] || m);
}

const KNOWN_MERGE_TAGS = new Set([
  "first_name",
  "email",
  "company_name",
  "website_url",
  "business_email",
  "business_phone",
  "business_address",
  "sender_display_name",
]);

function resolveMergeTags(
  text: string,
  recipientData: Record<string, string | undefined>,
  settings: EmailTemplateSettings
): { text: string; unknown: string[] } {
  const unknown: string[] = [];
  const data: Record<string, string | undefined> = {
    ...settings,
    first_name: recipientData.first_name,
    email: recipientData.email,
    company_name: settings.company_name,
    website_url: settings.website_url,
    business_email: settings.business_email,
    business_phone: settings.business_phone,
    business_address: settings.business_address,
    sender_display_name: settings.sender_display_name,
  };
  const resolved = text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const value = data[key];
    if (value !== undefined && value !== null) return value;
    if (!KNOWN_MERGE_TAGS.has(key)) {
      unknown.push(`{{${key}}}`);
    }
    return FALLBACKS[key] ?? "";
  });
  return { text: resolved, unknown };
}

function getMissingFirstName(recipientData: Record<string, string | undefined>): string {
  return recipientData.first_name || FALLBACKS.first_name;
}

const ALLOWED_TAGS = new Set([
  "p", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "table", "thead",
  "tbody", "tfoot", "tr", "td", "th", "a", "strong", "b", "em", "i", "br",
  "hr", "img", "div", "span", "blockquote", "sup", "sub", "small",
]);

const DISALLOWED_TAGS = new Set([
  "script", "style", "iframe", "form", "input", "textarea", "select", "option",
  "button", "object", "embed", "video", "audio", "source", "canvas", "svg", "math",
  "link", "meta", "title", "head", "body", "html", "base",
]);

function sanitizeAttribute(tag: string, attr: string, value: string): string | null {
  if (attr.startsWith("on") || attr === "style" || attr === "srcdoc") return null;
  if (attr === "href" || attr === "src") {
    const v = value.trim().toLowerCase();
    if (v.startsWith("javascript:") || v.startsWith("data:")) return null;
    if (tag === "a" && attr === "href" && !v.startsWith("http://") && !v.startsWith("https://") && !v.startsWith("mailto:") && !v.startsWith("tel:")) {
      return null;
    }
    return value;
  }
  const safeAttrs = new Set([
    "href", "src", "alt", "title", "target", "width", "height", "border", "cellpadding",
    "cellspacing", "align", "valign", "colspan", "rowspan", "class", "dir", "lang",
  ]);
  if (safeAttrs.has(attr)) return value;
  return null;
}

function sanitizeEmailHtml(raw: string): string {
  let cleaned = raw.replace(/<!--[\s\S]*?-->/g, "");
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ");
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ");
  cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, " ");

  const tagRe = /<\/?([a-zA-Z0-9]+)([^>]*)>/g;
  const output: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(cleaned)) !== null) {
    const before = cleaned.slice(lastIndex, match.index);
    output.push(before.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
    const tag = match[1].toLowerCase();
    const attrRaw = match[2];
    const isClosing = match[0].startsWith("</");

    if (DISALLOWED_TAGS.has(tag)) {
      output.push(" ");
      lastIndex = match.index + match[0].length;
      continue;
    }

    if (ALLOWED_TAGS.has(tag)) {
      if (isClosing) {
        output.push(`</${tag}>`);
      } else {
        const attrs: string[] = [];
        const attrRe = /([a-zA-Z-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
        let am: RegExpExecArray | null;
        while ((am = attrRe.exec(attrRaw)) !== null) {
          const name = am[1].toLowerCase();
          const value = am[2] ?? am[3] ?? am[4] ?? "";
          const safe = sanitizeAttribute(tag, name, value);
          if (safe !== null) {
            attrs.push(`${name}="${escapeHtml(safe)}"`);
          }
        }
        if (tag === "a" && !attrs.some((a) => a.startsWith("target="))) {
          attrs.push('target="_blank"');
        }
        output.push(`<${tag}${attrs.length ? " " + attrs.join(" ") : ""}>`);
      }
    } else {
      output.push(match[0].replace(/</g, "&lt;").replace(/>/g, "&gt;"));
    }
    lastIndex = match.index + match[0].length;
  }
  output.push(cleaned.slice(lastIndex).replace(/</g, "&lt;").replace(/>/g, "&gt;"));
  return output.join("");
}

function htmlToText(html: string): string {
  let text = html
    .replace(/\r\n/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  text = decodeHtmlEntities(text);
  return text;
}

function buildBrandedHtml(
  body: string,
  preheader: string,
  cta: CallToAction | null,
  settings: EmailTemplateSettings,
  isCampaign: boolean,
  unsubscribeUrl?: string
): string {
  const year = new Date().getFullYear();
  const primary = settings.primary_color || DEFAULT_SETTINGS.primary_color || "#4f46e5";
  const accent = settings.accent_color || DEFAULT_SETTINGS.accent_color || "#818cf8";
  const website = settings.website_url || DEFAULT_SETTINGS.website_url || "https://aidetector.cx";
  const logo = settings.logo_url || DEFAULT_SETTINGS.logo_url || "https://miaoda-conversation-file.s3cdn.medo.dev/user-c18kzohmrlkw/app-c18l1vf2nz7l/20260831/app_icon_128c0c18-8557-4863-9f08-5ec933ee3619.png";
  const businessEmail = settings.business_email || "";
  const businessPhone = settings.business_phone || "";
  const address = settings.business_address || "";
  const sender = settings.sender_display_name || DEFAULT_SETTINGS.sender_display_name || "Anike Tobechukwu Sunday";

  const hasValidCta = Boolean(cta && cta.label && cta.label.trim() && cta.url && cta.url.trim());
  const ctaLabelText = hasValidCta ? cta!.label!.trim() : "";
  const ctaUrlLink = hasValidCta ? cta!.url!.trim() : "";

  const ctaBlock = hasValidCta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 16px 0;">
  <tr>
    <td align="center" style="border-radius:6px;background-color:${primary};" bgcolor="${primary}">
      <a href="${escapeHtml(ctaUrlLink)}" target="_blank" class="email-cta-link" style="color:#ffffff !important;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;line-height:20px;text-decoration:none !important;display:inline-block;padding:12px 28px;border-radius:6px;background-color:${primary};letter-spacing:-0.01em;">${escapeHtml(ctaLabelText)}</a>
    </td>
  </tr>
</table>`
    : "";

  const emailLink = businessEmail
    ? `<a href="mailto:${escapeHtml(businessEmail)}" style="color:${primary};text-decoration:none;font-weight:500;">${escapeHtml(businessEmail)}</a>`
    : "";
  const phoneLink = businessPhone
    ? `<a href="tel:${escapeHtml(businessPhone.replace(/\s+/g, ""))}" style="color:${primary};text-decoration:none;font-weight:500;">${escapeHtml(businessPhone)}</a>`
    : "";
  const websiteLink = website
    ? `<a href="${escapeHtml(website)}" target="_blank" style="color:${primary};text-decoration:none;font-weight:500;">${escapeHtml(website)}</a>`
    : "";

  const contactLines: string[] = [];
  if (emailLink && phoneLink) {
    contactLines.push(`${emailLink} &bull; ${phoneLink}`);
  } else if (emailLink) {
    contactLines.push(emailLink);
  } else if (phoneLink) {
    contactLines.push(phoneLink);
  }
  if (websiteLink) {
    contactLines.push(websiteLink);
  }
  if (address) {
    contactLines.push(escapeHtml(address));
  }

  const unsubscribeBlock = isCampaign && unsubscribeUrl
    ? `<p style="margin:12px 0 0 0;font-size:12px;line-height:1.5;color:#94a3b8;">
  <a href="${escapeHtml(unsubscribeUrl)}" style="color:#64748b;text-decoration:underline;">Unsubscribe from partnership updates</a>
</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${escapeHtml(preheader || "AIDetector.cx")}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
    table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
    
    /* Email Body & Typography */
    .email-body-text {
      color: #0f172a !important;
      font-size: 15px;
      line-height: 1.65;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .email-body-text p {
      margin: 0 0 16px 0;
      color: #0f172a !important;
    }
    .email-body-text a:not(.email-cta-link) {
      color: ${primary} !important;
      text-decoration: underline;
    }
    .email-body-text strong, .email-body-text b {
      color: #0f172a !important;
      font-weight: 600;
    }
    .email-body-text h1, .email-body-text h2, .email-body-text h3 {
      color: #0f172a !important;
      margin: 20px 0 12px 0;
      font-weight: 700;
    }

    /* CTA Button Anchor - White text with high priority */
    .email-cta-link, a.email-cta-link {
      color: #ffffff !important;
      text-decoration: none !important;
      font-weight: 700 !important;
    }

    @media (prefers-color-scheme: dark) {
      .email-bg { background-color: #0b0f19 !important; }
      .email-card { background-color: #ffffff !important; }
      .email-body-text, .email-body-text p, .email-body-text strong { color: #0f172a !important; }
      .email-cta-link, a.email-cta-link { color: #ffffff !important; }
    }
    @media screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .email-padding { padding: 24px 20px !important; }
      .email-header-padding { padding: 20px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;" class="email-bg">
  <!-- Preheader text -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f1f5f9;">
    ${escapeHtml(preheader || " ")}
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f1f5f9" class="email-bg">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="620" cellpadding="0" cellspacing="0" border="0" class="email-container" style="max-width:620px;width:100%;border-radius:10px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05),0 2px 4px -2px rgba(0,0,0,0.05);">
          <tr>
            <td class="email-card" style="background-color:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">
              
              <!-- Professional Header (Dark Navy Background) -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f172a;border-bottom:2px solid #1e293b;">
                <tr>
                  <td class="email-header-padding" style="padding:24px 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <!-- Brand Identity: PNG Icon + Separate HTML Text -->
                        <td align="left" valign="middle">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td valign="middle" style="padding-right:12px;">
                                <img src="${escapeHtml(logo)}" alt="AIDetector.cx" width="38" height="38" style="display:block;width:38px;height:38px;border-radius:8px;border:0;outline:none;" onerror="this.style.display='none';">
                              </td>
                              <td valign="middle">
                                <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;line-height:1.2;display:inline-block;">
                                  AIDetector<span style="color:${accent};">.cx</span>
                                </span>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <!-- Small Badge / Label -->
                        <td align="right" valign="middle">
                          <span style="display:inline-block;padding:4px 10px;border-radius:9999px;background-color:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;color:#e2e8f0;letter-spacing:0.02em;text-transform:uppercase;">
                            Partnerships &amp; Integrations
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding-top:10px;">
                          <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;color:#94a3b8;line-height:1.4;">
                            AI content intelligence for trusted publishing
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Body Area -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff">
                <tr>
                  <td class="email-padding email-body-text" style="padding:36px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#0f172a;background-color:#ffffff;">
                    ${body}
                    ${ctaBlock}
                  </td>
                </tr>
              </table>

              <!-- Professional Corporate Footer -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f8fafc" style="background-color:#f8fafc;border-top:1px solid #e2e8f0;">
                <tr>
                  <td class="email-padding" style="padding:28px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#64748b;background-color:#f8fafc;">
                    
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="left" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                          <p style="margin:0 0 4px 0;font-size:14px;font-weight:700;color:#1e293b;">
                            ${escapeHtml(sender)}
                          </p>
                          <p style="margin:0 0 10px 0;font-size:12px;font-weight:500;color:#64748b;">
                            Founder, AIDetector.cx
                          </p>
                          ${contactLines.length > 0 ? `<p style="margin:0 0 12px 0;font-size:12px;color:#64748b;line-height:1.7;">${contactLines.join("<br>")}</p>` : ""}
                          <p style="margin:0 0 6px 0;font-size:11px;color:#94a3b8;font-style:italic;">
                            AI content intelligence for trusted publishing
                          </p>
                          <p style="margin:0;font-size:11px;color:#94a3b8;">
                            &copy; ${year} AIDetector.cx. All rights reserved.
                          </p>
                          ${unsubscribeBlock}
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderEmailTemplate(input: RenderEmailTemplateInput): RenderEmailTemplateResult {
  const {
    template,
    subject = "",
    preheader = "",
    bodyHtml = "",
    recipientData = {},
    cta,
    isCampaign = false,
    unsubscribeUrl,
    settings,
  } = input;

  const validation: { ok: boolean; warnings: string[]; errors: string[] } = {
    ok: true,
    warnings: [],
    errors: [],
  };

  const mergedSettings: EmailTemplateSettings = {
    ...DEFAULT_SETTINGS,
    ...(settings || {}),
  };

  if (!mergedSettings.business_email) {
    validation.warnings.push("Business email is not configured in Platform Settings.");
  }
  if (!mergedSettings.website_url) {
    validation.warnings.push("Website URL is not configured in Platform Settings.");
  }

  const rawBody = bodyHtml || template?.html_body || "";
  if (!rawBody.trim()) {
    validation.errors.push("Email body cannot be empty.");
    validation.ok = false;
  }

  const bodyOnly = template?.body_only ?? true;

  let sanitizedBody = sanitizeEmailHtml(rawBody);
  const firstName = getMissingFirstName(recipientData);
  sanitizedBody = sanitizedBody.replace(/\{\{\s*first_name\s*\}\}/g, firstName);

  // CTA resolution and validation
  // 1. Check explicit cta input first, then template fallback
  const inputLabel = cta?.label !== undefined ? cta.label : template?.cta_label;
  const inputUrl = cta?.url !== undefined ? cta.url : template?.cta_url;

  const trimmedLabel = inputLabel ? String(inputLabel).trim() : "";
  const trimmedUrl = inputUrl ? String(inputUrl).trim() : "";

  let finalCta: CallToAction | null = null;
  if (trimmedLabel && trimmedUrl) {
    finalCta = { label: trimmedLabel, url: trimmedUrl };
  } else if (trimmedLabel && !trimmedUrl) {
    validation.warnings.push("CTA button label was provided without a destination URL. Button will not be displayed.");
  } else if (!trimmedLabel && trimmedUrl) {
    validation.warnings.push("CTA button URL was provided without a button label. Button will not be displayed.");
  }

  let finalHtml = sanitizedBody;
  if (bodyOnly) {
    finalHtml = buildBrandedHtml(
      sanitizedBody,
      preheader || template?.preview_text || "",
      finalCta,
      mergedSettings,
      isCampaign,
      unsubscribeUrl
    );
  }

  const bodyResolution = resolveMergeTags(finalHtml, recipientData, mergedSettings);
  finalHtml = bodyResolution.text;

  const subjectResolution = resolveMergeTags(subject || template?.subject || "", recipientData, mergedSettings);
  const resolvedSubject = subjectResolution.text;
  if (!resolvedSubject) {
    validation.errors.push("Subject is required.");
    validation.ok = false;
  }

  const unresolved = [...new Set([...bodyResolution.unknown, ...subjectResolution.unknown])];
  if (unresolved.length > 0) {
    validation.warnings.push(`Unresolved merge tags: ${unresolved.join(", ")}`);
  }

  let text = htmlToText(finalHtml);
  if (finalCta && !text.includes(finalCta.label!)) {
    text += `\n\n${finalCta.label}: ${finalCta.url}`;
  }

  return {
    html: finalHtml,
    text,
    subject: resolvedSubject,
    validation,
  };
}
