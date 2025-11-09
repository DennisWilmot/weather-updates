-- SQL to delete 6 failed vehicle users
-- Run this in Supabase SQL Editor, then recreate them via the create script
-- Users to delete: dr.bright, ltcolranglinedwards, mark, lashen, nicole, joel

-- Step 1: Delete user_locations first (if any exist for these users)
DELETE FROM "user_locations" WHERE "user_id" IN (
  SELECT "id" FROM "user" WHERE "email" IN (
    'dr.bright@system.local',
    'ltcolranglinedwards@system.local',
    'mark@system.local',
    'lashen@system.local',
    'nicole@system.local',
    'joel@system.local'
  )
);

-- Step 2: Delete from app users table (by username)
DELETE FROM "users" WHERE "username" IN ('dr.bright', 'ltcolranglinedwards', 'mark', 'lashen', 'nicole', 'joel');

-- Step 3: Delete from Better Auth account table
DELETE FROM "account" WHERE "user_id" IN (
  SELECT "id" FROM "user" WHERE "email" IN (
    'dr.bright@system.local',
    'ltcolranglinedwards@system.local',
    'mark@system.local',
    'lashen@system.local',
    'nicole@system.local',
    'joel@system.local'
  )
);

-- Step 4: Delete from Better Auth session table
DELETE FROM "session" WHERE "user_id" IN (
  SELECT "id" FROM "user" WHERE "email" IN (
    'dr.bright@system.local',
    'ltcolranglinedwards@system.local',
    'mark@system.local',
    'lashen@system.local',
    'nicole@system.local',
    'joel@system.local'
  )
);

-- Step 5: Delete from Better Auth user table (this is the main table)
DELETE FROM "user" WHERE "email" IN (
  'dr.bright@system.local',
  'ltcolranglinedwards@system.local',
  'mark@system.local',
  'lashen@system.local',
  'nicole@system.local',
  'joel@system.local'
);

-- After running this SQL, run the create script to recreate users with correct passwords:
-- npx tsx scripts/create-all-vehicle-users.ts
--
-- The script will create these users with passwords:
-- dr.bright: Bright2024!
-- ltcolranglinedwards: Ranglin2024!
-- mark: Mark2024!
-- lashen: Lashen2024!
-- nicole: Nicole2024!
-- joel: Joel2024!

