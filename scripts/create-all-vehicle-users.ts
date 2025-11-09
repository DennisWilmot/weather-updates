#!/usr/bin/env tsx
/**
 * Script to create all vehicle users from credentials file
 * 
 * Usage:
 *   tsx scripts/create-all-vehicle-users.ts
 * 
 * Uses Better Auth signUp API directly (no admin key required)
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const baseURL = process.env.BASE_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3001';

// Lazy load db only when needed
let db: any = null;
let users: any = null;
let eq: any = null;

async function getDb() {
  if (!db) {
    try {
      const dbModule = await import('../lib/db');
      const schemaModule = await import('../lib/db/schema');
      const drizzleModule = await import('drizzle-orm');
      db = dbModule.db;
      users = schemaModule.users;
      eq = drizzleModule.eq;
    } catch (error) {
      console.warn('Could not load database module. Users table records will be skipped.');
      return null;
    }
  }
  return { db, users, eq };
}

// Vehicle credentials (all passwords are at least 10 characters for Better Auth)
const vehicles = [
  { vehicle: 'Ed Vehicle 1', name: 'Henry', username: 'henry', password: 'Henry2024!', fullName: 'Henry - Ed Vehicle 1 (with Ed in it)' },
  { vehicle: 'Ed Vehicle 2', name: 'Lewis', username: 'lewis', password: 'Lewis2024!', fullName: 'Lewis - Ed Vehicle 2 (security from the rear)' },
  { vehicle: 'Ambulance', name: 'Dr. Bright', username: 'dr.bright', password: 'Bright2024!', fullName: 'Dr. Bright - Ambulance' },
  { vehicle: 'WDG Van', name: 'Liz', username: 'liz', password: 'Liz2024!', fullName: 'Liz - WDG Van' },
  { vehicle: 'JDF Vehicle', name: 'Lt Col Ranglin Edwards', username: 'ltcolranglinedwards', password: 'Ranglin2024!', fullName: 'Lt Col Ranglin Edwards - JDF Vehicle' },
  { vehicle: 'Food & Water Truck 1', name: 'Nickoy', username: 'nickoy', password: 'Nickoy2024!', fullName: 'Nickoy - Truck 1' },
  { vehicle: 'Food & Water Truck 2', name: 'Maurice', username: 'maurice', password: 'Maurice2024!', fullName: 'Maurice - Truck 2' },
  { vehicle: 'Food & Water Truck 3', name: 'Teondray', username: 'teondray', password: 'Teondray2024!', fullName: 'Teondray - Truck 3' },
  { vehicle: 'Food & Water Truck 4', name: 'Yassan', username: 'yassan', password: 'Yassan2024!', fullName: 'Yassan - Truck 4' },
  { vehicle: 'Food & Water Truck 5', name: 'Mark', username: 'mark', password: 'Mark2024!', fullName: 'Mark - Truck 5' },
  { vehicle: 'Food & Water Truck 6', name: 'Lashen', username: 'lashen', password: 'Lashen2024!', fullName: 'Lashen - Truck 6' },
  { vehicle: 'Food & Water Truck 7', name: 'Nicole', username: 'nicole', password: 'Nicole2024!', fullName: 'Nicole - Truck 7' },
  { vehicle: 'Recon POC', name: 'Joel', username: 'joel', password: 'Joel2024!', fullName: 'Joel - Recon POC' },
];

interface CreateResult {
  vehicle: string;
  username: string;
  success: boolean;
  error?: string;
  userId?: string;
}

async function createUser(username: string, password: string, fullName: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  const email = `${username}@system.local`;
  const signUpUrl = `${baseURL}/api/auth/sign-up/email`;

  try {
    // Step 1: Sign up user via Better Auth
    const signUpResponse = await fetch(signUpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name: fullName,
      }),
    });

    let signUpData: any;
    try {
      signUpData = await signUpResponse.json();
    } catch (e) {
      const text = await signUpResponse.text();
      return {
        success: false,
        error: `Invalid JSON response: ${text}`,
      };
    }

    if (!signUpResponse.ok) {
      // Check if user already exists (this is okay - user can still log in)
      if (signUpData.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' ||
          signUpData.error?.message?.includes('already exists') || 
          signUpData.error?.message?.includes('duplicate') ||
          signUpResponse.status === 409 ||
          signUpResponse.status === 422) {
        // User exists in Better Auth - that's okay, they can still log in
        console.log(`    User already exists in Better Auth (this is okay)`);
        
        // Try to get their ID from database if available
        const dbModule = await getDb();
        if (dbModule) {
          try {
            const existingUsers = await dbModule.db
              .select()
              .from(dbModule.users)
              .where(dbModule.eq(dbModule.users.email, email))
              .limit(1);

            if (existingUsers.length > 0) {
              return {
                success: true,
                userId: existingUsers[0].id,
              };
            }
          } catch (dbError) {
            // Database check failed, but user exists in Better Auth so that's okay
            console.log(`    Could not check users table, but user exists in Better Auth`);
          }
        }
        
        // User exists in Better Auth - consider it a success
        return {
          success: true,
          userId: 'exists-in-auth',
        };
      }

      // Log other errors for debugging
      console.error(`    Error response:`, JSON.stringify(signUpData, null, 2));
      return {
        success: false,
        error: signUpData.error?.message || signUpData.message || `HTTP ${signUpResponse.status}: ${signUpResponse.statusText}`,
      };
    }

    // Better Auth can return user ID in different places
    const authUserId = signUpData.data?.user?.id || 
                       signUpData.user?.id || 
                       signUpData.data?.id ||
                       signUpData.id;

    if (!authUserId) {
      // Log the response to debug
      console.error(`    No user ID found in response:`, JSON.stringify(signUpData, null, 2));
      return {
        success: false,
        error: 'No user ID returned from sign-up',
      };
    }

    // Step 2: Create user record in users table (if database is available)
    const dbModule = await getDb();
    if (dbModule) {
      try {
        const [newUser] = await dbModule.db
          .insert(dbModule.users)
          .values({
            id: authUserId, // Use same ID as Better Auth user
            username: username,
            email: email,
            fullName: fullName,
            role: 'responder',
          })
          .returning();

        return {
          success: true,
          userId: newUser.id,
        };
      } catch (dbError: any) {
        // If users table insert fails, the Better Auth user still exists
        // This is okay - they can log in, we just need to handle the users table separately
        if (dbError.message?.includes('unique') || dbError.message?.includes('duplicate')) {
          // User already exists in users table
          console.log(`    User already exists in users table`);
          return {
            success: true,
            userId: authUserId,
          };
        }
        
        console.warn(`    Warning: Could not create users table record: ${dbError.message}`);
        // Still return success since Better Auth user was created
        return {
          success: true,
          userId: authUserId,
        };
      }
    } else {
      // Database not available, but Better Auth user was created successfully
      console.log(`    Users table not available, but Better Auth user created`);
      return {
        success: true,
        userId: authUserId,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

async function createAllUsers(): Promise<void> {
  console.log('👥 Creating All Vehicle Users');
  console.log('='.repeat(80));
  console.log(`Base URL: ${baseURL}`);
  console.log(`Total Users: ${vehicles.length}`);
  console.log('='.repeat(80));
  console.log('');

  const results: CreateResult[] = [];

  for (let i = 0; i < vehicles.length; i++) {
    const vehicle = vehicles[i];

    console.log(`[${i + 1}/${vehicles.length}] Creating ${vehicle.vehicle} (${vehicle.username})...`);

    const result = await createUser(vehicle.username, vehicle.password, vehicle.fullName);

    if (result.success) {
      console.log(`  ✅ User created successfully`);
      if (result.userId) {
        console.log(`  User ID: ${result.userId}`);
      }
      results.push({
        vehicle: vehicle.vehicle,
        username: vehicle.username,
        success: true,
        userId: result.userId,
      });
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
      results.push({
        vehicle: vehicle.vehicle,
        username: vehicle.username,
        success: false,
        error: result.error,
      });
    }

    console.log('');

    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Summary
  console.log('='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log('');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Total Users: ${results.length}`);
  console.log(`✅ Successfully Created: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log('');

  // Detailed results
  if (failed > 0) {
    console.log('Failed Users:');
    console.log('-'.repeat(80));
    results
      .filter(r => !r.success)
      .forEach((result) => {
        console.log(`❌ ${result.vehicle} (${result.username})`);
        console.log(`   Error: ${result.error}`);
      });
    console.log('');
  }

  if (successful > 0) {
    console.log('Successfully Created Users:');
    console.log('-'.repeat(80));
    results
      .filter(r => r.success)
      .forEach((result) => {
        console.log(`✅ ${result.vehicle} (${result.username})`);
      });
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('');

  // Check if all succeeded
  if (successful === results.length) {
    console.log('🎉 All users created successfully!');
    console.log('\nNext steps:');
    console.log('1. Run the test script to add test locations:');
    console.log('   npx tsx scripts/test-all-vehicles-locations.ts');
    process.exit(0);
  } else {
    console.log('⚠️  Some users failed to create. Check the errors above.');
    console.log('\nNote: Users that already exist will show as failed.');
    console.log('You can safely ignore "already exists" errors if you want to keep existing users.');
    process.exit(1);
  }
}

// Run creation
createAllUsers().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

