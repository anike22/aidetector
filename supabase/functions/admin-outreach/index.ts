import { createClient } from "npm:@supabase/supabase-js@2.103.1";
import {
	SENDER,
	normalizeEmail,
	addresses,
	renderTemplate,
	base64url,
	textBody,
	category,
	escapeHtml,
	mime,
} from "./core.ts";
import { template } from "./template.ts";
const root = Deno.env.get("SUPABASE_URL")!;
const db = createClient(root, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
	auth: { persistSession: false, autoRefreshToken: false },
});
const callback = root + "/functions/v1/admin-outreach?action=callback";
const origin = "https://www.aidetector.cx";
const cors = {
	"Access-Control-Allow-Origin": origin,
	"Access-Control-Allow-Headers":
		"authorization,apikey,content-type,x-client-info",
	"Access-Control-Allow-Methods": "POST,OPTIONS",
};
const json = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data), {
		status,
		headers: { ...cors, "Content-Type": "application/json" },
	});
async function checked(result: any) {
	const { data, error } = await result;
	if (error) throw new Error("Database operation failed");
	return data;
}
async function hash(value: string) {
	return [
		...new Uint8Array(
			await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
		),
	]
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}
async function credentials(action: string, data: unknown = {}) {
	return checked(
		db.rpc("outreach_credentials", { p_action: action, p_data: data }),
	);
}
async function accessToken() {
	const saved = await credentials("get");
	if (!saved) throw new Error("Connect the partnerships Gmail mailbox first");
	if (saved.expires_at > Date.now() + 60000) return saved.access_token;
	const res = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		body: new URLSearchParams({
			client_id: Deno.env.get("GOOGLE_CLIENT_ID") || "",
			client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
			refresh_token: saved.refresh_token,
			grant_type: "refresh_token",
		}),
	});
	const value = await res.json();
	if (!res.ok || !value.access_token)
		throw new Error("Gmail authorization expired. Reconnect the mailbox");
	await credentials("set", {
		...saved,
		access_token: value.access_token,
		expires_at: Date.now() + value.expires_in * 1000,
	});
	return value.access_token;
}
async function gmail(path: string, token: string, options: RequestInit = {}) {
	const res = await fetch(
		"https://gmail.googleapis.com/gmail/v1/users/me/" + path,
		{
			...options,
			signal: AbortSignal.timeout(20000),
			headers: {
				Authorization: "Bearer " + token,
				"Content-Type": "application/json",
				...options.headers,
			},
		},
	);
	if (!res.ok)
		throw new Error(
			"Gmail request rejected (" +
				res.status +
				"). Review authorization or quota before retrying",
		);
	return res.json();
}
async function settings() {
	return checked(
		db.from("admin_outreach_settings").select("*").eq("id", true).single(),
	);
}
async function sync(token: string, initial = false) {
	const config = await settings();
	let page: any;
	let entries: any[];
	let snapshot = config.history_snapshot;
	if (initial) {
		if (!config.sync_cursor) {
			snapshot = (await gmail("profile", token)).historyId;
			await checked(
				db
					.from("admin_outreach_settings")
					.update({ history_snapshot: snapshot, history_ready: false })
					.eq("id", true),
			);
		}
		const params = new URLSearchParams({
			maxResults: "20",
			includeSpamTrash: "true",
		});
		if (config.sync_cursor) params.set("pageToken", config.sync_cursor);
		page = await gmail("messages?" + params, token);
		entries = page.messages || [];
	} else {
		if (!config.gmail_history_id) return sync(token, true);
		const params = new URLSearchParams({
			startHistoryId: config.gmail_history_id,
			maxResults: "20",
			historyTypes: "messageAdded",
		});
		if (config.delta_cursor) params.set("pageToken", config.delta_cursor);
		try {
			page = await gmail("history?" + params, token);
		} catch (error) {
			if (error instanceof Error && error.message.includes("(404)")) {
				await checked(
					db
						.from("admin_outreach_settings")
						.update({
							history_ready: false,
							sync_cursor: null,
							delta_cursor: null,
							gmail_history_id: null,
						})
						.eq("id", true),
				);
				return sync(token, true);
			}
			throw error;
		}
		const ids = new Set<string>();
		for (const history of page.history || [])
			for (const added of history.messagesAdded || [])
				ids.add(added.message.id);
		entries = [...ids].map((id) => ({ id }));
	}
	for (const entry of entries) {
		const existing = await checked(
			db
				.from("admin_outreach_mail")
				.select("id")
				.eq("id", entry.id)
				.maybeSingle(),
		);
		if (existing) continue;
		const m = await gmail("messages/" + entry.id + "?format=full", token);
		const h = (name: string) =>
			(m.payload?.headers || [])
				.filter((v: any) => v.name.toLowerCase() === name)
				.map((v: any) => v.value)
				.join(", ");
		const sender = addresses(h("from"))[0] || "";
		const recipients = addresses(h("to") + "," + h("cc") + "," + h("bcc"));
		const body = textBody(m.payload).slice(0, 50000),
			classified = category(sender, h("subject"), body),
			labels = m.labelIds || [];
		const relevant =
			/aidetector|affiliate|partnership|evaluation|outreach/i.test(
				h("subject"),
			) || classified !== "message";
		const kind = relevant ? classified : "unrelated";
		await checked(
			db
				.from("admin_outreach_mail")
				.upsert({
					id: m.id,
					thread_id: m.threadId,
					sender,
					recipients,
					subject: h("subject").slice(0, 500),
					body_text: relevant ? body : "",
					labels,
					rfc_message_id: h("message-id"),
					received_at: new Date(Number(m.internalDate)).toISOString(),
					category: kind,
				}),
		);
		if (labels.includes("SENT") || labels.includes("DRAFT")) {
			for (const email of recipients.filter((e) => e !== SENDER)) {
				const sent = await checked(
					db
						.from("admin_outreach_mail")
						.select("id")
						.contains("recipients", [email])
						.contains("labels", ["SENT"]),
				);
				const drafts = await checked(
					db
						.from("admin_outreach_mail")
						.select("id")
						.contains("recipients", [email])
						.contains("labels", ["DRAFT"]),
				);
				await checked(
					db
						.from("admin_outreach_contacts")
						.upsert({
							email,
							prior_sent: sent.length,
							prior_draft: drafts.length > 0,
						}),
				);
			}
		} else if (sender !== SENDER) {
			// Inbound content is display-only. It never changes templates, terms, credentials or approval.
			const matching = await checked(
				db
					.from("admin_outreach_queue")
					.select("email")
					.eq("gmail_thread_id", m.threadId),
			);
			const targets =
				kind === "bounce" || kind === "delay"
					? addresses(
							body.match(
								/(?:Final-Recipient:|Original-Recipient:|delivered to|message to)[^\n]+/i,
							)?.[0] || "",
						).concat(matching.map((q: any) => q.email))
					: [sender];
			if (kind === "bounce" || kind === "optout")
				for (const email of [...new Set(targets)].filter(
					(e) => e && e !== SENDER,
				))
					await checked(
						db
							.from("admin_outreach_suppressions")
							.upsert({ email, reason: kind }),
					);
			const emails = targets.filter((e) => e && e !== SENDER);
			if (emails.length)
				await checked(
					db
						.from("admin_outreach_queue")
						.update({
							status:
								kind === "bounce" || kind === "optout"
									? "blocked"
									: "needs_reply",
							last_error:
								kind === "delay"
									? "Delivery delay: do not send another copy"
									: "Incoming mail requires review",
						})
						.in("email", emails)
						.in("status", ["approved", "sent", "draft"]),
				);
		}
	}
	await checked(
		db
			.from("admin_outreach_settings")
			.update({
				last_synced_at: new Date().toISOString(),
				...(initial
					? {
							sync_cursor: page.nextPageToken || null,
							history_ready: !page.nextPageToken,
							...(!page.nextPageToken
								? { gmail_history_id: snapshot, delta_cursor: null }
								: {}),
						}
					: {
							delta_cursor: page.nextPageToken || null,
							...(!page.nextPageToken
								? { gmail_history_id: page.historyId }
								: {}),
						}),
			})
			.eq("id", true),
	);
	return { processed: entries.length, more: !!page.nextPageToken };
}
async function dispatch(token: string) {
	const synchronized = await sync(token, false);
	if (synchronized.more)
		return {
			accepted: 0,
			note: "Mailbox synchronization is continuing. No messages were sent.",
		};
	let sent = 0;
	for (let n = 0; n < 4; n++) {
		const row = await checked(db.rpc("outreach_claim"));
		if (!row) break;
		let sending = false;
		try {
			// Recheck Gmail directly just before first contact: inbox, sent, spam/trash and drafts.
			const domain = row.email.split("@")[1];
			const shared = [
				"gmail.com",
				"outlook.com",
				"hotmail.com",
				"yahoo.com",
				"proton.me",
				"icloud.com",
			].includes(domain);
			const q =
				"in:anywhere {to:" +
				row.email +
				" from:" +
				row.email +
				(shared ? "" : " to:" + domain + " from:" + domain) +
				"}";
			const history = await gmail(
				"messages?" +
					new URLSearchParams({ q, maxResults: "1", includeSpamTrash: "true" }),
				token,
			);
			if (row.kind === "initial" && (history.messages || []).length)
				throw new Error(
					"Prior Gmail correspondence or draft found. Duplicate blocked",
				);
			if (row.kind === "reply") {
				const thread = await gmail(
					"threads/" + row.gmail_thread_id + "?format=metadata",
					token,
				);
				const latestIncoming = [...(thread.messages || [])]
					.reverse()
					.find((m: any) => !(m.labelIds || []).includes("SENT"));
				const latestId = (latestIncoming?.payload?.headers || []).find(
					(h: any) => h.name.toLowerCase() === "message-id",
				)?.value;
				if (latestId !== row.reply_message_id)
					throw new Error(
						"A newer conversation message requires review before replying",
					);
				if (
					!(thread.messages || []).some((m: any) =>
						(m.payload?.headers || []).some(
							(h: any) =>
								h.name.toLowerCase() === "from" &&
								addresses(h.value).includes(row.email),
						),
					)
				)
					throw new Error("Reply recipient does not match this conversation");
			}
			const html =
				row.kind === "reply"
					? "<div>" +
						escapeHtml(row.reply_body || "").replace(/\n/g, "<br>") +
						"</div>"
					: renderTemplate(template, row);
			const stop = await checked(
				db
					.from("admin_outreach_suppressions")
					.select("email")
					.eq("email", row.email)
					.maybeSingle(),
			);
			const latest = await settings();
			if (stop || !latest.enabled)
				throw new Error("Campaign paused or recipient suppressed");
			sending = true;
			const result = await gmail("messages/send", token, {
				method: "POST",
				body: JSON.stringify({
					raw: mime(row, html),
					...(row.gmail_thread_id ? { threadId: row.gmail_thread_id } : {}),
				}),
			});
			await checked(
				db
					.from("admin_outreach_queue")
					.update({
						status: "sent",
						gmail_message_id: result.id,
						gmail_thread_id: result.threadId,
						sent_at: new Date().toISOString(),
						last_error: null,
					})
					.eq("id", row.id),
			);
			await checked(
				db
					.from("admin_outreach_attempts")
					.update({ status: "accepted", gmail_message_id: result.id })
					.eq("queue_id", row.id)
					.eq("status", "reserved"),
			);
			sent++;
		} catch (error) {
			await checked(
				db
					.from("admin_outreach_queue")
					.update({
						status: sending ? "uncertain" : "blocked",
						last_error:
							error instanceof Error
								? error.message
								: "Send needs manual review",
					})
					.eq("id", row.id),
			);
			await checked(
				db
					.from("admin_outreach_attempts")
					.update({ status: sending ? "uncertain" : "blocked" })
					.eq("queue_id", row.id)
					.eq("status", "reserved"),
			);
			if (sending) {
				await checked(
					db
						.from("admin_outreach_settings")
						.update({ enabled: false })
						.eq("id", true),
				);
				break;
			}
		}
	}
	return { accepted: sent, note: "Accepted by Gmail is not proof of delivery" };
}
Deno.serve(async (req: Request) => {
	if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
	try {
		const url = new URL(req.url);
		if (req.method === "GET" && url.searchParams.get("action") === "callback") {
			const state = url.searchParams.get("state") || "";
            if (state.startsWith("growth-")) return Response.redirect(root + "/functions/v1/growth-outreach?" + url.searchParams.toString(), 303);
			const stored = await credentials("consume_state", {
				hash: await hash(state),
			});
			if (!stored) throw new Error("OAuth state expired or already used");
			const admin = await checked(
				db.from("profiles").select("role").eq("id", stored.user_id).single(),
			);
			if (admin.role !== "admin") throw new Error("Admin access required");
			const res = await fetch("https://oauth2.googleapis.com/token", {
				method: "POST",
				body: new URLSearchParams({
					client_id: Deno.env.get("GOOGLE_CLIENT_ID") || "",
					client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
					code: url.searchParams.get("code") || "",
					redirect_uri: callback,
					grant_type: "authorization_code",
					code_verifier: stored.verifier,
				}),
			});
			const data = await res.json();
			if (!res.ok || !data.access_token)
				throw new Error("Google authorization failed");
			const profile = await gmail("profile", data.access_token);
			if (profile.emailAddress.toLowerCase() !== SENDER)
				throw new Error("Choose " + SENDER + " when connecting");
			const prior = await credentials("get");
			if (!data.refresh_token && !prior?.refresh_token)
				throw new Error(
					"Google did not grant offline access. Reconnect with consent",
				);
			await credentials("set", {
				access_token: data.access_token,
				refresh_token: data.refresh_token || prior.refresh_token,
				expires_at: Date.now() + data.expires_in * 1000,
			});
			await checked(
				db
					.from("admin_outreach_settings")
					.update({
						mailbox_email: SENDER,
						enabled: false,
						history_ready: false,
						sync_cursor: null,
						gmail_history_id: null,
						delta_cursor: null,
					})
					.eq("id", true),
			);
			await checked(
				db.rpc("outreach_setup_worker", {
					p_url: root + "/functions/v1/admin-outreach",
				}),
			);
			return Response.redirect(origin + "/admin/outreach?connected=1", 303);
		}
		if (req.method !== "POST")
			return json({ error: "Method not allowed" }, 405);
		const worker = req.headers.get("x-outreach-worker-token");
		let isWorker = false;
		if (worker) {
			const config = await settings();
			isWorker =
				!!config.worker_token_hash &&
				(await hash(worker)) === config.worker_token_hash;
			if (!isWorker) return json({ error: "Unauthorized" }, 401);
		}
		let userId = "";
		if (!isWorker) {
			const token = (req.headers.get("authorization") || "").replace(
				/^Bearer /,
				"",
			);
			const {
				data: { user },
				error,
			} = await db.auth.getUser(token);
			if (error || !user) return json({ error: "Sign in required" }, 401);
			const p = await checked(
				db.from("profiles").select("role").eq("id", user.id).single(),
			);
			if (p.role !== "admin")
				return json({ error: "Admin access required" }, 403);
			userId = user.id;
		}
		const body = await req.json();
		const action = isWorker ? "run" : body.action;
		if (action === "status") {
			const config = await settings();
			const day = new Intl.DateTimeFormat("en-CA", {
				timeZone: "Africa/Lagos",
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
			}).format(new Date());
			const since = new Date(day + "T00:00:00+01:00").toISOString();
			const attempts = await checked(
				db
					.from("admin_outreach_attempts")
					.select("status,admin_outreach_queue!inner(kind)")
					.gte("created_at", since),
			);
			const initial = attempts.filter(
				(a: any) => a.admin_outreach_queue?.kind === "initial",
			);
			return json({
				...config,
				daily: {
					reserved: initial.length,
					accepted: initial.filter((a: any) => a.status === "accepted").length,
					uncertain: initial.filter((a: any) => a.status === "uncertain")
						.length,
				},
				worker_token_hash: undefined,
				oauth_configured:
					!!Deno.env.get("GOOGLE_CLIENT_ID") &&
					!!Deno.env.get("GOOGLE_CLIENT_SECRET"),
				callback_url: callback,
				template_html: template,
			});
		}
		if (action === "connect") {
			const client = Deno.env.get("GOOGLE_CLIENT_ID");
			if (!client || !Deno.env.get("GOOGLE_CLIENT_SECRET"))
				throw new Error(
					"Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET on the Edge Function first",
				);
			const state = crypto.randomUUID() + crypto.randomUUID(),
				verifier = base64url(crypto.randomUUID() + crypto.randomUUID());
			// PKCE digest is raw bytes, not UTF-8 text.
			const raw = new Uint8Array(
				await crypto.subtle.digest(
					"SHA-256",
					new TextEncoder().encode(verifier),
				),
			);
			let str = "";
			for (const b of raw) str += String.fromCharCode(b);
			const codeChallenge = btoa(str)
				.replace(/\+/g, "-")
				.replace(/\//g, "_")
				.replace(/=+$/, "");
			await credentials("state", {
				hash: await hash(state),
				user_id: userId,
				verifier,
			});
			const params = new URLSearchParams({
				client_id: client,
				redirect_uri: callback,
				response_type: "code",
				scope:
					"https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly",
				access_type: "offline",
				prompt: "consent",
				state,
				code_challenge: codeChallenge,
				code_challenge_method: "S256",
				login_hint: SENDER,
			});
			return json({
				url: "https://accounts.google.com/o/oauth2/v2/auth?" + params,
			});
		}
		if (action === "import") {
			if (
				!Array.isArray(body.rows) ||
				body.rows.length < 1 ||
				body.rows.length > 100
			)
				throw new Error("Import 1–100 prospects at a time");
			const rows = body.rows.map((r: any) => {
				const email = normalizeEmail(r.email);
				const source = new URL(r.source_url);
				if (source.protocol !== "https:")
					throw new Error("A verified HTTPS contact source is required");
				for (const field of ["organization", "greeting", "intro", "subject"])
					if (
						typeof r[field] !== "string" ||
						!r[field].trim() ||
						r[field].length > (field === "intro" ? 2000 : 200)
					)
						throw new Error("Missing or invalid " + field);
				if (/[\r\n]/.test(r.subject)) throw new Error("Invalid subject");
				return {
					email,
					organization: r.organization,
					source_url: source.toString(),
					greeting: r.greeting,
					intro: r.intro,
					subject: r.subject,
				};
			});
			const existing = await checked(
				db
					.from("admin_outreach_queue")
					.select("organization,source_url")
					.eq("kind", "initial"),
			);
			const seen = new Set(
				existing.map((r: any) =>
					new URL(r.source_url).hostname.replace(/^www\./, ""),
				),
			);
			for (const row of rows) {
				const host = new URL(row.source_url).hostname.replace(/^www\./, "");
				if (seen.has(host))
					throw new Error(
						"This organization is already in the initial-contact queue: " +
							host,
					);
				seen.add(host);
			}
			await checked(db.from("admin_outreach_queue").insert(rows));
			return json({ imported: rows.length });
		}
		if (action === "reconcile") {
			const row = await checked(
				db.from("admin_outreach_queue").select("*").eq("id", body.id).single(),
			);
			if (row.status !== "uncertain" || !row.rfc_message_id)
				throw new Error("Only uncertain sends can be reconciled");
			const token = await accessToken();
			const found = await gmail(
				"messages?" +
					new URLSearchParams({
						q: "in:sent rfc822msgid:" + row.rfc_message_id,
						maxResults: "2",
					}),
				token,
			);
			if (!found.messages?.length)
				return json({
					note: "No Sent match found. This does not prove the send failed; keep it held for manual review.",
				});
			const m = await gmail(
				"messages/" + found.messages[0].id + "?format=metadata",
				token,
			);
			await checked(
				db
					.from("admin_outreach_queue")
					.update({
						status: "sent",
						gmail_message_id: m.id,
						gmail_thread_id: m.threadId,
						last_error: null,
						sent_at: new Date(Number(m.internalDate)).toISOString(),
					})
					.eq("id", row.id),
			);
			await checked(
				db
					.from("admin_outreach_attempts")
					.update({ status: "accepted", gmail_message_id: m.id })
					.eq("queue_id", row.id)
					.in("status", ["uncertain", "reserved"]),
			);
			return json({ reconciled: true });
		}
		if (action === "approve") {
			const row = await checked(
				db.from("admin_outreach_queue").select("*").eq("id", body.id).single(),
			);
			if (row.status !== "draft")
				throw new Error("Only drafts can be approved");
			const blocked = await checked(
				db
					.from("admin_outreach_suppressions")
					.select("email")
					.eq("email", row.email)
					.maybeSingle(),
			);
			if (blocked) throw new Error("Suppressed address");
			await checked(
				db
					.from("admin_outreach_queue")
					.update({
						status: "approved",
						approved_by: userId,
						approved_at: new Date().toISOString(),
					})
					.eq("id", body.id)
					.eq("status", "draft"),
			);
			return json({ approved: true });
		}
		if (action === "suppress") {
			const email = normalizeEmail(body.email);
			await checked(
				db
					.from("admin_outreach_suppressions")
					.upsert({
						email,
						reason: String(body.reason || "Owner opt-out").slice(0, 500),
					}),
			);
			await checked(
				db
					.from("admin_outreach_queue")
					.update({ status: "blocked" })
					.eq("email", email)
					.neq("status", "sent"),
			);
			return json({ suppressed: true });
		}
		if (action === "enable") {
			const config = await settings();
			if (
				body.enabled &&
				(!config.history_ready || config.mailbox_email !== SENDER)
			)
				throw new Error(
					"Connect the mailbox and finish the history scan before enabling",
				);
			if (body.enabled)
				await checked(
					db.rpc("outreach_setup_worker", {
						p_url: root + "/functions/v1/admin-outreach",
					}),
				);
			await checked(
				db
					.from("admin_outreach_settings")
					.update({ enabled: body.enabled === true })
					.eq("id", true),
			);
			return json({ enabled: body.enabled === true });
		}
		if (action === "reply") {
			const m = await checked(
				db.from("admin_outreach_mail").select("*").eq("id", body.id).single(),
			);
			if (
				m.sender === SENDER ||
				["bounce", "delay", "optout"].includes(m.category)
			)
				throw new Error("This message cannot receive a reply");
			if (
				typeof body.text !== "string" ||
				!body.text.trim() ||
				body.text.length > 30000
			)
				throw new Error("Enter a reply of up to 30,000 characters");
			await checked(
				db
					.from("admin_outreach_queue")
					.insert({
						email: normalizeEmail(m.sender),
						organization: m.sender,
						source_url: origin + "/admin/outreach",
						greeting: "Reply",
						intro: "Human reviewed reply",
						subject: ("Re: " + m.subject.replace(/^Re:\s*/i, "")).slice(0, 200),
						kind: "reply",
						reply_body: body.text,
						gmail_thread_id: m.thread_id,
						reply_message_id: m.rfc_message_id,
						status: "draft",
					}),
			);
			await checked(
				db.from("admin_outreach_mail").update({ handled: true }).eq("id", m.id),
			);
			return json({ drafted: true });
		}
		if (action === "close") {
			await checked(
				db
					.from("admin_outreach_mail")
					.update({ handled: true })
					.eq("id", body.id),
			);
			return json({ closed: true });
		}
		if (action === "sync")
			return json(
				await sync(await accessToken(), !(await settings()).history_ready),
			);
		if (action === "run") {
			const config = await settings();
			if (!config.mailbox_email)
				return json({ skipped: "Mailbox not connected" });
			const token = await accessToken();
			if (!config.history_ready) return json(await sync(token, true));
			if (!config.enabled) return json(await sync(token, false));
			return json(await dispatch(token));
		}
		return json({ error: "Unknown action" }, 400);
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : "Operation failed" },
			400,
		);
	}
});
