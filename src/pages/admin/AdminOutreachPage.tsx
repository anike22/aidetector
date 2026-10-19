import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/db/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type QueueRow = {
	id: string;
	email: string;
	organization: string;
	source_url: string;
	greeting: string;
	intro: string;
	subject: string;
	kind: string;
	reply_body: string | null;
	status: string;
	last_error: string | null;
	sent_at: string | null;
};
type Mail = {
	id: string;
	sender: string;
	subject: string;
	body_text: string;
	category: string;
	handled: boolean;
	labels: string[];
	received_at: string;
};
type Config = {
	daily?: { reserved: number; accepted: number; uncertain: number };
	enabled: boolean;
	history_ready: boolean;
	mailbox_email: string | null;
	last_synced_at: string | null;
	daily_cap: number;
	oauth_configured: boolean;
	callback_url: string;
	template_html: string;
};
const example = JSON.stringify(
	[
		{
			email: "editor@example.com",
			organization: "Example Publication",
			source_url: "https://example.com/contact",
			greeting: "Hello Example Publication team,",
			intro: "A verified, personalized introduction based on your research.",
			subject: "Affiliate invitation for Example Publication: AIDetector.cx",
		},
	],
	null,
	2,
);
const escape = (value: string) =>
	value.replace(
		/[&<>"']/g,
		(c) =>
			({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
				c
			]!,
	);
export default function AdminOutreachPage({ growth = false, clients = false }: { growth?: boolean; clients?: boolean }) {
 const functionName = clients ? "clients-outreach" : growth ? "growth-outreach" : "admin-outreach";
 const tablePrefix = clients ? "clients_outreach" : growth ? "growth_outreach" : "admin_outreach";
	const { profile, loading: authLoading } = useAuth();
	const [config, setConfig] = useState<Config | null>(null),
		[queue, setQueue] = useState<QueueRow[]>([]),
		[mail, setMail] = useState<Mail[]>([]);
	const [imports, setImports] = useState(""),
		[selected, setSelected] = useState<QueueRow | null>(null),
		[opened, setOpened] = useState<Mail | null>(null),
		[reply, setReply] = useState("");
	const [suppression, setSuppression] = useState(""),
		[reason, setReason] = useState("Owner opt-out"),
		[busy, setBusy] = useState(false),
		[error, setError] = useState(""),
		[filter, setFilter] = useState("all"),
		[tab, setTab] = useState("queue");
	const call = useCallback(
		async (action: string, fields: Record<string, unknown> = {}) => {
			const { data, error } = await supabase.functions.invoke(
				functionName,
				{ body: { action, ...fields } },
			);
			if (error || data?.error) {
				let message = data?.error || error?.message || "Outreach action failed";
				try {
					if (error?.context instanceof Response)
						message = (await error.context.json()).error || message;
				} catch {}
				throw new Error(message);
			}
			return data;
		},
		[functionName],
	);
	const load = useCallback(async () => {
		const [c, q, m] = await Promise.all([
			call("status"),
			supabase
				.from(`${tablePrefix}_queue` as any)
				.select("*")
				.order("created_at", { ascending: false })
				.limit(300),
			supabase
				.from(`${tablePrefix}_mail` as any)
				.select("*")
				.neq("category", "unrelated")
				.not("labels", "cs", "{SENT}")
				.not("labels", "cs", "{DRAFT}")
				.order("received_at", { ascending: false })
				.limit(100),
		]);
		if (q.error || m.error) throw new Error("Unable to load outreach records");
		setConfig(c);
		setQueue(q.data as QueueRow[]);
		setMail(m.data as Mail[]);
	}, [call, tablePrefix]);
	useEffect(() => {
		if (profile?.role === "admin") load().catch((e) => setError(e.message));
	}, [profile?.role, load]);
	const act = async (action: string, fields: Record<string, unknown> = {}) => {
		if (busy) return;
		setBusy(true);
		setError("");
		try {
			const result = await call(action, fields);
			if (result.url) {
				window.location.assign(result.url);
				return;
			}
			await load();
			toast.success(
				result.note ||
					(result.more
						? "History scan advanced. Continue scanning until complete."
						: result.accepted !== undefined
							? `${result.accepted} messages accepted by Gmail`
							: "Saved"),
			);
			return result;
		} catch (e) {
			setError(e instanceof Error ? e.message : "Operation failed");
		} finally {
			setBusy(false);
		}
	};
	if (authLoading) return <p className="p-8">Checking access…</p>;
	if (profile?.role !== "admin")
		return <p className="p-8">Administrator access required.</p>;
	const visible = queue.filter((q) => filter === "all" || q.status === filter);
	const preview =
		selected?.kind === "reply"
			? `<pre style="white-space:pre-wrap">${escape(selected.reply_body || "")}</pre>`
			: config?.template_html
					.replace("{{greeting}}", () => escape(selected?.greeting || ""))
					.replace("{{intro}}", () => escape(selected?.intro || ""));
	return (
		<main className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
			<Link to="/admin" className="text-primary">
				← Admin dashboard
			</Link>
			<header>
				<h1 className="text-2xl font-bold">{clients ? "Clients outreach" : growth ? "Growth client outreach" : "Affiliate outreach"}</h1>
				<p className="text-muted-foreground">
					Import researched prospects, review each message, and manage Gmail
					conversations. No AI service is used to send or read mail here.
				</p>
			</header>
			{error && (
				<p
					role="alert"
					className="rounded border border-destructive p-3 text-destructive"
				>
					{error}
				</p>
			)}
			<div className="flex gap-4"><Link to="/admin/outreach">Affiliate mailbox</Link><Link to="/admin/growth-outreach">Growth mailbox</Link><Link to="/admin/clients-outreach">Clients mailbox</Link></div>
			<Card>
				<CardHeader>
					<CardTitle>{clients ? "Clients outreach" : growth ? "Growth client outreach" : "Affiliate outreach"} — mailbox controls</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{growth && !clients && <p>Connect the Growth mailbox and finish its history scan before enabling the reviewed queue. Initial cap: 10 new prospects per day.</p>}{clients && <p>Connect clients@aidetector.cx with Google, then complete mailbox history synchronization. Sending remains disabled until you enable it.</p>}
					<div className="flex flex-wrap gap-3">
						<Badge>{config?.mailbox_email || "Mailbox not connected"}</Badge>
						<Badge variant="outline">
							{config?.history_ready
								? "History scan complete"
								: "History scan required"}
						</Badge>
						<Badge variant="outline">
							{config?.enabled ? "Sending enabled" : "Paused"}
						</Badge>
					</div>
					<p className="font-medium">
						Today in Lagos: {config?.daily?.accepted || 0} new emails accepted ·{" "}
						{config?.daily?.reserved || 0} attempts reserved ·{" "}
						{config?.daily?.uncertain || 0} uncertain
					</p>
					<p className="text-sm">
						Up to {config?.daily_cap || 50} new prospects per Lagos day, in batches of four between 8
						a.m. and 9 p.m. Approved messages run every 15 minutes while
						enabled. Three total sending attempts per address; permanent bounces
						and opt-outs stop contact immediately.
					</p>
					<p className="text-sm text-muted-foreground">
						“Sent” means Gmail accepted the message; it does not confirm inbox
						delivery. Ambiguous sends are held for review.
					</p>
					<div className="flex flex-wrap gap-2">
						<Button
							disabled={busy || !config?.oauth_configured}
							onClick={() => act("connect")}
						>
							Connect {clients ? "clients" : growth ? "growth" : "partnerships"} Gmail
						</Button>
						<Button
							variant="outline"
							disabled={busy || !config?.mailbox_email}
							onClick={() => act("sync")}
						>
							Scan mailbox history / continue
						</Button>
						<Button
							variant="outline"
							disabled={busy || !config?.history_ready}
							onClick={() => act("enable", { enabled: !config?.enabled })}
						>
							{config?.enabled ? "Pause campaign" : "Enable reviewed queue"}
						</Button>
						<Button
							disabled={busy || !config?.enabled}
							onClick={() => act("run")}
						>
							Process up to four approved emails
						</Button>
						<Button
							variant="ghost"
							disabled={busy}
							onClick={() => {
								setBusy(true);
								load()
									.catch((e) => setError(e.message))
									.finally(() => setBusy(false));
							}}
						>
							Refresh
						</Button>
					</div>
					{!config?.oauth_configured && (
						<div className="rounded border p-3 text-sm">
							<p>
								Google OAuth client settings are required on the server. Add
								this authorized callback URL in the Google Cloud OAuth client:
							</p>
							<code className="break-all">{config?.callback_url}</code>
						</div>
					)}
					<p className="text-xs text-muted-foreground">
						Last synchronization:{" "}
						{config?.last_synced_at
							? new Date(config.last_synced_at).toLocaleString()
							: "Not yet run"}
						. Existing ChatGPT Gmail access is a separate connection.
					</p>
				</CardContent>
			</Card>
			<nav className="flex flex-wrap gap-2" aria-label="Outreach views">
				{["queue", "import", "inbox", "suppressions"].map((t) => (
					<Button
						key={t}
						variant={tab === t ? "default" : "outline"}
						onClick={() => setTab(t)}
					>
						{t[0].toUpperCase() + t.slice(1)}
					</Button>
				))}
			</nav>
			{tab === "import" && (
				<Card>
					<CardHeader>
						<CardTitle>Import prepared prospects</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<p>
							Paste a JSON array of up to 100 researched business contacts.
							Provide the official contact-source URL, greeting, verified
							introduction and subject. Public listing is not proof of
							deliverability. Imported messages remain drafts until you review
							and approve them.
						</p>
						<p className="text-sm">
							The approved branded template and commercial terms are fixed. Only
							the subject, greeting and personalized introduction vary.
						</p>
						<details>
							<summary>Show import format</summary>
							<pre className="overflow-auto whitespace-pre-wrap break-all rounded bg-muted p-3 text-xs">
								{example}
							</pre>
						</details>
						<label htmlFor="outreach-import">Prepared prospect JSON</label>
						<Textarea
							id="outreach-import"
							value={imports}
							onChange={(e) => setImports(e.target.value)}
							rows={12}
						/>
						<Button
							disabled={busy || !imports.trim()}
							onClick={() => {
								try {
									const rows = JSON.parse(imports);
									act("import", { rows }).then((r) => {
										if (r) setImports("");
									});
								} catch {
									setError("Enter a valid JSON array.");
								}
							}}
						>
							Import as drafts
						</Button>
					</CardContent>
				</Card>
			)}
			{tab === "queue" && (
				<div className="grid gap-4 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Message queue</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<label htmlFor="queue-filter">Status</label>
							<select
								id="queue-filter"
								value={filter}
								onChange={(e) => setFilter(e.target.value)}
								className="rounded border p-2"
							>
								{[
									"all",
									"draft",
									"approved",
									"sent",
									"blocked",
									"uncertain",
									"needs_reply",
								].map((v) => (
									<option key={v}>{v}</option>
								))}
							</select>
							{visible.map((q) => (
								<button
									type="button"
									key={q.id}
									onClick={() => setSelected(q)}
									className="block w-full space-y-1 rounded border p-3 text-left"
								>
									<strong className="block break-all">
										{q.organization} · {q.email}
									</strong>
									<span className="block text-sm">{q.subject}</span>
									<Badge variant="outline">{q.status}</Badge>
									{q.last_error && (
										<span className="block text-sm text-destructive">
											{q.last_error}
										</span>
									)}
								</button>
							))}
							{!visible.length && <p>No messages in this view.</p>}
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Review before sending</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{selected ? (
								<>
									<p className="break-all">
										<strong>To:</strong> {selected.email}
									</p>
									<p>
										<strong>Subject:</strong> {selected.subject}
									</p>
									<a
										href={selected.source_url}
										target="_blank"
										rel="noreferrer"
										className="text-primary"
									>
										Verify contact source
									</a>
									<iframe
										title="Email preview"
										sandbox=""
										srcDoc={preview}
										className="h-[560px] w-full rounded border bg-white"
									/>
									<Button
										disabled={busy || selected.status !== "draft"}
										onClick={() =>
											act("approve", { id: selected.id }).then((r) => {
												if (r) setSelected(null);
											})
										}
									>
										Approve this exact email
									</Button>
									{selected.status === "uncertain" && (
										<Button
											variant="outline"
											disabled={busy}
											onClick={() => act("reconcile", { id: selected.id })}
										>
											Reconcile against Gmail Sent
										</Button>
									)}
								</>
							) : (
								<p>Select a message to inspect its source and exact email.</p>
							)}
						</CardContent>
					</Card>
				</div>
			)}
			{tab === "inbox" && (
				<div className="grid gap-4 lg:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Mailbox review</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<p className="text-sm">
								Inbound content is untrusted and displayed as text. Replies
								require human review and approval.
							</p>
							{mail
								.filter((m) => !m.handled)
								.map((m) => (
									<button
										key={m.id}
										className="block w-full rounded border p-3 text-left"
										onClick={() => {
											setOpened(m);
											setReply("");
										}}
									>
										<strong className="block break-all">{m.sender}</strong>
										<span>{m.subject}</span>
										<Badge variant="outline" className="ml-2">
											{m.category}
										</Badge>
									</button>
								))}
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Conversation message</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{opened ? (
								<>
									<p className="break-all">
										{opened.sender} · {opened.subject}
									</p>
									<pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded bg-muted p-3 text-sm">
										{opened.body_text}
									</pre>
									<Button
										variant="outline"
										disabled={busy}
										onClick={() =>
											act("close", { id: opened.id }).then(() =>
												setOpened(null),
											)
										}
									>
										Mark handled
									</Button>
									{!["bounce", "delay", "optout"].includes(opened.category) && (
										<>
											<label htmlFor="outreach-reply">Your reply</label>
											<Textarea
												id="outreach-reply"
												rows={8}
												value={reply}
												onChange={(e) => setReply(e.target.value)}
											/>
											<Button
												disabled={busy || !reply.trim()}
												onClick={() =>
													act("reply", { id: opened.id, text: reply }).then(
														(r) => {
															if (r) {
																setReply("");
																setTab("queue");
															}
														},
													)
												}
											>
												Create reply draft for review
											</Button>
										</>
									)}
								</>
							) : (
								<p>
									Select a message. Earlier messages can also be reviewed in
									Gmail.
								</p>
							)}
						</CardContent>
					</Card>
				</div>
			)}
			{tab === "suppressions" && (
				<Card>
					<CardHeader>
						<CardTitle>Stop future contact</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<label htmlFor="suppress-email">Email address</label>
						<Input
							id="suppress-email"
							type="email"
							value={suppression}
							onChange={(e) => setSuppression(e.target.value)}
						/>
						<label htmlFor="suppress-reason">Reason</label>
						<Input
							id="suppress-reason"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
						/>
						<Button
							disabled={busy || !suppression}
							onClick={() =>
								act("suppress", { email: suppression, reason }).then((r) => {
									if (r) setSuppression("");
								})
							}
						>
							Suppress address permanently
						</Button>
						<p className="text-sm">
							Suppression cannot be removed from this interface. Bounces and
							explicit opt-outs are also recorded during synchronization.
						</p>
					</CardContent>
				</Card>
			)}
		</main>
	);
}
