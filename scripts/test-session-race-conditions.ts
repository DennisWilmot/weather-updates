/**
 * Test script to check for race conditions in session handling
 * Usage: tsx scripts/test-session-race-conditions.ts
 * 
 * This script tests:
 * 1. Concurrent session creation (multiple sign-ins)
 * 2. Concurrent session validation (multiple get-session calls)
 * 3. Session token uniqueness
 * 4. Database transaction isolation
 */

import 'dotenv/config';

const BASE_URL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000';
const CONCURRENT_REQUESTS = 20; // Number of concurrent requests to test

interface TestResult {
  success: boolean;
  error?: string;
  sessionId?: string;
  token?: string;
  timestamp: number;
}

async function signIn(email: string, password: string): Promise<TestResult> {
  const startTime = Date.now();
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
    const data = text ? JSON.parse(text) : {};

    if (response.ok && data.token) {
      return {
        success: true,
        sessionId: data.user?.id,
        token: data.token,
        timestamp: Date.now() - startTime,
      };
    } else {
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
        timestamp: Date.now() - startTime,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      timestamp: Date.now() - startTime,
    };
  }
}

async function getSession(cookie?: string): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (cookie) {
      headers['Cookie'] = cookie;
    }

    const response = await fetch(`${BASE_URL}/api/auth/get-session`, {
      method: 'GET',
      headers,
    });

    const text = await response.text();
    const data = text && text !== 'null' ? JSON.parse(text) : null;

    if (response.ok) {
      return {
        success: true,
        sessionId: data?.session?.id || data?.user?.id,
        token: data?.session?.token,
        timestamp: Date.now() - startTime,
      };
    } else {
      return {
        success: false,
        error: `HTTP ${response.status}`,
        timestamp: Date.now() - startTime,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      timestamp: Date.now() - startTime,
    };
  }
}

async function testConcurrentSignIns() {
  console.log('\n=== Test 1: Concurrent Sign-Ins ===');
  console.log(`Testing ${CONCURRENT_REQUESTS} concurrent sign-in requests...`);

  const testEmail = `race-test-${Date.now()}@system.local`;
  const testPassword = 'testpassword123';

  // First, create the user
  console.log('Creating test user...');
  const signUpResponse = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      name: 'Race Test User',
    }),
  });

  if (!signUpResponse.ok) {
    console.error('Failed to create test user');
    return;
  }

  // Now test concurrent sign-ins
  const promises = Array.from({ length: CONCURRENT_REQUESTS }, () =>
    signIn(testEmail, testPassword)
  );

  const results = await Promise.all(promises);

  // Analyze results
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const tokens = successful.map(r => r.token).filter(Boolean);
  const uniqueTokens = new Set(tokens);

  console.log(`\nResults:`);
  console.log(`  Total requests: ${results.length}`);
  console.log(`  Successful: ${successful.length}`);
  console.log(`  Failed: ${failed.length}`);
  console.log(`  Unique tokens: ${uniqueTokens.size}`);
  console.log(`  Duplicate tokens: ${tokens.length - uniqueTokens.size}`);

  if (failed.length > 0) {
    console.log(`\nFailed requests:`);
    failed.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.error}`);
    });
  }

  // Check for race conditions
  const issues: string[] = [];
  
  if (uniqueTokens.size !== tokens.length) {
    issues.push(`⚠️  RACE CONDITION DETECTED: Duplicate session tokens created!`);
    console.log(`\n⚠️  Duplicate tokens found:`);
    const tokenCounts = new Map<string, number>();
    tokens.forEach(t => tokenCounts.set(t!, (tokenCounts.get(t!) || 0) + 1));
    tokenCounts.forEach((count, token) => {
      if (count > 1) {
        console.log(`    Token ${token.substring(0, 20)}... appears ${count} times`);
      }
    });
  }

  if (successful.length < CONCURRENT_REQUESTS * 0.9) {
    issues.push(`⚠️  High failure rate: ${failed.length}/${CONCURRENT_REQUESTS} requests failed`);
  }

  const avgTime = results.reduce((sum, r) => sum + r.timestamp, 0) / results.length;
  const maxTime = Math.max(...results.map(r => r.timestamp));
  console.log(`\nPerformance:`);
  console.log(`  Average response time: ${avgTime.toFixed(2)}ms`);
  console.log(`  Max response time: ${maxTime}ms`);

  if (issues.length === 0) {
    console.log('\n✅ No race conditions detected in concurrent sign-ins');
  } else {
    console.log('\n❌ Potential issues found:');
    issues.forEach(issue => console.log(`  ${issue}`));
  }

  return { tokens: Array.from(uniqueTokens), testEmail };
}

async function testConcurrentGetSession(tokens: string[]) {
  console.log('\n=== Test 2: Concurrent Get-Session Calls ===');
  console.log(`Testing ${CONCURRENT_REQUESTS} concurrent get-session requests...`);

  if (tokens.length === 0) {
    console.log('⚠️  Skipping test - no valid tokens available');
    return;
  }

  // Use the first token for all requests (simulating same user)
  const testToken = tokens[0];
  const cookie = `better-auth.session_token=${testToken}`;

  const promises = Array.from({ length: CONCURRENT_REQUESTS }, () =>
    getSession(cookie)
  );

  const results = await Promise.all(promises);

  // Analyze results
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const sessionIds = successful.map(r => r.sessionId).filter(Boolean);
  const uniqueSessionIds = new Set(sessionIds);

  console.log(`\nResults:`);
  console.log(`  Total requests: ${results.length}`);
  console.log(`  Successful: ${successful.length}`);
  console.log(`  Failed: ${failed.length}`);
  console.log(`  Unique session IDs: ${uniqueSessionIds.size}`);

  if (failed.length > 0) {
    console.log(`\nFailed requests:`);
    failed.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.error}`);
    });
  }

  // Check for race conditions
  const issues: string[] = [];

  if (uniqueSessionIds.size > 1) {
    issues.push(`⚠️  RACE CONDITION DETECTED: Multiple session IDs returned for same token!`);
    console.log(`\n⚠️  Multiple session IDs found:`);
    uniqueSessionIds.forEach(id => {
      const count = sessionIds.filter(sid => sid === id).length;
      console.log(`    Session ${id} returned ${count} times`);
    });
  }

  if (successful.length < CONCURRENT_REQUESTS * 0.9) {
    issues.push(`⚠️  High failure rate: ${failed.length}/${CONCURRENT_REQUESTS} requests failed`);
  }

  const avgTime = results.reduce((sum, r) => sum + r.timestamp, 0) / results.length;
  const maxTime = Math.max(...results.map(r => r.timestamp));
  console.log(`\nPerformance:`);
  console.log(`  Average response time: ${avgTime.toFixed(2)}ms`);
  console.log(`  Max response time: ${maxTime}ms`);

  if (issues.length === 0) {
    console.log('\n✅ No race conditions detected in concurrent get-session calls');
  } else {
    console.log('\n❌ Potential issues found:');
    issues.forEach(issue => console.log(`  ${issue}`));
  }
}

