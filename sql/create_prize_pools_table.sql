-- Create prize_pools table
CREATE TABLE IF NOT EXISTS prize_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  total_pool DECIMAL(10,2) NOT NULL,
  match_5_pool DECIMAL(10,2) NOT NULL,
  match_4_pool DECIMAL(10,2) NOT NULL,
  match_3_pool DECIMAL(10,2) NOT NULL,
  rollover_amount DECIMAL(10,2) DEFAULT 0.00,
  active_subscriber_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one prize pool per draw
  UNIQUE(draw_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prize_pools_draw_id ON prize_pools(draw_id);
CREATE INDEX IF NOT EXISTS idx_prize_pools_created_at ON prize_pools(created_at);

-- Add comments for clarity
COMMENT ON TABLE prize_pools IS 'Stores prize pool distribution for each draw';
COMMENT ON COLUMN prize_pools.total_pool IS 'Total prize pool from active subscriptions';
COMMENT ON COLUMN prize_pools.match_5_pool IS '40% of total pool for 5-match winners';
COMMENT ON COLUMN prize_pools.match_4_pool IS '35% of total pool for 4-match winners';
COMMENT ON COLUMN prize_pools.match_3_pool IS '25% of total pool for 3-match winners';
COMMENT ON COLUMN prize_pools.rollover_amount IS 'Amount rolled over when no 5-match winners';
COMMENT ON COLUMN prize_pools.active_subscriber_count IS 'Number of active subscribers contributing to pool';
