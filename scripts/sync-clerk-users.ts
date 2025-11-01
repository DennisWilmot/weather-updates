import clerk from '@clerk/clerk-sdk-node';
import { db } from '../lib/db';
import { users } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Sync all Clerk users to the database
 * Run this script to sync existing Clerk users
 * 
 * Usage:
 * - As API route: POST /api/users/sync-all
 * - Or run directly with: npx tsx scripts/sync-clerk-users.ts
 */

async function syncAllUsers() {
  const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

  if (!CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY environment variable is not set');
  }
  
  try {
    console.log('Starting Clerk user sync...');
    console.log('CLERK_SECRET_KEY exists:', !!CLERK_SECRET_KEY);
    console.log('CLERK_SECRET_KEY starts with:', CLERK_SECRET_KEY.substring(0, 7));
    
    // First, test by getting a specific user that we know exists
    const testUserId = 'user_34kWo1MOLruZlaV3EUjqxKudmQv';
    try {
      console.log(`\n=== TESTING SPECIFIC USER ===`);
      console.log(`Attempting to fetch user: ${testUserId}`);
      const specificUser = await clerk.users.getUser(testUserId);
      console.log('✅ Successfully fetched specific user!');
      console.log('User ID:', specificUser.id);
      console.log('User email:', specificUser.emailAddresses?.[0]?.emailAddress);
      console.log('User name:', `${specificUser.firstName || ''} ${specificUser.lastName || ''}`.trim() || 'N/A');
    } catch (testError: any) {
      console.error('❌ Failed to fetch specific user');
      console.error('Error:', testError.message);
      console.error('Error code:', testError.statusCode);
      console.error('Error details:', testError);
    }
    
    // Test Clerk connection by trying to get user list
    try {
      console.log(`\n=== TESTING USER LIST API ===`);
      const testResponse = await clerk.users.getUserList({ limit: 1 });
      console.log('Test response type:', Array.isArray(testResponse) ? 'array' : typeof testResponse);
      console.log('Test response length:', Array.isArray(testResponse) ? testResponse.length : 'N/A');
      
      if (Array.isArray(testResponse) && testResponse.length > 0) {
        console.log('✅ User list API works! Found', testResponse.length, 'user(s)');
      } else {
        console.log('⚠️ User list API returned empty array');
      }
    } catch (testError: any) {
      console.error('❌ CLERK CONNECTION TEST FAILED');
      console.error('Test error:', testError.message);
      console.error('Error code:', testError.statusCode);
      console.error('Error details:', testError);
      throw testError;
    }
    
    // First, sync the specific user we know exists
    let allUsers: any[] = [];
    const knownUserId = 'user_34kWo1MOLruZlaV3EUjqxKudmQv';
    try {
      console.log(`\n=== SYNCING KNOWN USER ===`);
      const specificUser = await clerk.users.getUser(knownUserId);
      console.log('✅ Fetched user:', specificUser.id, specificUser.emailAddresses?.[0]?.emailAddress);
      
      // Add to sync list
      allUsers.push(specificUser);
    } catch (error: any) {
      console.error('❌ Failed to fetch known user:', error.message);
    }
    
    // Then try to get user list (may return empty due to API quirks)
    try {
      console.log(`\n=== FETCHING USER LIST ===`);
      const listResponse = await clerk.users.getUserList({ limit: 500 });
      
      if (Array.isArray(listResponse) && listResponse.length > 0) {
        console.log(`✅ Found ${listResponse.length} users in list`);
        // Add users that aren't already in our list
        const existingIds = new Set(allUsers.map(u => u.id));
        const newUsers = listResponse.filter(u => !existingIds.has(u.id));
        allUsers = [...allUsers, ...newUsers];
        console.log(`Added ${newUsers.length} new users from list`);
      } else {
        console.log('⚠️ getUserList returned empty array');
      }
    } catch (listError: any) {
      console.error('❌ getUserList failed:', listError.message);
      // Continue anyway - we'll sync what we have
    }
    
    console.log(`Found ${allUsers.length} total users to sync`);
    
    let synced = 0;
    let created = 0;
    let updated = 0;
    let errors = 0;
    
    // Sync each user
    for (const clerkUser of allUsers) {
      try {
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.clerkUserId, clerkUser.id))
          .limit(1);
        
        const userData = {
          clerkUserId: clerkUser.id,
          email: clerkUser.emailAddresses?.[0]?.emailAddress || null,
          firstName: clerkUser.firstName || null,
          lastName: clerkUser.lastName || null,
          fullName: clerkUser.firstName && clerkUser.lastName 
            ? `${clerkUser.firstName} ${clerkUser.lastName}` 
            : clerkUser.firstName || clerkUser.lastName || null,
          phoneNumber: clerkUser.phoneNumbers?.[0]?.phoneNumber || null,
          imageUrl: clerkUser.imageUrl || null,
          lastActiveAt: new Date(),
          updatedAt: new Date(),
        };
        
        if (existingUser.length > 0) {
          // Update existing user
          await db
            .update(users)
            .set(userData)
            .where(eq(users.clerkUserId, clerkUser.id));
          updated++;
        } else {
          // Create new user with default role 'responder'
          await db.insert(users).values({
            ...userData,
            role: 'responder', // Default role
          });
          created++;
        }
        
        synced++;
      } catch (error) {
        console.error(`Error syncing user ${clerkUser.id}:`, error);
        errors++;
      }
    }
    
    console.log('\nSync complete!');
    console.log(`Total users: ${allUsers.length}`);
    console.log(`Synced: ${synced}`);
    console.log(`Created: ${created}`);
    console.log(`Updated: ${updated}`);
    console.log(`Errors: ${errors}`);
    
    return {
      total: allUsers.length,
      synced,
      created,
      updated,
      errors,
    };
  } catch (error) {
    console.error('Error syncing users:', error);
    throw error;
  }
}

// If run directly (not imported)
if (require.main === module) {
  const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

  if (!CLERK_SECRET_KEY) {
    console.error('CLERK_SECRET_KEY environment variable is not set');
    process.exit(1);
  }

  syncAllUsers()
    .then(() => {
      console.log('Sync completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Sync failed:', error);
      process.exit(1);
    });
}

export { syncAllUsers };

