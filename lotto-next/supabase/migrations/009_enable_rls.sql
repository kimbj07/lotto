-- Migration: 009_enable_rls
-- Supabase Security Advisor flags "RLS Disabled in Public" on every table the
-- API can reach. Access was already least-privilege via GRANTs (004/005/007):
-- anon/authenticated hold SELECT only, and writes use the service_role key.
-- Enabling RLS adds a second layer so a future accidental GRANT (e.g. Supabase
-- default privileges on a new table) cannot open writes to the public key.
--
-- Behaviour after this migration:
--   service_role  -> bypasses RLS, so the cron sync / seed / recommend inserts are unchanged
--   anon, authenticated -> SELECT policy below, so public reads and the
--                          SECURITY INVOKER RPCs (get_game_info_in_range,
--                          get_appearance_count) keep working
--   recommendations -> RLS on with no policy: the public key reads nothing
--                      (it had no SELECT grant anyway)

ALTER TABLE public.number_info                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_info                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.win_numbers                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonus_number                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_summary      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_mode_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations             ENABLE ROW LEVEL SECURITY;

-- Public read-only policies. DROP first so the migration can be re-run.
DROP POLICY IF EXISTS public_read ON public.number_info;
CREATE POLICY public_read ON public.number_info
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS public_read ON public.game_info;
CREATE POLICY public_read ON public.game_info
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS public_read ON public.win_numbers;
CREATE POLICY public_read ON public.win_numbers
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS public_read ON public.bonus_number;
CREATE POLICY public_read ON public.bonus_number
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS public_read ON public.recommendation_summary;
CREATE POLICY public_read ON public.recommendation_summary
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS public_read ON public.recommendation_mode_summary;
CREATE POLICY public_read ON public.recommendation_mode_summary
  FOR SELECT TO anon, authenticated USING (true);
