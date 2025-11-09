-- SQL to create admin user in Supabase UI
-- Run this in the Supabase SQL Editor

-- Step 1: Remove Clerk dependency
ALTER TABLE users DROP COLUMN IF EXISTS clerk_user_id;

-- Step 2: Add username column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);

-- Step 3: Make username NOT NULL (after adding data)
-- We'll do this after inserting the user

-- Step 4: Insert admin user
INSERT INTO users (
    username,
    email,
    full_name,
    role,
    can_manage_users,
    can_export_data,
    can_view_sensitive_data,
    created_at,
    updated_at
) VALUES (
    'admin',
    'admin@system.local',
    'Admin User',
    'admin',
    true,
    true,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (username) DO UPDATE
SET 
    role = 'admin',
    can_manage_users = true,
    can_export_data = true,
    can_view_sensitive_data = true,
    updated_at = NOW();

-- Step 5: Make username NOT NULL (if you want to enforce it)
-- ALTER TABLE users ALTER COLUMN username SET NOT NULL;

-- After running this SQL, go to /admin/users in your app and create the Better Auth account:
-- Username: admin
-- Password: Intellibus@123!
-- Full Name: Admin User
