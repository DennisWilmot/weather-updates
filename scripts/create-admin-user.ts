/**
 * Script to create an admin user using Better Auth sign-up API
 * Usage: tsx scripts/create-admin-user.ts
 * 
 * Note: This uses the HTTP API endpoint, so the Next.js server should be running
 * or you can use the server-side API approach instead
 */

import 'dotenv/config';

async function createAdminUser() {
  const username = 'admin1';
  const password = 'changeme';
  const name = 'Admin User';
  
  // Create email format for Better Auth (requires email field)
  // Using @system.local format like the admin users route
  const email = `${username}@system.local`;
  
  console.log(`Creating user: ${username}`);
  console.log(`Email: ${email}`);
  
  try {
    // Use Better Auth HTTP API endpoint (same as admin users route)
    const baseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000';
    const signUpUrl = `${baseURL}/api/auth/sign-up/email`;
    
    console.log(`Calling: ${signUpUrl}`);
    
    const signUpResponse = await fetch(signUpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
      }),
    });
    
    let signUpData: any;
    try {
      signUpData = await signUpResponse.json();
    } catch (e) {
      const text = await signUpResponse.text();
      console.error('Failed to parse JSON response:', text);
      process.exit(1);
    }
    
    if (!signUpResponse.ok) {
      console.error('Error creating user:', signUpData);
      console.error('Status:', signUpResponse.status);
      process.exit(1);
    }
    
    // Get the Better Auth user ID
    const authUserId = signUpData.data?.user?.id || 
                       signUpData.user?.id || 
                       signUpData.data?.id ||
                       signUpData.id;
    
    console.log('User created successfully!');
    console.log('User ID:', authUserId);
    console.log('Email:', email);
    console.log('Name:', name);
    console.log('Full response:', JSON.stringify(signUpData, null, 2));
  } catch (error: any) {
    console.error('Failed to create user:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

createAdminUser();

