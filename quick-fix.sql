-- Quick Fix: Add submission_type column to submissions table
-- Run this in Supabase SQL Editor to fix the missing column error

ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS submission_type TEXT DEFAULT 'citizen'
CHECK (submission_type IN ('citizen', 'responder'));

-- Update any existing records to be marked as 'citizen' for backward compatibility
UPDATE submissions
SET submission_type = 'citizen'
WHERE submission_type IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_submissions_submission_type ON submissions(submission_type);

-- Add comment to column for documentation
COMMENT ON COLUMN submissions.submission_type IS 'Distinguishes citizen reports from responder updates';

-- Verify the column was added successfully
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'submissions'
AND column_name = 'submission_type';

