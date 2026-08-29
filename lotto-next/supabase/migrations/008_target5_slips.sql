-- Migration: 008_target5_slips
-- The "5등 노리기" (target5) mode records ONE 5-game slip per recommendation:
-- five `recommendations` rows sharing a slip_id. Its success metric is
-- slip-level ("did at least one of the 5 games rank?"), so the per-mode summary
-- gains slip columns and refresh_recommendation_summary() fills them.
-- Apply by hand in the Supabase SQL editor (DDL), like 001–007. Purely
-- additive (nullable column + defaulted columns), so apply it BEFORE merging
-- the target5 code; afterwards run `select refresh_recommendation_summary();`
-- once so the slip columns are populated before the next Sunday cron.
-- If the code ships first anyway, the app still works: /api/recommend falls
-- back to recording target5 games without a slip_id (per-game stats only;
-- those rows are never attributed to a slip).

ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS slip_id UUID;
CREATE INDEX IF NOT EXISTS recommendations_slip_idx ON recommendations (slip_id)
  WHERE slip_id IS NOT NULL;

ALTER TABLE recommendation_mode_summary
  ADD COLUMN IF NOT EXISTS slip_total  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slip_graded INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS slip_hit    INTEGER NOT NULL DEFAULT 0;

-- Full redefinition (carries over 006's qualified DELETE and 007's per-mode
-- summary verbatim) plus the slip-level aggregation.
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

  -- All-time per-mode summary (007) + slip-level stats (008).
  DELETE FROM recommendation_mode_summary WHERE true;
  INSERT INTO recommendation_mode_summary
    (mode, total, graded_count, rank1, rank2, rank3, rank4, rank5,
     slip_total, slip_graded, slip_hit, updated_at)
  SELECT
    r.mode,
    count(*)::int,
    count(*) FILTER (WHERE r.graded)::int,
    count(*) FILTER (WHERE r.rank = 1)::int,
    count(*) FILTER (WHERE r.rank = 2)::int,
    count(*) FILTER (WHERE r.rank = 3)::int,
    count(*) FILTER (WHERE r.rank = 4)::int,
    count(*) FILTER (WHERE r.rank = 5)::int,
    coalesce(max(s.slip_total), 0),
    coalesce(max(s.slip_graded), 0),
    coalesce(max(s.slip_hit), 0),
    now()
  FROM recommendations r
  LEFT JOIN (
    -- One row per mode: a slip is graded when every game is graded, and hits
    -- when any game ranks (5th prize or better).
    SELECT mode,
      count(*)::int                                       AS slip_total,
      count(*) FILTER (WHERE all_graded)::int             AS slip_graded,
      count(*) FILTER (WHERE all_graded AND any_hit)::int AS slip_hit
    FROM (
      SELECT mode, slip_id,
        bool_and(graded)          AS all_graded,
        bool_or(rank IS NOT NULL) AS any_hit
      FROM recommendations
      WHERE slip_id IS NOT NULL
      GROUP BY mode, slip_id
    ) slips
    GROUP BY mode
  ) s ON s.mode = r.mode
  GROUP BY r.mode;
END;
$$;

-- 005 granted EXECUTE on this function to anon/authenticated, contradicting
-- its own least-privilege note; nothing calls it with the anon key (the cron
-- uses service_role) and CREATE OR REPLACE preserves the old ACL, so revoke
-- it here. (Not exploitable before this either: SECURITY INVOKER, so anon
-- died on the first DELETE's permission check.)
REVOKE EXECUTE ON FUNCTION refresh_recommendation_summary() FROM anon, authenticated;
