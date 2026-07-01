-- Reference table: all possible lotto numbers 1-45
CREATE TABLE IF NOT EXISTS number_info (
  number INTEGER PRIMARY KEY
);
INSERT INTO number_info SELECT generate_series(1, 45)
ON CONFLICT DO NOTHING;

-- Draw results and prize information per game
CREATE TABLE IF NOT EXISTS game_info (
  game_no                       INTEGER PRIMARY KEY,
  game_date                     DATE NOT NULL,
  first_winner_amount           BIGINT DEFAULT 0,
  first_winner_count            INTEGER DEFAULT 0,
  total_first_winner_amount     BIGINT DEFAULT 0,
  second_winner_amount          BIGINT DEFAULT 0,
  second_winner_count           INTEGER DEFAULT 0,
  total_second_winner_amount    BIGINT DEFAULT 0,
  third_winner_amount           BIGINT DEFAULT 0,
  third_winner_count            INTEGER DEFAULT 0,
  total_third_winner_amount     BIGINT DEFAULT 0,
  fourth_winner_amount          BIGINT DEFAULT 0,
  fourth_winner_count           INTEGER DEFAULT 0,
  total_fourth_winner_amount    BIGINT DEFAULT 0,
  fifth_winner_amount           BIGINT DEFAULT 0,
  fifth_winner_count            INTEGER DEFAULT 0,
  total_fifth_winner_amount     BIGINT DEFAULT 0,
  total_winner_count            INTEGER DEFAULT 0,
  total_amount                  BIGINT DEFAULT 0,
  total_sell_amount             BIGINT DEFAULT 0,
  manual_winner_count           INTEGER DEFAULT 0,
  auto_winner_count             INTEGER DEFAULT 0
);

-- The 6 winning balls for each draw (sequence 1-6 in draw order)
CREATE TABLE IF NOT EXISTS win_numbers (
  game_no   INTEGER NOT NULL REFERENCES game_info(game_no) ON DELETE CASCADE,
  number    INTEGER NOT NULL CHECK (number BETWEEN 1 AND 45),
  sequence  INTEGER NOT NULL CHECK (sequence BETWEEN 1 AND 6),
  PRIMARY KEY (game_no, sequence)
);

-- The bonus ball for each draw
CREATE TABLE IF NOT EXISTS bonus_number (
  game_no  INTEGER PRIMARY KEY REFERENCES game_info(game_no) ON DELETE CASCADE,
  number   INTEGER NOT NULL CHECK (number BETWEEN 1 AND 45)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_win_numbers_game_no ON win_numbers(game_no);
CREATE INDEX IF NOT EXISTS idx_win_numbers_number ON win_numbers(number);
CREATE INDEX IF NOT EXISTS idx_bonus_number_number ON bonus_number(number);
