import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  renderEmailTemplate,
  EmailTemplateSettings,
  RenderEmailTemplateInput,
} from "./renderEmailTemplate.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Auth" }, 401);
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!profile || profile.role !== "admin") {
      return json({ error: "Forbidden" }, 403);
    }

    const body = await req.json();
    const {
      template_key,
      template_id,
      subject,
      preheader,
      bodyHtml,
      recipientData,
      cta,
      isCampaign,
      unsubscribeUrl,
      settings: providedSettings,
    } = body as {
      template_key?: string;
      template_id?: string;
      subject?: string;
      preheader?: string;
      bodyHtml?: string;
      recipientData?: Record<string, string>;
      cta?: { label?: string; url?: string };
      isCampaign?: boolean;
      unsubscribeUrl?: string;
      settings?: EmailTemplateSettings;
    };

    let template: RenderEmailTemplateInput["template"] = null;

    if (template_key || template_id) {
      let query = supabase.from("email_templates").select("*");
      if (template_id) {
        query = query.eq("id", template_id);
      } else if (template_key) {
        query = query.eq("template_key", template_key);
      }
      const { data: tpl } = await query.single();
      template = tpl || null;
    }

    let settings = providedSettings;
    if (!settings) {
      const { data: dbSettings } = await supabase
        .from("email_settings")
        .select("*")
        .limit(1)
        .single();
      settings = dbSettings as EmailTemplateSettings;
    }

    const result = renderEmailTemplate({
      template,
      subject,
      preheader,
      bodyHtml,
      recipientData,
      cta,
      isCampaign,
      unsubscribeUrl,
      settings,
    });

    return json({
      success: true,
      html: result.html,
      text: result.text,
      subject: result.subject,
      validation: result.validation,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ error: message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
