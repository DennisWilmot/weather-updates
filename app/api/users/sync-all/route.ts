import { NextRequest, NextResponse } from 'next/server';
import { syncAllUsers } from '@/scripts/sync-clerk-users';

export async function POST(request: NextRequest) {
  try {
    console.log('=== SYNC ALL USERS API CALL ===');
    console.log('CLERK_SECRET_KEY exists:', !!process.env.CLERK_SECRET_KEY);
    console.log('CLERK_SECRET_KEY length:', process.env.CLERK_SECRET_KEY?.length || 0);
    
    const result = await syncAllUsers();
    
    console.log('=== SYNC RESULT ===');
    console.log('Result:', JSON.stringify(result, null, 2));
    
    return NextResponse.json({
      success: true,
      ...result,
      debug: {
        clerkSecretKeyExists: !!process.env.CLERK_SECRET_KEY,
        clerkSecretKeyLength: process.env.CLERK_SECRET_KEY?.length || 0
      }
    });
  } catch (error) {
    console.error('=== SYNC ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : undefined);
    
    return NextResponse.json(
      { 
        error: 'Failed to sync users',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

