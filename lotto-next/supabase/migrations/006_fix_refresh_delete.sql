-- Migration: 006_fix_refresh_delete
-- refresh_recommendation_summary() used `DELETE FROM recommendation_summary;`
-- with no WHERE clause. Supabase runs the API roles with sql_safe_updates on,
-- which rejects an unqualified DELETE ("DELETE requires a WHERE clause"), so the
-- cron's summary rebuild failed and /results would never populate. Add an
-- explicit `WHERE true` (full rebuild is still intended) to satisfy the guard.

CREATE OR REPLACE FUNCTION refresh_recommendation_summary()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
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
END;
$$;
