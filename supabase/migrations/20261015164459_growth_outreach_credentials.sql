-- Vault secrets are never returned to a browser; these RPCs are service-only.
CREATE FUNCTION growth_private.credentials(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE sid uuid; result jsonb;
BEGIN
 IF current_setting('role',true)<>'service_role' THEN RAISE EXCEPTION 'Service only'; END IF;
 IF p_action='get' THEN
  SELECT decrypted_secret::jsonb INTO result FROM vault.decrypted_secrets WHERE id=(SELECT secret_id FROM growth_private.mailbox WHERE id=true);
  RETURN result;
 ELSIF p_action='set' THEN
  SELECT secret_id INTO sid FROM growth_private.mailbox WHERE id=true FOR UPDATE;
  IF sid IS NULL THEN SELECT vault.create_secret(p_data::text,'aidetector_growth_mailbox') INTO sid; INSERT INTO growth_private.mailbox(id,secret_id) VALUES(true,sid);
  ELSE PERFORM vault.update_secret(sid,p_data::text); END IF;
  RETURN '{"saved":true}';
 ELSIF p_action='state' THEN
  DELETE FROM growth_private.oauth_states WHERE expires_at<now();
  INSERT INTO growth_private.oauth_states VALUES(p_data->>'hash',(p_data->>'user_id')::uuid,p_data->>'verifier',now()+interval '10 minutes'); RETURN '{}';
 ELSIF p_action='consume_state' THEN
  DELETE FROM growth_private.oauth_states WHERE state_hash=p_data->>'hash' AND expires_at>now() RETURNING jsonb_build_object('user_id',user_id,'verifier',verifier) INTO result; RETURN result;
 END IF;
 RAISE EXCEPTION 'Unknown action';
END $$;
REVOKE ALL ON FUNCTION growth_private.credentials(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION growth_private.credentials(text,jsonb) TO service_role;
CREATE FUNCTION public.growth_credentials(p_action text,p_data jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog AS $$SELECT growth_private.credentials(p_action,p_data)$$;
REVOKE ALL ON FUNCTION public.growth_credentials(text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.growth_credentials(text,jsonb) TO service_role;

