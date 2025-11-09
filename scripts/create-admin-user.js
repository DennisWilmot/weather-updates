#!/usr/bin/env node
/**
 * Create admin user script
 * Creates an admin user with the specified credentials
 */

const https = require('https');
const http = require('http');

const email = 'admin@system.local';
const password = 'Intellibus123';
const name = 'admin';
const baseURL = process.env.BASE_URL || 'http://localhost:3001';

console.log('📝 Creating Admin User');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Base URL: ${baseURL}`);
console.log(`Email: ${email}`);
console.log(`Name: ${name}`);
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
    'User-Agent': 'create-admin-user-script/1.0',
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
    console.log('\n📄 Response Body:');
    
    try {
      const parsed = JSON.parse(responseData);
      console.log(JSON.stringify(parsed, null, 2));
      
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('\n✅ Admin user created successfully!');
        if (parsed.data?.user) {
          console.log(`   User ID: ${parsed.data.user.id}`);
          console.log(`   Email: ${parsed.data.user.email}`);
          console.log(`   Name: ${parsed.data.user.name}`);
        }
        console.log('\n💡 You can now sign in with:');
        console.log(`   Username: admin`);
        console.log(`   Password: Intellibus123`);
      } else {
        console.log('\n❌ Failed to create user!');
        if (parsed.error) {
          console.log(`   Error: ${parsed.error.message || parsed.error}`);
        }
        if (parsed.code) {
          console.log(`   Code: ${parsed.code}`);
        }
        // If user already exists, that's okay
        if (parsed.code === 'USER_ALREADY_EXISTS' || parsed.message?.includes('already exists')) {
          console.log('\n⚠️  User already exists. You can sign in with existing credentials.');
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

