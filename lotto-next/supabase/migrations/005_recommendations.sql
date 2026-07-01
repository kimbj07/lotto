-- Migration: 005_recommendations
-- Records every recommendation the app generates (tagged with its target draw
-- round) plus a materialized per-round summary rebuilt by the cron.

CREATE TABLE IF NOT EXISTS recommendations (
  id              BIGSERIAL   PRIMARY KEY,
  target_game_no  INTEGER     NOT NULL,
  mode            TEXT        NOT NULL,
  numbers         INTEGER[]   NOT NULL,
  rank            SMALLINT,
  graded          BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT recommendations_numbers_len CHECK (array_length(numbers, 1) = 6)
);
CREATE INDEX IF NOT EXISTS recommendations_target_idx ON recommendations (target_game_no);

CREATE TABLE IF NOT EXISTS recommendation_summary (
  target_game_no  INTEGER     PRIMARY KEY,
  total           INTEGER     NOT NULL DEFAULT 0,
  graded_count    INTEGER     NOT NULL DEFAULT 0,
  rank1           INTEGER     NOT NULL DEFAULT 0,
  rank2           INTEGER     NOT NULL DEFAULT 0,
  rank3           INTEGER     NOT NULL DEFAULT 0,
  rank4           INTEGER     NOT NULL DEFAULT 0,
  rank5           INTEGER     NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grade all ungraded recommendations for a drawn round against its result.
CREATE OR REPLACE FUNCTION grade_recommendations(p_game_no INTEGER)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE recommendations r
  SET graded = true,
      rank = CASE
        WHEN sub.wc = 6 THEN 1
        WHEN sub.wc = 5 AND sub.bc = 1 THEN 2
        WHEN sub.wc = 5 THEN 3
        WHEN sub.wc = 4 THEN 4
        WHEN sub.wc = 3 THEN 5
        ELSE NULL
      END
  FROM (
    SELECT r2.id,
      (SELECT count(*) FROM win_numbers w
         WHERE w.game_no = p_game_no AND w.number = ANY(r2.numbers)) AS wc,
      (SELECT count(*) FROM bonus_number b
         WHERE b.game_no = p_game_no AND b.number = ANY(r2.numbers)) AS bc
    FROM recommendations r2
    WHERE r2.target_game_no = p_game_no AND r2.graded = false
  ) sub
  WHERE r.id = sub.id;
END;
$$;

-- Rebuild the per-round summary table from raw recommendations.
CREATE OR REPLACE FUNCTION refresh_recommendation_summary()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM recommendation_summary;
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
END;
$$;

-- Self-healing grader: grade every ungraded recommendation whose target round
-- has already been drawn (exists in game_info). Idempotent — safe to run each
-- sync; catches any pick that missed its round's one-shot grade_recommendations.
CREATE OR REPLACE FUNCTION grade_pending_recommendations()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE recommendations r
  SET graded = true,
      rank = CASE
        WHEN sub.wc = 6 THEN 1
        WHEN sub.wc = 5 AND sub.bc = 1 THEN 2
        WHEN sub.wc = 5 THEN 3
        WHEN sub.wc = 4 THEN 4
        WHEN sub.wc = 3 THEN 5
        ELSE NULL
      END
  FROM (
    SELECT r2.id,
      (SELECT count(*) FROM win_numbers w
         WHERE w.game_no = r2.target_game_no AND w.number = ANY(r2.numbers)) AS wc,
      (SELECT count(*) FROM bonus_number b
         WHERE b.game_no = r2.target_game_no AND b.number = ANY(r2.numbers)) AS bc
    FROM recommendations r2
    WHERE r2.graded = false
      AND EXISTS (SELECT 1 FROM game_info g WHERE g.game_no = r2.target_game_no)
  ) sub
  WHERE r.id = sub.id;
END;
$$;

-- Grants (mirror 004_grants.sql least-privilege pattern)
GRANT SELECT ON public.recommendations        TO anon, authenticated;
GRANT SELECT ON public.recommendation_summary TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendations        TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recommendation_summary TO service_role;
GRANT USAGE, SELECT ON SEQUENCE recommendations_id_seq TO service_role;
GRANT EXECUTE ON FUNCTION grade_recommendations(integer)        TO service_role;
GRANT EXECUTE ON FUNCTION grade_pending_recommendations()       TO service_role;
GRANT EXECUTE ON FUNCTION refresh_recommendation_summary() TO anon, authenticated, service_role;
