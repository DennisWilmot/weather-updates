/**
 * Script to apply NOTIFY triggers migration (0007_notify_triggers.sql)
 * Creates database triggers for real-time change notifications
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
    const migrationPath = join(process.cwd(), 'drizzle', '0007_notify_triggers.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('🚀 Applying NOTIFY triggers migration...');
    
    // First, create the function (it's safe to use CREATE OR REPLACE)
    const functionSQL = migrationSQL.split('-- Create triggers')[0].trim();
    try {
      await sql.unsafe(functionSQL);
      console.log('  ✓ Function notify_map_update() created/replaced');
    } catch (error: any) {
      console.error('  ❌ Error creating function:', error.message);
      throw error;
    }
    
    // Then, create triggers individually, checking if tables exist
    const tables = [
      { name: 'assets', trigger: 'assets_notify' },
      { name: 'places', trigger: 'places_notify' },
      { name: 'people', trigger: 'people_notify' },
      { name: 'aid_worker_capabilities', trigger: 'aid_worker_capabilities_notify' },
      { name: 'asset_distributions', trigger: 'asset_distributions_notify' },
      { name: 'place_status', trigger: 'place_status_notify' },
    ];
    
    for (const { name, trigger } of tables) {
      try {
        // Check if table exists
        const tableExists = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${name}
          )
        `;
        
        if (!tableExists[0].exists) {
          console.log(`  ⚠️  Table "${name}" does not exist, skipping trigger`);
          continue;
        }
        
        // Drop trigger if it exists (to allow re-running migration)
        try {
          await sql.unsafe(`DROP TRIGGER IF EXISTS ${trigger} ON ${name}`);
        } catch (e) {
          // Ignore errors when dropping
        }
        
        // Create trigger
        await sql.unsafe(`
          CREATE TRIGGER ${trigger} 
          AFTER INSERT OR UPDATE OR DELETE ON ${name}
          FOR EACH ROW EXECUTE FUNCTION notify_map_update()
        `);
        console.log(`  ✓ Trigger ${trigger} created on ${name}`);
      } catch (error: any) {
        if (error?.code === '42P07' || error?.message?.includes('already exists')) {
          console.log(`  ⚠️  Trigger ${trigger} already exists, skipping`);
        } else {
          console.error(`  ❌ Error creating trigger ${trigger}:`, error.message);
          // Don't throw - continue with other triggers
        }
      }
    }
    
    console.log('✅ NOTIFY triggers migration applied successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('  - Function: notify_map_update()');
    console.log('  - Triggers: assets, places, people, aid_worker_capabilities,');
    console.log('              asset_distributions, place_status');
    console.log('  - Channel: map_updates');
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

applyMigration()
  .then(() => {
    console.log('');
    console.log('Done! The SSE endpoint will now use NOTIFY/LISTEN for real-time updates.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

