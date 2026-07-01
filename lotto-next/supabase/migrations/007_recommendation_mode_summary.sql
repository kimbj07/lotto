-- Migration: 007_recommendation_mode_summary
-- Adds an all-time per-mode summary (win-rate breakdown on /results) and extends
-- refresh_recommendation_summary() to rebuild it alongside the per-round summary.
-- The CREATE OR REPLACE below fully redefines the function, so it carries over
-- 006's `DELETE ... WHERE true` fix verbatim (sql_safe_updates forbids an
-- unqualified DELETE).

CREATE TABLE IF NOT EXISTS recommendation_mode_summary (
  mode          TEXT        PRIMARY KEY,
  total         INTEGER     NOT NULL DEFAULT 0,
  graded_count  INTEGER     NOT NULL DEFAULT 0,
  rank1         INTEGER     NOT NULL DEFAULT 0,
  rank2         INTEGER     NOT NULL DEFAULT 0,
  rank3         INTEGER     NOT NULL DEFAULT 0,
  rank4         INTEGER     NOT NULL DEFAULT 0,
  rank5         INTEGER     NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION refresh_recommendation_summary()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Per-round summary (unchanged from 006).
  DELETE FROM recommendation_summary WHERE true;
  INSERT INTO recommendation_summary
    (target_game_no, total, graded_count, rank1, rank2, rank3, rank4, rank5, updated_at)
  SELECT
    target_game_no,
    count(*)::int,
    count(*) FILTER (WHERE graded)::int,
    count(*) FILTER (WHERE rank = 1)::int,
    count(*) FILTER (WHERE rank = 2)::int,
    count(*) FILTER (WHERE rank = 3)::int,
    count(*) FILTER (WHERE rank = 4)::int,
    count(*) FILTER (WHERE rank = 5)::int,
    now()
  FROM recommendations
  GROUP BY target_game_no;

  -- All-time per-mode summary (new).
  DELETE FROM recommendation_mode_summary WHERE true;
  INSERT INTO recommendation_mode_summary
    (mode, total, graded_count, rank1, rank2, rank3, rank4, rank5, updated_at)
  SELECT
    mode,
    count(*)::int,
    count(*) FILTER (WHERE graded)::int,
    count(*) FILTER (WHERE rank = 1)::int,
    count(*) FILTER (WHERE rank = 2)::int,
    count(*) FILTER (WHERE rank = 3)::int,
    count(*) FILTER (WHERE rank = 4)::int,
    count(*) FILTER (WHERE rank = 5)::int,
    now()
  FROM recommendations
  GROUP BY mode;
END;
$$;

GRANT SELECT ON public.recommendation_mode_summary TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendation_mode_summary TO service_role;
