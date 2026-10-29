import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { withBillingGuard } from "../_shared/billing.ts";

function validateUrl(input: string): URL {
  const value = /^https?:\/\//i.test(input.trim()) ? input.trim() : "https://" + input.trim();
  const url = new URL(value);
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.port && !["80","443"].includes(url.port)
    || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")
    || host.endsWith(".test") || host.endsWith(".invalid") || host.endsWith(".example")
    || /^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(":") || !host.includes(".")
    || /\.(onion|arpa)$/.test(host)) throw new Error("Enter a public website domain or HTTPS URL.");
  url.hash = "";
  return url;
}
function matches(html: string, pattern: RegExp): number { return [...html.matchAll(pattern)].length; }
function pct(n: number, max: number): number { return Math.max(0, Math.min(100, Math.round(n / max * 100))); }
function score(parts: boolean[]): number { return pct(parts.filter(Boolean).length, parts.length); }
function textOnly(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/\s+/g," ").slice(0,100000);
}
function isPublicIpv4(address: string): boolean {
  const parts=address.split(".").map(Number);
  if(parts.length!==4 || parts.some(n=>!Number.isInteger(n)||n<0||n>255)) return false;
  const [a,b,c]=parts;
  return a!==0 && a!==10 && a!==127 && a<224 && !(a===100&&b>=64&&b<=127)
    && !(a===169&&b===254) && !(a===172&&b>=16&&b<=31)
    && !(a===192&&b===168) && !(a===192&&b===0)
    && !(a===198&&(b===18||b===19)) && !(a===192&&b===0&&c===2)
    && !(a===198&&b===51&&c===100) && !(a===203&&b===0&&c===113);
}
async function verifyPublicDns(host: string): Promise<void> {
  // Fail closed if DNS cannot be verified. Disallow private, link-local, or reserved targets.
  const [a,aaaa]=await Promise.all([
    Deno.resolveDns(host,"A").catch(()=>[] as string[]),
    Deno.resolveDns(host,"AAAA").catch(()=>[] as string[])
  ]);
  if(!a.length && !aaaa.length) throw new Error("Could not verify the website's public DNS address.");
  if(a.some(ip=>!isPublicIpv4(ip)) || aaaa.some(ip=> {
    const normalized=ip.toLowerCase();
    return normalized==="::1" || normalized==="::" || normalized.startsWith("fc")
      || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9")
      || normalized.startsWith("fea") || normalized.startsWith("feb") || normalized.startsWith("2001:db8")
      || normalized.startsWith("::ffff:");
  })) throw new Error("Private or reserved website addresses are not permitted.");
}
async function fetchPage(url: URL): Promise<{html:string;finalUrl:string;httpStatus:number}> {
  const response = await fetch(url.toString(), {
    redirect: "error", signal: AbortSignal.timeout(12000),
    headers: { "Accept": "text/html", "User-Agent": "AIDetector-AEO-Audit/1.0" }
  });
  if (!response.ok) throw new Error("Website fetch returned HTTP " + response.status);
  if (!response.headers.get("content-type")?.toLowerCase().includes("text/html")) throw new Error("Target URL did not return HTML.");
  const length = Number(response.headers.get("content-length") || 0);
  if (length > 750000) throw new Error("Website HTML exceeds analysis size limit.");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Website returned no HTML.");
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      total += value.length;
      if (total > 750000) { await reader.cancel(); throw new Error("Website HTML exceeds analysis size limit."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total);
  let offset=0;
  for(const chunk of chunks){ bytes.set(chunk,offset); offset+=chunk.length; }
  return {html:new TextDecoder().decode(bytes),finalUrl:url.toString(),httpStatus:response.status};
}
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", {headers:corsHeaders});
  return withBillingGuard(req, {featureSlug:"seo_assistant",corsHeaders}, async (ctx) => {
    try {
      const raw=String(ctx.body.domain_url || "").trim();
      if (!raw) throw new Error("Enter a domain or URL.");
      const url=validateUrl(raw);
      await verifyPublicDns(url.hostname);
      const {html,finalUrl,httpStatus}=await fetchPage(url);
      const visible=textOnly(html);
      const heading1=matches(html,/<h1\b/gi);
      const heading2=matches(html,/<h2\b/gi);
      const questions=matches(visible, /\b(?:what|why|how|when|where|who|can|does|is|are)\b[^.!?]{5,100}\?/gi);
      const faq=/FAQPage/i.test(html);
      const jsonLd=matches(html,/<script[^>]*type=["']application\/ld\+json["'][^>]*>/gi);
      const schemaTypes=[...html.matchAll(/["']@type["']\s*:\s*["']([^"']+)/gi)].map(x=>x[1]).slice(0,30);
      const title=/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]?.trim() || "";
      const description=/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)/i.exec(html)?.[1] || "";
      const canonical=/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)/i.exec(html)?.[1] || "";
      const robotsNoindex=/<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
      const hasAuthor=/(rel=["']author|name=["']author|\/author\/|about the author)/i.test(html);
      const hasTrust=/(\/contact\b|contact us|privacy policy|\/about\b|about us)/i.test(html);
      const hasDate=/(datePublished|dateModified|<time\b|published on|updated on)/i.test(html);
      const hasSources=/(<blockquote\b|<cite\b|href=["']https?:\/\/[^"']+)/i.test(html);
      const wordCount=visible.split(/\s+/).filter(Boolean).length;
      const question_coverage_score=score([questions>0,questions>2,heading2>1,faq,wordCount>350]);
      const entity_coverage_score=score([heading1===1,heading2>0,title.length>15,description.length>50,wordCount>250]);
      const faq_quality_score=score([questions>=2,questions>=4,faq,/(acceptedAnswer|itemtype=["'][^"']*Question)/i.test(html)]);
      const eeat_score=score([hasAuthor,hasTrust,hasDate,hasSources,wordCount>500]);
      const structured_data_score=score([jsonLd>0,schemaTypes.length>0,faq,canonical.length>0]);
      const trust_signals_score=score([url.protocol==="https:",hasTrust,hasAuthor,canonical.length>0,!robotsNoindex]);
      const overall_aeo_score=Math.round(question_coverage_score*.2+entity_coverage_score*.15+faq_quality_score*.15+eeat_score*.25+structured_data_score*.15+trust_signals_score*.1);
      const checks=[
        {check:"Heading hierarchy",pass:heading1===1 && heading2>0,evidence:`${heading1} H1 and ${heading2} H2 headings`},
        {check:"Question-led content",pass:questions>=2,evidence:`${questions} visible question sentences`},
        {check:"FAQ structured data",pass:faq,evidence:faq?"FAQPage markup detected":"No FAQPage markup found"},
        {check:"Structured data",pass:jsonLd>0,evidence:`${jsonLd} JSON-LD blocks`},
        {check:"Metadata",pass:title.length>0 && description.length>0,evidence:`Title: ${title.length} chars; description: ${description.length} chars`},
        {check:"Canonical",pass:canonical.length>0,evidence:canonical || "Missing canonical"},
        {check:"Indexable meta",pass:!robotsNoindex,evidence:robotsNoindex?"Noindex meta detected":"No noindex meta detected"},
        {check:"Trust signals",pass:hasTrust,evidence:hasTrust?"Contact/about/privacy references found":"Not detected in returned HTML"},
        {check:"Author attribution",pass:hasAuthor,evidence:hasAuthor?"Author signal found":"Not detected in returned HTML"}
      ];
      const missing_questions=checks.filter(c=>!c.pass).map(c=>({q:c.check,vol:null,evidence:c.evidence}));
      const aeo_data={method:"html_observation_v1",disclaimer:"Scores are heuristic HTML-readiness checks, not verified AI-platform visibility, rankings, traffic, or search volume.",checked_url:finalUrl,http_status:httpStatus,word_count:wordCount,checks,schema_types:schemaTypes,platforms:null,missing_questions,missing_entities:[]};
      const {data:report,error}=await ctx.supabase.from("aeo_reports").insert({
        user_id:ctx.userId,project_id:ctx.body.project_id || null,domain_url:finalUrl,status:"Completed",
        overall_aeo_score,question_coverage_score,entity_coverage_score,faq_quality_score,eeat_score,
        structured_data_score,trust_signals_score,missing_questions_count:missing_questions.length,missing_entities_count:0,aeo_data
      }).select().single();
      if(error) throw new Error("Unable to save AEO report.");
      return new Response(JSON.stringify(report),{headers:{...corsHeaders,"Content-Type":"application/json"}});
    } catch(e) {
      return new Response(JSON.stringify({success:false,error:e instanceof Error?e.message:"AEO audit failed"}),{status:422,headers:{...corsHeaders,"Content-Type":"application/json"}});
    }
  });
});
