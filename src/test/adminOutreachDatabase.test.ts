import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
let db: PGlite;
const owner = "00000000-0000-0000-0000-000000000001";
beforeAll(async () => {
	db = new PGlite();
	await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
 CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY); INSERT INTO auth.users VALUES('${owner}');
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 GRANT USAGE ON SCHEMA auth TO authenticated,service_role; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated,service_role;
 CREATE TABLE public.profiles(id uuid PRIMARY KEY,role text); INSERT INTO profiles VALUES('${owner}','admin'); GRANT SELECT ON profiles TO authenticated;
 CREATE SCHEMA vault; CREATE SCHEMA cron; CREATE SCHEMA net;`);
	// Pin the test clock inside the authorized sending window; all other guards are the deployed SQL.
	const migration = readFileSync(
		"supabase/migrations/20261014121303_admin_affiliate_outreach.sql",
		"utf8",
	).replace(
		"local_hour:=extract(hour FROM now() AT TIME ZONE 'Africa/Lagos');",
		"local_hour:=12;",
	);
	await db.exec(migration);
	await db.exec(readFileSync("supabase/migrations/20261014122444_outreach_explicit_private_access_denial.sql", "utf8"));
});
afterAll(async () => {
	await db.close();
});
describe.sequential("outreach database guardrails", () => {
	it("denies nonadmin reads and all direct client writes", async () => {
		await db.exec(
			`SET ROLE authenticated;SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);`,
		);
		expect(
			(await db.query("SELECT * FROM admin_outreach_settings")).rows,
		).toHaveLength(0);
		await expect(
			db.query("UPDATE admin_outreach_settings SET enabled=true"),
		).rejects.toThrow();
		await db.exec("RESET ROLE");
	});
	it("requires a complete mailbox scan and authenticated sender", async () => {
		await db.exec("SET ROLE service_role");
		expect((await db.query("SELECT outreach_claim() claimed")).rows[0]).toEqual(
			{ claimed: null },
		);
		await db.exec("RESET ROLE");
	});
	it("atomically reserves at most 50 first contacts per Lagos day", async () => {
		await db.exec(`UPDATE admin_outreach_settings SET enabled=true,history_ready=true,mailbox_email=sender_email,last_synced_at=now();
  INSERT INTO admin_outreach_queue(email,organization,source_url,greeting,intro,subject,status,approved_by,approved_at)
  SELECT 'editor'||n||'@example'||n||'.com','Site '||n,'https://example'||n||'.com/contact','Hello','Verified intro','Subject','approved','${owner}',now() FROM generate_series(1,51)n;
  SET ROLE service_role;`);
		for (let i = 0; i < 50; i++) {
			const result = await db.query<{ claimed: { id: string } }>(
				"SELECT outreach_claim() claimed",
			);
			expect(result.rows[0].claimed?.id).toBeTruthy();
			await db.query(
				"UPDATE admin_outreach_queue SET status='sent' WHERE id=$1",
				[result.rows[0].claimed.id],
			);
		}
		expect((await db.query("SELECT outreach_claim() claimed")).rows[0]).toEqual(
			{ claimed: null },
		);
		await db.exec("RESET ROLE");
	});
	it("blocks suppressed addresses and the fourth attempt even for replies", async () => {
		await db.exec(
			"UPDATE admin_outreach_queue SET status='closed' WHERE status='approved';",
		);
		for (const [email, suppress] of [
			["stop@example.com", true],
			["limit@example.com", false],
		] as const) {
			if (suppress)
				await db.query(
					"INSERT INTO admin_outreach_suppressions(email,reason) VALUES($1,'optout')",
					[email],
				);
			else
				await db.query(
					"INSERT INTO admin_outreach_contacts(email,prior_sent) VALUES($1,3)",
					[email],
				);
			await db.query(
				"INSERT INTO admin_outreach_queue(email,organization,source_url,greeting,intro,subject,kind,status,approved_at) VALUES($1,'Site','https://example.com','Hi','intro','Subject','reply','approved',now())",
				[email],
			);
			await db.exec("SET ROLE service_role");
			expect(
				(await db.query("SELECT outreach_claim() claimed")).rows[0],
			).toEqual({ claimed: null });
			await db.exec("RESET ROLE");
		}
	});
});
