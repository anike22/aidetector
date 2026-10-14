import { describe, it, expect } from "vitest";
import {
	normalizeEmail,
	renderTemplate,
	category,
	mime,
	decode64,
} from "../../supabase/functions/admin-outreach/core";
import { template } from "../../supabase/functions/admin-outreach/template";
describe("admin outreach sending boundaries", () => {
	it("rejects header injection and multiple recipients", () => {
		expect(() =>
			normalizeEmail("victim@example.com\r\nBcc: other@example.com"),
		).toThrow();
		expect(() => normalizeEmail("a@example.com,b@example.com")).toThrow();
		expect(normalizeEmail(" Editor@Example.com ")).toBe("editor@example.com");
	});
	it("keeps the approved template while escaping researched fields", () => {
		const rendered = renderTemplate(template, {
			greeting: "Hello <script>x</script>",
			intro: "Research & evidence",
		});
		expect(rendered).not.toContain("<script>");
		expect(rendered).toContain("&lt;script&gt;");
		expect(rendered).toContain("30% recurring lifetime commission");
		expect(rendered).toContain("300 complimentary testing credits");
		expect(rendered).toContain("Simply reply to this email");
	});
	it("distinguishes temporary delays, permanent bounces and explicit opt-outs", () => {
		expect(
			category(
				"mailer-daemon@googlemail.com",
				"Delivery Status Notification (Delay)",
				"",
			),
		).toBe("delay");
		expect(
			category(
				"mailer-daemon@googlemail.com",
				"Delivery Status Notification (Failure)",
				"Address not found",
			),
		).toBe("bounce");
		expect(
			category(
				"editor@example.com",
				"Re: offer",
				"Please remove this email address from all your systems",
			),
		).toBe("optout");
		expect(
			category(
				"editor@example.com",
				"Unsubscribe from AIDetector.cx affiliate outreach",
				"Please unsubscribe my email address",
			),
		).toBe("optout");
		expect(
			category(
				"editor@example.com",
				"Re: offer",
				"Thanks, I am interested.\nOn Monday wrote:\nPlease remove this",
			),
		).toBe("message");
	});
	it("encodes UTF-8 MIME without allowing subject header injection", () => {
		const row = {
			email: "editor@example.com",
			subject: "Hello — café",
			rfc_message_id: "test@aidetector.cx",
		};
		const raw = decode64(mime(row, "<p>こんにちは</p>"));
		expect(raw).toContain("Content-Transfer-Encoding: base64");
		expect(raw).toContain("Message-ID: <test@aidetector.cx>");
		expect(() =>
			mime({ ...row, subject: "Hi\r\nBcc: stranger@example.com" }, "hello"),
		).toThrow();
	});
});
