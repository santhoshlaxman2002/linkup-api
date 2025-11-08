CREATE TABLE recent_user_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- who made the search
  searcher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- whose profile was searched
  searched_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- last time this search happened
  searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- prevent duplicates between the same two users
  UNIQUE (searcher_id, searched_user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_recent_user_searches_searcher ON recent_user_searches(searcher_id);
CREATE INDEX IF NOT EXISTS idx_recent_user_searches_searched_user ON recent_user_searches(searched_user_id);
CREATE INDEX IF NOT EXISTS idx_recent_user_searches_searched_at ON recent_user_searches(searched_at DESC);
