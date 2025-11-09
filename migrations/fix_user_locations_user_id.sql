-- Migration to create/fix user_locations.user_id to reference Better Auth's user table
-- This creates the table if it doesn't exist, or fixes the column from UUID to TEXT

-- Step 1: Create the table if it doesn't exist (with correct schema)
CREATE TABLE IF NOT EXISTS "user_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"accuracy" integer,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Step 2: Drop the old foreign key constraint if it exists
ALTER TABLE "user_locations" 
DROP CONSTRAINT IF EXISTS "user_locations_user_id_users_id_fk";

-- Step 3: If table already existed with UUID user_id, we need to handle the migration
-- First, check if column is UUID and change it to TEXT
DO $$
BEGIN
	-- Check if column exists and is UUID type
	IF EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_name = 'user_locations' 
		AND column_name = 'user_id' 
		AND data_type = 'uuid'
	) THEN
		-- Clear existing data (since UUID user_ids won't match TEXT Better Auth IDs)
		DELETE FROM "user_locations";
		
		-- Change column type from UUID to TEXT
		ALTER TABLE "user_locations" 
		ALTER COLUMN "user_id" SET DATA TYPE text;
	END IF;
END $$;

-- Step 4: Drop the new constraint if it already exists (for idempotency)
ALTER TABLE "user_locations" 
DROP CONSTRAINT IF EXISTS "user_locations_user_id_user_id_fk";

-- Step 5: Add new foreign key constraint to Better Auth's user table
ALTER TABLE "user_locations" 
ADD CONSTRAINT "user_locations_user_id_user_id_fk" 
FOREIGN KEY ("user_id") 
REFERENCES "public"."user"("id") 
ON DELETE no action 
ON UPDATE no action;

