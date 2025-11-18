/**
 * Script to inspect how Better Auth makes requests
 * This helps debug the 500 error on get-session
 */

import 'dotenv/config';

// Simulate what Better Auth's useSession hook does
async function inspectBetterAuthRequest() {
  const baseURL = typeof window !== 'undefined' 
    ? window.location.origin 
    : (process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000');
  
  console.log('Better Auth Client Configuration:');
  console.log('  baseURL:', baseURL);
  console.log('  get-session URL:', `${baseURL}/api/auth/get-session`);
  console.log('');
  
  // Simulate the request Better Auth makes
  console.log('Simulating Better Auth useSession request...');
  console.log('  Method: GET');
  console.log('  URL: /api/auth/get-session');
  console.log('  Headers:');
  console.log('    - Content-Type: application/json');
  console.log('    - Cookie: (sent automatically by browser)');
  console.log('');
  
  // Make the actual request
  try {
    const response = await fetch(`${baseURL}/api/auth/get-session`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: include cookies
    });
    
    console.log('Response:');
    console.log('  Status:', response.status);
    console.log('  Status Text:', response.statusText);
    console.log('  Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('  Body:', text.substring(0, 500));
    
    if (response.status === 500) {
      try {
        const errorData = JSON.parse(text);
        console.log('\nError Details:');
        console.log(JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('\nCould not parse error as JSON');
      }
    }
  } catch (error: any) {
    console.error('Request failed:', error.message);
  }
}

inspectBetterAuthRequest().catch(console.error);



