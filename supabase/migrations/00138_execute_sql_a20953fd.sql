SET LOCAL role TO anon; DO $$
DECLARE v_denied INT := 0; v_visible INT := 0;
BEGIN
  BEGIN INSERT INTO server_guest_sessions (guest_id) VALUES ('rls_probe_anon'); EXCEPTION WHEN OTHERS THEN v_denied := v_denied + 1; END;
  BEGIN INSERT INTO credit_reservations (feature_slug) VALUES ('rls_probe'); EXCEPTION WHEN OTHERS THEN v_denied := v_denied + 1; END;
  BEGIN INSERT INTO usage_ledger (event_type) VALUES ('rls_probe'); EXCEPTION WHEN OTHERS THEN v_denied := v_denied + 1; END;
  IF v_denied <> 3 THEN RAISE EXCEPTION 'RLS ANON INSERT FAIL: only %/3 blocked', v_denied; END IF;
  SELECT count(*) INTO v_visible FROM server_guest_sessions WHERE guest_id = 'rls_probe_anon';
  IF v_visible <> 0 THEN RAISE EXCEPTION 'RLS ANON READ FAIL: probe row visible to anon'; END IF;
  RAISE NOTICE 'RLS ANON TEST PASS: 0 rows visible, all inserts blocked';
END $$; RESET role; SET LOCAL role TO authenticated; DO $$
DECLARE v_denied INT := 0; v_visible INT := 0;
BEGIN
  BEGIN INSERT INTO server_guest_sessions (guest_id) VALUES ('rls_probe_auth'); EXCEPTION WHEN OTHERS THEN v_denied := v_denied + 1; END;
  BEGIN INSERT INTO usage_ledger (event_type) VALUES ('rls_probe_auth'); EXCEPTION WHEN OTHERS THEN v_denied := v_denied + 1; END;
  IF v_denied <> 2 THEN RAISE EXCEPTION 'RLS AUTH INSERT FAIL: only %/2 blocked', v_denied; END IF;
  SELECT count(*) INTO v_visible FROM server_guest_sessions WHERE guest_id = 'rls_probe_auth';
  IF v_visible <> 0 THEN RAISE EXCEPTION 'RLS AUTH READ FAIL: probe row visible to authenticated'; END IF;
  RAISE NOTICE 'RLS AUTH TEST PASS: inserts blocked, guest sessions invisible';
END $$; RESET role;