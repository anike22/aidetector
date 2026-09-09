SET LOCAL role TO anon; DO $$
DECLARE v_denied INT := 0;
BEGIN
  BEGIN INSERT INTO server_guest_sessions (guest_id) VALUES ('rls_probe_anon'); EXCEPTION WHEN OTHERS THEN v_denied := v_denied + 1; END;
  BEGIN INSERT INTO credit_reservations (feature_slug) VALUES ('rls_probe'); EXCEPTION WHEN OTHERS THEN v_denied := v_denied + 1; END;
  BEGIN INSERT INTO usage_ledger (event_type) VALUES ('rls_probe'); EXCEPTION WHEN OTHERS THEN v_denied := v_denied + 1; END;
  IF v_denied <> 3 THEN RAISE EXCEPTION 'RLS INSERT TEST FAIL: only %/3 billing tables blocked for anon inserts', v_denied; END IF;
  RAISE NOTICE 'RLS INSERT TEST PASS: anon cannot insert into billing tables';
END $$; RESET role; SET LOCAL role TO authenticated; DO $$
DECLARE v_denied INT := 0;
BEGIN
  BEGIN INSERT INTO server_guest_sessions (guest_id) VALUES ('rls_probe_auth'); EXCEPTION WHEN OTHERS THEN v_denied := v_denied + 1; END;
  BEGIN INSERT INTO usage_ledger (event_type) VALUES ('rls_probe_auth'); EXCEPTION WHEN OTHERS THEN v_denied := v_denied + 1; END;
  IF v_denied <> 2 THEN RAISE EXCEPTION 'RLS AUTH TEST FAIL: only %/2 billing tables blocked for authenticated inserts', v_denied; END IF;
  RAISE NOTICE 'RLS AUTH TEST PASS: authenticated cannot insert into billing tables';
END $$; RESET role;