-- Migration: 004_grants
-- The 001 schema created tables but granted no privileges to the PostgREST
-- API roles, so every request through the anon/service_role keys returned
-- "42501 permission denied for table ...". This grants least-privilege access:
--   anon / authenticated  -> read-only (the app is public and read-only)
--   service_role          -> full read/write (used by the cron sync + local seed)
--
-- Writes never go through the public anon key: the sync route and the local
-- seed script both use the service_role key, so the public key cannot mutate
-- the lotto data.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Public read access for the app (history / stats / recommend / my-numbers)
GRANT SELECT ON public.game_info    TO anon, authenticated;
GRANT SELECT ON public.win_numbers  TO anon, authenticated;
GRANT SELECT ON public.bonus_number TO anon, authenticated;
GRANT SELECT ON public.number_info  TO anon, authenticated;

-- Server-side writes (cron sync) + local seed use the service_role key only
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_info    TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.win_numbers  TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bonus_number TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.number_info  TO service_role;

-- Analytics functions (SECURITY INVOKER: callers also need SELECT above)
GRANT EXECUTE ON FUNCTION get_game_info_in_range(integer, integer, text)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_appearance_count(integer, integer, text, text, integer)
  TO anon, authenticated, service_role;
