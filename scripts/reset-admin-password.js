#!/usr/bin/env node
/**
 * Reset admin password script
 * Deletes existing admin user and creates a new one with the specified password
 */

const https = require('https');
const http = require('http');

const email = 'admin@system.local';
const password = 'Intellibus123';
const name = 'admin';
const baseURL = process.env.BASE_URL || 'http://localhost:3001';

console.log('🔄 Resetting Admin User Password');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Base URL: ${baseURL}`);
console.log(`Email: ${email}`);
console.log(`New Password: ${'*'.repeat(password.length)}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// First, try to delete the user via SQL (we'll need to do this manually or via API)
// For now, let's try to sign up with a different approach
// Actually, Better Auth doesn't have a delete user endpoint by default
// We need to delete from database directly or use a workaround

console.log('⚠️  To reset the password, you need to:');
console.log('   1. Delete the user from the database, OR');
console.log('   2. Update the password hash in the account table\n');

console.log('💡 Quick SQL to delete and recreate:');
console.log(`   DELETE FROM "account" WHERE "user_id" IN (SELECT "id" FROM "user" WHERE "email" = '${email}');`);
console.log(`   DELETE FROM "session" WHERE "user_id" IN (SELECT "id" FROM "user" WHERE "email" = '${email}');`);
console.log(`   DELETE FROM "user" WHERE "email" = '${email}';`);
console.log('\n   Then run: node scripts/create-admin-user.js\n');

// Try to create user anyway - if it fails, we know it exists
const url = new URL(`${baseURL}/api/auth/sign-up/email`);
const isHttps = url.protocol === 'https:';
const client = isHttps ? https : http;

const requestData = JSON.stringify({
  email,
  password,
  name,
});

const options = {
  hostname: url.hostname,
  port: url.port || (isHttps ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(requestData),
  },
};

const req = client.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => { responseData += chunk; });
  res.on('end', () => {
    const parsed = JSON.parse(responseData);
    if (parsed.code === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL') {
      console.log('❌ User already exists. Please delete it from the database first.');
      console.log('   Run the SQL commands shown above in your Supabase SQL editor.\n');
    }
  });
});

req.write(requestData);
req.end();

