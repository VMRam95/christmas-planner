-- Application data is only exposed by guarded server APIs. Browser roles cannot
-- bypass gift secrecy by querying PostgREST directly. Apply with the auth release.
REVOKE ALL ON ALL TABLES IN SCHEMA christmas_planner FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA christmas_planner FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA christmas_planner REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA christmas_planner REVOKE ALL ON SEQUENCES FROM anon, authenticated;
GRANT USAGE ON SCHEMA christmas_planner TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA christmas_planner TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA christmas_planner TO service_role;
