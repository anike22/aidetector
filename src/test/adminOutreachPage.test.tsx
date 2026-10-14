// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
const mocks = vi.hoisted(() => ({ role: "admin", invoke: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({
	useAuth: () => ({ profile: { role: mocks.role }, loading: false }),
}));
vi.mock("@/db/supabase", () => ({
	supabase: {
		functions: { invoke: mocks.invoke },
		from: () => {
			const query: any = {
				select: () => query,
				order: () => query,
				neq: () => query,
				not: () => query,
				limit: () => Promise.resolve({ data: [], error: null }),
			};
			return query;
		},
	},
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
import AdminOutreachPage from "../pages/admin/AdminOutreachPage";
afterEach(() => {
	cleanup();
	mocks.invoke.mockReset();
	mocks.role = "admin";
});
const setup = () => {
	mocks.invoke.mockResolvedValue({
		data: {
			enabled: false,
			history_ready: false,
			mailbox_email: null,
			daily_cap: 50,
			oauth_configured: false,
			callback_url: "https://project.supabase.co/functions/v1/admin-outreach",
			template_html: "Hello {{greeting}}",
		},
		error: null,
	});
	return render(
		<MemoryRouter>
			<AdminOutreachPage />
		</MemoryRouter>,
	);
};
describe("outreach admin review controls", () => {
	it("denies nonadministrators without fetching mailbox data", () => {
		mocks.role = "user";
		setup();
		expect(screen.getByText("Administrator access required.")).toBeTruthy();
		expect(mocks.invoke).not.toHaveBeenCalled();
	});
	it("cannot enable or send before connection and full mailbox scan", async () => {
		setup();
		await waitFor(() => expect(mocks.invoke).toHaveBeenCalled());
		expect(
			(screen.getByText("Enable reviewed queue") as HTMLButtonElement).disabled,
		).toBe(true);
		expect(
			(
				screen.getByText(
					"Process up to four approved emails",
				) as HTMLButtonElement
			).disabled,
		).toBe(true);
	});
	it("rejects malformed import JSON without submitting it", async () => {
		setup();
		fireEvent.click(screen.getByRole("button", { name: "Import" }));
		fireEvent.change(screen.getByLabelText("Prepared prospect JSON"), {
			target: { value: "bad JSON" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Import as drafts" }));
		expect(screen.getByRole("alert").textContent).toContain("valid JSON");
		expect(
			mocks.invoke.mock.calls.every(
				(call: any) => call[1].body.action === "status",
			),
		).toBe(true);
	});
});
