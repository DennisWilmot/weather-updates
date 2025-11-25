/**
 * Test script to debug get-session 500 error
 * Usage: tsx scripts/test-get-session.ts
 */

import 'dotenv/config';
import { createAuthInstance } from '../lib/auth';

async function testGetSession() {
  console.log('Testing get-session endpoint...\n');
  
  const BASE_URL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000';
  
  try {
    // Test 1: Get session without cookies (should return null, not 500)
    console.log('Test 1: GET /api/auth/get-session (no cookies)');
    const response1 = await fetch(`${BASE_URL}/api/auth/get-session`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`Status: ${response1.status}`);
    const text1 = await response1.text();
    console.log(`Response: ${text1.substring(0, 200)}`);
    
    if (response1.status === 500) {
      try {
        const errorData = JSON.parse(text1);
        console.log('Error details:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('Could not parse error response');
      }
    }
    
    // Test 2: Try to create a session first, then get it
    console.log('\nTest 2: Sign in, then get session');
    const testEmail = `test-session-${Date.now()}@system.local`;
    const testPassword = 'testpassword123';
    
    // Create user
    const signUpResponse = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Test Session User',
      }),
    });
    
    if (!signUpResponse.ok) {
      const signUpText = await signUpResponse.text();
      console.log('Sign up failed:', signUpText);
      return;
    }
    
    // Sign in
    const signInResponse = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    
    if (!signInResponse.ok) {
      const signInText = await signInResponse.text();
      console.log('Sign in failed:', signInText);
      return;
    }
    
    // Get cookies from sign-in response
    const cookies = signInResponse.headers.get('set-cookie');
    console.log('Cookies from sign-in:', cookies);
    
    // Now try to get session with cookies
    console.log('\nTest 3: GET /api/auth/get-session (with cookies)');
    const response2 = await fetch(`${BASE_URL}/api/auth/get-session`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || '',
      },
    });
    
    console.log(`Status: ${response2.status}`);
    const text2 = await response2.text();
    console.log(`Response: ${text2.substring(0, 300)}`);
    
    if (response2.status === 500) {
      try {
        const errorData = JSON.parse(text2);
        console.log('\nError details:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('Could not parse error response');
      }
    }
    
  } catch (error: any) {
    console.error('Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testGetSession().catch(console.error);




