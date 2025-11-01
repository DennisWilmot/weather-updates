-- Complete Database Schema Migration
-- This script adds all missing tables and columns to the existing database
-- Run this in your Supabase SQL Editor or PostgreSQL client

-- ============================================================================
-- PART 1: Create base tables (if they don't exist)
-- ============================================================================

-- Create parishes table
CREATE TABLE IF NOT EXISTS parishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  coordinates JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create communities table with parish reference
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parish_id UUID NOT NULL REFERENCES parishes(id),
  coordinates JSONB,
  bounds JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(name, parish_id)
);

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('landmark', 'street', 'building', 'institution')),
  community_id UUID NOT NULL REFERENCES communities(id),
  street_address TEXT,
  coordinates JSONB NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PART 2: Create submissions table if it doesn't exist
-- ============================================================================

CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parish TEXT,
  community TEXT,
  has_electricity BOOLEAN,
  has_wifi BOOLEAN NOT NULL,
  road_status TEXT NOT NULL CHECK (road_status IN ('clear', 'flooded', 'blocked', 'mudslide', 'damaged')),
  needs_help BOOLEAN NOT NULL,
  help_type TEXT CHECK (help_type IN ('medical', 'physical', 'police', 'firefighter', 'other')),
  requester_name TEXT,
  requester_phone TEXT,
  help_description TEXT,
  additional_info TEXT,
  image_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PART 3: Add missing columns to submissions table
-- ============================================================================

-- Add hierarchical location columns
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS parish_id UUID REFERENCES parishes(id),
  ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id),
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);

-- Add additional service columns
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS flow_service BOOLEAN,
  ADD COLUMN IF NOT EXISTS digicel_service BOOLEAN,
  ADD COLUMN IF NOT EXISTS water_service BOOLEAN;

-- Add hazard columns
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS flooding BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS downed_power_lines BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fallen_trees BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS structural_damage BOOLEAN DEFAULT FALSE;

-- Add location detail columns
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS street_name TEXT,
  ADD COLUMN IF NOT EXISTS place_name TEXT;

-- Add metadata columns
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS submission_type TEXT DEFAULT 'citizen' CHECK (submission_type IN ('citizen', 'responder')),
  ADD COLUMN IF NOT EXISTS confidence INTEGER DEFAULT 1;

-- ============================================================================
-- PART 4: Create users table (if it doesn't exist)
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  phone_number TEXT,
  image_url TEXT,
  role TEXT DEFAULT 'responder' CHECK (role IN ('admin', 'coordinator', 'responder', 'viewer')),
  organization TEXT,
  department TEXT,
  can_view_sensitive_data BOOLEAN DEFAULT true,
  can_export_data BOOLEAN DEFAULT false,
  can_manage_users BOOLEAN DEFAULT false,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PART 5: Create online_retailers table
-- ============================================================================

CREATE TABLE IF NOT EXISTS online_retailers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  phone_number TEXT,
  description TEXT,
  logo_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
  submitted_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PART 6: Create location_status aggregation table
-- ============================================================================

CREATE TABLE IF NOT EXISTS location_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id),
  community_id UUID REFERENCES communities(id),
  parish_id UUID NOT NULL REFERENCES parishes(id),
  jps_electricity_status TEXT CHECK (jps_electricity_status IN ('working', 'outage', 'partial', 'unknown')),
  flow_service_status TEXT CHECK (flow_service_status IN ('working', 'outage', 'partial', 'unknown')),
  digicel_service_status TEXT CHECK (digicel_service_status IN ('working', 'outage', 'partial', 'unknown')),
  road_status TEXT CHECK (road_status IN ('clear', 'flooded', 'blocked', 'mudslide', 'damaged')),
  has_flooding BOOLEAN DEFAULT FALSE,
  has_downed_power_lines BOOLEAN DEFAULT FALSE,
  has_fallen_trees BOOLEAN DEFAULT FALSE,
  has_structural_damage BOOLEAN DEFAULT FALSE,
  total_reports INTEGER DEFAULT 0,
  recent_reports INTEGER DEFAULT 0,
  confidence_score DECIMAL(3, 2),
  last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PART 7: Create tweets table
-- ============================================================================

CREATE TABLE IF NOT EXISTS tweets (
  id TEXT PRIMARY KEY,
  author TEXT,
  handle TEXT,
  created_at TIMESTAMPTZ,
  text TEXT,
  url TEXT,
  raw JSONB
);

-- ============================================================================
-- PART 8: Create indexes for performance
-- ============================================================================

-- Communities indexes
CREATE INDEX IF NOT EXISTS idx_communities_parish_id ON communities(parish_id);

-- Locations indexes
CREATE INDEX IF NOT EXISTS idx_locations_community_id ON locations(community_id);

