/**
 * Script to apply schema refactor migration (0003_nostalgic_galactus.sql)
 * This applies the new entity-based schema structure
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables from .env
config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in environment variables.');
  console.error('Please ensure .env exists and contains DATABASE_URL');
  process.exit(1);
}

async function applyMigration() {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  const sql = postgres(DATABASE_URL);
  
  try {
    console.log('📦 Reading migration file...');
    const migrationPath = join(process.cwd(), 'drizzle', '0003_nostalgic_galactus.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('🚀 Applying migration...');
    
    // Split by statement-breakpoint and execute each statement
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await sql.unsafe(statement);
          console.log('  ✓ Executed statement');
        } catch (error: any) {
          // Ignore "already exists" errors for tables/indexes
          if (error?.code === '42P07' || error?.message?.includes('already exists')) {
            console.log(`  ⚠️  Skipped (already exists): ${error.message.split('\n')[0]}`);
          } else {
            throw error;
          }
        }
      }
    }
    
    // Mark migration as applied in drizzle migrations table
    console.log('📝 Recording migration in drizzle_migrations...');
    try {
      await sql`
        INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
        VALUES ('0003_nostalgic_galactus', ${Date.now()})
        ON CONFLICT DO NOTHING
      `;
      console.log('  ✓ Migration recorded');
    } catch (error: any) {
      if (error?.code === '42P01') {
        // Table doesn't exist, create it first
        console.log('  Creating drizzle migrations table...');
        await sql`
          CREATE SCHEMA IF NOT EXISTS drizzle;
          CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
            id SERIAL PRIMARY KEY,
            hash text NOT NULL,
            created_at bigint
          );
        `;
        await sql`
          INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
          VALUES ('0003_nostalgic_galactus', ${Date.now()})
        `;
        console.log('  ✓ Migration recorded');
      } else {
        console.log(`  ⚠️  Could not record migration: ${error.message}`);
      }
    }
    
    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

applyMigration()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

