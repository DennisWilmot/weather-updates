-- Create users table for storing Clerk user data and app-specific metadata
-- This table links Clerk authentication with your application's user data

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE, -- Clerk's user ID
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  phone_number TEXT,
  image_url TEXT, -- Profile image from Clerk
  
  -- App-specific user metadata
  role TEXT DEFAULT 'responder' CHECK (role IN ('admin', 'coordinator', 'responder', 'viewer')),
  organization TEXT, -- e.g., "Jamaica Red Cross", "ODPEM"
  department TEXT, -- e.g., "Emergency Response", "Logistics"
  
  -- Permissions and preferences
  can_view_sensitive_data BOOLEAN DEFAULT true, -- First responders can see contact info
  can_export_data BOOLEAN DEFAULT false,
  can_manage_users BOOLEAN DEFAULT false, -- Only admins
  
  -- Metadata
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on Clerk user ID for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);

-- Create index on email for user lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create index on role for filtering
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on user updates
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE users IS 'Stores user data synced from Clerk authentication and app-specific metadata';
COMMENT ON COLUMN users.clerk_user_id IS 'Unique identifier from Clerk authentication system';
COMMENT ON COLUMN users.role IS 'User role: admin (full access), coordinator (manage teams), responder (first responder), viewer (read-only)';

