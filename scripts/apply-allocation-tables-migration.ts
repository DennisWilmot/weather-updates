/**
 * Apply allocation tables migration
 * 
 * Applies the migration for warehouses, warehouse_inventory, allocation_plans,
 * and allocation_shipments tables..
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables from .env
config({ path: '.env' });
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in environment variables.');
  console.error('Please ensure .env or .env.local exists and contains DATABASE_URL');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function applyMigration() {
  try {
    console.log('Reading migration file...');
    const migrationSQL = readFileSync(
      join(process.cwd(), 'drizzle', '0006_vengeful_the_order.sql'),
      'utf-8'
    );

    console.log('Applying migration...');
    // Split by statement-breakpoint and execute each statement
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        await sql.unsafe(statement);
        console.log(`✓ Executed: ${statement.substring(0, 50)}...`);
      }
    }

    console.log('✓ Migration applied successfully!');
  } catch (error) {
    console.error('Error applying migration:', error);
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
    console.error('Migration failed:', error);
    process.exit(1);
  });

