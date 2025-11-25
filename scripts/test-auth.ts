/**
 * Test script for Better Auth endpoints
 * Usage: tsx scripts/test-auth.ts
 */

import 'dotenv/config';
import { cookies } from 'next/headers';

const BASE_URL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000';

async function testGetSession() {
  console.log('\n=== Testing GET /api/auth/get-session ===');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/get-session`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const text = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${text}`);
    
    if (response.ok) {
      console.log('✅ get-session endpoint works!');
      try {
        const data = JSON.parse(text);
        console.log('Session data:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('Response is not JSON (expected if no session)');
      }
    } else {
      console.log('❌ get-session endpoint returned error');
      return false;
    }
    return true;
  } catch (error: any) {
    console.error('❌ Error testing get-session:', error.message);
    return false;
  }
}

async function testSignUp() {
  console.log('\n=== Testing POST /api/auth/sign-up/email ===');
  try {
    const testEmail = `test-${Date.now()}@system.local`;
    const response = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'testpassword123',
        name: 'Test User',
      }),
    });
    
    const text = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${text}`);
    
    if (response.ok) {
      console.log('✅ sign-up endpoint works!');
      try {
        const data = JSON.parse(text);
        return { success: true, data, email: testEmail };
      } catch (e) {
        console.log('Response is not JSON');
        return { success: false };
      }
    } else {
      console.log('❌ sign-up endpoint returned error');
      return { success: false };
    }
  } catch (error: any) {
    console.error('❌ Error testing sign-up:', error.message);
    return { success: false };
  }
}

async function testSignIn(email: string, password: string) {
  console.log('\n=== Testing POST /api/auth/sign-in/email ===');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
    
    const text = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${text.substring(0, 200)}...`);
    
    if (response.ok) {
      console.log('✅ sign-in endpoint works!');
      // Extract cookies from response
      const cookies = response.headers.get('set-cookie');
      return { success: true, cookies };
    } else {
      console.log('❌ sign-in endpoint returned error');
      return { success: false, cookies: "" };
    }
  } catch (error: any) {
    console.error('❌ Error testing sign-in:', error.message);
    return { success: false, cookies: "" };
  }
}

async function testGetSessionWithCookie(cookie: string) {
  console.log('\n=== Testing GET /api/auth/get-session with cookie ===');
  try {
    const response = await fetch(`${BASE_URL}/api/auth/get-session`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookie,
      },
    });
    
    const text = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${text.substring(0, 300)}...`);
    
    if (response.ok) {
      console.log('✅ get-session with cookie works!');
      try {
        const data = JSON.parse(text);
        console.log('Session data:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('Response is not JSON');
      }
      return true;
    } else {
      console.log('❌ get-session with cookie returned error');
      return false;
    }
  } catch (error: any) {
    console.error('❌ Error testing get-session with cookie:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Better Auth API Tests');
  console.log(`Base URL: ${BASE_URL}`);
  
  // Test 1: Get session (no auth)
  const test1 = await testGetSession();
  
  // Test 2: Sign up
  const signUpResult = await testSignUp();
  
  // Test 3: Sign in (if sign up worked)
  let signInResult = { success: false, cookies: "" } as { success: boolean, cookies: string | null};
  if (signUpResult.success && signUpResult.email) {
    signInResult = await testSignIn(signUpResult.email, 'testpassword123');
  }
  
  // Test 4: Get session with cookie (if sign in worked)
  if (signInResult.success && signInResult.cookies) {
    // Extract the session cookie
    const sessionCookie = signInResult.cookies.split(';')[0];
    await testGetSessionWithCookie(sessionCookie);
  }
  
  console.log('\n=== Test Summary ===');
  console.log(`get-session (no auth): ${test1 ? '✅' : '❌'}`);
  console.log(`sign-up: ${signUpResult.success ? '✅' : '❌'}`);
  console.log(`sign-in: ${signInResult.success ? '✅' : '❌'}`);
  
  if (!test1) {
    console.log('\n⚠️  WARNING: get-session endpoint is failing!');
    console.log('This is the endpoint that was reported as broken.');
    console.log('Check the server logs for detailed error information.');
  }
}

runTests().catch(console.error);




