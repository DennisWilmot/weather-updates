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

-- Alter submissions table to add new fields
-- First, add new columns (making them nullable initially for migration)
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS parish_id UUID REFERENCES parishes(id),
  ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id),
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id),
  ADD COLUMN IF NOT EXISTS flow_service BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS digicel_service BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS flooding BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS downed_power_lines BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS fallen_trees BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS structural_damage BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS street_name TEXT,
  ADD COLUMN IF NOT EXISTS place_name TEXT,
  ADD COLUMN IF NOT EXISTS confidence INTEGER DEFAULT 1;

-- Update road_status enum to include 'damaged'
ALTER TABLE submissions
  DROP CONSTRAINT IF EXISTS submissions_road_status_check;

ALTER TABLE submissions
  ADD CONSTRAINT submissions_road_status_check
  CHECK (road_status IN ('clear', 'flooded', 'blocked', 'mudslide', 'damaged'));

-- Create location_status aggregation table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_communities_parish_id ON communities(parish_id);
CREATE INDEX IF NOT EXISTS idx_locations_community_id ON locations(community_id);
CREATE INDEX IF NOT EXISTS idx_submissions_parish_id ON submissions(parish_id);
CREATE INDEX IF NOT EXISTS idx_submissions_community_id ON submissions(community_id);
CREATE INDEX IF NOT EXISTS idx_submissions_location_id ON submissions(location_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_status_parish_id ON location_status(parish_id);
CREATE INDEX IF NOT EXISTS idx_location_status_community_id ON location_status(community_id);
CREATE INDEX IF NOT EXISTS idx_location_status_location_id ON location_status(location_id);

-- Insert Jamaica's 14 parishes
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
