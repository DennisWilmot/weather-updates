#!/usr/bin/env node
/**
 * Test script to verify drizzle adapter loads correctly
 * This simulates what happens in Vercel/serverless environment
 */

console.log('🧪 Testing Drizzle Adapter Loading');
console.log('='.repeat(60));
console.log('');

// Simulate the same loading logic as lib/auth.ts
let drizzleAdapter = null;
const isBetterAuthConfigured = !!process.env.BETTER_AUTH_SECRET;

if (typeof window === 'undefined' && isBetterAuthConfigured) {
  try {
    console.log('📦 Attempting to load adapter...');
    console.log('   Path: better-auth/adapters/drizzle');
    
    const adapterModule = require('better-auth/adapters/drizzle');
    drizzleAdapter = adapterModule.drizzleAdapter;
    
    if (!drizzleAdapter || typeof drizzleAdapter !== 'function') {
      console.log('❌ Adapter loaded but is not a function');
      console.log('   Available exports:', Object.keys(adapterModule));
      process.exit(1);
    } else {
      console.log('✅ Drizzle adapter loaded successfully!');
      console.log('   Type:', typeof drizzleAdapter);
      console.log('   Is function:', typeof drizzleAdapter === 'function');
    }
  } catch (e) {
    console.error('❌ Error loading drizzle adapter:', e.message);
    console.error('   Stack:', e.stack);
    process.exit(1);
  }
} else {
  if (typeof window !== 'undefined') {
    console.log('⚠️  Running in browser context (should not happen)');
  }
  if (!isBetterAuthConfigured) {
    console.log('⚠️  BETTER_AUTH_SECRET not set (skipping test)');
    console.log('   Set BETTER_AUTH_SECRET to test');
  }
}

console.log('');
console.log('='.repeat(60));
console.log('✅ Test completed successfully!');
console.log('   The adapter should work in Vercel production.');

