#!/usr/bin/env node
/**
 * Test script for sign-up process
 * Creates a new user account
 * 
 * Usage:
 *   node scripts/test-signup.js <username> <password> <email>
 * 
 * Example:
 *   node scripts/test-signup.js admin password123 admin@system.local
 */

const https = require('https');
const http = require('http');

// Get command line arguments
const args = process.argv.slice(2);
const username = args[0] || process.env.TEST_USERNAME || 'admin';
const password = args[1] || process.env.TEST_PASSWORD || 'password123';
const email = args[2] || `${username}@system.local`;
const baseURL = process.env.BASE_URL || 'http://localhost:3001';

console.log('📝 Testing Sign-Up Process');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Base URL: ${baseURL}`);
console.log(`Username: ${username}`);
console.log(`Email: ${email}`);
console.log(`Password: ${'*'.repeat(password.length)}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Parse URL
const url = new URL(`${baseURL}/api/auth/sign-up/email`);
const isHttps = url.protocol === 'https:';
const client = isHttps ? https : http;

// Prepare request data
const requestData = JSON.stringify({
  email,
  password,
  name: username, // Better Auth expects 'name' field
});

const options = {
  hostname: url.hostname,
  port: url.port || (isHttps ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(requestData),
    'User-Agent': 'test-signup-script/1.0',
  },
};

console.log('📤 Sending sign-up request...\n');

const req = client.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('📥 Response received:');
    console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
    console.log('\n📄 Response Body (raw):');
    console.log(responseData || '(empty)');
    console.log('\n📄 Response Body (parsed):');
    
    try {
      const parsed = JSON.parse(responseData);
      console.log(JSON.stringify(parsed, null, 2));
      
      // Check for cookies
      const cookies = res.headers['set-cookie'];
      if (cookies && cookies.length > 0) {
        console.log('\n🍪 Cookies received:');
        cookies.forEach((cookie, index) => {
          console.log(`  ${index + 1}. ${cookie.split(';')[0]}`);
        });
      }
      
      // Success check
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('\n✅ Sign-up successful!');
        if (parsed.data?.user) {
          console.log(`   User ID: ${parsed.data.user.id}`);
          console.log(`   Email: ${parsed.data.user.email}`);
          console.log(`   Name: ${parsed.data.user.name}`);
        }
        console.log('\n💡 You can now sign in with:');
        console.log(`   npm run test:signin -- ${username} ${password}`);
      } else {
        console.log('\n❌ Sign-up failed!');
        if (parsed.error) {
          console.log(`   Error: ${parsed.error.message || parsed.error}`);
        }
        if (parsed.code) {
          console.log(`   Code: ${parsed.code}`);
        }
      }
    } catch (e) {
      console.log(responseData);
      console.log('\n⚠️  Could not parse response as JSON');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(res.statusCode === 200 || res.statusCode === 201 ? 0 : 1);
  });
});

req.on('error', (error) => {
  console.error('\n❌ Request failed:');
  console.error(`   ${error.message}`);
  
  if (error.message.includes('ECONNREFUSED')) {
    console.error('\n💡 Tip: Make sure your Next.js dev server is running!');
    console.error(`   Try: npm run dev`);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(1);
});

// Send request
req.write(requestData);
req.end();

