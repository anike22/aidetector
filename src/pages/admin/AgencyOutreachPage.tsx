import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/db/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Prospect = { id: string; email: string; first_name: string | null; organization: string; website: string | null; source_url: string | null; status: string; created_at: string };
const SUBJECT = "AI-Powered Content Intelligence Solution for Growing Agencies";
const parseCsv = (text: string) => {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' && quoted && text[i + 1] === '"') { cell += '"'; i++; }
    else if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  row.push(cell.trim()); if (row.some(Boolean)) rows.push(row);
  if (rows.length < 2) throw new Error("CSV needs a header row and at least one prospect.");
  const headers = rows.shift()!.map(v => v.toLowerCase().replace(/[\s-]+/g, "_"));
  return rows.map(values => Object.fromEntries(headers.map((h, i) => [h, values[i] || ""])));
};
const emailHtml = (firstName: string, agency: string) => `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:auto;color:#334155;line-height:1.65">
 <div style="border-bottom:1px solid #e5e7eb;padding:16px 0 18px"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td><img src="https://www.aidetector.cx/favicon.png" width="42" height="42" style="display:block;border-radius:9px" alt="AIDetector.cx"></td><td style="padding-left:12px"><b style="font-size:19px;color:#0f172a">AIDetector<span style="color:#079bd3">.cx</span></b><div style="font-size:10px;color:#94a3b8;letter-spacing:1px">AI CONTENT INTEGRITY PLATFORM</div></td></tr></table></div>
 <div style="padding:26px 0">
 <p>Hi ${firstName || "there"},</p>
 <p>I’m reaching out from <strong>AIDetector.cx</strong>, an AI Content Integrity Platform built to help agencies improve content quality, verify originality and manage AI-assisted content more confidently.</p>
 <p>We understand that agencies working with multiple clients need reliable tools without the expense and complexity of managing several separate subscriptions.</p>
 <p>That’s why we’re introducing our <strong>Agency Unlimited Access Plan</strong>.</p>
 <p>With AIDetector.cx, your agency can access tools designed to support its content workflow, including:</p>
 <ul><li><strong>AI Content Detection:</strong> Identify potential AI-generated content.</li><li><strong>Plagiarism Checker:</strong> Check content originality.</li><li><strong>SEO Assistant:</strong> Analyze and improve content for search performance.</li><li><strong>AI Humanizer:</strong> Refine AI-assisted writing.</li><li><strong>Agency Workspace:</strong> Organize team members and manage collaboration.</li></ul>
 <p><strong>Flexible agency pricing</strong></p>
 <p>We offer one-month agency access with negotiable pricing based on your agency’s requirements. Rather than forcing every agency into the same package, we’re open to discussing a suitable arrangement.</p>
 <p>We also offer a 7-day agency workspace trial for eligible new agencies to explore the collaboration features.</p>
 <p>Would you be open to a brief conversation about how AIDetector.cx could support ${agency || "your agency"}’s content operations?</p>
 <p><a href="https://www.aidetector.cx/agency-unlimited" style="display:inline-block;background:#079bd3;color:#fff;text-decoration:none;padding:11px 18px;border-radius:7px;font-weight:bold">Explore the agency offer</a></p>
 <p>Best regards,<br><strong>AIDetector.cx Partnerships Team</strong><br><a href="mailto:partnerships@aidetector.cx">partnerships@aidetector.cx</a><br><a href="https://www.aidetector.cx">www.aidetector.cx</a><br>+2348167111394</p>
 <p style="font-size:12px;color:#94a3b8">You’re receiving this business outreach because AIDetector.cx may be relevant to your agency. If you do not wish to receive further outreach, reply with “unsubscribe”.</p>
 </div></div>`;
