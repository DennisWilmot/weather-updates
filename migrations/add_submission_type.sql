-- Add submissionType column to submissions table
-- This migration adds a field to distinguish between citizen and responder submissions

ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS submission_type TEXT DEFAULT 'citizen'
CHECK (submission_type IN ('citizen', 'responder'));

-- Update any existing records to be marked as 'citizen' for backward compatibility
UPDATE submissions
SET submission_type = 'citizen'
WHERE submission_type IS NULL;

-- Add comment to column for documentation
COMMENT ON COLUMN submissions.submission_type IS 'Distinguishes citizen reports from responder updates';