async function testSessionTokenUniqueness() {
  console.log('\n=== Test 3: Session Token Uniqueness ===');
  console.log('Testing that each sign-in creates a unique token...');

  const testEmail = `uniqueness-test-${Date.now()}@system.local`;
  const testPassword = 'testpassword123';

  // Create user
  await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      name: 'Uniqueness Test User',
    }),
  });

  // Sign in multiple times sequentially
  const tokens: string[] = [];
  for (let i = 0; i < 10; i++) {
    const result = await signIn(testEmail, testPassword);
    if (result.success && result.token) {
      tokens.push(result.token);
    }
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  const uniqueTokens = new Set(tokens);
  console.log(`\nResults:`);
  console.log(`  Total sign-ins: ${tokens.length}`);
  console.log(`  Unique tokens: ${uniqueTokens.size}`);

  if (tokens.length === uniqueTokens.size) {
    console.log('✅ All tokens are unique');
  } else {
    console.log('❌ Duplicate tokens found!');
    const tokenCounts = new Map<string, number>();
    tokens.forEach(t => tokenCounts.set(t, (tokenCounts.get(t) || 0) + 1));
    tokenCounts.forEach((count, token) => {
      if (count > 1) {
        console.log(`  Token ${token.substring(0, 30)}... appears ${count} times`);
      }
    });
  }
}

async function testDatabaseConnectionPooling() {
  console.log('\n=== Test 4: Database Connection Pooling ===');
  console.log('Testing if database connection pool handles concurrent requests...');

  // Make many concurrent requests to get-session (no auth needed)
  const promises = Array.from({ length: 50 }, () => getSession());
  const startTime = Date.now();
  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\nResults:`);
  console.log(`  Total requests: ${results.length}`);
  console.log(`  Successful: ${successful.length}`);
  console.log(`  Failed: ${failed.length}`);
  console.log(`  Total time: ${totalTime}ms`);
  console.log(`  Requests per second: ${(results.length / (totalTime / 1000)).toFixed(2)}`);

  const avgTime = results.reduce((sum, r) => sum + r.timestamp, 0) / results.length;
  console.log(`  Average response time: ${avgTime.toFixed(2)}ms`);

  if (failed.length === 0) {
    console.log('✅ Database connection pool handles concurrent requests well');
  } else {
    console.log(`⚠️  ${failed.length} requests failed - possible connection pool exhaustion`);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Session Race Condition Tests');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Concurrent requests per test: ${CONCURRENT_REQUESTS}`);

  try {
    // Test 1: Concurrent sign-ins
    const signInResult = await testConcurrentSignIns();
    
    // Test 2: Concurrent get-session (if we have tokens)
    if (signInResult?.tokens && signInResult.tokens.length > 0) {
      await testConcurrentGetSession(signInResult.tokens as string[]);
    }

    // Test 3: Token uniqueness
    await testSessionTokenUniqueness();

    // Test 4: Database connection pooling
    await testDatabaseConnectionPooling();

    console.log('\n=== All Tests Complete ===');
  } catch (error: any) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error(error.stack);
  }
}

runAllTests().catch(console.error);




