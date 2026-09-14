-- Migration: 010_function_search_path
-- Supabase Security Advisor flags "Function Search Path Mutable" on every
-- function in public. Without a pinned search_path, an unqualified name like
-- `game_info` resolves through the caller's search_path, so an object planted
-- in an earlier schema could shadow the real table.
--
-- Low practical risk here (all functions are SECURITY INVOKER and the public
-- key cannot create objects), but pinning is cheap. `public` rather than ''
-- because the function bodies reference tables unqualified; '' would break them.
-- ALTER FUNCTION ... SET only changes config, not the body, and is re-runnable.
-- A later CREATE OR REPLACE FUNCTION must repeat `SET search_path = public`.

ALTER FUNCTION public.get_game_info_in_range(integer, integer, text)              SET search_path = public;
ALTER FUNCTION public.get_appearance_count(integer, integer, text, text, integer) SET search_path = public;
ALTER FUNCTION public.grade_recommendations(integer)                              SET search_path = public;
ALTER FUNCTION public.grade_pending_recommendations()                             SET search_path = public;
ALTER FUNCTION public.refresh_recommendation_summary()                            SET search_path = public;
