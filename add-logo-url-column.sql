-- Add logo_url column to online_retailers table
-- This will safely add the column only if it doesn't already exist

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'online_retailers' 
    AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE online_retailers ADD COLUMN logo_url TEXT;
  END IF;
END $$;

-- Add comment to describe the column
COMMENT ON COLUMN online_retailers.logo_url IS 'URL to retailer logo/thumbnail stored in Supabase storage bucket';

