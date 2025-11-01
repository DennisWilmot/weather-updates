-- Create online_retailers table
-- This table stores online retailers that users can access for purchasing goods
-- Designed to support future user submissions

CREATE TABLE IF NOT EXISTS online_retailers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  phone_number TEXT,
  description TEXT,
  
  -- Status tracking
  verified BOOLEAN DEFAULT FALSE, -- Admin verified retailers
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
  
  -- User submission support (for future functionality)
  submitted_by_user_id UUID REFERENCES users(id), -- Nullable - null means admin/system added
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Enable pg_trgm extension for fuzzy text search (if not already enabled)
-- This must be done before creating the GIN index
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_online_retailers_status ON online_retailers(status);
CREATE INDEX IF NOT EXISTS idx_online_retailers_verified ON online_retailers(verified);
CREATE INDEX IF NOT EXISTS idx_online_retailers_submitted_by ON online_retailers(submitted_by_user_id);

-- Create text search index (only if pg_trgm extension is enabled)
-- If pg_trgm is not available, this index will be skipped
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    CREATE INDEX IF NOT EXISTS idx_online_retailers_name ON online_retailers USING gin(name gin_trgm_ops);
  ELSE
    -- Fallback to a simple btree index if pg_trgm is not available
    CREATE INDEX IF NOT EXISTS idx_online_retailers_name ON online_retailers(name);
  END IF;
END $$;

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_online_retailers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_online_retailers_updated_at
  BEFORE UPDATE ON online_retailers
  FOR EACH ROW
  EXECUTE FUNCTION update_online_retailers_updated_at();

-- Insert initial retailers with data gathered from web search
INSERT INTO online_retailers (name, website_url, phone_number, description, verified, status) VALUES
  (
    'Caribshopper',
    'https://caribshopper.com/collections/jamaica',
    NULL,
    'Authentic Caribbean-made products delivered to your door. FREE SHIPPING on orders over USD$75.',
    TRUE,
    'active'
  ),
  (
    '7Krave Kravemart',
    'https://www.7krave.com/site/kravemart',
    NULL,
    'Online grocery and retail delivery service.',
    TRUE,
    'active'
  ),
  (
    'Sampars Cash & Carry',
    'https://www.shopsampars.com/shop/',
    '(876) 221-9749',
    'Online shopping platform for Sampars Cash & Carry.',
    TRUE,
    'active'
  ),
  (
    'PriceSmart Jamaica',
    'https://www.pricesmart.com/en-jm/holiday-experience',
    '(876) 969-1242',
    'Membership-based warehouse club offering bulk shopping and delivery services.',
    TRUE,
    'active'
  ),
  (
    'QuickCart',
    'https://www.quickcartonline.com/',
    NULL,
    'Online grocery and retail delivery platform.',
    TRUE,
    'active'
  ),
  (
    'GroceryList Jamaica',
    'https://grocerylistjamaica.com/',
    NULL,
    'Online grocery shopping and delivery service for Jamaica.',
    TRUE,
    'active'
  )
ON CONFLICT DO NOTHING;

-- Grant necessary permissions (adjust based on your RLS policies)
-- If you have Row Level Security enabled, you'll need to create policies
-- For now, assuming public read access for active retailers
-- ALTER TABLE online_retailers ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (uncomment if you enable RLS):
-- CREATE POLICY "Anyone can view active retailers"
--   ON online_retailers FOR SELECT
--   USING (status = 'active');

-- CREATE POLICY "Admins can manage retailers"
--   ON online_retailers FOR ALL
--   USING (
--     EXISTS (
--       SELECT 1 FROM users
--       WHERE users.id = auth.uid()::uuid
--       AND users.role = 'admin'
--     )
--   );

