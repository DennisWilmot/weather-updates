# Database Migration Instructions

## The Problem

Your database is missing the `submission_type` column in the `submissions` table, which is causing errors when users try to submit updates.

## The Solution

You need to run the complete migration script to add all missing columns to your database.

## Steps to Fix

### Option 1: Run the Complete Migration (Recommended)

1. Open your Supabase Dashboard: https://app.supabase.com
2. Navigate to your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire contents of `complete-schema-migration.sql`
6. Paste it into the SQL editor
7. Click **Run** (or press Ctrl+Enter)

This will:
- Create all missing tables
- Add all missing columns to existing tables
- Create necessary indexes
- Set up Row Level Security policies
- Seed initial data

### Option 2: Run Individual Migrations

If you prefer to run migrations separately, execute them in this order:

1. **`schema.sql`** - Creates base tables (parishes, communities, locations)
2. **`migrations/add_submission_type.sql`** - Adds submission_type column
3. **`create-users-table.sql`** - Creates users table
4. **`supabase-online-retailers.sql`** - Creates online_retailers table
5. **`supabase-migration.sql`** - Creates tweets table

### Verification

After running the migration, verify it worked by checking your database:

```sql
-- Check that submission_type column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'submissions'
AND column_name = 'submission_type';

-- Should return:
-- column_name: submission_type
-- data_type: text
-- column_default: 'citizen'::text
```

### If You Still Have Issues

If you continue to have issues after running the migration:

1. Check the browser console for specific error messages
2. Check the server logs (terminal where `npm run dev` is running)
3. Ensure your `.env.local` file has all required environment variables
4. Restart the dev server after making changes

## Required Environment Variables

Make sure your `.env.local` file includes:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_postgres_connection_string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

## Current User Status

Your user has been successfully synced to the database:

```json
{
  "clerk_user_id": "user_34td4WVucN9SMO2SFCEIi0URbxE",
  "email": "alexander.mcintosh@intellibus.com",
  "role": "responder",
  "can_view_sensitive_data": true,
  "can_export_data": false,
  "can_manage_users": false
}
```

The user has `responder` role which should allow them to submit updates once the database schema is fixed.

