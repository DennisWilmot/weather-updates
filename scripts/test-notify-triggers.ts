/**
 * Quick test script to verify NOTIFY triggers are working
 */

import postgres from 'postgres';
import { Client } from 'pg';
import { config } from 'dotenv';

config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found');
  process.exit(1);
}

// TypeScript assertion: DATABASE_URL is guaranteed to be defined after the check above
const dbUrl: string = DATABASE_URL;

async function testTriggers() {
  const sql = postgres(dbUrl);
  
  try {
    console.log('🔍 Checking triggers...\n');
    
    // Check function
    const functionExists = await sql`
      SELECT proname FROM pg_proc WHERE proname = 'notify_map_update'
    `;
    
    if (functionExists.length === 0) {
      console.error('❌ Function notify_map_update() does not exist!');
      console.log('   Run: npm run db:apply-notify-triggers');
      process.exit(1);
    }
    console.log('✓ Function notify_map_update() exists');
    
    // Check triggers
    const triggers = await sql`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_name LIKE '%_notify'
      ORDER BY event_object_table
    `;
    
    console.log(`\n📋 Found ${triggers.length} triggers:`);
    triggers.forEach(t => {
      console.log(`   ✓ ${t.trigger_name} on ${t.event_object_table}`);
    });
    
    if (triggers.length < 6) {
      console.warn(`\n⚠️  Expected 6 triggers, found ${triggers.length}`);
    }
    
    // Test LISTEN
    console.log('\n🔊 Testing LISTEN connection...');
    let notificationReceived = false;
    
    const listenClient = new Client({
      connectionString: dbUrl,
    });
    
    await listenClient.connect();
    
    listenClient.on('notification', (msg) => {
      console.log(`\n✅ Notification received!`);
      console.log(`   Channel: ${msg.channel}`);
      console.log(`   Payload: ${msg.payload}`);
      notificationReceived = true;
    });
    
    await listenClient.query('LISTEN map_updates');
    console.log('✓ LISTEN started on channel: map_updates');
    
    // Wait a moment, then send test notification
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('\n📤 Sending test notification...');
    await sql`SELECT pg_notify('map_updates', '{"table":"test","operation":"INSERT","id":"test-123"}')`;
    
    // Wait for notification
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (notificationReceived) {
      console.log('\n✅ LISTEN is working correctly!');
    } else {
      console.warn('\n⚠️  Notification not received (may be a timing issue)');
    }
    
    // Test actual trigger
    console.log('\n🧪 Testing actual trigger...');
    console.log('   Inserting test record into places table...');
    
    const parishId = await sql`SELECT id FROM parishes LIMIT 1`;
    const communityId = await sql`SELECT id FROM communities LIMIT 1`;
    
    if (parishId.length === 0 || communityId.length === 0) {
      console.warn('⚠️  No parishes/communities found, skipping trigger test');
    } else {
      notificationReceived = false;
      
      const result = await sql`
        INSERT INTO places (name, type, parish_id, community_id, latitude, longitude, address)
        VALUES ('NOTIFY TEST PLACE', 'hospital', ${parishId[0].id}, ${communityId[0].id}, 18.0, -76.8, 'Test Address')
        RETURNING id
      `;
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (notificationReceived) {
        console.log('✅ Trigger fired successfully!');
        console.log(`   Created place ID: ${result[0].id}`);
        
        // Cleanup
        await sql`DELETE FROM places WHERE id = ${result[0].id}`;
        console.log('   ✓ Test record cleaned up');
      } else {
        console.warn('⚠️  Trigger may not have fired (check server logs)');
      }
    }
    
    await listenClient.query('UNLISTEN map_updates');
    await listenClient.end();
    
    console.log('\n✅ Test complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Open http://localhost:3000 in browser');
    console.log('   2. Open DevTools → Network → Filter: "stream"');
    console.log('   3. Insert/update data and watch for SSE updates');
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.code === '53300') {
      console.error('\n💡 Max connections reached!');
      console.error('   Each SSE connection creates a LISTEN connection.');
      console.error('   Need to share a single LISTEN connection across all SSE streams.');
    }
    throw error;
  } finally {
    await sql.end();
  }
}

testTriggers()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

