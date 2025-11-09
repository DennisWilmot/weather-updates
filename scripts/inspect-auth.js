#!/usr/bin/env node
/**
 * Inspect the Better Auth instance structure
 * This helps us understand what properties are available
 */

// Mock request for testing
const mockRequest = {
  headers: {
    get: (name) => {
      if (name === 'host') return 'localhost:3001';
      if (name === 'x-forwarded-proto') return 'http';
      return null;
    }
  }
};

// Import auth (this will run in Node.js context, not webpack)
try {
  // Use dynamic import to avoid webpack bundling issues
  const authModule = require('../lib/auth.ts');
  
  console.log('🔍 Inspecting Better Auth Instance Structure');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Try to create an auth instance
  if (authModule.createAuthInstance) {
    console.log('✅ createAuthInstance function found');
    const auth = authModule.createAuthInstance(mockRequest);
    
    console.log('\n📋 Auth Instance Properties:');
    console.log('Keys:', Object.keys(auth));
    console.log('\nDetailed structure:');
    
    for (const key of Object.keys(auth)) {
      const value = auth[key];
      console.log(`  ${key}:`, typeof value, value instanceof Function ? '[Function]' : '');
    }
    
    console.log('\n🔍 Checking for handler:');
    console.log('  auth.handler:', typeof auth.handler, auth.handler);
    console.log('  auth.handle:', typeof auth.handle, auth.handle);
    console.log('  auth.api:', typeof auth.api, auth.api);
    if (auth.api) {
      console.log('    auth.api.handler:', typeof auth.api?.handler, auth.api?.handler);
    }
    
  } else {
    console.log('❌ createAuthInstance not found');
    console.log('Available exports:', Object.keys(authModule));
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
}