-- Submissions indexes
CREATE INDEX IF NOT EXISTS idx_submissions_parish_id ON submissions(parish_id);
CREATE INDEX IF NOT EXISTS idx_submissions_community_id ON submissions(community_id);
CREATE INDEX IF NOT EXISTS idx_submissions_location_id ON submissions(location_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_submission_type ON submissions(submission_type);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Online retailers indexes
CREATE INDEX IF NOT EXISTS idx_online_retailers_status ON online_retailers(status);
CREATE INDEX IF NOT EXISTS idx_online_retailers_verified ON online_retailers(verified);
CREATE INDEX IF NOT EXISTS idx_online_retailers_submitted_by ON online_retailers(submitted_by_user_id);

-- Location status indexes
CREATE INDEX IF NOT EXISTS idx_location_status_parish_id ON location_status(parish_id);
CREATE INDEX IF NOT EXISTS idx_location_status_community_id ON location_status(community_id);
CREATE INDEX IF NOT EXISTS idx_location_status_location_id ON location_status(location_id);

-- Tweets indexes
CREATE INDEX IF NOT EXISTS tweets_created_at_idx ON tweets(created_at DESC);

-- ============================================================================
-- PART 9: Create helper functions
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on user updates
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on online_retailers updates
DROP TRIGGER IF EXISTS update_online_retailers_updated_at ON online_retailers;
CREATE TRIGGER update_online_retailers_updated_at
  BEFORE UPDATE ON online_retailers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 10: Insert initial parishes data
-- ============================================================================

INSERT INTO parishes (name, code, coordinates) VALUES
  ('Kingston', 'KGN', '{"lat": 17.9714, "lng": -76.7931, "bounds": {"north": 18.0200, "south": 17.9200, "east": -76.7500, "west": -76.8400}}'),
  ('St. Andrew', 'AND', '{"lat": 18.0179, "lng": -76.8099, "bounds": {"north": 18.1500, "south": 17.9200, "east": -76.6500, "west": -76.9000}}'),
  ('St. Thomas', 'THO', '{"lat": 17.9596, "lng": -76.3522, "bounds": {"north": 18.1000, "south": 17.8500, "east": -76.2000, "west": -76.5500}}'),
  ('Portland', 'POR', '{"lat": 18.1096, "lng": -76.4119, "bounds": {"north": 18.2500, "south": 18.0000, "east": -76.2000, "west": -76.6000}}'),
  ('St. Mary', 'MAR', '{"lat": 18.3726, "lng": -76.9563, "bounds": {"north": 18.5000, "south": 18.2000, "east": -76.7000, "west": -77.2000}}'),
  ('St. Ann', 'ANN', '{"lat": 18.4372, "lng": -77.2014, "bounds": {"north": 18.5500, "south": 18.2500, "east": -76.9500, "west": -77.4500}}'),
  ('Trelawny', 'TRL', '{"lat": 18.3541, "lng": -77.6041, "bounds": {"north": 18.5000, "south": 18.2000, "east": -77.4000, "west": -77.8000}}'),
  ('St. James', 'JAM', '{"lat": 18.4762, "lng": -77.9189, "bounds": {"north": 18.6000, "south": 18.3500, "east": -77.7500, "west": -78.0500}}'),
  ('Hanover', 'HAN', '{"lat": 18.4097, "lng": -78.1336, "bounds": {"north": 18.5000, "south": 18.3500, "east": -78.0000, "west": -78.3500}}'),
  ('Westmoreland', 'WML', '{"lat": 18.2663, "lng": -78.1336, "bounds": {"north": 18.4000, "south": 18.1500, "east": -77.9500, "west": -78.3500}}'),
  ('St. Elizabeth', 'ELI', '{"lat": 18.0375, "lng": -77.7426, "bounds": {"north": 18.3000, "south": 17.8500, "east": -77.5000, "west": -78.0500}}'),
  ('Manchester', 'MAN', '{"lat": 18.0407, "lng": -77.5052, "bounds": {"north": 18.2000, "south": 17.9000, "east": -77.3000, "west": -77.7000}}'),
  ('Clarendon', 'CLA', '{"lat": 17.9599, "lng": -77.2419, "bounds": {"north": 18.2000, "south": 17.8000, "east": -76.9000, "west": -77.5500}}'),
  ('St. Catherine', 'CAT', '{"lat": 18.0012, "lng": -76.9909, "bounds": {"north": 18.2000, "south": 17.8500, "east": -76.7500, "west": -77.2500}}')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- PART 11: Row Level Security (RLS) Setup
-- ============================================================================

-- Enable RLS on public tables
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_retailers ENABLE ROW LEVEL SECURITY;

-- Allow public read access to submissions
DROP POLICY IF EXISTS "Allow public read access to submissions" ON submissions;
CREATE POLICY "Allow public read access to submissions"
  ON submissions FOR SELECT
  USING (true);

-- Allow public read access to tweets
DROP POLICY IF EXISTS "Allow public read access to tweets" ON tweets;
CREATE POLICY "Allow public read access to tweets"
  ON tweets FOR SELECT
  USING (true);

-- Allow service role to manage submissions
DROP POLICY IF EXISTS "Allow service role to manage submissions" ON submissions;
CREATE POLICY "Allow service role to manage submissions"
  ON submissions FOR ALL
  USING (auth.role() = 'service_role');

-- Allow service role to manage tweets
DROP POLICY IF EXISTS "Allow service role to manage tweets" ON tweets;
CREATE POLICY "Allow service role to manage tweets"
  ON tweets FOR ALL
  USING (auth.role() = 'service_role');

-- Allow authenticated users to insert submissions
DROP POLICY IF EXISTS "Allow authenticated users to insert submissions" ON submissions;
CREATE POLICY "Allow authenticated users to insert submissions"
  ON submissions FOR INSERT
  WITH CHECK (true);

-- Allow public read access to online_retailers
DROP POLICY IF EXISTS "Allow public read active retailers" ON online_retailers;
CREATE POLICY "Allow public read active retailers"
  ON online_retailers FOR SELECT
  USING (status = 'active');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add comments for documentation
COMMENT ON TABLE submissions IS 'Community submissions for emergency status updates';
COMMENT ON COLUMN submissions.submission_type IS 'Distinguishes citizen reports from responder updates';
COMMENT ON COLUMN submissions.confidence IS 'Report reliability score from 1-5';
COMMENT ON TABLE users IS 'Stores user data synced from Clerk authentication and app-specific metadata';
COMMENT ON COLUMN users.role IS 'User role: admin (full access), coordinator (manage teams), responder (first responder), viewer (read-only)';
COMMENT ON TABLE location_status IS 'Aggregated status data for locations, communities, and parishes';