export default function AgencyOutreachPage() {
  const { profile, loading } = useAuth();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState({ email: "", first_name: "", organization: "", website: "", source_url: "" });
  const [preview, setPreview] = useState<Prospect | null>(null);
  const [loaded, setLoaded] = useState(false);
  const load = async () => {
    const { data, error } = await supabase.from("agency_outreach_prospects").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) throw error;
    setProspects((data || []) as Prospect[]); setLoaded(true);
  };
  useEffect(() => { if (!loading && profile?.role === "admin" && !loaded) void load().catch(e => toast.error(e.message)); }, [loading, profile?.role, loaded]);
  const insertRows = async (rows: any[]) => {
    const cleaned = rows.map(r => {
      const email = String(r.email || "").trim().toLowerCase();
      const organization = String(r.organization || r.agency || "").trim();
      const source = String(r.source_url || r.website || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email: " + email);
      if (!organization) throw new Error("Every prospect needs an organization/agency name.");
      if (source && !/^https:\/\//i.test(source)) throw new Error("Website/source URLs must use HTTPS.");
      return { email, organization, first_name: String(r.first_name || r.firstname || r.contact_name || "").trim().slice(0,120) || null, website: String(r.website || "").trim() || null, source_url: source || null };
    });
    const { data: { user } } = await supabase.auth.getUser();
    const payload = cleaned.map(({created_by, ...r}) => ({...r, created_by: user?.id}));
    const { data, error } = await supabase.from("agency_outreach_prospects").upsert(payload, { onConflict: "email", ignoreDuplicates: true }).select("id");
    if (error) throw error;
    await load();
    return data?.length || 0;
  };
  const importCsv = async () => {
    if (!file) return;
    setBusy(true);
    try { const rows = parseCsv(await file.text()); const count = await insertRows(rows); toast.success(`Imported ${count} new agency prospects as drafts.`); setFile(null); }
    catch (e) { toast.error(e instanceof Error ? e.message : "CSV import failed"); }
    finally { setBusy(false); }
  };
  const addManual = async () => {
    setBusy(true);
    try { const count = await insertRows([manual]); toast.success(count ? "Prospect added as a draft." : "This email is already in the agency prospect list."); setManual({email:"",first_name:"",organization:"",website:"",source_url:""}); }
    catch(e) { toast.error(e instanceof Error ? e.message : "Could not add prospect"); }
    finally { setBusy(false); }
  };
  if (loading) return <div className="p-8">Checking access…</div>;
  if (profile?.role !== "admin") return <div className="p-8">Administrator access required.</div>;
  return <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
    <Link to="/admin" className="text-primary">← Admin dashboard</Link>
    <header><h1 className="text-2xl font-bold">Agency Prospect Outreach</h1><p className="text-muted-foreground">Dedicated agency prospect list and branded email preview. Affiliate prospects and queues are not modified.</p></header>
    <Card><CardHeader><CardTitle>Sending identity</CardTitle><CardDescription>Locked to the existing Google Gmail integration for this campaign.</CardDescription></CardHeader><CardContent className="flex flex-wrap items-center gap-3"><Badge>partnerships@aidetector.cx</Badge><Badge variant="outline">Gmail only</Badge><Badge variant="outline">Sending paused — drafts only</Badge><p className="w-full text-sm text-muted-foreground">No emails are sent from this prospect uploader. The existing affiliate outreach queue remains separate.</p></CardContent></Card>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Upload prospects (CSV)</CardTitle><CardDescription>Required columns: email, organization. Optional: first_name, website, source_url.</CardDescription></CardHeader><CardContent className="space-y-3">
        <Input type="file" accept=".csv,text/csv" onChange={e=>setFile(e.target.files?.[0] || null)} />
        <p className="text-xs text-muted-foreground">Duplicate email addresses are skipped. Rows are saved as drafts only.</p>
        <Button disabled={!file || busy} onClick={importCsv}>{busy ? "Importing…" : "Import CSV prospects"}</Button>
        <details><summary className="cursor-pointer text-sm">CSV example</summary><pre className="mt-2 overflow-auto rounded bg-muted p-3 text-xs">email,first_name,organization,website,source_url{"\n"}jane@example.com,Jane,Example Agency,https://example.com,https://example.com/contact</pre></details>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Add one prospect</CardTitle></CardHeader><CardContent className="space-y-3">
        <Input placeholder="Contact email *" type="email" value={manual.email} onChange={e=>setManual({...manual,email:e.target.value})}/>
        <Input placeholder="First name" value={manual.first_name} onChange={e=>setManual({...manual,first_name:e.target.value})}/>
        <Input placeholder="Agency name *" value={manual.organization} onChange={e=>setManual({...manual,organization:e.target.value})}/>
        <Input placeholder="Agency website (HTTPS)" value={manual.website} onChange={e=>setManual({...manual,website:e.target.value})}/>
        <Input placeholder="Contact source URL (HTTPS)" value={manual.source_url} onChange={e=>setManual({...manual,source_url:e.target.value})}/>
        <Button disabled={busy || !manual.email || !manual.organization} onClick={addManual}>Add as draft</Button>
      </CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle>Agency email template</CardTitle><CardDescription>{SUBJECT}</CardDescription></CardHeader><CardContent className="space-y-3">
      <div className="rounded border bg-white p-2"><iframe title="Agency email template preview" sandbox="" srcDoc={emailHtml("Jane", "Example Agency")} className="h-[620px] w-full bg-white"/></div>
      <p className="text-xs text-muted-foreground">Uses the AIDetector.cx logo/header treatment from the existing affiliate template. The agency offer, flexible pricing and 7-day workspace trial wording are preserved.</p>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Prospect list ({prospects.length})</CardTitle><CardDescription>Records are stored separately from affiliate outreach.</CardDescription></CardHeader><CardContent className="space-y-2">
      {prospects.length === 0 ? <p className="text-sm text-muted-foreground">No agency prospects loaded yet.</p> : prospects.map(p=><div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded border p-3"><div><div className="font-medium">{p.organization}</div><div className="text-sm text-muted-foreground">{p.first_name || "No contact name"} · {p.email}</div></div><div className="flex items-center gap-2"><Badge variant="outline">{p.status}</Badge><Button variant="outline" size="sm" onClick={()=>setPreview(p)}>Preview</Button></div></div>)}
    </CardContent></Card>
    {preview && <Card><CardHeader><CardTitle>Personalized preview: {preview.organization}</CardTitle></CardHeader><CardContent><p className="mb-2 text-sm">To: {preview.email}</p><p className="mb-2 text-sm">Subject: {SUBJECT}</p><iframe title="Personalized agency email" sandbox="" srcDoc={emailHtml(preview.first_name || "there", preview.organization)} className="h-[620px] w-full rounded border bg-white"/><Button variant="outline" onClick={()=>setPreview(null)} className="mt-3">Close preview</Button></CardContent></Card>}
  </main>;
}
