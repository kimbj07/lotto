-- Migration: 003_fix_range_filter
-- Fix single-sided range filter in get_game_info_in_range and get_appearance_count.
-- Previously, only a two-sided range (both p_from AND p_to) applied a WHERE clause;
-- a single-sided range (e.g. p_from=100 with no p_to) returned all games.

CREATE OR REPLACE FUNCTION get_game_info_in_range(
  p_from    INTEGER DEFAULT NULL,
  p_to      INTEGER DEFAULT NULL,
  p_order   TEXT    DEFAULT 'DESC'
)
RETURNS TABLE (
  game_no                     INTEGER,
  game_date                   DATE,
  first_ball                  INTEGER,
  second_ball                 INTEGER,
  third_ball                  INTEGER,
  fourth_ball                 INTEGER,
  fifth_ball                  INTEGER,
  sixth_ball                  INTEGER,
  bonus_ball                  INTEGER,
  first_winner_amount         BIGINT,
  first_winner_count          INTEGER,
  total_first_winner_amount   BIGINT,
  second_winner_amount        BIGINT,
  second_winner_count         INTEGER,
  total_second_winner_amount  BIGINT,
  third_winner_amount         BIGINT,
  third_winner_count          INTEGER,
  total_third_winner_amount   BIGINT,
  fourth_winner_amount        BIGINT,
  fourth_winner_count         INTEGER,
  total_fourth_winner_amount  BIGINT,
  fifth_winner_amount         BIGINT,
  fifth_winner_count          INTEGER,
  total_fifth_winner_amount   BIGINT,
  total_winner_count          INTEGER,
  total_amount                BIGINT,
  total_sell_amount           BIGINT,
  manual_winner_count         INTEGER,
  auto_winner_count           INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY EXECUTE format(
    'SELECT
       gi.game_no,
       gi.game_date,
       SUM(CASE WHEN wn.sequence = 1 THEN wn.number ELSE 0 END)::INTEGER AS first_ball,
       SUM(CASE WHEN wn.sequence = 2 THEN wn.number ELSE 0 END)::INTEGER AS second_ball,
       SUM(CASE WHEN wn.sequence = 3 THEN wn.number ELSE 0 END)::INTEGER AS third_ball,
       SUM(CASE WHEN wn.sequence = 4 THEN wn.number ELSE 0 END)::INTEGER AS fourth_ball,
       SUM(CASE WHEN wn.sequence = 5 THEN wn.number ELSE 0 END)::INTEGER AS fifth_ball,
       SUM(CASE WHEN wn.sequence = 6 THEN wn.number ELSE 0 END)::INTEGER AS sixth_ball,
       bn.number AS bonus_ball,
       gi.first_winner_amount,
       gi.first_winner_count,
       gi.total_first_winner_amount,
       gi.second_winner_amount,
       gi.second_winner_count,
       gi.total_second_winner_amount,
       gi.third_winner_amount,
       gi.third_winner_count,
       gi.total_third_winner_amount,
       gi.fourth_winner_amount,
       gi.fourth_winner_count,
       gi.total_fourth_winner_amount,
       gi.fifth_winner_amount,
       gi.fifth_winner_count,
       gi.total_fifth_winner_amount,
       gi.total_winner_count,
       gi.total_amount,
       gi.total_sell_amount,
       gi.manual_winner_count,
       gi.auto_winner_count
     FROM win_numbers wn
     JOIN game_info gi ON gi.game_no = wn.game_no
     JOIN bonus_number bn ON bn.game_no = wn.game_no
     %s
     GROUP BY gi.game_no, gi.game_date, bn.number,
              gi.first_winner_amount, gi.first_winner_count, gi.total_first_winner_amount,
              gi.second_winner_amount, gi.second_winner_count, gi.total_second_winner_amount,
              gi.third_winner_amount, gi.third_winner_count, gi.total_third_winner_amount,
              gi.fourth_winner_amount, gi.fourth_winner_count, gi.total_fourth_winner_amount,
              gi.fifth_winner_amount, gi.fifth_winner_count, gi.total_fifth_winner_amount,
              gi.total_winner_count, gi.total_amount, gi.total_sell_amount,
              gi.manual_winner_count, gi.auto_winner_count
     ORDER BY gi.game_no %s',
    CASE
      WHEN p_from IS NOT NULL AND p_to IS NOT NULL
        THEN format('WHERE wn.game_no BETWEEN %s AND %s', p_from, p_to)
      WHEN p_from IS NOT NULL
        THEN format('WHERE wn.game_no >= %s', p_from)
      WHEN p_to IS NOT NULL
        THEN format('WHERE wn.game_no <= %s', p_to)
      ELSE ''
    END,
    CASE WHEN upper(p_order) = 'ASC' THEN 'ASC' ELSE 'DESC' END
  );
END;
$$;

-- Function: get_appearance_count
-- Counts how often each number 1-45 appears as a win ball or bonus ball
-- within the requested game range. Port of selectAppearanceCount.
CREATE OR REPLACE FUNCTION get_appearance_count(
  p_from        INTEGER DEFAULT NULL,
  p_to          INTEGER DEFAULT NULL,
  p_sort_by     TEXT    DEFAULT 'winCount',
  p_sort_order  TEXT    DEFAULT 'DESC',
  p_count       INTEGER DEFAULT NULL
)
RETURNS TABLE (
  number      INTEGER,
  win_count   BIGINT,
  bonus_count BIGINT,
  sum_count   BIGINT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_sort_col   TEXT;
  v_sort_order TEXT;
  v_where      TEXT;
  v_limit      TEXT;
BEGIN
  v_sort_col := CASE p_sort_by
    WHEN 'bonusCount' THEN 'bonus_count'
    WHEN 'sumCount'   THEN 'sum_count'
    WHEN 'number'     THEN 'number'
    ELSE 'win_count'
  END;

  v_sort_order := CASE WHEN upper(p_sort_order) = 'ASC' THEN 'ASC' ELSE 'DESC' END;

  v_where := CASE
    WHEN p_from IS NOT NULL AND p_to IS NOT NULL
      THEN format('WHERE game_no BETWEEN %s AND %s', p_from, p_to)
    WHEN p_from IS NOT NULL
      THEN format('WHERE game_no >= %s', p_from)
    WHEN p_to IS NOT NULL
      THEN format('WHERE game_no <= %s', p_to)
    ELSE ''
  END;

  v_limit := CASE
    WHEN p_count IS NOT NULL THEN format('LIMIT %s', p_count)
    ELSE ''
  END;

  RETURN QUERY EXECUTE format(
    'SELECT
       ni.number,
       COALESCE(w.win_count, 0)   AS win_count,
       COALESCE(b.bonus_count, 0) AS bonus_count,
       COALESCE(w.win_count, 0) + COALESCE(b.bonus_count, 0) AS sum_count
     FROM number_info ni
     LEFT JOIN (
       SELECT number, COUNT(*)::BIGINT AS win_count
       FROM win_numbers %s
       GROUP BY number
     ) w ON ni.number = w.number
     LEFT JOIN (
       SELECT number, COUNT(*)::BIGINT AS bonus_count
       FROM bonus_number %s
       GROUP BY number
     ) b ON ni.number = b.number
     ORDER BY %I %s
     %s',
    v_where, v_where, v_sort_col, v_sort_order, v_limit
  );
END;
$$;
