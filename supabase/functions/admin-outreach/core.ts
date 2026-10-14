export const SENDER = "partnerships@aidetector.cx";
export function normalizeEmail(value: unknown): string {
	const email = String(value || "")
		.trim()
		.toLowerCase();
	if (
		!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,63}$/.test(
			email,
		) ||
		email.length > 254
	)
		throw new Error("Invalid email address");
	return email;
}
export function addresses(value: string): string[] {
	return [
		...new Set(
			(
				value.match(
					/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,63}/gi,
				) || []
			).map((x) => x.toLowerCase()),
		),
	];
}
export function escapeHtml(value: string): string {
	return value.replace(
		/[&<>"']/g,
		(c) =>
			({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
				c
			]!,
	);
}
export function renderTemplate(
	template: string,
	row: { greeting: string; intro: string },
): string {
	return template
		.replace("{{greeting}}", () => escapeHtml(row.greeting))
		.replace("{{intro}}", () => escapeHtml(row.intro));
}
export function base64url(text: string): string {
	const bytes = new TextEncoder().encode(text);
	let out = "";
	for (const byte of bytes) out += String.fromCharCode(byte);
	return btoa(out).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function decode64(value: string): string {
	const bytes = Uint8Array.from(
		atob(value.replace(/-/g, "+").replace(/_/g, "/")),
		(c) => c.charCodeAt(0),
	);
	return new TextDecoder().decode(bytes);
}
export function textBody(payload: any): string {
	if (payload?.mimeType === "text/plain" && payload.body?.data)
		return decode64(payload.body.data);
	for (const p of payload?.parts || []) {
		const text = textBody(p);
		if (text) return text;
	}
	if (payload?.mimeType === "text/html" && payload.body?.data)
		return decode64(payload.body.data).replace(/<[^>]*>/g, " ");
	return "";
}
export function category(
	sender: string,
	subject: string,
	body: string,
): string {
	if (/mailer-daemon|postmaster/i.test(sender))
		return /delay|incomplete|temporary/i.test(
			subject + " " + body.slice(0, 500),
		)
			? "delay"
			: "bounce";
	if (/^unsubscribe\b/i.test(subject.trim())) return "optout";
	const fresh = body
		.split(/\nOn .{0,150}wrote:|\nFrom:|\n>/i)[0]
		.slice(0, 4000);
	if (
		/\b(please remove (me|this|our)|unsubscribe (me|my|our|this)|do not (contact|email)|don't (contact|email)|no thanks)\b/i.test(
			fresh,
		)
	)
		return "optout";
	return "message";
}
function standard64(value: string): string {
	const encoded = base64url(value).replace(/-/g, "+").replace(/_/g, "/");
	return encoded + "=".repeat((4 - (encoded.length % 4)) % 4);
}
export function mime(row: any, html: string): string {
	const email = normalizeEmail(row.email);
	if (/[\r\n]/.test(row.subject)) throw new Error("Invalid subject");
	const headers = [
		`From: AIDetector.cx <${SENDER}>`,
		`To: ${email}`,
		`Subject: =?UTF-8?B?${standard64(row.subject)}?=`,
		`Message-ID: <${row.rfc_message_id}>`,
		"MIME-Version: 1.0",
		"Content-Type: text/html; charset=UTF-8",
		"Content-Transfer-Encoding: base64",
	];
	if (row.reply_message_id) {
		if (/[\r\n]/.test(row.reply_message_id))
			throw new Error("Invalid reply reference");
		headers.push(
			`In-Reply-To: ${row.reply_message_id}`,
			`References: ${row.reply_message_id}`,
		);
	}
	const encoded =
		standard64(html)
			.match(/.{1,76}/g)
			?.join("\r\n") || "";
	return base64url(headers.join("\r\n") + "\r\n\r\n" + encoded);
}
