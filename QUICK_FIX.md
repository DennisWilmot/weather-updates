# Quick Fix for User Unable to Submit Updates

## The Issue

You have a user in the database but they cannot submit updates. This is likely due to a missing database column: `submission_type`.

## Immediate Fix

Run this SQL in your Supabase SQL Editor:

```sql
-- Add the missing submission_type column
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS submission_type TEXT DEFAULT 'citizen'
CHECK (submission_type IN ('citizen', 'responder'));

-- Update existing records
UPDATE submissions
SET submission_type = 'citizen'
WHERE submission_type IS NULL;
```

## Complete Fix

For a complete fix that adds ALL missing columns and tables, run the `complete-schema-migration.sql` file in Supabase SQL Editor.

## Verify It Works

After running the migration:

1. Refresh your browser at http://localhost:3000
2. Go to the "Report" tab
3. Try submitting an update

## If Still Not Working

1. Check browser console for errors
2. Check server terminal for errors
3. Restart the dev server:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

## Your User Status

Current user synced:
- **Clerk ID**: `user_34td4WVucN9SMO2SFCEIi0URbxE`
- **Email**: alexander.mcintosh@intellibus.com
- **Role**: `responder` ✅
- **Permissions**: Can submit updates ✅

The user has the correct role and permissions. The issue is 100% the missing database column.

