/**
 * Check current geographic distribution of assets, people, and places
 */

// Load environment variables FIRST before any other imports
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' }); // Fallback to .env if .env.local doesn't exist

import { db } from '../lib/db/index.js';
import { warehouses, warehouseInventory, people, places } from '../lib/db/schema.js';
import { sql } from 'drizzle-orm';

async function checkDistribution() {
  console.log('🔍 Checking current data distribution...\n');

  // Check warehouses (from geographic assets)
  const warehouseLocs = await db
    .select({
      lat: warehouses.latitude,
      lng: warehouses.longitude,
      name: warehouses.name,
      parish: sql<string>`(SELECT name FROM parishes WHERE id = ${warehouses.parishId})`,
    })
    .from(warehouses)
    .limit(30);

  console.log('📦 WAREHOUSES (from geographic assets):');
  console.log(JSON.stringify(warehouseLocs, null, 2));
  
  const warehouseCount = await db.select({ count: sql<number>`count(*)` }).from(warehouses);
  console.log(`Total warehouses: ${warehouseCount[0]?.count || 0}`);

  // Check warehouse inventory
  const inventoryCount = await db.select({ count: sql<number>`count(*)` }).from(warehouseInventory);
  console.log(`Total inventory items: ${inventoryCount[0]?.count || 0}`);

  // Check people distribution
  const peopleLocs = await db
    .select({
      lat: people.latitude,
      lng: people.longitude,
      name: people.name,
      type: people.type,
      parish: sql<string>`(SELECT name FROM parishes WHERE id = ${people.parishId})`,
    })
    .from(people)
    .limit(30);

  console.log('\n👥 PEOPLE (geographic seed):');
  console.log(JSON.stringify(peopleLocs, null, 2));
  
  const peopleCount = await db.select({ count: sql<number>`count(*)` }).from(people);
  console.log(`Total people: ${peopleCount[0]?.count || 0}`);

  // Check places distribution
  const placesLocs = await db
    .select({
      lat: places.latitude,
      lng: places.longitude,
      name: places.name,
      type: places.type,
      parish: sql<string>`(SELECT name FROM parishes WHERE id = ${places.parishId})`,
    })
    .from(places)
    .limit(30);

  console.log('\n🏢 PLACES (geographic seed):');
  console.log(JSON.stringify(placesLocs, null, 2));
  
  const placesCount = await db.select({ count: sql<number>`count(*)` }).from(places);
  console.log(`Total places: ${placesCount[0]?.count || 0}`);

  // Check parish distribution for warehouses
  const warehouseParishDist = await db
    .select({
      parish: sql<string>`(SELECT name FROM parishes WHERE id = ${warehouses.parishId})`,
      count: sql<number>`count(*)`,
    })
    .from(warehouses)
    .groupBy(sql`(SELECT name FROM parishes WHERE id = ${warehouses.parishId})`);

  console.log('\n📍 WAREHOUSES BY PARISH:');
  console.log(JSON.stringify(warehouseParishDist, null, 2));

  // Check parish distribution for people
  const peopleParishDist = await db
    .select({
      parish: sql<string>`(SELECT name FROM parishes WHERE id = ${people.parishId})`,
      count: sql<number>`count(*)`,
    })
    .from(people)
    .groupBy(sql`(SELECT name FROM parishes WHERE id = ${people.parishId})`);

  console.log('\n📍 PEOPLE BY PARISH:');
  console.log(JSON.stringify(peopleParishDist, null, 2));

  // Check parish distribution for places
  const placesParishDist = await db
    .select({
      parish: sql<string>`(SELECT name FROM parishes WHERE id = ${places.parishId})`,
      count: sql<number>`count(*)`,
    })
    .from(places)
    .groupBy(sql`(SELECT name FROM parishes WHERE id = ${places.parishId})`);

  console.log('\n📍 PLACES BY PARISH:');
  console.log(JSON.stringify(placesParishDist, null, 2));
}

checkDistribution()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });

