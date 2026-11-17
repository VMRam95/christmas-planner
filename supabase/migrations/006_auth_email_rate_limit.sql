-- Durable limits for administrative Auth email links; never publicly callable.
CREATE TABLE christmas_planner.auth_email_limits (
  request_key text PRIMARY KEY,
  started_at timestamptz NOT NULL DEFAULT now(),
  requests integer NOT NULL DEFAULT 1
);
ALTER TABLE christmas_planner.auth_email_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON christmas_planner.auth_email_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON christmas_planner.auth_email_limits TO service_role;

CREATE FUNCTION christmas_planner.claim_auth_email_request(request_key text, max_requests integer, window_seconds integer)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog AS $$
DECLARE claimed integer;
BEGIN
  DELETE FROM christmas_planner.auth_email_limits WHERE started_at < now() - interval '1 day';
  INSERT INTO christmas_planner.auth_email_limits AS limits (request_key)
  VALUES (claim_auth_email_request.request_key)
  ON CONFLICT ON CONSTRAINT auth_email_limits_pkey DO UPDATE SET
    requests = CASE WHEN limits.started_at < now() - make_interval(secs => window_seconds) THEN 1 ELSE limits.requests + 1 END,
    started_at = CASE WHEN limits.started_at < now() - make_interval(secs => window_seconds) THEN now() ELSE limits.started_at END
  WHERE limits.started_at < now() - make_interval(secs => window_seconds) OR limits.requests < max_requests;
  GET DIAGNOSTICS claimed = ROW_COUNT;
  RETURN claimed = 1;
END;
$$;
REVOKE ALL ON FUNCTION christmas_planner.claim_auth_email_request(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION christmas_planner.claim_auth_email_request(text, integer, integer) TO service_role;
