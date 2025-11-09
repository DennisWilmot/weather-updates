-- Delete admin user to recreate with new password
-- Run this in Supabase SQL editor, then run: node scripts/create-admin-user.js

-- Delete in order (respecting foreign key constraints)
DELETE FROM "account" WHERE "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'admin@system.local');
DELETE FROM "session" WHERE "user_id" IN (SELECT "id" FROM "user" WHERE "email" = 'admin@system.local');
DELETE FROM "user" WHERE "email" = 'admin@system.local';

